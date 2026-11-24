// Chặng 9 — Troubleshooting tổng hợp (lỗi ẩn do ./labs/lab break, có bấm giờ).
// s46–s51 đã phát hành (đợt 5): sáu buổi sự cố, mỗi buổi một lỗi st9-* của labs/cka/breaks.

export const sessions = [
  {
    id: "s46",
    stage: "st9",
    title: "Quy trình chẩn đoán theo tầng và sự cố tầng ứng dụng",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s45"],
    status: "published",
    pieces: [],
    goals: [
      "Viết vào sổ tay ~/notes/runbook.md quy trình chẩn đoán bốn tầng của riêng mình và dùng nó cho ba sự cố tầng ứng dụng trong 20 phút.",
      "Lọc nhanh Pod không Ready trên toàn cluster bằng jsonpath, custom-columns, --sort-by, và biết vì sao --field-selector không bắt được CrashLoopBackOff.",
      "Đọc nguyên nhân từ đúng chỗ (logs --previous, Events, describe), ghi đáp án đúng định dạng vào tệp, rồi sửa đối tượng cha thay vì xoá Pod.",
    ],
    skills: [
      { skill: "k-diagnosis-layers", level: "Thuộc thứ tự" },
      { skill: "k-jsonpath", level: "Gõ được có tra" },
      { skill: "k-sort-by", level: "Gõ được không tra" },
      { skill: "k-field-selector", level: "Gõ được có tra" },
      { skill: "k-logs-selector", level: "Gõ được không tra" },
    ],
    uses: ["k-logs-previous", "k-events-all", "k-pod-failure-reasons", "k-describe-pod", "k-logs-all-containers"],
    foundation: {
      area: "linux",
      md: `**Đọc log như đọc một stack trace Java.** Log của một service Spring Boot chết lúc khởi động dài vài trăm dòng, phần lớn là khung \`at …\` của stack trace. Dòng bạn cần thường chỉ có hai: dòng exception **đầu tiên** (cái gì hỏng) và dòng \`Caused by\` **cuối cùng** (vì sao). Ở giữa là đường đi của lời gọi, hữu ích cho người viết code, không cho người vận hành.

**1. Cắt bớt bằng grep.** \`grep -E\` nhận nhiều mẫu một lúc; \`-v\` bỏ dòng khớp; \`-m1\` dừng sau dòng khớp đầu tiên; \`-n\` in số dòng:

\`\`\`bash
k -n shop logs <pod> --previous | grep -vE '^\\s+at |common frames omitted'   # bỏ khung stack, giữ phần có nghĩa
k -n shop logs <pod> --previous | grep -E -m1 'Exception|Error'              # exception đầu tiên
k -n shop logs <pod> --previous | grep 'Caused by' | tail -n1                 # nguyên nhân gốc
\`\`\`

**2. Giới hạn theo thời gian và số dòng.** \`tail -n 20\` (20 dòng cuối), \`k logs --tail=20\` (kubelet chỉ gửi 20 dòng cuối, nhanh hơn khi log lớn), \`k logs --since=10m\` (chỉ 10 phút gần nhất), \`journalctl -u kubelet --since -10min\` (cùng ý cho log systemd trên node).

**3. Stack trace của bài này** (đo, \`k logs --previous\` của Pod catalog hỏng):

\`\`\`text
16:32:03.972 [main] ERROR org.springframework.boot.SpringApplication -- Application run failed
java.lang.IllegalStateException: Unable to load config data from 'configserver:http://config-4c18.shop:8888'
	at org.springframework.boot.context.config.…   (vài chục khung at …)
Caused by: java.lang.IllegalStateException: Incorrect ConfigDataLocationResolver chosen or file extension is not known to any PropertySourceLoader. …
	... 37 common frames omitted
\`\`\`

Dòng thứ hai nói chỗ hỏng (nạp config từ \`configserver:…\`), dòng \`Caused by\` nói vì sao (không có bộ đọc nào cho tiền tố đó: image không có Spring Cloud Config). Cùng một kỹ năng bạn dùng khi đọc log ứng dụng Java trên máy dev; khác ở chỗ trong Kubernetes container đã chết, nên phải xin log của **lần chạy trước**.

**Bài tập nền (5 phút, trên cka-cp trước khi \`begin\`):** \`k -n kube-system logs -l k8s-app=kube-dns --tail=5 --prefix\`, rồi \`sudo journalctl -u kubelet --since -5min | grep -E -m3 'error|Error'\`. Với mỗi lệnh, nói thành tiếng lệnh lọc theo thời gian hay theo số dòng.`,
    },
    mindset: `**Bốn tầng, đi từ trên xuống, dừng ở tầng đầu tiên tự nó hỏng.** Mọi sự cố trong đề CKA (và trên một cluster thật) rơi vào một trong bốn tầng, mỗi tầng có chỗ để nhìn riêng:

| Tầng | Câu hỏi | Nhìn ở đâu |
|---|---|---|
| Ứng dụng và Pod | Pod có chạy, có Ready, có restart lặp? | \`k get pod -A\`, \`k logs --previous\`, Events, \`k describe pod\` |
| Service và DNS | Tên có ra IP, IP có tới Pod? | EndpointSlice, \`nslookup\`, CoreDNS, kube-proxy, NetworkPolicy (s47) |
| Node và kubelet | Node có Ready, kubelet và runtime có chạy? | \`k get node\`, \`systemctl\`, \`journalctl\`, \`crictl\` (s48) |
| Control plane | apiserver, scheduler, controller-manager, etcd có làm việc? | \`/readyz\`, static pod, \`crictl logs\`, \`/var/log/pods\` (s45, s49, s50) |

Buổi này viết bảng đó vào **sổ tay** \`~/notes/runbook.md\` (mốc project của cả chặng 9: mỗi buổi sau thêm một mục), rồi luyện tầng trên cùng. Giống đọc log Spring theo tầng: lỗi ở controller có thể chỉ là hệ quả của một bean không lên, và bean không lên có thể chỉ vì một property sai; sửa ở tầng thấp nhất tự nó hỏng.

**\`STATUS\` không phải \`phase\`.** \`k get pod\` in cột STATUS ghép từ nhiều trường (lý do chờ của container, phase, deletionTimestamp). \`--field-selector\` chỉ lọc được vài trường thật của object, trong đó có \`status.phase\`. Một Pod **CrashLoopBackOff** vẫn có \`phase: Running\` (container từng chạy, kubelet đang chờ để chạy lại): đo trên lab, \`k get pod -A --field-selector=status.phase!=Running\` trong sự cố chỉ thấy \`order-…\` \`ErrImagePull\` (phase \`Pending\`) và các Pod \`Completed\` của CronJob, **không thấy** catalog CrashLoopBackOff lẫn gateway đang restart lặp. Câu hỏi đúng là "Pod nào không Ready", và đó là một **condition**, không lọc được bằng field selector: phải in ra rồi lọc.

\`\`\`bash
k get pod -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name} {.status.conditions[?(@.type=="Ready")].status}{"\\n"}{end}' | awk '$2 != "True" {print $1}'
k get pod -A --sort-by='.status.containerStatuses[0].restartCount'          # restart nhiều nhất ở cuối
k get pod -A -o custom-columns='NS:.metadata.namespace,POD:.metadata.name,RESTARTS:.status.containerStatuses[0].restartCount,WAIT:.status.containerStatuses[0].state.waiting.reason'
\`\`\`

**Ba lỗi, ba chỗ để đọc.** Mỗi kiểu hỏng để dấu ở một nơi khác: **CrashLoopBackOff** để dấu trong log của container đã chết (\`k logs --previous\`); **ImagePullBackOff** để dấu trong Events (container chưa từng chạy, log rỗng); **liveness lỗi** để dấu trong Events \`Unhealthy\` và \`Killing\`, còn log của container bị giết sạch sẽ (đo: chỉ \`Commencing graceful shutdown\`, mã thoát 143 = SIGTERM). Lỗi thứ hai là **lỗi ẩn**: rollout của order kẹt nhưng hai Pod cũ vẫn phục vụ, shop vẫn trả 200; chỉ \`k rollout status\` hay cột READY của ReplicaSet mới cho thấy.

**Sửa đối tượng cha, và biết ai sở hữu trường nào.** Xoá Pod hỏng thì ReplicaSet tạo Pod mới **y hệt** (cùng template). Chỗ sửa là Deployment, và vì shop là một release Helm, cái đúng là "Deployment khớp \`helm get manifest shop\`". Đo trên Helm v4.3.2 (release cài bằng server-side apply): \`helm upgrade --reuse-values\` và \`helm rollback\` đều **từ chối** vì trường bị \`kubectl\` sửa giờ thuộc field manager khác (\`conflict with "kubectl-set" … .image\`, \`conflict with "kubectl-patch" … livenessProbe.httpGet.path\`), và release thành \`failed\`; thêm \`--force-conflicts\` thì Helm lấy lại image và probe, **nhưng biến env do \`kubectl set env\` thêm vẫn còn**: Helm chưa từng sở hữu trường đó nên không gỡ. Cách sạch: gỡ thứ Helm không biết bằng \`kubectl\`, rồi để Helm áp lại phần của nó.`,
    refs: [
      { label: "Bài lộ trình CKA: Debug application — CrashLoopBackOff, ImagePullBackOff…", href: "#/roadmap/cka/cka-w8-5" },
      { label: "Bài lộ trình CKA: kubectl get events, kubectl top", href: "#/roadmap/cka/cka-w8-7" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "Effective Java, chương 10 — Exceptions (chuỗi nguyên nhân, detail message)", href: "#/docs/ej-10" },
      { label: "kubernetes.io: Debug Running Pods", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/" },
      { label: "kubernetes.io: Determine the Reason for Pod Failure", href: "https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/" },
      { label: "kubernetes.io: JSONPath Support", href: "https://kubernetes.io/docs/reference/kubectl/jsonpath/" },
      { label: "kubernetes.io: Field Selectors", href: "https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/" },
      { label: "kubernetes.io: Server-Side Apply — conflicts và field management", href: "https://kubernetes.io/docs/reference/using-api/server-side-apply/#conflicts" },
    ],
    stateIn: "Đầu ra s45 (cluster 1.37.2, etcd từ /var/lib/etcd-restore, release shop 0.2.0 deployed, mọi service trải hai worker). Trên Mac chạy `./labs/lab begin cka s46`: kiểm đầu vào bằng check.sh riêng (gói 1.37 và hold, node, control plane, dữ liệu, đáp án s45: những gì sự cố không đụng), xoá answers.env và not-ready.txt cũ rồi **gây sự cố** (đo 11–14 giây; chạy lại `begin` giữa buổi thì trước hết đưa ba Deployment về đúng release, chờ rollout, rồi gây lại, đo 23 giây): \"sáng nay ba người cùng sửa shop bằng kubectl\". Bấm giờ 20 phút.",
    stateOut: "shop chạy đủ: gateway, gateway-v1, catalog, order rollout xong, mỗi service ≥ 2 Pod Ready trải hai worker, container và Service khớp `helm get manifest shop`, release deployed; ~/notes/runbook.md có bốn mục ## (ứng dụng/Pod, Service/DNS, node/kubelet, control plane) mỗi mục ≥ 3 dòng; ~/drills/s46/not-ready.txt và answers.env (CATALOG_CAUSE, ORDER_REASON, GATEWAY_PROBE).",
    tasks: [
      {
        id: "t1",
        text: "Trước khi `begin`: tạo `~/notes/runbook.md` với bốn mục `##`, mỗi tầng một mục (ứng dụng/Pod, Service/DNS, node/kubelet, control plane/apiserver), mỗi mục ít nhất ba dòng: câu hỏi của tầng, lệnh đầu tiên bạn gõ, chỗ đọc nguyên nhân. Viết bằng lời của bạn; đây là thứ bạn sẽ mở ra ở năm buổi sau và trong hai đề mock.",
      },
      {
        id: "t2",
        text: "`./labs/lab begin cka s46`. Bấm giờ 20 phút. Trên cka-cp: `k get pod -A --field-selector=status.phase!=Running`. Pod nào hiện, Pod nào lẽ ra phải hiện mà không (so với `k get pod -A | grep -v Running`, và cột RESTARTS)? Vì sao?",
      },
      {
        id: "t3",
        text: "Liệt kê mọi Pod **không Ready** của toàn cluster, mỗi dòng `<ns>/<pod>`, vào `~/drills/s46/not-ready.txt` **trước khi sửa gì**. Dùng jsonpath (`{range .items[*]}…{.status.conditions[?(@.type==\"Ready\")].status}…{end}`) hay custom-columns, lọc bằng awk. Rồi `k get pod -A --sort-by='.status.containerStatuses[0].restartCount' | tail -5`: Pod nào restart nhiều?",
      },
      {
        id: "t4",
        text: "catalog: `k -n shop logs <Pod hỏng> --previous | grep -vE '^\\s+at '`, rồi `k -n shop logs -l app=catalog --all-containers --prefix --tail=3`. Ghi **một dòng log** nêu nguyên nhân (dòng exception, có giá trị gây lỗi) vào `CATALOG_CAUSE=` trong `~/drills/s46/answers.env`. Giá trị lạ đó đến từ đâu (`k -n shop get deploy catalog -o yaml | grep -A1 SPRING`)?",
      },
      {
        id: "t5",
        text: "order: `k -n shop rollout status deploy/order --timeout=10s`, `k -n shop get rs -l app=order`, `k get events -A --sort-by=.lastTimestamp | grep order | tail -3`. shop có còn trả lời không (từ Mac `curl http://<IP cka-w1>:30180/api/orders`)? Ghi `ORDER_REASON=` (lý do chờ của container trong Pod mới).",
      },
      {
        id: "t6",
        text: "gateway: RESTARTS tăng mà log không có lỗi. `k -n shop describe pod <gateway>` (Last State, Exit Code, ba dòng Liveness/Readiness/Startup), `k -n shop get events --field-selector reason=Unhealthy`. Probe nào sai, sai chỗ nào? Ghi `GATEWAY_PROBE=`.",
      },
      {
        id: "t7",
        text: "Tình huống hỏng: `k -n shop delete pod <Pod catalog CrashLoopBackOff>`. Pod mới ra sao sau 30 giây? Rồi sửa đúng chỗ: so `helm get manifest shop` với cluster, thử `helm -n shop upgrade shop ~/charts/shop --reuse-values` và đọc lỗi; gỡ biến thừa bằng `kubectl set env … SPRING_CONFIG_IMPORT-`, rồi đưa release về đúng (helm rollback hay upgrade có `--force-conflicts`, hay `kubectl rollout undo` từng Deployment). `helm -n shop list` phải `deployed`. Trên Mac: `./labs/lab verify cka s46` phải 4/4. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "`--field-selector` chỉ lọc trường thật của object (`status.phase`, `spec.nodeName`, `metadata.name`…), không lọc được condition Ready hay lý do chờ của container. CrashLoopBackOff là phase `Running`.",
      "`k logs` của một Pod đang chờ back-off in log của lần chạy vừa chết; nhưng trong vài giây container mới đang khởi động, nó in log mới (gần như trống). `--previous` luôn là lần chạy trước: dùng nó là chắc.",
      "Dòng cần ghi cho catalog là dòng `java.lang.IllegalStateException: Unable to load config data from '…'` (đo), có đúng giá trị `configserver:http://config-…` của lần `begin` này. Dòng env trong YAML của Deployment không phải dòng log.",
      "`Failed to pull image \"shop/order:2.1\"` (Events, đo): tag không có trong containerd của node, kubelet thử kéo từ docker.io và thất bại. Lý do chờ đổi giữa `ErrImagePull` (vừa thử) và `ImagePullBackOff` (đang chờ thử lại); cả hai đều đúng.",
      "`Liveness probe failed: HTTP probe failed with statuscode: 404` và `Container gateway failed liveness probe, will be restarted` (Events, đo). `describe` in đường dẫn của từng probe: so ba dòng với nhau.",
      "`helm upgrade` báo `conflict with \"kubectl-set\" using apps/v1: .spec.template.spec.containers[name=\"order\"].image` (đo): server-side apply không ghi đè trường đang thuộc field manager khác. Đọc lỗi rồi quyết định: `--force-conflicts` lấy lại quyền, hoặc sửa bằng kubectl trước.",
      "Verify dòng lõi đỏ `release shop failed`: một lần helm lỗi để lại revision `failed`. Một lần `helm rollback`/`upgrade` thành công sau khi đã gỡ xung đột đưa nó về `deployed`.",
      "Dòng not-ready đỏ `… đang Ready lúc sự cố`: bạn liệt kê cả Pod đang Ready (ví dụ mọi Pod của shop). Dòng đỏ `thiếu shop/catalog-…`: bạn ghi tệp sau khi đã sửa, hay lọc sót CrashLoopBackOff.",
    ],
    solution: `Output là của máy soạn bài (2026-11-24, Kubernetes 1.37.2, Helm v4.3.2, sau \`restore cka s45\` rồi \`begin cka s46\`); tên Pod, giá trị \`config-…\`, revision của bạn sẽ khác. Mọi lệnh chạy trên cka-cp.

**1. Toàn cảnh, và giới hạn của field selector**

\`\`\`bash
k get pod -A --field-selector=status.phase!=Running
# NAMESPACE   NAME                          READY   STATUS             RESTARTS        AGE
# shop        order-7c489f6dd5-f6gqw        0/1     ImagePullBackOff   0               2m35s
# shop        order-report-29925640-5gqh9   0/1     Completed          1 (6m39s ago)   8m53s
# shop        order-report-29925645-gqm7f   0/1     Completed          0               4m11s
k -n shop get pod -l 'app in (gateway,catalog,order)'
# catalog-6d4447d898-9wgjh   1/1     Running            2 (8m37s ago)   64m
# catalog-6d4447d898-hv4kt   1/1     Running            3 (9m45s ago)   74m
# catalog-cc68cfb4f-bpxlt    0/1     CrashLoopBackOff   6 (66s ago)     6m55s
# gateway-688654f4fd-fwkll   1/1     Running            6 (102s ago)    6m44s
# gateway-688654f4fd-vg9z2   1/1     Running            6 (114s ago)    6m55s
# order-74dc7bc798-2hmsc     1/1     Running            1 (9m45s ago)   63m
# order-74dc7bc798-xcql2     1/1     Running            1 (9m45s ago)   63m
# order-7c489f6dd5-q5nm6     0/1     ImagePullBackOff   0               6m55s
\`\`\`

Field selector bỏ sót catalog (CrashLoopBackOff, phase Running) và gateway (restart 6 lần trong 7 phút, lúc nhìn đang Running). Hai Pod catalog cũ và hai Pod order cũ vẫn Ready: rollout của catalog và order kẹt ở Pod mới đầu tiên (\`maxUnavailable\` 0), shop vẫn trả lời (từ Mac \`/api/products\` 200 sáu lần liền, đo).

**2. not-ready.txt trước khi sửa**

\`\`\`bash
mkdir -p ~/drills/s46
k get pod -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name} {.status.conditions[?(@.type=="Ready")].status}{"\\n"}{end}' |
  awk '$2 != "True" {print $1}' | tee ~/drills/s46/not-ready.txt
# shop/catalog-59845997b5-kpc98
# shop/gateway-688654f4fd-4f45g
# shop/order-7c489f6dd5-ctbbd
# shop/order-report-29925640-5gqh9
# shop/order-report-29925645-gqm7f
\`\`\`

Pod \`Completed\` của Job cũng không Ready (đúng: chúng không phục vụ gì), gateway lúc Ready lúc không tuỳ thời điểm. Verify đòi đủ Pod hỏng của catalog và order mà sự cố ghi lại (Pod khác cùng ReplicaSet hỏng cũng được: xoá Pod thì tên đổi), và không có Pod nào **vẫn đang Ready**.

**3. catalog: log của lần chạy trước**

\`\`\`bash
k -n shop logs catalog-cc68cfb4f-bpxlt --previous | grep -vE '^\\s+at ' | head -4
# 16:32:03.972 [main] ERROR org.springframework.boot.SpringApplication -- Application run failed
# java.lang.IllegalStateException: Unable to load config data from 'configserver:http://config-4c18.shop:8888'
# Caused by: java.lang.IllegalStateException: Incorrect ConfigDataLocationResolver chosen or file extension is not known to any PropertySourceLoader. …
# 	... 37 common frames omitted
k -n shop logs -l app=catalog --all-containers --prefix --tail=2 | cut -c1-120
# [pod/catalog-6d4447d898-9wgjh/catalog] … o.s.web.servlet.DispatcherServlet : Completed initialization in 1 ms
# [pod/catalog-bf5fd67d8-5ffp4/catalog] 	at org.springframework.boot.context.config.StandardConfigDataLocationResolver.getReferences(…)
# [pod/catalog-bf5fd67d8-5ffp4/catalog] 	... 37 common frames omitted
k -n shop get deploy catalog -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name} {end}{"\\n"}'
# JAVA_OPTS DB_URL DB_USER DB_PASSWORD SPRING_CONFIG_IMPORT
\`\`\`

Spring Boot coi biến môi trường \`SPRING_CONFIG_IMPORT\` là property \`spring.config.import\`, và tiền tố \`configserver:\` cần Spring Cloud Config, thứ image không có: app dừng sau 4 giây (đo, Pod thử ở namespace tạm). \`--prefix\` cho biết dòng nào của Pod nào; gom log theo nhãn thấy ngay hai Pod cũ khoẻ, một Pod mới chết.

**4. order: Events, không phải log**

\`\`\`bash
k get events -A --sort-by=.lastTimestamp --field-selector type=Warning | grep order | tail -2
# shop  8s  Warning  Failed  pod/order-7c489f6dd5-ctbbd  Failed to pull image "shop/order:2.1": failed to pull and unpack image "docker.io/shop/order:2.1": …
# shop  7s  Warning  Failed  pod/order-7c489f6dd5-ctbbd  Error: ImagePullBackOff
k -n shop rollout status deploy/order --timeout=5s
# Waiting for deployment "order" rollout to finish: 1 out of 2 new replicas have been updated...
# error: timed out waiting for the condition
\`\`\`

**5. gateway: restart mà log sạch**

\`\`\`bash
k -n shop describe pod gateway-688654f4fd-fwkll | grep -E 'Exit Code|Liveness|Readiness|Startup|Unhealthy|Killing'
#       Exit Code:    143
#     Liveness:   http-get http://:8080/actuator/health/live delay=0s timeout=3s period=10s successThreshold=1 failureThreshold=3
#     Readiness:  http-get http://:8080/actuator/health/readiness delay=0s timeout=3s period=5s successThreshold=1 failureThreshold=3
#     Startup:    http-get http://:8080/actuator/health/liveness delay=0s timeout=1s period=5s successThreshold=1 failureThreshold=30
#   Warning  Unhealthy  15s (x9 over 2m15s)  kubelet  spec.containers{gateway}: Liveness probe failed: HTTP probe failed with statuscode: 404
#   Normal   Killing    15s (x3 over 115s)   kubelet  spec.containers{gateway}: Container gateway failed liveness probe, will be restarted
k -n shop logs gateway-688654f4fd-fwkll --previous | tail -2 | cut -c1-110
# … o.s.boot.tomcat.GracefulShutdown : Commencing graceful shutdown. Waiting for active requests to complete
# … o.s.boot.tomcat.GracefulShutdown : Graceful shutdown complete
\`\`\`

Startup và readiness đúng nên rollout của gateway **đi hết** (khác catalog, order), rồi kubelet giết container sau ba lần liveness 404 (~30 giây): 143 là 128 + 15 (SIGTERM), app tắt êm, log không có lỗi nào.

\`\`\`bash
cat > ~/drills/s46/answers.env <<'EOF'
CATALOG_CAUSE=java.lang.IllegalStateException: Unable to load config data from 'configserver:http://config-4c18.shop:8888'
ORDER_REASON=ImagePullBackOff
GATEWAY_PROBE=liveness
EOF
\`\`\`

**6. Tình huống hỏng: xoá Pod**

\`\`\`bash
k -n shop delete pod catalog-8db5b698d-jmbmg
k -n shop get pod -l app=catalog        # Pod mới catalog-8db5b698d-lph44: 0/1, lại CrashLoopBackOff
\`\`\`

ReplicaSet \`catalog-8db5b698d\` tạo Pod mới từ cùng template, hỏng y hệt. Verify lúc đó vẫn đỏ ở dòng lõi: \`lệch helm get manifest: gateway.livenessProbe, catalog.env, order.image\`.

**7. Sửa đối tượng cha: Helm và field manager**

\`\`\`bash
helm -n shop upgrade shop ~/charts/shop --reuse-values --wait --timeout 5m
# Error: UPGRADE FAILED: conflict occurred while applying object shop/gateway apps/v1, Kind=Deployment: Apply failed with 1 conflict:
#   conflict with "kubectl-patch" using apps/v1: .spec.template.spec.containers[name="gateway"].livenessProbe.httpGet.path && …
#   conflict with "kubectl-set" using apps/v1: .spec.template.spec.containers[name="order"].image
helm -n shop rollback shop 7 --force-conflicts --wait --timeout 5m
# Error: release shop failed: resource Deployment/shop/catalog not ready. status: Failed, message: Progress deadline exceeded
k -n shop get deploy catalog -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name} {end}{"\\n"}'
# JAVA_OPTS DB_URL DB_USER DB_PASSWORD SPRING_CONFIG_IMPORT        ← Helm lấy lại image và probe, không gỡ biến này
\`\`\`

\`--force-conflicts\` sửa được order và gateway, nhưng biến \`SPRING_CONFIG_IMPORT\` thuộc field manager \`kubectl-set\` và Helm không có nó trong manifest, nên server-side apply để nguyên. Gỡ nó bằng kubectl, rồi một lần helm thành công đưa release về \`deployed\`:

\`\`\`bash
k -n shop set env deploy/catalog SPRING_CONFIG_IMPORT-
helm -n shop upgrade shop ~/charts/shop --reuse-values --wait --timeout 5m     # Upgrade complete (1,3 giây: không còn gì để đổi)
helm -n shop list | tail -1                                                    # … deployed  shop-0.2.0
for d in catalog order gateway; do k -n shop rollout status deploy/$d; done
\`\`\`

Cách thuần kubectl cũng đúng: \`k -n shop rollout undo deploy/catalog\` (và order, gateway) đưa template về revision trước, release không đổi (vẫn \`deployed\`). Verify chấm trạng thái, không chấm cách.

**Lời giải tự động** (\`labs/cka/sessions/s46/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve.sh\` đi đúng bước 1–5, ghi not-ready.txt và answers.env, gỡ biến bằng \`kubectl set env … SPRING_CONFIG_IMPORT-\`, \`helm rollback\` về revision tốt gần nhất với \`--force-conflicts --wait\`, chờ ba rollout, và viết sổ tay bốn tầng nếu sổ tay chưa đủ (không ghi đè sổ tay đã đủ). Đo: 50 giây lần đầu, 16 giây lần hai, cả hai rồi verify 4/4.`,
    exam: {
      patterns: [
        "\"Ghi tên các Pod không Ready / đang CrashLoopBackOff của namespace X vào /opt/…\" — jsonpath hay custom-columns rồi lọc; đừng dựa vào `--field-selector status.phase`.",
        "\"Pod X restart liên tục, tìm nguyên nhân, ghi dòng log vào /opt/…\" — `k logs X --previous`, `grep`; nếu log sạch thì Events `Unhealthy` của probe.",
        "\"Deployment Y không rollout xong, sửa\" — `k rollout status`, `k get rs`, Events của Pod mới (`ErrImagePull`, `CreateContainerConfigError`), sửa template, `k rollout undo` nếu đề cho phép.",
        "\"Sắp các Pod theo số lần restart / theo thời gian tạo và ghi Pod đứng đầu\" — `--sort-by='.status.containerStatuses[0].restartCount'`, `--sort-by=.metadata.creationTimestamp`.",
      ],
      timeTargetMin: 20,
      drills: [
        {
          text: "Trong 2 phút: in `<ns>/<pod>` của mọi Pod không Ready trên toàn cluster, không dùng grep trên output bảng.",
          timeLimitMin: 2,
          solution: "```bash\nk get pod -A -o jsonpath='{range .items[*]}{.metadata.namespace}/{.metadata.name} {.status.conditions[?(@.type==\"Ready\")].status}{\"\\n\"}{end}' | awk '$2 != \"True\" {print $1}'\n```\nField selector không lọc được condition Ready; CrashLoopBackOff là phase Running.",
        },
        {
          text: "Trong 3 phút: Pod `web-…` CrashLoopBackOff. Ghi dòng `Caused by` cuối cùng của lần chạy trước vào /opt/cause.txt.",
          timeLimitMin: 3,
          solution: "```bash\nk logs web-… --previous | grep 'Caused by' | tail -n1 > /opt/cause.txt\n```\nKhông có `Caused by` thì dòng exception đầu tiên: `grep -E -m1 'Exception|Error'`.",
        },
      ],
    },
    tips: [
      "Ghi tệp đáp án **trước khi sửa**: đề hỏi trạng thái lúc sự cố, và sửa xong thì Pod hỏng biến mất cùng với bằng chứng.",
      "Log sạch mà RESTARTS tăng: đọc Events (`Unhealthy`, `Killing`) và `Exit Code` trong `describe`; 137 là SIGKILL (OOM hay hết grace), 143 là SIGTERM (liveness, xoá Pod).",
      "Đừng xoá Pod để \"sửa\" một Deployment: ReplicaSet tạo lại y hệt. Xoá Pod chỉ đúng khi Pod lẻ (không có cha) hay khi bạn đã sửa cha và muốn khởi động lại ngay.",
      "Với release Helm, `helm get manifest <release>` là bản tốt. Lỗi `conflict with \"kubectl-…\"` nghĩa là ai đó đã sửa bằng kubectl; Helm không gỡ trường nó chưa từng sở hữu.",
    ],
    outcome: {
      md: `Ba Deployment về đúng release, shop chạy đủ trên hai worker, và bạn có sổ tay bốn tầng cho cả chặng 9. Trên Mac:

\`\`\`bash
./labs/lab verify cka s46
\`\`\`

Bốn dòng. **Sổ tay:** \`~/notes/runbook.md\` có ≥ 4 heading \`##\`, bốn mục **khác nhau** cho bốn tầng (heading chứa một từ của mỗi nhóm \`app|ứng dụng|pod\`, \`service|dns\`, \`node|kubelet\`, \`control plane|apiserver\`), mỗi mục ≥ 3 dòng không rỗng (bốn heading hai dòng: đỏ, đo). **not-ready.txt:** mỗi dòng đúng dạng \`<ns>/<pod>\`, có Pod hỏng của catalog và order mà \`begin\` ghi lại (hay Pod khác cùng ReplicaSet hỏng), không có Pod nào vừa Ready lúc sự cố vừa Ready lúc chấm (thiếu Pod order: đỏ \`thiếu shop/order-…\`; liệt kê mọi Pod của shop: đỏ \`shop/catalog-6d4447d898-9wgjh đang Ready lúc sự cố (+11)\`, đo). **answers.env:** \`CATALOG_CAUSE\` là dòng log có đúng giá trị \`configserver:…\` của lần \`begin\` này (dán dòng env của YAML: đỏ, đo), \`ORDER_REASON\` \`ImagePullBackOff\` hay \`ErrImagePull\`, \`GATEWAY_PROBE\` \`liveness\`. **Lõi khoẻ** (\`s46/files/core-facts.sh\`, dùng lại ở mọi buổi sau của chặng và hai đề mock): ba node Ready, control plane và etcd từ \`/var/lib/etcd-restore\`, release shop \`deployed\`, bốn Deployment rollout xong, gateway/catalog/order ≥ 2 Pod Ready trên cả cka-w1 lẫn cka-w2, postgres-0 Ready, container (image, env, envFrom, ba probe) và Service khớp \`helm get manifest shop\` (đổi image của gateway-v1 bằng \`kubectl set image\`: đỏ \`lệch helm get manifest: gateway-v1.image\`, đo), cộng từ chính máy Mac \`:30180/api/products\` và \`/api/orders\` 200. Ngay sau \`begin\`: **0/4** trong 22 giây (khi cka-cp đã chạy quá 15 phút; trong 15 phút đầu sau khi VM bật, verify chờ shop như s26 tới 7 phút, đo 7 phút 02 giây).`,
      verifyOutput: "lab: kiểm s46\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~12 phút)\n  ✓ ~/notes/runbook.md: ≥ 4 mục ## phủ bốn tầng (ứng dụng/Pod, Service/DNS, node/kubelet, control plane), mỗi mục ≥ 3 dòng\n  ✓ ~/drills/s46/not-ready.txt: mỗi dòng <ns>/<pod>, đủ Pod hỏng lúc sự cố, không có Pod đang Ready\n  ✓ answers.env: CATALOG_CAUSE (dòng log nêu nguyên nhân), ORDER_REASON, GATEWAY_PROBE\n  ✓ Lõi khoẻ: shop rollout xong trên hai worker, không lệch helm get manifest; ba node; control plane; Mac /api/products, /api/orders 200\n  → 4/4 đạt",
      projectDelta: "Sổ tay sự cố ~/notes/runbook.md ra đời (mốc project của chặng 9): bốn tầng chẩn đoán, mỗi buổi sau thêm một mục. shop như cuối s45, nhưng giờ có một định nghĩa \"khoẻ\" kiểm được: không lệch release Helm.",
    },
    review: [
      { q: "Vì sao `k get pod -A --field-selector=status.phase!=Running` không bắt được Pod CrashLoopBackOff? Lọc Pod không Ready bằng gì?", a: "CrashLoopBackOff là lý do chờ của container, không phải phase: Pod đã chạy container ít nhất một lần nên `phase: Running` (đo: lệnh đó chỉ thấy order ErrImagePull, phase Pending, và Pod Completed). Ready là một condition, field selector không lọc được; in condition bằng jsonpath (`{.status.conditions[?(@.type==\"Ready\")].status}`) rồi lọc bằng awk, hay custom-columns." },
      { q: "Pod restart lặp mà `k logs --previous` sạch, chỉ có `Graceful shutdown complete`. Tìm nguyên nhân ở đâu?", a: "Kubelet giết container từ bên ngoài: Events `Liveness probe failed: HTTP probe failed with statuscode: 404` và `Container … failed liveness probe, will be restarted`, `describe` cho Exit Code 143 (SIGTERM) và đường dẫn của từng probe. App không biết mình bị giết vì sao, nên log không có lỗi." },
      { q: "Rollout của order kẹt mà shop vẫn trả 200. Vì sao đó là lỗi cần sửa ngay?", a: "Hai Pod cũ vẫn phục vụ vì `maxUnavailable` 0 nên ReplicaSet cũ không bị hạ; nhưng Deployment không còn tự phục hồi được: Pod cũ chết (node drain, OOM) thì ReplicaSet mới thay, mà Pod mới không kéo được image. Lỗi ẩn biến thành sự cố ở lần biến động sau. `k rollout status` và cột READY của ReplicaSet mới là nơi thấy nó." },
      { q: "`helm upgrade --reuse-values` báo `conflict with \"kubectl-set\"`. Thêm `--force-conflicts` có đủ không?", a: "Không đủ cho mọi trường. Server-side apply ghi field manager cho từng trường; `--force-conflicts` cho Helm lấy lại trường nó có trong manifest (image, probe), còn trường chỉ kubectl thêm (biến env SPRING_CONFIG_IMPORT) không có trong manifest nên Helm không đụng tới (đo: biến còn nguyên, `--wait` hết giờ, release `failed`). Gỡ trường đó bằng kubectl rồi để Helm áp lại." },
      { q: "Vì sao đọc log Java nên tìm dòng exception đầu tiên và dòng `Caused by` cuối cùng?", a: "Dòng exception đầu là thứ hỏng ở tầng ngoài cùng (không nạp được config từ `configserver:…`), `Caused by` cuối là nguyên nhân gốc (không có resolver cho tiền tố đó). Các khung `at …` ở giữa là đường đi của lời gọi, giúp sửa code chứ không giúp vận hành; `grep -vE '^\\s+at '` bỏ chúng đi." },
    ],
  },
  {
    id: "s47",
    stage: "st9",
    title: "Sự cố Service, DNS và NetworkPolicy",
    durationMin: 90,
    domain: "troubleshooting",
    competencies: ["ts-net"],
    requires: ["s46"],
    status: "published",
    pieces: [],
    goals: [
      "Tìm và sửa trong 25 phút ba lỗi mạng cùng lúc: một Corefile sai zone, một kube-proxy hỏng chỉ trên cka-w1, một NetworkPolicy thiếu luật egress.",
      "Tách lỗi DNS khỏi lỗi Service, và node này khỏi node kia, bằng một phép thử duy nhất chạy từ Pod trên từng worker.",
      "Đọc log CoreDNS và kube-proxy theo node, đọc Corefile và egress của NetworkPolicy để tìm chỗ hỏng thật.",
    ],
    skills: [
      { skill: "k-coredns-logs", level: "Gõ được không tra" },
      { skill: "k-netpol-debug-flow", level: "Dưới 5 phút" },
      { skill: "k-pod-resolv", level: "Gõ được không tra" },
      { skill: "k-kube-proxy-logs", level: "Gõ được không tra" },
    ],
    uses: ["k-svc-no-endpoints-flow", "net-dig", "k-netshoot", "k-netpol-semantics", "k-coredns-corefile"],
    foundation: null,
    mindset: `**Một phép thử tách hai giả thuyết.** "Pod A không gọi được Service B" có hai nửa: **tên** (DNS dịch \`catalog\` ra ClusterIP) và **đường** (kube-proxy dịch ClusterIP ra IP của một Pod, NetworkPolicy cho gói đi qua). Một lệnh làm cả hai nửa, mỗi nửa một lần, cho biết ngay nửa nào hỏng:

\`\`\`bash
nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://<ClusterIP của gateway>:8080/api/info
\`\`\`

Tên lỗi mà IP được: DNS. Tên được mà IP lỗi: Service, kube-proxy hay policy. Chạy nó từ một Pod busybox **trên từng worker** (\`nodeName\` hay \`nodeSelector\`) tách thêm một chiều: kube-proxy chạy riêng trên mỗi node, nên "chỉ hỏng từ cka-w1" là chữ ký của kube-proxy (hay CNI) của node đó. Đo trong buổi này, ngay sau \`begin\`:

| Từ | nslookup catalog.shop.svc.cluster.local | wget ClusterIP gateway:8080 |
|---|---|---|
| Pod trên cka-w1 | NXDOMAIN (0,01 giây) | \`download timed out\` (3 giây) |
| Pod trên cka-w2 | NXDOMAIN | 200, JSON của gateway |

Cả hai node NXDOMAIN, nhanh: DNS server có trả lời, nó chỉ không biết tên. Chỉ cka-w1 không tới ClusterIP: kube-proxy của cka-w1. Đây là cùng lối nghĩ với lỗi \`UnknownHostException\` so với \`SocketTimeoutException\` hay \`HikariPool … Connection is not available, request timed out\` trong một app Spring: lỗi tên nói "không tìm được ai", timeout nói "tìm được địa chỉ mà không tới". Đọc đúng loại lỗi đã là một nửa chẩn đoán.

**NXDOMAIN nhanh khác timeout.** Corefile có plugin \`kubernetes cluster.local in-addr.arpa ip6.arpa\`: CoreDNS chỉ tự trả lời tên trong các zone đó, tên khác đi xuống \`forward . /etc/resolv.conf\` ra DNS phía trên. Đổi zone thành một tên khác (ở đây \`cluster-…internal\`) thì \`catalog.shop.svc.cluster.local\` đi ra ngoài và nhận NXDOMAIN, trong khi \`google.com\` vẫn phân giải được (đo). CoreDNS có plugin \`reload\`: sửa ConfigMap là đủ, sau khoảng một phút log in \`[INFO] Reloading complete\` với SHA mới. **Restart CoreDNS trước khi đọc Corefile không sửa gì**: Pod mới đọc đúng Corefile sai đó (đo: verify vẫn đỏ \`Corefile khác bản tốt\`), và trên cka-w1, nơi kube-proxy đang hỏng, Pod CoreDNS mang IP mới nên DNS từ đó còn chuyển từ NXDOMAIN sang treo (đo).

**kube-proxy chết thì rule đứng yên, không mất.** kube-proxy chỉ là một controller ghi rule iptables theo Service và EndpointSlice; container chết thì rule đã ghi vẫn còn và vẫn chạy, nhưng **không ai cập nhật**. Pod của Service đổi (rollout, restart, scale) thì rule trên node đó trỏ vào IP Pod đã mất: gói bị DNAT vào chỗ không có ai, treo. Vì vậy triệu chứng là "Service mới đổi thì hỏng, Service cũ vẫn chạy, chỉ trên một node". \`k -n kube-system get pod -l k8s-app=kube-proxy -o wide\` cho biết node nào, \`k -n kube-system logs <Pod đó>\` cho biết vì sao (đo: \`"command failed" err="failed validate: KubeProxyConfiguration.Mode.ProxyMode: Invalid value: \\"iptable\\": must be iptables, ipvs, nftables or blank …"\`). Hai node kia chạy cấu hình cũ vì DaemonSet ở **OnDelete**: thay template không đụng Pod đang chạy, chỉ Pod bị xoá mới nhận template mới, cách người ta thử một thay đổi trên một node. Sửa template mà quên trả \`RollingUpdate\` thì Pod của cka-w1 vẫn là Pod hỏng.

**NetworkPolicy chỉ cộng quyền.** Không có luật "deny" trong NetworkPolicy chuẩn: một Pod bị cô lập theo một chiều khi **có bất kỳ** policy nào chọn nó theo chiều đó, và luồng được đi khi **ít nhất một** policy cho phép. Vì vậy thêm một policy không bao giờ chặn được luồng mà policy khác đã mở. Trong shop mọi Pod đã bị \`default-deny\` cô lập; egress của order tới catalog chỉ được mở bởi policy \`order\`. Sự cố "gộp policy order vào allow-monitoring" xoá \`order\` và để lại \`allow-monitoring\` thiếu luật đó: đặt hàng (POST, order gọi catalog để kiểm sản phẩm) 503 \`không kết nối được catalog\`, còn xem đơn (GET, chỉ đọc PostgreSQL) vẫn 200. Hỏi đúng câu: "policy nào chọn Pod nguồn, egress của nó mở tới đâu?" (\`k -n shop get netpol\` cột POD-SELECTOR, rồi \`-o yaml\` phần \`egress\`). Xoá hết policy để "hết chặn" là mở toang namespace, không phải sửa.`,
    refs: [
      { label: "Bài lộ trình CKA: Debug Service/DNS — endpoints rỗng, CoreDNS chết, kube-proxy lỗi", href: "#/roadmap/cka/cka-w8-4" },
      { label: "CKA Study Guide, chương 17 — Service", href: "#/docs/ckabook-17" },
      { label: "CKA Study Guide, chương 20 — NetworkPolicy", href: "#/docs/ckabook-20" },
      { label: "Timeout và exception trong Java: UnknownHost, connect timeout, read timeout", href: "#/docs/java-02" },
      { label: "kubernetes.io: Debugging DNS Resolution", href: "https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/" },
      { label: "kubernetes.io: Debug Services", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/" },
      { label: "kubernetes.io: Network Policies", href: "https://kubernetes.io/docs/concepts/services-networking/network-policies/" },
      { label: "kubernetes.io: Perform a Rolling Update on a DaemonSet (OnDelete)", href: "https://kubernetes.io/docs/tasks/manage-daemon/update-daemon-set/" },
      { label: "CoreDNS: plugin kubernetes và reload", href: "https://coredns.io/plugins/kubernetes/" },
    ],
    stateIn: "Đầu ra s46 (shop khớp release, sổ tay bốn tầng). Trên Mac chạy `./labs/lab begin cka s47`: kiểm đầu vào bằng check.sh riêng (ba tệp của s46, node, control plane: những gì sự cố không đụng), xoá answers.env cũ rồi **gây sự cố** (đo 2 phút 26 giây: hai lần rollout của Java và chờ CoreDNS nạp lại; chạy lại `begin` giữa buổi thì trước hết đưa CoreDNS, kube-proxy, NetworkPolicy về bản tốt rồi gây lại): \"từ hôm qua đặt hàng lỗi 503 và vài Pod không gọi được nhau\". Bấm giờ 25 phút.",
    stateOut: "Mọi luồng của shop và DNS như cuối s31: Corefile zone cluster.local; DaemonSet kube-proxy RollingUpdate, ba Pod Ready đúng revision; tám NetworkPolicy của shop đủ và đúng spec (allow-monitoring xoá hay giữ đều được); từ Pod trên mỗi worker tên phân giải và ClusterIP tới được; ~/drills/s47/answers.env (DNS_ZONE_FOUND, PROXY_NODE, BLOCKING_POLICY, ONE_TEST); mục s47 trong ~/notes/runbook.md.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s47`. Bấm giờ 25 phút. Trên Mac: `curl -s -o /dev/null -w '%{http_code}\\n' --max-time 6 http://<IP cka-w1>:30180/api/products`, rồi cùng lệnh với IP cka-w2, rồi `curl -s -X POST -H 'Content-Type: application/json' -d '{\"productId\":1,\"qty\":1}' http://<IP cka-w2>:30180/api/orders`. Ba triệu chứng khác nhau: ghi lại, đừng đoán vội.",
      },
      {
        id: "t2",
        text: "Phép thử một lệnh: tạo hai Pod `busybox:1.37` ở `default`, một ghim `cka-w1`, một ghim `cka-w2` (`k run t1 --image=busybox:1.37 --restart=Never --overrides='{\"spec\":{\"nodeName\":\"cka-w1\"}}' -- sleep 3600`). Trong mỗi Pod: `nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://<ClusterIP gateway>:8080/api/info` (ClusterIP từ `k -n shop get svc gateway`). Điền bảng 2 × 2: nửa nào hỏng, ở node nào? Ghi đúng lệnh bạn đã dùng vào `ONE_TEST=` (trong dấu nháy).",
      },
      {
        id: "t3",
        text: "DNS: `cat /etc/resolv.conf` trong Pod (nameserver, search), `nslookup google.com` (tên ngoài có được không?), `k -n kube-system logs -l k8s-app=kube-dns --prefix --tail=5`, `k -n kube-system get cm coredns -o yaml`. Dòng `kubernetes …` nói zone gì? Ghi `DNS_ZONE_FOUND=` **trước khi sửa**. Tình huống hỏng: `k -n kube-system rollout restart deploy coredns` rồi thử lại từ cả hai node: có đỡ không, vì sao trên cka-w1 còn tệ hơn?",
      },
      {
        id: "t4",
        text: "Sửa Corefile (`k -n kube-system edit cm coredns`, chỉ dòng `kubernetes`), chờ log `Reloading complete` của cả hai Pod CoreDNS, thử lại `nslookup`. Mất bao lâu từ lúc lưu?",
      },
      {
        id: "t5",
        text: "kube-proxy: `k -n kube-system get pod -l k8s-app=kube-proxy -o wide`, `k -n kube-system logs <Pod trên cka-w1>` (và `--previous`). Vì sao chỉ node đó? `k -n kube-system get ds kube-proxy -o yaml | grep -A3 -E 'updateStrategy|configMap'`, `k -n kube-system rollout history ds/kube-proxy`. Ghi `PROXY_NODE=`. Đưa DaemonSet về đúng (template và updateStrategy như kubeadm: RollingUpdate, maxUnavailable 1, maxSurge 0) bằng cách bạn chọn, rồi `k -n kube-system rollout status ds/kube-proxy`. ConfigMap thử dọn đi.",
      },
      {
        id: "t6",
        text: "NetworkPolicy: `k -n shop get netpol` (so với tám policy của s31), `k -n shop get netpol -o yaml` chỉ đọc các policy có `podSelector` chọn `app: order`: egress mở tới đâu? Ghi `BLOCKING_POLICY=`. Sửa sao cho mọi policy của s31–s32 trở lại đúng như manifest `~/shop/` (gợi ý: `k apply -f` tệp policy của bạn), allow-monitoring xoá hay giữ tuỳ bạn. Thử từ một Pod order: `k -n shop exec deploy/order -- bash -c 'timeout 4 bash -c \"</dev/tcp/catalog/8080\" && echo ok'`.",
      },
      {
        id: "t7",
        text: "Chạy lại phép thử một lệnh trên hai node, POST /api/orders từ Mac (201), thêm mục `## s47 …` vào `~/notes/runbook.md` (triệu chứng, nguyên nhân, lệnh: ≥ 3 dòng), xoá hai Pod busybox. Trên Mac: `./labs/lab verify cka s47` phải 7/7. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "NXDOMAIN trả về ngay là CoreDNS có trả lời, chỉ không biết tên đó; treo hay `connection timed out; no servers could be reached` là không tới được CoreDNS (ClusterIP 10.96.0.10 qua kube-proxy, hay policy egress DNS).",
      "`nslookup google.com` được mà `nslookup catalog.shop.svc.cluster.local` NXDOMAIN (đo): CoreDNS sống, upstream sống, chỉ phần tên trong cluster hỏng. Nhìn dòng `kubernetes …` của Corefile.",
      "Log CoreDNS chỉ có `[INFO] Reloading` và `plugin/reload: Running configuration SHA512 = …` (đo): plugin `errors` không in NXDOMAIN. Một lần reload là có người vừa đổi ConfigMap.",
      "`failed validate: KubeProxyConfiguration.Mode.ProxyMode: Invalid value: \"iptable\"` (đo, log Pod kube-proxy trên cka-w1): Pod đó đọc một ConfigMap khác hai Pod kia. `k -n kube-system get pod <pod> -o yaml | grep -A2 configMap`.",
      "`k rollout undo ds/kube-proxy` đưa template về revision trước nhưng không đổi `updateStrategy` (nó không nằm trong template). Còn OnDelete thì Pod hỏng trên cka-w1 ở nguyên tới khi bạn xoá nó hay trả RollingUpdate.",
      "Sửa xong kube-proxy mà ClusterIP từ cka-w1 vẫn treo: chờ Pod kube-proxy mới Ready (nó ghi lại toàn bộ rule lúc khởi động), rồi thử lại.",
      "POST /api/orders trả `{\"error\":\"không kết nối được catalog\"}` 503 mà GET 200: order nói được với PostgreSQL nhưng không với catalog. Một policy egress chọn order mà thiếu catalog.",
      "Verify dòng NetworkPolicy đỏ `thiếu NetworkPolicy …` sau khi bạn xoá hết policy: đó là mở toang namespace, không phải sửa. Áp lại các tệp của bạn trong `~/shop/`.",
    ],
    solution: `Output là của máy soạn bài (2026-11-24, Kubernetes 1.37.2, Calico 3.33, CoreDNS v1.14.6, sau \`apply\` s46 rồi \`begin cka s47\`); zone \`cluster-…\`, tên Pod, ClusterIP của bạn sẽ khác. Lệnh \`k\` chạy trên cka-cp.

**1. Ba triệu chứng từ Mac**

\`\`\`bash
curl -s -o /dev/null -w '%{http_code} %{time_total}\\n' --max-time 6 http://192.168.252.36:30180/api/products   # 000 6.008  (cka-w1: treo)
curl -s -o /dev/null -w '%{http_code} %{time_total}\\n' --max-time 6 http://192.168.252.37:30180/api/products   # 503 0.121  (cka-w2)
curl -s --max-time 6 http://192.168.252.37:30180/api/products                                                 # {"error":"không kết nối được catalog"}
\`\`\`

NodePort của cka-w1 treo, của cka-w2 trả lời nhanh nhưng gateway không nối được catalog. Hai lỗi khác nhau, chưa biết lỗi nào.

**2. Phép thử một lệnh trên từng worker**

\`\`\`bash
GW=$(k -n shop get svc gateway -o jsonpath='{.spec.clusterIP}'); echo $GW          # 10.105.152.32
for n in cka-w1 cka-w2; do
  k run t-$n --image=busybox:1.37 --restart=Never --overrides="{\\"spec\\":{\\"nodeName\\":\\"$n\\"}}" -- sleep 3600
done
k wait pod t-cka-w1 t-cka-w2 --for=condition=Ready --timeout=60s
k exec t-cka-w1 -- sh -c "nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://$GW:8080/api/info"
# ** server can't find catalog.shop.svc.cluster.local: NXDOMAIN
# wget: download timed out
k exec t-cka-w2 -- sh -c "nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://$GW:8080/api/info"
# ** server can't find catalog.shop.svc.cluster.local: NXDOMAIN
# {"service":"gateway","version":"2.0","hostname":"gateway-585d76c4cb-xqzmd","greeting":"Xin chào từ ConfigMap"}
k exec t-cka-w1 -- nslookup google.com | tail -1                                        # Address: 2404:6800:4005:825::200e
\`\`\`

DNS hỏng ở cả hai node (NXDOMAIN trong 0,01 giây, tên ngoài vẫn được); đường tới ClusterIP hỏng chỉ ở cka-w1.

**3. DNS: Corefile**

\`\`\`bash
k -n kube-system logs -l k8s-app=kube-dns --prefix --tail=3 | cut -c1-110
# [pod/coredns-559f6c778d-6rtrw/coredns] [INFO] Reloading
# [pod/coredns-559f6c778d-6rtrw/coredns] [INFO] plugin/reload: Running configuration SHA512 = e843bc2e3cf06adb…
# [pod/coredns-559f6c778d-6rtrw/coredns] [INFO] Reloading complete
k -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | grep kubernetes
#     kubernetes cluster-69a7.internal in-addr.arpa ip6.arpa {
echo 'DNS_ZONE_FOUND=cluster-69a7.internal' > ~/drills/s47/answers.env
k -n kube-system edit cm coredns            # kubernetes cluster.local in-addr.arpa ip6.arpa {
\`\`\`

CoreDNS nạp lại tự động (plugin \`reload\`, ConfigMap tới Pod qua volume): \`nslookup\` từ cka-w2 đúng lại sau khoảng một phút. Restart CoreDNS trước khi sửa thì Pod mới đọc lại đúng Corefile sai đó, verify vẫn đỏ (đo).

**4. kube-proxy của cka-w1**

\`\`\`bash
k -n kube-system get pod -l k8s-app=kube-proxy -o wide | cut -c1-90
# kube-proxy-9lzcc   0/1     CrashLoopBackOff   4 (75s ago)   2m35s   192.168.252.36   cka-w1
# kube-proxy-j6rfw   1/1     Running            2 (40m ago)   111m    192.168.252.37   cka-w2
# kube-proxy-sbh8m   1/1     Running            2 (40m ago)   111m    192.168.252.35   cka-cp
k -n kube-system logs kube-proxy-9lzcc --tail=1
# E1124 17:02:16.310284  1 run.go:72] "command failed" err="failed validate: KubeProxyConfiguration.Mode.ProxyMode: Invalid value: \\"iptable\\": must be iptables, ipvs, nftables or blank (blank means the best-available proxy [currently iptables])"
k -n kube-system get ds kube-proxy -o jsonpath='{.spec.updateStrategy.type} {range .spec.template.spec.volumes[*]}{.configMap.name} {end}{"\\n"}'
# OnDelete kube-proxy-next
k -n kube-system rollout undo ds/kube-proxy
k -n kube-system patch ds kube-proxy --type=merge -p '{"spec":{"updateStrategy":{"type":"RollingUpdate","rollingUpdate":{"maxSurge":0,"maxUnavailable":1}}}}'
k -n kube-system rollout status ds/kube-proxy
# Waiting for daemon set "kube-proxy" rollout to finish: 2 of 3 updated pods are available...
# daemon set "kube-proxy" successfully rolled out
k -n kube-system delete cm kube-proxy-next
echo 'PROXY_NODE=cka-w1' >> ~/drills/s47/answers.env
\`\`\`

Pod mới trên cka-w1 ghi lại toàn bộ rule lúc khởi động; \`wget\` ClusterIP từ \`t-cka-w1\` trả JSON lại ngay sau đó.

**5. NetworkPolicy chọn order**

\`\`\`bash
k -n shop get netpol | grep -E 'NAME|order'
# NAME                 POD-SELECTOR      AGE
# allow-monitoring     app=order         6s           ← không còn policy order
k -n shop get netpol -o jsonpath='{range .items[?(@.spec.podSelector.matchLabels.app=="order")]}{.metadata.name}: egress {.spec.egress[*].to[*].podSelector.matchLabels.app}{"\\n"}{end}'
# allow-monitoring: egress postgres
echo 'BLOCKING_POLICY=allow-monitoring' >> ~/drills/s47/answers.env
k apply -f ~/shop/netpol.yaml                # … networkpolicy.networking.k8s.io/order created
k -n shop delete netpol allow-monitoring     # hay giữ: sau khi order trở lại, nó chỉ cộng quyền
k -n shop exec deploy/order -- bash -c "timeout 4 bash -c '</dev/tcp/catalog/8080' && echo ok"     # ok
\`\`\`

**6. Thử lại và ghi**

\`\`\`bash
k exec t-cka-w1 -- sh -c "nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://$GW:8080/api/info"
# Address: 10.101.94.107
# {"service":"gateway","version":"2.0","hostname":"gateway-86c5db797-ls92l","greeting":"Xin chào từ ConfigMap"}
echo "ONE_TEST=\\"nslookup catalog.shop.svc.cluster.local; wget -qO- -T3 http://$GW:8080/api/info\\"" >> ~/drills/s47/answers.env
k delete pod t-cka-w1 t-cka-w2
\`\`\`

Rồi thêm mục \`## s47 — DNS, kube-proxy, NetworkPolicy\` vào sổ tay: triệu chứng (bảng 2 × 2), ba nguyên nhân, lệnh đã dùng.

**Lời giải tự động** (\`labs/cka/sessions/s47/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve.sh\` đi đúng bước 2–6 (Pod busybox ghim từng worker, Corefile sửa bằng \`sed\` rồi \`kubectl replace\`, \`rollout undo\` cộng trả RollingUpdate cho kube-proxy, áp lại policy \`order\` lấy từ \`~/shop/\`), chờ tới khi cả hai worker phân giải được và mọi Pod order nối được catalog (mỗi Pod CoreDNS nạp lại Corefile riêng: chỉ chờ một node thì verify ngay sau đó có lần 4/7, đo), ghi answers.env và mục s47 của sổ tay nếu chưa có. Đo: 3 phút 31 giây và 2 phút 48 giây (gồm 1,5–2,5 phút gây sự cố), cả hai rồi verify 7/7.`,
    exam: {
      patterns: [
        "\"Pod trong namespace X không phân giải được Service Y, sửa\" — `nslookup` từ Pod, `/etc/resolv.conf`, log CoreDNS, ConfigMap `coredns` (zone, forward), policy egress DNS (UDP/TCP 53 tới kube-dns).",
        "\"Service Z không tới được từ một node\" — Pod thử ghim node, `k -n kube-system get pod -l k8s-app=kube-proxy -o wide`, `k logs` Pod kube-proxy của node đó, ConfigMap/DaemonSet kube-proxy.",
        "\"Sau khi áp NetworkPolicy, A không gọi được B\" — policy nào chọn A (egress) và B (ingress), luật có đủ cả DNS không; NetworkPolicy chỉ cộng quyền.",
        "\"Ghi lệnh/kết quả kiểm tra vào /opt/…\" — một lệnh tách tên khỏi đường: `nslookup <tên>; wget -T3 <ClusterIP>:<port>`.",
      ],
      timeTargetMin: 25,
      drills: [
        {
          text: "Trong 3 phút: chứng minh lỗi là DNS hay Service khi `app` không gọi được `api.prod`. Chỉ được dùng một Pod busybox.",
          timeLimitMin: 3,
          solution: "```bash\nk run t --image=busybox:1.37 --rm -it --restart=Never -- sh -c 'nslookup api.prod.svc.cluster.local; wget -qO- -T3 http://<ClusterIP>:<port>/'\n```\nTên lỗi, IP được: DNS (CoreDNS, Corefile, policy egress 53). Tên được, IP lỗi: EndpointSlice rỗng, targetPort sai, kube-proxy, policy.",
        },
        {
          text: "Trong 2 phút: liệt kê mọi NetworkPolicy chọn Pod nhãn `app=order` trong namespace shop và các đích egress của chúng.",
          timeLimitMin: 2,
          solution: "```bash\nk -n shop get netpol -o jsonpath='{range .items[*]}{.metadata.name} sel={.spec.podSelector} types={.spec.policyTypes} egress={.spec.egress[*].to}{\"\\n\"}{end}'\n```\nNhớ policy `podSelector: {}` (chọn mọi Pod: default-deny, allow-dns-egress) cũng chọn order.",
        },
      ],
    },
    tips: [
      "Luôn thử từ **hai** node khi lỗi mạng chỉ xảy ra \"thỉnh thoảng\": kube-proxy, CNI và iptables là việc của từng node.",
      "Đọc Corefile trước khi restart CoreDNS: restart không sửa cấu hình sai, và đổi IP Pod CoreDNS có thể làm hỏng thêm ở node có kube-proxy chết.",
      "DaemonSet ở OnDelete là cách thử một thay đổi trên một node; nhớ kiểm `updateStrategy` khi Pod của một node khác hẳn các node kia.",
      "Trước khi xoá hay sửa một NetworkPolicy, hỏi \"policy nào chọn Pod nguồn và Pod đích\"; sửa chỗ thiếu luật, đừng xoá cả namespace.",
    ],
    outcome: {
      md: `Ba lỗi mạng về đúng chỗ và shop nói chuyện được từ mọi node. Trên Mac:

\`\`\`bash
./labs/lab verify cka s47
\`\`\`

Bảy dòng, so với bản tốt mà \`begin\` lưu lần đầu ở \`/root/.lab/st9-net/\`. **CoreDNS:** Corefile giống bản tốt từng dòng, Deployment coredns đủ replica (restart CoreDNS mà Corefile vẫn sai: đỏ \`Corefile khác bản tốt (zone cluster-69a7.internal)\`, đo). **kube-proxy:** template và updateStrategy của DaemonSet như bản tốt (bỏ qua annotation của \`rollout restart\`), ba Pod Ready đúng revision. **Phép thử:** Pod busybox tạm trên mỗi worker (namespace \`lab-verify-s47-…\`, xoá khi xong) phân giải \`catalog.shop.svc.cluster.local\` ra đúng ClusterIP của catalog và \`wget\` ClusterIP của gateway nhận JSON (catalog chỉ nhận từ Pod của shop, nên đích là gateway). **NetworkPolicy:** mọi policy lúc lưu còn đủ và đúng spec, không thêm policy nào ngoài allow-monitoring, và mỗi Pod order nối được \`catalog:8080\` (xoá hết policy của shop: đỏ \`thiếu NetworkPolicy allow-dns-egress,catalog,default-deny,…\`, đo). **answers.env:** zone đúng của lần \`begin\` này, \`cka-w1\`, \`allow-monitoring\`, một lệnh có \`nslookup\`/\`dig\` và một ClusterIP hay tên Service. **Sổ tay:** heading chứa \`s47\` với ≥ 3 dòng. **Lõi khoẻ** của s46 cộng Mac \`:30180\` của cka-w1. Ngay sau \`begin\`: **0/7** trong 87 giây (đo).`,
      verifyOutput: "lab: kiểm s47\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)\n  ✓ CoreDNS: Corefile như bản tốt (zone cluster.local), đủ replica\n  ✓ kube-proxy: DaemonSet (template, updateStrategy) như bản tốt, ba Pod Ready đúng revision\n  ✓ Pod tạm trên cka-w1 và cka-w2: nslookup catalog.shop.svc.cluster.local, wget ClusterIP gateway:8080\n  ✓ NetworkPolicy của shop như cuối s46 (đủ, đúng spec); mỗi Pod order nối được catalog:8080\n  ✓ answers.env: DNS_ZONE_FOUND, PROXY_NODE, BLOCKING_POLICY, ONE_TEST\n  ✓ ~/notes/runbook.md có mục s47 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng\n  ✓ Lõi khoẻ: Mac :30180 của cka-w1 /api/products, /api/orders 200; shop rollout xong, không lệch release; node; control plane\n  → 7/7 đạt",
      projectDelta: "Mọi luồng của shop trở lại như cuối s31 (DNS, kube-proxy ba node, tám NetworkPolicy). Sổ tay có mục s47: phép thử một lệnh tách DNS khỏi Service và node này khỏi node kia.",
    },
    review: [
      { q: "Từ Pod trên cka-w1: `nslookup catalog.shop.svc.cluster.local` NXDOMAIN ngay, `wget <ClusterIP>` treo. Trên cka-w2: NXDOMAIN, `wget` 200. Có mấy lỗi, ở đâu?", a: "Hai. DNS hỏng ở mọi node, và trả lời nhanh nên CoreDNS sống, chỉ không biết tên: cấu hình (Corefile, zone). Đường tới ClusterIP hỏng chỉ ở cka-w1: việc của kube-proxy (hay CNI) của node đó. Một phép thử, hai node, bốn ô: mỗi ô loại một giả thuyết." },
      { q: "Pod kube-proxy chết thì ClusterIP trên node đó có chết ngay không?", a: "Không. Rule iptables đã ghi vẫn còn và vẫn chạy; chỉ là không ai cập nhật. Service nào đổi Pod sau lúc đó (rollout, restart, scale) thì rule trên node đó trỏ vào IP Pod đã mất và treo, Service không đổi vẫn chạy. Vì vậy triệu chứng thường là \"hỏng một phần, chỉ một node\"." },
      { q: "Vì sao chỉ Pod kube-proxy của cka-w1 hỏng khi cả ba dùng chung một DaemonSet?", a: "DaemonSet ở `updateStrategy: OnDelete`: sửa template không thay Pod đang chạy, chỉ Pod bị xoá mới được tạo từ template mới. Pod của cka-w1 bị xoá nên nhận template trỏ ConfigMap `kube-proxy-next` (mode gõ sai). Sửa: template về như cũ (`rollout undo`) và updateStrategy về RollingUpdate, nếu không Pod hỏng vẫn ở đó." },
      { q: "Thêm một NetworkPolicy có thể chặn một luồng đang chạy không?", a: "Chỉ khi Pod đó chưa bị cô lập theo chiều đó: policy đầu tiên chọn một Pod theo Egress làm nó bị cô lập, mọi egress không được mở đều bị chặn. Khi Pod đã bị cô lập (default-deny), thêm policy chỉ cộng quyền. Trong buổi này luồng order → catalog chết vì policy `order` (thứ duy nhất mở nó) bị xoá và allow-monitoring thay chỗ thiếu luật đó." },
      { q: "Một service Spring báo `java.net.UnknownHostException: catalog`, service khác báo `HikariPool-1 - Connection is not available, request timed out after 30000ms`. Bạn thử gì đầu tiên cho mỗi cái?", a: "UnknownHostException là tầng tên: `nslookup catalog` (hay `getent hosts catalog`) từ chính Pod đó, rồi CoreDNS và policy egress 53. Timeout của Hikari là tầng đường hay tầng đích: tên đã ra IP, kết nối không thành trong hạn; thử `/dev/tcp/<host>/5432` từ Pod, policy egress tới postgres và ingress của postgres, Pod postgres có Ready không, hay pool cạn vì truy vấn chậm." },
    ],
  },
  {
    id: "s48",
    stage: "st9",
    title: "Sự cố node, kubelet và container runtime",
    durationMin: 90,
    domain: "troubleshooting",
    competencies: ["ts-nodes"],
    requires: ["s47"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa hai worker NotReady về Ready trong 20 phút khi mỗi node hỏng một kiểu: cka-w1 ở containerd (kubelet vẫn chạy, chỉ báo tin), cka-w2 ở một trường của /var/lib/kubelet/config.yaml.",
      "Đọc đúng chỗ theo thứ tự node → kubelet → runtime → tệp cấu hình: Conditions, systemctl status/cat, journalctl -u containerd -u kubelet, crictl info và crictl inspect.",
      "Biết khi nào kubectl debug node dùng được, đọc MemoryPressure/DiskPressure để loại trừ áp lực tài nguyên, và đưa shop trải lại hai worker sau khi Pod bị evict.",
    ],
    skills: [
      { skill: "k-debug-node", level: "Gõ được có tra" },
      { skill: "k-containerd-journal", level: "Gõ được không tra" },
      { skill: "k-crictl-inspect", level: "Gõ được không tra" },
      { skill: "k-kubelet-misconfig", level: "Nhận ra trong 1 phút" },
      { skill: "k-node-pressure", level: "Giải thích được" },
    ],
    uses: ["k-node-notready-flow", "k-kubelet-journal", "lx-systemctl-cat", "k-containerd-systemdcgroup", "lx-df-du"],
    foundation: {
      area: "linux",
      md: `**Unit systemd có nhiều tầng, log có mức độ.** Trên node, kubelet và containerd là hai unit systemd. Trước khi đọc log, biết unit thật sự chạy lệnh gì.

**1. \`systemctl cat\`: unit cộng mọi drop-in.** \`systemctl cat kubelet\` in \`/usr/lib/systemd/system/kubelet.service\` rồi từng drop-in trong \`kubelet.service.d/\`, theo thứ tự áp dụng. Với kubeadm, drop-in \`10-kubeadm.conf\` xoá \`ExecStart\` gốc (\`ExecStart=\` rỗng) và đặt lại bằng bốn biến: \`--config=/var/lib/kubelet/config.yaml\` (KubeletConfiguration), \`kubeadm-flags.env\`, \`/etc/default/kubelet\`. Cờ trên dòng lệnh thắng trường trong config.yaml; trên lab \`kubeadm-flags.env\` rỗng (đo), nên runtime endpoint và CA của kubelet chỉ nằm trong config.yaml.

\`\`\`bash
systemctl cat kubelet | grep -E '^# /|^(ExecStart|EnvironmentFile|Environment)='
systemctl show kubelet -p NRestarts -p ActiveState -p SubState    # vòng crash: NRestarts tăng, SubState auto-restart
\`\`\`

**2. \`journalctl\`: lọc theo unit, thời gian, mức độ.** \`-u\` lặp được (\`-u containerd -u kubelet\` trộn hai log theo thời gian), \`--since -10min\` hay \`--since "10 min ago"\`, \`-p err\` chỉ mức err trở lên, \`--no-pager\` để pipe được.

\`\`\`bash
sudo journalctl -u containerd -u kubelet --since -10min --no-pager | tail -20
sudo journalctl -u containerd -p err --since -10min --no-pager      # đo: chỉ thấy dòng của systemd "Failed to start containerd.service"
\`\`\`

**Bẫy của \`-p err\`** (đo trên lab): containerd và kubelet ghi log ra stderr, journald xếp chúng ở mức \`info\` dù nội dung là \`level=error\` hay \`E1125\`. \`-p err\` vì vậy chỉ còn dòng của chính systemd ("Failed to start …", "Main process exited"): đủ để biết unit **có** chết, không đủ để biết **vì sao**. Dòng vì sao phải tìm trong log đầy đủ bằng grep (\`failed to unmarshal TOML\`, \`"command failed"\`).

**Bài tập nền (5 phút, trên một worker trước khi \`begin\`):** \`systemctl cat containerd\` (có drop-in không? \`KillMode\` là gì?), \`systemctl show kubelet -p NRestarts\`, \`sudo journalctl -u kubelet --since -5min -p err --no-pager\` rồi bỏ \`-p err\`: hai lệnh khác nhau bao nhiêu dòng?`,
    },
    mindset: `**Node NotReady: kubelet là người báo tin, chưa chắc là thủ phạm.** Trạng thái node do kubelet ghi lên apiserver (Conditions và Lease mỗi vài giây). Khi node NotReady, câu hỏi đầu tiên là **kubelet có còn báo không**, vì câu trả lời chia đôi cây chẩn đoán:

| Ready | Reason, message (đo trên lab) | Ý nghĩa | Nhìn tiếp |
|---|---|---|---|
| \`False\` | \`KubeletNotReady\`, \`container runtime is down\` | kubelet sống, nó báo **runtime** chết | \`systemctl status containerd\`, \`journalctl -u containerd\`, \`crictl info\` |
| \`Unknown\` | \`NodeStatusUnknown\`, \`Kubelet stopped posting node status.\` | không ai báo nữa: kubelet chết hay mất mạng | \`systemctl status kubelet\`, \`journalctl -u kubelet\`, \`systemctl cat kubelet\`, config.yaml |

Trong buổi này cka-w1 là dòng trên: \`/etc/containerd/config.toml\` có \`SystemdCgroup = True\` (TOML chỉ có \`true\`/\`false\`), containerd thoát ngay lúc khởi động với \`failed to unmarshal TOML at row 109 column 29: toml: incomplete number\`, systemd chạy lại mỗi 5 giây; kubelet vẫn chạy, log đầy \`"Container runtime sanity check failed" … dial unix /var/run/containerd/containerd.sock: connect: no such file or directory\`. Node NotReady sau ~40 giây (đo). **Restart kubelet ở đây làm tệ hơn**: kubelet mới thoát ngay lúc khởi động (\`"command failed" err="failed to run Kubelet: validate service connection: validate CRI v1 runtime API for endpoint …"\`), node chuyển sang \`Unknown\` sau ~45 giây (đo): bạn vừa xoá người báo tin duy nhất. cka-w2 là dòng dưới: một trường của \`/var/lib/kubelet/config.yaml\` sai, kubelet thoát lúc khởi động mỗi 10 giây.

Giống một service Java không lên: \`java -Xmx2gb -jar app.jar\` in \`Invalid maximum heap size: -Xmx2gb\` rồi \`Error: Could not create the Java Virtual Machine\` và thoát mã 1; restart bao nhiêu lần cũng vậy, vì lỗi nằm trong **cấu hình**, không trong tiến trình. kubelet cũng thế (\`Restart=always\` chỉ làm vòng lặp chạy mãi), và containerd cũng thế. Khác ở chỗ: JVM chết là app chết; containerd chết thì **container vẫn chạy** (\`KillMode=process\`, các \`containerd-shim\` ở lại: \`Unit process … (containerd-shim) remains running after unit stopped\`, đo), chỉ không ai quản lý chúng nữa.

**\`kubectl debug node\` cần chính node đó khoẻ.** Lệnh tạo một Pod có \`nodeName\` là node đó, toleration \`operator: Exists\` (chịu mọi taint, đo), mount \`/\` của node vào \`/host\`. Pod được kubelet **của node đó** chạy qua containerd **của node đó**: runtime chết thì Pod debug nằm \`Pending\`, không có event nào (đo trên cka-w1 hỏng). Nó là cách vào node khi không có ssh, không phải cách vào node hỏng runtime. Dùng nó sau khi sửa, hay trên node khoẻ, để đọc tệp của node (\`/host/var/lib/kubelet/config.yaml\`).

**NotReady quá 300 giây thì Pod bị evict.** Node lifecycle controller gắn taint \`node.kubernetes.io/not-ready:NoExecute\` (kubelet còn báo) hay \`unreachable:NoExecute\` (không báo); Pod thường có toleration 300 giây cho hai taint đó. Hết 300 giây (đo): Pod cũ \`Terminating\` (kubelet của node đó vắng nên không ai xác nhận xoá), ReplicaSet tạo Pod mới \`Pending\`; CoreDNS dời sang cka-cp vì chịu được taint control-plane; postgres-0 (PV local-path ghim cka-w2) chờ đúng cka-w2 và \`Running\` lại ~8 giây sau khi kubelet của cka-w2 chạy. Node nào lên trước nhận hết Pod đang chờ: shop **mất trải hai worker** (đo: \`gateway: Pod Ready chỉ ở w1; catalog: …; order: …\`), cần \`rollout restart\`. **MemoryPressure/DiskPressure** là hai condition khác: kubelet tự evict Pod khi bộ nhớ hay đĩa dưới ngưỡng \`evictionHard\`. Trong buổi này cả hai \`False\` trên cka-w1 và \`Unknown\` trên cka-w2: đọc chúng để loại trừ, không phải để sửa.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 8 — Node NotReady", href: "#/roadmap/cka/cka-w8-1" },
      { label: "CKA Study Guide, chương 22 — Xử lý sự cố cluster", href: "#/docs/ckabook-22" },
      { label: "kubernetes.io: Debugging Kubernetes Nodes With Kubectl (kubectl debug node)", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/" },
      { label: "kubernetes.io: Troubleshooting Clusters — node, kubelet, container runtime", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
      { label: "kubernetes.io: Set Kubelet Parameters Via A Configuration File", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubelet-config-file/" },
      { label: "kubernetes.io: Container Runtimes — containerd, systemd cgroup driver", href: "https://kubernetes.io/docs/setup/production-environment/container-runtimes/#containerd-systemd" },
      { label: "kubernetes.io: Taint based Evictions", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#taint-based-evictions" },
      { label: "kubernetes.io: Node-pressure Eviction", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/" },
    ],
    stateIn: "Đầu ra s47 (mọi luồng của shop và DNS như cuối s31, sổ tay có mục s47). Trên Mac chạy `./labs/lab begin cka s48`: kiểm đầu vào bằng check.sh riêng (answers.env và mục s47 của sổ tay, control plane: những gì sự cố không đụng), xoá answers.env cũ rồi **gây sự cố** (đo 56 giây, gồm chờ hai worker hết Ready; chạy lại `begin` giữa buổi thì trước hết đưa hai worker về bản tốt, bỏ cordon, chờ ba node Ready rồi gây lại, đo 64 giây): \"sáng nay hai worker NotReady, shop chập chờn\". Bấm giờ 20 phút; sau 5 phút NotReady Pod bắt đầu bị evict.",
    stateOut: "Ba node Ready, không cordon; containerd và kubelet active, enabled trên ba node; config.toml và config.yaml của hai worker như bản tốt; shop trải lại hai worker (gateway, catalog, order ≥ 2 Pod Ready trên cả cka-w1 lẫn cka-w2), postgres-0 Ready; ~/drills/s48/answers.env (W1_COMPONENT, W2_FIELD, NODE_DEBUG_CGROUP); mục s48 trong ~/notes/runbook.md.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s48`. Bấm giờ 20 phút. Trên cka-cp: `k get node`, rồi `k describe node cka-w1 | sed -n '/Conditions/,/Addresses/p'` và cùng lệnh cho cka-w2. Với mỗi node: Ready là `False` hay `Unknown`, reason và message là gì? MemoryPressure, DiskPressure nói gì? Điền bảng hai dòng của phần Tư duy trước khi ssh vào đâu.",
      },
      {
        id: "t2",
        text: "Thử vào cka-w1 không qua ssh: `k debug node/cka-w1 -it --image=busybox:1.37 -- sh`. Chờ 30 giây (hay Ctrl-C rồi `k get pod -o wide | grep node-debugger`, `k describe pod node-debugger-cka-w1-…`). Pod ở trạng thái nào, có event không, vì sao? Xoá Pod đó.",
      },
      {
        id: "t3",
        text: "`ssh cka-w1`: `systemctl status containerd kubelet`, `systemctl cat kubelet`, `sudo crictl info | head`. Rồi `sudo journalctl -u containerd -p err --since -15min --no-pager` và cùng lệnh bỏ `-p err` (dùng `| grep -i toml`). Dòng nào nói vì sao, ở dòng mấy cột mấy của tệp nào? Ghi `W1_COMPONENT=` vào `~/drills/s48/answers.env` trên cka-cp (thành phần hỏng, không phải thành phần báo tin).",
      },
      {
        id: "t4",
        text: "Tình huống hỏng: trên cka-w1 `sudo systemctl restart kubelet` **trước khi** sửa containerd. Sau 1 phút `k describe node cka-w1`: Ready và message đổi thành gì? `sudo journalctl -u kubelet --since -2min --no-pager | grep '\"command failed\"'`. Rồi sửa đúng dòng trong `/etc/containerd/config.toml` (vim `:109`, hay `sed -n '109p'` trước), `sudo systemctl restart containerd`, `sudo crictl info` cho `RuntimeReady`. kubelet có tự lên lại không, sau bao lâu node Ready?",
      },
      {
        id: "t5",
        text: "Sau khi cka-w1 Ready: `k debug node/cka-w1 -it --image=busybox:1.37 -- grep cgroupDriver /host/var/lib/kubelet/config.yaml` (nhớ xoá Pod node-debugger sau đó). Ghi `NODE_DEBUG_CGROUP=`. Ngưỡng evict của kubelet: `k get --raw /api/v1/nodes/cka-w1/proxy/configz | python3 -m json.tool | grep -A6 evictionHard`, so với `free -m` và `df -h /var/lib/containerd` trên cka-w1. Trên cka-w1: `sudo crictl ps | head -3`, `sudo crictl inspect <một container> | grep -m1 cgroupsPath`: dạng `…slice:cri-containerd:…` nói cgroup driver nào đang chạy, có khớp kubelet và `SystemdCgroup = true` không?",
      },
      {
        id: "t6",
        text: "`ssh cka-w2`: `systemctl status kubelet` (auto-restart?), `systemctl show kubelet -p NRestarts`, `sudo journalctl -u kubelet --since -5min --no-pager | grep '\"command failed\"' | tail -1`. Lỗi nói gì? Tìm trường của `/var/lib/kubelet/config.yaml` gây ra nó (so với `/var/lib/kubelet/config.yaml` của cka-w1: `diff <(ssh cka-w1 sudo cat …) <(sudo cat …)`, hay `grep -n` đường dẫn trong lỗi). Ghi `W2_FIELD=` (tên trường), sửa, `sudo systemctl restart kubelet`.",
      },
      {
        id: "t7",
        text: "Ba node Ready. Nếu đã quá 5 phút từ `begin`: `k get pod -A -o wide | grep -E 'Terminating|Pending'`, `k -n shop get pod -o wide`, postgres-0 ở đâu, gateway/catalog/order còn trải hai worker không? Trải lại bằng `k -n shop rollout restart deploy/<tên>` cho Deployment nào cần. Thêm mục `## s48 …` vào `~/notes/runbook.md` (triệu chứng, nguyên nhân, lệnh: ≥ 3 dòng). Trên Mac: `./labs/lab verify cka s48` phải 5/5. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "`Ready=False` với message `container runtime is down` là kubelet đang nói; `Ready=Unknown` với `Kubelet stopped posting node status` là không ai nói. Hai câu đó dẫn tới hai unit khác nhau.",
      "`kubectl debug node` Pending không event (đo): Pod debug chỉ chạy được khi kubelet và runtime của chính node đó chạy. Muốn đọc tệp của node khi node hỏng: ssh.",
      "`failed to unmarshal TOML at row 109 column 29` (đo): TOML không có `True`, chỉ có `true`. `sed -n '109p' /etc/containerd/config.toml` rồi sửa đúng dòng đó; `python3 -c 'import tomllib; tomllib.load(open(\"/etc/containerd/config.toml\",\"rb\"))'` kiểm cú pháp trước khi restart.",
      "`journalctl -p err` chỉ còn `Failed to start containerd.service` (đo): log của containerd và kubelet nằm ở mức info dù nội dung là lỗi. Bỏ `-p err`, dùng grep.",
      "cka-w2: `validate CRI v1 runtime API for endpoint \"unix:///var/run/cri-dockerd.sock\"` là trường `containerRuntimeEndpoint`; `open /etc/kubernetes/pki/ca.pem: no such file or directory` không nêu tên trường: `sudo grep -n ca.pem /var/lib/kubelet/config.yaml`. Lần `begin` của bạn là một trong hai.",
      "Sửa config.yaml xong phải `systemctl restart kubelet`: kubelet chỉ đọc tệp đó lúc khởi động. Sửa config.toml xong phải restart containerd; containerd lên thì kubelet đang chạy tự nối lại, kubelet đang vòng crash thì lần chạy lại sau ≤ 10 giây sẽ lên.",
      "Verify dòng lõi đỏ `gateway: Pod Ready chỉ ở w1`: Pod bị evict sau 300 giây đã dồn về node lên trước. `k -n shop rollout restart deploy/gateway` (topologySpreadConstraints của chart trải lại).",
      "Verify dòng lõi đỏ `w1 đang cordon`: cordon node hỏng để \"cách ly\" không phải là sửa; `k uncordon`.",
    ],
    solution: `Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, containerd 2.2.1, sau \`apply\` s47 rồi \`begin cka s48\`); trường hỏng của cka-w2, tên Pod và giờ của bạn sẽ khác. Lệnh \`k\` chạy trên cka-cp, lệnh \`sudo\` trên worker ghi trong ngoặc.

**1. Hai node, hai kiểu NotReady**

\`\`\`bash
k get node
# cka-w1   NotReady   <none>   11d   v1.37.2
# cka-w2   NotReady   <none>   11d   v1.37.2
k describe node cka-w1 | grep -E 'Ready|MemoryPressure|DiskPressure|Taints'
# Taints:             node.kubernetes.io/not-ready:NoExecute
# MemoryPressure  False  …  KubeletHasSufficientMemory   kubelet has sufficient memory available
# DiskPressure    False  …  KubeletHasNoDiskPressure     kubelet has no disk pressure
# Ready           False  …  KubeletNotReady              container runtime is down
k describe node cka-w2 | grep -E 'Ready|Taints'
# Taints:             node.kubernetes.io/unreachable:NoExecute
# Ready           Unknown  …  NodeStatusUnknown          Kubelet stopped posting node status.
\`\`\`

cka-w1: kubelet còn báo, nó báo runtime chết. cka-w2: không ai báo. Áp lực tài nguyên bị loại (MemoryPressure, DiskPressure \`False\` trên cka-w1).

**2. kubectl debug node trên node hỏng runtime**

\`\`\`bash
k debug node/cka-w1 --image=busybox:1.37 -- true
# Creating debugging pod node-debugger-cka-w1-l4lqz with container debugger on node cka-w1.
k get pod node-debugger-cka-w1-l4lqz -o wide        # 0/1 Pending … cka-w1 (sau 20 giây vẫn vậy)
k get events --field-selector involvedObject.name=node-debugger-cka-w1-l4lqz   # No resources found
k delete pod node-debugger-cka-w1-l4lqz
\`\`\`

**3. cka-w1: containerd (ssh cka-w1)**

\`\`\`bash
systemctl status containerd | sed -n 3p
#      Active: activating (auto-restart) (Result: exit-code) since …
sudo journalctl -u containerd -p err --since -15min --no-pager | tail -2
# … systemd[1]: Failed to start containerd.service - containerd container runtime.
sudo journalctl -u containerd --since -15min --no-pager | grep -m1 'unmarshal TOML'
# … containerd: failed to unmarshal TOML at row 109 column 29: toml: incomplete number
sed -n '109p' /etc/containerd/config.toml
#             SystemdCgroup = True
sudo journalctl -u kubelet --since -2min --no-pager | grep -m1 'sanity check'
# … "Container runtime sanity check failed" err="rpc error: code = Unavailable desc = connection error: … dial unix /var/run/containerd/containerd.sock: connect: no such file or directory"
\`\`\`

\`W1_COMPONENT=containerd\`. Tình huống hỏng (t4) đo được: \`sudo systemctl restart kubelet\` lúc này thì kubelet thoát với \`"command failed" err="failed to run Kubelet: validate service connection: validate CRI v1 runtime API for endpoint \\"unix:///var/run/containerd/containerd.sock\\" …"\`, và 46 giây sau \`k describe node cka-w1\` cho \`Ready Unknown … Kubelet stopped posting node status.\`. Sửa:

\`\`\`bash
sudo sed -i '109s/= True/= true/' /etc/containerd/config.toml
sudo systemctl restart containerd
sudo crictl info | grep -A1 '"type": "RuntimeReady"'      # "status": true
\`\`\`

Node Ready ~15 giây sau khi sửa (đo; kubelet đang vòng crash tự lên ở lần chạy lại kế tiếp, không cần restart).

**4. Đọc tệp của node bằng kubectl debug node, và cgroup thật**

\`\`\`bash
k debug node/cka-w1 --image=busybox:1.37 -- grep cgroupDriver /host/var/lib/kubelet/config.yaml
k logs node-debugger-cka-w1-rvpdv                    # cgroupDriver: systemd
k delete pod node-debugger-cka-w1-rvpdv
sudo crictl inspect $(sudo crictl ps -q | head -1) | grep -m1 cgroupsPath     # (cka-w1)
#         "cgroupsPath": "kubepods-burstable-pod9bf3a66f_ca3c_4481_a78b_e89d8f831a96.slice:cri-containerd:a029b0c5…",
k get --raw /api/v1/nodes/cka-w1/proxy/configz | python3 -c 'import json,sys; print(json.load(sys.stdin)["kubeletconfig"]["evictionHard"])'
# {'imagefs.available': '15%', 'imagefs.inodesFree': '5%', 'memory.available': '100Mi', 'nodefs.available': '10%', 'nodefs.inodesFree': '5%'}
\`\`\`

\`NODE_DEBUG_CGROUP=systemd\`. Dạng \`<slice>:cri-containerd:<id>\` là cgroup driver systemd: khớp \`cgroupDriver: systemd\` của kubelet và \`SystemdCgroup = true\` của containerd. Hai bên lệch nhau là lỗi kinh điển khác của buổi cài cluster (s05). \`configz\` (qua apiserver, đọc cấu hình kubelet đang chạy) cho ngưỡng \`evictionHard\` mặc định: dưới 100Mi bộ nhớ trống hay 10% đĩa nodefs thì kubelet bật MemoryPressure/DiskPressure và tự evict Pod; \`df -h /var/lib/containerd /var/lib/kubelet\` và \`free -m\` trên node cho biết còn xa ngưỡng bao nhiêu.

**5. cka-w2: kubelet (ssh cka-w2)**

\`\`\`bash
systemctl show kubelet -p NRestarts -p SubState      # NRestarts=… SubState=auto-restart
sudo journalctl -u kubelet --since -5min --no-pager | grep '"command failed"' | tail -1
# lần begin này:  … "command failed" err="failed to run Kubelet: open /etc/kubernetes/pki/ca.pem: no such file or directory"
sudo grep -n ca.pem /var/lib/kubelet/config.yaml
# 9:    clientCAFile: /etc/kubernetes/pki/ca.pem
# lần begin khác: … "command failed" err="failed to run Kubelet: validate service connection: validate CRI v1 runtime API for endpoint \\"unix:///var/run/cri-dockerd.sock\\": … no such file or directory"
#                 → containerRuntimeEndpoint: unix:///var/run/cri-dockerd.sock
\`\`\`

\`W2_FIELD=clientCAFile\` (hay \`containerRuntimeEndpoint\`: đúng trường của lần \`begin\` của bạn). Sửa về \`/etc/kubernetes/pki/ca.crt\` (hay \`unix:///var/run/containerd/containerd.sock\`), \`sudo systemctl restart kubelet\`; node Ready vài giây sau.

**6. Sau 300 giây: Pod bị evict, trải lại**

Lần đo để sự cố kéo dài 8 phút trước khi sửa:

\`\`\`bash
k get pod -A -o wide | grep -E 'Terminating|Pending' | head -6
# kube-system   coredns-5b8b7df479-2rxzr     Terminating   … cka-w1
# shop          catalog-6b56c9c687-vhdkn     Pending       … <none>
# shop          postgres-0                   Terminating   … cka-w2
# …
k -n shop wait pod postgres-0 --for=condition=Ready --timeout=240s     # Running lại ~8 giây sau khi kubelet của cka-w2 chạy
k -n shop get pod -l 'app in (gateway,catalog,order)' -o wide           # cả sáu Pod trên cka-w1: node lên trước nhận hết
for d in gateway catalog order; do k -n shop rollout restart deploy/$d; done
for d in gateway catalog order; do k -n shop rollout status deploy/$d; done   # 42 giây, mỗi service một Pod trên mỗi worker
\`\`\`

CoreDNS dời sang cka-cp trong lúc đó (toleration control-plane) và ở lại đó: không sao, verify không đòi chỗ của CoreDNS. Rồi thêm mục \`## s48 — node NotReady: containerd và kubelet\` vào sổ tay: bảng hai dòng của phần Tư duy, hai nguyên nhân, lệnh đã dùng.

**Lời giải tự động** (\`labs/cka/sessions/s48/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve-cp.sh STEP=look\` (node, Conditions, thử debug node trên cka-w1), \`files/solve-node.sh\` trên từng worker (không biết trước node hỏng ở đâu: \`crictl info\` lỗi thì đọc dòng TOML từ journal và sửa đúng dòng đó; kubelet không chạy yên 12 giây thì đọc dòng \`"command failed"\` cuối cùng và sửa trường tương ứng), rồi \`STEP=fix\` (chờ Ready, debug node đọc cgroupDriver, postgres-0, \`rollout restart\` Deployment nào mất trải, answers.env, sổ tay). Đo: 1 phút 46 giây và 1 phút 38 giây (gồm ~1 phút gây sự cố), cả hai rồi verify 5/5.`,
    exam: {
      patterns: [
        "\"Node X NotReady, sửa để node Ready (thay đổi phải bền qua reboot)\" — `k describe node` (Conditions), ssh, `systemctl status kubelet containerd`, `journalctl -u …`, sửa tệp cấu hình, `systemctl enable --now`.",
        "\"kubelet trên node Y không chạy\" — `systemctl cat kubelet` (drop-in, `--config`), `/var/lib/kubelet/config.yaml` (containerRuntimeEndpoint, clientCAFile, staticPodPath, cgroupDriver), `/etc/default/kubelet`.",
        "\"Ghi lý do node Z NotReady / thành phần hỏng vào /opt/…\" — đọc message của condition Ready, phân biệt người báo tin và thủ phạm.",
        "\"Pod bị evict / Pending sau khi node hỏng\" — taint `not-ready`/`unreachable` NoExecute, 300 giây, `k get pod -A -o wide`, `rollout restart`.",
      ],
      timeTargetMin: 20,
      drills: [
        {
          text: "Trong 3 phút: node `cka-w1` NotReady, message `container runtime is down`. Tìm dòng lỗi và tệp cần sửa, không đoán.",
          timeLimitMin: 3,
          solution: "```bash\nssh cka-w1\nsystemctl status containerd | sed -n 3p\nsudo journalctl -u containerd --since -15min --no-pager | grep -iE 'toml|failed to|error' | tail -3\n```\nDòng `failed to unmarshal TOML at row N column M` chỉ đúng chỗ: `sed -n 'Np' /etc/containerd/config.toml`.",
        },
        {
          text: "Trong 2 phút: kubelet trên `cka-w2` khởi động lại liên tục. In dòng lỗi gốc và tên tệp cấu hình kubelet đang đọc.",
          timeLimitMin: 2,
          solution: "```bash\nsystemctl cat kubelet | grep -E 'config=|EnvironmentFile'\nsudo journalctl -u kubelet --since -5min --no-pager | grep '\"command failed\"' | tail -1\n```\n`--config=/var/lib/kubelet/config.yaml` (drop-in 10-kubeadm.conf). Lỗi `open <tệp>` không nêu tên trường: `grep -n <tệp> /var/lib/kubelet/config.yaml`.",
        },
      ],
    },
    tips: [
      "Đọc message của condition Ready trước khi ssh: `False … container runtime is down` và `Unknown … stopped posting` dẫn tới hai unit khác nhau.",
      "Đừng restart kubelet \"cho chắc\" khi runtime đang chết: kubelet mới sẽ không lên được và bạn mất luôn thông tin node đang báo.",
      "Sửa tệp cấu hình xong luôn kiểm cú pháp trước khi restart (`tomllib`, `python3 -c 'import yaml; …'`, `containerd config dump`), rồi `systemctl is-active` và `is-enabled`: đề hỏi trạng thái bền.",
      "Sau một sự cố node dài hơn 5 phút, nhìn lại Pod của workload quan trọng: chúng có thể đã dồn về một node hay nằm Pending.",
    ],
    outcome: {
      md: `Hai worker Ready, hai unit chạy và bật trên ba node, shop trải lại hai worker. Trên Mac:

\`\`\`bash
./labs/lab verify cka s48
\`\`\`

Năm dòng. **Tệp cấu hình:** \`/etc/containerd/config.toml\` và \`/var/lib/kubelet/config.yaml\` của cka-w1, cka-w2 giống bản tốt mà \`begin\` lưu lần đầu ở \`/root/.lab/st9-node/\` trên từng worker, so **nội dung đã nạp** (TOML, YAML) nên thêm comment hay đổi thứ tự khoá vẫn xanh. **Unit:** containerd và kubelet \`active\` (kubelet chạy liền ≥ 15 giây, không phải một lần khởi động sắp thoát) và \`enabled\` trên ba node (chỉ \`systemctl start containerd\` khi config.toml còn hỏng: đỏ cả hai dòng và dòng lõi, đo). **answers.env:** \`W1_COMPONENT=containerd\`, \`W2_FIELD\` đúng trường của lần \`begin\` này (ghi ở \`/root/.lab/st9-node/field\` của cka-w2), \`NODE_DEBUG_CGROUP\` bằng cgroupDriver thật của cka-w1 (đáp án sai cả ba: đỏ, đo). **Sổ tay:** heading chứa \`s48\` với ≥ 3 dòng. **Lõi khoẻ** (\`s46/files/core-facts.sh\`): ba node Ready và không cordon (cordon hai node hỏng: đỏ \`w1 đang cordon\`, đo), control plane, shop rollout xong và gateway/catalog/order ≥ 2 Pod Ready trên cả hai worker (sau evict mà không trải lại: đỏ \`gateway: Pod Ready chỉ ở w1\`, đo), postgres-0 Ready, cộng Mac \`:30180\`. Ngay sau \`begin\`: **0/5** trong 3 giây (đo).`,
      verifyOutput: "lab: kiểm s48\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~14 phút)\n  ✓ cka-w1, cka-w2: /etc/containerd/config.toml và /var/lib/kubelet/config.yaml như bản tốt\n  ✓ containerd và kubelet active, enabled trên ba node\n  ✓ answers.env: W1_COMPONENT, W2_FIELD, NODE_DEBUG_CGROUP\n  ✓ ~/notes/runbook.md có mục s48 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng\n  ✓ Lõi khoẻ: ba node Ready, không cordon; control plane; shop trải hai worker, postgres-0 Ready; Mac /api/products, /api/orders 200\n  → 5/5 đạt",
      projectDelta: "Node của cluster trở lại như cuối s47 (cấu hình containerd và kubelet như bản tốt, shop trải hai worker). Sổ tay có mục s48: bảng \"ai báo tin, ai là thủ phạm\" cho node NotReady.",
    },
    review: [
      { q: "Node NotReady với `Ready=False, KubeletNotReady, container runtime is down`. Bạn ssh vào và nhìn gì đầu tiên, vì sao không restart kubelet?", a: "kubelet còn sống và đang báo runtime chết: nhìn containerd (`systemctl status containerd`, `journalctl -u containerd`, `crictl info`). Restart kubelet lúc runtime chết thì kubelet mới thoát ngay ở bước kiểm CRI (`validate CRI v1 runtime API`), node chuyển `Unknown`, bạn mất người báo tin (đo)." },
      { q: "Vì sao `kubectl debug node/cka-w1` nằm Pending không event khi containerd của cka-w1 chết?", a: "Pod debug được ghim `nodeName: cka-w1` (không qua scheduler, nên không có event FailedScheduling) và chịu mọi taint; nhưng chính kubelet của cka-w1 phải tạo sandbox qua containerd của cka-w1. Runtime chết thì không ai tạo được container. `kubectl debug node` là cách vào node khoẻ không có ssh, không phải cách vào node hỏng runtime." },
      { q: "containerd của cka-w1 chết. Container đang chạy trên node đó có chết theo không, và chuyện gì xảy ra sau 300 giây?", a: "Không chết ngay: unit containerd có `KillMode=process`, chỉ tiến trình containerd bị dừng, các `containerd-shim` và container ở lại (đo: `Unit process … (containerd-shim) remains running after unit stopped`). Nhưng không ai quản lý chúng nữa. Node NotReady mang taint `not-ready:NoExecute`; Pod thường chịu taint đó 300 giây, hết hạn thì bị evict: Pod cũ `Terminating` (kubelet không xác nhận được vì không nói chuyện được với runtime), ReplicaSet tạo Pod mới `Pending` hay trên node khác (đo)." },
      { q: "`journalctl -u containerd -p err` chỉ ra `Failed to start containerd.service`. Vì sao không thấy lỗi TOML?", a: "containerd ghi log ra stderr và journald xếp ở mức info; `-p err` chỉ giữ dòng mức err trở lên, tức các dòng của chính systemd. Lý do nằm trong log đầy đủ: bỏ `-p err`, grep `unmarshal TOML` hay `level=error`." },
      { q: "So sánh một service Spring không lên vì `-Xmx2gb` với kubelet không lên vì `clientCAFile` trỏ tệp không có.", a: "Cả hai là lỗi cấu hình đọc lúc khởi động: tiến trình thoát mã 1 với một dòng nói đúng tham số (`Invalid maximum heap size`, `open /etc/kubernetes/pki/ca.pem: no such file`), restart bao nhiêu lần cũng vậy (`Restart=always` chỉ làm vòng lặp chạy mãi). Sửa ở tệp cấu hình hay cờ, rồi khởi động lại một lần; đọc dòng lỗi đầu tiên của lần chạy gần nhất, không phải dòng cuối." },
    ],
  },
  {
    id: "s49",
    stage: "st9",
    title: "Sự cố control plane: apiserver, scheduler, controller-manager",
    durationMin: 90,
    domain: "troubleshooting",
    competencies: ["ts-components"],
    requires: ["s48"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa apiserver lên lại trong 15 phút khi manifest có một cờ hỏng không nhìn thấy bằng mắt, chỉ bằng crictl, log trên đĩa và cat -A, sau khi đã sao lưu manifest ra ngoài thư mục manifests/.",
      "Nhận ra scheduler hỏng (Pod Pending không event) và controller-manager hỏng (Deployment không có ReplicaSet) từ triệu chứng của workload, rồi sửa cả hai trong 15 phút nữa.",
      "Biết kubelet nạp lại static pod sau bao lâu và kiểm control plane bằng /livez?verbose, ss -lntp trước khi tuyên bố đã xong.",
    ],
    skills: [
      { skill: "k-apiserver-down-flow", level: "Dưới 10 phút" },
      { skill: "k-pod-log-files", level: "Biết đường dẫn không tra" },
      { skill: "k-apiserver-livez", level: "Gõ được có tra" },
      { skill: "k-cp-symptoms", level: "Nhận ra trong 1 phút" },
      { skill: "k-manifest-backup", level: "Thành phản xạ" },
    ],
    uses: ["k-static-pod-dir", "k-crictl-logs", "k-crictl-ps", "net-ss-listen", "vim-show-whitespace"],
    foundation: null,
    mindset: `**kubectl chết thì xuống một tầng.** kubectl chỉ là một client của apiserver; khi nó báo \`The connection to the server 192.168.252.35:6443 was refused\` (đo), mọi lệnh \`k\` đều vô dụng, kể cả \`k logs\` của chính apiserver. Control plane của kubeadm là **static pod**: kubelet trên cka-cp đọc \`/etc/kubernetes/manifests/\` và tự chạy chúng qua containerd, không cần apiserver. Vì vậy đi xuống đúng các tầng đó:

| Tầng | Câu hỏi | Lệnh (trên cka-cp) |
|---|---|---|
| Cổng | Có ai nghe 6443, 10259 (scheduler), 10257 (controller-manager), 2379 (etcd)? | \`sudo ss -lntp \\| grep -E '6443\\|10259\\|10257\\|2379'\` |
| Runtime | Container có chạy, thoát mấy lần, mã gì? | \`sudo crictl ps -a --name kube-apiserver\`, \`sudo crictl inspect <id>\` |
| Log container | Lần chạy vừa rồi nói gì trước khi chết? | \`sudo crictl logs <id>\` |
| Log trên đĩa | Còn đọc được khi container đã bị dọn | \`sudo sh -c 'tail /var/log/pods/kube-system_kube-apiserver-cka-cp_*/kube-apiserver/*.log'\` |
| kubelet | Manifest có đọc được không, có Pod nào trùng tên? | \`sudo journalctl -u kubelet --since -5min\`, \`ls -la /etc/kubernetes/manifests\` |

Giống đọc một service Spring không trả lời: HTTP chết thì xem tiến trình JVM còn không (\`ps\`, \`ss -lntp\`), rồi log trên đĩa của lần khởi động vừa rồi (dòng \`APPLICATION FAILED TO START\`, \`Caused by\`), không ngồi gọi lại endpoint đã chết. Trên lab: \`/var/log/pods\` chỉ root đọc được, nên glob phải chạy **trong** \`sudo sh -c '…'\` (gõ \`sudo ls /var/log/pods/kube-system_kube-apiserver-*\` thì shell của bạn mở glob trước, không thấy gì, đo). Mỗi lần manifest đổi là một Pod mới với UID mới: có hai thư mục \`kube-system_kube-apiserver-cka-cp_<uid>\`, cái mới hơn là của bản hỏng.

**Cờ trông đúng mà sai.** Lỗi của apiserver trong buổi này là \`Error: unknown flag: --<cờ> \` (đo) cho một cờ có thật của kubeadm: tên cờ đúng từng chữ, nhưng giữa tên và dấu \`=\` có một ký tự NBSP (U+00A0) mà \`cat\` và vim mặc định hiển thị như khoảng trắng. \`cat -A\` in nó thành \`M-BM- \`, \`:set list\` (với \`listchars\` có \`nbsp:+\`) in \`+\`. Đây là lỗi dán từ trình duyệt hay từ tài liệu. Cùng họ với NBSP trong \`JAVA_OPTS\` ở s16, nhưng ở đây không có Events hay \`describe\` nào để đọc.

**Sao lưu ra ngoài manifests/, trước khi sửa.** kubelet chạy **mọi** tệp trong \`staticPodPath\` không bắt đầu bằng dấu chấm, kể cả \`kube-apiserver.yaml.bak\`. Đo: để bản sao hỏng \`kube-apiserver.yaml.bak\` trong manifests/ rồi sửa \`kube-apiserver.yaml\` thì 4 phút sau kubectl vẫn \`connection refused\` và \`crictl logs\` vẫn \`unknown flag\`: hai tệp sinh hai Pod cùng tên \`kube-apiserver-cka-cp\`, bản hỏng thắng. Dời \`.bak\` đi: \`/readyz\` ok sau 8 giây. Chỗ đúng là \`~/drills/s49/backup/\` (hay \`/root/\`), chép **trước** khi chạm vào tệp.

**Chờ kubelet nạp lại, đừng restart lung tung.** kubelet đọc lại thư mục manifests ~20 giây một lần; manifest đổi nội dung là Pod mới, không chờ back-off. Đo: sửa xong apiserver, \`/readyz\` ok sau 14–17 giây; sửa xong scheduler và controller-manager, cả bốn static pod Ready sau 24 giây.

**Apiserver lên rồi, ai còn hỏng? Đọc triệu chứng của workload.**

| Thành phần hỏng | Triệu chứng (đo) | Vì sao |
|---|---|---|
| scheduler | Pod mới \`Pending\`, \`NODE <none>\`, **Events: <none>** | không ai gán \`nodeName\`, cũng không ai báo \`FailedScheduling\` |
| controller-manager | Deployment \`0/2\`, \`UP-TO-DATE 0\`, không có ReplicaSet; namespace mới không có ServiceAccount \`default\` (\`k run\` lỗi \`serviceaccount "default" not found\`) | Deployment, ReplicaSet, ServiceAccount controller đều chạy trong controller-manager |

Bẫy: \`k -n kube-system get pod\` có lúc cho \`kube-controller-manager-cka-cp 1/1 Running\` (đo): nó chạy ~20 giây, chờ giành leader lease, rồi mới đọc \`--root-ca-file\` và thoát. Nhìn cột RESTARTS, \`crictl ps -a\` (nhiều container Exited), và triệu chứng, không nhìn một lần chữ Running.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 8 — Control plane hỏng", href: "#/roadmap/cka/cka-w8-2" },
      { label: "CKA Study Guide, chương 22 — Xử lý sự cố cluster", href: "#/docs/ckabook-22" },
      { label: "kubernetes.io: Troubleshooting Clusters — control plane", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
      { label: "kubernetes.io: Create static Pods", href: "https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/" },
      { label: "kubernetes.io: Kubernetes API health endpoints (/livez, /readyz)", href: "https://kubernetes.io/docs/reference/using-api/health-checks/" },
      { label: "kubernetes.io: Debugging Kubernetes nodes with crictl", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/" },
      { label: "kubernetes.io: Ports and Protocols", href: "https://kubernetes.io/docs/reference/networking/ports-and-protocols/" },
    ],
    stateIn: "Đầu ra s48 (ba node Ready, containerd và kubelet như bản tốt, shop trải hai worker, sổ tay có mục s48). Trên Mac chạy `./labs/lab begin cka s49`: kiểm đầu vào bằng check.sh riêng, **không cần apiserver** (tệp cấu hình và unit của ba node, answers.env và mục s48, etcd phục vụ), xoá answers.env và ~/drills/s49/backup/ cũ rồi **gây sự cố** (đo 33 giây; chạy lại `begin` khi apiserver còn hỏng từ lần trước: dời tệp thừa khỏi manifests/, cài lại bản tốt bằng tệp, chờ ba thành phần chạy rồi gây lại, đo 73 giây; ngay sau khi VM bật lại 3 phút 11 giây): \"sau một lần dọn dẹp cka-cp, kubectl báo connection refused\". Bấm giờ 15 phút cho apiserver, 15 phút cho phần còn lại.",
    stateOut: "kube-apiserver, kube-scheduler, kube-controller-manager chạy đúng manifest gốc (nội dung như bản tốt), /etc/kubernetes/manifests chỉ có bốn manifest; Pod mới được xếp lịch, Deployment tạo ReplicaSet bình thường; ~/drills/s49/backup/ có bản chép manifest lúc sự cố; ~/drills/s49/answers.env (APISERVER_BAD_FLAG, SCHEDULER_SYMPTOM, CM_SYMPTOM); mục s49 trong ~/notes/runbook.md.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s49`. Bấm giờ 15 phút. Trên cka-cp: `k get node` (đọc đúng thông báo lỗi), `sudo ss -lntp | grep -E '6443|10259|10257|2379'`. Cổng nào có người nghe, cổng nào không?",
      },
      {
        id: "t2",
        text: "Một tầng xuống: `sudo crictl ps -a --name kube-apiserver` (ATTEMPT, STATE), `sudo crictl logs <id của container Exited mới nhất>`, rồi `sudo sh -c 'ls -t /var/log/pods/ | head; tail -n2 /var/log/pods/kube-system_kube-apiserver-cka-cp_*/kube-apiserver/*.log'`. Có mấy thư mục của kube-apiserver, vì sao? Lỗi nói cờ nào?",
      },
      {
        id: "t3",
        text: "**Trước khi sửa:** `mkdir -p ~/drills/s49/backup && sudo cp /etc/kubernetes/manifests/kube-{apiserver,scheduler,controller-manager}.yaml ~/drills/s49/backup/`. Tình huống hỏng (đọc, đừng làm): một đồng nghiệp làm `cp kube-apiserver.yaml kube-apiserver.yaml.bak` ngay trong manifests/ rồi sửa tệp chính. Theo phần Tư duy, apiserver có lên không?",
      },
      {
        id: "t4",
        text: "Cờ trong lỗi có thật và đánh vần đúng. `sudo grep -n -- '--<cờ>' /etc/kubernetes/manifests/kube-apiserver.yaml | cat -A`, hay mở bằng `sudo vim` rồi `:set list`. Ký tự lạ ở đâu? Ghi `APISERVER_BAD_FLAG=` (tên cờ) vào `~/drills/s49/answers.env`. Sửa (xoá ký tự đó, gõ lại dấu cách nếu cần), lưu, rồi bấm giờ: `until [ \"$(k get --raw /readyz 2>/dev/null)\" = ok ]; do sleep 2; done`. Bao nhiêu giây?",
      },
      {
        id: "t5",
        text: "Apiserver lên. `k run p49 --image=busybox:1.37 -- sleep 600`, chờ 15 giây, `k get pod p49 -o wide`, `k describe pod p49 | tail -3`. Pod ở đâu, có event không? `k -n kube-system get pod -l tier=control-plane` (cột RESTARTS). Ghi `SCHEDULER_SYMPTOM=`. `sudo crictl logs` container scheduler vừa thoát: tệp nào không có? Sửa manifest scheduler.",
      },
      {
        id: "t6",
        text: "`k create deploy d49 --image=busybox:1.37 --replicas=1 -- sleep 600`, `k scale deploy d49 --replicas=2`, `k get deploy,rs -l app=d49`. Có ReplicaSet không? Thử `k create ns t49 && k -n t49 run x --image=busybox:1.37 -- sleep 60`: lỗi gì? Ghi `CM_SYMPTOM=` (một câu mô tả triệu chứng, trong dấu nháy). Tìm lỗi của controller-manager (`crictl ps -a`, `crictl logs` của container Exited, có thể phải chờ ~20 giây), sửa manifest.",
      },
      {
        id: "t7",
        text: "Chờ bốn static pod Ready (`k -n kube-system get pod -l tier=control-plane -w`), `k get --raw '/livez?verbose' | tail -3` và `curl -k https://localhost:6443/livez?verbose | tail -3`, `sudo ss -lntp | grep -E '6443|10259|10257'`. p49 và d49 đã chạy chưa? Xoá p49, d49, t49. `ls /etc/kubernetes/manifests` chỉ còn bốn tệp. Thêm mục `## s49 …` vào sổ tay (≥ 3 dòng). Trên Mac: `./labs/lab verify cka s49` phải 6/6. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "`connection refused` là không ai nghe cổng đó (apiserver không chạy); `timeout` hay `TLS handshake timeout` mới là có người nghe mà không trả lời. `ss -lntp` trả lời câu đó trong một giây.",
      "`crictl ps` chỉ in container đang chạy; container thoát ngay chỉ thấy với `-a`. Lấy id của dòng Exited mới nhất (ATTEMPT lớn nhất) cho `crictl logs`.",
      "`sudo ls /var/log/pods/kube-system_kube-apiserver-*` báo không có tệp (đo): glob được mở bởi shell của bạn, mà bạn không đọc được /var/log/pods. Chạy cả câu trong `sudo sh -c '…'` hay `sudo -i`.",
      "`Error: unknown flag: --client-ca-file ` mà manifest có đúng `--client-ca-file=…`: có ký tự lạ giữa tên và `=`. `cat -A` in `M-BM- ` cho NBSP (đo); trong vim `:set list` cần `listchars` có `nbsp:+` (s16).",
      "Sửa xong mà kubectl vẫn refused sau một phút: `ls -la /etc/kubernetes/manifests` có tệp thừa không (`.bak`, bản sao), YAML có đọc được không (`sudo journalctl -u kubelet --since -2min | grep -i manifest`).",
      "Pod Pending mà `describe` không có event nào: không phải thiếu tài nguyên (đó là `FailedScheduling`), mà không có scheduler. `stat /etc/kubernetes/scheduler.config: no such file or directory` (đo): đọc kỹ đuôi tệp.",
      "controller-manager trông `1/1 Running` một lúc rồi thoát: nó chờ leader lease ~20 giây mới dựng controller. Lỗi `error parsing root-ca-file at /etc/kubernetes/pki/ca.cert` (đo) chỉ có trong log của container đã thoát.",
      "Verify dòng backup đỏ `backup không phải bản lúc sự cố`: bạn chép sau khi sửa, hay chép bản tốt từ đâu đó. Bản sao lưu phải là thứ bạn thấy lúc sự cố; làm lại buổi thì `begin` lại.",
    ],
    solution: `Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, sau \`apply\` s48 rồi \`begin cka s49\`); cờ hỏng của bạn có thể khác (một trong sáu cờ), id container và giờ khác. Mọi lệnh chạy trên cka-cp.

**1. kubectl chết: cổng và container**

\`\`\`bash
k get node
# The connection to the server 192.168.252.35:6443 was refused - did you specify the right host or port?
sudo ss -lntp | grep -E '6443|10259|10257|2379'
# LISTEN … 192.168.252.35:2379 … users:(("etcd",…))
# LISTEN … 127.0.0.1:2379      … users:(("etcd",…))
# LISTEN … 127.0.0.1:10257     … users:(("kube-controller",…))
#   (6443 không ai nghe; 10259 lúc có lúc không: scheduler đang vòng crash)
sudo crictl ps -a --name 'kube-(apiserver|scheduler|controller-manager)'
# … Exited    kube-scheduler            0   …
# … Running   kube-controller-manager   0   …
# … Exited    kube-apiserver            2   …
\`\`\`

**2. Log của lần chạy vừa chết, và log trên đĩa**

\`\`\`bash
sudo crictl logs $(sudo crictl ps -a -q --name '^kube-apiserver$' --state exited | head -1) 2>&1 | cat -A
# Error: unknown flag: --client-ca-fileM-BM- $
sudo sh -c 'ls -d /var/log/pods/kube-system_kube-apiserver-*; tail -n1 /var/log/pods/kube-system_kube-apiserver-cka-cp_*/kube-apiserver/*.log'
# /var/log/pods/kube-system_kube-apiserver-cka-cp_6a4338a124af6d80e97a40136bdf2ed8
# /var/log/pods/kube-system_kube-apiserver-cka-cp_b28c42db89fcd7dfb3d5a84d4356dafa
# 2026-11-25T01:45:38.315867138+07:00 stderr F Error: unknown flag: --client-ca-file
\`\`\`

Hai thư mục: UID của static pod tính từ nội dung manifest, manifest đổi là Pod mới. Không có \`cat -A\` thì dòng lỗi trông như cờ đúng kèm một dấu cách thừa.

**3. Sao lưu trước, rồi nhìn ký tự lạ**

\`\`\`bash
mkdir -p ~/drills/s49/backup
sudo cp /etc/kubernetes/manifests/kube-{apiserver,scheduler,controller-manager}.yaml ~/drills/s49/backup/
sudo grep -n -- '--client-ca-file' /etc/kubernetes/manifests/kube-apiserver.yaml | cat -A
# 18:    - --client-ca-fileM-BM- =/etc/kubernetes/pki/ca.crt$
sudo sed -i 's/\\xc2\\xa0//g' /etc/kubernetes/manifests/kube-apiserver.yaml      # hay vim: :set list, xoá ký tự +
until [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; do sleep 2; done            # 14 giây (đo)
\`\`\`

\`APISERVER_BAD_FLAG=--client-ca-file\`.

**4. scheduler: Pod Pending không event**

\`\`\`bash
k run s49-probe --image=busybox:1.37 --restart=Never -- sleep 300; sleep 15
k get pod s49-probe -o jsonpath='{.status.phase} node={.spec.nodeName}{"\\n"}'      # Pending node=
k get events --field-selector involvedObject.name=s49-probe                       # No resources found
k -n kube-system get pod -l tier=control-plane
# kube-controller-manager-cka-cp   1/1     Running            0             4m13s
# kube-scheduler-cka-cp            0/1     CrashLoopBackOff   0             4m27s
sudo crictl logs $(sudo crictl ps -a -q --name '^kube-scheduler$' --state exited | head -1) 2>&1 | tail -1
# E1124 18:45:15.549482  1 run.go:72] "command failed" err="stat /etc/kubernetes/scheduler.config: no such file or directory"
sudo grep -n scheduler.config /etc/kubernetes/manifests/kube-scheduler.yaml       # 16:    - --kubeconfig=/etc/kubernetes/scheduler.config
sudo sed -i 's#--kubeconfig=/etc/kubernetes/scheduler.config#--kubeconfig=/etc/kubernetes/scheduler.conf#' /etc/kubernetes/manifests/kube-scheduler.yaml
\`\`\`

\`SCHEDULER_SYMPTOM=Pending\`. Để ý controller-manager đang \`1/1 Running\` ở đây: nó chưa chết, chỉ đang chờ leader lease.

**5. controller-manager: Deployment không có ReplicaSet**

\`\`\`bash
k create deploy s49-scale --image=busybox:1.37 --replicas=1 -- sleep 300
k scale deploy s49-scale --replicas=2; sleep 10; k get deploy,rs -l app=s49-scale
# deployment.apps/s49-scale   0/2     0            0           11s          (không có dòng ReplicaSet nào)
k create ns t49 && k -n t49 run x --image=busybox:1.37 -- sleep 60
# Error from server (Forbidden): pods "x" is forbidden: error looking up service account t49/default: serviceaccount "default" not found
for id in $(sudo crictl ps -a -q --name '^kube-controller-manager$'); do sudo crictl logs $id 2>&1 | grep -m1 'Error building controllers'; done
# E1124 18:46:10.464042  1 controllermanager.go:278] "Error building controllers" err="error parsing root-ca-file at /etc/kubernetes/pki/ca.cert: open /etc/kubernetes/pki/ca.cert: no such file or directory"
sudo sed -i 's#--root-ca-file=/etc/kubernetes/pki/ca.cert#--root-ca-file=/etc/kubernetes/pki/ca.crt#' /etc/kubernetes/manifests/kube-controller-manager.yaml
\`\`\`

\`CM_SYMPTOM="Deployment scale lên 2 mà không có ReplicaSet nào, không có Pod mới"\`.

**6. Kiểm trước khi tuyên bố xong**

\`\`\`bash
k -n kube-system get pod -l tier=control-plane          # bốn dòng 1/1 Running sau 24 giây (đo)
k get --raw '/livez?verbose' | tail -3
# [+]poststarthook/apiservice-openapi-controller ok
# [+]poststarthook/apiservice-openapiv3-controller ok
# livez check passed
curl -sk https://localhost:6443/livez?verbose | tail -1                # livez check passed (không cần cert: /livez mở cho mọi người)
curl -sk -o /dev/null -w '%{http_code}\\n' https://localhost:6443/livez   # 200
k get pod s49-probe -o wide; k get pod -l app=s49-scale -o wide      # Running trên cka-w2; hai Pod, cka-w1 và cka-w2
k delete pod s49-probe; k delete deploy s49-scale; k delete ns t49
ls /etc/kubernetes/manifests                                         # etcd.yaml kube-apiserver.yaml kube-controller-manager.yaml kube-scheduler.yaml
\`\`\`

Rồi thêm mục \`## s49 — control plane: apiserver, scheduler, controller-manager\` vào sổ tay: bảng tầng của phần Tư duy, ba nguyên nhân, luật sao lưu.

**Lời giải tự động** (\`labs/cka/sessions/s49/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve.sh\` đi đúng bước 1–6 (cờ đọc từ \`crictl logs\` của container apiserver đã thoát, sao lưu ba manifest trước khi sửa, xoá NBSP bằng \`sed\`, đường dẫn sai của scheduler và controller-manager đọc từ log rồi sửa đúng dòng đó, chờ bốn static pod, \`/livez?verbose\`, thử lại một Pod và một Deployment), ghi answers.env và mục s49 của sổ tay nếu chưa có. Đo: 3 phút 10 giây và 1 phút 57 giây, cả hai rồi verify 6/6.`,
    exam: {
      patterns: [
        "\"Sau khi sửa kube-apiserver.yaml, kubectl không kết nối được; sửa\" — `crictl ps -a`, `crictl logs`, `/var/log/pods/`, `cat -A` hay `:set list`, sao lưu trước khi sửa, chờ kubelet nạp lại.",
        "\"Pod mới trong namespace X ở Pending mãi\" — không có event nào thì nhìn scheduler (`k -n kube-system get pod`, `crictl logs`), có `FailedScheduling` thì nhìn tài nguyên, taint, affinity.",
        "\"Deployment Y không tạo Pod khi scale\" — `k get rs`, controller-manager (log, cờ trong manifest), ServiceAccount của namespace.",
        "\"Kiểm sức khoẻ control plane và ghi kết quả vào /opt/…\" — `k get --raw '/livez?verbose'`, `/readyz?verbose`, `curl -k https://localhost:6443/livez`.",
      ],
      timeTargetMin: 30,
      drills: [
        {
          text: "Trong 3 phút: kubectl `connection refused`. In dòng lỗi của lần chạy gần nhất của kube-apiserver mà không dùng kubectl, hai cách.",
          timeLimitMin: 3,
          solution: "```bash\nsudo crictl logs $(sudo crictl ps -a -q --name '^kube-apiserver$' | head -1) 2>&1 | tail -3\nsudo sh -c 'tail -n3 $(ls -t /var/log/pods/kube-system_kube-apiserver-*/kube-apiserver/*.log | head -1)'\n```\nThêm `| cat -A` khi dòng lỗi trông đúng.",
        },
        {
          text: "Trong 2 phút: Pod mới Pending không event. Chứng minh trong một lệnh rằng scheduler không chạy, không dùng `get pod -n kube-system`.",
          timeLimitMin: 2,
          solution: "```bash\nsudo ss -lntp | grep 10259 || echo 'không ai nghe 10259: kube-scheduler không chạy'\n```\nHay `sudo crictl ps --name kube-scheduler` (rỗng), `crictl ps -a` thấy Exited.",
        },
      ],
    },
    tips: [
      "Phản xạ trước mọi sửa static pod: `sudo cp /etc/kubernetes/manifests/<tệp> /root/` (hay một thư mục bạn chọn), **không bao giờ** chép vào chính manifests/.",
      "Sửa xong, đếm 20–30 giây trước khi kết luận \"vẫn hỏng\"; rồi mới đọc lại `crictl ps -a` và log. Đừng restart kubelet để \"ép\" nạp lại.",
      "Lỗi kiểu `unknown flag` mà cờ trông đúng: nghĩ ngay tới ký tự vô hình, `cat -A`.",
      "Xong control plane chưa phải xong: tạo một Pod và một Deployment thử, xem được xếp lịch và có ReplicaSet, rồi dọn.",
    ],
    outcome: {
      md: `Control plane chạy đúng manifest gốc và workload mới được xếp lịch. Trên Mac:

\`\`\`bash
./labs/lab verify cka s49
\`\`\`

Sáu dòng, so với bản tốt và mốc mà \`begin\` lưu ở \`/root/.lab/st9-cp/\`. **Manifest:** ba tệp giống bản tốt theo **nội dung YAML đã nạp** (viết lại cả tệp với khoá xếp theo thứ tự khác và thêm comment: vẫn xanh, đo), và manifests/ không có tệp thừa ngoài bốn manifest (tệp bắt đầu bằng dấu chấm thì kubelet bỏ qua; \`kube-apiserver.yaml.bak\` trong đó: đỏ \`thừa trong manifests/: kube-apiserver.yaml.bak\`, đo). **Xếp lịch:** một Deployment tạm 2 replica trong namespace tạm \`lab-verify-s49-…\` đạt 2 Pod Ready trong 90 giây (sửa apiserver mà chừa scheduler và controller-manager: đỏ \`sau 90 giây Deployment tạm không có ReplicaSet\`, đo). **Sao lưu:** \`~/drills/s49/backup/kube-apiserver.yaml\` có sha256 bằng bản hỏng lúc \`begin\` (chép bản tốt vào đó: đỏ, đo). **answers.env:** đúng cờ của lần \`begin\` này (cờ khác: đỏ, đo), \`SCHEDULER_SYMPTOM\` chứa \`Pending\`, \`CM_SYMPTOM\` chứa \`replica\`. **Sổ tay:** heading chứa \`s49\`. **Lõi khoẻ:** bốn static pod Running, etcd từ \`/var/lib/etcd-restore\`, \`/readyz\`, ba node, shop trải hai worker, postgres-0. Verify không treo khi apiserver còn chết: hỏi etcd trước, chờ \`/readyz\` có giới hạn. Ngay sau \`begin\`: **0/6** trong 63 giây; ngay sau khi VM bật lại giữa sự cố 1/6 trong 4 phút 13 giây (đo).`,
      verifyOutput: "lab: kiểm s49\n  (chờ etcd, apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)\n  ✓ Ba manifest (apiserver, scheduler, controller-manager) như bản tốt; /etc/kubernetes/manifests không có tệp thừa\n  ✓ Deployment tạm 2 replica được xếp lịch và sẵn sàng trong 90 giây (scheduler, controller-manager làm việc)\n  ✓ ~/drills/s49/backup/kube-apiserver.yaml là bản chép TRƯỚC khi sửa (sha256 bằng bản hỏng)\n  ✓ answers.env: APISERVER_BAD_FLAG, SCHEDULER_SYMPTOM, CM_SYMPTOM\n  ✓ ~/notes/runbook.md có mục s49 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng\n  ✓ Lõi khoẻ: bốn static pod Running, etcd từ /var/lib/etcd-restore, /readyz; ba node; shop trải hai worker, postgres-0\n  → 6/6 đạt",
      projectDelta: "Control plane trở lại như cuối s48. Sổ tay có mục s49: khi kubectl chết thì xuống tầng nào, và luật sao lưu manifest ra ngoài manifests/.",
    },
    review: [
      { q: "kubectl báo `connection refused` tới :6443. Ba lệnh đầu tiên của bạn trên cka-cp là gì, theo thứ tự nào?", a: "`sudo ss -lntp | grep 6443` (có ai nghe không), `sudo crictl ps -a --name kube-apiserver` (container có chạy, thoát mấy lần), `sudo crictl logs <id Exited mới nhất>` (vì sao). Log trên đĩa `/var/log/pods/kube-system_kube-apiserver-…/` khi container đã bị dọn; `journalctl -u kubelet` khi không có container nào (manifest không đọc được)." },
      { q: "Vì sao để `kube-apiserver.yaml.bak` trong /etc/kubernetes/manifests làm hỏng việc sửa?", a: "kubelet chạy mọi tệp trong staticPodPath trừ tệp bắt đầu bằng dấu chấm, không quan tâm đuôi. Hai tệp định nghĩa cùng Pod `kube-apiserver` trên cka-cp; đo trên lab: bản hỏng trong `.bak` thắng, 4 phút sau khi sửa tệp chính vẫn `connection refused`. Sao lưu ra ngoài thư mục đó." },
      { q: "Pod mới Pending, `describe` không có event nào. Pod khác Pending với `FailedScheduling: 0/3 nodes are available`. Khác nhau thế nào?", a: "`FailedScheduling` là scheduler đang chạy, đã xét và không tìm được node (tài nguyên, taint, affinity, nodeSelector). Không có event nào là không ai xét: scheduler không chạy (đo: `stat /etc/kubernetes/scheduler.config: no such file or directory`, CrashLoopBackOff) hay Pod dùng `schedulerName` không tồn tại." },
      { q: "Deployment scale lên mà không có Pod mới, `k get rs` rỗng, và `k -n t49 run` báo `serviceaccount \"default\" not found`. Thành phần nào hỏng, vì sao một triệu chứng ở namespace mới?", a: "kube-controller-manager: Deployment controller (tạo ReplicaSet), ReplicaSet controller (tạo Pod) và ServiceAccount controller (tạo SA `default` cho namespace mới) đều chạy trong nó. Namespace mới không có SA nên admission từ chối Pod. Nó có thể trông `1/1 Running` một lúc vì chờ leader lease rồi mới đọc cấu hình và thoát." },
      { q: "So sánh đọc sự cố control plane với đọc sự cố một ứng dụng Spring theo tầng.", a: "Cùng một cách: endpoint chết (kubectl/HTTP) thì không gọi lại nó, mà xuống tầng tiến trình (crictl ps/ps, ss -lntp), rồi log của lần khởi động vừa chết (crictl logs, /var/log/pods/ như log tệp của Spring), tìm dòng đầu tiên nói vì sao (`unknown flag`, `APPLICATION FAILED TO START`). Sửa cấu hình, chờ tiến trình được chạy lại (kubelet ~20 giây), rồi kiểm từ ngoài vào (/livez, một request thật)." },
    ],
  },
  {
    id: "s50",
    stage: "st9",
    title: "Sự cố etcd, chứng chỉ và kubeconfig",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-components"],
    requires: ["s49"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa apiserver lên lại trong 20 phút khi một cờ --etcd-* trỏ tệp của CA khác: đọc lỗi TLS trong crictl logs, chứng minh etcd vẫn khoẻ bằng etcdctl endpoint status và health, so ba cờ với các tệp trong pki/ bằng openssl.",
      "Nhận ra một kubeconfig bị Unauthorized vì cert hết hạn: tìm lý do ở log của apiserver, tách cert khỏi kubeconfig bằng jsonpath + base64 -d, đọc notAfter, rồi cấp cert mới qua CSR và nhúng lại thay vì chỉnh giờ.",
      "Đọc mọi lỗi x509 bằng ba câu hỏi: cert nào, CA nào, giờ nào; nối được với PKIX path building failed của Java.",
    ],
    skills: [
      { skill: "k-cert-expired", level: "Nhận ra trong 30 giây" },
      { skill: "k-etcd-endpoint-status", level: "Gõ được có tra" },
      { skill: "k-kubeconfig-cert-enddate", level: "Gõ được có tra" },
      { skill: "k-apiserver-etcd-flags", level: "Biết cờ nào trỏ tệp nào" },
    ],
    uses: ["k-etcd-certs", "lx-openssl-x509", "k-certs-renew", "k-etcd-health", "k-kubeconfig-structure"],
    foundation: {
      area: "linux",
      md: `**Đọc một cert mà không cần công cụ của Kubernetes.** Ba lệnh \`openssl\` và một \`base64 -d\` là đủ cho mọi câu hỏi của buổi này; trên lab không có \`yq\` (đo: \`which yq\` rỗng), nên tách dữ liệu khỏi kubeconfig bằng jsonpath của kubectl.

**1. Ai là ai, hạn tới bao giờ.**

\`\`\`bash
openssl x509 -in /etc/kubernetes/pki/etcd/server.crt -noout -subject -issuer -dates
# subject=CN = cka-cp
# issuer=CN = etcd-ca
openssl x509 -in cert.pem -noout -checkend 3600 && echo "còn ≥ 1 giờ" || echo "hết hạn hay sắp hết"
\`\`\`

\`subject\` là cert này nói nó là ai; \`issuer\` là ai ký nó. Một CA tự ký có \`subject = issuer\`. \`-checkend N\` trả mã 0 khi cert còn hạn ít nhất N giây nữa: dùng được trong \`if\`.

**2. Cert nằm trong kubeconfig.** Trường \`client-certificate-data\` là PEM đã base64 (nên bắt đầu bằng \`LS0tLS1CRUdJTi\` — chính là \`-----BEGIN\`):

\`\`\`bash
kubectl config view --raw --kubeconfig ~/ops.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject -enddate
\`\`\`

Không có \`--raw\` thì kubectl in \`DATA+OMITTED\` và \`base64 -d\` ra rác.

**3. Ai tin cert này, vào lúc nào.** \`openssl verify -CAfile <ca> <cert>\` đi ngược chuỗi tới CA bạn đưa vào **và** kiểm thời hạn theo đồng hồ của máy; \`-attime <epoch>\` hỏi "nếu bây giờ là lúc đó thì sao".

\`\`\`bash
openssl verify -CAfile /etc/kubernetes/pki/ca.crt ops.pem                                  # error 10 … certificate has expired
openssl verify -CAfile /etc/kubernetes/pki/ca.crt -attime $(date -d '-10 days' +%s) ops.pem  # ops.pem: OK
\`\`\`

**Bài tập nền (5 phút, trước khi \`begin\`):** với \`/etc/kubernetes/pki/apiserver-etcd-client.crt\` và \`apiserver-kubelet-client.crt\`, in subject và issuer. Hai cert cùng là "client của apiserver", vì sao issuer khác nhau? Rồi tách cert của \`~/dev.kubeconfig\` và in \`-enddate\`.`,
    },
    mindset: `**Lỗi x509: đọc ba thứ — cert nào, CA nào, giờ nào.** Mọi thông báo TLS trong buổi này (đo trên lab) đều trả lời được bằng ba câu hỏi đó, theo đúng thứ tự:

| Thông báo (đo) | Ai từ chối ai | Cert nào | CA nào | Giờ nào |
|---|---|---|---|---|
| apiserver: \`tls: failed to verify certificate: x509: certificate signed by unknown authority\` | apiserver (client) không tin cert **server** của etcd | \`pki/etcd/server.crt\`, issuer \`etcd-ca\` | \`--etcd-cafile\` không phải \`etcd-ca\` | — |
| apiserver: \`remote error: tls: unknown certificate authority\`; etcd: \`rejected connection on client endpoint … x509: certificate signed by unknown authority\` | etcd (server) không tin cert **client** của apiserver | \`--etcd-certfile\` | issuer của nó không phải \`etcd-ca\` (\`--trusted-ca-file\` của etcd) | — |
| apiserver: \`x509: certificate has expired or is not yet valid: current time 2026-11-24T19:39:26Z is after 2026-11-23T19:39:26Z\`; kubectl: \`Unauthorized\` | apiserver không nhận cert client của ops | cert nhúng trong \`~/ops.kubeconfig\` | đúng CA cluster | \`notAfter\` đã qua |

Chữ "remote error" nói **bên kia** từ chối mình: dòng thứ hai là etcd đóng kết nối vì client cert, không phải apiserver nghi ngờ etcd. Cả hai dòng đầu đều là kubeadm có **hai CA riêng**: \`/etc/kubernetes/pki/ca.crt\` (CN \`kubernetes\`) ký cert cho apiserver và client của nó; \`/etc/kubernetes/pki/etcd/ca.crt\` (CN \`etcd-ca\`) ký mọi cert nói chuyện với etcd. Ba cờ của apiserver phải cùng nằm ở thế giới etcd: \`--etcd-cafile=…/etcd/ca.crt\`, \`--etcd-certfile=…/apiserver-etcd-client.crt\` (issuer \`etcd-ca\`), \`--etcd-keyfile\` là key của đúng cert đó.

**Nối với Java.** \`javax.net.ssl.SSLHandshakeException: PKIX path building failed: … unable to find valid certification path to requested target\` là dòng "CA nào": truststore của JVM (\`cacerts\`, hay \`-Djavax.net.ssl.trustStore\`) không có CA đã ký cert server. Đó đúng là \`--etcd-cafile\` sai — chỉ khác là apiserver ghi bằng chữ của Go. \`CertificateExpiredException: NotAfter: …\` là dòng "giờ nào". Cách sửa cũng giống: thêm đúng CA vào truststore (đúng tệp vào \`--etcd-cafile\`), hay cấp cert mới; không bao giờ là tắt kiểm (\`insecure-skip-tls-verify\`, \`TrustAllCerts\`).

**Client không tự kiểm cert của chính nó.** kubectl gửi cert hết hạn đi bình thường; apiserver xác thực thất bại và chỉ trả \`401\`: \`error: You must be logged in to the server (Unauthorized)\` (đo). Lý do x509 chỉ có trong **log của apiserver** (\`"Unable to authenticate the request" err="[x509: certificate has expired …]"\`). \`Unauthorized\` (401) là "không biết bạn là ai": cert, token. \`Forbidden\` (403) là "biết bạn là ai, nhưng RBAC không cho": đừng lẫn hai thứ.

**etcd khoẻ thì đừng đụng etcd.** apiserver không lên vì etcd là chuyện thường gặp, nên câu đầu tiên là "etcd có thật sự hỏng không?". \`etcdctl endpoint status -w table\` và \`endpoint health\` (cert lấy từ \`etcd.yaml\`, như s43) trả lời mà không cần apiserver. Đo trong sự cố: \`is healthy: successfully committed proposal\`, RAFT INDEX vẫn tăng. Khôi phục snapshot ở đây là làm mất dữ liệu cho một lỗi nằm trong manifest của apiserver.

**Đừng chỉnh giờ.** Cert hết hạn "hợp lệ trở lại" nếu đồng hồ lùi (\`openssl verify -attime\` cho \`OK\`, đo), nhưng trên cka-cp đồng hồ đó cũng là đồng hồ của etcd lease, token ServiceAccount, cert của chính apiserver, và NTP sẽ kéo nó về. Sửa là cấp cert mới.

**Nạn nhân phụ.** Khi apiserver chết, scheduler và controller-manager mất leader lease (\`"Leaderelection lost"\`, đo), tự thoát, và kubelet chạy lại chúng sau back-off: apiserver lên rồi mà \`kube-scheduler-cka-cp\` còn \`0/1\` hay restart thêm một lần trong 1–2 phút là bình thường. Chờ, đừng sửa chúng.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 8 — Control plane hỏng", href: "#/roadmap/cka/cka-w8-2" },
      { label: "Bài lộ trình CKA: Tuần 8 — kubectl không kết nối được, kubeconfig sai", href: "#/roadmap/cka/cka-w8-3" },
      { label: "CKA Study Guide, chương 22 — Xử lý sự cố cluster", href: "#/docs/ckabook-22" },
      { label: "CKA Study Guide, chương 6 — Xác thực, ủy quyền và kiểm soát tiếp nhận", href: "#/docs/ckabook-06" },
      { label: "kubernetes.io: PKI certificates and requirements", href: "https://kubernetes.io/docs/setup/best-practices/certificates/" },
      { label: "kubernetes.io: Certificate Management with kubeadm", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/" },
      { label: "kubernetes.io: Certificates and Certificate Signing Requests", href: "https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/" },
      { label: "kubernetes.io: Operating etcd clusters for Kubernetes", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" },
    ],
    stateIn: "Đầu ra s49 (control plane chạy đúng manifest gốc, sổ tay có mục s49), cộng ~/ops.kubeconfig và ~/users/ops.{key,crt} của s33–s34. Trên Mac chạy `./labs/lab begin cka s50`: kiểm đầu vào bằng check.sh riêng, **không cần apiserver** (manifest scheduler và controller-manager như bản tốt, bản sao lưu, answers.env và mục s49, etcd phục vụ), xoá answers.env rồi **gây sự cố** (đo 32 giây; chạy lại `begin` khi apiserver còn hỏng: cài lại manifest tốt bằng tệp, chờ /readyz rồi gây lại, 50 giây; ngay sau khi VM bật lại giữa sự cố 3 phút 11 giây): \"sau một lần xoay vòng chứng chỉ, kubectl không vào được cluster, và nhóm ops báo kubeconfig của họ bị từ chối\". Bấm giờ 20 phút.",
    stateOut: "kube-apiserver chạy với ba cờ --etcd-* như kubeadm tạo (nội dung manifest như bản tốt), etcd không bị đụng (revision, raft index chỉ tăng); ~/ops.kubeconfig nhúng cert ops mới (CN=ops, O=shop-ops, do CA cluster ký, còn hạn) và ~/users/ops.crt là cert đó; ~/dev.kubeconfig và kubeconfig admin dùng được; ~/drills/s50/answers.env (ETCD_FLAG, EXPIRED_KUBECONFIG, ETCD_LEADER_ID, ETCD_VERSION); mục s50 trong ~/notes/runbook.md.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s50`. Bấm giờ 20 phút. Trên cka-cp chạy `k get node` ba lần cách vài giây và chép nguyên thông báo. Vì sao lúc thì `connection refused`, lúc thì `TLS handshake timeout`? `sudo ss -lntp | grep -E ':(6443|2379) '`, `sudo crictl ps -a --name kube-apiserver`.",
      },
      {
        id: "t2",
        text: "Một tầng xuống: `sudo crictl logs <id> 2>&1 | grep -m3 -iE 'x509|tls'` của container apiserver mới nhất, và dòng `\"command failed\"` của một container đã thoát. apiserver đang cố nói chuyện với ai, ở địa chỉ nào? Lỗi nói **ai** từ chối **ai** (có chữ `remote error` không)?",
      },
      {
        id: "t3",
        text: "etcd có hỏng không? Lấy ba tệp cert từ `/etc/kubernetes/manifests/etcd.yaml` (như s43), chạy `etcdctl endpoint status -w table` và `endpoint health`. Ghi `ETCD_LEADER_ID=` (cột ID của dòng `IS LEADER true`) và `ETCD_VERSION=` vào `~/drills/s50/answers.env`. Nếu etcd khoẻ, có lý do nào để restore snapshot không?",
      },
      {
        id: "t4",
        text: "`sudo grep -n -- '--etcd' /etc/kubernetes/manifests/kube-apiserver.yaml`. Với mỗi tệp của ba cờ, `openssl x509 -noout -subject -issuer`; so với issuer của `/etc/kubernetes/pki/etcd/server.crt`. Cờ nào trỏ sai thế giới CA? Ghi `ETCD_FLAG=` (cờ đã bị đổi; nếu là cặp cert/key thì một hay cả hai). Sao lưu manifest ra `~/drills/s50/backup/` **trước**, sửa, rồi bấm giờ tới khi `k get --raw /readyz` = `ok`. Chờ thêm tới khi bốn static pod Ready (scheduler, controller-manager có thể restart một lần: vì sao?).",
      },
      {
        id: "t5",
        text: "`k --kubeconfig ~/ops.kubeconfig get nodes`. Thông báo có chữ x509 không? Tìm lý do ở `k -n kube-system logs kube-apiserver-cka-cp --since=2m | grep x509`. Tách cert khỏi kubeconfig (jsonpath + `base64 -d` + `openssl x509 -noout -subject -issuer -enddate`), so với `date -u`. Làm tương tự cho `~/dev.kubeconfig`. Ghi `EXPIRED_KUBECONFIG=` (tên kubeconfig hỏng).",
      },
      {
        id: "t6",
        text: "Tình huống hỏng (đọc, đừng làm): một đồng nghiệp đề nghị `sudo timedatectl set-ntp false && sudo date -s '2026-11-20'` cho \"nhanh\". Chạy `openssl verify -CAfile /etc/kubernetes/pki/ca.crt -attime $(date -d '-10 days' +%s) <cert ops>` để thấy vì sao ý đó \"có vẻ chạy\", rồi giải thích vì sao nó hỏng nhiều thứ khác. Cách đúng: cấp cert mới cho ops qua CertificateSigningRequest như s33 (dùng lại `~/users/ops.key`), lấy cert vào `~/users/ops.crt`, `kubectl config set-credentials ops … --embed-certs --kubeconfig ~/ops.kubeconfig`.",
      },
      {
        id: "t7",
        text: "Thử bằng chính tệp: `k --kubeconfig ~/ops.kubeconfig auth whoami`, `get nodes` (được), `-n default create configmap x --from-literal=a=b --dry-run=server` (Forbidden có `User \"ops\"`). `~/dev.kubeconfig` và `~/.kube/config` vẫn chạy? Thêm mục `## s50 …` vào sổ tay (≥ 3 dòng: triệu chứng, nguyên nhân, lệnh). Trên Mac: `./labs/lab verify cka s50` phải 7/7. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "`connection refused` là không ai nghe 6443; `TLS handshake timeout` và `context deadline exceeded` là có tiến trình nghe nhưng chưa phục vụ. Ở đây cả hai xen nhau (đo): container apiserver chạy ~20 giây chờ etcd rồi thoát, lặp lại.",
      "Dòng lỗi có ích là `grpc: addrConn.createTransport failed to connect to {Addr: \"127.0.0.1:2379\" …}`: apiserver là client của etcd. Dòng `\"command failed\" err=\"error creating storage factory: etcd grpc connection not ready\"` chỉ nói hậu quả.",
      "`etcdctl` cần đủ `--cacert`, `--cert`, `--key` (đọc từ etcd.yaml: `--trusted-ca-file`, `--cert-file`, `--key-file`) và `--endpoints=https://127.0.0.1:2379`. Thiếu một cái thì chính etcdctl báo lỗi TLS và bạn tưởng etcd hỏng.",
      "Hai CA: `pki/ca.crt` (CN kubernetes), `pki/etcd/ca.crt` (CN etcd-ca). `for f in /etc/kubernetes/pki/*.crt /etc/kubernetes/pki/etcd/*.crt; do echo \"$f $(openssl x509 -in $f -noout -issuer)\"; done` cho bạn bản đồ trong một lệnh.",
      "Cặp `--etcd-certfile`/`--etcd-keyfile` phải là **một cặp**: cert đổi mà key không đổi thì lỗi khác hẳn và thoát ngay (đo: `\"command failed\" err=\"error creating storage factory: tls: private key does not match public key\"`). So bằng `openssl x509 -noout -pubkey` và `openssl pkey -pubout`.",
      "kubectl chỉ in `Unauthorized`; lý do nằm ở log của apiserver (`authentication.go … x509: certificate has expired or is not yet valid`). `k logs` của apiserver chạy được khi bạn còn một kubeconfig khác đang dùng được (admin).",
      "`kubectl config view` không có `--raw` in `DATA+OMITTED`. `--minify` chỉ lấy context hiện tại; với tệp chỉ có một user thì `{.users[0]…}` là đủ.",
      "Verify dòng ops đỏ `vẫn là cert có từ trước sự cố`: bạn nhúng lại cert cũ (cert hết hạn, hay cert gốc của s33 nếu tìm được nó ở đâu đó). Phải là cert **mới** do CA cluster ký: CSR như s33, hay `kubeadm kubeconfig user --client-name=ops --org=shop-ops` cũng được.",
    ],
    solution: `Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, etcd 3.7.0, sau \`apply\` s49 rồi \`begin cka s50\`); cờ hỏng của bạn có thể khác (một trong bốn cách), id, giờ và serial khác. Mọi lệnh chạy trên cka-cp.

**1. kubectl chết: cổng và container**

\`\`\`bash
k get node
# Unable to connect to the server: net/http: TLS handshake timeout
# … dial tcp 192.168.252.35:6443: connect: connection refused - error from a previous attempt: read tcp …: read: connection reset by peer
sudo ss -lntp | grep -E ':(6443|2379) '
# LISTEN … 192.168.252.35:2379 … users:(("etcd",pid=1199,fd=7))
# LISTEN … 127.0.0.1:2379      … users:(("etcd",pid=1199,fd=8))
sudo crictl ps -a --name kube-apiserver
# 3d5b544edebee  …  29 seconds ago  Exited  kube-apiserver  1  …
\`\`\`

**2. Lỗi TLS trong log của apiserver**

\`\`\`bash
sudo crictl logs $(sudo crictl ps -a -q --name '^kube-apiserver$' | head -1) 2>&1 | grep -m1 createTransport
# W1124 20:48:29.857480  1 logging.go:55] [core] … grpc: addrConn.createTransport failed to connect to {Addr: "127.0.0.1:2379", …}.
#   Err: connection error: desc = "error reading server preface: remote error: tls: unknown certificate authority"
sudo crictl logs $(sudo crictl ps -a -q --name '^kube-apiserver$' --state exited | head -1) 2>&1 | grep '"command failed"'
# E1124 20:48:49.867153  1 run.go:72] "command failed" err="error creating storage factory: etcd grpc connection not ready: context deadline exceeded"
sudo crictl logs --since 1m $(sudo crictl ps -q --name '^etcd$') 2>&1 | grep -m1 rejected
# {"level":"warn",…,"msg":"rejected connection on client endpoint","remote-addr":"127.0.0.1:46420",…,"error":"tls: failed to verify certificate: x509: certificate signed by unknown authority"}
\`\`\`

\`remote error\`: etcd từ chối cert client của apiserver. Ở lần \`begin\` khác (đo), \`--etcd-cafile\` bị đổi thì dòng là \`… authentication handshake failed: tls: failed to verify certificate: x509: certificate signed by unknown authority\` (apiserver không tin cert server của etcd) và etcd ghi \`"error":"remote error: tls: bad certificate"\`.

**3. etcd vẫn khoẻ**

\`\`\`bash
E=/etc/kubernetes/pki/etcd
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$E/ca.crt --cert=$E/server.crt --key=$E/server.key endpoint status -w table
# │        ENDPOINT        │        ID        │ VERSION │ … │ IS LEADER │ … │ RAFT TERM │ RAFT INDEX │ …
# │ https://127.0.0.1:2379 │ 9c6d935895988819 │   3.7.0 │ … │      true │ … │        11 │      47958 │ …
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$E/ca.crt --cert=$E/server.crt --key=$E/server.key endpoint health
# https://127.0.0.1:2379 is healthy: successfully committed proposal: took = 5.340503ms
\`\`\`

\`ETCD_LEADER_ID=9c6d935895988819\`, \`ETCD_VERSION=3.7.0\` (của máy soạn bài; ID của bạn khác).

**4. Ba cờ so với pki/, sao lưu, sửa**

\`\`\`bash
sudo grep -n -- '--etcd' /etc/kubernetes/manifests/kube-apiserver.yaml
# 21:    - --etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt
# 22:    - --etcd-certfile=/etc/kubernetes/pki/apiserver-kubelet-client.crt
# 23:    - --etcd-keyfile=/etc/kubernetes/pki/apiserver-kubelet-client.key
openssl x509 -in /etc/kubernetes/pki/etcd/server.crt -noout -issuer                   # issuer=CN = etcd-ca
openssl x509 -in /etc/kubernetes/pki/etcd/ca.crt -noout -subject                      # subject=CN = etcd-ca      (cafile đúng)
openssl x509 -in /etc/kubernetes/pki/apiserver-kubelet-client.crt -noout -issuer      # issuer=CN = kubernetes   (sai CA)
openssl x509 -in /etc/kubernetes/pki/apiserver-etcd-client.crt -noout -subject -issuer
# subject=CN = kube-apiserver-etcd-client
# issuer=CN = etcd-ca
mkdir -p ~/drills/s50/backup && sudo cp /etc/kubernetes/manifests/kube-apiserver.yaml ~/drills/s50/backup/
sudo sed -i -e 's#--etcd-certfile=.*#--etcd-certfile=/etc/kubernetes/pki/apiserver-etcd-client.crt#' \\
  -e 's#--etcd-keyfile=.*#--etcd-keyfile=/etc/kubernetes/pki/apiserver-etcd-client.key#' /etc/kubernetes/manifests/kube-apiserver.yaml
until [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; do sleep 2; done      # 28–33 giây (đo)
k get --raw '/readyz?verbose' | grep etcd
# [+]etcd ok
# [+]etcd-readiness ok
\`\`\`

\`ETCD_FLAG=--etcd-certfile,--etcd-keyfile\` (khi \`--etcd-cafile\` trỏ \`pki/ca.crt\` hay \`pki/front-proxy-ca.crt\` thì \`subject\` của nó là \`kubernetes\`/\`front-proxy-ca\`, khác \`etcd-ca\`: \`ETCD_FLAG=--etcd-cafile\`). Sau đó \`k -n kube-system get pod -l tier=control-plane\` có lúc cho \`kube-scheduler-cka-cp 0/1 Running\`: log của container đã thoát là \`"Leaderelection lost"\` (đo); 1–2 phút sau cả bốn Ready.

**5. ops: Unauthorized, lý do ở apiserver**

\`\`\`bash
k --kubeconfig ~/ops.kubeconfig get nodes
# error: You must be logged in to the server (Unauthorized)
k -n kube-system logs kube-apiserver-cka-cp --since=1m | grep -m1 'certificate has expired'
# E1124 … authentication.go:76] "Unable to authenticate the request" err="[x509: certificate has expired or is not yet valid: current time 2026-11-24T20:04:59Z is after 2026-11-21T19:35:15Z, verifying certificate SN=…
for u in ops dev; do kubectl config view --raw --kubeconfig ~/$u.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject -issuer -enddate; done
# subject=O = shop-ops, CN = ops    issuer=CN = kubernetes    notAfter=Nov 21 19:35:15 2026 GMT
# subject=O = shop-dev, CN = dev    issuer=CN = kubernetes    notAfter=Nov 24 10:29:47 2027 GMT
date -u                                                   # Tue Nov 24 20:05:00 UTC 2026
\`\`\`

\`EXPIRED_KUBECONFIG=ops\`. Tình huống hỏng, đo bằng \`-attime\` thay vì đổi đồng hồ thật:

\`\`\`bash
kubectl config view --raw --kubeconfig ~/ops.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d > /tmp/ops.pem
openssl verify -CAfile /etc/kubernetes/pki/ca.crt /tmp/ops.pem                                    # error 10 at 0 depth lookup: certificate has expired
openssl verify -CAfile /etc/kubernetes/pki/ca.crt -attime $(date -d '-10 days' +%s) /tmp/ops.pem  # /tmp/ops.pem: OK
\`\`\`

**6. Cert mới qua CSR (như s33), nhúng lại**

\`\`\`bash
cd ~/users
openssl req -new -key ops.key -subj "/CN=ops/O=shop-ops" -out ops.csr
# ops-csr.yaml: như s33 (signerName kubernetes.io/kube-apiserver-client, usages: client auth, request = base64 -w0 ops.csr)
k delete csr ops --ignore-not-found; k apply -f ops-csr.yaml; k certificate approve ops
k get csr ops            # ops  21s  kubernetes.io/kube-apiserver-client  kubernetes-admin  365d  Approved,Issued
k get csr ops -o jsonpath='{.status.certificate}' | base64 -d > ops.crt
kubectl config set-credentials ops --client-certificate=$HOME/users/ops.crt --client-key=$HOME/users/ops.key --embed-certs --kubeconfig ~/ops.kubeconfig
chmod 600 ~/ops.kubeconfig
k --kubeconfig ~/ops.kubeconfig auth whoami | sed -n 2,3p
# Username   ops
# Groups     [shop-ops system:authenticated]
k --kubeconfig ~/ops.kubeconfig get nodes | tail -n +2 | wc -l                                       # 3
k --kubeconfig ~/ops.kubeconfig -n default create configmap x --from-literal=a=b --dry-run=server
# error: failed to create configmap: configmaps is forbidden: User "ops" cannot create resource "configmaps" in API group "" in the namespace "default"
\`\`\`

Cách khác verify cũng nhận (đo): \`sudo kubeadm kubeconfig user --client-name=ops --org=shop-ops --validity-period=24h > /tmp/k && install -m 600 /tmp/k ~/ops.kubeconfig\`. Cert đó có \`notBefore\` bằng của CA (kubeadm không lùi 5 phút như CSR), nên verify không chấm theo \`notBefore\` mà theo "không phải cert nào có từ trước sự cố".

**Lời giải tự động** (\`labs/cka/sessions/s50/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve-api.sh\` (bước 1–4: lấy dòng \`createTransport\` từ \`crictl logs\`, endpoint status/health, so subject/issuer và cặp key, sao lưu rồi sửa đúng dòng, chờ \`/readyz\` và chờ scheduler, controller-manager chạy liền ≥ 40 giây), \`files/solve-ops.sh STEP=read\` (bước 5), \`s33/files/issue.sh\` với \`u=ops\` (CSR mới bằng key cũ), \`files/solve-ops.sh STEP=embed\` (nhúng, thử ba quyền, answers.env, mục s50). Đo: 1 phút 54 giây tới 2 phút 30 giây, ngay sau khi VM bật lại giữa sự cố 3 phút 19 giây; lần nào cũng rồi verify 7/7.`,
    exam: {
      patterns: [
        "\"kubectl không kết nối được sau khi ai đó sửa control plane; sửa\" — `crictl ps -a`, `crictl logs`, đọc lỗi TLS tới etcd, so `--etcd-*` với `pki/` và `etcd.yaml`.",
        "\"Kiểm tra sức khoẻ etcd, ghi ID của leader / phiên bản vào /opt/…\" — `etcdctl endpoint status -w table` hay `-w json`, `endpoint health`, đủ ba tệp cert.",
        "\"User X không gọi được API, tìm vì sao và sửa\" — `Unauthorized` là xác thực (cert hết hạn, sai CA, kubeconfig sai), `Forbidden` là RBAC; tách cert, `openssl x509 -enddate`, CSR mới.",
        "\"Cert nào của cluster hết hạn trước tiên? Gia hạn\" — `kubeadm certs check-expiration`, `kubeadm certs renew <tên>` rồi để kubelet nạp lại static pod (s44).",
      ],
      timeTargetMin: 15,
      drills: [
        {
          text: "Trong 2 phút: in ngày hết hạn của client cert trong `~/dev.kubeconfig` mà không mở tệp bằng editor.",
          timeLimitMin: 2,
          solution: "```bash\nkubectl config view --raw --kubeconfig ~/dev.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -enddate\n```\nThiếu `--raw` thì ra `DATA+OMITTED`.",
        },
        {
          text: "Trong 3 phút: ghi ID (hex) của member etcd đang là leader vào `/tmp/leader.txt`, không dùng kubectl.",
          timeLimitMin: 3,
          solution: "```bash\nE=/etc/kubernetes/pki/etcd\nsudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$E/ca.crt --cert=$E/server.crt --key=$E/server.key endpoint status -w json \\\n  | python3 -c 'import json,sys; print(\"%x\" % json.load(sys.stdin)[0][\"Status\"][\"leader\"])' > /tmp/leader.txt\n```\nHay đọc cột ID của dòng `IS LEADER true` trong `-w table`.",
        },
      ],
    },
    tips: [
      "Lỗi x509: trước khi sửa gì, viết ra ba thứ — cert nào (đường dẫn hay trường kubeconfig), CA nào (issuer của cert, CA của bên kiểm), giờ nào (`-dates` so với `date -u`).",
      "apiserver không lên: `etcdctl endpoint health` trước. etcd khoẻ thì lỗi nằm ở apiserver, đừng nghĩ tới restore.",
      "`Unauthorized` thì xem log của apiserver, không phải kubectl `-v=6`: kubectl chỉ thấy mã 401.",
      "Sửa xong apiserver, chờ scheduler và controller-manager tự lên lại (leader lease) trước khi tuyên bố xong; đừng restart kubelet.",
    ],
    outcome: {
      md: `Apiserver nói chuyện lại với etcd, ops có cert mới. Trên Mac:

\`\`\`bash
./labs/lab verify cka s50
\`\`\`

Bảy dòng, so với bản tốt và mốc mà \`begin\` lưu ở \`/root/.lab/st9-etcd/\`. **Manifest:** \`kube-apiserver.yaml\` giống bản tốt theo nội dung YAML, manifests/ không có tệp thừa (tệp lạ trong đó: đỏ \`thừa trong manifests/: notes.txt\`, đo). **etcd:** healthy, revision và raft index không nhỏ hơn lúc \`begin\` (restore snapshot là lùi), \`/readyz\`. **ops:** cert nhúng là cert **mới** (không phải cert hết hạn đã gây, không phải cert gốc của s33), CN=ops O=shop-ops, do CA cluster ký, còn hạn ≥ 1 giờ, đồng hồ cka-cp khớp đồng hồ Mac trong 5 phút (chỉnh giờ là đỏ), whoami ra ops, \`get nodes\` được, \`create\` Forbidden có \`User "ops"\`; cộng cấu trúc như s34. Đo, đỏ cả ba: cert tự ký bằng một CA khác (\`cert nhúng không do CA cluster ký; ops: Unauthorized\`), cert gốc của s33 chép từ \`/root/.lab/\` (\`vẫn là cert có từ trước sự cố\`), cert admin (\`cert nhúng CN=kubernetes-admin…; whoami ra kubernetes-admin\`); \`kubeadm kubeconfig user\`: xanh. **dev và admin** vẫn dùng được. **answers.env:** cờ của lần \`begin\` này, \`ops\`, ID và phiên bản thật của etcd (sai cả bốn: đỏ, đo). **Sổ tay:** heading chứa \`s50\`. **Lõi khoẻ.** Ngay sau \`begin\`: **0/7** trong 80 giây; ngay sau khi VM bật lại giữa sự cố 1/7 (sổ tay) trong 3 phút 49 giây, không treo (đo).`,
      verifyOutput: "lab: kiểm s50\n  (chờ etcd, apiserver và Deployment của shop, nếu đang khởi động: tối đa ~17 phút)\n  ✓ kube-apiserver.yaml như bản tốt (--etcd-cafile, --etcd-certfile, --etcd-keyfile); manifests/ không có tệp thừa\n  ✓ etcd healthy, không bị đụng (revision, raft index không lùi so với lúc begin); apiserver /readyz\n  ✓ ~/ops.kubeconfig: cert ops MỚI do CA cluster ký, còn hạn ≥ 1 giờ, giờ cka-cp đúng; whoami ops, get nodes, create Forbidden\n  ✓ ~/dev.kubeconfig (như s34) và kubeconfig admin vẫn dùng được\n  ✓ answers.env: ETCD_FLAG, EXPIRED_KUBECONFIG, ETCD_LEADER_ID, ETCD_VERSION\n  ✓ ~/notes/runbook.md có mục s50 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng\n  ✓ Lõi khoẻ: bốn static pod Running, etcd từ /var/lib/etcd-restore, /readyz; ba node; shop trải hai worker, postgres-0\n  → 7/7 đạt",
      projectDelta: "Control plane và ba kubeconfig trở lại dùng được; ops có cert mới một năm. Sổ tay có mục s50: ba câu hỏi cho lỗi x509 và hai CA của kubeadm.",
    },
    review: [
      { q: "apiserver log `x509: certificate signed by unknown authority` khi nối etcd. Ba câu hỏi \"cert nào, CA nào, giờ nào\" trả lời thế nào, và sửa tệp nào?", a: "Cert nào: cert server của etcd (`pki/etcd/server.crt`, issuer `etcd-ca`). CA nào: apiserver kiểm nó bằng `--etcd-cafile`, mà tệp đó không phải `etcd-ca` (vd `pki/ca.crt` CN kubernetes). Giờ: không liên quan. Sửa `--etcd-cafile=/etc/kubernetes/pki/etcd/ca.crt` trong kube-apiserver.yaml; etcd không cần đụng." },
      { q: "Cùng là apiserver không nối được etcd, khi nào lỗi có chữ `remote error: tls: unknown certificate authority`, và etcd ghi gì?", a: "Khi etcd (bên kia) từ chối cert client mà apiserver trình ra: `--etcd-certfile` do CA khác ký (vd `apiserver-kubelet-client.crt`, issuer kubernetes) trong khi etcd chỉ tin `--trusted-ca-file=…/etcd/ca.crt`. etcd ghi `rejected connection on client endpoint … x509: certificate signed by unknown authority` (đo). Sửa cặp certfile/keyfile về `apiserver-etcd-client.{crt,key}`." },
      { q: "Vì sao kubectl với cert hết hạn chỉ báo `Unauthorized`, và bạn tìm chữ `certificate has expired` ở đâu?", a: "Client không kiểm hạn cert của chính nó; apiserver kiểm, xác thực thất bại và chỉ trả 401 (không nói lý do cho client, để không lộ thông tin). Lý do nằm trong log của apiserver: `\"Unable to authenticate the request\" err=\"[x509: certificate has expired or is not yet valid: current time … is after …]\"` (đo), đọc bằng `k logs` với một kubeconfig khác hay `crictl logs`." },
      { q: "Vì sao không sửa cert hết hạn bằng cách lùi đồng hồ của cka-cp?", a: "Đồng hồ đó cũng là của etcd (lease, TTL), token ServiceAccount, cert của chính control plane (có thể thành \"not yet valid\"), log và metrics; NTP sẽ kéo nó về và cert lại hết hạn. Nó chỉ làm `openssl verify -attime` kiểu \"có vẻ đúng\". Cách đúng là cert mới (CSR hay `kubeadm kubeconfig user`), và verify của lab đỏ khi đồng hồ lệch giờ Mac quá 5 phút." },
      { q: "So sánh `PKIX path building failed` của một client Java với lỗi `--etcd-cafile` sai.", a: "Cùng là câu hỏi \"CA nào\": bên kiểm (JVM với truststore `cacerts`/`javax.net.ssl.trustStore`; apiserver với `--etcd-cafile`) không có CA đã ký cert server. Sửa bằng cách đưa đúng CA vào chỗ tin cậy (import vào truststore; trỏ đúng tệp), không bao giờ tắt kiểm (`TrustAllCerts`, `insecure-skip-tls-verify`). `CertificateExpiredException` của Java ứng với câu \"giờ nào\"." },
    ],
  },
  {
    id: "s51",
    stage: "st9",
    title: "Tổng hợp bấm giờ: giám sát tài nguyên và sự cố nhiều tầng",
    durationMin: 90,
    domain: "troubleshooting",
    competencies: ["ts-monitor"],
    requires: ["s50"],
    status: "published",
    pieces: [],
    goals: [
      "Giải sáu câu kiểu đề trong 60 phút trên namespace s51-batch: bốn câu ghi đáp án ra /opt/answers/ (Pod ngốn CPU nhất, NodeMetrics thô, reason của Event, log container phụ) và hai sự cố mỗi cái hỏng hai chỗ cùng lúc.",
      "Phân bổ thời gian như phòng thi: câu nhanh trước, đánh dấu câu kẹt quá thời gian mục tiêu rồi quay lại, ghi đáp án đúng đường dẫn và định dạng.",
      "Đọc số liệu tài nguyên thẳng từ Metrics API, Event và log theo đúng đối tượng, đúng container; sửa một sự cố xong thì đọc lại tầng kế tiếp thay vì tuyên bố đã xong.",
    ],
    skills: [
      { skill: "k-metrics-raw", level: "Gõ được có tra" },
      { skill: "k-answer-to-file", level: "Dưới 2 phút" },
      { skill: "k-exam-triage", level: "Áp dụng được" },
      { skill: "k-events-watch", level: "Gõ được không tra" },
    ],
    uses: ["k-top-pod", "k-top-containers", "k-sort-by", "k-diagnosis-layers", "k-use-context"],
    foundation: null,
    mindset: `**Một câu, hai chỗ hỏng: sửa xong một tầng thì đọc lại tầng kế.** Hai sự cố của buổi này cố ý hỏng hai chỗ cùng lúc, như phần lớn câu troubleshooting trong đề. Sửa chỗ đầu tiên thì triệu chứng **đổi**, không biến mất; người đọc vội thấy "vẫn lỗi" và quay lại sửa tiếp chỗ đã đúng. Đi theo tầng như s46:

| Câu | Lần đọc đầu (đo) | Sửa | Lần đọc sau (đo) | Sửa tiếp |
|---|---|---|---|---|
| (a) report | \`curl\` tới report-svc treo tới hết giờ; EndpointSlice \`PORTS 8081\`, container nghe \`8080\` | \`targetPort\` | 502 sau 20 giây: \`report: wget: bad address 'gateway.shop:8080'\`; \`nslookup\` trong Pod: \`connection timed out; no servers could be reached\` | policy egress DNS (53/UDP, TCP tới kube-dns), giữ \`default-deny\` |
| (b) indexer | \`FailedScheduling\`: \`1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s)\` | \`nodeSelector\` \`disk\` → \`disktype\` | Pod mới vẫn \`Pending\`; \`Taints: maintenance=planned:NoSchedule\` trên cka-w2 | gỡ taint |

Vì sao (a) **treo** chứ không \`connection refused\`: \`default-deny\` cộng policy \`report\` chỉ mở ingress cổng 8080, nên gói tới 8081 bị Calico bỏ, không có ai trả RST (đo: \`curl -m 60\` hết 60 giây, mã 000). "Treo" ở tầng Service gần như luôn là NetworkPolicy hay không có route; "refused" là có đường mà không ai nghe. Thông điệp của (b) đọc **từng vế**: số node ở mỗi lý do cộng lại bằng tổng; sửa một vế thì vế kia vẫn còn.

**Giống đọc log Spring theo tầng.** Một request 500 trong Spring: lớp ngoài (\`DispatcherServlet\`) chỉ nói "500", lớp trong nói \`Caused by: java.net.UnknownHostException: gateway.shop\`. Sửa kết nối DB xong mà vẫn 500 thì đọc lại \`Caused by\` mới nhất, đừng giả định là lỗi cũ. Ở đây "lớp ngoài" là curl (000, 502), "lớp trong" là EndpointSlice, log CGI, \`nslookup\`, Event.

**Đọc đúng đối tượng.** \`k top pod -A --sort-by=cpu\` xếp theo số đo **của metrics-server** (đo 5 lần cách 30 giây: \`cruncher-…\` 299–301m, Pod kế tiếp 24–55m; lúc apiserver bận nhất đo được 100m), và số đó trễ một nhịp: ngay sau khi một Pod bị xoá, \`top\` còn in nó thêm một lúc (đo khi \`begin\` lại liền: dòng đầu là \`cruncher\` cũ đã mất). Trước khi ghi đáp án, \`k get pod <tên>\` để chắc nó còn. \`k logs <pod>\` của Pod hai container in container **mặc định** (\`Defaulted container "app" out of: app, shipper\`, đo); container phụ cần \`-c\`. \`k get events\` của cả namespace lẫn lộn; \`--field-selector involvedObject.name=<pod>,type=Warning\` chỉ lấy đúng đối tượng. Metrics API là một API bình thường: \`k get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w1\` trả JSON \`kind: NodeMetrics\` mà \`k top node\` chỉ in thành bảng.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 8 — Debug Service/DNS", href: "#/roadmap/cka/cka-w8-4" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "CKA Study Guide, chương 14 — Lập lịch Pod", href: "#/docs/ckabook-14" },
      { label: "CKA Study Guide, chương 1 — Chi tiết về kỳ thi và tài nguyên", href: "#/docs/ckabook-01" },
      { label: "kubernetes.io: Resource metrics pipeline (Metrics API)", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/resource-metrics-pipeline/" },
      { label: "kubernetes.io: Debug Services", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/" },
      { label: "kubernetes.io: Taints and Tolerations", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/" },
      { label: "kubernetes.io: kubectl events", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_events/" },
    ],
    stateIn: "Đầu ra s50 (control plane, etcd, ba kubeconfig dùng được, sổ tay có mục s50). Trên Mac chạy `./labs/lab begin cka s51`: kiểm đầu vào bằng check.sh riêng (đầu ra s50 trừ việc shop trải hai worker), xoá bốn tệp đáp án cũ trong /opt/answers/ rồi **gây sự cố** (đo 12 giây, chạy lại liền 12 giây: xoá namespace s51-batch, gỡ taint rồi dựng lại): \"một lô việc batch mới vào namespace s51-batch, vài thứ chưa chạy\". Bấm giờ 60 phút cho sáu câu.",
    stateOut: "Cluster như cuối chặng 8 cộng namespace s51-batch đã sửa: report-svc trả 200 qua report (policy DNS mới, default-deny giữ nguyên), indexer chạy trên cka-w2 (nhãn disktype=ssd, không còn taint maintenance), Pod ingest còn, **không còn Pod cruncher**; bốn tệp đáp án trong /opt/answers/ (chủ ubuntu); mục s51 trong ~/notes/runbook.md. Đây là mốc `st9-done`, đầu vào của hai đề mock.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s51`. Bấm giờ **60 phút** cho sáu câu dưới đây (Q1–Q6). Như đề thật: trước mỗi câu `k config current-context` (đề thật mở đầu mỗi câu bằng một `kubectl config use-context …`: gõ nó trước tiên). Đọc lướt cả sáu, làm **Q1–Q4 trước** (mỗi câu ≤ 5 phút), câu nào quá 1,5 lần thời gian mục tiêu thì ghi số câu vào giấy nháp và đi tiếp. Lưu ý thứ tự: Q3 hỏi Event **lúc sự cố**, làm trước Q6.",
      },
      {
        id: "t2",
        text: "**Q1.** Tìm Pod dùng nhiều CPU nhất trong toàn cluster. Ghi `<namespace>/<tên Pod>` (đúng một dòng) vào `/opt/answers/top-cpu.txt`.",
      },
      {
        id: "t3",
        text: "**Q2.** Ghi dữ liệu thô (JSON) NodeMetrics của node `cka-w1`, lấy trực tiếp từ Metrics API, vào `/opt/answers/node-metrics.json`.",
      },
      {
        id: "t4",
        text: "**Q3.** Deployment `indexer` trong namespace `s51-batch` không chạy. Ghi `reason` của Event loại Warning mới nhất của Pod thuộc `indexer` vào `/opt/answers/events.txt` (chỉ chuỗi reason). Thử thêm `k get events -w` với cùng field selector trong lúc làm câu khác.",
      },
      {
        id: "t5",
        text: "**Q4.** Pod `ingest` trong `s51-batch` có một container phụ ghi lỗi. Ghi toàn bộ log của **container đó** (không thêm gì, không tiền tố thời gian) vào `/opt/answers/sidecar.log`. Dùng `k top pod -n s51-batch --containers` để thấy cột container.",
      },
      {
        id: "t6",
        text: "**Q5.** Deployment `report` trong `s51-batch` phục vụ `/cgi-bin/products` sau Service `report-svc` (cổng 8080) và lấy dữ liệu từ `gateway.shop:8080`. Từ cka-cp, `curl` tới ClusterIP của `report-svc` không được. Sửa để nó trả 200 với danh sách sản phẩm. Không xoá, không nới NetworkPolicy `default-deny` của namespace.",
      },
      {
        id: "t7",
        text: "**Q6.** `indexer` phải chạy trên node có ổ SSD (nhãn `disktype=ssd`). Sửa để Pod của nó Running. Không xoá Deployment, không đổi image hay lệnh, không cordon node nào.",
      },
      {
        id: "t8",
        text: "Hết giờ (hay xong sớm): `ls -l /opt/answers/` (bốn tệp, đúng tên), `cat` từng tệp. Thêm mục `## s51 …` vào sổ tay (≥ 3 dòng). Dọn Pod ngốn CPU: `k -n s51-batch delete pod -l app=cruncher` (đáp án Q1 vẫn được chấm theo Pod lúc sự cố). Trên Mac: `./labs/lab verify cka s51` phải 7/7. Ghi lại: mỗi câu mất bao lâu, câu nào bạn đánh dấu.",
      },
    ],
    hints: [
      "Q1: `k top pod -A --sort-by=cpu --no-headers | head -1 | awk '{print $1\"/\"$2}'`. Ngay sau `begin`, metrics của Pod mới cần ~1 phút mới có, và Pod vừa bị xoá có thể còn nằm trên đầu bảng: `k -n <ns> get pod <tên>` trước khi ghi.",
      "Q1 verify đỏ `cần đúng một dòng <namespace>/<Pod>`: bạn ghi mỗi tên Pod, hay thêm cột CPU, hay hai dòng. Đề bảo định dạng nào ghi đúng định dạng đó.",
      "Q2: `k get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w1 > /opt/answers/node-metrics.json`. `k top node cka-w1` không phải JSON; `k get nodes.metrics.k8s.io cka-w1 -o json` cũng ra NodeMetrics.",
      "Q3: tên Pod đổi mỗi lần ReplicaSet tạo lại; lấy bằng `-l app=indexer`. `k -n s51-batch get events --field-selector involvedObject.name=<pod>,type=Warning --sort-by=.lastTimestamp -o jsonpath='{.items[-1:].reason}'`.",
      "Q4: `k logs ingest` in container mặc định (`Defaulted container \"app\" out of: app, shipper`). `--all-containers` trộn cả hai; `--timestamps` thêm tiền tố. Chỉ `-c shipper`.",
      "Q5 treo chứ không refused: `k -n s51-batch get endpointslice -l kubernetes.io/service-name=report-svc` (cột PORTS) so với `containerPort` của Pod; `k get endpoints` vẫn chạy nhưng báo deprecated.",
      "Q5 sau khi sửa cổng mà 502 `bad address`: tên không phân giải. `k -n s51-batch describe netpol` — egress chỉ có cổng 8080. Thêm một policy egress tới `k8s-app=kube-dns` ở `kube-system` cổng 53 UDP và TCP (như `allow-dns-egress` của shop, s31).",
      "Q6: `k get node -L disktype,disk`, `k describe node cka-w2 | grep -A1 Taints`, `k taint node cka-w2 maintenance-`. Sửa nodeSelector bằng `k edit` hay `k patch --type=json` (patch merge chỉ thêm khoá, không xoá `disk`).",
    ],
    solution: `Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, metrics-server của s20, sau \`apply\` s50 rồi \`begin cka s51\`); tên \`cruncher-…\`, mã lô của ingest và tên Pod của bạn khác. Mọi lệnh chạy trên cka-cp. Thứ tự đúng như phòng thi: Q2, Q3, Q4 (mỗi câu dưới 2 phút), Q1 khi metrics của Pod mới đã có, rồi Q5, Q6.

**Q2 — Metrics API thô (1 phút)**

\`\`\`bash
k get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w1 > /opt/answers/node-metrics.json
python3 -m json.tool /opt/answers/node-metrics.json | sed -n '2,3p;16,21p'
#     "kind": "NodeMetrics",
#     "apiVersion": "metrics.k8s.io/v1beta1",
#     "timestamp": "2026-11-24T20:27:49Z",
#     "window": "20.064s",
#     "usage": {
#         "cpu": "42912679n",
#         "memory": "1171944Ki"
\`\`\`

**Q3 — reason của Event cảnh báo (2 phút, trước Q6)**

\`\`\`bash
p=$(k -n s51-batch get pod -l app=indexer -o jsonpath='{.items[0].metadata.name}')
k -n s51-batch get events --field-selector involvedObject.name=$p,type=Warning
# LAST SEEN   TYPE      REASON             OBJECT                         MESSAGE
# 2m11s       Warning   FailedScheduling   pod/indexer-59ccc85f74-67lds   0/3 nodes are available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s). …
k -n s51-batch get events --field-selector involvedObject.name=$p,type=Warning --sort-by=.lastTimestamp -o jsonpath='{.items[-1:].reason}' > /opt/answers/events.txt
cat /opt/answers/events.txt          # FailedScheduling
\`\`\`

**Q4 — log của container phụ (1 phút)**

\`\`\`bash
k -n s51-batch get pod ingest -o jsonpath='{.spec.containers[*].name}{"\\n"}'     # app shipper
k -n s51-batch logs ingest 2>&1 | head -2
# Defaulted container "app" out of: app, shipper
# INFO ingest batch=7c23f0-01 accepted records=120
k -n s51-batch logs ingest -c shipper > /opt/answers/sidecar.log
cat /opt/answers/sidecar.log
# ERROR shipper batch=7c23f0-01 upload to s3://archive-7c23f0 failed: 403 Forbidden
# … (bốn dòng)
\`\`\`

**Q1 — Pod ngốn CPU nhất (2 phút)**

\`\`\`bash
k top pod -A --sort-by=cpu | head -4
# NAMESPACE     NAME                    CPU(cores)   MEMORY(bytes)
# s51-batch     cruncher-d48b           300m         0Mi
# kube-system   calico-node-qn2dk       39m          106Mi
# kube-system   etcd-cka-cp             36m          84Mi
k -n s51-batch get pod cruncher-d48b -o name          # còn tồn tại
k top pod -A --sort-by=cpu --no-headers | head -1 | awk '{print $1"/"$2}' > /opt/answers/top-cpu.txt
k top pod -n s51-batch --containers
# POD             NAME      CPU(cores)   MEMORY(bytes)
# cruncher-d48b   burn      300m         0Mi
# ingest          app       1m           0Mi
# ingest          shipper   0m           0Mi
\`\`\`

**Q5 — report: hai chỗ (10 phút)**

\`\`\`bash
cip=$(k -n s51-batch get svc report-svc -o jsonpath='{.spec.clusterIP}')
curl -s -m 60 -w ' code=%{http_code}\\n' http://$cip:8080/cgi-bin/products      #  code=000 (treo hết 60 giây)
k -n s51-batch get endpointslice -l kubernetes.io/service-name=report-svc
# NAME               ADDRESSTYPE   PORTS   ENDPOINTS       AGE
# report-svc-t8qdb   IPv4          8081    10.244.62.189   31s
k -n s51-batch get pod -l app=report -o jsonpath='{.items[0].spec.containers[0].ports}{"\\n"}'
# [{"containerPort":8080,"name":"http","protocol":"TCP"}]
k -n s51-batch patch svc report-svc --type=json -p '[{"op":"replace","path":"/spec/ports/0/targetPort","value":8080}]'
curl -s -m 60 -w ' code=%{http_code}\\n' http://$cip:8080/cgi-bin/products
# report: wget: bad address 'gateway.shop:8080'
#  code=502                                                   (sau 20 giây)
k -n s51-batch exec deploy/report -- nslookup gateway.shop | tail -2     # ;; connection timed out; no servers could be reached
k -n s51-batch describe netpol report | sed -n '/Allowing egress/,$p'
#   Allowing egress traffic:
#     To Port: 8080/TCP
#     To:
#       NamespaceSelector: kubernetes.io/metadata.name=shop
#       PodSelector: app=gateway
k -n s51-batch apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: allow-dns-egress, namespace: s51-batch}
spec:
  podSelector: {}
  policyTypes: [Egress]
  egress:
  - to: [{namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}, podSelector: {matchLabels: {k8s-app: kube-dns}}}]
    ports: [{port: 53, protocol: UDP}, {port: 53, protocol: TCP}]
EOF
curl -s -m 30 -w ' code=%{http_code}\\n' http://$cip:8080/cgi-bin/products
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây","price":19.90},{"id":3,"name":"Màn hình 27 inch","price":229.00}]
#  code=200
\`\`\`

Vì sao report gọi \`gateway.shop\` chứ không gọi thẳng \`catalog.shop\`: policy \`catalog\` của s31 chỉ nhận từ gateway, gateway-v1, order trong shop. Không mở policy của shop cho một namespace khác chỉ để làm câu này.

**Q6 — indexer: hai chỗ (8 phút)**

\`\`\`bash
k get node -L disktype,disk
# NAME     STATUS   ROLES           AGE   VERSION   DISKTYPE   DISK
# cka-cp   Ready    control-plane   11d   v1.37.2
# cka-w1   Ready    <none>          11d   v1.37.2
# cka-w2   Ready    <none>          11d   v1.37.2   ssd
k -n s51-batch get deploy indexer -o jsonpath='{.spec.template.spec.nodeSelector}{"\\n"}'     # {"disk":"ssd"}
k -n s51-batch patch deploy indexer --type=json -p '[{"op":"replace","path":"/spec/template/spec/nodeSelector","value":{"disktype":"ssd"}}]'
k -n s51-batch get pod -l app=indexer
# indexer-59ccc85f74-xx24w   0/1     Pending   0          78s      (Pod cũ, ReplicaSet cũ)
# indexer-98f864686-zm7js    0/1     Pending   0          8s       (Pod mới: vẫn Pending)
k describe node cka-w2 | grep -A1 '^Taints'
# Taints:             maintenance=planned:NoSchedule
# Unschedulable:      false
k taint node cka-w2 maintenance-
k -n s51-batch rollout status deploy/indexer
# Waiting for deployment "indexer" rollout to finish: 1 old replicas are pending termination...
# deployment "indexer" successfully rolled out
k -n s51-batch get pod -l app=indexer -o wide        # indexer-98f864686-zm7js  1/1  Running  …  cka-w2
\`\`\`

Không xoá indexer để "làm lại cho sạch" (verify đỏ \`thiếu Deployment indexer\`, đo), không thêm nhãn \`disk=ssd\` vào cka-w1 để khớp selector sai, không cordon cka-w2 thay cho gỡ taint (lõi đỏ \`w2 đang cordon\`).

**Dọn và kiểm**

\`\`\`bash
ls -l /opt/answers/          # events.txt  node-metrics.json  sidecar.log  top-cpu.txt   (chủ ubuntu)
k -n s51-batch delete pod -l app=cruncher
\`\`\`

**Lời giải tự động** (\`labs/cka/sessions/s51/apply.sh\`): gây sự cố như \`begin\`, rồi \`files/solve.sh\` theo đúng thứ tự trên (Q1 chờ tới khi Pod đứng đầu \`top\` thuộc s51-batch **và còn tồn tại**: lần đầu viết thiếu điều kiện thứ hai, \`begin\` lại liền khiến lời giải ghi tên \`cruncher\` cũ đã bị xoá và verify đỏ Q1, đo), kiểm shop còn trải hai worker (\`rollout restart\` nếu Pod bị xếp lại trong lúc có taint), mục s51 của sổ tay, xoá cruncher. Đo: 71–91 giây, rồi verify 7/7.`,
    exam: {
      patterns: [
        "**Phân bổ 120 phút** (đề thật khoảng 15–20 câu, mỗi câu vài phần trăm điểm): đọc lướt cả đề 3 phút; lượt một làm mọi câu ≤ 5 phút (ghi tệp, top, logs, events, scale, label) — khoảng 35–40 phút; lượt hai các câu sự cố và câu nhiều bước, mỗi câu đặt trần 1,5 lần thời gian mục tiêu; còn ~10 phút cuối quay lại câu đã đánh dấu và kiểm lại đường dẫn tệp. Câu kẹt không bao giờ được ăn quá 15 phút trong lượt hai.",
        "\"Tìm Pod/node dùng nhiều CPU/RAM nhất (theo label, namespace), ghi tên vào /opt/…\" — `k top pod -A --sort-by=cpu|memory`, `-l`, `--containers`, `--no-headers | head -1`; đúng định dạng đề yêu cầu (`<ns>/<pod>` hay chỉ tên).",
        "\"Ghi log của container X trong Pod Y / Event của đối tượng Z vào /opt/…\" — `k logs -c`, `--previous`, `k get events --field-selector involvedObject.name=…,type=Warning --sort-by=.lastTimestamp`.",
        "\"Service S không trả lời / Deployment D Pending; sửa\" — EndpointSlice và containerPort, DNS và NetworkPolicy egress, Event FailedScheduling đọc từng vế (taint, nodeSelector, affinity, tài nguyên).",
        "Ghi đáp án: đúng đường dẫn tuyệt đối đề cho (thư mục có thể chưa có: `mkdir -p`), đúng định dạng, không thêm dòng tiêu đề; `cat` lại tệp trước khi sang câu khác.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 2 phút: ghi tên (chỉ tên) của Pod dùng nhiều bộ nhớ nhất trong namespace `kube-system` vào `/tmp/top-mem.txt`.",
          timeLimitMin: 2,
          solution: "```bash\nk top pod -n kube-system --sort-by=memory --no-headers | head -1 | awk '{print $1}' > /tmp/top-mem.txt\ncat /tmp/top-mem.txt\n```\nTrên lab là `kube-apiserver-cka-cp` (đo 407–511Mi).",
        },
        {
          text: "Trong 3 phút: ghi lượng CPU (nguyên chuỗi, như `42912679n`) mà Metrics API báo cho node `cka-w2` vào `/tmp/w2-cpu.txt`.",
          timeLimitMin: 3,
          solution: "```bash\nk get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w2 | python3 -c 'import json,sys; print(json.load(sys.stdin)[\"usage\"][\"cpu\"])' > /tmp/w2-cpu.txt\n```\nHay `k get nodes.metrics.k8s.io cka-w2 -o jsonpath='{.usage.cpu}'`. `n` là nanocore: 42912679n ≈ 43m.",
        },
      ],
    },
    tips: [
      "Mỗi câu: `use-context` của đề trước tiên, đáp án ghi xong thì `cat` lại tệp. Sai đường dẫn hay sai định dạng là 0 điểm dù bạn tìm đúng.",
      "Câu hỏi về \"lúc sự cố\" (Event, log, Pod không Ready) làm **trước** khi sửa câu cùng đối tượng: sửa xong thì bằng chứng đổi.",
      "Sửa một chỗ mà triệu chứng đổi (treo → 502, selector → taint) là tiến bộ, không phải thất bại: đọc thông báo mới.",
      "Dọn Pod ngốn CPU và Pod thử trước khi sang việc khác, nhất là trước buổi mock: `cruncher` chiếm 300m của một worker 2 CPU.",
    ],
    outcome: {
      md: `Sáu câu xong trong giờ, cluster sạch cho mock. Trên Mac:

\`\`\`bash
./labs/lab verify cka s51
\`\`\`

Bảy dòng, chấm theo sự thật lúc sự cố mà \`begin\` ghi ở \`/root/.lab/st9-multi/\`, không theo chuỗi đoán được. **Q1:** đúng một dòng \`<namespace>/<Pod>\` bằng Pod ngốn CPU nhất lúc sự cố (chỉ tên Pod: đỏ, đo), \`/opt/answers/\` chủ ubuntu; vẫn xanh sau khi xoá cruncher. **Q2:** JSON NodeMetrics của \`cka-w1\` có usage, timestamp sau lúc \`begin\` (của cka-w2: đỏ \`metadata.name cka-w2\`, đo). **Q3:** đúng reason đã ghi (\`Warning\`: đỏ). **Q4:** đúng bốn dòng của container phụ (\`--all-containers\`: đỏ \`có dòng của container app\`, đo). **Q5:** \`curl\` từ cka-cp tới ClusterIP:port của report-svc trả 200 với 3 sản phẩm, \`default-deny\` còn nguyên spec (xoá mọi NetworkPolicy mà không sửa targetPort: đỏ cả hai lý do, đo). **Q6:** worker không còn taint ngoài \`node.kubernetes.io/*\`, indexer còn (xoá thay vì sửa: đỏ \`thiếu Deployment indexer\`, đo), container như lúc sự cố, \`nodeSelector\` \`disktype=ssd\`, Pod Ready trên node mang nhãn đó; cộng lõi khoẻ (ba node, control plane, shop trải hai worker) và dữ liệu như cuối s45 (dòng \`STATE\` của s43). **Sổ tay:** heading chứa \`s51\`. Ngay sau \`begin\`: **0/7** trong 74 giây (đo).`,
      verifyOutput: "lab: kiểm s51\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~16 phút)\n  ✓ Q1 /opt/answers/top-cpu.txt: <namespace>/<Pod> ngốn CPU nhất toàn cluster; /opt/answers chủ ubuntu\n  ✓ Q2 /opt/answers/node-metrics.json: NodeMetrics thô của cka-w1 (Metrics API), lấy sau khi begin\n  ✓ Q3 /opt/answers/events.txt: reason của Event cảnh báo mới nhất của indexer\n  ✓ Q4 /opt/answers/sidecar.log: đúng các dòng log của container phụ\n  ✓ Q5 report-svc → report → gateway.shop trả 200 (3 sản phẩm); default-deny của s51-batch còn nguyên\n  ✓ Q6 worker không còn taint lạ, indexer chạy trên node disktype=ssd; lõi khoẻ (ba node, control plane, shop), dữ liệu như s45\n  ✓ ~/notes/runbook.md có mục s51 (triệu chứng, nguyên nhân, lệnh) ≥ 3 dòng\n  → 7/7 đạt",
      projectDelta: "Sổ tay sự cố đủ sáu mục s46–s51 (mốc project của chặng 9). Cluster ở mốc `st9-done`: lõi khoẻ, s51-batch đã sửa và không còn Pod ngốn CPU, /opt/answers/ sẵn cho mock.",
    },
    review: [
      { q: "Sửa `targetPort` của report-svc xong, curl đổi từ treo sang 502 `bad address`. Bạn đọc gì tiếp, và vì sao không quay lại sửa Service?", a: "Triệu chứng đổi nghĩa là tầng Service đã đúng (request đã tới Pod, CGI đã chạy) và lỗi nằm ở tầng kế: report không phân giải `gateway.shop`. `nslookup` trong Pod (`connection timed out`), `describe netpol` (egress chỉ cổng 8080): default-deny chặn DNS. Sửa bằng policy egress 53/UDP, TCP tới kube-dns, giữ default-deny." },
      { q: "Vì sao curl tới cổng sai (8081) **treo** chứ không `connection refused`?", a: "default-deny cộng policy report chỉ cho ingress cổng 8080: gói tới 8081 bị dataplane của Calico bỏ, không ai trả RST, nên client chờ tới hết giờ (đo: 60 giây, mã 000). `refused` là gói tới được Pod mà không ai nghe cổng đó. Treo ở tầng Service thường là NetworkPolicy hay route." },
      { q: "`FailedScheduling: 0/3 nodes are available: 1 node(s) didn't match Pod's node affinity/selector, 2 node(s) had untolerated taint(s)`. Đọc thế nào, và vì sao sửa nodeSelector rồi Pod vẫn Pending?", a: "Mỗi vế là một nhóm node bị loại vì một lý do, cộng lại bằng 3: cka-cp và cka-w2 có taint (control-plane, maintenance), cka-w1 không có nhãn đúng. Chỉ cka-w2 có `disktype=ssd`, mà nó lại có taint lạ; sửa selector xong thì cka-w2 khớp nhãn nhưng vẫn bị taint loại. Gỡ taint (hay thêm toleration nếu taint là cố ý — ở đây không)." },
      { q: "Vì sao câu Q3 (Event lúc sự cố) phải làm trước Q6, và Q1 vẫn được chấm đúng sau khi bạn xoá cruncher?", a: "Sửa indexer thì ReplicaSet mới tạo Pod mới, Event Warning cũ thuộc Pod cũ và hết hạn sau ~1 giờ: bằng chứng đổi. Đề thường hỏi \"lúc này\" nên làm câu đọc trước câu sửa. Q1 hỏi Pod ngốn CPU lúc sự cố; lab ghi tên Pod đó lúc `begin`, nên dọn nó sau khi đã ghi đáp án là đúng (và nên làm trước mock)." },
      { q: "So sánh đọc hai sự cố hai chỗ của buổi này với đọc một stack trace Spring nhiều tầng.", a: "Lớp ngoài chỉ nói kết quả (curl 000 rồi 502; `DispatcherServlet` 500), lớp trong nói nguyên nhân (EndpointSlice cổng 8081, `bad address`; `Caused by: UnknownHostException`). Sửa một nguyên nhân thì đọc lại lớp trong mới nhất, không giả định lỗi cũ còn; dừng khi kiểm từ ngoài vào (curl 200, Pod Running) thành công." },
    ],
  },
];
