// Chặng 2 — Workload: chạy ba service shop.
// s10–s12 đã phát hành; script lab ở labs/cka/sessions/s10…s12 (đã chạy thật trên VM Multipass: Kubernetes 1.36.6,
// image shop 1.0, H2 trong bộ nhớ). outcome.verifyOutput chép từ output thật của `./labs/lab verify cka sNN`
// (node, IP, tên ReplicaSet trên máy bạn sẽ khác). Các buổi còn lại là buổi khung: đủ trường cấu trúc (check-data PR7).

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
      verifyOutput: "lab: kiểm s10\n  (chờ apiserver và Pod catalog trả lời, tối đa khoảng 8 phút nếu Pod đang khởi động)\n  ✓ Pod catalog (default) Running và Ready\n  ✓ Pod catalog chạy image shop/catalog:1.0\n  ✓ Pod catalog có nhãn app=catalog\n  ✓ Pod catalog khai containerPort 8080\n  ✓ ~/drills/s10/pod.yaml qua apply --dry-run=server, mô tả Pod/catalog/default\n  ✓ /actuator/health của Pod catalog trả UP (qua apiserver proxy)\n  ✓ answers.env: NODE=cka-w2\n  ✓ answers.env: POD_IP=10.244.62.131\n  ✓ answers.env: RUN_UID=10001 (kubectl exec … id -u)\n  ✓ answers.env: LOG_DB_USER=SA (user trong dòng 'Added connection' của k logs)\n  ✓ answers.env: PRODUCTS=3 (số sản phẩm của /products, gọi qua port-forward)\n  ✓ answers.env: BAD_REASON là lý do chờ của Pod tag sai (ErrImagePull hoặc ImagePullBackOff)\n  → 12/12 đạt",
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

  // ───────────────────────────── s13 (khung) ─────────────────────────────
  {
    id: "s13",
    stage: "st2",
    title: "Probe, vòng đời Pod và graceful shutdown",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-selfheal"],
    requires: ["s12"],
    status: "skeleton",
    pieces: ["probes"],
    goals: [
      "Gắn liveness, readiness, startup probe vào ba service theo endpoint Actuator tương ứng.",
      "Chứng minh readiness hỏng thì Pod bị rút khỏi Service mà không bị restart, liveness hỏng thì bị restart.",
      "Cấu hình preStop và terminationGracePeriodSeconds để Pod dừng không rớt request.",
    ],
    skills: [
      { skill: "k-probes-yaml", level: "Viết được không tra" },
      { skill: "k-actuator-probes", level: "Giải thích được" },
      { skill: "k-pod-lifecycle", level: "Giải thích được" },
      { skill: "k-graceful-shutdown", level: "Giải thích được" },
      { skill: "k-explain", level: "Thành phản xạ" },
      { skill: "k-init-container", level: "Viết được có tra" },
    ],
    uses: ["k-describe-pod", "k-labels-selectors", "k-port-forward", "vim-paste-mode", "lx-ps-proc"],
    stateIn: "Đầu ra s12: ba service chạy, cấu hình từ ConfigMap/Secret, chưa có probe.",
    stateOut: "Ba Deployment có đủ ba probe trỏ vào Actuator và graceful shutdown; endpoints chỉ chứa Pod Ready.",
  },
  {
    id: "s14",
    stage: "st2",
    title: "Rolling update và rollback từ v1 lên v2",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-deploy-rollout"],
    requires: ["s13"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Nâng gateway từ 1.0 lên 2.0 bằng set image, theo dõi bằng rollout status, ghi change-cause cho từng revision.",
      "Chọn maxSurge/maxUnavailable để rollout không rớt request trong khi một vòng curl chạy liên tục.",
      "Rollback về đúng revision chỉ định khi bản mới hỏng.",
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
    stateIn: "Đầu ra s13: ba service bản 1.0 có probe.",
    stateOut: "gateway đang chạy 2.0 qua rollout không lỗi; lịch sử revision có change-cause; đã thử rollback và roll lại lên 2.0.",
  },
  {
    id: "s15",
    stage: "st2",
    title: "DaemonSet, Job và CronJob",
    durationMin: 75,
    domain: "workloads",
    competencies: ["wl-selfheal"],
    requires: ["s14"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Chạy một DaemonSet thu log trên mọi node, kể cả control plane bằng toleration.",
      "Chạy Job nạp dữ liệu mẫu cho catalog với completions/backoffLimit, và CronJob báo cáo đơn hàng mỗi 5 phút.",
      "Chạy CronJob ngay lập tức bằng create job --from để kiểm mà không chờ lịch.",
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
    stateIn: "Đầu ra s14.",
    stateOut: "DaemonSet log-agent có một Pod trên mỗi node; Job seed Complete; CronJob order-report đã chạy thành công ít nhất một lần.",
  },
  {
    id: "s16",
    stage: "st2",
    title: "Sự cố chặng 2: Pod không chạy",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s15"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Đưa ba Pod hỏng ba kiểu khác nhau về Running trong 20 phút.",
      "Đọc đúng chỗ: trạng thái Pod, Events, log lần chạy trước, YAML thật đang chạy.",
      "Sửa trường bất biến của Pod bằng replace --force thay vì xoá tay rồi tạo lại.",
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
    stateIn: "Đầu ra s15 cộng `./labs/lab break`: một số Pod của shop rơi vào ImagePullBackOff, CrashLoopBackOff, CreateContainerConfigError.",
    stateOut: "Mọi Pod của shop Running và Ready, cấu hình đúng như cuối s15.",
  },
];
