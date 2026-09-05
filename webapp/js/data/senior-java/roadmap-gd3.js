// Lộ trình Senior Java — Giai đoạn 3: Kubernetes, AWS & Terraform (tháng 12–18).
//
// Nguồn: sources/senior-java/03-giai-doan-3-k8s-cloud.md (tài liệu sj-03).
// Mỗi mục là MỘT BƯỚC trong "Cách thực hiện" của tuần tương ứng.
//
// GIỮ NGUYÊN id (sj-gd3-w<N> / sj-gd3-w<N>-<M>) — tiến độ localStorage lưu
// theo id này. Khối cuối `sj-gd3-done` là cổng nghiệm thu giai đoạn, nhận
// badge "✓" thay cho số tuần.
//
// Tuần 7–8 trong nguồn có 1 bước đánh số chứa 6 gạch đầu dòng con (lab
// "break & fix" 6 hỏng hóc) — GIỮ NGUYÊN thành 1 mục duy nhất, không tách,
// theo đúng quy tắc "một bước đánh số = một mục" của Task 2/3.
//
// Tuần 21–24 có hai nhánh song song trong nguồn — "Cách thực hiện (CKA)" và
// "Cách thực hiện (SAA)", mỗi nhánh 3 bước — giữ cả 6 thành 6 mục, `text`
// mở đầu bằng "CKA — " hoặc "SAA — " để người học chọn nhánh của mình. Tuần
// này không có "Mục tiêu:" trong nguồn nên `goal` viết từ tiêu đề mục.
//
// KHÔNG cross-link sang lĩnh vực "kubernetes": mọi link #/docs/<id> trong
// file này chỉ trỏ tới sj-00…sj-04 (bất biến #3b trong check-data.mjs).
//
// Tuần 25–26 trong nguồn không có "Mục tiêu:" lẫn "Hoàn thành khi:" — `goal`
// được viết lại từ tiêu đề mục, `doneWhen` bị bỏ qua (không bịa).

export const seniorJavaGd3 = [
  {
    id: "sj-gd3-w1",
    week: "Tuần 1–2",
    title: "Kiến trúc & workload cơ bản",
    goal: "Deploy được app của mình lên cluster local, thao tác kubectl phản xạ.",
    doneWhen: "App 2 replicas chạy trên kind; rollout + undo thành thạo; tạo được deployment/service YAML bằng dry-run trong < 1 phút.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w1-1",
        text: "Học kiến trúc control plane vs worker, vẽ tay sơ đồ 'ai gọi ai khi kubectl apply'",
        lesson: `**Việc cần làm.** Học kiến trúc (2 buổi qua khóa CKA section đầu): control plane (api-server, etcd, scheduler, controller-manager) vs worker (kubelet, kube-proxy). Vẽ tay sơ đồ, chú thích "ai gọi ai khi tôi gõ kubectl apply".

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-2",
        text: "Tạo cluster local bằng kind, config extraPortMappings port 80/443 cho Ingress tuần sau",
        lesson: `**Việc cần làm.** Tạo cluster local: \`kind create cluster --config kind.yaml\` (config có \`extraPortMappings\` port 80/443 để tuần sau làm Ingress — lấy mẫu trong docs kind phần ingress).

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-3",
        text: "Deploy app giai đoạn 2 lên kind: viết deployment.yaml 2 replicas bằng mẹo dry-run",
        lesson: `**Việc cần làm.** Deploy app của giai đoạn 2: viết \`deployment.yaml\` (image từ ghcr, replicas 2) + apply. Mẹo tạo YAML nhanh (kỹ năng thi CKA): \`kubectl create deployment app --image=... --dry-run=client -o yaml > deployment.yaml\` rồi sửa, không gõ chay từ đầu.

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-4",
        text: "Luyện bộ lệnh kubectl phản xạ 15 phút/ngày, xem ReplicaSet tự tạo lại pod",
        lesson: `**Việc cần làm.** Luyện bộ lệnh phản xạ mỗi ngày 15 phút: \`kubectl get pods -o wide\`, \`describe pod\`, \`logs -f\`, \`exec -it -- sh\`, \`scale --replicas=3\`, \`delete pod\` (xem ReplicaSet tự tạo lại — self-healing tận mắt).

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-5",
        text: "Thực hành rolling update: set image, rollout status, rollout undo",
        lesson: `**Việc cần làm.** Rolling update: đổi tag image → \`kubectl set image deployment/app app=<image:tag-mới>\` → \`kubectl rollout status\` xem pod thay dần → \`kubectl rollout undo\` quay lại. Ghi chú: điều kiện để rolling không gây downtime là readiness probe đúng (làm tuần 5–6 — ghi TODO).

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-6",
        text: "Cài k9s để xem trực quan song song, nhưng thao tác chính vẫn bằng kubectl",
        lesson: `**Việc cần làm.** Cài k9s dùng song song để xem trực quan, nhưng thao tác chính vẫn bằng kubectl (thi CKA không có k9s).

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w1-7",
        text: "Set alias k=kubectl và $do dùng suốt giai đoạn và khi đi thi",
        lesson: `**Việc cần làm.** Set alias ngay từ giờ (dùng suốt giai đoạn + đi thi): \`alias k=kubectl\`, \`export do="--dry-run=client -o yaml"\`.

**Nguồn.** [Giai đoạn 3 — Tuần 1–2](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w2",
    week: "Tuần 3–4",
    title: "Networking trong K8s",
    goal: "Hiểu request đi từ ngoài vào Pod qua chặng nào.",
    doneWhen: "Vẽ được đường đi request từ trí nhớ; 2 app route theo path chạy được; giải thích được Service ≠ load balancer vật lý.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w2-1",
        text: "Lab 3 loại Service: ClusterIP với DNS nội bộ, NodePort, hiểu LoadBalancer",
        lesson: `**Việc cần làm.** Học 3 loại Service qua lab tuần tự: tạo ClusterIP cho app → từ 1 pod tạm (\`kubectl run tmp --image=busybox -it --rm -- sh\`) \`wget -qO- http://app-service\` để thấy DNS nội bộ (\`<service>.<namespace>.svc.cluster.local\`) hoạt động. Đổi sang NodePort → curl từ máy host. Hiểu LoadBalancer là gì (trên cloud mới có thật).

**Nguồn.** [Giai đoạn 3 — Tuần 3–4](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w2-2",
        text: "Cài ingress-nginx cho kind, viết Ingress rule host app.localtest.me",
        lesson: `**Việc cần làm.** Cài ingress-nginx cho kind (manifest chính thức trong docs kind). Viết Ingress resource: rule host \`app.localtest.me\` (domain này tự trỏ 127.0.0.1, khỏi sửa /etc/hosts) → service app. Curl kiểm chứng.

**Nguồn.** [Giai đoạn 3 — Tuần 3–4](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w2-3",
        text: "Lab 2 service sau 1 Ingress, route theo path /api và /echo",
        lesson: `**Việc cần làm.** Lab 2 service sau 1 Ingress: deploy thêm 1 app echo bất kỳ, route theo path \`/api\` và \`/echo\`. Đây là mô hình thật của mọi cụm production.

**Nguồn.** [Giai đoạn 3 — Tuần 3–4](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w2-4",
        text: "Ghi chú Feynman truy vết request: browser → ingress → Service → Endpoints → Pod",
        lesson: `**Việc cần làm.** Truy vết 1 request và viết ghi chú Feynman: browser → port máy → ingress controller pod → Service → Endpoints → Pod. Dùng \`kubectl get endpoints app-service\` để thấy Service thực chất chỉ là danh sách IP pod.

**Nguồn.** [Giai đoạn 3 — Tuần 3–4](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w3",
    week: "Tuần 5–6",
    title: "Config, Secret, probe & JVM trong container",
    goal: "App Spring Boot cấu hình ĐÚNG chuẩn production trên K8s — phần giá trị nhất tháng.",
    doneWhen: "App có đủ 3 probe hoạt động kiểm chứng được; tự gây và giải thích được OOMKilled; nêu được vì sao MaxRAMPercentage hơn Xmx cứng trên K8s.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w3-1",
        text: "Tách config ra ConfigMap/Secret, tự kiểm chứng Secret chỉ base64 không mã hóa",
        lesson: `**Việc cần làm.** ConfigMap/Secret: tách config app ra ConfigMap (inject qua \`envFrom\`), password DB vào Secret. Tự kiểm chứng giới hạn của Secret: \`kubectl get secret db -o jsonpath='{.data.password}' | base64 -d\` → chỉ là base64, không phải mã hóa → hiểu vì sao production cần RBAC chặt hoặc external secret manager.

**Nguồn.** [Giai đoạn 3 — Tuần 5–6](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w3-2",
        text: "Khai báo liveness/readiness/startup probe trỏ đúng path Actuator health",
        lesson: `**Việc cần làm.** Probe đúng cho Spring Boot: bật \`management.endpoint.health.probes.enabled=true\` (Boot tự bật khi chạy trên K8s) → có \`/actuator/health/liveness\` và \`/readiness\`. Khai báo trong deployment: livenessProbe + readinessProbe trỏ đúng 2 path đó, thêm startupProbe cho app khởi động chậm. Hiểu vai trò từng cái: startup bảo vệ lúc khởi động, readiness quyết định nhận traffic, liveness quyết định restart.

**Nguồn.** [Giai đoạn 3 — Tuần 5–6](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w3-3",
        text: "Ép readiness và liveness DOWN bằng AvailabilityChangeEvent để phân biệt hai probe",
        lesson: `**Việc cần làm.** Kiểm chứng probe: thêm endpoint admin ép readiness DOWN (Boot có \`AvailabilityChangeEvent\`) → pod bị rút khỏi Endpoints (không nhận traffic) nhưng KHÔNG restart. Ép liveness DOWN → pod restart. Trải nghiệm này giúp không bao giờ nhầm 2 probe.

**Nguồn.** [Giai đoạn 3 — Tuần 5–6](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w3-4",
        text: "Đặt requests/limits container và dùng MaxRAMPercentage=75.0 thay Xmx cứng",
        lesson: `**Việc cần làm.** Resources + JVM (kiến thức ăn tiền phỏng vấn): đặt \`resources.requests\` (cpu 250m, memory 512Mi) và \`limits\` (memory 768Mi). JVM flag dùng \`-XX:MaxRAMPercentage=75.0\` thay vì Xmx cứng — JVM tự tính theo limit của container.

**Nguồn.** [Giai đoạn 3 — Tuần 5–6](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w3-5",
        text: "Lab OOMKilled chủ động: hạ limit 256Mi, đọc Exit Code 137, ghi chú Feynman",
        lesson: `**Việc cần làm.** Lab OOMKilled chủ động: hạ memory limit xuống 256Mi, bắn tải/gọi endpoint ăn heap → pod chết. Đọc \`kubectl describe pod\`: \`Last State: Terminated, Reason: OOMKilled, Exit Code: 137\`. Giải thích được chuỗi: heap + metaspace + thread stack + native > limit → kernel kill. Ghi chú Feynman "OOMKilled vs OutOfMemoryError — hai thứ khác nhau thế nào".

**Nguồn.** [Giai đoạn 3 — Tuần 5–6](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w4",
    week: "Tuần 7–8",
    title: "Storage, scheduling & debug",
    goal: "Debug pod lỗi thành phản xạ — kỹ năng sống còn của CKA và của nghề.",
    doneWhen: "6/6 ca tự chẩn đoán không cần Google; nói được khi nào cần StatefulSet thay Deployment.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w4-1",
        text: "Học nhanh PV/PVC/StorageClass, StatefulSet, DaemonSet, taint/toleration, nodeAffinity",
        lesson: `**Việc cần làm.** Học nhanh qua khóa CKA: PV/PVC/StorageClass (lab gắn PVC cho postgres trên kind), StatefulSet (hiểu khái niệm + khi nào cần, không cần sâu), DaemonSet, taint/toleration, nodeAffinity (lab đơn giản mỗi loại 1 lần theo khóa học).

**Nguồn.** [Giai đoạn 3 — Tuần 7–8](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w4-2",
        text: "Lab break & fix: tự tạo và tự chữa 6 hỏng hóc pod phổ biến, ghi bảng chẩn đoán",
        lesson: `**Việc cần làm.** Lab "break & fix" — tự tạo 6 hỏng hóc rồi tự chữa, mỗi cái ghi 3 dòng vào bảng chẩn đoán:
- Image sai tên → \`ImagePullBackOff\` (describe thấy pull error)
- App crash ngay khi start (sai biến env DB) → \`CrashLoopBackOff\` (xem \`logs --previous\`)
- envFrom trỏ ConfigMap không tồn tại → \`CreateContainerConfigError\`
- requests memory 10Gi → \`Pending\` (describe: Insufficient memory)
- readiness sai path → pod Running nhưng không vào Endpoints, service không có traffic
- liveness sai path → pod restart liên tục dù app khỏe

**Nguồn.** [Giai đoạn 3 — Tuần 7–8](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w4-3",
        text: "Đúc bảng chẩn đoán 1 trang: triệu chứng → lệnh kiểm tra → nguyên nhân",
        lesson: `**Việc cần làm.** Đúc bảng chẩn đoán 1 trang: TRIỆU CHỨNG → LỆNH KIỂM TRA (\`describe\` đọc Events, \`logs --previous\`, \`get endpoints\`) → NGUYÊN NHÂN THƯỜNG GẶP. In ra dán bàn làm việc.

**Nguồn.** [Giai đoạn 3 — Tuần 7–8](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w5",
    week: "Tuần 9–10",
    title: "Helm chart tự viết",
    goal: "Đóng gói app thành chart tham số hóa, có values riêng từng môi trường.",
    doneWhen: "Cùng 1 chart cài ra staging và production khác cấu hình; helm lint sạch; rollback bằng Helm đã thử.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w5-1",
        text: "Mổ xẻ helm create demo, đọc từng file sinh ra rồi xóa phần thừa",
        lesson: `**Việc cần làm.** Học cấu trúc bằng cách mổ xẻ: \`helm create demo\` → đọc từng file sinh ra (Chart.yaml, values.yaml, templates/, _helpers.tpl) → xóa phần thừa.

**Nguồn.** [Giai đoạn 3 — Tuần 9–10](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w5-2",
        text: "Tự viết chart: deployment/service/ingress/configmap/hpa tham số hóa qua values",
        lesson: `**Việc cần làm.** Viết chart cho app của bạn (không copy nguyên mẫu): templates gồm deployment, service, ingress, configmap, hpa. Tham số hóa qua values: image.repository/tag, replicaCount, resources, ingress.host, env. Dùng \`{{ .Values.x }}\`, \`{{ include "app.fullname" . }}\`; điều kiện \`{{- if .Values.ingress.enabled }}\`.

**Nguồn.** [Giai đoạn 3 — Tuần 9–10](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w5-3",
        text: "Kiểm tra bằng helm template và helm lint đến khi ra đúng YAML tháng trước",
        lesson: `**Việc cần làm.** Kỹ thuật kiểm tra không cần cài: \`helm template .\` xem YAML sinh ra; \`helm lint .\` bắt lỗi. Sửa đến khi template ra đúng YAML đã chạy tốt ở tháng trước.

**Nguồn.** [Giai đoạn 3 — Tuần 9–10](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w5-4",
        text: "Tách values-staging.yaml và values-production.yaml, cài bằng helm upgrade --install",
        lesson: `**Việc cần làm.** Tách môi trường: \`values-staging.yaml\` (1 replica, resources nhỏ) và \`values-production.yaml\` (3 replicas, resources thật). Cài: \`helm upgrade --install app . -f values-staging.yaml -n staging --create-namespace\`.

**Nguồn.** [Giai đoạn 3 — Tuần 9–10](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w5-5",
        text: "Diễn tập helm upgrade, helm history, helm rollback, so sánh với rollout undo",
        lesson: `**Việc cần làm.** Diễn tập vòng đời release: upgrade đổi tag image → \`helm history app\` → \`helm rollback app 1\`. So sánh với rollout undo của kubectl để hiểu Helm quản lý ở tầng release.

**Nguồn.** [Giai đoạn 3 — Tuần 9–10](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w6",
    week: "Tuần 11–12",
    title: "HPA + kube-prometheus-stack",
    goal: "Autoscaling chạy thật dưới tải và nhìn thấy trên Grafana — miếng demo đắt giá nhất của portfolio.",
    doneWhen: "HPA scale lên/xuống thật dưới tải, có GIF; app metrics hiện trong Prometheus của stack qua ServiceMonitor.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w6-1",
        text: "Cài metrics-server trên kind, patch --kubelet-insecure-tls, kiểm chứng kubectl top pods",
        lesson: `**Việc cần làm.** Cài metrics-server trên kind (cần patch args \`--kubelet-insecure-tls\` — có trong docs/issue của kind). Kiểm chứng: \`kubectl top pods\` ra số.

**Nguồn.** [Giai đoạn 3 — Tuần 11–12](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w6-2",
        text: "Tạo HPA trong chart: minReplicas 2, maxReplicas 5, target CPU 60%",
        lesson: `**Việc cần làm.** Tạo HPA qua chart của bạn: minReplicas 2, maxReplicas 5, target CPU 60%. Lưu ý: HPA tính theo % của **requests** — không đặt requests thì HPA mù; nối lại kiến thức tuần 5–6.

**Nguồn.** [Giai đoạn 3 — Tuần 11–12](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w6-3",
        text: "Cài kube-prometheus-stack, tạo ServiceMonitor khớp serviceMonitorSelector",
        lesson: `**Việc cần làm.** Cài kube-prometheus-stack: \`helm repo add prometheus-community ...\` → install vào namespace monitoring. Grafana có sẵn dashboard cluster. Để Prometheus scrape app của bạn: tạo ServiceMonitor (template thêm vào chart) với label khớp \`serviceMonitorSelector\` của stack — đây là chỗ 90% người mới tắc, đọc kỹ values của stack.

**Nguồn.** [Giai đoạn 3 — Tuần 11–12](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w6-4",
        text: "Bắn tải k6 ramp 0→100 VUs, quan sát HPA scale 2→5 pod và co lại",
        lesson: `**Việc cần làm.** Bắn tải bằng k6: script ramp 0 → 100 VUs trong 3 phút giữ 5 phút. Mở 3 cửa sổ: \`kubectl get hpa -w\`, \`kubectl get pods -w\`, Grafana. Xem pod nở 2 → 5, CPU hạ, rồi co lại sau khi ngừng tải (co chậm ~5 phút là mặc định — hiểu stabilization window).

**Nguồn.** [Giai đoạn 3 — Tuần 11–12](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w6-5",
        text: "Quay GIF màn hình cảnh HPA scale up cho README",
        lesson: `**Việc cần làm.** Quay GIF màn hình cảnh scale up cho README.

**Nguồn.** [Giai đoạn 3 — Tuần 11–12](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w7",
    week: "Tuần 13–14",
    title: "Tài khoản, IAM & VPC",
    goal: "Nền an toàn + hiểu mạng AWS bằng cách dựng tay 1 lần.",
    doneWhen: "Vẽ lại được sơ đồ VPC 2 AZ từ trí nhớ; giải thích public vs private subnet khác nhau ở route table chứ không phải ở tên; billing alert đã bật.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w7-1",
        text: "Ngày đầu: bật MFA root, tạo IAM user admin riêng, đặt Budget alert 10 USD, cài AWS CLI",
        lesson: `**Việc cần làm.** Thứ tự việc ngày đầu (kỷ luật): tạo tài khoản → bật MFA cho root → tạo IAM user admin riêng (từ nay không dùng root) → **AWS Budgets đặt alert 10 USD** → cài AWS CLI, \`aws configure\`.

**Nguồn.** [Giai đoạn 3 — Tuần 13–14](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w7-2",
        text: "Học IAM: user/group/role/policy, đọc policy JSON, nguyên tắc least privilege",
        lesson: `**Việc cần làm.** Học IAM qua khóa: user/group/role/policy; đọc hiểu 1 policy JSON (Effect/Action/Resource); nguyên tắc least privilege; role dùng cho service (EC2/EKS) thay vì nhét access key vào máy.

**Nguồn.** [Giai đoạn 3 — Tuần 13–14](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w7-3",
        text: "Dựng tay VPC 10.0.0.0/16, 2 AZ, IGW, NAT Gateway; xóa NAT ngay sau lab",
        lesson: `**Việc cần làm.** Dựng VPC bằng tay 1 lần duy nhất (để hiểu, sau này Terraform lo): VPC 10.0.0.0/16 → 2 AZ, mỗi AZ 1 public + 1 private subnet → Internet Gateway gắn VPC → route table public trỏ 0.0.0.0/0 về IGW → NAT Gateway ở public subnet, route table private trỏ về NAT. Kiểm chứng: EC2 ở public subnet SSH được; EC2 ở private không SSH được từ ngoài nhưng vẫn \`curl\` ra internet (qua NAT). **Nhớ xóa NAT Gateway ngay sau lab — nó tính ~1 USD/ngày kể cả khi không dùng.**

**Nguồn.** [Giai đoạn 3 — Tuần 13–14](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w7-4",
        text: "Lab Security Group vs NACL, hiểu SG là stateful",
        lesson: `**Việc cần làm.** Security Group vs NACL: lab mở/đóng port 8080 trên SG, hiểu SG là stateful (mở chiều vào là chiều ra tự về được).

**Nguồn.** [Giai đoạn 3 — Tuần 13–14](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w8",
    week: "Tuần 15–16",
    title: "Compute, database, storage",
    goal: "Hiểu từng mảnh ghép bằng 1 lần deploy tay, chuẩn bị nguyên liệu cho Terraform.",
    doneWhen: "App chạy qua ALB thật 1 lần; phân biệt được Multi-AZ vs read replica; tài khoản đã dọn sạch, billing ~0.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w8-1",
        text: "Deploy tay trọn bộ: EC2 + RDS PostgreSQL + ALB + ECR",
        lesson: `**Việc cần làm.** Deploy tay trọn bộ 1 lần: EC2 (Amazon Linux, t3.micro) trong public subnet chạy app container → RDS PostgreSQL (db.t3.micro, private subnet, SG chỉ cho EC2 vào port 5432) → ALB phía trước EC2 (target group + health check \`/actuator/health\`) → ECR tạo repo, push image từ máy (\`aws ecr get-login-password | docker login ...\`).

**Nguồn.** [Giai đoạn 3 — Tuần 15–16](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w8-2",
        text: "Học kèm EC2, RDS (Multi-AZ vs read replica), S3, CloudWatch qua khóa",
        lesson: `**Việc cần làm.** Học kèm từng dịch vụ qua khóa: EC2 (instance type, AMI, user data), RDS (Multi-AZ = HA, read replica = scale đọc — phân biệt rõ, hay nhầm), S3 (bucket policy, static hosting khái niệm), CloudWatch (xem metrics EC2/RDS cơ bản).

**Nguồn.** [Giai đoạn 3 — Tuần 15–16](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w8-3",
        text: "Chụp ảnh kiến trúc rồi xóa toàn bộ theo thứ tự ngược, xác nhận billing về ~0",
        lesson: `**Việc cần làm.** Chụp ảnh kiến trúc đang chạy, rồi **xóa toàn bộ** theo thứ tự ngược (ALB → EC2 → RDS → NAT). Kiểm tra Billing hôm sau xác nhận về ~0.

**Nguồn.** [Giai đoạn 3 — Tuần 15–16](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w8-4",
        text: "Nếu chọn thi SAA: học đều giáo trình khóa 5 buổi/tuần song song các lab",
        lesson: `**Việc cần làm.** Nếu chọn thi SAA: từ tuần này học đều giáo trình khóa 5 buổi/tuần song song các lab.

**Nguồn.** [Giai đoạn 3 — Tuần 15–16](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w9",
    week: "Tuần 17–18",
    title: "Terraform nền tảng",
    goal: "Code hóa hạ tầng đã dựng tay; hiểu state.",
    doneWhen: "VPC + EC2 tái tạo được bằng 1 lệnh; giải thích được state/drift/lock cho người khác; repo Terraform có cấu trúc module + biến chuẩn.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w9-1",
        text: "Lab chu trình Terraform: init → plan → apply → sửa tên → plan → destroy",
        lesson: `**Việc cần làm.** Học chu trình qua lab nhỏ đầu tiên: file main.tf tạo 1 S3 bucket → \`terraform init\` → \`plan\` (đọc kỹ output, tập thói quen đọc plan trước mọi apply) → \`apply\` → sửa tên → \`plan\` thấy destroy-and-recreate → \`destroy\`.

**Nguồn.** [Giai đoạn 3 — Tuần 17–18](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w9-2",
        text: "Thí nghiệm state: xóa bucket bằng tay, terraform plan báo cần tạo lại, hiểu drift",
        lesson: `**Việc cần làm.** Hiểu state bằng thí nghiệm: mở \`terraform.tfstate\` đọc; xóa bucket bằng tay trên console → \`terraform plan\` báo cần tạo lại → hiểu state = cái Terraform tin là đang tồn tại, drift là gì.

**Nguồn.** [Giai đoạn 3 — Tuần 17–18](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w9-3",
        text: "Cấu hình remote state: S3 bucket versioning + khóa state, backend s3",
        lesson: `**Việc cần làm.** Remote state: tạo S3 bucket riêng cho state + bật versioning + khóa state (DynamoDB lock, hoặc S3 lockfile với Terraform mới) → cấu hình backend "s3". Hiểu vì sao làm team bắt buộc remote state + lock.

**Nguồn.** [Giai đoạn 3 — Tuần 17–18](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w9-4",
        text: "Code hóa VPC bằng module terraform-aws-modules/vpc/aws, thêm EC2+SG tự viết HCL",
        lesson: `**Việc cần làm.** Code hóa VPC tuần trước: dùng module cộng đồng \`terraform-aws-modules/vpc/aws\` (đọc inputs của module thay vì viết tay từng resource — cách làm thật ở công ty). Thêm EC2 + SG bằng resource tự viết để luyện HCL: variables.tf, outputs.tf, \`terraform fmt\`, \`terraform validate\`.

**Nguồn.** [Giai đoạn 3 — Tuần 17–18](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w9-5",
        text: "Nghi thức khép lab: terraform destroy, rồi apply lại để cảm nhận hạ tầng = code",
        lesson: `**Việc cần làm.** Nghi thức khép lab: \`terraform destroy\` → billing sạch. Cảm nhận khoảnh khắc "hạ tầng = code": destroy rồi apply lại, mọi thứ sống dậy trong vài phút.

**Nguồn.** [Giai đoạn 3 — Tuần 17–18](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w10",
    week: "Tuần 19–20",
    title: "Dự án production-ready-platform",
    goal: "Ghép tất cả 3 giai đoạn thành 1 hệ hoàn chỉnh.",
    doneWhen: "Từ máy trắng, 1 buổi tối dựng lại toàn bộ chỉ bằng terraform apply + helm install + 1 lần push; README hoàn chỉnh.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w10-1",
        text: "Terraform module VPC + EKS (2 node t3.medium) + ECR, lấy kubeconfig",
        lesson: `**Việc cần làm.** Terraform: module VPC + module \`terraform-aws-modules/eks/aws\` (managed node group 2 node t3.medium) + ECR repo. Apply (~15 phút). Lấy kubeconfig: \`aws eks update-kubeconfig --name <cluster>\`.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w10-2",
        text: "Helm lên EKS: ingress-nginx (NLB), kube-prometheus-stack, chart app values-production",
        lesson: `**Việc cần làm.** Helm lên EKS: cài ingress-nginx (trên EKS nó tự tạo NLB — thấy LoadBalancer service "thật" lần đầu), kube-prometheus-stack, rồi chart app của bạn với values-production. Trỏ DNS (hoặc dùng thẳng hostname NLB) → app chạy trên EKS thật.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w10-3",
        text: "Nối CI/CD giai đoạn 2: push ECR qua OIDC role, deploy bằng helm upgrade --install",
        lesson: `**Việc cần làm.** Nối pipeline giai đoạn 2: sửa workflow — push ECR thay ghcr (dùng \`aws-actions/configure-aws-credentials\` với OIDC role, KHÔNG dùng access key tĩnh trong secrets — chuẩn hiện đại, có guide chính thức của GitHub + AWS); job deploy chạy \`helm upgrade --install\` (setup kubeconfig bằng action \`aws eks update-kubeconfig\`). Giữ approval cho production.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w10-4",
        text: "Chạy end-to-end 1 lần: push code → ECR → duyệt → helm upgrade, quay GIF",
        lesson: `**Việc cần làm.** Chạy end-to-end 1 lần: push code → image lên ECR → duyệt → helm upgrade → pod mới trên EKS. Quay GIF.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w10-5",
        text: "Kỷ luật chi phí: terraform destroy sau mỗi buổi lab, luyện dựng lại platform < 30 phút",
        lesson: `**Việc cần làm.** Kỷ luật chi phí: xong buổi lab → \`terraform destroy\`. Mỗi lần dựng lại chính là 1 lần luyện tập miễn phí; đến lần 3 bạn dựng cả platform < 30 phút.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w10-6",
        text: "Viết README: sơ đồ kiến trúc tổng, hướng dẫn dựng từ số 0, GIF demo",
        lesson: `**Việc cần làm.** Viết README: sơ đồ kiến trúc tổng (vẽ tay bằng draw.io: GitHub → Actions → ECR → EKS → NLB → user, cạnh bên Prometheus/Grafana), hướng dẫn dựng từ số 0, GIF demo.

**Nguồn.** [Giai đoạn 3 — Tuần 19–20](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w11",
    week: "Tuần 21–24",
    title: "Nước rút chứng chỉ",
    goal: "Nước rút ôn và thi lấy chứng chỉ CKA hoặc AWS SAA.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
      { label: "kubernetes.io — docs", href: "https://kubernetes.io/docs/" },
      { label: "killer.sh", href: "https://killer.sh/" },
    ],
    items: [
      {
        id: "sj-gd3-w11-1",
        text: "CKA — Tuần 21–22: làm hết mock lab KodeKloud, luyện tốc độ và tra docs nhanh",
        lesson: `**Việc cần làm.** Tuần 21–22: làm hết mock lab KodeKloud (lightning lab + mock exam), mỗi bài bấm giờ. Luyện tốc độ: alias k, \`$do\`, tra docs kubernetes.io nhanh (thi được mở docs), imperative command thay vì viết YAML chay.

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w11-2",
        text: "CKA — Tuần 23: killer.sh phiên 1 và phiên 2 cách nhau 3–4 ngày, chữa kỹ câu sai",
        lesson: `**Việc cần làm.** Tuần 23: killer.sh phiên 1 (khó hơn đề thật — điểm thấp đừng hoảng), chữa kỹ từng câu sai. Cách nhau 3–4 ngày làm phiên 2.

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w11-3",
        text: "CKA — Tuần 24: thi, flag câu > 8 phút, luôn kiểm tra đúng cluster/namespace",
        lesson: `**Việc cần làm.** Tuần 24: thi. Mẹo thi: câu nào > 8 phút thì flag bỏ qua làm câu sau; luôn kiểm tra đang ở đúng cluster/namespace của câu hỏi (nguồn mất điểm số 1).

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w11-4",
        text: "SAA — Tuần 21–23: luyện đề Tutorials Dojo từng domain đến khi ổn định ≥ 80%",
        lesson: `**Việc cần làm.** Tuần 21–23: luyện đề Tutorials Dojo (Jon Bonso) từng domain; mỗi câu sai đọc kỹ giải thích (giải thích của TD hay hơn cả khóa học). Thi thử full 65 câu bấm giờ đến khi ổn định ≥ 80%.

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w11-5",
        text: "SAA — Tuần 24: thi online proctored hoặc tại trung tâm",
        lesson: `**Việc cần làm.** Tuần 24: thi (online proctored hoặc trung tâm).

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w11-6",
        text: "SAA — Trượt lần 1 thì lùi 3–4 tuần thi lại, không chặn giai đoạn 4",
        lesson: `**Việc cần làm.** Trượt lần 1 (CKA có 1 lần thi lại miễn phí): lùi 3–4 tuần, không chặn giai đoạn 4.

**Nguồn.** [Giai đoạn 3 — Tuần 21–24](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-w12",
    week: "Tuần 25–26",
    title: "Blog, tech-sharing & đánh giá",
    goal: "Kể lại hành trình bằng một bài blog thật, tạo visibility tại công ty và chấm điểm nghiệm thu cuối giai đoạn.",
    resources: [
      { label: "Giai đoạn 3 — bản đầy đủ", href: "#/docs/sj-03" },
      { label: "Tổng quan roadmap 24 tháng", href: "#/docs/sj-00" },
    ],
    items: [
      {
        id: "sj-gd3-w12-1",
        text: "Viết blog 'Deploy Spring Boot lên Kubernetes production-ready: probe, JVM, autoscaling'",
        lesson: `**Việc cần làm.** Viết blog: "Deploy Spring Boot lên Kubernetes production-ready: probe, JVM memory và autoscaling" — 3 chủ đề bạn có trải nghiệm thật và thị trường rất thiếu bài tốt.

**Nguồn.** [Giai đoạn 3 — Tuần 25–26](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w12-2",
        text: "Đăng ký 1 buổi tech-sharing nội bộ demo platform, chủ động xin tham gia containerize",
        lesson: `**Việc cần làm.** Tại công ty: đăng ký 1 buổi tech-sharing nội bộ demo platform (dựng live càng tốt). Nếu công ty có kế hoạch containerize → chủ động xin vào. Visibility là điều kiện cần để lên Senior.

**Nguồn.** [Giai đoạn 3 — Tuần 25–26](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-w12-3",
        text: "Chấm checklist nghiệm thu và làm review quý theo tài liệu tổng quan",
        lesson: `**Việc cần làm.** Chấm checklist, review quý theo file 00.

**Nguồn.** [Giai đoạn 3 — Tuần 25–26](#/docs/sj-03)`,
      },
    ],
  },

  {
    id: "sj-gd3-done",
    week: "Nghiệm thu",
    badge: "✓",
    title: "Giai đoạn 3 — 7 tiêu chí bắt buộc",
    goal: "Cổng ra của giai đoạn 3. Đạt ≥ 6/7 thì sang giai đoạn 4.",
    items: [
      {
        id: "sj-gd3-done-1",
        text: "Máy trắng dựng lại platform hoàn chỉnh trong 1 buổi bằng terraform + helm",
        lesson: `**Cách tự chấm.** Kiểm tra từ máy trắng, platform \`production-ready-platform\` dựng lại hoàn chỉnh trong 1 buổi chỉ bằng terraform + helm, đúng như đã tổng hợp ở tuần 19–20.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-2",
        text: "Helm chart tự viết, values staging/production riêng, probe + resources chuẩn",
        lesson: `**Cách tự chấm.** Kiểm tra Helm chart tự viết (không copy nguyên mẫu), có values-staging/values-production riêng, và probe + resources đúng chuẩn như đã dựng ở tuần 5–6 và 9–10.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-3",
        text: "HPA scale thật dưới tải, có GIF",
        lesson: `**Cách tự chấm.** Kiểm tra HPA scale lên/xuống thật dưới tải k6 và có GIF minh chứng, như ở tuần 11–12.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-4",
        text: "Giải thích và tự gây được OOMKilled, phân biệt với OutOfMemoryError",
        lesson: `**Cách tự chấm.** Tự hỏi lại: có tự gây và giải thích được chuỗi dẫn tới OOMKilled (Exit Code 137) không, và phân biệt được nó với OutOfMemoryError — như ở tuần 5–6.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-5",
        text: "6 ca pod lỗi chẩn đoán không cần Google",
        lesson: `**Cách tự chấm.** Đếm lại kết quả lab break & fix ở tuần 7–8: cả 6 ca pod lỗi (ImagePullBackOff, CrashLoopBackOff, CreateContainerConfigError, Pending, readiness sai path, liveness sai path) phải chẩn đoán được không cần Google.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-6",
        text: "Đạt 1 chứng chỉ (CKA hoặc SAA)",
        lesson: `**Cách tự chấm.** Kiểm tra đã thi đạt 1 trong 2 chứng chỉ — CKA hoặc AWS SAA — như đã nước rút ở tuần 21–24.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
      {
        id: "sj-gd3-done-7",
        text: "Blog đã đăng, README repo hoàn chỉnh",
        lesson: `**Cách tự chấm.** Kiểm tra bài blog viết ở tuần 25–26 đã thực sự đăng (không chỉ nằm bản nháp), và README của repo \`production-ready-platform\` đã hoàn chỉnh.

**Nguồn.** [Giai đoạn 3 — Checklist đánh giá cuối giai đoạn](#/docs/sj-03)`,
      },
    ],
  },
];
