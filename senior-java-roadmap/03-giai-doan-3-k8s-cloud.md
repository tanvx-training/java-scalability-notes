# Giai đoạn 3 (Tháng 12–18): Kubernetes, AWS & Terraform — bản hướng dẫn thực hiện chi tiết

> Cấu trúc mỗi mục: **Mục tiêu** → **Cách thực hiện** → **Hoàn thành khi**.

## Output bắt buộc cuối giai đoạn

1. Repo `production-ready-platform`: Terraform → EKS → Helm chart tự viết → HPA → monitoring, dựng lại được từ số 0 trong 1 buổi.
2. 1 chứng chỉ: CKA (định hướng DevOps/Platform) hoặc AWS SAA (định hướng Senior Backend biết cloud).
3. 1 bài blog từ trải nghiệm thật.

## Tài nguyên chính

- Khóa: CKA — Mumshad/KodeKloud (chuẩn số 1, có lab); killer.sh để luyện thi. AWS SAA — Adrian Cantrill (sâu) hoặc Stephane Maarek (gọn). Terraform — KodeKloud/Zeal Vora + docs HashiCorp.
- Sách tra cứu: *Kubernetes in Action* (Lukša). Docs kubernetes.io (thi CKA được mở docs — luyện tra nhanh từ đầu).
- Công cụ: kind/k3d, kubectl, k9s, Helm, Terraform, AWS CLI, k6/hey.
- Chi phí: local miễn phí; EKS ~3–5 USD/ngày → bật khi lab, `terraform destroy` khi xong. Ngân sách cả giai đoạn ~30–50 USD. **Việc đầu tiên khi có tài khoản AWS: đặt Budget alert 10 USD.**

---

## Tháng 13–14 — Kubernetes cốt lõi

### Tuần 1–2: Kiến trúc & workload cơ bản

**Mục tiêu:** deploy được app của mình lên cluster local, thao tác kubectl phản xạ.

**Cách thực hiện:**
1. Học kiến trúc (2 buổi qua khóa CKA section đầu): control plane (api-server, etcd, scheduler, controller-manager) vs worker (kubelet, kube-proxy). Vẽ tay sơ đồ, chú thích "ai gọi ai khi tôi gõ kubectl apply".
2. Tạo cluster local: `kind create cluster --config kind.yaml` (config có `extraPortMappings` port 80/443 để tuần sau làm Ingress — lấy mẫu trong docs kind phần ingress).
3. Deploy app của giai đoạn 2: viết `deployment.yaml` (image từ ghcr, replicas 2) + apply. Mẹo tạo YAML nhanh (kỹ năng thi CKA): `kubectl create deployment app --image=... --dry-run=client -o yaml > deployment.yaml` rồi sửa, không gõ chay từ đầu.
4. Luyện bộ lệnh phản xạ mỗi ngày 15 phút: `kubectl get pods -o wide`, `describe pod`, `logs -f`, `exec -it -- sh`, `scale --replicas=3`, `delete pod` (xem ReplicaSet tự tạo lại — self-healing tận mắt).
5. Rolling update: đổi tag image → `kubectl set image deployment/app app=<image:tag-mới>` → `kubectl rollout status` xem pod thay dần → `kubectl rollout undo` quay lại. Ghi chú: điều kiện để rolling không gây downtime là readiness probe đúng (làm tuần 5–6 — ghi TODO).
6. Cài k9s dùng song song để xem trực quan, nhưng thao tác chính vẫn bằng kubectl (thi CKA không có k9s).
7. Set alias ngay từ giờ (dùng suốt giai đoạn + đi thi): `alias k=kubectl`, `export do="--dry-run=client -o yaml"`.

**Hoàn thành khi:** app 2 replicas chạy trên kind; rollout + undo thành thạo; tạo được deployment/service YAML bằng dry-run trong < 1 phút.

### Tuần 3–4: Networking trong K8s

**Mục tiêu:** hiểu request đi từ ngoài vào Pod qua chặng nào.

**Cách thực hiện:**
1. Học 3 loại Service qua lab tuần tự: tạo ClusterIP cho app → từ 1 pod tạm (`kubectl run tmp --image=busybox -it --rm -- sh`) `wget -qO- http://app-service` để thấy DNS nội bộ (`<service>.<namespace>.svc.cluster.local`) hoạt động. Đổi sang NodePort → curl từ máy host. Hiểu LoadBalancer là gì (trên cloud mới có thật).
2. Cài ingress-nginx cho kind (manifest chính thức trong docs kind). Viết Ingress resource: rule host `app.localtest.me` (domain này tự trỏ 127.0.0.1, khỏi sửa /etc/hosts) → service app. Curl kiểm chứng.
3. Lab 2 service sau 1 Ingress: deploy thêm 1 app echo bất kỳ, route theo path `/api` và `/echo`. Đây là mô hình thật của mọi cụm production.
4. Truy vết 1 request và viết ghi chú Feynman: browser → port máy → ingress controller pod → Service → Endpoints → Pod. Dùng `kubectl get endpoints app-service` để thấy Service thực chất chỉ là danh sách IP pod.

**Hoàn thành khi:** vẽ được đường đi request từ trí nhớ; 2 app route theo path chạy được; giải thích được Service ≠ load balancer vật lý.

### Tuần 5–6: Config, Secret, probe & JVM trong container

**Mục tiêu:** app Spring Boot cấu hình ĐÚNG chuẩn production trên K8s — phần giá trị nhất tháng.

**Cách thực hiện:**
1. ConfigMap/Secret: tách config app ra ConfigMap (inject qua `envFrom`), password DB vào Secret. Tự kiểm chứng giới hạn của Secret: `kubectl get secret db -o jsonpath='{.data.password}' | base64 -d` → chỉ là base64, không phải mã hóa → hiểu vì sao production cần RBAC chặt hoặc external secret manager.
2. Probe đúng cho Spring Boot: bật `management.endpoint.health.probes.enabled=true` (Boot tự bật khi chạy trên K8s) → có `/actuator/health/liveness` và `/readiness`. Khai báo trong deployment: livenessProbe + readinessProbe trỏ đúng 2 path đó, thêm startupProbe cho app khởi động chậm. Hiểu vai trò từng cái: startup bảo vệ lúc khởi động, readiness quyết định nhận traffic, liveness quyết định restart.
3. Kiểm chứng probe: thêm endpoint admin ép readiness DOWN (Boot có `AvailabilityChangeEvent`) → pod bị rút khỏi Endpoints (không nhận traffic) nhưng KHÔNG restart. Ép liveness DOWN → pod restart. Trải nghiệm này giúp không bao giờ nhầm 2 probe.
4. Resources + JVM (kiến thức ăn tiền phỏng vấn): đặt `resources.requests` (cpu 250m, memory 512Mi) và `limits` (memory 768Mi). JVM flag dùng `-XX:MaxRAMPercentage=75.0` thay vì Xmx cứng — JVM tự tính theo limit của container.
5. Lab OOMKilled chủ động: hạ memory limit xuống 256Mi, bắn tải/gọi endpoint ăn heap → pod chết. Đọc `kubectl describe pod`: `Last State: Terminated, Reason: OOMKilled, Exit Code: 137`. Giải thích được chuỗi: heap + metaspace + thread stack + native > limit → kernel kill. Ghi chú Feynman "OOMKilled vs OutOfMemoryError — hai thứ khác nhau thế nào".

**Hoàn thành khi:** app có đủ 3 probe hoạt động kiểm chứng được; tự gây và giải thích được OOMKilled; nêu được vì sao MaxRAMPercentage hơn Xmx cứng trên K8s.

### Tuần 7–8: Storage, scheduling & debug

**Mục tiêu:** debug pod lỗi thành phản xạ — kỹ năng sống còn của CKA và của nghề.

**Cách thực hiện:**
1. Học nhanh qua khóa CKA: PV/PVC/StorageClass (lab gắn PVC cho postgres trên kind), StatefulSet (hiểu khái niệm + khi nào cần, không cần sâu), DaemonSet, taint/toleration, nodeAffinity (lab đơn giản mỗi loại 1 lần theo khóa học).
2. Lab "break & fix" — tự tạo 6 hỏng hóc rồi tự chữa, mỗi cái ghi 3 dòng vào bảng chẩn đoán:
   - Image sai tên → `ImagePullBackOff` (describe thấy pull error)
   - App crash ngay khi start (sai biến env DB) → `CrashLoopBackOff` (xem `logs --previous`)
   - envFrom trỏ ConfigMap không tồn tại → `CreateContainerConfigError`
   - requests memory 10Gi → `Pending` (describe: Insufficient memory)
   - readiness sai path → pod Running nhưng không vào Endpoints, service không có traffic
   - liveness sai path → pod restart liên tục dù app khỏe
3. Đúc bảng chẩn đoán 1 trang: TRIỆU CHỨNG → LỆNH KIỂM TRA (`describe` đọc Events, `logs --previous`, `get endpoints`) → NGUYÊN NHÂN THƯỜNG GẶP. In ra dán bàn làm việc.

**Hoàn thành khi:** 6/6 ca tự chẩn đoán không cần Google; nói được khi nào cần StatefulSet thay Deployment.

---

## Tháng 15 — Helm, autoscaling & monitoring trên K8s

### Tuần 9–10: Helm chart tự viết

**Mục tiêu:** đóng gói app thành chart tham số hóa, có values riêng từng môi trường.

**Cách thực hiện:**
1. Học cấu trúc bằng cách mổ xẻ: `helm create demo` → đọc từng file sinh ra (Chart.yaml, values.yaml, templates/, _helpers.tpl) → xóa phần thừa.
2. Viết chart cho app của bạn (không copy nguyên mẫu): templates gồm deployment, service, ingress, configmap, hpa. Tham số hóa qua values: image.repository/tag, replicaCount, resources, ingress.host, env. Dùng `{{ .Values.x }}`, `{{ include "app.fullname" . }}`; điều kiện `{{- if .Values.ingress.enabled }}`.
3. Kỹ thuật kiểm tra không cần cài: `helm template .` xem YAML sinh ra; `helm lint .` bắt lỗi. Sửa đến khi template ra đúng YAML đã chạy tốt ở tháng trước.
4. Tách môi trường: `values-staging.yaml` (1 replica, resources nhỏ) và `values-production.yaml` (3 replicas, resources thật). Cài: `helm upgrade --install app . -f values-staging.yaml -n staging --create-namespace`.
5. Diễn tập vòng đời release: upgrade đổi tag image → `helm history app` → `helm rollback app 1`. So sánh với rollout undo của kubectl để hiểu Helm quản lý ở tầng release.

**Hoàn thành khi:** cùng 1 chart cài ra staging và production khác cấu hình; helm lint sạch; rollback bằng Helm đã thử.

### Tuần 11–12: HPA + kube-prometheus-stack

**Mục tiêu:** autoscaling chạy thật dưới tải và nhìn thấy trên Grafana — miếng demo đắt giá nhất của portfolio.

**Cách thực hiện:**
1. Cài metrics-server trên kind (cần patch args `--kubelet-insecure-tls` — có trong docs/issue của kind). Kiểm chứng: `kubectl top pods` ra số.
2. Tạo HPA qua chart của bạn: minReplicas 2, maxReplicas 5, target CPU 60%. Lưu ý: HPA tính theo % của **requests** — không đặt requests thì HPA mù; nối lại kiến thức tuần 5–6.
3. Cài kube-prometheus-stack: `helm repo add prometheus-community ...` → install vào namespace monitoring. Grafana có sẵn dashboard cluster. Để Prometheus scrape app của bạn: tạo ServiceMonitor (template thêm vào chart) với label khớp `serviceMonitorSelector` của stack — đây là chỗ 90% người mới tắc, đọc kỹ values của stack.
4. Bắn tải bằng k6: script ramp 0 → 100 VUs trong 3 phút giữ 5 phút. Mở 3 cửa sổ: `kubectl get hpa -w`, `kubectl get pods -w`, Grafana. Xem pod nở 2 → 5, CPU hạ, rồi co lại sau khi ngừng tải (co chậm ~5 phút là mặc định — hiểu stabilization window).
5. Quay GIF màn hình cảnh scale up cho README.

**Hoàn thành khi:** HPA scale lên/xuống thật dưới tải, có GIF; app metrics hiện trong Prometheus của stack qua ServiceMonitor.

---

## Tháng 16 — AWS cốt lõi

### Tuần 13–14: Tài khoản, IAM & VPC

**Mục tiêu:** nền an toàn + hiểu mạng AWS bằng cách dựng tay 1 lần.

**Cách thực hiện:**
1. Thứ tự việc ngày đầu (kỷ luật): tạo tài khoản → bật MFA cho root → tạo IAM user admin riêng (từ nay không dùng root) → **AWS Budgets đặt alert 10 USD** → cài AWS CLI, `aws configure`.
2. Học IAM qua khóa: user/group/role/policy; đọc hiểu 1 policy JSON (Effect/Action/Resource); nguyên tắc least privilege; role dùng cho service (EC2/EKS) thay vì nhét access key vào máy.
3. Dựng VPC bằng tay 1 lần duy nhất (để hiểu, sau này Terraform lo): VPC 10.0.0.0/16 → 2 AZ, mỗi AZ 1 public + 1 private subnet → Internet Gateway gắn VPC → route table public trỏ 0.0.0.0/0 về IGW → NAT Gateway ở public subnet, route table private trỏ về NAT. Kiểm chứng: EC2 ở public subnet SSH được; EC2 ở private không SSH được từ ngoài nhưng vẫn `curl` ra internet (qua NAT). **Nhớ xóa NAT Gateway ngay sau lab — nó tính ~1 USD/ngày kể cả khi không dùng.**
4. Security Group vs NACL: lab mở/đóng port 8080 trên SG, hiểu SG là stateful (mở chiều vào là chiều ra tự về được).

**Hoàn thành khi:** vẽ lại được sơ đồ VPC 2 AZ từ trí nhớ; giải thích public vs private subnet khác nhau ở route table chứ không phải ở tên; billing alert đã bật.

### Tuần 15–16: Compute, database, storage

**Mục tiêu:** hiểu từng mảnh ghép bằng 1 lần deploy tay, chuẩn bị nguyên liệu cho Terraform.

**Cách thực hiện:**
1. Deploy tay trọn bộ 1 lần: EC2 (Amazon Linux, t3.micro) trong public subnet chạy app container → RDS PostgreSQL (db.t3.micro, private subnet, SG chỉ cho EC2 vào port 5432) → ALB phía trước EC2 (target group + health check `/actuator/health`) → ECR tạo repo, push image từ máy (`aws ecr get-login-password | docker login ...`).
2. Học kèm từng dịch vụ qua khóa: EC2 (instance type, AMI, user data), RDS (Multi-AZ = HA, read replica = scale đọc — phân biệt rõ, hay nhầm), S3 (bucket policy, static hosting khái niệm), CloudWatch (xem metrics EC2/RDS cơ bản).
3. Chụp ảnh kiến trúc đang chạy, rồi **xóa toàn bộ** theo thứ tự ngược (ALB → EC2 → RDS → NAT). Kiểm tra Billing hôm sau xác nhận về ~0.
4. Nếu chọn thi SAA: từ tuần này học đều giáo trình khóa 5 buổi/tuần song song các lab.

**Hoàn thành khi:** app chạy qua ALB thật 1 lần; phân biệt được Multi-AZ vs read replica; tài khoản đã dọn sạch, billing ~0.

---

## Tháng 17 — Terraform & dự án tổng hợp

### Tuần 17–18: Terraform nền tảng

**Mục tiêu:** code hóa hạ tầng đã dựng tay; hiểu state.

**Cách thực hiện:**
1. Học chu trình qua lab nhỏ đầu tiên: file main.tf tạo 1 S3 bucket → `terraform init` → `plan` (đọc kỹ output, tập thói quen đọc plan trước mọi apply) → `apply` → sửa tên → `plan` thấy destroy-and-recreate → `destroy`.
2. Hiểu state bằng thí nghiệm: mở `terraform.tfstate` đọc; xóa bucket bằng tay trên console → `terraform plan` báo cần tạo lại → hiểu state = cái Terraform tin là đang tồn tại, drift là gì.
3. Remote state: tạo S3 bucket riêng cho state + bật versioning + khóa state (DynamoDB lock, hoặc S3 lockfile với Terraform mới) → cấu hình backend "s3". Hiểu vì sao làm team bắt buộc remote state + lock.
4. Code hóa VPC tuần trước: dùng module cộng đồng `terraform-aws-modules/vpc/aws` (đọc inputs của module thay vì viết tay từng resource — cách làm thật ở công ty). Thêm EC2 + SG bằng resource tự viết để luyện HCL: variables.tf, outputs.tf, `terraform fmt`, `terraform validate`.
5. Nghi thức khép lab: `terraform destroy` → billing sạch. Cảm nhận khoảnh khắc "hạ tầng = code": destroy rồi apply lại, mọi thứ sống dậy trong vài phút.

**Hoàn thành khi:** VPC + EC2 tái tạo được bằng 1 lệnh; giải thích được state/drift/lock cho người khác; repo Terraform có cấu trúc module + biến chuẩn.

### Tuần 19–20: Dự án `production-ready-platform`

**Mục tiêu:** ghép tất cả 3 giai đoạn thành 1 hệ hoàn chỉnh.

**Cách thực hiện:**
1. Terraform: module VPC + module `terraform-aws-modules/eks/aws` (managed node group 2 node t3.medium) + ECR repo. Apply (~15 phút). Lấy kubeconfig: `aws eks update-kubeconfig --name <cluster>`.
2. Helm lên EKS: cài ingress-nginx (trên EKS nó tự tạo NLB — thấy LoadBalancer service "thật" lần đầu), kube-prometheus-stack, rồi chart app của bạn với values-production. Trỏ DNS (hoặc dùng thẳng hostname NLB) → app chạy trên EKS thật.
3. Nối pipeline giai đoạn 2: sửa workflow — push ECR thay ghcr (dùng `aws-actions/configure-aws-credentials` với OIDC role, KHÔNG dùng access key tĩnh trong secrets — chuẩn hiện đại, có guide chính thức của GitHub + AWS); job deploy chạy `helm upgrade --install` (setup kubeconfig bằng action `aws eks update-kubeconfig`). Giữ approval cho production.
4. Chạy end-to-end 1 lần: push code → image lên ECR → duyệt → helm upgrade → pod mới trên EKS. Quay GIF.
5. Kỷ luật chi phí: xong buổi lab → `terraform destroy`. Mỗi lần dựng lại chính là 1 lần luyện tập miễn phí; đến lần 3 bạn dựng cả platform < 30 phút.
6. Viết README: sơ đồ kiến trúc tổng (vẽ tay bằng draw.io: GitHub → Actions → ECR → EKS → NLB → user, cạnh bên Prometheus/Grafana), hướng dẫn dựng từ số 0, GIF demo.

**Hoàn thành khi:** từ máy trắng, 1 buổi tối dựng lại toàn bộ chỉ bằng terraform apply + helm install + 1 lần push; README hoàn chỉnh.

---

## Tháng 18 — Chứng chỉ & tổng kết

### Tuần 21–24: Nước rút chứng chỉ

**Cách thực hiện (CKA):**
1. Tuần 21–22: làm hết mock lab KodeKloud (lightning lab + mock exam), mỗi bài bấm giờ. Luyện tốc độ: alias k, `$do`, tra docs kubernetes.io nhanh (thi được mở docs), imperative command thay vì viết YAML chay.
2. Tuần 23: killer.sh phiên 1 (khó hơn đề thật — điểm thấp đừng hoảng), chữa kỹ từng câu sai. Cách nhau 3–4 ngày làm phiên 2.
3. Tuần 24: thi. Mẹo thi: câu nào > 8 phút thì flag bỏ qua làm câu sau; luôn kiểm tra đang ở đúng cluster/namespace của câu hỏi (nguồn mất điểm số 1).

**Cách thực hiện (SAA):**
1. Tuần 21–23: luyện đề Tutorials Dojo (Jon Bonso) từng domain; mỗi câu sai đọc kỹ giải thích (giải thích của TD hay hơn cả khóa học). Thi thử full 65 câu bấm giờ đến khi ổn định ≥ 80%.
2. Tuần 24: thi (online proctored hoặc trung tâm).
3. Trượt lần 1 (CKA có 1 lần thi lại miễn phí): lùi 3–4 tuần, không chặn giai đoạn 4.

### Tuần 25–26: Blog, tech-sharing & đánh giá

**Cách thực hiện:**
1. Viết blog: "Deploy Spring Boot lên Kubernetes production-ready: probe, JVM memory và autoscaling" — 3 chủ đề bạn có trải nghiệm thật và thị trường rất thiếu bài tốt.
2. Tại công ty: đăng ký 1 buổi tech-sharing nội bộ demo platform (dựng live càng tốt). Nếu công ty có kế hoạch containerize → chủ động xin vào. Visibility là điều kiện cần để lên Senior.
3. Chấm checklist, review quý theo file 00.

## Checklist đánh giá cuối giai đoạn

- [ ] Máy trắng → platform hoàn chỉnh trong 1 buổi bằng terraform + helm
- [ ] Helm chart tự viết, values staging/production riêng, probe + resources chuẩn
- [ ] HPA scale thật dưới tải, có GIF
- [ ] Giải thích + tự gây được OOMKilled, phân biệt với OutOfMemoryError
- [ ] 6 ca pod lỗi chẩn đoán không cần Google
- [ ] Đạt 1 chứng chỉ (CKA hoặc SAA)
- [ ] Blog đã đăng, README repo hoàn chỉnh

Đạt ≥ 6/7 → giai đoạn 4.
