# 🛠️ CKA Study Guide — Lộ Trình Học Certified Kubernetes Administrator

> Hướng dẫn học và luyện thi **CKA (Certified Kubernetes Administrator)** — chứng chỉ về **vận hành, quản trị cluster**. Lộ trình 8–10 tuần, giả định bạn đã học xong CKAD (hoặc nắm vững nội dung tương đương).

---

## 1. Tổng Quan Về Kỳ Thi CKA

### 1.1. Thông tin cơ bản

| Mục | Chi tiết |
|---|---|
| Tổ chức | CNCF / The Linux Foundation |
| Hình thức | 100% thực hành trên terminal |
| Thời gian | **2 giờ** |
| Số câu hỏi | Khoảng 15–20 bài |
| Điểm đậu | **66%** |
| Retake | 1 lần miễn phí |
| Hiệu lực | 2 năm |
| Tài liệu được dùng | kubernetes.io/docs |

> ⚠️ Kiểm tra trang Linux Foundation trước khi đăng ký — curriculum CKA đã được cập nhật (bổ sung Gateway API, Helm/Kustomize, CRD/Operator...) và version K8s thay đổi theo release.

### 1.2. Cấu trúc nội dung thi (Domains & Weights)

| Domain | Tỷ trọng | Nội dung chính |
|---|---|---|
| **Troubleshooting** | **30%** | Debug cluster, node, pod, service, log |
| **Cluster Architecture, Installation & Configuration** | 25% | kubeadm, RBAC, HA, etcd backup/restore, upgrade |
| **Services & Networking** | 20% | Services, Ingress, Gateway API, DNS/CoreDNS, CNI |
| **Workloads & Scheduling** | 15% | Deployments, scheduling, taints, affinity, ConfigMap/Secret |
| **Storage** | 10% | PV/PVC, StorageClass, dynamic provisioning |

**Nhận xét chiến lược:** Troubleshooting chiếm 30% — đây là kỳ thi "sửa cluster hỏng". Khác biệt lớn nhất so với CKAD: bạn phải thao tác **ở mức node** (SSH vào node, systemctl, đọc log kubelet, sửa static pod manifests, etcd).

### 1.3. CKA vs CKAD — khác nhau ở đâu?

| | CKAD | CKA |
|---|---|---|
| Góc nhìn | Developer triển khai app | Admin vận hành cluster |
| Trọng tâm | Pod, Deployment, config app | Control plane, node, etcd, network cluster |
| Kiến thức trùng | ~50%: Pods, Deployments, Services, ConfigMap/Secret, PV/PVC, RBAC | |
| Chỉ có ở CKA | kubeadm, etcd backup/restore, cluster upgrade, kubelet/systemd troubleshooting, static pods, CNI, Gateway API | |

→ Nếu bạn học CKAD trước, khoảng nửa nội dung CKA đã quen thuộc. Tập trung vào phần quản trị.

---

## 2. Điều Kiện Tiên Quyết

- Toàn bộ prerequisites của CKAD (xem **CKAD-Prerequisites.md**): Linux, vim, Docker, YAML.
- **Bổ sung riêng cho CKA:**
  - [ ] `systemctl` / `journalctl`: quản lý & đọc log service Linux (`systemctl status kubelet`, `journalctl -u kubelet`)
  - [ ] SSH giữa các máy (`ssh node01`)
  - [ ] Khái niệm certificate/TLS cơ bản (cert, key, CA) — dùng nhiều khi debug control plane
  - [ ] `ip addr`, `ip route`, `netstat`/`ss` — kiểm tra network trên node
  - [ ] Nội dung CKAD (khuyến nghị học/thi CKAD trước, hoặc ít nhất hoàn thành lộ trình CKAD-Study-Guide.md)

---

## 3. Lộ Trình Học 8–10 Tuần

### 📅 Tuần 1: Kiến Trúc Cluster Chuyên Sâu

- [ ] Control plane components: **kube-apiserver, etcd, kube-scheduler, kube-controller-manager** — vai trò từng thành phần, chúng nói chuyện với nhau thế nào
- [ ] Node components: **kubelet, kube-proxy, container runtime (containerd)**
- [ ] **Static Pods**: nằm ở `/etc/kubernetes/manifests/`, kubelet tự quản lý — control plane chạy dưới dạng static pods (khi cài bằng kubeadm)
- [ ] Chuỗi hoạt động: `kubectl apply` → API server → etcd → scheduler → kubelet → runtime
- [ ] Certificates: vị trí `/etc/kubernetes/pki/`, kubeconfig files trong `/etc/kubernetes/`

**Thực hành:** Vào node control plane, `ls /etc/kubernetes/manifests/`, đọc manifest của kube-apiserver, xem process bằng `ps aux | grep kube`.

### 📅 Tuần 2: Cài Đặt Cluster Với kubeadm

- [ ] Cài container runtime (containerd), kubeadm, kubelet, kubectl
- [ ] `kubeadm init` — bootstrap control plane; hiểu các flag `--pod-network-cidr`, `--apiserver-advertise-address`
- [ ] Cài CNI plugin (Flannel/Calico/Cilium) — hiểu vì sao node NotReady khi thiếu CNI
- [ ] `kubeadm join` — thêm worker node; `kubeadm token create --print-join-command`
- [ ] Khái niệm HA control plane (nhiều master + load balancer) — mức hiểu
- [ ] Kubeconfig: cấu trúc file, contexts, users, clusters

**Thực hành:** Dựng cluster 2 node bằng kubeadm trên VM (Vagrant/Multipass/VirtualBox) hoặc dùng lab Killercoda có sẵn.

### 📅 Tuần 3: etcd Backup/Restore & Cluster Upgrade ⭐ (gần như chắc chắn ra thi)

- [ ] **etcd backup**: `etcdctl snapshot save` với đầy đủ cert flags
- [ ] **etcd restore**: `etcdctl snapshot restore` → trỏ etcd static pod sang data-dir mới
- [ ] Tìm thông số etcd (endpoints, certs) từ `/etc/kubernetes/manifests/etcd.yaml`
- [ ] **Cluster upgrade với kubeadm**: upgrade control plane trước → worker sau; `kubeadm upgrade plan/apply`, upgrade kubelet & kubectl, drain/uncordon từng node
- [ ] Quy tắc version skew (kubelet được phép thấp hơn apiserver tối đa mấy minor version)

**Thực hành:** Backup etcd → tạo vài resource → restore → xác nhận resource biến mất. Upgrade cluster lên 1 minor version.

### 📅 Tuần 4: Scheduling

- [ ] Ôn lại: nodeSelector, node affinity (required vs preferred)
- [ ] **Taints & Tolerations** chuyên sâu: NoSchedule, PreferNoSchedule, NoExecute; taint mặc định trên control plane
- [ ] Pod affinity / anti-affinity
- [ ] **Manual scheduling**: `spec.nodeName` (bypass scheduler)
- [ ] Chuyện gì xảy ra khi scheduler chết? (pod Pending; static pod vẫn chạy)
- [ ] `kubectl cordon` / `drain` / `uncordon`
- [ ] DaemonSets — vì sao chạy được trên mọi node
- [ ] PriorityClass, resource requests ảnh hưởng scheduling

**Thực hành:** Taint 1 node, tạo pod có/không toleration, quan sát. Drain node và xem pod dời đi đâu.

### 📅 Tuần 5: Storage

- [ ] Ôn PV/PVC, accessModes, reclaim policies
- [ ] **StorageClass** & dynamic provisioning; `volumeBindingMode: WaitForFirstConsumer`
- [ ] Default StorageClass (annotation)
- [ ] Mở rộng PVC (allowVolumeExpansion)
- [ ] hostPath vs local volume
- [ ] Trạng thái PV: Available / Bound / Released — vì sao PV Released không bind lại được

**Thực hành:** Tạo StorageClass + PVC không chỉ định PV → quan sát dynamic provisioning (minikube có sẵn provisioner).

### 📅 Tuần 6: Services & Networking (mức admin)

- [ ] Ôn Services các loại; kube-proxy làm gì (iptables/ipvs mode)
- [ ] **CoreDNS**: pod ở kube-system, ConfigMap `coredns`, debug khi DNS hỏng
- [ ] **CNI**: config ở `/etc/cni/net.d/`, binary ở `/opt/cni/bin/`
- [ ] Ingress + IngressClass; cài ingress controller
- [ ] **Gateway API** (mới trong curriculum): GatewayClass, Gateway, HTTPRoute — tạo route cơ bản
- [ ] NetworkPolicies (ôn từ CKAD)
- [ ] Port của các thành phần: apiserver 6443, etcd 2379-2380, kubelet 10250, NodePort 30000-32767

**Thực hành:** Sửa hỏng CoreDNS (scale về 0) → quan sát lỗi DNS → khôi phục. Tạo HTTPRoute với Gateway API trên lab.

### 📅 Tuần 7: RBAC, Users & Helm/Kustomize

- [ ] RBAC chuyên sâu: Role/ClusterRole, aggregated ClusterRoles
- [ ] Tạo user bằng certificate: tạo key + CSR → `CertificateSigningRequest` → approve → cấp cert → tạo kubeconfig
- [ ] ServiceAccounts & token
- [ ] `kubectl auth can-i` mọi biến thể
- [ ] Helm & Kustomize (đã có trong curriculum CKA mới — ôn từ CKAD Cheat Sheet)
- [ ] CRD & Operator: cài CRD, tạo custom resource, hiểu operator pattern

**Thực hành:** Tạo user "dev-user" đầy đủ quy trình CSR → kubeconfig → giới hạn quyền bằng Role.

### 📅 Tuần 8: Troubleshooting ⭐⭐ (30% đề thi — tuần quan trọng nhất)

- [ ] **Node NotReady**: `ssh node` → `systemctl status kubelet` → `journalctl -u kubelet` → nguyên nhân phổ biến: kubelet chưa chạy, sai config `/var/lib/kubelet/config.yaml`, sai đường dẫn cert, runtime chết
- [ ] **Control plane hỏng**: apiserver không lên → kiểm tra static pod manifest có bị sửa sai không (`/etc/kubernetes/manifests/`), xem log container bằng `crictl logs` / `crictl ps -a`
- [ ] **kubectl không kết nối được**: kubeconfig sai, sai port/địa chỉ apiserver
- [ ] Debug Service/DNS: endpoints rỗng, CoreDNS chết, kube-proxy lỗi
- [ ] Debug application (ôn CKAD): CrashLoopBackOff, ImagePullBackOff...
- [ ] Xem log khi apiserver chết: `crictl` hoặc log file `/var/log/pods/`
- [ ] `kubectl get events`, `kubectl top` (metrics-server)

**Thực hành (mỗi ngày):** Tự phá cluster rồi sửa — dừng kubelet, sửa sai image trong etcd.yaml, đổi port apiserver, xóa CNI config... Killercoda có sẵn nhiều scenario troubleshooting.

### 📅 Tuần 9–10: Luyện Đề

- [ ] Ôn imperative commands (dùng chung Cheat Sheet CKAD + CKA)
- [ ] Mock exams bấm giờ 2 tiếng: Killercoda CKA scenarios, khóa KodeKloud mock
- [ ] **killer.sh CKA** (2 session kèm voucher thi) — làm tuần cuối
- [ ] Luyện đến khi: backup/restore etcd < 5 phút, tạo user CSR < 5 phút, sửa node NotReady < 5 phút
- [ ] Checklist hậu cần thi (giống CKAD — xem CKAD-Study-Guide.md mục 7)

---

## 4. Môi Trường Lab

CKA cần cluster **nhiều node** và quyền SSH vào node → minikube 1 node là KHÔNG đủ cho phần troubleshooting/kubeadm.

| Lựa chọn | Ghi chú |
|---|---|
| **Killercoda CKA scenarios** | Miễn phí, có sẵn cluster đa node + kịch bản hỏng hóc — khuyên dùng chính |
| **Vagrant/Multipass + kubeadm** | Tự dựng 1 master + 1-2 worker trên VM — học sâu nhất về installation |
| **kind (multi-node)** | `kind create cluster --config` với nhiều node — nhẹ, nhưng khác thực tế ở phần systemd |
| KodeKloud labs | Kèm khóa học, môi trường dựng sẵn |

---

## 5. Tài Nguyên

- **KodeKloud — CKA with Practice Tests** (Mumshad Mannambeth) — khóa phổ biến nhất
- **Killercoda** — killercoda.com/killer-shell-cka
- **killer.sh** — simulator chính thức
- Kubernetes docs: đặc biệt các trang *kubeadm upgrade*, *Operating etcd clusters*, *Troubleshooting kubeadm*
- Sách: *Certified Kubernetes Administrator (CKA) Study Guide* — Benjamin Muschko

---

## 6. Chiến Lược Thi CKA

Áp dụng toàn bộ chiến lược CKAD (alias, `$do`, vim, quản lý thời gian, đọc kỹ context) — cộng thêm:

1. **SSH đúng node, quay về đúng chỗ**: nhiều câu yêu cầu `ssh node01`. Làm xong **gõ `exit`** để về máy chính trước câu tiếp theo. Làm việc sai máy = mất điểm.
2. **Câu etcd backup/restore và upgrade**: điểm cao, quy trình dài — học thuộc lòng như một bài văn mẫu, đừng mất thời gian tra docs.
3. **Troubleshooting theo cây quyết định** (xem CKA Cheat Sheet mục Troubleshooting) — luôn đi từ `kubectl get nodes` → khoanh vùng → systemctl/journalctl/crictl.
4. **Đừng sợ câu "cluster hỏng"** — 90% trường hợp là: kubelet stopped, manifest static pod bị sửa sai, hoặc thiếu CNI.
5. Sau khi sửa control plane, **chờ 30–60 giây** để static pod khởi động lại rồi mới verify.

---

## 7. Checklist Kiến Thức Trước Khi Thi

- [ ] Backup & restore etcd hoàn chỉnh, thuộc lòng các cert flag?
- [ ] Upgrade cluster (control plane + worker) đúng thứ tự với kubeadm?
- [ ] Join thêm 1 worker node vào cluster?
- [ ] Sửa node NotReady trong < 5 phút (kubelet issues)?
- [ ] Sửa apiserver không khởi động (lỗi trong static pod manifest)?
- [ ] Tạo user mới bằng CSR + cấp quyền RBAC?
- [ ] Drain/cordon/uncordon node phục vụ bảo trì?
- [ ] Tạo StorageClass + PVC dynamic provisioning?
- [ ] Debug DNS/CoreDNS và Service không có endpoint?
- [ ] Tạo HTTPRoute cơ bản với Gateway API?
- [ ] Taint/toleration, affinity, manual scheduling?
- [ ] Cài đặt CRD và tạo custom resource?

---

*Dùng kèm **CKA-Cheat-Sheet.md**. Sau CKA, bước tiếp theo là **CKS** — xem CKS-Study-Guide.md. 🚀*
