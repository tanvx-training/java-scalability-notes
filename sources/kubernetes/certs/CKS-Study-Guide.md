# 🔐 CKS Study Guide — Lộ Trình Học Certified Kubernetes Security Specialist

> Hướng dẫn học và luyện thi **CKS** — chứng chỉ khó nhất trong bộ ba (CKAD → CKA → CKS), tập trung hoàn toàn vào **bảo mật Kubernetes**. Với background security researcher, đây là chứng chỉ giá trị nhất với bạn: nội dung phủ từ hardening, supply chain đến runtime detection.

---

## 1. Tổng Quan Về Kỳ Thi CKS

### 1.1. Thông tin cơ bản

| Mục | Chi tiết |
|---|---|
| **Điều kiện bắt buộc** | ⚠️ Phải có **CKA còn hiệu lực** mới được thi CKS |
| Hình thức | 100% thực hành trên terminal |
| Thời gian | **2 giờ** |
| Số câu | ~15–20 bài |
| Điểm đậu | **67%** |
| Retake | 1 lần miễn phí |
| Hiệu lực | 2 năm |
| Tài liệu được dùng | kubernetes.io/docs + docs của các tool trong scope (Trivy, Falco...) — kiểm tra danh sách allowed URLs hiện hành khi đăng ký |

> ⚠️ CKS được đánh giá là **khó hơn CKA đáng kể**: khối lượng tool bên thứ ba lớn (Falco, Trivy, kube-bench, AppArmor...), câu hỏi dài, thời gian gắt. Đừng thi khi chưa luyện killer.sh.

### 1.2. Cấu trúc nội dung thi (Domains & Weights)

| Domain | Tỷ trọng | Nội dung chính |
|---|---|---|
| **Minimize Microservice Vulnerabilities** | 20% | SecurityContext, Pod Security Standards/Admission, secrets management, admission controllers (OPA/Kyverno), mTLS, sandbox runtime |
| **Supply Chain Security** | 20% | Image scanning (Trivy), Dockerfile hardening, SBOM, image signing/validation, ImagePolicyWebhook, allowed registries |
| **Monitoring, Logging & Runtime Security** | 20% | Falco, audit logging, phát hiện hành vi bất thường, immutable containers, phân tích syscall |
| **Cluster Setup** | 15% | NetworkPolicies, CIS benchmark (kube-bench), Ingress TLS, bảo vệ node metadata, verify binaries |
| **Cluster Hardening** | 15% | RBAC tối thiểu, ServiceAccount hardening, API server access, upgrade kịp thời, NodeRestriction |
| **System Hardening** | 10% | AppArmor, seccomp, giảm bề mặt tấn công OS, giới hạn network access, least privilege trên host |

### 1.3. Bộ công cụ phải thành thạo

| Tool | Dùng để |
|---|---|
| **kube-bench** | Audit cluster theo CIS Benchmark |
| **Trivy** | Scan lỗ hổng image / filesystem / SBOM |
| **Falco** | Runtime threat detection (syscall rules) |
| **AppArmor** | Mandatory Access Control profile cho container |
| **seccomp** | Lọc syscall |
| **OPA Gatekeeper / Kyverno** | Policy-as-code admission control |
| **etcdctl** | Kiểm tra secret trong etcd (encryption at rest) |
| **crictl / podman / docker** | Thao tác runtime & image |
| **sha512sum / cosign (nhận biết)** | Verify binary / image signing |

---

## 2. Điều Kiện Tiên Quyết

- [ ] **CKA đã đậu** (bắt buộc về mặt thủ tục) — toàn bộ kỹ năng CKA được coi là đương nhiên: sửa static pod manifest, kubelet config, RBAC, NetworkPolicy, etcd...
- [ ] Linux security cơ bản: users/groups, sudo, systemd, file permissions, capabilities
- [ ] Hiểu TLS: CA, cert, key, mTLS handshake
- [ ] Đọc hiểu syscall ở mức khái niệm (open, execve, connect...) — nền cho seccomp/Falco
- [ ] (Lợi thế của bạn) Tư duy attacker: privilege escalation, container escape, lateral movement — CKS chính là "defense checklist" cho các vector này

---

## 3. Lộ Trình Học 8–10 Tuần

### 📅 Tuần 1: Cluster Setup — CIS Benchmark & Nền Tảng

- [ ] Mô hình 4C: Cloud → Cluster → Container → Code
- [ ] **kube-bench**: chạy trên control plane & worker, đọc kết quả FAIL/WARN, **sửa theo remediation** (đây là dạng bài thi: "fix các finding sau của kube-bench")
- [ ] Các fix CIS kinh điển: `--anonymous-auth=false` (kubelet), `--profiling=false`, quyền file `/etc/kubernetes/manifests/*` (644), `--authorization-mode` không chứa AlwaysAllow, etcd cert flags
- [ ] **Verify platform binaries**: `sha512sum kubectl` so với checksum chính thức
- [ ] Ingress + **TLS**: tạo secret tls, cấu hình Ingress HTTPS
- [ ] Bảo vệ **node metadata endpoint** (cloud metadata 169.254.169.254) bằng NetworkPolicy egress

**Thực hành:** Chạy kube-bench trên lab, chọn 5 finding FAIL và fix từng cái, chạy lại xác nhận PASS.

### 📅 Tuần 2: Cluster Hardening — RBAC & API Access

- [ ] RBAC **least privilege**: review Role/ClusterRole thừa quyền, thu hẹp verbs/resources; tránh wildcard `*`
- [ ] **ServiceAccount hardening**: `automountServiceAccountToken: false`; tạo SA riêng thay vì default; xóa/giảm quyền SA thừa
- [ ] Token SA: TokenRequest API, thời hạn token, tìm pod đang mount token
- [ ] Hạn chế truy cập API server: tắt anonymous auth, không expose insecure port, `--enable-admission-plugins=NodeRestriction`
- [ ] **NodeRestriction**: giới hạn kubelet chỉ sửa được node/pod của chính nó
- [ ] Upgrade cluster kịp thời (ôn quy trình kubeadm upgrade từ CKA)

**Thực hành:** Audit 1 namespace: liệt kê SA nào bind vào cluster-admin, thu hồi; tắt automount token cho pod không cần gọi API.

### 📅 Tuần 3: System Hardening — AppArmor, seccomp, Host

- [ ] **AppArmor**: viết/load profile (`apparmor_parser`), trạng thái enforce/complain, gắn vào container (field `securityContext.appArmorProfile` trên K8s mới, annotation trên bản cũ), debug khi profile chặn app
- [ ] **seccomp**: profile JSON (defaultAction, syscalls allow list), `RuntimeDefault` vs `Localhost`, đường dẫn `/var/lib/kubelet/seccomp/`, gắn qua `securityContext.seccompProfile`
- [ ] Giảm bề mặt tấn công host: tắt/gỡ service không cần (`systemctl disable`), đóng port (`ss -tlnp`), gỡ package thừa
- [ ] Least privilege trên node: kiểm soát sudo, khóa user

**Thực hành:** Viết seccomp profile chặn `mkdir`, gắn vào pod, xác nhận bị chặn. Load AppArmor profile deny-write và gắn vào container nginx.

### 📅 Tuần 4: Minimize Microservice Vulnerabilities (P1) — Pod Security & Secrets

- [ ] **SecurityContext chuyên sâu** (ôn CKAD): runAsNonRoot, readOnlyRootFilesystem, drop ALL capabilities, allowPrivilegeEscalation=false, tránh `privileged: true`
- [ ] **Pod Security Standards** (privileged / baseline / restricted) & **Pod Security Admission**: label namespace `pod-security.kubernetes.io/enforce=restricted`, các mode enforce/audit/warn
- [ ] **Secrets management**: secret trong etcd là base64 → bật **Encryption at Rest** (`EncryptionConfiguration`, provider aescbc/secretbox, sửa apiserver flag `--encryption-provider-config`), verify bằng `etcdctl get`
- [ ] Đọc secret từ etcd (kỹ năng "attacker view" để hiểu vì sao phải mã hóa)

**Thực hành:** Bật encryption at rest → tạo secret mới → `etcdctl get /registry/secrets/...` xác nhận ciphertext; secret cũ re-encrypt bằng `kubectl get secrets -A -o json | kubectl replace -f -`.

### 📅 Tuần 5: Minimize Microservice Vulnerabilities (P2) — Admission & Isolation

- [ ] **Admission controllers** tổng quan: mutating vs validating, thứ tự xử lý
- [ ] **OPA Gatekeeper**: ConstraintTemplate + Constraint (đọc/sửa Rego ở mức cơ bản) — hoặc **Kyverno** (ClusterPolicy validate/mutate) tùy curriculum hiện hành; luyện dạng bài "chặn image từ registry lạ", "bắt buộc label"
- [ ] **Sandbox runtime**: gVisor (runsc) — tạo **RuntimeClass** và gắn `runtimeClassName` vào pod; hiểu vì sao sandbox chống container escape
- [ ] **mTLS giữa services**: khái niệm, cert 2 chiều; nhận biết service mesh (Istio/Linkerd) — mức khái niệm
- [ ] Cách ly: namespace + NetworkPolicy + RuntimeClass kết hợp

**Thực hành:** Cài gVisor trên lab (Killercoda có sẵn), tạo RuntimeClass, chạy pod với runsc, so sánh `dmesg`/uname trong pod thường vs sandbox.

### 📅 Tuần 6: Supply Chain Security

- [ ] **Dockerfile hardening**: base image tối giản (distroless/alpine), image cụ thể tag+digest (`image@sha256:...`), USER không phải root, không nhúng secret, multi-stage build, COPY thay ADD
- [ ] Phân tích tĩnh manifest: soi YAML tìm privileged, hostPath, hostNetwork...
- [ ] **Trivy**: scan image (`trivy image --severity HIGH,CRITICAL nginx:1.25`), scan nhiều image tìm CVE cụ thể, output format
- [ ] **SBOM**: tạo bằng `trivy image --format cyclonedx/spdx-json`, hoặc bom/syft — mức sử dụng lệnh
- [ ] **Giới hạn registry được phép**: qua OPA/Kyverno policy hoặc **ImagePolicyWebhook** (viết AdmissionConfiguration, sửa apiserver flags)
- [ ] Image signing/verification (cosign) — mức nhận biết/verify

**Thực hành:** Scan 4 image, tìm image nào chứa CVE-XXXX (dạng bài thi thật). Viết Kyverno/Gatekeeper policy chỉ cho phép image từ `docker.io/library/`.

### 📅 Tuần 7: Monitoring, Logging & Runtime Security

- [ ] **Falco** ⭐: chạy dưới dạng service trên node, file rules (`/etc/falco/falco_rules.yaml`, `falco_rules.local.yaml`), đọc/sửa **output format** của rule (dạng bài: "sửa rule X output theo format: %evt.time,%user.name,..."), điều kiện (condition), macro, list; xem log `journalctl -u falco` / `falco` chạy foreground
- [ ] **Kubernetes Audit Logging** ⭐: viết **audit policy** (levels: None/Metadata/Request/RequestResponse; rules theo resource/namespace/verb), bật trên apiserver (`--audit-policy-file`, `--audit-log-path`, `--audit-log-maxage`...), mount volume vào static pod, đọc audit log truy vết hành vi
- [ ] **Immutable containers**: readOnlyRootFilesystem + emptyDir cho thư mục cần ghi
- [ ] Phát hiện xâm nhập: phân tích process lạ trong container (`crictl`, `ps`, Falco events), tìm pod bị chiếm
- [ ] `strace`/syscall analysis mức cơ bản

**Thực hành:** Viết audit policy log RequestResponse cho secrets trong 1 namespace → bật → tạo secret → grep audit log. Sửa 1 Falco rule đổi output format và trigger nó (exec shell vào container).

### 📅 Tuần 8: Tổng Hợp & Kịch Bản Tấn Công–Phòng Thủ

- [ ] Chuỗi hardening 1 pod "tệ nhất" → "chuẩn nhất": root+privileged+hostPath → nonroot, RO filesystem, drop caps, seccomp, AppArmor, NetworkPolicy, SA riêng không token
- [ ] Kịch bản: tìm và vá pod có quyền nguy hiểm trong cluster (`kubectl get pods -o json | jq` lọc privileged/hostNetwork)
- [ ] Ôn NetworkPolicy nâng cao (default deny + DNS + multi-rule)
- [ ] Ôn lại toàn bộ file paths & flags của apiserver liên quan security

### 📅 Tuần 9–10: Luyện Đề

- [ ] Killercoda CKS scenarios (killercoda.com/killer-shell-cks) — làm hết
- [ ] Mock exam bấm giờ; mục tiêu tốc độ: audit policy < 8 phút, Falco rule < 6 phút, encryption at rest < 8 phút, kube-bench fix < 5 phút/finding
- [ ] **killer.sh CKS** — bắt buộc, khó hơn đề thật; làm 2 lượt
- [ ] Luyện tra docs nhanh: trang Pod Security Standards, Encrypt Data at Rest, Audit, AppArmor, seccomp, Falco docs

---

## 4. Môi Trường Lab

CKS cần cluster kubeadm thật (VM) hoặc lab online — vì phải sửa apiserver flags, cài Falco/gVisor ở mức node.

| Lựa chọn | Ghi chú |
|---|---|
| **Killercoda CKS** | Miễn phí, có sẵn Falco/gVisor/Trivy scenarios — nguồn luyện chính |
| Vagrant/Multipass + kubeadm | Chủ động cài Falco, AppArmor, gVisor từ đầu — hiểu sâu nhất |
| killer.sh | 2 session kèm voucher — để tuần cuối |

---

## 5. Tài Nguyên

- **Killer Shell CKS course** (Kim Wüstkamp — Udemy/YouTube): được cộng đồng đánh giá là khóa CKS tốt nhất, có bản video miễn phí trên YouTube
- **KodeKloud — CKS with Practice Tests**
- Kubernetes docs: *Pod Security Standards*, *Encrypting Secret Data at Rest*, *Auditing*, *Restrict a Container's Syscalls with seccomp*, *AppArmor*
- Tool docs: falco.org/docs, aquasecurity.github.io/trivy, kyverno.io/docs, open-policy-agent.github.io/gatekeeper
- Repo luyện tập: tìm "CKS challenges / CKS exercises" trên GitHub (nhiều repo bài tập cộng đồng chất lượng)

---

## 6. Chiến Lược Thi CKS

Kế thừa toàn bộ chiến lược CKAD/CKA, cộng thêm:

1. **Sao lưu trước khi sửa control plane**: `cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-backup.yaml` — sửa sai flag là apiserver chết, có backup thì khôi phục trong 30 giây.
2. **Sửa apiserver flags từng bước, verify từng bước**: sửa 1 flag → chờ apiserver lên (`watch crictl ps`) → mới sửa tiếp. Apiserver không lên → `crictl logs` / `/var/log/pods/`.
3. **Câu Falco/audit policy dài** → đọc kỹ format yêu cầu, copy mẫu từ docs rồi sửa, đừng viết tay từ đầu.
4. **Phân bổ điểm**: câu tool lạ/dài (ImagePolicyWebhook, OPA) nếu bí → flag, làm câu chắc điểm trước (NetworkPolicy, RBAC, SecurityContext, Trivy scan là "điểm cho không" nếu bạn đã luyện).
5. **Nhớ danh sách docs được phép** — mở sẵn tab docs của tool ngay khi gặp câu liên quan.
6. Thời gian CKS gắt hơn CKA — tốc độ vim + imperative phải ở mức phản xạ.

---

## 7. Checklist Kiến Thức Trước Khi Thi

- [ ] Chạy kube-bench và fix finding trên cả control plane & worker?
- [ ] Bật encryption at rest cho secrets + verify bằng etcdctl + re-encrypt secret cũ?
- [ ] Viết audit policy 4 level và bật audit logging trên apiserver (kèm mount volume)?
- [ ] Sửa Falco rule đổi output format và tìm rule nào đã trigger?
- [ ] Viết + load + gắn AppArmor profile vào container?
- [ ] Viết seccomp profile và gắn qua securityContext?
- [ ] Enforce Pod Security Standard `restricted` trên namespace và sửa pod cho pass?
- [ ] Scan image bằng Trivy tìm CVE cụ thể? Tạo SBOM?
- [ ] Viết policy Gatekeeper/Kyverno chặn registry lạ hoặc bắt buộc field?
- [ ] Tạo RuntimeClass gVisor và chạy pod sandbox?
- [ ] Tắt automountServiceAccountToken và thu hẹp RBAC về least privilege?
- [ ] NetworkPolicy default-deny + allow chọn lọc + chặn metadata endpoint?
- [ ] Verify binary bằng sha512sum?
- [ ] Khôi phục apiserver khi sửa flag sai (qua crictl logs)?

---

*Dùng kèm **CKS-Cheat-Sheet.md**. Trình tự khuyến nghị: CKAD → CKA → CKS. Chúc bạn chinh phục trọn bộ ba! 🔐*
