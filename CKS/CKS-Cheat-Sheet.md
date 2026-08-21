# ⚡ CKS Cheat Sheet — Kubernetes Security

> Bổ sung cho **CKAD-Cheat-Sheet.md** và **CKA-Cheat-Sheet.md** (NetworkPolicy, RBAC, SecurityContext cơ bản, etcd, static pods... dùng chung). File này chứa phần **riêng của CKS**.

---

## Mục Lục
1. [Nguyên tắc an toàn khi sửa control plane](#1-nguyên-tắc-an-toàn-khi-sửa-control-plane)
2. [kube-bench (CIS Benchmark)](#2-kube-bench-cis-benchmark)
3. [Verify binaries](#3-verify-binaries)
4. [API Server Hardening](#4-api-server-hardening)
5. [RBAC & ServiceAccount Hardening](#5-rbac--serviceaccount-hardening)
6. [Pod Security Standards / Admission](#6-pod-security-standards--admission)
7. [SecurityContext — cấu hình "restricted" chuẩn](#7-securitycontext--cấu-hình-restricted-chuẩn)
8. [Encryption at Rest (Secrets trong etcd)](#8-encryption-at-rest-secrets-trong-etcd)
9. [AppArmor](#9-apparmor)
10. [seccomp](#10-seccomp)
11. [Sandbox Runtime — gVisor / RuntimeClass](#11-sandbox-runtime--gvisor--runtimeclass)
12. [OPA Gatekeeper & Kyverno](#12-opa-gatekeeper--kyverno)
13. [Supply Chain: Dockerfile, Trivy, SBOM, ImagePolicyWebhook](#13-supply-chain)
14. [Audit Logging](#14-audit-logging-)
15. [Falco](#15-falco-)
16. [Immutable Containers & Forensics](#16-immutable-containers--forensics)
17. [Network Security bổ sung](#17-network-security-bổ-sung)

---

## 1. Nguyên Tắc An Toàn Khi Sửa Control Plane

```bash
# LUÔN backup trước khi sửa (backup ra NGOÀI thư mục manifests!):
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml

# Sau khi sửa — theo dõi apiserver khởi động lại:
watch crictl ps                    # chờ container apiserver lên
crictl ps -a | grep api            # nếu Exited → đọc log:
crictl logs <id>
ls /var/log/pods/ | grep apiserver # hoặc đọc log file

# Hỏng không cứu được → chép backup đè lại:
cp /root/apiserver-bak.yaml /etc/kubernetes/manifests/kube-apiserver.yaml
```

---

## 2. kube-bench (CIS Benchmark)

```bash
kube-bench                                  # chạy toàn bộ
kube-bench run --targets master             # chỉ control plane
kube-bench run --targets node               # chỉ worker
kube-bench | grep -A 3 "FAIL"               # lọc finding fail
kube-bench run --check 1.2.20               # chạy 1 check cụ thể
# Mỗi finding có phần "Remediation" — làm đúng theo đó rồi chạy lại verify
```

### Các fix CIS kinh điển
```bash
# Kubelet (sửa /var/lib/kubelet/config.yaml rồi systemctl restart kubelet):
authentication:
  anonymous:
    enabled: false            # tắt anonymous
  webhook:
    enabled: true
authorization:
  mode: Webhook               # KHÔNG dùng AlwaysAllow

# API server (sửa manifest):
- --profiling=false
- --authorization-mode=Node,RBAC            # không AlwaysAllow
- --enable-admission-plugins=NodeRestriction

# Quyền file:
chmod 644 /etc/kubernetes/manifests/*.yaml
chown root:root /etc/kubernetes/manifests/*.yaml
chmod 600 /var/lib/kubelet/config.yaml
```

---

## 3. Verify Binaries

```bash
sha512sum /usr/bin/kubelet                # hash binary đang có
# So với hash chính thức (tải từ dl.k8s.io hoặc đề bài cho sẵn file hash):
sha512sum kubelet | cut -d' ' -f1 > got.txt
diff got.txt official.txt                 # không output = khớp
# So nhanh 2 chuỗi: dán cả hai ra file rồi diff, đừng so bằng mắt
```

---

## 4. API Server Hardening

```yaml
# /etc/kubernetes/manifests/kube-apiserver.yaml — các flag security quan trọng:
- --anonymous-auth=false                        # tắt anonymous (cân nhắc: một số health check cần)
- --authorization-mode=Node,RBAC
- --enable-admission-plugins=NodeRestriction    # kubelet chỉ sửa được node/pod của nó
- --profiling=false
- --service-account-lookup=true
- --kubelet-certificate-authority=/etc/kubernetes/pki/ca.crt   # verify kubelet serving cert
- --encryption-provider-config=/etc/kubernetes/etcd/enc.yaml   # (xem mục 8)
- --audit-policy-file=/etc/kubernetes/audit/policy.yaml        # (xem mục 14)
# KHÔNG BAO GIỜ: --insecure-port (đã gỡ), AlwaysAllow, AlwaysAdmit
```

```bash
# Kiểm tra ai đang gọi API ẩn danh được:
k auth can-i list pods --as=system:anonymous
```

---

## 5. RBAC & ServiceAccount Hardening

```bash
# Tìm binding nguy hiểm:
k get clusterrolebindings -o wide | grep cluster-admin
k get rolebindings,clusterrolebindings -A -o wide | grep <sa-name>

# Ai có quyền làm gì:
k auth can-i --list --as=system:serviceaccount:<ns>:<sa>
k auth can-i delete secrets --as=system:serviceaccount:dev:app-sa -n dev

# Thu hẹp: sửa Role bỏ wildcard
k edit role <name>       # thay verbs: ["*"] bằng danh sách cụ thể
```

### Tắt automount token
```yaml
# Mức ServiceAccount:
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
automountServiceAccountToken: false
---
# Hoặc mức Pod (override SA):
spec:
  serviceAccountName: app-sa
  automountServiceAccountToken: false
```

```bash
# Tìm pod đang mount token:
k get pod <p> -o yaml | grep -A3 serviceAccountToken
k exec <p> -- ls /var/run/secrets/kubernetes.io/serviceaccount 2>/dev/null && echo "MOUNTED"
```

---

## 6. Pod Security Standards / Admission

3 level: **privileged** (không hạn chế) < **baseline** (chặn known escalation) < **restricted** (hardening tối đa).
3 mode: **enforce** (chặn), **audit** (ghi audit log), **warn** (cảnh báo client).

```bash
# Bật bằng label namespace:
k label ns dev pod-security.kubernetes.io/enforce=restricted
k label ns dev pod-security.kubernetes.io/enforce-version=latest
k label ns dev pod-security.kubernetes.io/warn=restricted
k label ns dev pod-security.kubernetes.io/audit=baseline

# Test pod có pass không (không tạo thật):
k apply -f pod.yaml --dry-run=server
```

### Pod pass mức "restricted" cần:
```yaml
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop: ["ALL"]
```

---

## 7. SecurityContext — Cấu Hình "Restricted" Chuẩn

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:1.25
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      privileged: false
      capabilities:
        drop: ["ALL"]
        # add: ["NET_BIND_SERVICE"]   # chỉ add khi thật sự cần
    volumeMounts:                     # RO rootfs → cấp chỗ ghi tạm:
    - name: tmp
      mountPath: /tmp
  volumes:
  - name: tmp
    emptyDir: {}
```

### Red flags cần tìm & gỡ khi audit manifest
```yaml
privileged: true          # = root trên host, tắt mọi cách ly → GỠ
hostNetwork: true         # dùng network host
hostPID: true / hostIPC: true
hostPath: {path: /}       # mount filesystem host
capabilities: {add: ["SYS_ADMIN"]}
runAsUser: 0
```
```bash
# Quét nhanh pod nguy hiểm toàn cluster:
k get pods -A -o json | jq -r '.items[] | select(.spec.containers[].securityContext.privileged==true) | "\(.metadata.namespace)/\(.metadata.name)"'
k get pods -A -o json | jq -r '.items[] | select(.spec.hostNetwork==true) | .metadata.name'
```

---

## 8. Encryption at Rest (Secrets trong etcd)

### 1. Tạo EncryptionConfiguration
```bash
head -c 32 /dev/urandom | base64      # sinh key 32 byte
```
```yaml
# /etc/kubernetes/etcd/enc.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: ["secrets"]
  providers:
  - aescbc:                        # provider đầu tiên dùng để MÃ HÓA khi ghi
      keys:
      - name: key1
        secret: <base64-32-byte-key>
  - identity: {}                   # identity ở SAU → vẫn ĐỌC được secret cũ chưa mã hóa
```

### 2. Gắn vào apiserver (sửa static pod manifest)
```yaml
    - --encryption-provider-config=/etc/kubernetes/etcd/enc.yaml
    volumeMounts:
    - name: enc
      mountPath: /etc/kubernetes/etcd
      readOnly: true
  volumes:
  - name: enc
    hostPath:
      path: /etc/kubernetes/etcd
      type: DirectoryOrCreate
```

### 3. Verify & re-encrypt
```bash
# Chờ apiserver lên. Tạo secret mới rồi đọc thẳng etcd:
k create secret generic s1 --from-literal=k=v -n default

ETCDCTL_API=3 etcdctl get /registry/secrets/default/s1 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \
  --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key | hexdump -C | head
# Thấy "k8s:enc:aescbc:v1:key1" = đã mã hóa ✓ ; thấy plaintext = chưa

# Re-encrypt toàn bộ secret cũ:
k get secrets -A -o json | k replace -f -
```

> Chiều ngược lại (giải mã tất cả): đảo `identity: {}` lên ĐẦU danh sách providers rồi replace secrets.

---

## 9. AppArmor

```bash
# Trạng thái trên node:
aa-status
apparmor_status | grep <profile>

# Profile mẫu (deny ghi file):
cat <<'EOF' > /etc/apparmor.d/k8s-deny-write
#include <tunables/global>
profile k8s-deny-write flags=(attach_disconnected) {
  #include <abstractions/base>
  file,
  deny /** w,       # cho mọi thứ trừ GHI file
}
EOF

# Load profile (phải làm trên NODE mà pod sẽ chạy):
apparmor_parser -q /etc/apparmor.d/k8s-deny-write
```

### Gắn vào pod
```yaml
# K8s 1.30+: field chính thức trong securityContext
spec:
  securityContext:                 # hoặc đặt ở container-level
    appArmorProfile:
      type: Localhost              # Localhost | RuntimeDefault | Unconfined
      localhostProfile: k8s-deny-write
```
```yaml
# Bản cũ: annotation (vẫn cần nhận biết khi đọc manifest cũ)
metadata:
  annotations:
    container.apparmor.security.beta.kubernetes.io/<container-name>: localhost/k8s-deny-write
```

```bash
# Debug: pod bị Blocked/CrashLoop → k describe pod (profile chưa load trên node?)
k exec <pod> -- touch /tmp/x      # "Permission denied" = profile hoạt động
```

---

## 10. seccomp

```bash
# Thư mục profile của kubelet:
grep seccomp /var/lib/kubelet/config.yaml   # seccompDefault / đường dẫn
mkdir -p /var/lib/kubelet/seccomp/profiles
```

### Profile mẫu
```json
// /var/lib/kubelet/seccomp/profiles/audit.json — log mọi syscall:
{ "defaultAction": "SCMP_ACT_LOG" }

// violation.json — chặn mặc định, chỉ cho phép danh sách:
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    { "names": ["read","write","exit","exit_group","futex","nanosleep"],
      "action": "SCMP_ACT_ALLOW" }
  ]
}
```

### Gắn vào pod
```yaml
spec:
  securityContext:
    seccompProfile:
      type: RuntimeDefault           # profile mặc định của runtime (khuyến nghị baseline)
---
spec:
  securityContext:
    seccompProfile:
      type: Localhost
      localhostProfile: profiles/audit.json   # tương đối so với /var/lib/kubelet/seccomp/
```

```bash
# Xem syscall bị log (SCMP_ACT_LOG):
journalctl | grep audit | grep SECCOMP
# Đo syscall 1 lệnh dùng: strace -c ls
```

---

## 11. Sandbox Runtime — gVisor / RuntimeClass

```yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc                 # handler đã cấu hình trong containerd
---
apiVersion: v1
kind: Pod
metadata:
  name: sandboxed
spec:
  runtimeClassName: gvisor     # ← pod chạy trong sandbox
  containers:
  - name: app
    image: nginx
```

```bash
k get runtimeclass
# Verify pod chạy gVisor:
k exec sandboxed -- dmesg | head       # thấy "gVisor" ✓
k exec sandboxed -- uname -r           # kernel giả lập khác kernel host
```

> Khi nào dùng: workload không tin cậy / multi-tenant — sandbox chặn container escape vì syscall bị gVisor chắn, không tới thẳng kernel host.

---

## 12. OPA Gatekeeper & Kyverno

### Gatekeeper — cấu trúc 2 tầng
```yaml
# 1. ConstraintTemplate: định nghĩa policy (Rego) + tạo CRD mới
apiVersion: templates.gatekeeper.sh/v1
kind: ConstraintTemplate
metadata:
  name: k8srequiredlabels
spec:
  crd:
    spec:
      names:
        kind: K8sRequiredLabels
      validation:
        openAPIV3Schema:
          properties:
            labels:
              type: array
              items: {type: string}
  targets:
  - target: admission.k8s.gatekeeper.sh
    rego: |
      package k8srequiredlabels
      violation[{"msg": msg}] {
        provided := {l | input.review.object.metadata.labels[l]}
        required := {l | l := input.parameters.labels[_]}
        missing := required - provided
        count(missing) > 0
        msg := sprintf("thiếu label: %v", [missing])
      }
---
# 2. Constraint: áp dụng template với tham số cụ thể
apiVersion: constraints.gatekeeper.sh/v1beta1
kind: K8sRequiredLabels
metadata:
  name: ns-must-have-team
spec:
  match:
    kinds:
    - apiGroups: [""]
      kinds: ["Namespace"]
  parameters:
    labels: ["team"]
```
```bash
k get constrainttemplates
k get constraints
k describe k8srequiredlabels ns-must-have-team    # xem violations
# Trong thi thường chỉ cần SỬA template/constraint có sẵn, không viết Rego từ đầu
```

### Kyverno — 1 resource duy nhất
```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-registry
spec:
  validationFailureAction: Enforce      # Enforce (chặn) | Audit (chỉ ghi nhận)
  rules:
  - name: only-trusted-registry
    match:
      any:
      - resources:
          kinds: ["Pod"]
    validate:
      message: "Chỉ cho phép image từ registry.company.io"
      pattern:
        spec:
          containers:
          - image: "registry.company.io/*"
```
```bash
k get clusterpolicy
k describe clusterpolicy restrict-registry
```

---

## 13. Supply Chain

### Dockerfile hardening checklist
```dockerfile
FROM alpine:3.19                          # 1. base tối giản + tag cụ thể (tốt hơn: @sha256:digest)
RUN apk add --no-cache python3            # 2. không cache, không package thừa
COPY app.py /app/                         # 3. COPY thay ADD
RUN addgroup -S app && adduser -S app -G app
USER app                                  # 4. KHÔNG chạy root
# 5. Không ENV/COPY secret vào image; 6. multi-stage để bỏ build tools khỏi image cuối
ENTRYPOINT ["python3", "/app/app.py"]
```

### Trivy
```bash
trivy image nginx:1.25                                    # scan đầy đủ
trivy image --severity HIGH,CRITICAL nginx:1.25           # lọc mức độ
trivy image --severity CRITICAL -q nginx:1.25 | grep CVE-2024-1234   # tìm CVE cụ thể
trivy image --input image.tar                             # scan file tar
trivy fs /path/to/project                                 # scan filesystem/source
trivy image -f json -o result.json nginx:1.25             # xuất JSON

# Dạng bài thi: "trong 4 image sau, image nào chứa CVE-XXX" →
for i in img1 img2 img3 img4; do echo "== $i"; trivy image -q $i | grep CVE-XXX; done
```

### SBOM
```bash
trivy image --format cyclonedx --output sbom.json nginx:1.25
trivy image --format spdx-json --output sbom.spdx.json nginx:1.25
trivy sbom sbom.json                       # scan lại từ SBOM
bom generate --image nginx:1.25 -o sbom.spdx    # tool "bom" (nếu đề yêu cầu)
```

### ImagePolicyWebhook (admission plugin)
```yaml
# 1. AdmissionConfiguration:
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: ImagePolicyWebhook
  configuration:
    imagePolicy:
      kubeConfigFile: /etc/kubernetes/policywebhook/kubeconf   # trỏ tới webhook server
      allowTTL: 50
      denyTTL: 50
      retryBackoff: 500
      defaultAllow: false        # ⭐ webhook chết → DENY (fail-closed, hay được hỏi)
```
```bash
# 2. Sửa apiserver:
- --enable-admission-plugins=NodeRestriction,ImagePolicyWebhook
- --admission-control-config-file=/etc/kubernetes/policywebhook/admission_config.yaml
# + mount volume chứa thư mục config vào static pod
```

---

## 14. Audit Logging ⭐

### 1. Audit Policy
```yaml
# /etc/kubernetes/audit/policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:
# Thứ tự QUAN TRỌNG — rule khớp đầu tiên được áp dụng:
- level: RequestResponse            # log cả request + response body
  resources:
  - group: ""
    resources: ["secrets"]
  namespaces: ["prod"]
- level: Metadata                   # chỉ metadata (user, verb, resource, timestamp)
  resources:
  - group: ""
    resources: ["pods"]
  verbs: ["delete"]
- level: None                       # không log gì (mặc định cuối cùng để giảm noise)
```
4 level: `None` < `Metadata` < `Request` (+request body) < `RequestResponse` (+response body).

### 2. Bật trên apiserver
```yaml
    - --audit-policy-file=/etc/kubernetes/audit/policy.yaml
    - --audit-log-path=/var/log/kubernetes/audit/audit.log
    - --audit-log-maxage=30          # giữ 30 ngày
    - --audit-log-maxbackup=5
    - --audit-log-maxsize=100        # MB
    volumeMounts:
    - name: audit-policy
      mountPath: /etc/kubernetes/audit
      readOnly: true
    - name: audit-log
      mountPath: /var/log/kubernetes/audit
  volumes:
  - name: audit-policy
    hostPath: {path: /etc/kubernetes/audit, type: DirectoryOrCreate}
  - name: audit-log
    hostPath: {path: /var/log/kubernetes/audit, type: DirectoryOrCreate}
```

### 3. Truy vết
```bash
tail -f /var/log/kubernetes/audit/audit.log
grep '"resource":"secrets"' audit.log | jq .
grep '"user":{"username":"system:serviceaccount:dev:app-sa"' audit.log | jq '.verb, .objectRef'
```

---

## 15. Falco ⭐

```bash
# Falco chạy dạng systemd service trên node:
systemctl status falco
journalctl -u falco -f                 # xem alert realtime
falco                                  # hoặc chạy foreground để xem nhanh

# File cấu hình:
/etc/falco/falco.yaml                  # config chung (output, priority...)
/etc/falco/falco_rules.yaml            # rules mặc định (KHÔNG sửa trực tiếp)
/etc/falco/falco_rules.local.yaml      # ⭐ override/custom rules — SỬA Ở ĐÂY
```

### Cấu trúc 1 rule
```yaml
- rule: Terminal shell in container          # tên rule
  desc: A shell was spawned in a container
  condition: >                               # điều kiện (dựa trên syscall events)
    spawned_process and container
    and shell_procs and proc.tty != 0
  output: >                                  # ⭐ format output — dạng bài thi hay yêu cầu sửa
    Shell spawned (user=%user.name container_id=%container.id
    container_name=%container.name image=%container.image.repository)
  priority: WARNING                          # EMERGENCY..DEBUG
```

### Dạng bài "sửa output format của rule X"
```bash
# 1. Tìm rule trong falco_rules.yaml:
grep -A 10 "rule: Terminal shell" /etc/falco/falco_rules.yaml
# 2. COPY nguyên rule sang falco_rules.local.yaml, chỉ sửa dòng output theo yêu cầu, vd:
#    output: "%evt.time,%user.name,%container.id"
# 3. Restart:
systemctl restart falco
# 4. Trigger để verify:
k exec -it <pod> -- sh    # rồi xem journalctl -u falco
```

### Các field output hay dùng
```
%evt.time  %evt.type  %user.name  %user.uid  %proc.name  %proc.cmdline
%container.id  %container.name  %container.image.repository  %k8s.pod.name  %k8s.ns.name
```
(Tra đầy đủ: falco.org/docs → Supported Fields)

---

## 16. Immutable Containers & Forensics

### Immutable
```yaml
spec:
  containers:
  - name: app
    image: nginx
    securityContext:
      readOnlyRootFilesystem: true
    volumeMounts:                  # app cần ghi ở đâu → cấp emptyDir đúng chỗ đó
    - {name: tmp, mountPath: /tmp}
    - {name: cache, mountPath: /var/cache/nginx}
    - {name: run, mountPath: /var/run}
  volumes:
  - {name: tmp, emptyDir: {}}
  - {name: cache, emptyDir: {}}
  - {name: run, emptyDir: {}}
```

### Điều tra pod khả nghi
```bash
k get pods -A -o wide                          # pod lạ? node nào?
k describe pod <p>                             # image lạ? SA nào? mount gì?
k logs <p> --previous
k exec <p> -- ps aux                           # process lạ trong container
# Trên node:
crictl ps ; crictl inspect <id>
ss -tlnp                                       # port lạ đang listen
# Cô lập thay vì xóa (giữ tang chứng):
k label pod <p> quarantine=true
# → NetworkPolicy deny-all áp lên label đó; hoặc k cordon node
```

---

## 17. Network Security Bổ Sung

### Chặn cloud metadata endpoint (dạng bài thật)
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-metadata
  namespace: default
spec:
  podSelector: {}
  policyTypes: ["Egress"]
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0
        except: ["169.254.169.254/32"]     # chặn riêng metadata IP
```

### Ingress TLS
```bash
# Tạo cert tự ký + secret:
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \
  -keyout tls.key -out tls.crt -subj "/CN=app.example.com"
k create secret tls app-tls --cert=tls.crt --key=tls.key
```
```yaml
spec:
  tls:
  - hosts: ["app.example.com"]
    secretName: app-tls
  rules:
  - host: app.example.com
    ...
```
```bash
curl -kv https://app.example.com    # -v xem cert handshake
```

### mTLS (mức khái niệm cho thi)
- TLS thường: chỉ server trình cert. **mTLS**: cả client và server xác thực nhau bằng cert.
- Trong K8s thường do **service mesh** (Istio/Linkerd) tự động hóa qua sidecar proxy — đề CKS chỉ yêu cầu hiểu khái niệm + đọc cấu hình cơ bản.

---

## 🧠 Bộ Nhớ Nhanh CKS

```bash
# Luôn luôn:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/bak.yaml   # trước khi sửa
watch crictl ps                                                    # sau khi sửa

kube-bench | grep -B1 -A5 FAIL         # audit CIS → fix theo Remediation
trivy image --severity CRITICAL <img>  # scan CVE
k label ns x pod-security.kubernetes.io/enforce=restricted        # PSA
head -c 32 /dev/urandom | base64       # key cho EncryptionConfiguration
apparmor_parser -q <profile-file>      # load AppArmor (trên đúng node!)
journalctl -u falco -f                 # xem Falco alerts
grep -A10 "rule: <tên>" /etc/falco/falco_rules.yaml   # tìm rule cần sửa
k auth can-i --list --as=system:serviceaccount:<ns>:<sa>          # audit quyền SA
ETCDCTL_API=3 etcdctl get /registry/secrets/<ns>/<name> --cacert=... --cert=... --key=...
```

**Tư duy phòng thủ 4 lớp cho mỗi pod:**
*Identity (SA + RBAC tối thiểu) → Pod (SecurityContext restricted + seccomp/AppArmor) → Network (NetworkPolicy deny-default) → Runtime (Falco giám sát, gVisor nếu untrusted).*

---
*Dùng chung với CKAD & CKA Cheat Sheet. Chúc bạn hoàn thành bộ ba Kubestronaut! 🔐🚀*
