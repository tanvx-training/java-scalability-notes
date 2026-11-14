// Chặng 2 — Workload: chạy ba service shop.
// s10–s16 đã phát hành; script lab ở labs/cka/sessions/s10…s16 (đã chạy thật trên VM Multipass: Kubernetes 1.36.6,
// image shop 1.0, H2 trong bộ nhớ). outcome.verifyOutput chép từ output thật của `./labs/lab verify cka sNN`
// (node, IP, tên ReplicaSet trên máy bạn sẽ khác).

export const sessions = [
  // ───────────────────────────── s10 ─────────────────────────────
  {
    id: "s10",
    stage: "st2",
    title: "Pod đầu tiên của shop: run, logs, exec, port-forward",
    durationMin: 60,
    domain: "workloads",
    competencies: ["wl-selfheal"],
    requires: ["s09"],
    status: "published",
    pieces: [],
    goals: [
      "Chạy catalog thành một Pod bằng kubectl run, rồi sinh YAML bằng $do và sửa trước khi apply.",
      "Gọi /actuator/health của Pod từ máy cka-cp qua port-forward và từ bên trong Pod qua exec.",
      "Đọc Events của Pod để biết nó được xếp lên node nào và vì sao chưa Running.",
    ],
    skills: [
      { skill: "k-run-pod", level: "Gõ được không tra" },
      { skill: "k-run-dry-yaml", level: "Thành phản xạ" },
      { skill: "k-logs", level: "Gõ được không tra" },
      { skill: "k-exec", level: "Gõ được không tra" },
      { skill: "k-port-forward", level: "Gõ được không tra" },
      { skill: "k-describe-pod", level: "Thành phản xạ" },
      { skill: "k-get-wide", level: "Gõ được không tra" },
      { skill: "k-delete-now", level: "Gõ được không tra" },
    ],
    uses: ["k-alias-k", "k-exam-vars", "k-crictl-images", "net-curl-nc"],
    foundation: null,
    mindset: `**Pod = một tiến trình JVM có địa chỉ IP riêng.** Khi bạn chạy \`java -jar catalog.jar\` trên laptop, tiến trình dùng chung IP và dải cổng với mọi thứ khác trên máy: hai service cùng muốn cổng 8080 là đụng nhau. Pod bỏ ràng buộc đó. Mỗi Pod có network namespace riêng, tức một IP riêng trong pod CIDR \`10.244.0.0/16\` (Calico cấp), nên mọi Pod của shop đều nghe 8080 mà không tranh nhau. Trong Pod, JVM là tiến trình số 1 (\`/proc/1\`), chạy bằng user \`10001\` của image, thư mục làm việc là \`/\`.

| Trên laptop | Trong cluster |
|---|---|
| \`java -jar catalog.jar\` | \`kubectl run catalog --image=shop/catalog:1.0\` |
| \`tail -f catalog.log\` | \`kubectl logs catalog -f\` (stdout của JVM) |
| \`ssh\` rồi \`jcmd\`, \`ps\` | \`kubectl exec -it catalog -- bash\` |
| \`curl localhost:8080/actuator/health\` | \`kubectl port-forward pod/catalog 8080:8080\` rồi \`curl\` trên cka-cp |
| Ai khởi động lại khi chết? systemd, script… | kubelet, theo \`restartPolicy\` của Pod |

**Pod lẻ không tự lành ở mức cluster.** kubelet khởi động lại *container* chết trong Pod (restartPolicy \`Always\`), nhưng nếu *Pod* bị xoá hay node chết thì không ai tạo lại Pod lẻ. Đó là việc của Deployment ở s11. Hôm nay dùng Pod lẻ để nhìn rõ vòng đời của một instance trước khi giao nó cho controller.

**Spec của Pod gần như bất biến.** Bạn chỉ đổi được image, \`activeDeadlineSeconds\`, toleration (thêm) và vài trường khác; thêm \`containerPort\` hay đổi lệnh thì phải xoá rồi tạo lại (\`kubectl replace --force -f pod.yaml\`). Vì thế trong phòng thi: sinh YAML bằng \`$do\`, sửa xong rồi mới tạo, đừng tạo trước rồi sửa.

**Ready chưa có nghĩa là app đã nghe.** Pod của hôm nay chưa có readinessProbe, nên kubelet báo \`Ready\` ngay khi container chạy, trong khi Spring Boot còn mất khoảng 5 giây nữa mới mở cổng (log: \`Started CatalogApplication in 5.653 seconds\`). Gọi vào ngay lúc đó sẽ bị \`connection refused\`. s13 sửa chuyện này bằng probe trỏ vào Actuator.`,
    refs: [
      { label: "Bài lộ trình CKA: Chuỗi hoạt động kubectl apply → API server → etcd → scheduler → kubelet → runtime", href: "#/roadmap/cka/cka-w1-4" },
      { label: "Bài lộ trình CKA Study Guide: Pod và namespace ở tốc độ mệnh lệnh", href: "#/roadmap/ckabook/cb-w3-1" },
      { label: "Bài lộ trình CKAD: Tạo Pod đầu tiên bằng kubectl run và YAML", href: "#/roadmap/ckad/w1-5" },
      { label: "CKA Study Guide, chương 9 — Pod và Namespace", href: "#/docs/ckabook-09" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "Thực hành nhanh: lệnh kubectl run, logs, exec, port-forward", href: "#/commands" },
      { label: "kubernetes.io: Pods", href: "https://kubernetes.io/docs/concepts/workloads/pods/" },
      { label: "kubernetes.io: Debug Pods", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/" },
      { label: "kubernetes.io: Use Port Forwarding to Access Applications in a Cluster", href: "https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/" },
    ],
    stateIn: `Đầu ra s09: ba node \`Ready\`; image \`shop/gateway\`, \`shop/catalog\`, \`shop/order\` (tag \`1.0\`, \`2.0\`) đã nạp vào containerd cả ba node. Chưa nạp thì chạy trên Mac \`./labs/lab images cka\` (cần Docker). \`./labs/lab begin cka s10\` kiểm đầu vào bằng verify của s09. Làm mọi lệnh trên cka-cp bằng user \`ubuntu\`, với \`alias k=kubectl\` và biến \`$do\`, \`$now\` của s02.`,
    stateOut: "Pod catalog (nhãn app=catalog, containerPort 8080) Running trong namespace default, trả UP ở /actuator/health; ~/drills/s10/pod.yaml và ~/drills/s10/answers.env.",
    tasks: [
      { id: "t1", text: "Trên cka-cp: `sudo crictl images | grep shop` (image đã có sẵn trên node, không cần registry). Chạy `k run catalog --image=shop/catalog:1.0`, rồi `k get pod -o wide` — Pod nằm ở node nào, IP gì?" },
      { id: "t2", text: "`k logs catalog` — tìm dòng `Tomcat started on port` và `Started CatalogApplication`. `k exec catalog -- id -u` và `k exec -it catalog -- bash`: image không có `curl`, hãy gọi `/actuator/health` từ trong Pod bằng `/dev/tcp` của bash. Ghi vào `~/drills/s10/answers.env` dòng `LOG_DB_USER=<giá trị>` với giá trị `user=` trong dòng `HikariPool-1 - Added connection` của log." },
      { id: "t3", text: "`k port-forward pod/catalog 8080:8080` ở một cửa sổ tmux, cửa sổ kia `curl -s localhost:8080/actuator/health` và `curl -s localhost:8080/products`. Ghi `PRODUCTS=<số sản phẩm /products trả về>` vào `answers.env`. Dừng port-forward bằng Ctrl-c." },
      { id: "t4", text: "Sinh YAML: `k run catalog --image=shop/catalog:1.0 $do > ~/drills/s10/pod.yaml`. Sửa trong vim: nhãn `app: catalog` (thay `run: catalog`) và `ports: - containerPort: 8080`. `k apply -f` lên Pod đang chạy — đọc lỗi, rồi thay Pod bằng tệp: `k replace --force -f ~/drills/s10/pod.yaml`." },
      { id: "t5", text: "Tình huống hỏng: `k run catalog-bad --image=shop/catalog:9.9`. Sau 30 giây `k get pod catalog-bad`, `k describe pod catalog-bad` — đọc Events từ trên xuống: node nào nhận Pod, kubelet thử kéo image từ đâu, vì sao thất bại? Ghi giá trị cột STATUS lúc bạn xem vào `answers.env` dạng `BAD_REASON=<STATUS>`, rồi xoá Pod." },
      { id: "t6", text: "Ghi `~/drills/s10/answers.env`: `NODE=` (node chạy Pod catalog), `POD_IP=`, `RUN_UID=` (kết quả `id -u` trong Pod), cùng `LOG_DB_USER`, `PRODUCTS`, `BAD_REASON` từ các bước trước. Trên Mac: `./labs/lab verify cka s10` phải đạt 12/12." },
    ],
    hints: [
      "Pod `Running` mà `curl` qua port-forward báo `connection refused`? Spring Boot cần vài giây sau khi container chạy; chờ tới khi `k logs catalog` có `Started CatalogApplication`.",
      "`k apply` lên Pod tạo bằng `k run` báo `pod updates may not change fields other than spec.containers[*].image…`: cổng là trường bất biến. `k replace --force -f ~/drills/s10/pod.yaml` làm xoá + tạo trong một lệnh.",
      "`/dev/tcp` chỉ có trong bash, không có trong `sh`: `k exec catalog -- bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080; printf \"GET /actuator/health HTTP/1.0\\r\\n\\r\\n\" >&3; cat <&3'`.",
      "Events của Pod nằm cuối `k describe pod`; cách khác: `k get events --field-selector involvedObject.name=catalog-bad --sort-by=.lastTimestamp`.",
      "Nhanh nhất cho `NODE` và `POD_IP`: `k get pod catalog -o jsonpath='{.spec.nodeName} {.status.podIP}'`.",
    ],
    solution: `Output là của máy soạn bài; node và IP trên máy bạn sẽ khác.

**1. Chạy và nhìn** (cka-cp)

\`\`\`bash
sudo crictl images | grep shop/catalog
# docker.io/shop/catalog   1.0   6b908f1652753   140MB
k run catalog --image=shop/catalog:1.0
k get pod -o wide
# catalog   1/1   Running   0   15s   10.244.62.132   cka-w2   <none>   <none>
\`\`\`

Image được \`lab images\` nạp thẳng vào containerd của từng node (namespace \`k8s.io\`), nên với tag \`1.0\` kubelet thấy image có sẵn và không kéo (mặc định \`imagePullPolicy: IfNotPresent\` cho tag khác \`latest\`).

**2. logs và exec**

\`\`\`bash
k logs catalog | grep -E 'Tomcat started|Started|HikariPool-1 - Added'
# … HikariPool-1 - Added connection conn0: url=jdbc:h2:mem:shop user=SA
# … Tomcat started on port 8080 (http) with context path '/'
# … Started CatalogApplication in 5.653 seconds (process running for 6.962)
k exec catalog -- id -u                 # 10001
k exec catalog -- bash -c 'exec 3<>/dev/tcp/127.0.0.1/8080; printf "GET /actuator/health HTTP/1.0\\r\\n\\r\\n" >&3; cat <&3'
# HTTP/1.1 200
# Content-Type: application/vnd.spring-boot.actuator.v3+json
# …
# {"groups":["liveness","readiness"],"status":"UP"}
\`\`\`

Log của Pod là stdout/stderr của JVM: không có tệp log nào phải tìm. Image dựa trên \`eclipse-temurin:25-jre\`, không có \`curl\`/\`wget\`; bash có \`/dev/tcp\` là đủ để thử một cổng từ trong container.

**3. port-forward**

\`\`\`bash
k port-forward pod/catalog 8080:8080      # cửa sổ 1
# Forwarding from 127.0.0.1:8080 -> 8080
curl -s localhost:8080/actuator/health    # cửa sổ 2
# {"groups":["liveness","readiness"],"status":"UP"}
curl -s localhost:8080/products
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây","price":19.90},{"id":3,"name":"Màn hình 27 inch","price":229.00}]
\`\`\`

port-forward mở cổng trên **máy chạy kubectl** (cka-cp, chỉ \`127.0.0.1\`) và đi qua apiserver → kubelet tới Pod; không cần Service.

**4. Sinh YAML bằng $do rồi sửa**

\`\`\`bash
mkdir -p ~/drills/s10
k run catalog --image=shop/catalog:1.0 $do > ~/drills/s10/pod.yaml
vim ~/drills/s10/pod.yaml
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: catalog          # $do sinh ra "run: catalog"
  name: catalog
spec:
  containers:
  - image: shop/catalog:1.0
    name: catalog
    ports:
    - containerPort: 8080
  restartPolicy: Always
\`\`\`

(Nhanh hơn: \`k run catalog --image=shop/catalog:1.0 --port=8080 -l app=catalog $do\` sinh sẵn cả hai.) Áp lên Pod đang chạy thì bị từ chối:

\`\`\`bash
k apply -f ~/drills/s10/pod.yaml
# The Pod "catalog" is invalid: spec: Forbidden: pod updates may not change fields other than \`spec.containers[*].image\`, …
#  -   "Ports": null,
#  +   "Ports": [ { … "ContainerPort": 8080 … } ],
k replace --force -f ~/drills/s10/pod.yaml     # xoá Pod cũ (chờ nó dừng) rồi tạo lại từ tệp
k get pod catalog --show-labels -o wide
\`\`\`

**5. Tình huống hỏng: tag không có**

\`\`\`bash
k run catalog-bad --image=shop/catalog:9.9
k get pod catalog-bad
# catalog-bad   0/1   ImagePullBackOff   0   25s
k describe pod catalog-bad | sed -n '/Events:/,$p'
#   Normal   Scheduled  26s  default-scheduler  Successfully assigned default/catalog-bad to cka-w2
#   Normal   Pulling    …    kubelet            Pulling image "shop/catalog:9.9"
#   Warning  Failed     …    kubelet            Failed to pull image "shop/catalog:9.9": failed to pull and unpack image "docker.io/shop/catalog:9.9": failed to resolve image: pull access denied, repository does not exist or may require authorization …
#   Warning  Failed     …    kubelet            Error: ErrImagePull
#   Normal   BackOff    …    kubelet            Back-off pulling image "shop/catalog:9.9"
#   Warning  Failed     …    kubelet            Error: ImagePullBackOff
k delete pod catalog-bad $now
\`\`\`

Đọc Events theo thứ tự: \`Scheduled\` (scheduler đã làm xong việc, lỗi không nằm ở xếp lịch) → \`Pulling\` → \`Failed\`. Tên image không có registry được hiểu là \`docker.io/…\`; tag \`9.9\` không có trên node nên kubelet đi kéo và thất bại. \`ErrImagePull\` là lần thất bại vừa xảy ra, \`ImagePullBackOff\` là lúc kubelet đang chờ (lùi dần) trước lần thử sau: cột STATUS đổi qua lại giữa hai giá trị.

**6. Đáp án**

\`\`\`bash
cat > ~/drills/s10/answers.env <<EOF
NODE=$(k get pod catalog -o jsonpath='{.spec.nodeName}')
POD_IP=$(k get pod catalog -o jsonpath='{.status.podIP}')
RUN_UID=$(k exec catalog -- id -u)
LOG_DB_USER=SA
PRODUCTS=3
BAD_REASON=ImagePullBackOff
EOF
cat ~/drills/s10/answers.env
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s10/apply.sh\` (tạo cả Pod tag sai để đọc lý do chờ, rồi xoá).`,
    exam: {
      patterns: [
        "\"Tạo Pod tên X, image Y, nhãn Z, cổng N trong namespace W\" — `k run … --port … -l … $do`, sửa thêm nếu cần, rồi `apply`.",
        "\"Ghi log của Pod vào tệp /opt/…\" — `k logs <pod> > /opt/…`; với Pod nhiều container thêm `-c`.",
        "\"Pod không Running, tìm nguyên nhân và sửa\" — `describe pod`, đọc Events: image sai, thiếu tài nguyên, không có node phù hợp…",
        "Sửa một trường bất biến của Pod: `k get pod x -o yaml > x.yaml`, sửa, `k replace --force -f x.yaml`.",
      ],
      timeTargetMin: 4,
      drills: [
        {
          text: "Trong 3 phút: tạo Pod `order-probe` image `shop/order:1.0`, nhãn `app=order-probe`, cổng 8080, rồi in ra (một lệnh) node và IP của nó. Xoá Pod khi xong (verify không cần).",
          timeLimitMin: 3,
          solution: "```bash\nk run order-probe --image=shop/order:1.0 --port=8080 -l app=order-probe\nk get pod order-probe -o jsonpath='{.spec.nodeName} {.status.podIP}{\"\\n\"}'\nk delete pod order-probe $now\n```",
        },
        {
          text: "Một Pod `web` báo `ImagePullBackOff`. Trong 2 phút, đưa nó về Running với image `nginx:1.29-alpine` mà không xoá Pod.",
          timeLimitMin: 2,
          solution: "```bash\nk set image pod/web web=nginx:1.29-alpine     # image là một trong số ít trường sửa được trên Pod\nk get pod web -w\n```\nTên container (`web=`) lấy từ `k get pod web -o jsonpath='{.spec.containers[*].name}'`.",
        },
      ],
    },
    tips: [
      "`$do` trước, tạo sau: Pod gần như không sửa được tại chỗ, sửa YAML rồi mới `apply` đỡ một vòng xoá/tạo.",
      "`k get pod -o wide` một lần cho cả node, IP, số lần restart: thói quen đầu tiên khi nhìn một Pod.",
      "Events cũ hơn khoảng một giờ bị xoá: chẩn đoán xong thì ghi lại, đừng trông vào chúng ở lần sau.",
      "`k delete pod x $now` (`--force --grace-period=0`) chỉ dùng cho Pod bạn đang thử nghiệm (như `catalog-bad`); với Pod thật, `k replace --force -f` hay `k delete` thường để nó dừng tử tế.",
    ],
    outcome: {
      md: `Pod \`catalog\` đầu tiên của shop chạy trong namespace \`default\`, đúng nhãn và cổng, trả \`UP\` ở Actuator. Trên Mac:

\`\`\`bash
./labs/lab verify cka s10
\`\`\`

Verify gọi \`/actuator/health\` qua proxy của apiserver (\`/api/v1/namespaces/default/pods/catalog:8080/proxy/…\`), tự đọc node, IP và \`id -u\` của Pod để so với tệp của bạn.`,
      verifyOutput: "lab: kiểm s10\n  (chờ apiserver và Pod catalog trả lời, tối đa khoảng 8 phút nếu Pod đang khởi động)\n  ✓ Pod catalog (default) Running và Ready\n  ✓ Pod catalog chạy image shop/catalog:1.0\n  ✓ Pod catalog có nhãn app=catalog\n  ✓ Pod catalog khai containerPort 8080\n  ✓ ~/drills/s10/pod.yaml qua apply --dry-run=server, mô tả Pod/catalog/default\n  ✓ /actuator/health của Pod catalog trả UP (qua apiserver proxy)\n  ✓ answers.env: NODE=cka-w2\n  ✓ answers.env: POD_IP=10.244.62.131\n  ✓ answers.env: RUN_UID=10001 (kubectl exec … id -u)\n  ✓ answers.env: LOG_DB_USER=SA (user trong dòng 'Added connection' của k logs)\n  ✓ answers.env: PRODUCTS=3 (số sản phẩm của /products; verify đếm lại qua apiserver proxy)\n  ✓ answers.env: BAD_REASON là lý do chờ của Pod tag sai (ErrImagePull hoặc ImagePullBackOff)\n  → 12/12 đạt",
      projectDelta: "catalog chạy được trên cluster dưới dạng một Pod: bạn đã thấy log, tiến trình, cổng và các Event của nó. Buổi sau thay Pod lẻ bằng Deployment cho cả ba service và nối chúng bằng Service.",
    },
    review: [
      { q: "Vì sao hai Pod cùng nghe cổng 8080 không đụng nhau, còn hai tiến trình Java trên laptop thì có?", a: "Mỗi Pod có network namespace và IP riêng (Calico cấp trong pod CIDR); cổng chỉ cần duy nhất trong một Pod. Hai tiến trình trên laptop dùng chung một IP và dải cổng." },
      { q: "`k apply` thêm `containerPort` vào Pod đang chạy bị từ chối. Làm sao cho nhanh?", a: "Spec Pod gần như bất biến (chỉ image, activeDeadlineSeconds, toleration thêm…). Dùng `k replace --force -f pod.yaml` (xoá rồi tạo) hoặc `k delete pod … $now` rồi `apply`." },
      { q: "`ErrImagePull` và `ImagePullBackOff` khác nhau thế nào?", a: "`ErrImagePull`: lần kéo vừa thất bại. `ImagePullBackOff`: kubelet đang chờ (thời gian chờ tăng dần) trước lần kéo tiếp. Cùng một nguyên nhân; nguyên nhân thật nằm ở Event `Failed to pull image …`." },
      { q: "port-forward mở cổng ở đâu và đi đường nào tới Pod?", a: "Trên máy chạy kubectl, mặc định `127.0.0.1`. Kết nối đi kubectl → apiserver → kubelet của node → Pod; không cần Service hay NodePort." },
      { q: "Pod đã `Ready` nhưng gọi vào bị `connection refused`. Vì sao, ở buổi này?", a: "Chưa có readinessProbe nên Ready ngay khi container chạy, trong khi Spring Boot còn vài giây mới mở cổng 8080. Probe (s13) sửa chuyện này." },
    ],
  },

  // ───────────────────────────── s11 ─────────────────────────────
  {
    id: "s11",
    stage: "st2",
    title: "Deployment, ReplicaSet và Service tối thiểu cho ba service",
    durationMin: 90,
    domain: "workloads",
    competencies: ["wl-deploy-rollout"],
    requires: ["s10"],
    status: "published",
    pieces: ["deployments"],
    goals: [
      "Viết ba Deployment gateway, catalog, order từ YAML sinh bằng kubectl create, sửa nhanh bằng macro vim.",
      "Xoá một Pod và chỉ ra ReplicaSet nào tạo lại nó, qua ownerReferences.",
      "Expose ba service bằng Service ClusterIP tối thiểu để gateway gọi được catalog và order.",
    ],
    skills: [
      { skill: "k-create-deploy", level: "Thành phản xạ" },
      { skill: "k-scale", level: "Gõ được không tra" },
      { skill: "k-expose", level: "Gõ được không tra" },
      { skill: "k-deploy-rs-pod", level: "Giải thích được" },
      { skill: "k-labels-selectors", level: "Gõ được không tra" },
      { skill: "vim-paste-mode", level: "Thành phản xạ" },
      { skill: "vim-macro", level: "Dùng được trên 3 tệp" },
      { skill: "k-docs-kubectl-ref", level: "Tìm được trong 30 giây" },
    ],
    uses: ["k-run-dry-yaml", "k-delete-now", "k-get-wide", "vim-substitute", "k-logs"],
    foundation: {
      area: "vim",
      md: `**Hai thao tác vim cho YAML nhiều tệp.**

**1. Dán không vỡ thụt lề: \`:set paste\`.** Khi bạn dán một khối YAML từ trình duyệt vào vim trong terminal, vim nhận từng ký tự như thể bạn đang gõ: \`autoindent\` (và các plugin thụt lề) cộng thêm khoảng trắng ở mỗi dòng, khối YAML trôi dần sang phải và hỏng cấu trúc. \`:set paste\` tắt tạm những thứ đó; dán xong \`:set nopaste\`. Đáy màn hình hiện \`-- INSERT (paste) --\` khi đang bật.

**2. Lặp một chỉnh sửa trên nhiều tệp: macro.** \`qa\` bắt đầu ghi vào thanh ghi \`a\`, mọi phím bạn gõ được ghi lại, \`q\` dừng. \`@a\` chạy lại, \`@@\` chạy lại macro vừa chạy, \`3@a\` chạy ba lần. Kết hợp với danh sách tệp của vim (\`vim a.yaml b.yaml c.yaml\`, \`:n\` sang tệp sau, \`:args\` xem danh sách), bạn sửa tệp đầu một lần rồi phát lại trên các tệp còn lại.

Mẹo để macro chạy đúng trên tệp khác: bắt đầu bằng một bước định vị không phụ thuộc vị trí con trỏ (\`gg\`, một lệnh \`:%s\`, hay \`/mẫu\`), và kết thúc bằng \`:w\` để lưu.

**Bài tập nền (5 phút):** \`printf 'a: 1\\nb: 2\\n' | tee /tmp/m1 /tmp/m2 /tmp/m3 >/dev/null; vim /tmp/m1 /tmp/m2 /tmp/m3\`. Ghi macro \`qa\` thêm dòng \`c: 3\` cuối tệp (\`Go\`, gõ, \`Esc\`, \`:w\`), \`q\`; rồi \`:n\` \`@a\`, \`:n\` \`@@\`. \`cat /tmp/m?\`.`,
    },
    mindset: `**Deployment = "chạy N instance giống hệt nhau sau một load balancer", được viết thành dữ liệu.** Trước Kubernetes, chạy ba instance catalog nghĩa là ba máy (hay ba tiến trình), một cấu hình load balancer trỏ tới chúng, và ai đó canh để thay instance chết. Kubernetes chia việc đó cho ba đối tượng:

| Việc | Đối tượng | Trên cluster lab |
|---|---|---|
| Giữ đúng N bản sao của một mẫu Pod | **ReplicaSet** | \`catalog-cd5c8d544\`, DESIRED 2 |
| Quản lý các phiên bản của mẫu Pod (rollout ở s14) | **Deployment** | \`catalog\`, tạo và giữ ReplicaSet |
| Một tên và một địa chỉ ổn định trước các instance | **Service** (ClusterIP) | \`catalog\` → \`10.110.76.88:8080\` |

**Quan hệ cha con viết trong ownerReferences.** Pod \`catalog-cd5c8d544-p9jcd\` có \`ownerReferences: [{kind: ReplicaSet, name: catalog-cd5c8d544, controller: true}]\`; ReplicaSet đó có \`ownerReferences: [{kind: Deployment, name: catalog}]\`. Phần \`cd5c8d544\` là \`pod-template-hash\`: băm của mẫu Pod, vừa nằm trong tên vừa là một nhãn của ReplicaSet và Pod, để hai ReplicaSet của hai phiên bản mẫu không giành Pod của nhau. Xoá một Pod: ReplicaSet thấy còn 1/2 và tạo Pod mới; Deployment không đụng tới.

**Service không biết Deployment, chỉ biết nhãn.** \`kubectl expose deploy catalog\` chỉ chép selector \`app=catalog\` của Deployment sang Service. EndpointSlice controller tìm mọi Pod mang nhãn đó và ghi IP của chúng vào EndpointSlice \`catalog-xxxxx\`; kube-proxy trên từng node biến nó thành rule iptables (chặng mạng sẽ mổ xẻ; rule đọc được bằng \`sudo iptables -t nat -S | grep <service>\`). Đây chính là load balancer: khi một Pod bị thay, IP mới vào EndpointSlice, client vẫn gọi \`http://catalog:8080\`. Spring \`RestClient\` trong gateway trỏ tới \`app.catalog-url=http://catalog:8080\`, nên tên Service phải đúng là \`catalog\` và cổng Service phải là \`8080\`.

**Selector lệch nhãn là lỗi im lặng.** Một Service selector \`app=catalog-api\` trong khi Pod mang \`app=catalog\` vẫn được tạo bình thường, có ClusterIP, nhưng EndpointSlice không có địa chỉ nào: client nhận \`connection refused\` hoặc treo. Kiểm tra đầu tiên khi một Service "không chạy": \`k get endpointslices -l kubernetes.io/service-name=<svc>\`.`,
    refs: [
      { label: "Bài lộ trình CKA Study Guide: Deployment — rolling update, rollback và thay thế replica", href: "#/roadmap/ckabook/cb-w3-3" },
      { label: "Bài lộ trình CKA Study Guide: Service — ClusterIP, NodePort và LoadBalancer", href: "#/roadmap/ckabook/cb-w5-1" },
      { label: "Bài lộ trình CKA: kube-proxy làm gì — iptables/ipvs mode", href: "#/roadmap/cka/cka-w6-1" },
      { label: "Bài lộ trình CKAD: ReplicaSets — cơ chế duy trì số replica", href: "#/roadmap/ckad/w3-1" },
      { label: "Bài lộ trình CKAD: Labels, Selectors, Annotations", href: "#/roadmap/ckad/w2-5" },
      { label: "CKA Study Guide, chương 11 — Deployment và ReplicaSet", href: "#/docs/ckabook-11" },
      { label: "CKA Study Guide, chương 17 — Service", href: "#/docs/ckabook-17" },
      { label: "Thực hành nhanh: create deploy, scale, expose", href: "#/commands" },
      { label: "kubernetes.io: Deployments", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
      { label: "kubernetes.io: Service", href: "https://kubernetes.io/docs/concepts/services-networking/service/" },
      { label: "kubernetes.io: kubectl Quick Reference", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
    ],
    stateIn: `Đầu ra s10: Pod lẻ \`catalog\` (nhãn \`app=catalog\`) Running trong \`default\`, \`~/drills/s10/answers.env\` đã ghi. \`./labs/lab begin cka s11\` kiểm đầu vào bằng \`check.sh\` riêng của s11: như verify của s10 nhưng chỉ đòi \`POD_IP\` là một IPv4, vì Pod được dựng lại sau khi VM khởi động lại thì IP có thể khác.`,
    stateOut: "Namespace shop có Deployment gateway (1), catalog (2), order (1) image :1.0 và ba Service ClusterIP cổng 8080; gateway gọi được catalog và order; manifest ở ~/shop/.",
    tasks: [
      { id: "t1", text: "Xoá Pod lẻ: `k delete pod catalog` (để nó dừng tử tế; Deployment thay nó từ đây). Tạo namespace `shop`." },
      { id: "t2", text: "Sinh ba tệp **không** kèm `-n`: `k create deploy gateway --image=shop/gateway:1.0 --port=8080 $do > ~/shop/gateway.yaml`, tương tự `catalog`, `order`. Mở cả ba `vim ~/shop/*.yaml`, ghi một macro thêm dòng `  namespace: shop` ngay dưới `  name:` của `metadata`, lưu, phát lại trên hai tệp còn lại. `k apply -f ~/shop/`." },
      { id: "t3", text: "Trong 30 giây, tìm trong *kubectl Quick Reference* (kubernetes.io) mục *Scaling resources* rồi scale `catalog` lên 2 replica; sửa luôn `replicas: 2` trong `~/shop/catalog.yaml` và `k apply -f` lại (verify chấm cả tệp: buổi sau bạn sẽ apply lại chính tệp này). `k -n shop get deploy,rs,pod -o wide --show-labels`: đọc `pod-template-hash`." },
      { id: "t4", text: "Xoá một Pod catalog. Lần ngược: `ownerReferences` của Pod mới trỏ tới đâu, của ReplicaSet đó trỏ tới đâu? Ghi `CATALOG_RS=<tên ReplicaSet hiện hành>` vào `~/drills/s11/answers.env`." },
      { id: "t5", text: "`k -n shop expose deploy <tên> --port=8080` cho cả ba. `k -n shop get svc,endpointslices`. Gọi gateway qua proxy của apiserver: `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products` phải ra 3 sản phẩm; `/api/orders` ra `[]`." },
      { id: "t6", text: "Tình huống hỏng: mở trang *Service* trên kubernetes.io, chép ví dụ đầu tiên (mục *Defining a Service*), trong vim `:set paste` rồi dán vào `~/drills/s11/catalog-api.yaml`, `:set nopaste`. Chỉ sửa tên thành `catalog-api`, thêm `namespace: shop`, cổng và targetPort 8080; **giữ nguyên selector của ví dụ**. Apply, gọi thử qua `k get --raw …/services/catalog-api:8080/proxy/products`, tìm vì sao không có đích. Ghi `EMPTY_SELECTOR=<selector của nó, dạng khoá=giá-trị>` vào `answers.env`, rồi xoá Service đó." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s11` phải đạt 13/13." },
    ],
    hints: [
      "`k create deploy … $do` có `-n shop` thì tệp sinh ra đã có `namespace: shop`. Buổi này cố ý bỏ `-n` để luyện macro; verify đòi tệp tự khai namespace (chạy `apply --dry-run=server` không kèm `-n`).",
      "Macro gọn nhất là một lệnh thay thế: `qa:%s/^  name: .*/&\\r  namespace: shop/<Enter>:w<Enter>q`. `^  name:` (đúng hai dấu cách) chỉ khớp tên trong `metadata`; tên container thụt sâu hơn.",
      "Không thấy ReplicaSet nào là \"hiện hành\"? Chỉ có một: `k -n shop get rs -l app=catalog`. Nhanh: `k -n shop get pod <pod> -o jsonpath='{.metadata.ownerReferences[0].name}'`.",
      "Service có ClusterIP mà gọi không tới: so `k -n shop get svc catalog-api -o jsonpath='{.spec.selector}'` với `k -n shop get pod --show-labels`. EndpointSlice rỗng hiện `ENDPOINTS <unset>`.",
      "gateway trả `{\"error\":\"không kết nối được catalog\"}`: Service `catalog` chưa có, sai tên, hoặc sai cổng (gateway gọi `http://catalog:8080`).",
    ],
    solution: `Output là của máy soạn bài.

**1. Dọn Pod lẻ, tạo namespace**

\`\`\`bash
k delete pod catalog
k create ns shop
\`\`\`

**2. Ba manifest và macro**

\`\`\`bash
mkdir -p ~/shop && cd ~/shop
for d in gateway catalog order; do k create deploy $d --image=shop/$d:1.0 --port=8080 $do > $d.yaml; done
vim gateway.yaml catalog.yaml order.yaml
\`\`\`

Trong vim, ở tệp đầu:

\`\`\`text
qa:%s/^  name: .*/&\\r  namespace: shop/<Enter>:w<Enter>q
:n
@a
:n
@@
:q
\`\`\`

Một tệp sau khi sửa (\`catalog.yaml\`):

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: catalog
  name: catalog
  namespace: shop
spec:
  replicas: 1
  selector:
    matchLabels:
      app: catalog
  strategy: {}
  template:
    metadata:
      labels:
        app: catalog
    spec:
      containers:
      - image: shop/catalog:1.0
        name: catalog
        ports:
        - containerPort: 8080
        resources: {}
status: {}
\`\`\`

\`kubectl create deploy\` tự đặt nhãn \`app: <tên>\` cho Deployment, selector và mẫu Pod: ba chỗ phải khớp nhau, và Service sẽ dựa vào chính nhãn này.

\`\`\`bash
k apply -f ~/shop/
\`\`\`

**3. Scale và đọc pod-template-hash**

*kubectl Quick Reference* → *Scaling resources*: \`kubectl scale --replicas=3 rs/foo\`. Áp vào bài, rồi sửa tệp cho khớp: s12 sẽ sửa và \`apply\` lại chính \`~/shop/catalog.yaml\`; tệp còn \`replicas: 1\` thì lần apply đó kéo catalog về 1 replica.

\`\`\`bash
k -n shop scale deploy catalog --replicas=2
sed -i 's/^  replicas: 1$/  replicas: 2/' ~/shop/catalog.yaml && k apply -f ~/shop/catalog.yaml
k -n shop get deploy,rs -o wide
# deployment.apps/catalog   2/2   2   2   …   shop/catalog:1.0   app=catalog
# replicaset.apps/catalog-cd5c8d544   2   2   2   …   app=catalog,pod-template-hash=cd5c8d544
k -n shop get pod -o wide --show-labels
# catalog-cd5c8d544-p9jcd    1/1  Running … 10.244.62.136  cka-w2 … app=catalog,pod-template-hash=cd5c8d544
# catalog-cd5c8d544-pcs2p    1/1  Running … 10.244.95.137  cka-w1 … app=catalog,pod-template-hash=cd5c8d544
# gateway-5fdd4b4c6c-kgsd4   1/1  Running … 10.244.62.134  cka-w2 … app=gateway,pod-template-hash=5fdd4b4c6c
# order-6c5cc4f85-qz2sg      1/1  Running … 10.244.95.138  cka-w1 … app=order,pod-template-hash=6c5cc4f85
\`\`\`

**4. Xoá một Pod, lần ownerReferences**

\`\`\`bash
k -n shop delete pod catalog-cd5c8d544-pcs2p
k -n shop get pod -l app=catalog          # một Pod mới, AGE vài giây
p=$(k -n shop get pod -l app=catalog -o name | head -1)
k -n shop get $p -o jsonpath='{.metadata.ownerReferences}'
# [{"apiVersion":"apps/v1","blockOwnerDeletion":true,"controller":true,"kind":"ReplicaSet","name":"catalog-cd5c8d544",…}]
k -n shop get rs catalog-cd5c8d544 -o jsonpath='{.metadata.ownerReferences}'
# [{"apiVersion":"apps/v1","blockOwnerDeletion":true,"controller":true,"kind":"Deployment","name":"catalog",…}]
mkdir -p ~/drills/s11
echo "CATALOG_RS=$(k -n shop get $p -o jsonpath='{.metadata.ownerReferences[0].name}')" > ~/drills/s11/answers.env
\`\`\`

**5. Ba Service**

\`\`\`bash
for d in gateway catalog order; do k -n shop expose deploy $d --port=8080; done
k -n shop get svc,endpointslices
# service/catalog   ClusterIP   10.110.76.88    <none>   8080/TCP
# service/gateway   ClusterIP   10.108.93.254   <none>   8080/TCP
# service/order     ClusterIP   10.104.160.14   <none>   8080/TCP
# endpointslice…/catalog-9znf2   IPv4   8080   10.244.95.137,10.244.62.136
# endpointslice…/gateway-qpmhm   IPv4   8080   10.244.62.134
# endpointslice…/order-4pqbz     IPv4   8080   10.244.95.138
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây","price":19.90},{"id":3,"name":"Màn hình 27 inch","price":229.00}]
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/orders
# []
\`\`\`

\`--port=8080\` không kèm \`--target-port\` thì target port bằng port. Đường gọi: apiserver → Service \`gateway\` → Pod gateway → \`http://catalog:8080\` (CoreDNS phân giải trong namespace \`shop\`) → một trong hai Pod catalog.

**6. Tình huống hỏng: selector lệch nhãn**

Ví dụ trên trang *Service* dùng selector \`app.kubernetes.io/name: MyApp\`; sau khi dán (\`:set paste\`) và sửa:

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: catalog-api
  namespace: shop
spec:
  selector:
    app.kubernetes.io/name: MyApp      # giữ nguyên từ ví dụ trên kubernetes.io
  ports:
    - protocol: TCP
      port: 8080
      targetPort: 8080
\`\`\`

\`\`\`bash
k apply -f ~/drills/s11/catalog-api.yaml
k -n shop get endpointslices -l kubernetes.io/service-name=catalog-api
# NAME                ADDRESSTYPE   PORTS     ENDPOINTS   AGE
# catalog-api-rqs2s   IPv4          <unset>   <unset>     0s
k get --raw /api/v1/namespaces/shop/services/catalog-api:8080/proxy/products
# Error from server (ServiceUnavailable): no endpoints available for service "catalog-api"
k -n shop describe svc catalog-api | grep -E 'Selector|Endpoints'
# Selector:                 app.kubernetes.io/name=MyApp
# Endpoints:
k -n shop get pod -l app.kubernetes.io/name=MyApp     # No resources found
k -n shop get pod --show-labels                       # Pod mang app=catalog, app=gateway, app=order
echo "EMPTY_SELECTOR=app.kubernetes.io/name=MyApp" >> ~/drills/s11/answers.env
k -n shop delete svc catalog-api
\`\`\`

\`kubectl create service clusterip catalog-api --tcp=8080:8080\` rơi vào cùng bẫy: nó lấy selector \`app=<tên service>\` (lời giải tự động dùng cách này, nên đáp án của nó là \`EMPTY_SELECTOR=app=catalog-api\`; verify nhận mọi selector khoá=giá-trị không khớp Pod nào trong \`shop\`). \`kubectl expose deploy\` thì không, vì nó chép selector của Deployment.

Lời giải tự động: \`labs/cka/sessions/s11/apply.sh\` (sinh tệp bằng \`-n shop\`, cùng nội dung với cách dùng macro).`,
    exam: {
      patterns: [
        "\"Tạo Deployment X, image Y, N replica trong namespace Z, rồi expose cổng P\" — `create deploy … $do`, `apply`, `expose`.",
        "\"Scale Deployment lên N\" — `k scale`; đề có thể hỏi số Pod chạy trên một node cụ thể (`-o wide`).",
        "\"Service không có endpoint, sửa\" — so selector của Service với nhãn của Pod; sửa bằng `k edit svc` hoặc `k set selector`.",
        "\"Tìm Pod thuộc ReplicaSet/Deployment nào\" — `ownerReferences` hoặc nhãn `pod-template-hash`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 4 phút: trong một namespace mới `drill`, tạo Deployment `web` (`nginx:1.29-alpine`, 3 replica, cổng 80) và Service ClusterIP `web` cổng 80, rồi in số địa chỉ trong EndpointSlice. Xoá namespace khi xong.",
          timeLimitMin: 4,
          solution: "```bash\nk create ns drill\nk -n drill create deploy web --image=nginx:1.29-alpine --replicas=3 --port=80\nk -n drill expose deploy web --port=80\nk -n drill get endpointslices -l kubernetes.io/service-name=web\nk delete ns drill\n```",
        },
        {
          text: "Service `api` trong namespace `drill` có selector `app=api-v2` nhưng Pod mang `app=api`. Trong 2 phút, sửa Service (không sửa Pod) cho tới khi có endpoint.",
          timeLimitMin: 2,
          solution: "```bash\nk -n drill set selector svc api app=api\nk -n drill get endpointslices -l kubernetes.io/service-name=api\n```\nHoặc `k -n drill edit svc api` sửa `spec.selector`.",
        },
      ],
    },
    tips: [
      "`k create deploy … --port=8080 $do` sinh sẵn `containerPort`; thêm `-n <ns>` là có luôn `namespace:` trong tệp.",
      "Service \"không chạy\": luôn nhìn EndpointSlice trước. Rỗng là lỗi selector hoặc Pod chưa Ready; có địa chỉ mà vẫn lỗi thì xem cổng.",
      "Sửa replica bằng `k scale` xong thì sửa cả tệp YAML, nếu không lần `apply` sau sẽ đưa số replica về như cũ.",
      "`:set paste` trước khi dán từ kubernetes.io, `:set nopaste` ngay sau: quên tắt thì phím tắt chế độ chèn (và `autoindent`) không chạy.",
    ],
    outcome: {
      md: `Ba service của shop chạy thành Deployment trong namespace \`shop\`, nối với nhau qua Service: gateway gọi được catalog và order. Trên Mac:

\`\`\`bash
./labs/lab verify cka s11
\`\`\`

Verify đếm địa chỉ sẵn sàng trong EndpointSlice của từng Service, gọi \`/api/products\` của gateway qua proxy của apiserver, và chạy \`apply --dry-run=server\` trên ba tệp trong \`~/shop/\`.`,
      verifyOutput: "lab: kiểm s11\n  (chờ apiserver, ba Deployment và app trả lời; lâu nhất vài phút nếu Pod đang khởi động)\n  ✓ Pod lẻ catalog ở namespace default đã xoá\n  ✓ Deployment gateway: image shop/gateway:1.0, selector app=gateway, 1/1 Available\n  ✓ Deployment catalog: image shop/catalog:1.0, selector app=catalog, 2/2 Available\n  ✓ Deployment order: image shop/order:1.0, selector app=order, 1/1 Available\n  ✓ Service gateway: ClusterIP cổng 8080, 1 địa chỉ sẵn sàng trong EndpointSlice\n  ✓ Service catalog: ClusterIP cổng 8080, 2 địa chỉ sẵn sàng trong EndpointSlice\n  ✓ Service order: ClusterIP cổng 8080, 1 địa chỉ sẵn sàng trong EndpointSlice\n  ✓ gateway /api/products trả 3 sản phẩm (gateway → Service catalog)\n  ✓ answers.env: CATALOG_RS=catalog-cd5c8d544 (ReplicaSet hiện hành của catalog)\n  ✓ answers.env: EMPTY_SELECTOR là selector khoá=giá-trị không khớp Pod nào trong shop\n  ✓ ~/shop/gateway.yaml qua apply --dry-run=server, khai namespace shop, replicas 1 (Deployment/gateway/shop 1)\n  ✓ ~/shop/catalog.yaml qua apply --dry-run=server, khai namespace shop, replicas 2 (Deployment/catalog/shop 2)\n  ✓ ~/shop/order.yaml qua apply --dry-run=server, khai namespace shop, replicas 1 (Deployment/order/shop 1)\n  → 13/13 đạt",
      projectDelta: "Mảnh project **deployments** hoàn thành: gateway, catalog (2 replica), order chạy bằng Deployment, gọi nhau qua Service ClusterIP; manifest nằm ở `~/shop/` để các buổi sau sửa tiếp.",
    },
    review: [
      { q: "Xoá một Pod của Deployment `catalog`: ai tạo lại nó, và làm sao chứng minh?", a: "ReplicaSet hiện hành (`catalog-<pod-template-hash>`) thấy thiếu replica và tạo Pod mới. Chứng minh bằng `ownerReferences` của Pod mới (kind ReplicaSet) và của ReplicaSet (kind Deployment)." },
      { q: "`pod-template-hash` là gì, để làm gì?", a: "Băm của mẫu Pod, nằm trong tên và nhãn của ReplicaSet và Pod. Nó tách Pod của các phiên bản mẫu khác nhau để ReplicaSet cũ và mới không giành Pod của nhau khi rollout." },
      { q: "Service có ClusterIP nhưng không gọi được. Kiểm gì đầu tiên?", a: "EndpointSlice của nó (`k get endpointslices -l kubernetes.io/service-name=<svc>`). Rỗng thì so selector của Service với nhãn Pod, hoặc Pod chưa Ready." },
      { q: "Vì sao Service của catalog phải tên `catalog` và cổng 8080?", a: "gateway (và order) gọi `app.catalog-url=http://catalog:8080`: tên Service là tên DNS trong namespace, cổng là cổng của Service." },
      { q: "`kubectl expose deploy` và `kubectl create service clusterip` khác nhau ở selector thế nào?", a: "`expose` chép selector của Deployment (`app=catalog`). `create service clusterip <tên>` đặt selector `app=<tên>`, dễ lệch nhãn nếu tên Service khác tên app." },
    ],
  },

  // ───────────────────────────── s12 ─────────────────────────────
  {
    id: "s12",
    stage: "st2",
    title: "ConfigMap và Secret",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-config"],
    requires: ["s11"],
    status: "published",
    pieces: ["config"],
    goals: [
      "Tách cấu hình Spring (application.yaml, biến môi trường) khỏi image vào ConfigMap, nạp bằng cả envFrom và volume.",
      "Đặt thông tin đăng nhập database vào Secret db-cred, nạp bằng secretKeyRef và đọc lại giá trị gốc bằng jsonpath + base64 -d.",
      "Giải thích vì sao đổi ConfigMap dạng env cần rollout restart còn dạng volume thì tệp tự cập nhật.",
    ],
    skills: [
      { skill: "k-cm-literal", level: "Gõ được không tra" },
      { skill: "k-cm-file", level: "Gõ được không tra" },
      { skill: "k-secret-generic", level: "Gõ được không tra" },
      { skill: "k-cm-envfrom-volume", level: "Viết được không tra" },
      { skill: "k-secret-env-volume", level: "Viết được không tra" },
      { skill: "lx-base64", level: "Gõ được không tra" },
      { skill: "k-secret-jsonpath", level: "Dưới 1 phút" },
      { skill: "vim-visual-block", level: "Dùng được" },
    ],
    uses: ["k-create-deploy", "k-exec", "k-exam-vars", "vim-visual-indent"],
    foundation: null,
    mindset: `**ConfigMap và Secret là \`application.yaml\` và biến môi trường đặt ngoài jar.** Spring Boot vốn đã đọc cấu hình từ nhiều nguồn, theo thứ tự ưu tiên; Kubernetes chỉ cung cấp nguồn. Ba nguồn của buổi này, từ thấp tới cao:

| Nguồn Spring | Ở shop | Kubernetes đưa vào bằng |
|---|---|---|
| \`classpath:application.yml\` trong jar | \`app.greeting: \${APP_GREETING:Xin chào từ shop}\` | (có sẵn trong image) |
| Tệp ngoài jar \`./config/application.yaml\` (Boot tự tìm, tương đối với thư mục làm việc) | \`management.endpoints.web.exposure.include: health,info\`, khối \`info.shop\` | ConfigMap \`gateway-files\` mount thành volume ở \`/config\` (thư mục làm việc của image là \`/\`) |
| Biến môi trường của OS | \`APP_GREETING\`, \`CATALOG_URL\`, \`ORDER_URL\`; \`DB_USER\`, \`DB_PASSWORD\` | \`envFrom.configMapRef\` (cả ConfigMap), \`env[].valueFrom.secretKeyRef\` (từng khoá) |

Biến môi trường thắng tệp: đo trên lab, một Pod gateway có \`APP_GREETING=từ-env\` và \`/config/application.yaml\` ghi \`app.greeting: từ-tệp\` trả \`"greeting":"từ-env"\` (relaxed binding: \`APP_GREETING\` ứng với khoá \`app.greeting\`). Profile đi cùng đường: \`SPRING_PROFILES_ACTIVE=k8s\` làm Boot đọc thêm \`/config/application-k8s.yaml\` từ cùng volume, đè lên \`application.yaml\`.

**Env đọc một lần, volume thì sống.** Biến môi trường được kubelet dựng lúc tạo container và JVM chỉ đọc lúc khởi động: đổi ConfigMap không đổi gì trong Pod đang chạy cho tới khi \`kubectl rollout restart\`. Volume ConfigMap thì kubelet đồng bộ định kỳ: trên lab, tệp trong Pod đổi khoảng 30 giây sau khi sửa ConfigMap (cơ chế: thư mục \`..data\` là symlink, kubelet ghi bản mới rồi đổi symlink một lần). Nhưng Spring Boot đọc \`application.yaml\` lúc khởi động, nên \`/actuator/info\` vẫn trả giá trị cũ dù tệp đã mới: muốn app thấy, vẫn phải restart (hoặc app tự theo dõi tệp). Volume hợp với thứ được đọc lại lúc chạy (chứng chỉ, tệp mà app tự nạp lại); env hợp với thứ cố định suốt đời Pod.

**Secret không phải mã hoá.** \`data\` của Secret là base64 — mã hoá *ký tự*, không phải *bảo mật*: \`U2hvcC1QYXNzLTIwMjY=\` giải ra \`Shop-Pass-2026\` bằng một lệnh. Thứ bảo vệ Secret là RBAC (ai được \`get secrets\`), mã hoá etcd lúc nghỉ (không bật trên lab) và việc Secret chỉ tới node có Pod dùng nó. Đừng chép giá trị Secret vào ConfigMap, log hay \`-o yaml\` dán lên chat.

**Tham chiếu sai làm Pod không khởi động được, không phải chạy với giá trị rỗng.** \`secretKeyRef\` trỏ tới khoá không tồn tại: kubelet không dựng được môi trường, container không được tạo, Pod đứng ở một trạng thái chờ riêng (bạn sẽ đọc nó ở t7) với một Event nói đúng khoá nào thiếu trong Secret nào. Đó là điều tốt: lỗi cấu hình lộ ra lúc deploy chứ không phải lúc app kết nối database. (Muốn tuỳ chọn thì có \`optional: true\`.)`,
    refs: [
      { label: "Bài lộ trình CKA Study Guide: ConfigMap và Secret — các cách đưa cấu hình vào container", href: "#/roadmap/ckabook/cb-w3-2" },
      { label: "Bài lộ trình CKAD: ConfigMaps — literal/file/env-file; env, envFrom, volume", href: "#/roadmap/ckad/w4-1" },
      { label: "Bài lộ trình CKAD: Secrets — base64; inject qua env & volume", href: "#/roadmap/ckad/w4-2" },
      { label: "Bài lộ trình CKA: Certificates & kubeconfig (base64 trong client-certificate-data)", href: "#/roadmap/cka/cka-w1-5" },
      { label: "CKA Study Guide, chương 10 — ConfigMap và Secret", href: "#/docs/ckabook-10" },
      { label: "CKA Study Guide, chương 15 — Volume", href: "#/docs/ckabook-15" },
      { label: "Thực hành nhanh: create cm, create secret, base64, YAML dùng ConfigMap/Secret", href: "#/commands" },
      { label: "kubernetes.io: ConfigMaps", href: "https://kubernetes.io/docs/concepts/configuration/configmap/" },
      { label: "kubernetes.io: Secrets", href: "https://kubernetes.io/docs/concepts/configuration/secret/" },
      { label: "kubernetes.io: Configure a Pod to Use a ConfigMap", href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/" },
      { label: "Spring Boot: Externalized Configuration (thứ tự nguồn cấu hình, ./config/)", href: "https://docs.spring.io/spring-boot/reference/features/external-config.html" },
    ],
    stateIn: `Đầu ra s11: ba Deployment \`gateway\`, \`catalog\` (2), \`order\` trong \`shop\` chạy với cấu hình mặc định trong image (H2 trong bộ nhớ, chưa có PostgreSQL tới s24), ba Service ClusterIP, manifest ở \`~/shop/\`. \`./labs/lab begin cka s12\` kiểm đầu vào bằng verify của s11.`,
    stateOut: "gateway đọc shop-config qua envFrom và application.yaml từ ConfigMap gateway-files mount ở /config; catalog, order lấy DB_USER/DB_PASSWORD từ Secret db-cred qua secretKeyRef; ~/drills/s12/answers.env.",
    tasks: [
      { id: "t1", text: "ConfigMap từ literal: `shop-config` trong `shop` với `APP_GREETING` (một lời chào **khác** `Xin chào từ shop`, vd. `Xin chào từ ConfigMap`), `CATALOG_URL=http://catalog:8080`, `ORDER_URL=http://order:8080`." },
      { id: "t2", text: "ConfigMap từ tệp: viết `~/shop/config/application.yaml` (thư mục con: `~/shop/` chỉ chứa manifest, để `k apply -f ~/shop/` vẫn chạy) mở thêm endpoint `info` của Actuator (`management.endpoints.web.exposure.include: health,info`, `management.info.env.enabled: true`) và một khối `info.shop` (vd. `team: platform`), rồi `k -n shop create cm gateway-files --from-file=application.yaml=$HOME/shop/config/application.yaml`." },
      { id: "t3", text: "Sửa `~/shop/gateway.yaml`: `envFrom` từ `shop-config`; volume từ ConfigMap `gateway-files` mount ở `/config` (Spring tìm `./config/application.yaml`; đo thư mục làm việc bằng `k exec … -- ls -l /proc/1/cwd`). Apply. Kiểm `/api/info` (lời chào mới) và `/actuator/info` (khối `shop`) qua proxy của apiserver; `k exec deploy/gateway -- ls -la /config`." },
      { id: "t4", text: "Secret: `db-cred` với `DB_USER=shop`, `DB_PASSWORD` tuỳ bạn. Thêm vào `~/shop/catalog.yaml` và `~/shop/order.yaml` hai biến `DB_USER`, `DB_PASSWORD` bằng `valueFrom.secretKeyRef` (dán khối `env:` rồi chỉnh thụt lề cả khối bằng Ctrl-v + `I`). Apply; `k -n shop logs deploy/catalog | grep 'Added connection'` phải thấy `user=SHOP`." },
      { id: "t5", text: "Đọc ngược Secret: `k -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d`. Ghi `DB_PASSWORD_DECODED=<giá trị>` vào `~/drills/s12/answers.env`. Thử chiều ngược lại: `echo -n '<giá trị>' | base64` có bằng chuỗi trong Secret không, và vì sao phải `-n`? Rồi mount `db-cred` thành volume ở `/etc/db` trong một Pod thử `secret-vol` (image `shop/catalog:1.0`, lệnh `sleep 3600`), ghi `SECRET_FILE_DB_USER=<nội dung /etc/db/DB_USER>`, xoá Pod." },
      { id: "t6", text: "Env và volume: đổi `APP_GREETING` trong `shop-config` và `team` trong `gateway-files`. Mỗi 10 giây xem `k exec deploy/gateway -- cat /config/application.yaml`, `printenv APP_GREETING`, `/api/info`, `/actuator/info`: cái nào đổi, sau bao lâu? Ghi `VOLUME_UPDATED_BEFORE_RESTART=` và `ENV_UPDATED_BEFORE_RESTART=` (`yes`/`no`: trước khi restart, tệp volume / biến môi trường đã đổi chưa). Rồi `k -n shop rollout restart deploy/gateway` và xem lại." },
      { id: "t7", text: "Tình huống hỏng: tạo một Pod thử `cfg-bad` (image `shop/catalog:1.0`) có `DB_PASSWORD` từ `secretKeyRef` khoá `DB_PASS` (không có trong `db-cred`). Đọc STATUS và Events; ghi `CONFIG_ERROR_REASON=<STATUS>` vào `answers.env`; xoá Pod. Trên Mac: `./labs/lab verify cka s12` phải đạt 14/14." },
    ],
    hints: [
      "`--from-file=application.yaml=<đường dẫn>`: phần trước dấu `=` là tên khoá, cũng là tên tệp trong volume. Không có phần đó thì khoá là tên tệp gốc.",
      "Volume ConfigMap mount đè cả thư mục đích: mount ở `/config` (thư mục chưa có trong image) chứ đừng mount vào `/` hay `/app`.",
      "`/actuator/info` trả 404: Spring chưa đọc tệp. Kiểm `k exec deploy/gateway -- cat /config/application.yaml`, rồi nhớ Spring chỉ đọc lúc khởi động: tệp vào sau khi Pod đã chạy thì cần restart.",
      "`echo 'x' | base64` mã hoá cả ký tự xuống dòng: dùng `echo -n` hoặc `printf %s`. `kubectl create secret --from-literal` tự mã hoá, đừng mã hoá hai lần.",
      "Pod không lên mà `k logs` trống: Event cuối của `k describe pod` nói đúng khoá nào thiếu ở Secret/ConfigMap nào. So với `k get secret db-cred -o jsonpath='{.data}'`.",
      "Sau `rollout restart`, gọi `/api/info` vài lần cho tới khi `hostname` là Pod mới (Pod cũ dừng trong vòng vài giây).",
    ],
    solution: `Output là của máy soạn bài.

**1. ConfigMap từ literal**

\`\`\`bash
k -n shop create cm shop-config --from-literal=APP_GREETING='Xin chào từ ConfigMap' \\
  --from-literal=CATALOG_URL=http://catalog:8080 --from-literal=ORDER_URL=http://order:8080
k -n shop get cm shop-config -o yaml | sed -n '/^data:/,/^kind:/p'
\`\`\`

**2. ConfigMap từ tệp**

\`\`\`yaml
# ~/shop/config/application.yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  info:
    env:
      enabled: true
info:
  shop:
    team: platform
    config-source: configmap/gateway-files
\`\`\`

\`\`\`bash
mkdir -p ~/shop/config && vim ~/shop/config/application.yaml
k -n shop create cm gateway-files --from-file=application.yaml=$HOME/shop/config/application.yaml
\`\`\`

Tệp nằm trong thư mục con vì \`kubectl apply -f ~/shop/\` không đệ quy: nó chỉ đọc \`gateway.yaml\`, \`catalog.yaml\`, \`order.yaml\`. Đặt \`application.yaml\` ngay trong \`~/shop/\` thì lệnh đó báo \`error validating "…/application.yaml": error validating data: [apiVersion not set, kind not set]\` (đo trên lab).

\`include: health,info\` giữ \`health\` (s13 cần) và mở thêm \`info\`; \`management.info.env.enabled\` cho phép \`/actuator/info\` in các khoá \`info.*\`. Đây là một khoá **chỉ có trong tệp**: không biến môi trường nào đè nó, nên \`/actuator/info\` chứng minh Spring đã đọc \`/config/application.yaml\`.

**3. gateway: envFrom + volume**

\`\`\`bash
k -n shop exec deploy/gateway -- ls -l /proc/1/cwd     # … /proc/1/cwd -> /    → ./config là /config
vim ~/shop/gateway.yaml
\`\`\`

\`\`\`yaml
    spec:
      containers:
      - image: shop/gateway:1.0
        name: gateway
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: shop-config
        volumeMounts:
        - name: app-config
          mountPath: /config
          readOnly: true
      volumes:
      - name: app-config
        configMap:
          name: gateway-files
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway.yaml && k -n shop rollout status deploy/gateway
P=/api/v1/namespaces/shop/services/gateway:8080/proxy
k get --raw $P/api/info
# {"service":"gateway","version":"1.0","hostname":"gateway-85fc9546dc-6lbb2","greeting":"Xin chào từ ConfigMap"}
k get --raw $P/actuator/info
# {"shop":{"team":"platform","config-source":"configmap/gateway-files"}}
k -n shop exec deploy/gateway -- ls -la /config
# drwxr-xr-x 2 root root 4096 … ..2026_11_14_09_51_25.343495978
# lrwxrwxrwx 1 root root   31 … ..data -> ..2026_11_14_09_51_25.343495978
# lrwxrwxrwx 1 root root   23 … application.yaml -> ..data/application.yaml
\`\`\`

**4. Secret và secretKeyRef**

\`\`\`bash
k -n shop create secret generic db-cred --from-literal=DB_USER=shop --from-literal=DB_PASSWORD=Shop-Pass-2026
vim ~/shop/catalog.yaml      # rồi order.yaml
\`\`\`

Dán khối dưới đây ngay sau \`ports:\` của container (dán với \`:set paste\`). Nếu cả khối lệch cột, \`Ctrl-v\` chọn cột đầu của các dòng đó, \`I\`, gõ số dấu cách còn thiếu, \`Esc\`: vim chèn vào mọi dòng đã chọn. (Cùng thao tác với \`I#\` là comment cả khối.)

\`\`\`yaml
        env:
        - name: DB_USER
          valueFrom:
            secretKeyRef:
              name: db-cred
              key: DB_USER
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-cred
              key: DB_PASSWORD
\`\`\`

\`\`\`bash
k apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml
k -n shop rollout status deploy/catalog; k -n shop rollout status deploy/order
k -n shop exec deploy/catalog -- printenv DB_USER                 # shop
k -n shop logs deploy/catalog | grep 'Added connection'
# … HikariPool-1 - Added connection conn0: url=jdbc:h2:mem:shop user=SHOP
\`\`\`

Chưa có \`DB_URL\` nên service vẫn dùng H2 trong bộ nhớ; \`DB_USER\` đã đi tới datasource (s10 là \`user=SA\`, mặc định). H2 tạo database mới với đúng user/mật khẩu đầu tiên nó nhận, nên khởi động bình thường. \`k set env deploy/catalog --from=secret/db-cred\` cũng sinh ra đúng hai mục \`secretKeyRef\` này; nhưng nhớ sửa cả tệp trong \`~/shop/\`.

**5. Đọc ngược Secret**

\`\`\`bash
k -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}'; echo     # U2hvcC1QYXNzLTIwMjY=
k -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d; echo   # Shop-Pass-2026
echo -n Shop-Pass-2026 | base64        # U2hvcC1QYXNzLTIwMjY=
mkdir -p ~/drills/s12
echo "DB_PASSWORD_DECODED=$(k -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d)" > ~/drills/s12/answers.env
\`\`\`

Secret dạng volume: mỗi khoá thành một tệp, nội dung đã giải base64.

\`\`\`bash
k -n shop run secret-vol --image=shop/catalog:1.0 $do --command -- sleep 3600 > ~/drills/s12/secret-vol.yaml
vim ~/drills/s12/secret-vol.yaml
#   spec.volumes:                 - name: db
#                                   secret: {secretName: db-cred}
#   containers[0].volumeMounts:   - {name: db, mountPath: /etc/db, readOnly: true}
k apply -f ~/drills/s12/secret-vol.yaml && k -n shop wait --for=condition=Ready pod/secret-vol
k -n shop exec secret-vol -- ls /etc/db                    # DB_PASSWORD  DB_USER
echo "SECRET_FILE_DB_USER=$(k -n shop exec secret-vol -- cat /etc/db/DB_USER)" >> ~/drills/s12/answers.env
k -n shop delete pod secret-vol
\`\`\`

**6. Env và volume khi ConfigMap đổi**

\`\`\`bash
k -n shop patch cm shop-config --type merge -p '{"data":{"APP_GREETING":"Chào lần hai"}}'
sed 's/team: platform/team: checkout/' ~/shop/config/application.yaml > /tmp/app.yaml
k -n shop create cm gateway-files --from-file=application.yaml=/tmp/app.yaml $do | k apply -f -
\`\`\`

Đo trên lab (sửa lúc 16:52:12):

| Sau | \`/config/application.yaml\` trong Pod | \`printenv APP_GREETING\` | \`/api/info\` greeting | \`/actuator/info\` team |
|---|---|---|---|---|
| ~35 giây (16:52:47) | \`team: checkout\` (mới) | \`Xin chào từ ConfigMap\` (cũ) | cũ | \`platform\` (cũ) |
| sau \`rollout restart\` | mới | mới | \`Chào lần hai\` | \`checkout\` |

\`\`\`bash
k -n shop rollout restart deploy/gateway && k -n shop rollout status deploy/gateway
k get --raw $P/api/info       # … "greeting":"Chào lần hai"
k get --raw $P/actuator/info  # {"shop":{"team":"checkout",…}}
\`\`\`

\`\`\`bash
echo VOLUME_UPDATED_BEFORE_RESTART=yes >> ~/drills/s12/answers.env
echo ENV_UPDATED_BEFORE_RESTART=no >> ~/drills/s12/answers.env
\`\`\`

Verify so lời chào của gateway với ConfigMap **hiện tại**, nên đổi ConfigMap mà quên restart là đỏ. Sửa \`kubectl create … $do | kubectl apply -f -\` là cách "cập nhật bằng lệnh tạo" hay dùng trong phòng thi.

**7. Tình huống hỏng: khoá không tồn tại**

\`\`\`bash
k -n shop run cfg-bad --image=shop/catalog:1.0 $do > ~/drills/s12/cfg-bad.yaml
# thêm env DB_PASSWORD với secretKeyRef name: db-cred, key: DB_PASS
k apply -f ~/drills/s12/cfg-bad.yaml
k -n shop get pod cfg-bad
# cfg-bad   0/1   CreateContainerConfigError   0   12s
k -n shop get events --field-selector involvedObject.name=cfg-bad --sort-by=.lastTimestamp
#   Normal    Scheduled   pod/cfg-bad   Successfully assigned shop/cfg-bad to cka-w1
#   Normal    Pulled      pod/cfg-bad   Container image "shop/catalog:1.0" already present on machine …
#   Warning   Failed      pod/cfg-bad   Error: couldn't find key DB_PASS in Secret shop/db-cred
echo "CONFIG_ERROR_REASON=CreateContainerConfigError" >> ~/drills/s12/answers.env
k -n shop delete pod cfg-bad $now
\`\`\`

Image đã kéo xong (\`Pulled\`), lỗi nằm ở bước dựng cấu hình container, trước khi có tiến trình nào chạy: \`k logs\` không có gì để đọc.

Lời giải tự động: \`labs/cka/sessions/s12/apply.sh\` (manifest đầy đủ trong \`labs/cka/sessions/s12/files/\`).`,
    exam: {
      patterns: [
        "\"Tạo ConfigMap từ literal/tệp và cho Pod dùng dưới dạng biến môi trường / tệp ở đường dẫn X\" — `create cm`, `envFrom`/`env.valueFrom` hoặc `volumes.configMap` + `volumeMounts`.",
        "\"Tạo Secret và đưa vào Pod\" — `create secret generic`, `secretKeyRef` hoặc volume `secret`.",
        "\"Lấy giá trị của Secret X ghi vào tệp /opt/…\" — `-o jsonpath='{.data.k}' | base64 -d > /opt/…`.",
        "\"Pod CreateContainerConfigError, sửa\" — Events chỉ ra ConfigMap/Secret hay khoá nào thiếu.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 4 phút: Pod `pw-only` (namespace `shop`, image `busybox:1.37`, lệnh `sleep 3600`) chỉ mount **một** khoá `DB_PASSWORD` của `db-cred`, thành tệp `/etc/db/password`; chứng minh `ls /etc/db` chỉ có `password`. Xoá Pod khi xong.",
          timeLimitMin: 4,
          solution: "```bash\nk -n shop run pw-only --image=busybox:1.37 $do --command -- sleep 3600 > pw.yaml\n# thêm vào spec:\n#   volumes:\n#   - name: db\n#     secret:\n#       secretName: db-cred\n#       items: [{key: DB_PASSWORD, path: password}]\n# và vào container:\n#   volumeMounts: [{name: db, mountPath: /etc/db, readOnly: true}]\nk apply -f pw.yaml\nk -n shop exec pw-only -- ls /etc/db          # password\nk -n shop delete pod pw-only $now\n```\n`items` chọn khoá nào thành tệp và đặt tên tệp; khoá không liệt kê thì không có mặt.",
        },
        {
          text: "Trong 1 phút: in mật khẩu trong Secret `db-cred` (khoá `DB_PASSWORD`, namespace `shop`) ra tệp `/tmp/pw.txt`, không xuống dòng thừa.",
          timeLimitMin: 1,
          solution: "```bash\nk -n shop get secret db-cred -o jsonpath='{.data.DB_PASSWORD}' | base64 -d > /tmp/pw.txt\n```",
        },
      ],
    },
    tips: [
      "Cập nhật ConfigMap/Secret bằng lệnh tạo: `k create cm … $do | k apply -f -`. Nhanh hơn `edit` khi nguồn là tệp.",
      "Đổi ConfigMap dạng env xong thì `k rollout restart deploy/<tên>`; dạng volume thì tệp tự đổi sau chừng một phút, nhưng app có đọc lại hay không là chuyện của app.",
      "Theo tài liệu ConfigMap trên kubernetes.io, mount bằng `subPath` thì tệp **không** được cập nhật khi ConfigMap đổi: mount cả thư mục nếu cần tệp mới.",
      "`echo -n` khi tự mã hoá base64; `--from-literal` thì đừng mã hoá trước.",
      "Đề hỏi \"đọc Secret\": `-o jsonpath='{.data.<khoá>}' | base64 -d`. Khoá có dấu chấm thì thoát: `'{.data.tls\\.crt}'`.",
    ],
    outcome: {
      md: `Cấu hình của shop đã ra khỏi image: gateway đọc lời chào và URL từ \`shop-config\`, đọc \`application.yaml\` từ volume \`/config\`; catalog và order nhận thông tin đăng nhập database từ Secret \`db-cred\`. Trên Mac:

\`\`\`bash
./labs/lab verify cka s12
\`\`\`

Verify so lời chào gateway trả về với ConfigMap hiện tại, so tệp trong Pod với khoá của ConfigMap (chờ tới khoảng 90 giây nếu bạn vừa sửa ConfigMap), và giải mã Secret để so với đáp án của bạn.`,
      verifyOutput: "lab: kiểm s12\n  (chờ apiserver, ba Deployment và app trả lời; lâu nhất vài phút nếu Pod đang khởi động)\n  ✓ ConfigMap shop-config: khoá APP_GREETING CATALOG_URL ORDER_URL, URL trỏ tới Service, lời chào khác mặc định\n  ✓ ConfigMap gateway-files: khoá application.yaml\n  ✓ Secret db-cred: Opaque, khoá DB_PASSWORD DB_USER\n  ✓ gateway: envFrom configMapRef shop-config, 1/1 cập nhật và Available\n  ✓ gateway /api/info: greeting = APP_GREETING của shop-config (Xin chào từ ConfigMap)\n  ✓ gateway: volume từ ConfigMap gateway-files mount ở /config\n  ✓ Pod gateway: /config/application.yaml bằng nội dung khoá application.yaml\n  ✓ gateway /actuator/info có khối shop (Spring đã nạp /config/application.yaml)\n  ✓ catalog: DB_USER, DB_PASSWORD từ secretKeyRef db-cred, 2/2/2 cập nhật và Available\n  ✓ order: DB_USER, DB_PASSWORD từ secretKeyRef db-cred, 1/1/1 cập nhật và Available\n  ✓ answers.env: DB_PASSWORD_DECODED khớp Secret db-cred\n  ✓ answers.env: SECRET_FILE_DB_USER=shop (tệp DB_USER khi mount db-cred thành volume)\n  ✓ answers.env: trước rollout restart volume đã đổi, env chưa (VOLUME_/ENV_UPDATED_BEFORE_RESTART)\n  ✓ answers.env: CONFIG_ERROR_REASON=CreateContainerConfigError (tham chiếu khoá không có)\n  → 14/14 đạt",
      projectDelta: "Mảnh project **config** hoàn thành: shop có ConfigMap `shop-config`, `gateway-files` và Secret `db-cred`; ba manifest trong `~/shop/` đọc cấu hình từ đó. Buổi sau gắn probe vào Actuator và cho Pod dừng tử tế.",
    },
    review: [
      { q: "Đổi `APP_GREETING` trong ConfigMap `shop-config` mà gateway vẫn trả lời chào cũ. Vì sao, sửa thế nào?", a: "Biến môi trường (envFrom) chỉ được dựng khi tạo container; Pod đang chạy giữ giá trị cũ. `k -n shop rollout restart deploy/gateway` để Pod mới đọc lại." },
      { q: "Tệp `/config/application.yaml` trong Pod đã đổi theo ConfigMap nhưng `/actuator/info` vẫn cũ. Vì sao?", a: "kubelet đồng bộ volume ConfigMap định kỳ (trên lab khoảng 30 giây), nhưng Spring Boot chỉ đọc tệp cấu hình lúc khởi động. Cần restart, hoặc app tự nạp lại tệp." },
      { q: "Vì sao mount ConfigMap ở `/config` thì Spring Boot đọc được mà không cần cấu hình gì thêm?", a: "Boot mặc định tìm `./config/application.yaml` (tương đối với thư mục làm việc); image shop chạy với thư mục làm việc `/`. Biến môi trường vẫn đè khoá trùng trong tệp." },
      { q: "Secret có an toàn hơn ConfigMap vì được mã hoá base64 không?", a: "Không. base64 chỉ là cách mã hoá ký tự, ai `get` được Secret là đọc được. An toàn đến từ RBAC, mã hoá etcd lúc nghỉ và việc Secret chỉ tới node có Pod dùng nó." },
      { q: "Pod đứng ở `CreateContainerConfigError`. Tìm nguyên nhân ở đâu?", a: "Events của Pod (`describe`/`get events`): ví dụ `couldn't find key DB_PASS in Secret shop/db-cred`. Container chưa từng chạy nên `logs` trống." },
    ],
  },

  // ───────────────────────────── s13 ─────────────────────────────
  {
    id: "s13",
    stage: "st2",
    title: "Probe, vòng đời Pod và graceful shutdown",
    durationMin: 80,
    domain: "workloads",
    competencies: ["wl-selfheal"],
    requires: ["s12"],
    status: "published",
    pieces: ["probes"],
    goals: [
      "Gắn startupProbe, livenessProbe, readinessProbe vào ba service theo endpoint Actuator tương ứng, và cho gateway chờ catalog bằng init container.",
      "Chứng minh trên một Deployment nháp: readiness hỏng thì Pod bị rút khỏi Service mà không bị restart, liveness hỏng thì bị restart.",
      "Cấu hình preStop và terminationGracePeriodSeconds khớp với graceful shutdown của Spring Boot để Pod dừng không rớt request.",
    ],
    skills: [
      { skill: "k-probes-yaml", level: "Viết được không tra" },
      { skill: "k-actuator-probes", level: "Giải thích được" },
      { skill: "k-pod-lifecycle", level: "Giải thích được" },
      { skill: "k-graceful-shutdown", level: "Giải thích được" },
      { skill: "k-explain", level: "Thành phản xạ" },
      { skill: "k-init-container", level: "Viết được có tra" },
    ],
    uses: ["k-describe-pod", "k-labels-selectors", "vim-paste-mode", "lx-ps-proc"],
    foundation: null,
    mindset: `**Ba probe, ba câu hỏi khác nhau.** kubelet hỏi container ba câu, mỗi câu một hậu quả:

| Probe | Câu hỏi | Trả lời "không" thì | Ở shop trỏ vào |
|---|---|---|---|
| \`startupProbe\` | Đã khởi động xong chưa? | Chờ tiếp; hết \`failureThreshold × periodSeconds\` thì giết container. Trong lúc nó chưa đạt, hai probe kia **chưa chạy** | \`/actuator/health/liveness\` |
| \`livenessProbe\` | Còn sống không, hay kẹt tới mức phải khởi động lại? | kubelet giết container (SIGTERM, rồi SIGKILL khi hết grace), tạo lại theo \`restartPolicy\` | \`/actuator/health/liveness\` |
| \`readinessProbe\` | Có nhận request được không? | Pod bị đánh dấu không Ready, địa chỉ của nó trong EndpointSlice thành \`ready: false\`, Service ngừng gửi request tới. **Không** restart | \`/actuator/health/readiness\` |

Spring Boot đã chia sẵn đúng hai nhóm đó. Image shop bật \`management.endpoint.health.probes.enabled: true\` nên \`/actuator/health\` trả \`{"groups":["liveness","readiness"],"status":"UP"}\` (bạn đã thấy ở s10). \`liveness\` phản ánh \`LivenessState\` của ứng dụng (\`CORRECT\`/\`BROKEN\`), \`readiness\` phản ánh \`ReadinessState\` (\`ACCEPTING_TRAFFIC\`/\`REFUSING_TRAFFIC\`). Điều quan trọng: theo mặc định Spring **không** đưa kiểm tra database vào nhóm liveness. Đó là chủ ý: database chết mà liveness đỏ thì kubelet sẽ restart mọi Pod cùng lúc, chẳng sửa được gì mà còn thêm tải lúc database hồi lại. Phụ thuộc bên ngoài, nếu có, thuộc về readiness.

**Vì sao cần startupProbe: đo trên lab.** Lúc cluster bận (ba JVM khởi động cùng lúc trên worker 2 vCPU, load của cka-cp lên 13), log của catalog ghi \`Started CatalogApplication in 59.984 seconds (process running for 93.439)\`, trong khi lúc rảnh chỉ khoảng 5 giây. Một livenessProbe thuần với \`initialDelaySeconds\` vài chục giây sẽ giết JVM trước khi nó kịp lên, Pod rơi vào vòng restart không bao giờ xong. startupProbe cho thời gian khởi động một ngân sách riêng (ở đây \`periodSeconds: 5\`, \`failureThreshold: 30\` = 150 giây) mà không làm liveness chậm phát hiện sự cố về sau. Cũng vì máy lab nhỏ mà liveness/readiness của buổi này đặt \`timeoutSeconds: 3\` thay vì 1 giây mặc định: một JVM đang GC hay đang tranh CPU trả lời chậm hơn 1 giây không có nghĩa là nó chết.

**Dừng tử tế: ba đồng hồ phải khớp nhau.** Khi Pod bị xoá (rollout, scale xuống, drain node), hai việc xảy ra **song song**: kubelet bắt đầu dừng container, còn EndpointSlice controller rút địa chỉ Pod khỏi Service và kube-proxy trên từng node cập nhật iptables. Việc thứ hai mất một lúc; nếu JVM đóng cổng ngay, những request đến trong khoảng đó gặp \`connection refused\`.

\`\`\`text
t=0      Pod bị xoá ─┬─ địa chỉ trong EndpointSlice thành ready: false, serving: true, terminating: true → kube-proxy bỏ nó khỏi đích của Service trên mọi node (vài giây)
                     └─ kubelet chạy preStop: sleep 10
t=10s    preStop xong → SIGTERM tới PID 1 (java) → Spring: "Commencing graceful shutdown", chờ request đang chạy
t≤30s    spring.lifecycle.timeout-per-shutdown-phase: 20s hết → Spring đóng hẳn
t=45s    terminationGracePeriodSeconds hết → SIGKILL nếu còn sống
\`\`\`

Image shop đã có \`server.shutdown=graceful\` và \`timeout-per-shutdown-phase: 20s\`; phần của Kubernetes là \`preStop\` (cho iptables kịp cập nhật trước khi app ngừng nhận kết nối) và \`terminationGracePeriodSeconds\` ≥ preStop + 20 giây (mặc định 30 giây là **không đủ** cho 10 + 20 và một chút dư). Grace period được tính từ lúc xoá, **bao gồm** thời gian preStop. Đo trên lab: xoá một Pod catalog lúc 19:49:25.45, log ghi \`Commencing graceful shutdown. Waiting for active requests to complete\` lúc 19:49:35.89 (đúng sau preStop 10 giây), \`Graceful shutdown complete\` 40 ms sau đó, \`kubectl delete\` trả về lúc 19:49:37.79. Không có preStop, một vòng curl 5 lần/giây trong lúc \`rollout restart\` gateway mất 1 request trên 182 (mã \`000\`: không có phản hồi); có preStop thì 200/200 (buổi sau bạn tự đo).

**Init container: chờ phụ thuộc trước khi chạy.** \`initContainers\` chạy tuần tự, mỗi cái phải thoát 0 thì cái sau (và cuối cùng là container chính) mới chạy; trong lúc đó \`kubectl get pod\` hiện \`Init:0/1\`. Gateway không làm gì được nếu catalog chưa sẵn sàng, nên một init container \`wait-catalog\` gọi readiness của catalog qua Service cho tới khi được. Đây không thay thế được readiness của chính gateway: catalog có thể chết *sau* khi gateway đã chạy.`,
    refs: [
      { label: "Bài lộ trình CKAD: Liveness probe — httpGet, exec, tcpSocket", href: "#/roadmap/ckad/w5-1" },
      { label: "Bài lộ trình CKAD: Readiness & Startup probe — hiểu rõ sự khác biệt", href: "#/roadmap/ckad/w5-2" },
      { label: "Bài lộ trình CKAD: Probe parameters — initialDelaySeconds, periodSeconds, failureThreshold", href: "#/roadmap/ckad/w5-3" },
      { label: "Bài lộ trình CKAD: Pod lifecycle & phases", href: "#/roadmap/ckad/w2-1" },
      { label: "Bài lộ trình CKAD: Multi-container Pods — init containers", href: "#/roadmap/ckad/w2-2" },
      { label: "CKA Study Guide, chương 11 — Deployment và ReplicaSet", href: "#/docs/ckabook-11" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "Thực hành nhanh: YAML probe, init container; k explain", href: "#/commands" },
      { label: "kubernetes.io: Configure Liveness, Readiness and Startup Probes", href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/" },
      { label: "kubernetes.io: Pod Lifecycle — container states, termination of Pods", href: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/" },
      { label: "kubernetes.io: Container Lifecycle Hooks (preStop)", href: "https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/" },
      { label: "kubernetes.io: Init Containers", href: "https://kubernetes.io/docs/concepts/workloads/pods/init-containers/" },
      { label: "Spring Boot: Kubernetes Probes (Actuator)", href: "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.kubernetes-probes" },
      { label: "Spring Boot: Graceful Shutdown", href: "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html" },
    ],
    stateIn: `Đầu ra s12: ba Deployment \`gateway\` (1), \`catalog\` (2), \`order\` (1) trong \`shop\`, cấu hình từ \`shop-config\`, \`gateway-files\` và \`db-cred\`, chưa có probe; manifest ở \`~/shop/\`. \`./labs/lab begin cka s13\` kiểm đầu vào bằng verify của s12. Init container dùng \`busybox:1.37\`, kéo từ Docker Hub: node cần Internet.`,
    stateOut: "Ba Deployment có startupProbe/livenessProbe (/actuator/health/liveness), readinessProbe (/actuator/health/readiness), preStop sleep 10 và terminationGracePeriodSeconds 45; gateway có init container wait-catalog; EndpointSlice chỉ chứa địa chỉ Pod Ready; ~/drills/s13/answers.env.",
    tasks: [
      { id: "t1", text: "Tra trường trước khi viết: `k explain pod.spec.containers.livenessProbe`, rồi `k explain pod.spec.containers.livenessProbe.periodSeconds` và `k explain pod.spec.terminationGracePeriodSeconds`. Ghi `PROBE_PERIOD_DEFAULT=<số giây>` (periodSeconds mặc định) vào `~/drills/s13/answers.env`. `k explain deploy.spec.template.spec.containers.lifecycle --recursive | less` để thấy preStop có những dạng nào." },
      { id: "t2", text: "Thí nghiệm readiness trên Deployment nháp: `k -n shop create deploy probe-lab --image=shop/catalog:1.0 --port=8080 $do > ~/drills/s13/probe-lab.yaml`, thêm **chỉ** `readinessProbe` httpGet path `/actuator/health/khong-co` cổng 8080; apply, `k -n shop expose deploy probe-lab --port=8080`. Sau một phút: READY, RESTARTS, `k -n shop get endpointslices -l kubernetes.io/service-name=probe-lab -o yaml` (xem `conditions.ready`), Events của Pod. Ghi `READINESS_RESTARTS=<số lần restart>`." },
      { id: "t3", text: "Thí nghiệm liveness: sửa `probe-lab.yaml` cho readiness về `/actuator/health/readiness`, thêm `livenessProbe` path `/actuator/health/khong-co` (`initialDelaySeconds: 60`); apply và theo dõi `k -n shop get pod -l app=probe-lab -w`. Khi RESTARTS ≥ 1: ghi `LIVENESS_RESTARTS_GE1=yes` và `LIVENESS_EXIT_CODE=<exitCode trong lastState.terminated>` (`k get pod … -o jsonpath` hoặc `describe`). Xoá Deployment và Service `probe-lab`." },
      { id: "t4", text: "Gắn probe cho ba service: trong `~/shop/catalog.yaml`, `order.yaml`, `gateway.yaml` thêm `startupProbe` và `livenessProbe` → `/actuator/health/liveness`, `readinessProbe` → `/actuator/health/readiness`, cổng 8080. Chọn số sao cho JVM có tới 150 giây để khởi động (startupProbe) và liveness không giết một JVM chỉ đang chậm (dán khối YAML với `:set paste`). Apply catalog, order trước." },
      { id: "t5", text: "Dừng tử tế: cũng trong ba tệp, thêm `lifecycle.preStop` ngủ 10 giây và `terminationGracePeriodSeconds` đủ cho preStop + 20 giây shutdown của Spring (đọc `timeout-per-shutdown-phase` trong `labs/cka/app/*/src/main/resources/application.yml` hoặc trong README của app). Xoá một Pod catalog trong khi `k -n shop logs -f` nó ở cửa sổ khác: ghi lại thời điểm `Commencing graceful shutdown` so với lúc bạn gõ `delete`." },
      { id: "t6", text: "Init container: thêm vào `~/shop/gateway.yaml` một init container tên `wait-catalog` (image `busybox:1.37`) lặp `wget` tới `http://catalog:8080/actuator/health/readiness` cho tới khi được. Apply, xem `k -n shop get pod -l app=gateway -w` (cột STATUS `Init:0/1` → `PodInitializing` → `Running`) và `k -n shop logs <pod> -c wait-catalog`." },
      { id: "t7", text: "Kiểm: `k -n shop get pod` — ba Deployment đủ replica Ready, `k -n shop get endpointslices` mọi địa chỉ `ready`. Trên Mac: `./labs/lab verify cka s13` phải đạt 14/14 (verify so cả ba tệp trong `~/shop/` với Deployment đang chạy)." },
    ],
    hints: [
      "`k explain` nhận đường dẫn của resource đã có: `pod.spec.containers.readinessProbe.httpGet`. Với Deployment thì đi qua `deploy.spec.template.spec.…`. `--recursive` in cả cây trường mà không có mô tả.",
      "Readiness sai: Pod `Running` nhưng `0/1`, RESTARTS đứng yên, Event `Readiness probe failed: …`. Liveness sai: Event `Liveness probe failed: HTTP probe failed with statuscode: 404` rồi `Container catalog failed liveness probe, will be restarted`.",
      "Bước thí nghiệm readiness đừng thêm liveness: nếu cluster đang bận, Spring có thể khởi động lâu hơn `initialDelaySeconds` của liveness và bạn sẽ thấy restart vì lý do khác.",
      "`exitCode: 143` = 128 + 15: tiến trình thoát vì SIGTERM. Liveness hỏng không phải SIGKILL ngay: kubelet dừng container như khi xoá Pod (có preStop và grace period).",
      "preStop chạy **trong** grace period: preStop 10 giây + Spring 20 giây đã là 30, bằng đúng mặc định — chọn lớn hơn, ví dụ 45.",
      "Gateway kẹt `Init:0/1`: `k -n shop logs <pod> -c wait-catalog` cho thấy vòng chờ; kiểm `k -n shop get endpointslices -l kubernetes.io/service-name=catalog`.",
      "Gỡ trường bằng `kubectl patch --type json -p '[{\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/lifecycle\"}]'` khi muốn thử lại mà không sửa tệp; nhớ apply lại tệp sau đó.",
    ],
    solution: `Output là của máy soạn bài; tên Pod, IP và thời điểm trên máy bạn sẽ khác.

**1. k explain**

\`\`\`bash
k explain pod.spec.containers.livenessProbe.periodSeconds
#     How often (in seconds) to perform the probe. Default to 10 seconds. Minimum
#     value is 1.
k explain pod.spec.terminationGracePeriodSeconds | tail -3
#     … Set this value longer than the expected
#     cleanup time for your process. Defaults to 30 seconds.
mkdir -p ~/drills/s13 && echo PROBE_PERIOD_DEFAULT=10 > ~/drills/s13/answers.env
\`\`\`

**2. Readiness sai: rút khỏi Service, không restart**

\`\`\`bash
k -n shop create deploy probe-lab --image=shop/catalog:1.0 --port=8080 $do > ~/drills/s13/probe-lab.yaml
vim ~/drills/s13/probe-lab.yaml      # thêm dưới ports: của container
\`\`\`

\`\`\`yaml
        readinessProbe:
          httpGet:
            path: /actuator/health/khong-co
            port: 8080
          periodSeconds: 5
\`\`\`

\`\`\`bash
k apply -f ~/drills/s13/probe-lab.yaml && k -n shop expose deploy probe-lab --port=8080
k -n shop get pod -l app=probe-lab
# probe-lab-…   0/1   Running   0   …
k -n shop get endpointslices -l kubernetes.io/service-name=probe-lab -o jsonpath='{.items[0].endpoints[*].conditions.ready}'; echo
# false
echo READINESS_RESTARTS=0 >> ~/drills/s13/answers.env
\`\`\`

Địa chỉ Pod **vẫn có** trong EndpointSlice nhưng \`ready: false\`; kube-proxy chỉ đưa địa chỉ ready vào iptables, nên Service \`probe-lab\` không có đích nào. Container không bị đụng tới.

**3. Liveness sai: restart**

\`\`\`bash
vim ~/drills/s13/probe-lab.yaml      # readiness về /actuator/health/readiness, thêm:
#        livenessProbe:
#          httpGet: {path: /actuator/health/khong-co, port: 8080}
#          initialDelaySeconds: 60
#          periodSeconds: 5
#          failureThreshold: 2
k apply -f ~/drills/s13/probe-lab.yaml
k -n shop get pod -l app=probe-lab -w
k -n shop get events --sort-by=.lastTimestamp | grep probe-lab | tail -3
#   Warning   Unhealthy   pod/probe-lab-…   Liveness probe failed: HTTP probe failed with statuscode: 404
#   Normal    Killing     pod/probe-lab-…   Container catalog failed liveness probe, will be restarted
k -n shop get pod -l app=probe-lab -o jsonpath='{.items[0].status.containerStatuses[0].lastState.terminated.exitCode}'; echo   # 143
printf 'LIVENESS_RESTARTS_GE1=yes\\nLIVENESS_EXIT_CODE=143\\n' >> ~/drills/s13/answers.env
k -n shop delete deploy,svc probe-lab
\`\`\`

Ba trạng thái container trong \`status.containerStatuses\`: \`waiting\` (chưa chạy: kéo image, CrashLoopBackOff…), \`running\`, \`terminated\` (có \`exitCode\`, \`reason\`). Sau restart, lần chạy trước nằm ở \`lastState.terminated\`.

**4 và 5. Probe và dừng tử tế cho ba service**

Khối dưới đây thêm vào container của mỗi tệp trong \`~/shop/\` (\`:set paste\` trước khi dán); \`terminationGracePeriodSeconds\` thuộc \`spec.template.spec\`, ngang hàng \`containers:\`.

\`\`\`yaml
    spec:
      terminationGracePeriodSeconds: 45
      containers:
      - …
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 5
          failureThreshold: 30          # tới 150 giây để JVM lên
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command: ["sleep", "10"]
\`\`\`

\`\`\`bash
k apply -f ~/shop/catalog.yaml -f ~/shop/order.yaml
k -n shop rollout status deploy/catalog; k -n shop rollout status deploy/order
\`\`\`

Image shop có \`sleep\` (Ubuntu), nên \`exec\` dùng được. Kubernetes 1.36 nhận cả dạng \`preStop: {sleep: {seconds: 10}}\` (đã thử bằng \`--dry-run=server\` trên lab), không cần binary nào trong image; verify chấp nhận cả hai. Grace 45 = preStop 10 + Spring 20 + dư 15.

Xoá một Pod catalog và xem log (dòng thật trên lab):

\`\`\`bash
k -n shop logs -f catalog-544847b966-p6788 --timestamps    # cửa sổ 1
date +%T; k -n shop delete pod catalog-544847b966-p6788; date +%T   # cửa sổ 2
# 19:49:25 … pod "catalog-544847b966-p6788" deleted … 19:49:37
# 19:49:35.893 … GracefulShutdown : Commencing graceful shutdown. Waiting for active requests to complete
# 19:49:35.931 … GracefulShutdown : Graceful shutdown complete
# 19:49:35.953 … HikariPool-1 - Shutdown initiated...
\`\`\`

Mười giây giữa \`delete\` và \`Commencing graceful shutdown\` là preStop: trong lúc đó Pod đã \`Terminating\`, địa chỉ của nó trong EndpointSlice đã thành \`ready: false\`, \`terminating: true\` (kube-proxy không gửi request mới tới nữa), nhưng JVM vẫn nhận kết nối. Đo trên lab: địa chỉ Pod catalog vừa xoá hiện \`{"ready":false,"serving":true,"terminating":true}\` từ t+0 tới t+10 giây, rồi biến khỏi EndpointSlice khi object Pod bị xoá hẳn (t+17 giây). \`serving: true\` nghĩa là readiness của chính Pod vẫn đạt: nó chỉ đang dừng. SIGTERM tới PID 1 của container, chính là \`java\` (ENTRYPOINT của image là \`sh -c "exec java …"\`: \`exec\` thay shell bằng JVM, nên tín hiệu không bị shell nuốt): \`k -n shop exec deploy/catalog -- cat /proc/1/cmdline | tr '\\0' ' '\` in \`java -XX:MaxRAMPercentage=75 -jar /app/app.jar\`: PID 1 là \`java\`, không phải \`sh\`.

**6. Init container cho gateway**

\`\`\`yaml
    spec:
      terminationGracePeriodSeconds: 45
      initContainers:
      - name: wait-catalog
        image: busybox:1.37
        command: ["sh", "-c", "until wget -q -T 2 -O /dev/null http://catalog:8080/actuator/health/readiness; do echo chờ catalog; sleep 2; done"]
      containers:
      - image: shop/gateway:1.0
        …   # cùng khối probe + lifecycle như trên
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway.yaml
k -n shop get pod -l app=gateway -w      # STATUS đi qua Init:0/1 → PodInitializing → Running; READY 0/1 rồi 1/1
k -n shop logs -l app=gateway -c wait-catalog
\`\`\`

READY \`0/1\` sau \`Running\` là lúc startupProbe/readinessProbe chưa đạt: Spring còn đang khởi động. Từ buổi này, \`Ready\` mới thật sự có nghĩa là app đã nghe cổng.

**7. Kiểm**

\`\`\`bash
k -n shop get endpointslices -o jsonpath='{range .items[*].endpoints[*]}{.addresses[0]} {.conditions.ready}{"\\n"}{end}'
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s13/apply.sh\` (manifest đầy đủ trong \`labs/cka/sessions/s13/files/\`).`,
    exam: {
      patterns: [
        "\"Thêm liveness probe kiểu httpGet/exec/tcpSocket vào Pod/Deployment X, kiểm mỗi N giây\" — viết trong YAML rồi `apply`; Pod không sửa probe tại chỗ được: `replace --force`.",
        "\"Pod không bao giờ Ready\" — `describe pod`: Event `Readiness probe failed`, so path/cổng probe với cổng app thật nghe.",
        "\"Pod restart liên tục dù app chạy được\" — liveness quá gắt (`initialDelaySeconds`/`timeoutSeconds` nhỏ) hoặc trỏ sai; thêm startupProbe.",
        "\"Thêm init container chờ Service X\" — `initContainers` với `until nslookup/wget …; do sleep 2; done`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 4 phút: Pod `tcp-check` (namespace `shop`, image `shop/order:1.0`) có `readinessProbe` kiểu `tcpSocket` cổng 8080 và `livenessProbe` kiểu `exec` chạy `cat /app/app.jar` mỗi 15 giây. Chứng minh Pod Ready, rồi xoá.",
          timeLimitMin: 4,
          solution: "```bash\nk -n shop run tcp-check --image=shop/order:1.0 --port=8080 $do > tcp.yaml\n# thêm vào container:\n#   readinessProbe: {tcpSocket: {port: 8080}, periodSeconds: 5}\n#   livenessProbe: {exec: {command: [cat, /app/app.jar]}, periodSeconds: 15}\nk apply -f tcp.yaml\nk -n shop wait --for=condition=Ready pod/tcp-check --timeout=120s\nk -n shop delete pod tcp-check $now\n```\n`tcpSocket` chỉ kiểm cổng mở; Tomcat mở cổng trước khi Spring báo `ACCEPTING_TRAFFIC`, nên với app Spring, httpGet tới readiness chính xác hơn.",
        },
        {
          text: "Trong 2 phút, không mở tài liệu: in mặc định của `failureThreshold` và `timeoutSeconds` của một probe.",
          timeLimitMin: 2,
          solution: "```bash\nk explain pod.spec.containers.readinessProbe.failureThreshold   # Defaults to 3\nk explain pod.spec.containers.readinessProbe.timeoutSeconds     # Defaults to 1 second\n```",
        },
      ],
    },
    tips: [
      "Chỉ cần nhớ đường dẫn bắt đầu: `k explain pod.spec.containers.livenessProbe` rồi đi tiếp bằng dấu chấm — nhanh hơn tìm trên kubernetes.io.",
      "Đề cho sẵn một liveness \"đúng\" mà Pod vẫn restart: xem `timeoutSeconds` (mặc định 1 giây) và có startupProbe chưa.",
      "Readiness sai không bao giờ làm tăng RESTARTS; RESTARTS tăng là liveness, startupProbe, hay chính app tự thoát (`k logs --previous`).",
      "preStop + shutdown của app phải nhỏ hơn `terminationGracePeriodSeconds`, nếu không kubelet gửi SIGKILL giữa chừng (exit code 137).",
      "Ngại sửa nhiều Deployment một lúc: sửa tệp rồi `k apply -f ~/shop/` một lần; đừng `kubectl edit` mà quên tệp.",
    ],
    outcome: {
      md: `Ba service của shop có probe trỏ vào Actuator, dừng tử tế khi bị xoá, và gateway chỉ khởi động khi catalog đã sẵn sàng. Từ buổi này \`Ready\` mới là "app đã nhận request". Trên Mac:

\`\`\`bash
./labs/lab verify cka s13
\`\`\`

Verify đọc probe, preStop và grace period của ba Deployment (cổng có tên cũng được), so với \`~/shop/*.yaml\` qua \`apply --dry-run=server\`, đếm địa chỉ ready trong EndpointSlice, và kiểm \`probe-lab\` đã xoá.`,
      verifyOutput: "lab: kiểm s13\n  (chờ apiserver và ba Deployment; lâu nhất vài phút nếu Pod đang khởi động)\n  ✓ gateway: startup/liveness → /actuator/health/liveness:8080, readiness → /actuator/health/readiness:8080; 1/1/1 Available, EndpointSlice 1/1 địa chỉ ready\n  ✓ catalog: startup/liveness → /actuator/health/liveness:8080, readiness → /actuator/health/readiness:8080; 2/2/2 Available, EndpointSlice 2/2 địa chỉ ready\n  ✓ order: startup/liveness → /actuator/health/liveness:8080, readiness → /actuator/health/readiness:8080; 1/1/1 Available, EndpointSlice 1/1 địa chỉ ready\n  ✓ gateway: preStop có, terminationGracePeriodSeconds khai rõ và ≥ preStop + 20 giây\n  ✓ catalog: preStop có, terminationGracePeriodSeconds khai rõ và ≥ preStop + 20 giây\n  ✓ order: preStop có, terminationGracePeriodSeconds khai rõ và ≥ preStop + 20 giây\n  ✓ gateway: initContainer wait-catalog\n  ✓ ~/shop/gateway.yaml (apply --dry-run=server): probe, preStop, grace khớp Deployment đang chạy\n  ✓ ~/shop/catalog.yaml (apply --dry-run=server): probe, preStop, grace khớp Deployment đang chạy\n  ✓ ~/shop/order.yaml (apply --dry-run=server): probe, preStop, grace khớp Deployment đang chạy\n  ✓ answers.env: READINESS_RESTARTS=0 (readiness sai không restart); probe-lab đã xoá\n  ✓ answers.env: LIVENESS_RESTARTS_GE1=yes (liveness sai thì kubelet restart container)\n  ✓ answers.env: LIVENESS_EXIT_CODE=143 (lastState.terminated của container bị liveness giết: SIGTERM)\n  ✓ answers.env: PROBE_PERIOD_DEFAULT=10 (k explain …livenessProbe.periodSeconds)\n  → 14/14 đạt",
      projectDelta: "Mảnh project **probes** hoàn thành: ba Deployment có startup/liveness/readiness probe nối với nhóm health của Actuator, preStop + grace period khớp graceful shutdown của Spring, gateway có init container chờ catalog. Buổi sau dựa vào đó để rollout gateway lên 2.0 mà không rớt request.",
    },
    review: [
      { q: "Readiness và liveness cùng hỏng, hậu quả khác nhau thế nào?", a: "Readiness hỏng: Pod không Ready, địa chỉ trong EndpointSlice thành `ready: false`, Service ngừng gửi request; container không bị restart. Liveness hỏng: kubelet giết container (SIGTERM → exit 143) và tạo lại theo restartPolicy." },
      { q: "Vì sao không đưa kiểm tra database vào livenessProbe?", a: "Database chết thì mọi Pod cùng đỏ liveness, kubelet restart tất cả cùng lúc mà không sửa được gì, còn dồn tải lúc database hồi lại. Phụ thuộc bên ngoài thuộc về readiness (hoặc để app tự xử lý); liveness chỉ trả lời \"tiến trình này có kẹt không\"." },
      { q: "startupProbe giải quyết việc gì mà initialDelaySeconds của liveness không làm tốt?", a: "Cho thời gian khởi động một ngân sách riêng (failureThreshold × periodSeconds) mà không làm liveness chậm phát hiện sự cố sau đó. Trên lab, Spring có lúc mất 93 giây mới lên khi cluster bận; initialDelay cố định hoặc quá ngắn (vòng restart) hoặc quá dài (phát hiện chậm)." },
      { q: "Pod bị xoá: preStop, SIGTERM, terminationGracePeriodSeconds xảy ra theo thứ tự nào, và vì sao cần preStop?", a: "Xoá → (song song: rút khỏi EndpointSlice/iptables) preStop chạy → SIGTERM tới PID 1 → app graceful shutdown → hết grace period thì SIGKILL. preStop giữ app nhận kết nối trong lúc kube-proxy trên các node chưa kịp bỏ địa chỉ Pod; thiếu nó, đo trên lab có request `000` trong lúc rollout." },
      { q: "Pod gateway đứng ở `Init:0/1`. Xem gì?", a: "`k logs <pod> -c wait-catalog` (log của init container), rồi xem thứ nó chờ: Service/EndpointSlice của catalog có địa chỉ ready chưa." },
    ],
  },

  // ───────────────────────────── s14 ─────────────────────────────
  {
    id: "s14",
    stage: "st2",
    title: "Rolling update và rollback từ v1 lên v2",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-deploy-rollout"],
    requires: ["s13"],
    status: "published",
    pieces: [],
    goals: [
      "Nâng gateway từ 1.0 lên 2.0 bằng set image, theo dõi bằng rollout status, ghi change-cause cho từng revision.",
      "Chọn maxSurge/maxUnavailable để rollout không rớt request, và chứng minh bằng một vòng curl chạy suốt lúc rollout.",
      "Rollback về đúng revision chỉ định khi bản mới hỏng, rồi roll lại lên 2.0.",
    ],
    skills: [
      { skill: "k-set-image", level: "Gõ được không tra" },
      { skill: "k-rollout-status", level: "Gõ được không tra" },
      { skill: "k-rollout-history", level: "Gõ được không tra" },
      { skill: "k-rollout-undo", level: "Gõ được không tra" },
      { skill: "k-rolling-update-yaml", level: "Viết được không tra" },
      { skill: "k-change-cause", level: "Gõ được có tra" },
      { skill: "k-rollout-restart", level: "Gõ được không tra" },
      { skill: "k-rollback-flow", level: "Dưới 3 phút" },
    ],
    uses: ["k-probes-yaml", "k-graceful-shutdown", "net-curl-nc", "k-describe-pod"],
    foundation: null,
    mindset: `**Rolling update là thứ bạn đã làm tay với một nhóm instance sau load balancer.** Deploy kiểu cũ cho một cụm Spring Boot sau Nginx hay ELB: rút một máy khỏi pool, dừng JVM, cài jar mới, khởi động, chờ health check xanh, đưa vào pool, sang máy kế. Deployment làm đúng vòng đó, chỉ khác ở chỗ nó **thêm Pod mới trước rồi mới bớt Pod cũ**, và "health check xanh" chính là readinessProbe bạn gắn ở s13. Thiếu probe tốt, Kubernetes coi một Pod là xong ngay khi container chạy, và một phiên bản hỏng vẫn thay sạch Pod cũ.

Mỗi lần template Pod đổi (image, env, probe…), Deployment tạo một **ReplicaSet mới** và tăng dần nó, giảm dần ReplicaSet cũ. Hai số điều khiển nhịp:

| | Nghĩa | gateway 2 replica, \`maxUnavailable: 0\`, \`maxSurge: 1\` |
|---|---|---|
| \`maxSurge\` | Được có thêm tối đa bao nhiêu Pod **trên** số replica | tối đa 3 Pod cùng lúc |
| \`maxUnavailable\` | Được thiếu tối đa bao nhiêu Pod **dưới** số replica | luôn có ≥ 2 Pod Ready |

Mặc định là \`25%\` / \`25%\` (làm tròn: surge lên, unavailable xuống), với 1 replica nghĩa là surge 1, unavailable 0. Với 2 replica và \`maxUnavailable: 0\`, controller chỉ xoá một Pod cũ khi một Pod mới đã Ready: đổi lại rollout chậm hơn và cần chỗ cho một Pod thừa trên worker. \`Recreate\` thì xoá hết rồi mới tạo: có downtime, dùng khi hai phiên bản không được chạy song song (đổi schema không tương thích).

**Không rớt request cần cả ba thứ:** \`maxUnavailable: 0\` (luôn đủ Pod), readinessProbe (Pod mới chỉ nhận request khi Spring đã sẵn sàng), preStop + graceful shutdown (Pod cũ ngừng nhận kết nối mới trước khi đóng cổng). Đo trên lab với vòng \`curl\` 5 lần/giây tới ClusterIP của gateway: đủ cả ba thì 200/200 request \`200\` trong lúc lên 2.0; bỏ preStop, cùng phép đo khi \`rollout restart\` mất 1 request trên 182 (\`000\`: không có phản hồi).

**Blue/green, canary và rolling khác nhau ở chỗ ai giữ "công tắc".** Rolling update để controller trộn dần v1 và v2 sau cùng một Service: rẻ, nhưng có lúc cả hai phiên bản cùng phục vụ (API phải tương thích hai chiều) và quay lui cũng là một rollout. Blue/green dựng đủ v2 song song rồi đổi selector của Service (hoặc Ingress) một lần: chuyển và quay lui tức thì, tốn gấp đôi tài nguyên trong lúc chuyển (xem bài \`w3-5\` trong lộ trình CKAD và chương 9 của *Optimizing Cloud Native Java*). Canary chia một phần nhỏ lưu lượng cho v2 trước. Deployment chỉ có sẵn \`RollingUpdate\` và \`Recreate\`; hai kiểu kia bạn dựng bằng nhiều Deployment + nhãn.

**Revision và rollback.** \`kubectl rollout history\` liệt kê ReplicaSet theo annotation \`deployment.kubernetes.io/revision\`; cột CHANGE-CAUSE lấy từ annotation \`kubernetes.io/change-cause\` của Deployment lúc revision đó được tạo (cờ \`--record\` đã bị bỏ, nên tự \`kubectl annotate\`). \`rollout undo --to-revision=N\` không "quay ngược thời gian": nó chép template của revision N thành template hiện tại, ReplicaSet cũ được dùng lại và **nhận số revision mới nhất**, số N biến mất khỏi danh sách. ReplicaSet cũ chỉ còn tới \`revisionHistoryLimit\` (mặc định 10).`,
    refs: [
      { label: "Bài lộ trình CKA Study Guide: Deployment — rolling update, rollback và thay thế replica", href: "#/roadmap/ckabook/cb-w3-3" },
      { label: "Bài lộ trình CKAD: Rolling updates & rollbacks (rollout status/undo/history)", href: "#/roadmap/ckad/w3-3" },
      { label: "Bài lộ trình CKAD: Strategies — RollingUpdate (maxSurge/maxUnavailable) vs Recreate", href: "#/roadmap/ckad/w3-4" },
      { label: "Bài lộ trình CKAD: Blue/Green và Canary bằng labels + services", href: "#/roadmap/ckad/w3-5" },
      { label: "Bài lộ trình Kubernetes in Action: Deployment, rollout và rollback", href: "#/roadmap/k8sbook/kb-w8-1" },
      { label: "Bài lộ trình Kubernetes in Action: Canary, A/B, Blue/Green", href: "#/roadmap/k8sbook/kb-w8-2" },
      { label: "CKA Study Guide, chương 11 — Deployment và ReplicaSet", href: "#/docs/ckabook-11" },
      { label: "Optimizing Cloud Native Java, chương 9 — Triển khai Java trên Cloud (blue/green, canary)", href: "#/docs/ocnj-09" },
      { label: "Thực hành nhanh: set image, rollout status/history/undo/restart", href: "#/commands" },
      { label: "kubernetes.io: Deployments — Updating, Rolling Back, Strategy", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
      { label: "kubernetes.io: kubectl rollout", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_rollout/" },
    ],
    stateIn: `Đầu ra s13: ba Deployment bản 1.0 có ba probe, preStop và grace period; gateway 1 replica. Image \`shop/gateway:2.0\` đã nạp sẵn trên các node từ s09 (\`./labs/lab images cka\` nếu thiếu). \`./labs/lab begin cka s14\` kiểm đầu vào bằng verify của s13.`,
    stateOut: "gateway 2 replica chạy shop/gateway:2.0, RollingUpdate maxUnavailable 0 / maxSurge 1; lịch sử revision có change-cause, có revision image hỏng đã rollback; ~/drills/s14/curl.log toàn 200; ~/shop/gateway.yaml khớp.",
    tasks: [
      { id: "t1", text: "Trong `~/shop/gateway.yaml`: `replicas: 2` và `strategy` RollingUpdate với `maxUnavailable: 0`, `maxSurge: 1` (vẫn image 1.0). Apply, `k -n shop rollout status deploy/gateway`. Ghi change-cause cho revision hiện tại: `k -n shop annotate deploy/gateway kubernetes.io/change-cause=\"2 replica, maxUnavailable 0\"`." },
      { id: "t2", text: "Vòng curl: ở một cửa sổ tmux trên cka-cp, lấy ClusterIP của Service gateway, `mkdir -p ~/drills/s14 && : > ~/drills/s14/curl.log` (tệp chỉ ghi nối: lần thử trước còn dòng `000` thì xoá đi), rồi chạy một vòng `curl -s -o /dev/null -m 2 -w '%{http_code}\\n' http://<ClusterIP>:8080/api/info >> ~/drills/s14/curl.log; sleep 0.2` không dừng. Để nó chạy suốt bước 3." },
      { id: "t3", text: "Cửa sổ kia: `k -n shop set image deploy/gateway gateway=shop/gateway:2.0`, ngay sau đó annotate change-cause `lên 2.0`, rồi `k -n shop rollout status deploy/gateway` và `k -n shop get rs -l app=gateway -w` để thấy hai ReplicaSet đổi số. Chờ thêm 15 giây sau khi rollout xong rồi mới dừng vòng curl (Ctrl-c). `sort ~/drills/s14/curl.log | uniq -c`: phải chỉ có `200`, ít nhất 30 dòng." },
      { id: "t4", text: "Bản hỏng: `set image` lên `shop/gateway:2.1` (tag không có), annotate `thử 2.1`. `rollout status --timeout=30s` báo gì? `k -n shop get pod -l app=gateway`: Pod cũ có bị xoá không, vì sao? `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info` vẫn trả version nào?" },
      { id: "t5", text: "`k -n shop rollout history deploy/gateway`, rồi `… --revision=<n>` để xem template của từng revision. Ghi `BROKEN_REVISION=<revision của image 2.1>` vào `~/drills/s14/answers.env`. Rollback về **revision của 1.0 mới nhất** bằng `rollout undo --to-revision=<n>`, annotate change-cause; xem lại history: số revision đó đi đâu?" },
      { id: "t6", text: "Roll lại lên 2.0 (`set image`, change-cause `lên lại 2.0`), chờ rollout xong. Sửa `~/shop/gateway.yaml` cho khớp (image 2.0) và `k apply -f ~/shop/gateway.yaml` — không được tạo thêm revision nào (`rollout history` không đổi). Thử `k -n shop rollout restart deploy/catalog` và xem nó có tạo revision mới cho catalog không." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s14` phải đạt 7/7." },
    ],
    hints: [
      "`set image deploy/gateway gateway=…`: phần trước `=` là **tên container** (xem `k -n shop get deploy gateway -o jsonpath='{.spec.template.spec.containers[*].name}'`), không phải tên Deployment.",
      "`rollout status` của bản hỏng không bao giờ tự xong: Deployment chỉ đặt condition `Progressing=False` (`ProgressDeadlineExceeded`) sau `progressDeadlineSeconds` (mặc định 600 giây). Dùng `--timeout` và đọc `k get pod`.",
      "Vòng curl có dòng `000`: curl không nhận được phản hồi trong 2 giây. Kiểm Pod mới đã có readinessProbe chưa, Pod cũ có preStop chưa (`k -n shop get deploy gateway -o yaml | grep -A4 preStop`).",
      "Annotate change-cause **sau** `set image`: annotation của Deployment được chép sang ReplicaSet hiện hành. Annotate trước thì câu đó bị ghi lên cả revision đang chạy (cũ), rồi chép tiếp sang revision mới.",
      "`rollout undo` cảnh báo `Rolling back will not update the kubectl.kubernetes.io/last-applied-configuration annotation`: nhớ sửa tệp và `apply`, nếu không lần `apply -f ~/shop/` sau sẽ kéo Deployment về thứ trong tệp.",
      "`rollout history --revision=N` in template Pod của revision N: nhanh hơn đoán xem revision nào là 1.0.",
    ],
    solution: `Output là của máy soạn bài; tên ReplicaSet, Pod và số revision trên máy bạn sẽ khác.

**1. Hai replica, rolling update không thiếu Pod**

\`\`\`yaml
# ~/shop/gateway.yaml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway.yaml && k -n shop rollout status deploy/gateway
k -n shop annotate deploy/gateway kubernetes.io/change-cause="2 replica, maxUnavailable 0"
\`\`\`

**2 và 3. Vòng curl trong lúc lên 2.0**

\`\`\`bash
mkdir -p ~/drills/s14 && : > ~/drills/s14/curl.log
IP=$(k -n shop get svc gateway -o jsonpath='{.spec.clusterIP}')
while :; do curl -s -o /dev/null -m 2 -w '%{http_code}\\n' http://$IP:8080/api/info >> ~/drills/s14/curl.log; sleep 0.2; done   # cửa sổ 1
\`\`\`

\`\`\`bash
k -n shop set image deploy/gateway gateway=shop/gateway:2.0     # cửa sổ 2
k -n shop annotate deploy/gateway kubernetes.io/change-cause="lên 2.0"
k -n shop rollout status deploy/gateway
k -n shop get rs -l app=gateway -w
\`\`\`

Đo trên lab (vòng curl dừng 15 giây sau khi rollout xong):

\`\`\`bash
sort ~/drills/s14/curl.log | uniq -c
#     200 200
\`\`\`

Đừng chạy vòng này trong một subshell có \`set -e\`: \`curl\` lỗi đầu tiên (mã thoát khác 0) giết cả vòng, tệp chỉ còn những dòng 200 trước đó (đã gặp trên lab). Cùng phép đo khi bỏ preStop rồi \`rollout restart\`: \`1 000\`, \`181 200\`.

**4. Bản hỏng**

\`\`\`bash
k -n shop set image deploy/gateway gateway=shop/gateway:2.1
k -n shop annotate deploy/gateway kubernetes.io/change-cause="thử 2.1"
k -n shop rollout status deploy/gateway --timeout=30s     # hết giờ, rollout chưa xong
k -n shop get pod -l app=gateway                          # hai Pod 2.0 vẫn Running, một Pod mới kẹt kéo image
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info   # vẫn "version":"2.0"
\`\`\`

Với \`maxUnavailable: 0\`, Pod mới không bao giờ Ready nên không Pod cũ nào bị xoá: shop vẫn phục vụ bản 2.0. Lý do kẹt đọc như ở s10 (\`describe pod\`, Event \`Failed to pull image\`).

**5. History và undo về một revision cụ thể**

\`\`\`bash
k -n shop rollout history deploy/gateway
k -n shop rollout history deploy/gateway --revision=3 | grep Image
echo BROKEN_REVISION=6 > ~/drills/s14/answers.env      # số của revision "thử 2.1" trên máy bạn
k -n shop rollout undo deploy/gateway --to-revision=4   # revision 1.0 mới nhất
# Warning: resource deployments/gateway was previously managed with 'kubectl apply'. Rolling back will not update the
# kubectl.kubernetes.io/last-applied-configuration annotation, which may cause unexpected behavior on future 'kubectl apply'
# operations. Consider using 'kubectl apply' with your previous configuration file instead.
k -n shop annotate deploy/gateway kubernetes.io/change-cause="undo về revision 4 (1.0)"
\`\`\`

**6. Lên lại 2.0 và đồng bộ tệp**

\`\`\`bash
k -n shop set image deploy/gateway gateway=shop/gateway:2.0
k -n shop annotate deploy/gateway kubernetes.io/change-cause="lên lại 2.0 sau khi 2.1 hỏng"
k -n shop rollout status deploy/gateway
sed -i 's|shop/gateway:1.0|shop/gateway:2.0|' ~/shop/gateway.yaml && k apply -f ~/shop/gateway.yaml
k -n shop rollout history deploy/gateway
# REVISION  CHANGE-CAUSE
# 1         <none>
# 2         <none>
# 3         <none>
# 6         thử 2.1
# 7         undo về revision 4 (1.0)
# 8         lên lại 2.0 sau khi 2.1 hỏng
k -n shop get rs -l app=gateway
# gateway-7d4599bb95   0   0   0   …   shop/gateway:2.1
# gateway-84cf744666   2   2   2   …   shop/gateway:2.0
# … bốn ReplicaSet 1.0 cũ, đều 0
\`\`\`

Revision 4 (1.0) thành 7 lúc undo; revision 5 (2.0 đầu tiên) thành 8 lúc lên lại 2.0, vì template giống hệt nên Deployment dùng lại đúng ReplicaSet \`gateway-84cf744666\`. Change-cause của revision là annotation lúc nó *trở thành* hiện hành, nên "lên 2.0" ban đầu bị ghi đè. \`k apply\` sau cùng không tạo revision: template trong tệp trùng template đang chạy.

\`k -n shop rollout restart deploy/catalog\` thêm annotation \`kubectl.kubernetes.io/restartedAt\` vào template: catalog có thêm một revision, Pod được thay theo đúng nhịp rolling update.

Lời giải tự động: \`labs/cka/sessions/s14/apply.sh\` (manifest cuối trong \`labs/cka/sessions/s14/files/gateway.yaml\`).`,
    exam: {
      patterns: [
        "\"Cập nhật image của Deployment X lên Y, ghi lại change-cause, rồi rollback về bản trước\" — `set image`, `annotate kubernetes.io/change-cause=…`, `rollout undo` (hoặc `--to-revision`).",
        "\"Đổi chiến lược để luôn có đủ N Pod trong lúc cập nhật\" — `strategy.rollingUpdate.maxUnavailable: 0`, `maxSurge ≥ 1`.",
        "\"Deployment kẹt nửa chừng sau khi cập nhật\" — `rollout status`, `get rs`, Pod mới: ImagePullBackOff / không Ready; `rollout undo`.",
        "\"Khởi động lại mọi Pod của Deployment để nạp lại ConfigMap\" — `rollout restart`.",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Trong 3 phút: Deployment `order` lên `shop/order:2.0` với change-cause `order 2.0`, xác nhận rollout xong, rồi quay về bản trước bằng một lệnh và chứng minh image là `1.0`.",
          timeLimitMin: 3,
          solution: "```bash\nk -n shop set image deploy/order order=shop/order:2.0\nk -n shop annotate deploy/order kubernetes.io/change-cause='order 2.0'\nk -n shop rollout status deploy/order\nk -n shop rollout undo deploy/order\nk -n shop rollout status deploy/order\nk -n shop get deploy order -o jsonpath='{.spec.template.spec.containers[0].image}{\"\\n\"}'   # shop/order:1.0\n```\nVerify của s16 so `order` với `shop/order:1.0`: đừng để nó ở 2.0.",
        },
        {
          text: "Trong 2 phút: tạm dừng rollout của gateway, đổi hai thứ (image và một biến môi trường) rồi tiếp tục để chỉ tạo **một** revision. Đưa mọi thứ về như cũ sau đó.",
          timeLimitMin: 2,
          solution: "```bash\nk -n shop rollout pause deploy/gateway\nk -n shop set image deploy/gateway gateway=shop/gateway:1.0\nk -n shop set env deploy/gateway DEMO=1\nk -n shop rollout resume deploy/gateway\nk -n shop rollout history deploy/gateway | tail -2   # một revision mới\nk apply -f ~/shop/gateway.yaml && k -n shop set env deploy/gateway DEMO-\n```\nLúc pause, đổi template không sinh ReplicaSet; resume mới sinh một lần.",
        },
      ],
    },
    tips: [
      "Ba lệnh liền nhau sau mỗi thay đổi: `rollout status` → `rollout history` → `get rs`. Kẹt thì `get pod` của ReplicaSet mới.",
      "`maxUnavailable: 0` mà worker hết chỗ cho Pod thừa thì rollout đứng ở Pending: cần ≥ 1 trong hai số khác 0, và chỗ cho `maxSurge` Pod.",
      "Rollback nhanh nhất trong phòng thi: `rollout undo` (về revision ngay trước). `--to-revision` khi đề chỉ rõ.",
      "`rollout restart` chỉ đổi annotation `kubectl.kubernetes.io/restartedAt` trong template: vẫn là một revision mới, đi đúng nhịp maxSurge/maxUnavailable.",
      "Sau mọi lệnh mệnh lệnh (`set image`, `undo`), đồng bộ lại tệp YAML: nguồn sự thật phải là một.",
    ],
    outcome: {
      md: `gateway chạy 2.0 trên hai replica, lên phiên bản không rớt request nào trong vòng đo của bạn; bạn đã thấy một bản hỏng kẹt lại mà shop vẫn phục vụ, và quay lui về đúng revision. Trên Mac:

\`\`\`bash
./labs/lab verify cka s14
\`\`\`

Verify đọc chiến lược, image và lịch sử ReplicaSet của gateway, gọi \`/api/info\` qua proxy của apiserver, và đếm mã HTTP trong \`curl.log\` của bạn.`,
      verifyOutput: "lab: kiểm s14\n  (chờ apiserver và Deployment gateway; lâu nhất vài phút nếu Pod đang khởi động)\n  ✓ gateway: image shop/gateway:2.0, 2/2/2 cập nhật và Available\n  ✓ gateway: strategy RollingUpdate, maxUnavailable 0, maxSurge 1\n  ✓ gateway /api/info trả version 2.0 (qua apiserver proxy)\n  ✓ lịch sử: ≥ 3 revision, có revision image hỏng cũ hơn revision hiện hành, revision hiện hành có change-cause\n  ✓ ~/drills/s14/curl.log: ≥ 30 dòng, mọi dòng 200\n  ✓ ~/shop/gateway.yaml (apply --dry-run=server): image 2.0, replicas 2, maxUnavailable 0, maxSurge 1\n  ✓ answers.env: BROKEN_REVISION là revision của ReplicaSet image hỏng (đọc từ rollout history)\n  → 7/7 đạt",
      projectDelta: "gateway lên 2.0 bằng rolling update không downtime (2 replica, maxUnavailable 0, maxSurge 1), có lịch sử revision với change-cause và một lần rollback thật. Buổi sau thêm các workload chạy nền: DaemonSet, Job, CronJob.",
    },
    review: [
      { q: "gateway 2 replica, `maxUnavailable: 0`, `maxSurge: 1`. Trong lúc rollout có tối đa bao nhiêu Pod, tối thiểu bao nhiêu Pod Ready?", a: "Tối đa 3 Pod (2 + surge 1), tối thiểu 2 Pod Ready: controller chỉ xoá Pod cũ khi Pod mới đã Ready." },
      { q: "Rollout image hỏng (tag không có) với `maxUnavailable: 0`: shop có bị gián đoạn không?", a: "Không. Pod mới kẹt ImagePullBackOff, không bao giờ Ready nên không Pod cũ nào bị xoá; `rollout status` treo, Deployment báo `ProgressDeadlineExceeded` sau progressDeadlineSeconds. Rollback bằng `rollout undo`." },
      { q: "`rollout undo --to-revision=4` xong, `rollout history` không còn revision 4. Vì sao?", a: "Undo chép template của revision 4 thành template hiện tại; ReplicaSet đó được dùng lại và mang số revision mới nhất. Mỗi ReplicaSet chỉ có một số revision." },
      { q: "Rolling update và blue/green khác nhau ở đâu?", a: "Rolling: một Deployment, controller thay dần Pod sau cùng Service, hai phiên bản cùng phục vụ một lúc, quay lui là một rollout nữa. Blue/green: hai bộ Pod đầy đủ, đổi selector Service/Ingress một lần, chuyển và quay lui tức thì nhưng tốn gấp đôi tài nguyên lúc chuyển." },
      { q: "Vì sao vòng curl vẫn có thể có lỗi dù đã `maxUnavailable: 0` và readinessProbe?", a: "Lúc Pod cũ bị xoá, kube-proxy trên các node cần vài giây để bỏ địa chỉ của nó; nếu app đóng cổng ngay khi nhận SIGTERM, request trong khoảng đó lỗi. preStop sleep giữ app nhận kết nối cho tới khi iptables cập nhật xong." },
    ],
  },

  // ───────────────────────────── s15 ─────────────────────────────
  {
    id: "s15",
    stage: "st2",
    title: "DaemonSet, Job và CronJob",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-selfheal"],
    requires: ["s14"],
    status: "published",
    pieces: [],
    goals: [
      "Chạy DaemonSet log-agent có một Pod trên mọi node, kể cả control plane nhờ toleration, đọc /var/log của node qua hostPath chỉ đọc.",
      "Chạy Job seed tạo đơn hàng mẫu qua gateway (POST /api/orders) với completions/backoffLimit, và CronJob order-report gọi GET /api/orders mỗi 5 phút.",
      "Chạy CronJob ngay bằng create job --from để kiểm mà không chờ lịch; đọc lý do một Job thất bại khi chạm backoffLimit.",
    ],
    skills: [
      { skill: "k-daemonset-yaml", level: "Viết được có tra" },
      { skill: "k-create-job", level: "Gõ được không tra" },
      { skill: "k-job-yaml", level: "Viết được không tra" },
      { skill: "k-create-cronjob", level: "Gõ được không tra" },
      { skill: "k-cronjob-yaml", level: "Viết được có tra" },
      { skill: "k-job-from-cronjob", level: "Gõ được không tra" },
    ],
    uses: ["k-run-dry-yaml", "k-logs", "k-get-wide", "k-explain"],
    foundation: null,
    mindset: `**Ba controller, ba kiểu "đủ".** Deployment muốn *N bản sao chạy mãi*. DaemonSet muốn *đúng một Pod trên mỗi node khớp điều kiện*: thêm node là thêm Pod, không có \`replicas\`. Job muốn *N lần chạy thành công rồi dừng*: Pod thoát 0 là xong việc, không phải sự cố. CronJob là "máy tạo Job" theo lịch cron.

| Ở thế giới Java | Ở Kubernetes |
|---|---|
| Agent cài trên mọi máy (Filebeat, node exporter, JMX agent của hạ tầng) | DaemonSet |
| \`main()\` chạy một lần: migration, nạp dữ liệu, batch Spring Batch | Job |
| \`@Scheduled(cron = …)\` hay crontab trên một máy "đặc biệt" | CronJob |

\`@Scheduled\` trong một service có 2 replica chạy **hai lần**; CronJob tách lịch ra khỏi số replica của app, và \`concurrencyPolicy: Forbid\` chặn hai lần chạy chồng nhau.

**DaemonSet và control plane.** cka-cp mang taint \`node-role.kubernetes.io/control-plane:NoSchedule\`: Pod không có toleration tương ứng không được xếp lên đó. Agent thu log cần chạy *cả* ở đó, nên thêm toleration (taint/toleration học kỹ ở chặng 3). \`hostPath\` mount thư mục của node vào Pod — mạnh và nguy hiểm, nên \`readOnly: true\`.

**Job: restartPolicy, completions, backoffLimit.** Pod của Job phải có \`restartPolicy\` \`OnFailure\` (kubelet chạy lại container trong cùng Pod) hoặc \`Never\` (Job controller tạo Pod mới, Pod lỗi ở lại để bạn đọc log). \`backoffLimit\` (mặc định 6) là số lần thử lại trước khi Job bỏ cuộc với condition \`Failed\`, lý do \`BackoffLimitExceeded\`. Trên lab, \`seed-bad\` (\`backoffLimit: 1\`) dừng với \`BackoffLimitExceeded\` chỉ vài giây sau khi tạo. Buổi này dùng \`OnFailure\` cho \`seed\` và \`order-report\` để không để lại Pod Failed (s16 chấm "không Pod lỗi nào trong shop").

**Dữ liệu H2 mất khi order khởi động lại.** \`seed\` tạo 3 đơn hàng trong H2 của Pod order; Pod order bị tạo lại là mất. Vì thế verify chấm Job \`succeeded=3\`, không đếm đơn hàng. PostgreSQL đến ở s24.`,
    refs: [
      { label: "Bài lộ trình CKA: DaemonSets — vì sao chạy được trên mọi node", href: "#/roadmap/cka/cka-w4-7" },
      { label: "Bài lộ trình CKAD: Jobs — completions, parallelism, backoffLimit, activeDeadlineSeconds", href: "#/roadmap/ckad/w3-6" },
      { label: "Bài lộ trình CKAD: CronJobs — cron syntax, concurrencyPolicy, successfulJobsHistoryLimit", href: "#/roadmap/ckad/w3-7" },
      { label: "CKA Study Guide, chương 11 — Deployment và ReplicaSet", href: "#/docs/ckabook-11" },
      { label: "CKA Study Guide, chương 15 — Volume (hostPath)", href: "#/docs/ckabook-15" },
      { label: "Thực hành nhanh: create job/cronjob, job --from, YAML DaemonSet/Job/CronJob", href: "#/commands" },
      { label: "kubernetes.io: DaemonSet", href: "https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/" },
      { label: "kubernetes.io: Jobs", href: "https://kubernetes.io/docs/concepts/workloads/controllers/job/" },
      { label: "kubernetes.io: CronJob", href: "https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/" },
    ],
    stateIn: `Đầu ra s14: gateway 2.0 (2 replica), catalog (2), order (1), có probe; manifest ở \`~/shop/\`. Buổi này kéo \`busybox:1.37\` từ Docker Hub (node nào đã chạy init container của gateway ở s13 thì đã có sẵn; cka-cp kéo lần đầu). \`./labs/lab begin cka s15\` kiểm đầu vào bằng verify của s14.`,
    stateOut: "DaemonSet log-agent có một Pod Ready trên mỗi node (cả cka-cp); Job seed Complete 3/3; CronJob order-report (*/5, giữ 2/1 Job) đã có lastSuccessfulTime; Job order-report-manual Complete; manifest ở ~/shop/{log-agent,seed,order-report}.yaml; ~/drills/s15/answers.env.",
    tasks: [
      { id: "t1", text: "DaemonSet không có lệnh `create`: sinh khung bằng `k -n shop create deploy log-agent --image=busybox:1.37 $do > ~/shop/log-agent.yaml`, đổi `kind: DaemonSet`, xoá `replicas`, `strategy`, `status`. Container `agent` chạy vòng `while true; do echo \"$(date -Iseconds) $NODE_NAME $(ls /var/log/pods | wc -l) thư mục log Pod\"; sleep 60; done`, `NODE_NAME` lấy từ `fieldRef: spec.nodeName`, mount `hostPath /var/log` vào `/var/log` với `readOnly: true`. Apply: `k -n shop get ds,pod -l app=log-agent -o wide` — bao nhiêu Pod, trên node nào?" },
      { id: "t2", text: "Thêm toleration cho taint `node-role.kubernetes.io/control-plane` (`k describe node cka-cp | grep Taints` để thấy nó) rồi apply lại; DESIRED/READY phải là 3. `k -n shop logs -l app=log-agent --prefix`." },
      { id: "t3", text: "Job: sinh khung bằng `k -n shop create job seed --image=busybox:1.37 $do -- sh -c true > ~/shop/seed.yaml`, rồi trong vim đặt lệnh vào một khối `|` của YAML: `wget -qO- --header 'Content-Type: application/json' --post-data '{\"productId\":1,\"qty\":2}' http://gateway:8080/api/orders` (đừng gõ cả lệnh này trong `sh -c '…'` hay `\"…\"` trên dòng lệnh: nháy của JSON sẽ đụng nháy của shell, body mất dấu `\"`, không còn là JSON), thêm `completions: 3`, `backoffLimit: 2`, `restartPolicy: OnFailure`. Apply, `k -n shop get job seed -w`, `k -n shop logs job/seed`, rồi `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/orders`." },
      { id: "t4", text: "CronJob: `k -n shop create cronjob order-report --image=busybox:1.37 --schedule='*/5 * * * *' $do -- sh -c '…'` > `~/shop/order-report.yaml` (lệnh gọi `GET /api/orders`, in kèm thời điểm, `set -e` để wget lỗi thì Job lỗi), thêm `concurrencyPolicy: Forbid`, `successfulJobsHistoryLimit: 2`, `failedJobsHistoryLimit: 1`, `restartPolicy: OnFailure`. Apply." },
      { id: "t5", text: "Không chờ lịch: `k -n shop create job order-report-manual --from=cronjob/order-report`, chờ Complete, đọc log. `k -n shop get job order-report-manual -o yaml | grep -A6 ownerReferences` — Job này thuộc về ai? `k -n shop get cronjob order-report` — LAST SCHEDULE và `.status.lastSuccessfulTime`. Lưu bằng chứng: `k -n shop get job order-report-manual -o yaml > ~/drills/s15/order-report-manual.yaml` (CronJob dọn Job này theo `successfulJobsHistoryLimit`: verify chấm tệp, không chấm Job còn sống)." },
      { id: "t6", text: "Tình huống hỏng: Job `seed-bad` gọi sai đường dẫn (`http://gateway:8080/api/order`), `backoffLimit: 1`, `restartPolicy: Never` (mặc định của `create job`). Theo dõi Pod và Job; `k -n shop describe job seed-bad` — condition và lý do? Ghi `BROKEN_JOB_REASON=<lý do>` vào `~/drills/s15/answers.env`, đọc log Pod lỗi, rồi xoá Job." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s15` phải đạt 7/7." },
    ],
    hints: [
      "DaemonSet DESIRED 2 trên cluster 3 node: Pod không xếp được lên cka-cp vì taint. Toleration `operator: Exists` + `effect: NoSchedule` với đúng `key`.",
      "`$do` của `create job/cronjob` đặt lệnh sau `--`; các trường `completions`, `backoffLimit`, `successfulJobsHistoryLimit` phải tự thêm vào YAML (`k explain job.spec`, `k explain cronjob.spec`).",
      "Template của Job bất biến (kể cả khi Job đang chạy): sửa tệp xong phải `k delete job seed` rồi apply lại.",
      "Thứ tự trong CronJob: `spec.jobTemplate.spec.template.spec.containers` — ba tầng `spec`. Lệch một tầng thì apply báo `unknown field`.",
      "Job lỗi mà không thấy Pod lỗi: với `OnFailure` container chạy lại trong cùng Pod (xem RESTARTS); với `Never` mỗi lần thử là một Pod mới.",
    ],
    solution: `Output là của máy soạn bài; tên Pod, uid và thời điểm trên máy bạn sẽ khác.

**1 và 2. DaemonSet log-agent**

\`\`\`bash
k -n shop create deploy log-agent --image=busybox:1.37 $do > ~/shop/log-agent.yaml
vim ~/shop/log-agent.yaml      # kind: DaemonSet; xoá replicas, strategy, status
k describe node cka-cp | grep Taints
# Taints:             node-role.kubernetes.io/control-plane:NoSchedule
\`\`\`

\`\`\`yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
  namespace: shop
  labels:
    app: log-agent
spec:
  selector:
    matchLabels:
      app: log-agent
  template:
    metadata:
      labels:
        app: log-agent
    spec:
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
      terminationGracePeriodSeconds: 5
      containers:
      - name: agent
        image: busybox:1.37
        command:
        - sh
        - -c
        - while true; do echo "$(date -Iseconds) $NODE_NAME $(ls /var/log/pods | wc -l) thư mục log Pod"; sleep 60; done
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        volumeMounts:
        - name: varlog
          mountPath: /var/log
          readOnly: true
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
          type: Directory
\`\`\`

\`\`\`bash
k apply -f ~/shop/log-agent.yaml
k -n shop get ds log-agent
# NAME        DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
# log-agent   3         3         3       3            3           <none>          29s
k -n shop get pod -l app=log-agent -o wide       # một Pod trên mỗi node cka-cp, cka-w1, cka-w2
k -n shop logs -l app=log-agent --prefix
# [pod/log-agent-cvpwd/agent] 2026-11-14T14:11:39+00:00 cka-cp 10 thư mục log Pod
# [pod/log-agent-mt8sr/agent] 2026-11-14T14:11:34+00:00 cka-w1 9 thư mục log Pod
\`\`\`

Không có toleration thì DESIRED chỉ là 2: DaemonSet controller bỏ qua node mà Pod không tolerate. \`$NODE_NAME\` đến từ downward API (\`fieldRef: spec.nodeName\`). Giờ trong log là UTC: image busybox không có dữ liệu múi giờ, khác giờ \`+07\` của VM.

**3. Job seed**

\`\`\`bash
k -n shop create job seed --image=busybox:1.37 $do -- sh -c true > ~/shop/seed.yaml    # chỉ sinh khung
vim ~/shop/seed.yaml
\`\`\`

\`\`\`yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: seed
  namespace: shop
spec:
  completions: 3
  parallelism: 1
  backoffLimit: 2
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: seed
        image: busybox:1.37
        command:
        - sh
        - -c
        - |
          wget -qO- --header 'Content-Type: application/json' --post-data '{"productId":1,"qty":2}' http://gateway:8080/api/orders
\`\`\`

Viết lệnh thẳng trong khối \`|\` của YAML: không còn lớp nháy nào của shell bao quanh, JSON giữ nguyên dấu \`"\`. Gõ cả lệnh trên dòng \`k create job … -- sh -c "…"\` thì dấu \`"\` của JSON đóng chuỗi nháy kép của bash, body thành \`{productId:1,qty:2}\` (đã thử bằng bash), không còn là JSON, và Job không bao giờ đạt 3/3.

\`\`\`bash
k apply -f ~/shop/seed.yaml
k -n shop get job seed
# NAME   STATUS     COMPLETIONS   DURATION   AGE
# seed   Complete   3/3           10s        29s
k -n shop logs job/seed
# Found 3 pods, using pod/seed-24w24
# {"id":1,"productId":1,"qty":2,"createdAt":"2026-11-14T14:11:35.551407Z"}
k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/orders
# [{"id":1,…},{"id":2,…},{"id":3,"productId":1,"qty":2,"createdAt":"2026-11-14T14:11:41.905443Z"}]
\`\`\`

order trả \`201 Created\` cho POST; busybox \`wget\` coi đó là thành công. Job Complete mang hai condition \`SuccessCriteriaMet=True\` và \`Complete=True\`. Đơn hàng nằm trong H2 của Pod order: Pod order khởi động lại là mất, Job vẫn \`Complete\`.

**4. CronJob order-report**

\`\`\`bash
k -n shop create cronjob order-report --image=busybox:1.37 --schedule='*/5 * * * *' $do \\
  -- sh -c 'set -e; o=$(wget -qO- http://gateway:8080/api/orders); echo "$(date -Iseconds) đơn hàng: $o"' > ~/shop/order-report.yaml
vim ~/shop/order-report.yaml
\`\`\`

\`\`\`yaml
spec:
  schedule: "*/5 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 2
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: report
            image: busybox:1.37
            command:
            - sh
            - -c
            - |
              set -e; o=$(wget -qO- http://gateway:8080/api/orders); echo "$(date -Iseconds) đơn hàng: $o"
\`\`\`

Lệnh có \`: \` (\`đơn hàng: \`) nên phải là khối \`|\` hoặc chuỗi có nháy: viết trơn sau \`- \`, YAML hiểu nó là một cặp khoá/giá trị.

**5. Chạy ngay bằng create job --from**

\`\`\`bash
k -n shop create job order-report-manual --from=cronjob/order-report
k -n shop wait --for=condition=Complete job/order-report-manual
k -n shop logs job/order-report-manual
# 2026-11-14T14:11:45+00:00 đơn hàng: [{"id":1,"productId":1,"qty":2,…},…]
k -n shop get job order-report-manual -o yaml > ~/drills/s15/order-report-manual.yaml
grep -A6 -E '^  annotations:|ownerReferences' ~/drills/s15/order-report-manual.yaml
#   annotations:
#     cronjob.kubernetes.io/instantiate: manual
#   ownerReferences:
#   - apiVersion: batch/v1
#     controller: true
#     kind: CronJob
#     name: order-report
#     uid: 743620ec-bb16-4f88-a8e5-b637f68ed458
k -n shop get cronjob order-report
# NAME           SCHEDULE      TIMEZONE   SUSPEND   ACTIVE   LAST SCHEDULE   AGE
# order-report   */5 * * * *   <none>     False     0        <none>          29s
k -n shop get cronjob order-report -o jsonpath='{.status}'; echo
# {"lastSuccessfulTime":"2026-11-14T14:11:47Z"}
k -n shop get events --field-selector involvedObject.kind=CronJob
# Warning   UnexpectedJob   cronjob/order-report   Saw a job that the controller did not create or forgot: order-report-manual
\`\`\`

Job chạy tay **thuộc về** CronJob (\`ownerReferences\` với \`controller: true\`): xoá CronJob là xoá cả nó. Nó cập nhật \`lastSuccessfulTime\` nhưng không đụng \`LAST SCHEDULE\` (chỉ lần chạy theo lịch mới ghi); Event \`UnexpectedJob\` là CronJob controller nhận ra một Job nó không tự tạo. Và vì nó thuộc về CronJob, nó cũng bị **dọn theo** \`successfulJobsHistoryLimit\`. Đo trên lab: \`order-report-manual\` tạo lúc 21:13; lần chạy theo lịch 21:15 thành công, lần 21:20 (ngay sau khi VM khởi động lại, gateway chưa lên) thất bại nên không tính; lần 21:25 thành công là Job thành công thứ ba, và CronJob xoá Job cũ nhất — chính \`order-report-manual\`. Vì vậy verify chấm tệp YAML bạn lưu, không chấm Job còn sống.

**6. Tình huống hỏng: chạm backoffLimit**

\`\`\`bash
k -n shop create job seed-bad --image=busybox:1.37 $do -- sh -c 'wget -qO- http://gateway:8080/api/order' > ~/drills/s15/seed-bad.yaml
sed -i 's/^spec:$/spec:\\n  backoffLimit: 1/' ~/drills/s15/seed-bad.yaml
k apply -f ~/drills/s15/seed-bad.yaml
k -n shop get events --sort-by=.metadata.creationTimestamp | grep seed-bad
#   Normal    SuccessfulCreate       job/seed-bad   Created pod: seed-bad-k5mkj
#   …
#   Warning   BackoffLimitExceeded   job/seed-bad   Job has reached the specified backoff limit
k -n shop get job seed-bad -o jsonpath='{.status.conditions[?(@.type=="Failed")].reason}'; echo   # BackoffLimitExceeded
k -n shop logs -l job-name=seed-bad          # lý do wget thoát
echo BROKEN_JOB_REASON=BackoffLimitExceeded > ~/drills/s15/answers.env
k -n shop delete job seed-bad
\`\`\`

Đường dẫn \`/api/order\` không có trên gateway, \`wget\` thoát khác 0. Trên lab Job dừng với \`BackoffLimitExceeded\` chỉ vài giây sau khi tạo. Với \`restartPolicy: Never\` (mặc định của \`create job\`) Pod lỗi ở lại để đọc log cho tới khi bạn xoá Job.

Lời giải tự động: \`labs/cka/sessions/s15/apply.sh\` (manifest trong \`labs/cka/sessions/s15/files/\`).`,
    exam: {
      patterns: [
        "\"Tạo DaemonSet chạy trên mọi node, kể cả control plane\" — khung từ `create deploy $do`, đổi kind, thêm toleration.",
        "\"Tạo Job chạy N lần, tối đa M lần thử lại\" — `create job $do`, thêm `completions`, `backoffLimit`.",
        "\"Tạo CronJob chạy mỗi X phút, chỉ giữ K Job thành công\" — `create cronjob --schedule`, thêm `successfulJobsHistoryLimit`.",
        "\"Chạy CronJob ngay bây giờ\" — `create job <tên> --from=cronjob/<cron>`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 3 phút: Job `pi` (namespace `shop`, image `busybox:1.37`) in `ok` 2 lần song song (`completions: 2`, `parallelism: 2`), tự xoá 60 giây sau khi xong (`ttlSecondsAfterFinished`).",
          timeLimitMin: 3,
          solution: "```bash\nk -n shop create job pi --image=busybox:1.37 $do -- echo ok > pi.yaml\n# thêm vào spec: completions: 2, parallelism: 2, ttlSecondsAfterFinished: 60\nk apply -f pi.yaml\nk -n shop wait --for=condition=Complete job/pi\nk -n shop logs -l job-name=pi\n```\n`ttlSecondsAfterFinished` cho TTL controller xoá Job (và Pod của nó) sau khi xong.",
        },
        {
          text: "Trong 2 phút: tạm dừng CronJob `order-report` không xoá nó, rồi bật lại.",
          timeLimitMin: 2,
          solution: "```bash\nk -n shop patch cronjob order-report -p '{\"spec\":{\"suspend\":true}}'\nk -n shop get cronjob order-report          # SUSPEND True\nk -n shop patch cronjob order-report -p '{\"spec\":{\"suspend\":false}}'\n```",
        },
      ],
    },
    tips: [
      "Không có `create daemonset`: sinh Deployment bằng `$do` rồi đổi `kind`, xoá `replicas` và `strategy`.",
      "`create job --from=cronjob/x` là cách kiểm CronJob trong phòng thi: không ai chờ 5 phút.",
      "Đọc log của Job: `k logs job/<tên>` (một Pod của Job) hoặc `k logs -l job-name=<tên>`.",
      "Đề yêu cầu múi giờ thì thêm `spec.timeZone` (vd. `Asia/Ho_Chi_Minh`); không khai thì cột TIMEZONE của `k get cronjob` là `<none>`. Giờ trong log của busybox là UTC.",
    ],
    outcome: {
      md: `shop có thêm ba workload chạy nền: một agent trên mọi node, một Job nạp đơn hàng mẫu, một CronJob báo cáo. Trên Mac:

\`\`\`bash
./labs/lab verify cka s15
\`\`\`

Verify đếm Pod log-agent trên từng node, đọc completions/backoffLimit/succeeded của Job seed, lịch và giới hạn lịch sử của CronJob, ownerReference của Job chạy tay, và kiểm \`seed-bad\` đã xoá.`,
      verifyOutput: "lab: kiểm s15\n  (chờ apiserver và DaemonSet log-agent; lâu nhất vài phút nếu Pod đang khởi động)\n  ✓ DaemonSet log-agent: desired = ready = 3, một Pod Ready trên mỗi node (cka-cp cka-w1 cka-w2)\n  ✓ log-agent: image busybox ghim tag (không latest), hostPath /var/log mount chỉ đọc\n  ✓ Job seed: completions 3, backoffLimit 2, succeeded 3, lệnh POST /api/orders qua gateway\n  ✓ CronJob order-report: */5 * * * *, giữ 2/1 Job, concurrencyPolicy Forbid, GET /api/orders qua gateway, đã có lastSuccessfulTime\n  ✓ ~/drills/s15/order-report-manual.yaml: Job tạo từ CronJob order-report (ownerReference, instantiate=manual), Complete\n  ✓ ~/shop/log-agent.yaml, seed.yaml, order-report.yaml qua apply --dry-run=server, khớp cluster\n  ✓ answers.env: BROKEN_JOB_REASON=BackoffLimitExceeded; Job seed-bad đã xoá\n  → 7/7 đạt",
      projectDelta: "shop có DaemonSet log-agent, Job seed và CronJob order-report. Buổi sau là buổi sự cố của chặng 2: một số Pod của shop không chạy.",
    },
    review: [
      { q: "DaemonSet trên cluster 3 node chỉ có 2 Pod. Vì sao, sửa thế nào?", a: "cka-cp có taint `node-role.kubernetes.io/control-plane:NoSchedule`; Pod không tolerate nên không được xếp lên. Thêm toleration với key đó, `operator: Exists`, `effect: NoSchedule`." },
      { q: "`restartPolicy: OnFailure` và `Never` của Job khác nhau thế nào khi lệnh lỗi?", a: "OnFailure: kubelet chạy lại container trong cùng Pod (RESTARTS tăng). Never: Job controller tạo Pod mới cho mỗi lần thử, Pod lỗi ở lại với trạng thái Error để đọc log. Cả hai đều tính vào backoffLimit." },
      { q: "Vì sao không dùng `@Scheduled` trong order để báo cáo đơn hàng?", a: "Mỗi replica chạy lịch riêng: 2 replica là 2 lần. CronJob tách lịch khỏi số replica và có concurrencyPolicy chặn chạy chồng." },
      { q: "Kiểm một CronJob mà không chờ lịch thế nào?", a: "`k create job <tên> --from=cronjob/<cron>`: tạo Job từ jobTemplate của CronJob ngay lập tức." },
    ],
  },

  // ───────────────────────────── s16 ─────────────────────────────
  {
    id: "s16",
    stage: "st2",
    title: "Sự cố chặng 2: Pod không chạy",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s15"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa bốn workload hỏng bốn kiểu khác nhau của shop về Running/Succeeded trong 20 phút mà không biết trước lỗi gì.",
      "Đi đúng quy trình: trạng thái Pod → Events → log lần chạy trước → YAML thật đang chạy, rồi mới sửa — sửa ở tệp trong ~/shop/.",
      "Sửa trường bất biến của Pod bằng replace --force; thấy được ký tự trắng lạ trong YAML bằng vim và cat -A.",
    ],
    skills: [
      { skill: "k-logs-previous", level: "Thành phản xạ" },
      { skill: "k-events-sorted", level: "Gõ được không tra" },
      { skill: "k-pod-failure-reasons", level: "Nhận ra trong 30 giây" },
      { skill: "k-get-pod-yaml", level: "Gõ được không tra" },
      { skill: "k-replace-force", level: "Gõ được không tra" },
      { skill: "vim-show-whitespace", level: "Gõ được không tra" },
      { skill: "k-debug-container", level: "Gõ được có tra" },
    ],
    uses: ["k-describe-pod", "k-logs", "k-cm-envfrom-volume", "k-probes-yaml", "vim-move-jump"],
    foundation: {
      area: "vim",
      md: `**Thấy ký tự mà mắt không thấy.** YAML và biến môi trường hỏng vì những ký tự trông như dấu cách: tab (YAML cấm tab ở thụt lề), khoảng trắng cuối dòng, và **NBSP** (U+00A0, "dấu cách không ngắt") hay đi theo khi chép lệnh từ trang web, chat hay tài liệu Word. Với shell và JVM, NBSP không phải dấu cách: hai cờ nối bằng NBSP là **một** đối số.

**1. Trong vim.** Từ s02 bạn đã dùng \`:set list\` để thấy tab (\`^I\`) và \`:retab\`. Mặc định \`listchars\` chỉ có \`eol:$\` nên **NBSP không hiện gì**: phải khai thêm:

\`\`\`vim
:set list listchars=tab:>-,trail:~,nbsp:+,eol:$
\`\`\`

Tab thành \`>---\`, khoảng trắng cuối dòng thành \`~\`, NBSP thành \`+\`. Đứng trên một ký tự, \`ga\` in mã của nó (trên lab, với NBSP: \`< > 160, Hex 00a0, Oct 240, Digr NS\`). Tìm mọi NBSP: \`/\\%xa0\`; thay bằng dấu cách: \`:%s/\\%xa0/ /g\`. \`:set nolist\` để tắt.

**2. Ngoài vim.** \`cat -A tệp\` in tab là \`^I\`, cuối dòng là \`$\`, byte ngoài ASCII dạng \`M-…\` (NBSP, hai byte \`c2 a0\` trong UTF-8, hiện là \`M-BM- \`). \`grep -nP '\\xa0|\\t' tệp\` chỉ ra dòng. Với một biến môi trường trong container: \`printenv JAVA_OPTS | od -An -tx1\` in từng byte — NBSP trong UTF-8 là hai byte \`c2 a0\`.

**Bài tập nền (5 phút, trên cka-cp trước khi \`begin\`):** \`printf 'a:\\tb\\nc: d \\ne:\\xc2\\xa0f\\n' > /tmp/ws.yaml\`, mở bằng vim, bật \`list\` như trên và chỉ ra ba ký tự lạ; rồi \`cat -A /tmp/ws.yaml\`.`,
    },
    mindset: `**Pod không chạy có bốn chỗ để hỏng, và mỗi chỗ để lại dấu ở một nơi khác.** Trình tự một Pod đi qua: được xếp lên node → kubelet kéo image → kubelet dựng cấu hình container (env, volume, Secret/ConfigMap) → tiến trình chạy → probe. Hỏng ở bước nào, cột STATUS nói bước đó:

| STATUS | Hỏng ở | Dấu vết ở đâu |
|---|---|---|
| \`Pending\` (không node) | xếp lịch | Events: \`FailedScheduling\` (chặng 3) |
| \`ErrImagePull\` / \`ImagePullBackOff\` / \`ErrImageNeverPull\` | kéo image | Events: \`Failed to pull image …\` |
| \`CreateContainerConfigError\` | dựng cấu hình | Events: \`couldn't find key … in Secret …\`; \`logs\` trống vì tiến trình chưa từng chạy |
| \`CrashLoopBackOff\`, \`Error\` | tiến trình thoát | \`logs --previous\` (lần chạy vừa chết), \`lastState.terminated.exitCode\` |
| \`Running\` nhưng \`0/1\` | probe | Events: \`Readiness probe failed\` (s13) |

**Quy trình, không đoán** (giống s09, chỉ khác tầng):
1. **Trạng thái:** \`k -n shop get pod -o wide\` — Pod nào, STATUS gì, RESTARTS bao nhiêu, của ReplicaSet nào.
2. **Events:** \`k -n shop get events --sort-by=.metadata.creationTimestamp\` cho cả namespace (Event phát qua \`events.k8s.io\` có thể không có \`lastTimestamp\`), hoặc cuối \`describe pod\` cho một Pod.
3. **Log lần trước:** \`k logs <pod> --previous\` khi container đã chết ít nhất một lần; \`logs\` không có \`--previous\` là lần đang chạy (có thể còn trống).
4. **YAML đang chạy:** \`k get pod <pod> -o yaml\` / \`k get deploy <tên> -o yaml\` — so với thứ bạn *nghĩ* đã apply. Chỗ khác nhau là nghi phạm.

**Rolling update che lỗi.** Với \`maxUnavailable: 0\` (gateway) hay mặc định 25% làm tròn xuống (catalog 2, order 1 → 0), Pod mới hỏng không bao giờ Ready nên Pod cũ còn nguyên: shop vẫn trả lời, \`get deploy\` vẫn \`AVAILABLE\` đủ. Dấu hiệu là \`UP-TO-DATE\` thiếu và một ReplicaSet mới có Pod không Ready. Đo trên lab ngay sau sự cố: \`k -n shop get deploy\` ghi \`2/2   1   2\` (READY, UP-TO-DATE, AVAILABLE) cho catalog và gateway, \`1/1   1   1\` cho order: chỉ cột UP-TO-DATE và một Pod mới không Ready lộ ra lỗi. Đừng vì shop còn chạy mà bỏ qua: Deployment không tự rollback (\`ProgressDeadlineExceeded\` chỉ là một condition), lần scale lên hay HPA chia replica mới cả vào ReplicaSet hỏng, rollout kế tiếp chồng lên template hỏng, và \`k apply -f ~/shop/\` đưa lỗi trở lại.

**Sửa ở nguồn.** Sự cố hôm nay đến từ \`~/shop/*.yaml\` bị sửa rồi apply. Sửa bằng \`k edit\`/\`k set\` làm cluster lành nhưng lần \`k apply -f ~/shop/\` sau sẽ đưa lỗi trở lại. Sửa tệp, apply tệp. Pod lẻ thì nguồn là tệp của nó; trường bất biến (\`command\`, \`env\`, cổng…) chỉ đổi được bằng xoá và tạo lại: \`k replace --force -f\`.`,
    refs: [
      { label: "Bài lộ trình CKA: Debug application — CrashLoopBackOff, ImagePullBackOff…", href: "#/roadmap/cka/cka-w8-5" },
      { label: "Bài lộ trình CKA Study Guide: Xử lý sự cố Pod và container", href: "#/roadmap/ckabook/cb-w6-1" },
      { label: "Bài lộ trình CKAD: Logging — kubectl logs (--previous, -f)", href: "#/roadmap/ckad/w5-4" },
      { label: "Bài lộ trình CKAD: Debug workflow — describe → events → logs → exec", href: "#/roadmap/ckad/w5-5" },
      { label: "Bài lộ trình CKAD: Lỗi phổ biến — ImagePullBackOff, CrashLoopBackOff, Pending, OOMKilled", href: "#/roadmap/ckad/w5-7" },
      { label: "CKA Study Guide, chương 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "Thực hành nhanh: logs --previous, events --sort-by, replace --force, kubectl debug", href: "#/commands" },
      { label: "kubernetes.io: Debug Pods", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/" },
      { label: "kubernetes.io: Debug Running Pods (kubectl debug, --copy-to)", href: "https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/" },
      { label: "kubernetes.io: Determine the Reason for Pod Failure", href: "https://kubernetes.io/docs/tasks/debug/debug-application/determine-reason-pod-failure/" },
    ],
    stateIn: `Đầu ra s15 (gateway 2.0 ×2, catalog ×2, order ×1, có probe; log-agent, Job seed, CronJob order-report). Trên Mac chạy \`./labs/lab begin cka s16\`: lệnh kiểm đầu vào rồi **gây sự cố**: "một đồng nghiệp" sửa vài tệp trong \`~/shop/\` rồi apply, và tạo một Pod báo cáo lẻ \`report-once\` từ \`~/drills/s16/report-once.yaml\`. Ba tệp trong \`~/shop/\` được ghi lại bằng một công cụ YAML: comment và cách viết danh sách có thể đổi, nội dung vẫn là của bạn cộng chỗ bị sửa. Không nói đã làm gì. Bấm giờ 20 phút. Đừng đọc \`labs/cka/breaks/\` trước khi làm xong.`,
    stateOut: "Ba Deployment về đúng image và số replica cuối s15, cấu hình (envFrom, secretKeyRef, probe, preStop) nguyên vẹn, gateway không có JAVA_OPTS (như cuối s15); ~/shop/*.yaml khớp cluster; Pod report-once Succeeded; không Pod lỗi nào trong shop; ~/drills/s16/answers.env.",
    tasks: [
      { id: "t1", text: "Trạng thái: `k -n shop get pod -o wide`, `k -n shop get deploy,rs`. Ghi ra giấy từng Pod không Running/Ready: STATUS, RESTARTS, thuộc ReplicaSet nào. Shop còn trả lời không (`k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/info`)? Vì sao?" },
      { id: "t2", text: "Events: `k -n shop get events --sort-by=.metadata.creationTimestamp | tail -30`. Với mỗi Pod hỏng, tìm Event `Warning` của nó và xếp vào một hàng của bảng trong phần Tư duy." },
      { id: "t3", text: "Pod đã chết ít nhất một lần: `k -n shop logs <pod> --previous`. Đọc kỹ thông báo: nó nói về một cờ hay hai cờ? So với giá trị `JAVA_OPTS` trong `k -n shop get deploy gateway -o yaml`. Rồi `cat -A ~/shop/gateway.yaml | grep JAVA` và mở tệp bằng vim với `:set list listchars=nbsp:+,tab:>-,trail:~`. Xác nhận trong container: `k -n shop debug <pod hỏng> --copy-to=gw-debug --container=gateway -- sleep 600` rồi `k -n shop exec gw-debug -c gateway -- sh -c 'printenv JAVA_OPTS | od -An -tx1'`. Ghi `BAD_CHAR=<hai byte hex của ký tự lạ>`; thoát và xoá `gw-debug`." },
      { id: "t4", text: "YAML đang chạy: với mỗi Deployment hỏng, `k -n shop get deploy <tên> -o yaml` so với trạng thái cuối s15 (image, khoá Secret, biến môi trường; các ReplicaSet cũ trong `k -n shop get rs -o wide` giữ template cũ). Đưa cả ba về **đúng cấu hình cuối s15**: sửa **tệp** `~/shop/*.yaml` (gateway cuối s15 không có `JAVA_OPTS`: xoá hẳn biến đó), `k apply -f ~/shop/`, `k -n shop rollout status` từng Deployment." },
      { id: "t5", text: "Pod `report-once`: `k -n shop logs report-once`, `k -n shop get pod report-once -o jsonpath='{.status.containerStatuses[0].state.terminated.exitCode}'` — ghi `REPORT_EXIT_CODE=<mã>`. Thử sửa lệnh bằng `k -n shop edit pod report-once`: đọc lỗi. Sửa `~/drills/s16/report-once.yaml` rồi `k replace --force -f ~/drills/s16/report-once.yaml`; Pod phải `Completed`." },
      { id: "t6", text: "Dọn: `k -n shop get pod` không còn Pod nào Error/BackOff/ConfigError, không còn Pod lẻ nào ngoài `report-once`. Ghi thời gian bạn đã dùng. Trên Mac: `./labs/lab verify cka s16` phải đạt 8/8 (chạy lại bao nhiêu lần cũng được: verify không chờ rollout đang kẹt)." },
    ],
    hints: [
      "Bốn Pod hỏng, bốn STATUS khác nhau: đừng sửa theo thói quen. Mỗi STATUS chỉ thẳng tới một hàng trong bảng của phần Tư duy.",
      "`CreateContainerConfigError`: container chưa từng chạy nên `logs` trống. Event nói đúng khoá nào thiếu ở Secret nào; so với `k -n shop get secret db-cred -o jsonpath='{.data}'`. Sửa tham chiếu, đừng thêm khoá vào Secret.",
      "Thông báo JVM liệt kê **một** cờ chứa cả hai cờ? Shell chỉ tách đối số ở dấu cách thật, tab và xuống dòng. Ký tự ở giữa trông như dấu cách nhưng không phải.",
      "`k logs <pod>` của container CrashLoopBackOff có thể trống (lần chạy mới chưa in gì): luôn thử `--previous`.",
      "Tag image sai: so với tag có trên node (`ssh cka-w1 sudo crictl images | grep shop`) hoặc với các ReplicaSet cũ (`k -n shop get rs -o wide`).",
      "Pod `Failed` với `restartPolicy: Never` không bao giờ chạy lại, kể cả khi bạn sửa được spec. `replace --force` xoá và tạo lại từ tệp trong một lệnh.",
    ],
    solution: `Quy trình dưới đây là cách tìm ra lỗi, không chỉ lệnh sửa. Output là của máy soạn bài; tên Pod, IP và thời điểm sẽ khác.

**Bước 1 — Trạng thái** (cka-cp, ngay sau \`begin\`)

\`\`\`bash
k -n shop get pod -o wide
# catalog-7f7777db66-kq8hm    1/1   Running                      0             7m11s   …   cka-w1
# catalog-868b46c98f-s9mn2    0/1   ErrImagePull                 0             62s     …   cka-w2
# gateway-555896c66b-459pb    1/1   Running                      0             2m31s   …   cka-w2
# gateway-c4bcd47b4-4fxpm     0/1   CrashLoopBackOff             3 (27s ago)   61s     …   cka-w1
# order-5c99488f5c-7lnsz      0/1   CreateContainerConfigError   0             61s     …   cka-w2
# order-6656b7cb49-7z4tp      1/1   Running                      0             9m35s   …   cka-w1
# report-once                 0/1   Error                        0             61s     …   cka-w2
# … log-agent, seed, order-report-manual: Running / Completed
k -n shop get deploy
# NAME      READY   UP-TO-DATE   AVAILABLE   AGE
# catalog   2/2     1            2           11m
# gateway   2/2     1            2           11m
# order     1/1     1            1           11m
\`\`\`

Ba Deployment đều có một Pod mới hỏng (tên ReplicaSet khác Pod cũ) bên cạnh Pod cũ còn chạy: rollout kẹt, shop vẫn trả lời. Bốn STATUS khác nhau là bốn chỗ hỏng khác nhau.

**Bước 2 — Events**

\`\`\`bash
k -n shop get events --field-selector type=Warning --sort-by=.metadata.creationTimestamp | tail -8
#   Warning   Failed    pod/order-5c99488f5c-7lnsz     Error: couldn't find key DB_PASS in Secret shop/db-cred
#   Warning   Failed    pod/catalog-868b46c98f-s9mn2   Failed to pull image "shop/catalog:1.1": failed to pull and unpack image "docker.io/shop/catalog:1.1": failed to resolve image: pull access denied, repository does not exist or may require authorization …
#   Warning   Failed    pod/catalog-868b46c98f-s9mn2   Error: ErrImagePull
#   Warning   Failed    pod/catalog-868b46c98f-s9mn2   Error: ImagePullBackOff
#   Warning   BackOff   pod/gateway-c4bcd47b4-4fxpm    Back-off restarting failed container gateway in pod gateway-c4bcd47b4-4fxpm_shop(…)
\`\`\`

catalog: tag \`1.1\` không có (các ReplicaSet cũ đều \`1.0\`: \`k -n shop get rs -l app=catalog -o wide\`). order: tham chiếu khoá \`DB_PASS\`, Secret chỉ có \`DB_PASSWORD\` và \`DB_USER\`. gateway: Event chỉ nói container chết, phải đọc log.

**Bước 3 — Log lần trước (gateway)**

\`\`\`bash
k -n shop logs gateway-c4bcd47b4-4fxpm --previous
# Defaulted container "gateway" out of: gateway, wait-catalog (init)
# Unrecognized VM option 'UseSerialGC -XX:MaxRAMPercentage=60'
# Error: Could not create the Java Virtual Machine.
# Error: A fatal exception has occurred. Program will exit.
k -n shop get pod gateway-c4bcd47b4-4fxpm -o jsonpath='{.status.containerStatuses[0].lastState.terminated.exitCode}'; echo   # 1
\`\`\`

JVM thấy **một** cờ tên \`UseSerialGC -XX:MaxRAMPercentage=60\`: ký tự ở giữa không phải dấu cách mà \`sh\` tách đối số. Nhìn byte:

\`\`\`bash
k -n shop get deploy gateway -o jsonpath='{..env[?(@.name=="JAVA_OPTS")].value}' | od -c | head -2
# 0000000   -   X   X   :   +   U   s   e   S   e   r   i   a   l   G   C
# 0000020 302 240   -   X   X   :   M   a   x   R   A   M   P   e   r   c
cat -A ~/shop/gateway.yaml | grep -A1 JAVA_OPTS
#         - name: JAVA_OPTS$
#           value: -XX:+UseSerialGCM-BM- -XX:MaxRAMPercentage=60$
\`\`\`

\`302 240\` (bát phân) = \`c2 a0\` (hex) = NBSP trong UTF-8; \`cat -A\` in nó là \`M-BM- \`. \`-o json\` in NBSP nguyên dạng (không thoát thành \`\\u00a0\`), trông y như dấu cách. Trong vim (\`:set list listchars=nbsp:+\`, đứng trên ký tự, \`ga\`): \`< > 160, Hex 00a0, Oct 240, Digr NS\`. Kiểm từ trong container, bằng một bản sao của Pod hỏng chạy lệnh khác thay JVM:

\`\`\`bash
k -n shop debug gateway-c4bcd47b4-4fxpm --copy-to=gw-debug --container=gateway -- sleep 600
k -n shop exec gw-debug -c gateway -- sh -c 'printenv JAVA_OPTS | od -An -tx1'
#  2d 58 58 3a 2b 55 73 65 53 65 72 69 61 6c 47 43
#  c2 a0 2d 58 58 3a 4d 61 78 52 41 4d 50 65 72 63
#  65 6e 74 61 67 65 3d 36 30 0a
k -n shop get pod gw-debug --show-labels        # LABELS <none>: bản sao không lọt vào Service
k -n shop delete pod gw-debug $now
printf 'BAD_CHAR=c2a0\n' >> ~/drills/s16/answers.env
\`\`\`

Bản sao giữ \`restartPolicy: Always\`: lệnh ngắn (\`sh -c '…'\`) thoát là kubelet chạy lại nó, nên dùng \`sleep\` rồi \`exec\`.

**Bước 4 — YAML đang chạy và sửa ở nguồn**

\`\`\`bash
k -n shop get deploy catalog -o jsonpath='{.spec.template.spec.containers[0].image}'; echo     # shop/catalog:1.1
k -n shop get deploy order -o yaml | grep -B2 -A3 secretKeyRef
vim ~/shop/catalog.yaml       # image: shop/catalog:1.0
vim ~/shop/order.yaml         # key: DB_PASSWORD
vim ~/shop/gateway.yaml       # xoá hẳn khối env JAVA_OPTS: cuối s15 gateway không có biến này
k apply -f ~/shop/
for d in catalog order gateway; do k -n shop rollout status deploy/$d; done
\`\`\`

"Đồng nghiệp" đã ghi lại tệp bằng một công cụ YAML nên comment và cách viết danh sách trong tệp của bạn có thể đổi; nội dung thì vẫn là của bạn cộng ba chỗ sửa. Đừng sửa order bằng cách thêm khoá \`DB_PASS\` vào Secret: chữa triệu chứng, để lại tham chiếu sai.

**Bước 5 — Pod lẻ report-once**

\`\`\`bash
k -n shop logs report-once
# wget: server returned error: HTTP/1.1 404
k -n shop get pod report-once -o jsonpath='{.status.containerStatuses[0].state.terminated.exitCode} {.status.phase}'; echo   # 1 Failed
echo REPORT_EXIT_CODE=1 >> ~/drills/s16/answers.env
k -n shop edit pod report-once         # sửa /api/oders → /api/orders, lưu
# error: pods "report-once" is invalid
# A copy of your changes has been stored to "/tmp/kubectl-edit-3359457661.yaml"
# error: Edit cancelled, no valid changes were saved.
sed -i 's|/api/oders|/api/orders|' ~/drills/s16/report-once.yaml
k replace --force -f ~/drills/s16/report-once.yaml
k -n shop get pod report-once            # Completed
\`\`\`

\`command\` là trường bất biến của Pod; Pod \`Never\` đã \`Failed\` cũng không bao giờ chạy lại. \`replace --force\` xoá và tạo lại từ tệp trong một lệnh (tệp \`/tmp/kubectl-edit-….yaml\` mà \`edit\` để lại cũng dùng được).

**Bước 6 — Xác nhận**

\`\`\`bash
k -n shop get pod          # không còn ErrImagePull, CrashLoopBackOff, CreateContainerConfigError, Error
\`\`\`

Rồi \`./labs/lab verify cka s16\`. Lời giải tự động \`labs/cka/sessions/s16/apply.sh\` chạy chính kịch bản gây lỗi rồi áp đúng các cách sửa này.`,
    exam: {
      patterns: [
        "\"Pod X không chạy, tìm nguyên nhân và sửa\" — STATUS → Events → `logs --previous` → `get -o yaml`.",
        "\"Ghi log của container đã chết vào /opt/…\" — `k logs <pod> -c <container> --previous > /opt/…`.",
        "\"Liệt kê Events của namespace theo thời gian vào tệp\" — `k get events -n <ns> --sort-by=.metadata.creationTimestamp > …`.",
        "\"Sửa lệnh/cổng/env của một Pod đang chạy\" — `get -o yaml > f`, sửa, `replace --force -f f`.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 3 phút: gắn một container gỡ lỗi `busybox:1.37` vào một Pod catalog đang chạy (không tạo bản sao) và từ đó gọi `wget -qO- localhost:8080/actuator/health`.",
          timeLimitMin: 3,
          solution: "```bash\nk -n shop debug -it <pod catalog> --image=busybox:1.37 --target=catalog -- sh\n# trong shell của container gỡ lỗi:\nwget -qO- localhost:8080/actuator/health\n```\nEphemeral container dùng chung network namespace với Pod (nên `localhost:8080` là catalog) và `--target` cho thấy cả tiến trình của container đích. Nó không xoá được: chỉ mất khi Pod bị thay.",
        },
        {
          text: "Trong 2 phút: in 10 Event mới nhất loại Warning trong namespace `shop`.",
          timeLimitMin: 2,
          solution: "```bash\nk -n shop get events --field-selector type=Warning --sort-by=.metadata.creationTimestamp | tail -10\n```",
        },
      ],
    },
    tips: [
      "Thứ tự cố định: `get pod` → `get events --sort-by` → `logs --previous` → `get -o yaml`. Bốn lệnh, chưa sửa gì.",
      "Exit code: 1 hay 2 thường là app tự báo lỗi, 127 lệnh không tìm thấy, 137 bị SIGKILL (OOM hoặc hết grace), 143 SIGTERM.",
      "`--copy-to` của `kubectl debug` tạo một Pod lẻ mới: nhớ xoá sau khi xong.",
      "Chép lệnh từ web vào YAML: bật `:set list` có `nbsp` trước khi lưu.",
    ],
    outcome: {
      md: `Shop về đúng trạng thái cuối s15 sau sự cố đầu tiên ở tầng workload, và \`~/shop/\` lại là nguồn sự thật. Trên Mac:

\`\`\`bash
./labs/lab verify cka s16
\`\`\`

Verify so ba Deployment với trạng thái cuối s15 (image, replica, cấu hình), đòi gateway không có \`JAVA_OPTS\`, so tệp trong \`~/shop/\` với cluster, đọc lệnh và trạng thái của \`report-once\`, rồi quét mọi Pod của \`shop\`. Chặng 2 xong: mốc \`st2-done\`.`,
      verifyOutput: "lab: kiểm s16\n  (chờ apiserver và các Pod đang khởi động, nếu có)\n  ✓ gateway: shop/gateway:2.0, 2/2/2, rollout xong, EndpointSlice 2/2; envFrom, volume, probe, preStop nguyên; ~/shop/gateway.yaml khớp\n  ✓ catalog: shop/catalog:1.0, 2/2/2, rollout xong, EndpointSlice 2/2; secretKeyRef, probe, preStop nguyên; ~/shop/catalog.yaml khớp\n  ✓ order: shop/order:1.0, 1/1/1, rollout xong, EndpointSlice 1/1; secretKeyRef, probe, preStop nguyên; ~/shop/order.yaml khớp\n  ✓ gateway: không có JAVA_OPTS (như cuối s15)\n  ✓ Pod report-once: image busybox:1.37 (như CronJob order-report), gọi /api/orders, Succeeded\n  ✓ namespace shop: không Pod nào Failed, chờ vì lỗi, hay là Pod lẻ ngoài report-once\n  ✓ answers.env: REPORT_EXIT_CODE=1 (mã thoát của report-once trước khi sửa)\n  ✓ answers.env: BAD_CHAR=c2a0 (hai byte của ký tự lạ trong JAVA_OPTS)\n  → 8/8 đạt",
      projectDelta: "shop đã qua sự cố đầu tiên ở tầng workload và có quy trình chẩn đoán Pod để dùng lại. Chặng 2 xong (mốc `st2-done`): chặng 3 bắt đầu đặt requests/limits và lập lịch.",
    },
    review: [
      { q: "Bốn bước chẩn đoán một Pod không chạy là gì?", a: "`get pod` (STATUS, RESTARTS) → Events (`get events --sort-by=.metadata.creationTimestamp` hoặc `describe`) → `logs --previous` → `get … -o yaml` so với thứ bạn nghĩ đã apply." },
      { q: "`CreateContainerConfigError` và `CrashLoopBackOff` khác nhau ở đâu, đọc lý do ở đâu?", a: "ConfigError: kubelet không dựng được cấu hình (thiếu Secret/ConfigMap/khoá), tiến trình chưa chạy — đọc Events. CrashLoopBackOff: tiến trình chạy rồi thoát, kubelet lùi dần trước lần chạy sau — đọc `logs --previous` và exitCode." },
      { q: "Rollout hỏng nhưng shop vẫn trả lời. Vì sao, và vì sao vẫn phải sửa ngay?", a: "Pod mới không Ready nên Pod cũ không bị xoá (maxUnavailable 0). Khởi động lại node chỉ chạy lại cùng các Pod, Pod cũ bị xoá thì ReplicaSet cũ tạo lại bản lành; nguy hiểm nằm ở chỗ khác: Deployment không tự rollback (`ProgressDeadlineExceeded` chỉ là một condition), scale lên hay HPA chia replica mới cả vào ReplicaSet hỏng, rollout kế tiếp chồng lên template hỏng, và `k apply -f ~/shop/` đưa lỗi trở lại." },
      { q: "Vì sao không sửa lệnh của Pod `report-once` bằng `kubectl edit`?", a: "`command` là trường bất biến của Pod: API từ chối. Phải xoá và tạo lại, `replace --force -f` làm cả hai trong một lệnh từ tệp." },
      { q: "JVM báo một cờ lạ trông giống hai cờ đúng nối nhau. Kiểm thế nào?", a: "Có ký tự không phải dấu cách thật (thường NBSP U+00A0) giữa hai cờ. `cat -A`, vim `:set list listchars=nbsp:+`, hoặc `printenv … | od -An -tx1` trong container (thấy `c2 a0`)." },
    ],
  },
];
