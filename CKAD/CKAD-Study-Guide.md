# 🎯 CKAD Study Guide — Lộ Trình Học Toàn Diện Cho Người Mới

> Hướng dẫn học và luyện thi **Certified Kubernetes Application Developer (CKAD)** dành cho người mới bắt đầu với Kubernetes. Lộ trình 8–10 tuần, học từ nền tảng đến luyện thi thực chiến.

---

## 1. Tổng Quan Về Kỳ Thi CKAD

### 1.1. Thông tin cơ bản

| Mục | Chi tiết |
|---|---|
| Tổ chức | CNCF / The Linux Foundation |
| Hình thức | **100% thực hành** (performance-based), làm trực tiếp trên terminal |
| Thời gian | **2 giờ** |
| Số câu hỏi | Khoảng 15–20 bài tập thực hành |
| Điểm đậu | **66%** |
| Giám sát | Thi online, có proctor giám sát qua webcam (PSI Bridge) |
| Số lần thi lại | 1 lần miễn phí (retake) |
| Hiệu lực chứng chỉ | 2 năm |
| Tài liệu được dùng | Được mở **kubernetes.io/docs**, **helm.sh/docs** trong lúc thi |

> ⚠️ **Lưu ý:** Phiên bản Kubernetes của kỳ thi thay đổi theo release. Luôn kiểm tra trang chính thức của Linux Foundation trước khi đăng ký để biết version hiện hành và các thay đổi mới nhất về curriculum.

### 1.2. Cấu trúc nội dung thi (Domains & Weights)

| Domain | Tỷ trọng | Nội dung chính |
|---|---|---|
| **Application Design and Build** | 20% | Container images, Jobs/CronJobs, multi-container Pods (sidecar, init), volumes |
| **Application Deployment** | 20% | Deployments, rolling updates, blue/green & canary, Helm, Kustomize |
| **Application Observability and Maintenance** | 15% | Probes, logging, debugging, API deprecations, monitoring |
| **Application Environment, Configuration and Security** | 25% | ConfigMaps, Secrets, SecurityContext, ServiceAccounts, RBAC, ResourceQuota, CRD |
| **Services and Networking** | 20% | Services, Ingress, NetworkPolicies |

**Nhận xét chiến lược:** Domain "Environment, Configuration and Security" chiếm tỷ trọng cao nhất (25%) — hãy đầu tư kỹ vào ConfigMap, Secret, SecurityContext và RBAC.

---

## 2. Điều Kiện Tiên Quyết (Prerequisites)

Trước khi học Kubernetes, bạn cần nắm vững:

### 2.1. Linux & Command Line (bắt buộc)
- Thao tác file: `cd`, `ls`, `cat`, `cp`, `mv`, `rm`, `mkdir`
- Text editor: **vim** (cực kỳ quan trọng — trong phòng thi bạn sẽ sửa YAML bằng vim)
- Pipes & redirect: `|`, `>`, `>>`, `grep`, `less`
- Biến môi trường, quyền file (`chmod`, `chown`)

### 2.2. Container & Docker (bắt buộc)
- Container là gì, khác VM thế nào
- Viết `Dockerfile`, build image, chạy container
- Image registry, tag, push/pull
- Lệnh cơ bản: `docker build`, `docker run`, `docker ps`, `docker logs`, `docker exec`

### 2.3. YAML (bắt buộc)
- Cú pháp: indentation (2 spaces), key-value, list, nested object
- Lỗi thường gặp: sai indent, dùng tab thay space

### 2.4. Kiến thức nền hữu ích (không bắt buộc)
- Networking cơ bản: IP, port, DNS, HTTP
- REST API cơ bản

---

## 3. Lộ Trình Học 8–10 Tuần

> Giả định: học **1.5–2 giờ/ngày**, 5–6 ngày/tuần. Nếu có ít thời gian hơn, kéo dài lộ trình thay vì bỏ bớt phần thực hành.

### 📅 Tuần 1: Nền tảng — Container & Kubernetes Architecture

**Mục tiêu:** Hiểu Kubernetes là gì và tại sao cần nó.

- [ ] Ôn lại Docker: build image, Dockerfile, registry
- [ ] Kiến trúc Kubernetes: Control Plane (API Server, etcd, Scheduler, Controller Manager) vs Worker Nodes (kubelet, kube-proxy, container runtime)
- [ ] Cài đặt môi trường lab (xem mục 4)
- [ ] Làm quen `kubectl`: `get`, `describe`, `create`, `delete`, `apply`
- [ ] Tạo Pod đầu tiên bằng cả 2 cách: imperative (`kubectl run`) và declarative (YAML)

**Thực hành:** Tạo/xóa 10 Pod khác nhau, đọc `kubectl describe pod` và hiểu từng section.

### 📅 Tuần 2: Pods Chuyên Sâu & Multi-Container Patterns

**Mục tiêu:** Thành thạo Pod — đơn vị cơ bản nhất.

- [ ] Pod lifecycle & phases (Pending, Running, Succeeded, Failed)
- [ ] Multi-container Pods: **sidecar**, **init containers**, adapter, ambassador
- [ ] Commands & Args (`command` vs `args`, tương ứng ENTRYPOINT vs CMD)
- [ ] Environment variables trong Pod
- [ ] Labels, Selectors, Annotations
- [ ] Namespaces

**Thực hành:** Tạo Pod có init container chờ service khác, Pod có sidecar ghi log chung volume.

### 📅 Tuần 3: Workloads — Deployments, Jobs, CronJobs

**Mục tiêu:** Quản lý ứng dụng ở quy mô production.

- [ ] ReplicaSets — cơ chế duy trì số replica
- [ ] **Deployments**: tạo, scale, update image
- [ ] Rolling updates & rollbacks (`rollout status`, `rollout undo`, `rollout history`)
- [ ] Deployment strategies: RollingUpdate (maxSurge/maxUnavailable) vs Recreate
- [ ] Blue/Green và Canary deployment (thực hiện bằng labels + services)
- [ ] **Jobs**: completions, parallelism, backoffLimit, activeDeadlineSeconds
- [ ] **CronJobs**: schedule cron syntax, concurrencyPolicy, successfulJobsHistoryLimit

**Thực hành:** Deploy app, update image sai → quan sát lỗi → rollback. Tạo CronJob chạy mỗi phút.

### 📅 Tuần 4: Configuration — ConfigMaps, Secrets, Resources

**Mục tiêu:** Chinh phục domain có tỷ trọng cao nhất (25%).

- [ ] **ConfigMaps**: tạo từ literal/file/env-file; inject qua env, envFrom, volume
- [ ] **Secrets**: types (Opaque, docker-registry, tls); base64 encoding; inject qua env & volume
- [ ] **Resource requests & limits** (CPU, memory); hiểu QoS classes
- [ ] **LimitRange** & **ResourceQuota** theo namespace
- [ ] **SecurityContext**: runAsUser, runAsGroup, fsGroup, capabilities, allowPrivilegeEscalation, readOnlyRootFilesystem (Pod-level vs Container-level)
- [ ] **ServiceAccounts** & gắn vào Pod
- [ ] **RBAC cơ bản**: Role, RoleBinding, ClusterRole, ClusterRoleBinding; `kubectl auth can-i`

**Thực hành:** Tạo app đọc config từ ConfigMap + Secret; giới hạn quyền bằng SecurityContext; tạo Role chỉ cho phép get/list pods.

### 📅 Tuần 5: Observability — Probes, Logging, Debugging

**Mục tiêu:** Debug nhanh — kỹ năng sống còn trong phòng thi.

- [ ] **Liveness probe**: httpGet, exec, tcpSocket
- [ ] **Readiness probe** & **Startup probe** — hiểu rõ sự khác biệt
- [ ] Probe parameters: initialDelaySeconds, periodSeconds, failureThreshold
- [ ] Logging: `kubectl logs` (multi-container, `--previous`, `-f`)
- [ ] Debugging workflow: `describe` → `events` → `logs` → `exec`
- [ ] Metrics: `kubectl top pod/node`
- [ ] Các lỗi Pod phổ biến: `ImagePullBackOff`, `CrashLoopBackOff`, `Pending`, `OOMKilled` — nguyên nhân & cách xử lý
- [ ] API deprecations: cách kiểm tra apiVersion (`kubectl api-resources`, `kubectl explain`)

**Thực hành:** Cố tình tạo Pod lỗi (sai image, thiếu resource, probe fail) rồi tự chẩn đoán và sửa.

### 📅 Tuần 6: Services & Networking

**Mục tiêu:** Kết nối ứng dụng.

- [ ] **Services**: ClusterIP, NodePort, LoadBalancer, headless; port vs targetPort vs nodePort
- [ ] DNS trong cluster: `<service>.<namespace>.svc.cluster.local`
- [ ] Endpoints — cách Service tìm Pod qua selector
- [ ] **Ingress**: rules, paths (Prefix/Exact), TLS, ingressClassName
- [ ] **NetworkPolicies**: ingress/egress rules, podSelector, namespaceSelector, ipBlock; default deny
- [ ] Test kết nối: `kubectl run tmp --rm -it --image=busybox -- wget -qO- <svc>`

**Thực hành:** Expose deployment bằng cả 3 loại service; viết NetworkPolicy chỉ cho phép frontend gọi backend.

### 📅 Tuần 7: Storage, Helm, Kustomize & Image Build

**Mục tiêu:** Hoàn thiện các mảnh còn lại của curriculum.

- [ ] Volumes: emptyDir, hostPath, configMap, secret
- [ ] **PersistentVolume (PV)** & **PersistentVolumeClaim (PVC)**: accessModes, storageClassName, binding
- [ ] **Helm**: install/upgrade/rollback/uninstall chart, repo, `--set`, values.yaml, `helm template`
- [ ] **Kustomize**: kustomization.yaml, bases/overlays, `kubectl apply -k`
- [ ] Build container image bằng Docker/Podman; export image (`docker save`)
- [ ] CRD & Operators (mức nhận biết: `kubectl get crd`, tạo custom resource từ CRD có sẵn)

**Thực hành:** Tạo PVC gắn vào Pod; cài nginx bằng Helm; tạo overlay dev/prod bằng Kustomize.

### 📅 Tuần 8–9: Luyện Thi Cường Độ Cao

**Mục tiêu:** Tốc độ + độ chính xác.

- [ ] Học thuộc **imperative commands** (xem cheat sheet) — tiết kiệm 50% thời gian so với viết YAML tay
- [ ] Luyện `kubectl explain` và tra cứu nhanh trên kubernetes.io/docs
- [ ] Làm lab trên **Killercoda** (miễn phí): killercoda.com/killer-shell-ckad
- [ ] Giải mock exams, mỗi lần bấm giờ 2 tiếng nghiêm túc
- [ ] Sau mỗi mock: review kỹ câu sai, làm lại cho đến khi thuần thục
- [ ] Luyện thao tác vim: sửa YAML, copy/paste block, undo

**Chỉ tiêu:** Mỗi câu hỏi cơ bản (tạo pod, deployment, service, configmap) hoàn thành **dưới 2 phút**.

### 📅 Tuần 10: Killer.sh & Thi Thật

- [ ] Làm **killer.sh** simulator (được tặng 2 session khi đăng ký thi — khó hơn đề thật, đừng nản nếu điểm thấp)
- [ ] Review toàn bộ cheat sheet
- [ ] Kiểm tra hệ thống thi: webcam, internet, phòng thi yên tĩnh, bàn trống, giấy tờ tùy thân
- [ ] Nghỉ ngơi đầy đủ trước ngày thi

---

## 4. Thiết Lập Môi Trường Lab

### Lựa chọn 1: Minikube (khuyên dùng cho máy cá nhân)
```bash
# Cài minikube (Linux)
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
minikube start --driver=docker
```

### Lựa chọn 2: Kind (nhẹ, chạy K8s trong Docker)
```bash
go install sigs.k8s.io/kind@latest   # hoặc tải binary
kind create cluster --name ckad-lab
```

### Lựa chọn 3: Lab online (không cần cài đặt)
- **Killercoda** — killercoda.com (miễn phí, giống môi trường thi)
- **Play with Kubernetes** — labs.play-with-k8s.com

> 💡 **Khuyến nghị:** Dùng minikube/kind để học hàng ngày + Killercoda để luyện đề sát môi trường thi.

---

## 5. Tài Nguyên Học Tập

### Khóa học
| Tài nguyên | Ghi chú |
|---|---|
| **KodeKloud — CKAD with Tests** (Mumshad Mannambeth, Udemy) | Phổ biến nhất, có lab tích hợp, rất phù hợp người mới |
| **Kubernetes Documentation** — kubernetes.io/docs | Tài liệu chính thức, ĐƯỢC DÙNG trong phòng thi — hãy học cách tra cứu nó |
| **Killer Shell (killercoda.com)** | Lab miễn phí theo từng chủ đề CKAD |
| **killer.sh** | Simulator chính thức, tặng kèm khi mua voucher thi |

### Sách & tham khảo
- *Certified Kubernetes Application Developer (CKAD) Study Guide* — Benjamin Muschko (O'Reilly)
- *Kubernetes in Action* — Marko Lukša (đọc thêm để hiểu sâu)

### Cộng đồng
- Kubernetes Slack (#ckad-exam-prep)
- r/kubernetes trên Reddit

---

## 6. Chiến Lược Làm Bài Thi

### 6.1. Thiết lập đầu giờ (30 giây đầu tiên)
```bash
# Alias thường được cấu hình sẵn trong môi trường thi, nhưng hãy kiểm tra:
alias k=kubectl
export do="--dry-run=client -o yaml"    # k run pod --image=nginx $do > pod.yaml
export now="--force --grace-period=0"   # k delete pod x $now
```

Cấu hình vim (tạo/kiểm tra `~/.vimrc`):
```vim
set tabstop=2
set expandtab
set shiftwidth=2
```

### 6.2. Quy tắc vàng
1. **Đọc kỹ context và namespace** — mỗi câu hỏi yêu cầu chạy lệnh chuyển context cho trước. Quên = 0 điểm câu đó.
2. **Ưu tiên imperative commands** — chỉ viết YAML tay khi bắt buộc; dùng `$do` để generate rồi sửa.
3. **Quản lý thời gian:** ~6 phút/câu. Câu khó/điểm thấp → **flag lại, làm sau**. Đừng sa lầy.
4. **Verify sau mỗi câu:** `k get pod` xem Running chưa, `k describe` nếu có nghi ngờ.
5. **Đừng xóa tài nguyên đề bài tạo sẵn** trừ khi được yêu cầu — sửa bằng `k edit` hoặc export → sửa → replace.
6. **Dùng `kubectl explain`** thay vì lục docs khi chỉ cần nhớ tên field: `k explain pod.spec.containers.securityContext`.
7. **Bookmark sẵn kỹ năng tra docs:** luyện tìm nhanh các trang: Pod, Deployment, ConfigMap, Secret, Probes, NetworkPolicy, Ingress, PV/PVC.

### 6.3. Phân bổ thời gian gợi ý
| Giai đoạn | Thời gian |
|---|---|
| Lượt 1: Làm hết câu dễ + trung bình | 80 phút |
| Lượt 2: Quay lại câu đã flag | 30 phút |
| Verify lại các câu quan trọng | 10 phút |

### 6.4. Sai lầm phổ biến cần tránh
- ❌ Làm việc sai namespace/context
- ❌ Viết YAML từ đầu thay vì generate
- ❌ Không verify kết quả sau khi apply
- ❌ Dành 15 phút cho 1 câu 4% điểm
- ❌ Sai indent YAML do dùng tab trong vim (fix bằng `.vimrc` ở trên)
- ❌ Quên `-n <namespace>` khi get/describe/delete

---

## 7. Checklist Tổng Hợp Trước Khi Thi

### Kiến thức — tự tin trả lời "Có" cho tất cả:
- [ ] Tạo Pod/Deployment/Service/ConfigMap/Secret bằng imperative command trong < 1 phút?
- [ ] Phân biệt liveness vs readiness vs startup probe và viết được cả 3 loại (httpGet/exec/tcpSocket)?
- [ ] Viết được multi-container Pod với init container và sidecar chia sẻ volume?
- [ ] Debug được CrashLoopBackOff / ImagePullBackOff / Pending trong < 3 phút?
- [ ] Viết được NetworkPolicy default-deny và allow theo label?
- [ ] Tạo Ingress route 2 path về 2 service khác nhau?
- [ ] Thực hiện rolling update và rollback deployment?
- [ ] Tạo Job với completions/parallelism và CronJob với schedule bất kỳ?
- [ ] Tạo PVC và mount vào Pod?
- [ ] Cài/upgrade/rollback Helm chart?
- [ ] Set SecurityContext (runAsUser, capabilities) đúng level (pod vs container)?
- [ ] Tạo Role + RoleBinding và kiểm tra bằng `kubectl auth can-i`?
- [ ] Dùng thành thạo `kubectl explain` để tra field?

### Hậu cần:
- [ ] Đã làm ít nhất 2 lượt killer.sh
- [ ] Kiểm tra PSI system requirements (browser, webcam, mic)
- [ ] Phòng thi: bàn trống, không người ra vào, đủ sáng
- [ ] Giấy tờ tùy thân hợp lệ (tên trùng với tên đăng ký)
- [ ] Đăng nhập sớm 30 phút trước giờ thi

---

## 8. Sau Kỳ Thi

- Kết quả có trong vòng 24 giờ qua email.
- Nếu chưa đậu: dùng lượt **retake miễn phí**, review kỹ các domain còn yếu, luyện thêm 1–2 tuần.
- Nếu đậu: 🎉 Chúc mừng! Bước tiếp theo tự nhiên là **CKA** (Administrator) hoặc **CKS** (Security — phù hợp nếu bạn theo hướng security).

---

*Chúc bạn học tốt và thi đậu CKAD! Kết hợp file này với **CKAD-Cheat-Sheet.md** trong suốt quá trình học.*
