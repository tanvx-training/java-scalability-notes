// CKA Roadmap Part 3 — Tuần 7 đến Tuần 9–10 (RBAC/Users/Helm-Kustomize, Troubleshooting, Luyện đề)
// Lưu ý: id và text của từng item KHÔNG được thay đổi — tiến độ học của người dùng lưu theo các id này.

export const ckaWeeksPart3 = [
  {
    id: "cka-w7",
    week: "Tuần 7",
    title: "RBAC, Users & Helm/Kustomize",
    goal: "Quy trình cấp quyền cho người và máy — dạng bài chắc chắn có.",
    practice: "Tạo user \"dev-user\" đầy đủ quy trình CSR → kubeconfig → giới hạn quyền bằng Role.",
    resources: [
      { label: "Lab 17 — RBAC: Role & RoleBinding", href: "#/labs/lab17" },
      { label: "Lab 08 — Helm cơ bản", href: "#/labs/lab08" },
      { label: "Lab 09 — Kustomize overlays", href: "#/labs/lab09" },
      { label: "CKA Cheat Sheet — mục Users & Certificates (CSR)", href: "#/docs/cka-cheat-sheet" },
      { label: "Kubernetes Docs — Certificate Signing Requests", href: "https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/" },
      { label: "Kubernetes Docs — Using RBAC Authorization", href: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/" },
    ],
    items: [
      {
        id: "cka-w7-1",
        text: "RBAC chuyên sâu: Role/ClusterRole, aggregated ClusterRoles",
        lesson: `Hãy hình dung RBAC như hệ thống **thẻ từ của một tòa nhà văn phòng**: **Role** là thẻ chỉ mở được các cửa trong **một tầng** (một namespace), còn **ClusterRole** là thẻ master mở được **mọi tầng** (cluster-wide). Nhưng thẻ nằm trong ngăn kéo thì vô dụng — phải **trao thẻ cho người cụ thể**, đó là việc của **RoleBinding/ClusterRoleBinding**.

Mỗi rule gồm ba phần: \`apiGroups\` + \`resources\` + \`verbs\` (get, list, watch, create, update, patch, delete). Khi nào bắt buộc dùng ClusterRole?

- Resource **không thuộc namespace**: \`nodes\`, \`persistentvolumes\`, \`namespaces\`...
- **Non-resource URL**: \`/healthz\`, \`/metrics\`.
- Pattern tái sử dụng hay ra thi: **ClusterRole + RoleBinding** → định nghĩa quyền một lần, nhưng chỉ có hiệu lực **trong namespace của binding**.

**Aggregated ClusterRole** là "thẻ ghép": ClusterRole có \`aggregationRule\` với \`clusterRoleSelectors\` — controller tự động **gộp rules** từ mọi ClusterRole mang label khớp. Đây chính là cách các role mặc định \`admin\`, \`edit\`, \`view\` được mở rộng khi bạn cài CRD mới: chỉ cần tạo ClusterRole nhỏ gắn label \`rbac.authorization.k8s.io/aggregate-to-view: "true"\` là quyền tự chảy vào role \`view\`.

\`\`\`bash
# Role trong namespace dev + trao cho user
k create role pod-reader --verb=get,list,watch --resource=pods -n dev
k create rolebinding pod-reader-rb --role=pod-reader --user=dev-user -n dev

# ClusterRole cho resource cluster-scoped
k create clusterrole node-reader --verb=get,list --resource=nodes
k create clusterrolebinding node-reader-rb --clusterrole=node-reader --user=dev-user

# Pattern tái sử dụng: ClusterRole "view" nhưng chỉ trong namespace dev
k create rolebinding view-dev --clusterrole=view --user=dev-user -n dev

# Soi aggregated ClusterRole mặc định
k get clusterrole admin -o yaml | head -15    # thấy aggregationRule
k auth can-i list pods -n dev --as=dev-user   # verify luôn sau khi cấp quyền
\`\`\`

⚠️ **Lỗi thường gặp:** đề chỉ yêu cầu quyền trong **một namespace** nhưng bạn dùng ClusterRoleBinding → cấp quyền toàn cluster, sai yêu cầu và mất điểm. Thứ hai: RBAC chỉ **cộng quyền** (additive) — không có "deny"; và Role thường **không** cấp được quyền lên resource cluster-scoped như \`nodes\`.`,
      },
      {
        id: "cka-w7-2",
        text: "Tạo user bằng certificate: key + CSR → CertificateSigningRequest → approve → kubeconfig",
        lesson: `Quy trình tạo user giống hệt **đi làm thẻ căn cước**: bạn tự chuẩn bị ảnh và điền đơn (tạo **private key + CSR** bằng openssl), nộp đơn lên cơ quan (tạo object **CertificateSigningRequest**), cán bộ xét duyệt (\`kubectl certificate approve\`), rồi nhận thẻ (certificate đã được **CA của cluster** ký). Kubernetes **không có object User** — "user" chỉ là cái tên nằm trong trường **CN** của certificate (còn **O** là group).

Điểm kỹ thuật phải nhớ: trường \`request\` của CSR là nội dung file .csr **base64 trên MỘT dòng**; \`signerName\` cho client cert là \`kubernetes.io/kube-apiserver-client\`; \`usages\` là \`client auth\`. Sau khi approve, cert nằm trong \`.status.certificate\` (cũng là base64 — phải decode). Cuối cùng ghép key + cert vào kubeconfig là user "đăng nhập" được.

\`\`\`bash
# 1. Tạo key + CSR (CN = username, O = group)
openssl genrsa -out dev.key 2048
openssl req -new -key dev.key -subj "/CN=dev-user/O=dev-team" -out dev.csr

# 2. Nộp CertificateSigningRequest (request = base64 MỘT dòng)
cat <<EOF | k apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: dev-user
spec:
  request: $(cat dev.csr | base64 | tr -d '\\n')
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400
  usages: ["client auth"]
EOF

# 3. Duyệt và nhận cert
k get csr                            # đang Pending
k certificate approve dev-user
k get csr dev-user -o jsonpath='{.status.certificate}' | base64 -d > dev.crt

# 4. Ghép vào kubeconfig + cấp quyền + verify
k config set-credentials dev-user --client-key=dev.key --client-certificate=dev.crt --embed-certs
k config set-context dev-ctx --cluster=kubernetes --user=dev-user
k create role dev-role --verb=get,list --resource=pods
k create rolebinding dev-rb --role=dev-role --user=dev-user
k auth can-i list pods --as=dev-user   # yes
\`\`\`

⚠️ **Lỗi thường gặp:** quên \`base64 -d\` khi lấy cert từ \`.status.certificate\` → file .crt là chuỗi base64 vô dụng, kubeconfig báo lỗi khó hiểu. Thứ hai: approve xong mà **quên cấp RBAC** — user xác thực được nhưng làm gì cũng bị "Forbidden"; luôn kết thúc bằng \`k auth can-i\`.`,
      },
      {
        id: "cka-w7-3",
        text: "ServiceAccounts & token",
        lesson: `Nếu certificate user là **thẻ căn cước cho con người**, thì **ServiceAccount (SA)** là **thẻ nhân viên cho robot** — dành cho chương trình chạy **trong Pod** cần gọi API server (controller, CI/CD, monitoring agent...). Mỗi namespace có sẵn SA tên \`default\`; Pod không khai gì sẽ tự dùng SA này.

Thay đổi quan trọng từ **K8s 1.24**: tạo SA **không còn tự sinh Secret chứa token** vĩnh viễn nữa. Token bây giờ là **JWT ngắn hạn** cấp qua TokenRequest API — lấy bằng lệnh \`k create token\`. Pod dùng SA sẽ được tự mount token (tự xoay vòng) tại \`/var/run/secrets/kubernetes.io/serviceaccount/token\`.

Cấp quyền cho SA giống user, chỉ khác cách "gọi tên": trong rolebinding dùng \`--serviceaccount=<namespace>:<tên>\`, còn khi impersonate dùng \`system:serviceaccount:<namespace>:<tên>\`.

\`\`\`bash
# Tạo ServiceAccount và cấp quyền đọc ConfigMap
k create serviceaccount app-sa -n dev
k create role cm-reader --verb=get,list --resource=configmaps -n dev
k create rolebinding cm-reader-rb --role=cm-reader \\
  --serviceaccount=dev:app-sa -n dev

# Gắn SA vào Pod: thêm spec.serviceAccountName
k run api-client --image=nginx -n dev $do > pod.yaml
# sửa pod.yaml, thêm vào spec:
#   serviceAccountName: app-sa

# Token ngắn hạn (K8s >= 1.24 — không còn Secret tự sinh)
k create token app-sa -n dev --duration=1h

# Verify quyền của SA
k auth can-i list configmaps -n dev \\
  --as=system:serviceaccount:dev:app-sa
\`\`\`

⚠️ **Lỗi thường gặp:** đi tìm Secret token "tự sinh" theo kiểu K8s cũ (≤ 1.23) — không tồn tại nữa, phải \`k create token\`. Thứ hai: sai định dạng tên SA — rolebinding cần \`--serviceaccount=dev:app-sa\` (có namespace phía trước), thiếu namespace là quyền không bao giờ khớp dù mọi thứ trông "đúng đúng".`,
      },
      {
        id: "cka-w7-4",
        text: "`kubectl auth can-i` mọi biến thể",
        lesson: `\`kubectl auth can-i\` giống việc **hỏi bảo vệ trước khi xông vào phòng**: "tôi có được phép làm việc X không?" — trả lời \`yes\`/\`no\` ngay lập tức, không cần làm thử rồi ăn lỗi Forbidden. Với admin, sức mạnh thật sự nằm ở **impersonation** (\`--as\`): giả danh user/SA khác để kiểm chứng quyền vừa cấp — đây là bước **verify bắt buộc** sau mọi câu RBAC trong đề thi.

Các biến thể phải thuộc:

- \`-n <ns>\`: kiểm tra trong namespace cụ thể (mặc định là namespace hiện tại!).
- \`--as=<user>\`, \`--as-group=<group>\`: giả danh user/group.
- \`--as=system:serviceaccount:<ns>:<sa>\`: giả danh ServiceAccount.
- \`--subresource=log\`: kiểm tra subresource như \`pods/log\`.
- \`--list\`: liệt kê **toàn bộ** quyền của một chủ thể — cực nhanh để rà soát.
- \`'*' '*'\`: kiểm tra "tôi có phải cluster-admin không?".

\`\`\`bash
k auth can-i create deployments                 # tôi, namespace hiện tại
k auth can-i delete nodes                       # resource cluster-scoped
k auth can-i list pods -n prod                  # namespace cụ thể
k auth can-i get pods --subresource=log         # quyền xem pods/log
k auth can-i get /healthz                       # non-resource URL
k auth can-i '*' '*'                            # tôi là cluster-admin?
k auth can-i list secrets --as=dev-user -n dev  # giả danh user
k auth can-i get pods --as=system:serviceaccount:dev:app-sa -n dev
k auth can-i --list --as=dev-user -n dev        # liệt kê TOÀN BỘ quyền
\`\`\`

⚠️ **Lỗi thường gặp:** quên \`-n\` — lệnh trả kết quả cho namespace **hiện tại** chứ không phải namespace đề yêu cầu, dẫn tới kết luận sai. Thứ hai: chạy \`k auth can-i\` mà **quên \`--as\`** khi đang là admin — kết quả luôn \`yes\` (quyền của admin!), khiến bạn tưởng nhầm RBAC cho user mới đã đúng.`,
      },
      {
        id: "cka-w7-5",
        text: "Helm & Kustomize trong curriculum CKA",
        lesson: `Curriculum CKA mới đưa hai công cụ quản lý manifest vào đề — cần dùng thạo ở mức cơ bản. **Helm** giống **App Store của Kubernetes**: phần mềm đóng gói thành **chart** có version, cài/gỡ/nâng cấp/rollback bằng một lệnh, tùy biến qua **values**. **Kustomize** lại giống **tấm giấy dán đè lên bản gốc**: giữ nguyên bộ YAML **base**, mỗi môi trường là một **overlay** chứa các patch nhỏ (đổi replicas, thêm prefix, đổi image) — không template, không copy-paste, và đã **tích hợp sẵn trong kubectl** qua cờ \`-k\`.

Chọn công cụ nào? Đề bảo "cài đặt phần mềm bên thứ ba từ chart" → Helm. Đề bảo "áp dụng thư mục có \`kustomization.yaml\`" → Kustomize. Nhớ thêm: mỗi lần cài Helm chart tạo một **release** gắn với namespace.

\`\`\`bash
# --- Helm ---
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx --versions | head -5   # tìm chart + version
helm install web bitnami/nginx -n web --create-namespace \\
  --set replicaCount=2                        # override values
helm list -A                                  # mọi release, mọi namespace
helm upgrade web bitnami/nginx -n web --set replicaCount=3
helm history web -n web
helm rollback web 1 -n web                    # quay về revision 1
helm uninstall web -n web

# --- Kustomize (có sẵn trong kubectl) ---
k kustomize overlays/prod                     # render thử, CHƯA apply
k apply -k overlays/prod                      # build + apply
k delete -k overlays/prod
\`\`\`

⚠️ **Lỗi thường gặp:** quên \`-n\` với các lệnh Helm — release nằm ở namespace khác nên \`helm list\` không thấy, tưởng cài thất bại rồi cài lại lần nữa. Thứ hai: chạy \`k apply -f\` vào thư mục Kustomize thay vì \`-k\` → hoặc lỗi, hoặc apply YAML thô **bỏ qua toàn bộ patch** của overlay.`,
      },
      {
        id: "cka-w7-6",
        text: "CRD & Operator: cài CRD, tạo custom resource",
        lesson: `Kubernetes như một người chỉ hiểu các "từ" có sẵn trong từ điển: Pod, Deployment, Service... **CRD (CustomResourceDefinition)** là cách **thêm từ mới vào từ điển** — sau khi cài CRD, bạn \`k get backups\` tự nhiên như resource chuẩn. Nhưng từ điển chỉ **định nghĩa**, không **hành động**: **Operator** = một controller (thường chạy dạng Deployment) liên tục theo dõi custom resource và biến "mong muốn" thành hiện thực — ví dụ cert-manager thấy object \`Certificate\` thì tự đi xin cert thật.

Với CKA, yêu cầu ở mức: **cài CRD từ file/URL, tạo custom resource, liệt kê chúng**. Cấu trúc CRD cần nhớ: \`group\`, \`scope\` (Namespaced/Cluster), \`names\` (plural/singular/kind/shortNames) và danh sách \`versions\` kèm schema. Lệnh kiểm tra: \`k get crd\`, \`k api-resources | grep <group>\`, \`k explain <kind>\`.

\`\`\`yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: backups.demo.example.com     # BẮT BUỘC dạng <plural>.<group>
spec:
  group: demo.example.com
  scope: Namespaced                  # hoặc Cluster
  names:
    plural: backups
    singular: backup
    kind: Backup
    shortNames: ["bk"]               # cho phép: k get bk
  versions:
  - name: v1
    served: true
    storage: true                    # đúng 1 version có storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              schedule: { type: string }
---
# Custom resource dùng "từ mới" vừa định nghĩa
apiVersion: demo.example.com/v1
kind: Backup
metadata:
  name: nightly
spec:
  schedule: "0 2 * * *"
\`\`\`

⚠️ **Lỗi thường gặp:** \`metadata.name\` của CRD phải **đúng dạng \`<plural>.<group>\`** — lệch một ký tự là API server từ chối ngay. Thứ hai: apply CR ngay sau CRD đôi khi gặp "no matches for kind" — chờ CRD Established một nhịp; và nhớ rằng **xóa CRD sẽ xóa sạch mọi custom resource** thuộc nó.`,
      },
    ],
  },
  {
    id: "cka-w8",
    week: "Tuần 8",
    title: "Troubleshooting ⭐⭐ (30% đề thi)",
    goal: "Tuần quan trọng nhất — CKA là kỳ thi \"sửa cluster hỏng\".",
    practice: "Mỗi ngày tự phá cluster rồi sửa: dừng kubelet, sửa sai image trong etcd.yaml, đổi port apiserver, xóa CNI config. Killercoda có sẵn nhiều scenario.",
    resources: [
      { label: "CKA Cheat Sheet — mục Troubleshooting", href: "#/docs/cka-cheat-sheet" },
      { label: "Lab 12 — Debug CrashLoopBackOff", href: "#/labs/lab12" },
      { label: "Lab 22 — Debug Service endpoints", href: "#/labs/lab22" },
      { label: "Killercoda — CKA troubleshooting scenarios", href: "https://killercoda.com/killer-shell-cka" },
      { label: "Kubernetes Docs — Troubleshooting Clusters", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
    ],
    items: [
      {
        id: "cka-w8-1",
        text: "Node NotReady: ssh → `systemctl status kubelet` → `journalctl -u kubelet`",
        lesson: `Debug node NotReady giống **bác sĩ cấp cứu** tiếp nhận bệnh nhân bất tỉnh: nhìn tổng quát trước (\`k get nodes\` — ai đang gục?), đến tận giường bệnh (\`ssh node01\`), đo sinh hiệu (\`systemctl status kubelet\`), rồi mới đọc bệnh án chi tiết (\`journalctl -u kubelet\`). Đi từ **triệu chứng tổng quát xuống chi tiết**, đừng đoán mò.

Vì kubelet là "nhịp tim" của node — nó ngừng báo cáo là node NotReady — nên 90% ca bệnh rơi vào bốn nguyên nhân: kubelet **bị dừng**, **config sai** (\`/var/lib/kubelet/config.yaml\`), **sai đường dẫn cert**, hoặc **container runtime chết**. Log của journalctl sẽ chỉ đích danh:

\`\`\`bash
k get nodes                                    # node nào NotReady?
k describe node node01 | grep -A5 Conditions   # lý do sơ bộ

ssh node01                                     # đến đúng máy!
systemctl status kubelet                       # active? inactive? failed?
systemctl enable --now kubelet                 # nếu chỉ bị dừng → xong

# Nếu failed → đọc log tìm "thủ phạm":
journalctl -u kubelet --no-pager | tail -30
# "failed to load Kubelet config file" → sai path /var/lib/kubelet/config.yaml
# "unable to load client CA file"      → sai đường dẫn cert trong config
# "no CNI configuration"               → thiếu file trong /etc/cni/net.d/
systemctl status containerd                    # runtime có sống không?

# Sửa config xong phải reload + restart:
systemctl daemon-reload && systemctl restart kubelet
exit                                           # QUAY VỀ máy chính!
k get nodes                                    # verify: Ready
\`\`\`

⚠️ **Lỗi thường gặp:** quên gõ \`exit\` sau khi ssh — câu tiếp theo bạn thao tác nhầm trên node worker, vừa sai kết quả vừa dễ phá thêm; luôn verify \`k get nodes\` **từ máy chính**. Thứ hai: chỉ \`systemctl start\` mà không \`enable\` — node reboot là kubelet lại "ngất", dùng \`enable --now\` cho chắc.`,
      },
      {
        id: "cka-w8-2",
        text: "Control plane hỏng: kiểm tra static pod manifest, `crictl ps -a` / `crictl logs`",
        lesson: `Khi apiserver — "tổng đài" của cluster — chết, thì chính chiếc điện thoại \`kubectl\` cũng thành cục gạch. Lúc này phải **đi bộ đến tận nơi**: SSH vào control plane và dùng \`crictl\` nói chuyện **trực tiếp với container runtime**, không cần qua apiserver.

Nhớ bản chất: control plane cài bằng kubeadm chạy dưới dạng **static pods** — kubelet đọc manifest trong \`/etc/kubernetes/manifests/\` và tự chạy chúng. Vậy nên: **sửa file manifest = kubelet tự restart component**. Trong đề, "cluster hỏng" hầu như luôn là một manifest bị sửa sai: image tag không tồn tại, tên flag gõ nhầm, đường dẫn cert sai, hoặc etcd endpoint sai.

\`\`\`bash
ssh controlplane
crictl ps -a | grep -e apiserver -e etcd     # Running? Exited? biến mất?
crictl logs <container-id> 2>&1 | tail -20   # đọc lỗi thẳng từ runtime

# Soi manifest — nơi 90% "thủ phạm" ẩn náu:
ls /etc/kubernetes/manifests/
vim /etc/kubernetes/manifests/kube-apiserver.yaml
# kiểm tra kỹ: image tag, chính tả flag, đường dẫn cert, etcd endpoint, port

# Lưu file xong — kubelet TỰ restart static pod, chờ 30-60 giây:
watch crictl ps                              # apiserver lên lại chưa?
exit
k get pods -n kube-system                    # verify từ máy chính
\`\`\`

Nếu \`crictl ps -a\` không thấy container apiserver nào (kể cả Exited), khả năng cao manifest **sai cú pháp YAML** — kubelet không tạo nổi pod; đọc \`journalctl -u kubelet\` sẽ thấy lỗi parse.

⚠️ **Lỗi thường gặp:** sửa manifest xong lập tức chạy \`k get pods\` thấy vẫn lỗi rồi hoảng — static pod cần **30–60 giây** để restart, hãy kiên nhẫn \`watch crictl ps\`. Thứ hai: cố "restart" bằng \`k delete pod kube-apiserver-...\` — vô ích, đó chỉ là **mirror pod**; muốn restart thật thì sửa (hoặc move ra/vào) file manifest.`,
      },
      {
        id: "cka-w8-3",
        text: "kubectl không kết nối được: kubeconfig sai, sai port/địa chỉ apiserver",
        lesson: `Gọi điện không ai bắt máy có **hai** khả năng: tổng đài chết — hoặc bạn **bấm nhầm số**. Trước khi lao vào "cấp cứu" apiserver, hãy kiểm tra "số điện thoại" trong kubeconfig: lỗi kinh điển của đề thi là \`server:\` bị đổi port **6443 → 6433** hoặc trỏ sai IP, trong khi apiserver vẫn sống khỏe.

Đọc kỹ error message — nó phân loại bệnh giúp bạn:

- \`connection refused\` → đến đúng máy nhưng **không gì lắng nghe ở port đó**: sai port trong kubeconfig, hoặc apiserver chết thật.
- \`no such host\` / \`i/o timeout\` → **sai địa chỉ**/DNS/mạng.
- \`certificate signed by unknown authority\` → sai CA / trỏ nhầm cluster.
- \`Unauthorized\` → kết nối tốt, nhưng **sai user/cert** (bệnh khác hẳn!).

\`\`\`bash
k get nodes                              # đọc KỸ message lỗi trước đã
k config view | grep server              # URL + port đúng chưa? (6443!)
k config current-context                 # đang đứng ở context nào?
k config get-contexts                    # context trỏ đúng cluster/user?

# Đối chiếu thực tế trên control plane:
ssh controlplane
ss -tlnp | grep 6443                     # apiserver có đang lắng nghe?
crictl ps -a | grep apiserver            # container có sống không?
exit

# Nếu kubeconfig sai (vd 6433 → 6443):
vim ~/.kube/config                       # sửa dòng server:
k get nodes                              # verify
\`\`\`

⚠️ **Lỗi thường gặp:** thấy kubectl lỗi liền SSH vào sửa manifest apiserver trong khi thủ phạm chỉ là **một con số trong kubeconfig** — mất 15 phút cho bài 2 phút; luôn soi kubeconfig trước. Thứ hai: nhiều câu trong đề dùng \`--context\` riêng — làm xong quên chuyển về context của câu sau, mọi lệnh tiếp theo đánh nhầm cluster.`,
      },
      {
        id: "cka-w8-4",
        text: "Debug Service/DNS: endpoints rỗng, CoreDNS chết, kube-proxy lỗi",
        lesson: `Ứng dụng trong cluster gọi nhau qua ba lớp: **danh bạ** (DNS/CoreDNS dịch tên ra IP), **tổng đài** (Service chọn Pod đang trực), và **đường dây** (kube-proxy lập rule chuyển tiếp trên mỗi node). Frontend không gọi được backend nghĩa là đứt ở **một trong ba lớp** — khám lần lượt, đừng nhảy cóc.

Thứ tự khám bệnh: (1) \`k get endpoints\` — danh sách "người trực tổng đài"; **rỗng** nghĩa là selector không khớp label hoặc Pod chưa Ready (readiness probe fail). (2) CoreDNS trong \`kube-system\` — có Running không, có bị scale về 0 không. (3) kube-proxy là DaemonSet — đủ pod trên mọi node không.

\`\`\`bash
# 1. Tổng đài có ai trực không?
k get endpoints web-svc                 # RỖNG → selector sai / pod chưa Ready
k describe svc web-svc | grep -i selector
k get pods --show-labels                # label có khớp selector không?

# 2. Danh bạ DNS còn sống không?
k get pods -n kube-system -l k8s-app=kube-dns   # CoreDNS Running? mấy replica?
k logs -n kube-system -l k8s-app=kube-dns
k run tmp --image=busybox:1.28 --rm -it --restart=Never \\
  -- nslookup kubernetes.default        # test phân giải chuẩn

# 3. Đường dây kube-proxy
k get ds -n kube-system kube-proxy      # DESIRED = READY?
k logs -n kube-system -l k8s-app=kube-proxy | tail -20

# Mẹo khoanh vùng: gọi bằng IP được mà bằng tên thì không → lỗi DNS
k exec <pod> -- cat /etc/resolv.conf    # nameserver = ClusterIP của kube-dns?
\`\`\`

⚠️ **Lỗi thường gặp:** chỉ nhìn \`k get pods\` thấy Running mà bỏ qua cột READY — Pod fail readiness probe vẫn Running nhưng bị **loại khỏi endpoints**, Service "chết lặng". Thứ hai: test DNS bằng image busybox mới nhất — \`nslookup\` của nó hay trả kết quả lạ; dùng đúng \`busybox:1.28\` cho ổn định.`,
      },
      {
        id: "cka-w8-5",
        text: "Debug application (ôn CKAD): CrashLoopBackOff, ImagePullBackOff…",
        lesson: `Mỗi STATUS của Pod là một **"mã bệnh"** mà bác sĩ trực đọc phát biết ngay hướng khám: **ImagePullBackOff** — không lấy được thuốc về (image/tag sai, registry cần đăng nhập); **CrashLoopBackOff** — bệnh nhân tỉnh dậy rồi ngất liên tục (app chết ngay sau khi start: lỗi config, thiếu env, command sai); **Pending** — chưa xếp được giường (không node nào đủ CPU/RAM, hoặc vướng taint); **ContainerCreating** kéo dài — chờ thủ tục (volume không mount được, CNI lỗi).

Hai công cụ vàng: \`k describe pod\` với mục **Events** ở cuối (thủ phạm thường tự khai ở đây), và \`k logs --previous\` — đọc log của **lần chạy trước** khi container hiện tại đã bị restart.

\`\`\`bash
k get pods                              # đọc STATUS + cột RESTARTS
k describe pod web-abc                  # Events ở cuối = manh mối chính

# CrashLoopBackOff → log của LẦN CHẠY TRƯỚC:
k logs web-abc --previous
k logs web-abc -c init-db               # pod nhiều container: chỉ định -c

# ImagePullBackOff → soi và sửa image:
k get pod web-abc -o jsonpath='{.spec.containers[0].image}'
k set image deploy/web web=nginx:1.27   # sửa image cho deployment

# Pending → tìm lý do trong Events:
k get events --field-selector involvedObject.name=web-abc
k describe node | grep -i taint         # vướng taint?
k top nodes                             # hết tài nguyên?
\`\`\`

⚠️ **Lỗi thường gặp:** chạy \`k logs\` trên container đang crash — nhận log của lần khởi động **mới** (thường trống trơn) rồi kết luận "không có log"; phải thêm \`--previous\`. Thứ hai: cố \`k edit\` field immutable của Pod trần (image thì sửa được, command/env thì không) — đúng bài là export YAML, \`k delete\`, sửa file rồi apply lại.`,
      },
      {
        id: "cka-w8-6",
        text: "Xem log khi apiserver chết: `crictl`, `/var/log/pods/`",
        lesson: `Bình thường muốn biết chuyện gì xảy ra, bạn "gọi điện hỏi" bằng \`k logs\` — nhưng cuộc gọi đó **đi qua apiserver**, nên khi apiserver chết thì kubectl câm lặng đúng lúc bạn cần nó nhất. May mắn: mọi container vẫn cần mẫn **ghi nhật ký xuống đĩa của node**, và có hai cửa sau để đọc.

**Cửa 1 — \`crictl\`**: CLI nói chuyện thẳng với container runtime (containerd) qua socket, hoàn toàn không cần apiserver. **Cửa 2 — file log trên đĩa**: \`/var/log/pods/<namespace>_<pod>_<uid>/<container>/*.log\`; còn \`/var/log/containers/\` là các symlink đặt tên phẳng, rất tiện để grep.

\`\`\`bash
ssh controlplane                  # kubectl vô dụng → làm việc tại node

# Cửa 1: crictl — thẳng tới containerd
crictl ps -a                      # mọi container, kể cả Exited
crictl logs <container-id> 2>&1 | tail -30

# Cửa 2: đọc file log trên đĩa
ls /var/log/pods/                 # thư mục dạng <ns>_<pod>_<uid>
tail -30 /var/log/pods/kube-system_kube-apiserver-*/kube-apiserver/*.log

# /var/log/containers/ = symlink tên phẳng, grep cực nhanh:
ls /var/log/containers/ | grep apiserver

# Không thấy container nào cả? → kubelet không tạo nổi pod:
journalctl -u kubelet --no-pager | tail -20
exit
\`\`\`

Kịch bản điển hình: apiserver crash vì flag sai → \`crictl ps -a\` thấy container **Exited** → \`crictl logs\` chỉ đích danh flag lỗi → sửa manifest → chờ restart.

⚠️ **Lỗi thường gặp:** loay hoay gõ \`k logs\` khi apiserver đã chết — tốn thời gian vô ích, phản xạ đúng là chuyển ngay sang \`crictl\`/\`/var/log/pods/\`. Thứ hai: manifest **sai cú pháp YAML** thì kubelet không tạo pod nào cả — \`crictl ps -a\` trống trơn và **không có log container**; lúc đó manh mối duy nhất nằm trong \`journalctl -u kubelet\`.`,
      },
      {
        id: "cka-w8-7",
        text: "`kubectl get events`, `kubectl top` (metrics-server)",
        lesson: `Hai công cụ quan sát cuối cùng trong "vali bác sĩ": **events** là cuốn **nhật ký ca trực** của cluster — mọi biến cố (schedule, pull image, probe fail, kill OOM...) đều được ghi lại kèm thời gian; còn \`kubectl top\` là **máy đo sinh hiệu** CPU/RAM — nhưng máy này cần lắp "cảm biến" trước: **metrics-server** phải chạy trong cluster.

Điều ít người để ý: \`k get events\` mặc định **không sắp theo thời gian** — phải tự thêm \`--sort-by\`. Và events chỉ được giữ khoảng **1 giờ** (TTL mặc định), sự cố cũ hơn phải truy qua log.

\`\`\`bash
# Events — LUÔN sort theo thời gian để đọc như một câu chuyện:
k get events -A --sort-by=.metadata.creationTimestamp
k get events -n dev --field-selector type=Warning        # chỉ tin xấu
k get events --field-selector involvedObject.name=web-abc # theo 1 object
k describe pod web-abc                    # Events liên quan nằm cuối describe

# Top — cần metrics-server hoạt động:
k top nodes                               # node nào đang quá tải?
k top pods -A --sort-by=cpu               # pod ngốn CPU nhất toàn cluster
k top pods -n dev --containers            # chi tiết từng container

# "error: Metrics API not available"? → khám metrics-server:
k get pods -n kube-system | grep metrics-server
k logs -n kube-system -l k8s-app=metrics-server
\`\`\`

Trong đề troubleshooting, cặp lệnh này là **bước khoanh vùng đầu tiên** khi triệu chứng mơ hồ ("app chậm", "pod hay bị restart"): events kể chuyện gì vừa xảy ra, top chỉ ra ai đang nghẹt thở vì thiếu tài nguyên — từ đó mới đi sâu vào describe/logs.

⚠️ **Lỗi thường gặp:** thấy \`k top\` báo "Metrics API not available" liền tưởng cluster hỏng nặng — thực ra chỉ là **metrics-server thiếu hoặc chết**, một pod bình thường trong kube-system. Thứ hai: đọc events không sort — sự kiện mới nằm lẫn giữa trang, dựng sai trình tự câu chuyện và chẩn đoán sai bệnh.`,
      },
    ],
  },
  {
    id: "cka-w9",
    week: "Tuần 9–10",
    title: "Luyện đề",
    goal: "Chỉ tiêu tốc độ: etcd backup/restore < 5 phút, user CSR < 5 phút, node NotReady < 5 phút.",
    practice: "Đăng ký killer.sh CKA và làm 2 lượt trong tuần cuối.",
    resources: [
      { label: "killer.sh — CKA Simulator chính thức", href: "https://killer.sh" },
      { label: "Killercoda — CKA scenarios miễn phí", href: "https://killercoda.com/killer-shell-cka" },
      { label: "Luyện đề trong app", href: "#/exam" },
      { label: "Quiz ôn tập", href: "#/quiz" },
      { label: "Tra cứu lệnh nhanh", href: "#/commands" },
      { label: "CKA Cheat Sheet", href: "#/docs/cka-cheat-sheet" },
    ],
    items: [
      {
        id: "cka-w9-1",
        text: "Ôn imperative commands (Cheat Sheet CKAD + CKA)",
        lesson: `Tuần luyện đề bắt đầu bằng việc đưa các lệnh imperative về **trí nhớ cơ bắp**: trong phòng thi, mỗi giây ngồi nhớ cú pháp là một giây mất điểm. Phương pháp: mỗi sáng dành **15 phút**, đóng Cheat Sheet lại, gõ trọn bộ lệnh dưới đây từ trí nhớ — lệnh nào vấp thì đánh dấu, hôm sau gõ lại lệnh đó **ba lần**. Ôn cả hai Cheat Sheet: phần workloads/service của CKAD và phần node/RBAC riêng của CKA.

\`\`\`bash
export do="--dry-run=client -o yaml"      # thiết lập quen thuộc
k run web --image=nginx $do > pod.yaml
k create deploy api --image=nginx --replicas=3 $do
k expose deploy api --port=80 --target-port=8080 --type=NodePort
k create role r1 --verb=get,list --resource=pods
k create rolebinding rb1 --role=r1 --user=dev-user
k create serviceaccount app-sa && k create token app-sa
k taint node node01 env=prod:NoSchedule   # xóa: thêm dấu - cuối
k cordon node01 && k drain node01 --ignore-daemonsets
k uncordon node01
k autoscale deploy api --min=2 --max=10 --cpu-percent=70
\`\`\`

⚠️ **Lỗi thường gặp:** ôn bằng cách **đọc lại** cheat sheet thay vì **gõ lại** — mắt nhớ nhưng tay quên; chỉ có gõ mới tạo phản xạ. Thứ hai: học lệnh mà bỏ quên \`$do\` — quên generate YAML là mất khả năng chỉnh sửa trước khi apply.`,
      },
      {
        id: "cka-w9-2",
        text: "Mock exams bấm giờ 2 tiếng: Killercoda CKA, KodeKloud",
        lesson: `Mock exam chỉ có giá trị khi **giống thi thật**: đồng hồ đếm 2 tiếng, không pause, tài liệu duy nhất là kubernetes.io/docs. Kỷ luật thời gian: 15–20 câu trong 120 phút → trung bình **6–7 phút/câu**; câu nào bế tắc quá 5 phút thì **ghi số câu ra giấy nháp, bỏ qua, đi tiếp** — quay lại khi còn giờ. Làm xong mock, phần quan trọng nhất mới bắt đầu: dành **1 tiếng chữa bài**, làm lại từng câu sai đến khi trơn tay. Một mock được chữa kỹ đáng giá hơn ba mock làm ào ào.

\`\`\`bash
# 60 giây đầu MỌI lần mock — thiết lập y như thi thật:
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"     # xóa pod không chờ

# Nghi thức mỗi câu: context → làm → VERIFY → exit (nếu có ssh) → câu sau
k config use-context <context-của-câu>    # đề ghi rõ từng câu — ĐỌC KỸ
\`\`\`

⚠️ **Lỗi thường gặp:** quên chuyển context đầu câu — làm đúng bài nhưng **sai cluster**, 0 điểm; hãy biến \`use-context\` thành phản xạ. Thứ hai: sa lầy 15 phút vào một câu khó đầu đề trong khi cuối đề còn câu dễ ăn điểm — điểm mọi câu như nhau về giá trị thời gian.`,
      },
      {
        id: "cka-w9-3",
        text: "killer.sh CKA — 2 session kèm voucher",
        lesson: `Voucher thi CKA tặng kèm **2 session killer.sh** — simulator sát thi thật nhất và **khó hơn đề thật**, nên điểm thấp đừng hoảng. Mỗi session mở trong **36 giờ**, và hai session dùng **cùng một bộ câu hỏi** — hãy khai thác điều đó: **Session 1** làm đầu tuần cuối, bấm giờ đúng 2 tiếng, chấm điểm rồi dành nguyên buổi đọc **solutions** (phần giá trị nhất — nhiều mẹo tốc độ không có trong docs). **Session 2** làm trước ngày thi 2–3 ngày, mục tiêu **> 90%** và dư thời gian.

\`\`\`bash
# Hết 2 tiếng, môi trường VẪN MỞ trong 36h — tận dụng để chữa bài:
# - So từng câu với score sheet, ghi câu sai vào sổ tay
# - Làm lại NGAY câu sai trong chính môi trường đó
# Ví dụ tự chấm nhanh một câu RBAC:
k auth can-i list pods --as=dev-user -n dev    # đáp án yêu cầu "yes"?
k get nodes                                    # câu sửa node: Ready chưa?
\`\`\`

⚠️ **Lỗi thường gặp:** đốt cả 2 session liền nhau trong một ngày — mất cơ hội đo tiến bộ sau khi chữa bài. Thứ hai: làm xong chỉ xem điểm rồi tắt — bỏ phí solutions, thứ đáng tiền nhất của killer.sh.`,
      },
      {
        id: "cka-w9-4",
        text: "Luyện chỉ tiêu tốc độ các bài trọng điểm",
        lesson: `Ba dạng bài "quốc dân" của CKA phải đạt chuẩn **dưới 5 phút mỗi bài**: (1) **etcd backup/restore**, (2) **tạo user CSR → kubeconfig**, (3) **sửa node NotReady**. Cách luyện như học **bài văn mẫu**: viết trọn quy trình ra giấy từ trí nhớ → dựng scenario trên Killercoda → bấm \`time\` đo thật → lặp lại đến khi tay tự chạy không cần nghĩ. Chưa đạt 5 phút thì chưa chuyển bài khác — đây là những câu điểm cao, làm nhanh để dồn thời gian cho phần troubleshooting lạ.

\`\`\`bash
# Đo thời gian thật cho bài "văn mẫu" etcd backup:
time ( \\
  ETCDCTL_API=3 etcdctl snapshot save /opt/etcd.db \\
    --endpoints=https://127.0.0.1:2379 \\
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
    --cert=/etc/kubernetes/pki/etcd/server.crt \\
    --key=/etc/kubernetes/pki/etcd/server.key \\
)
# Chỉ tiêu: backup + restore trọn gói < 5 phút
# CSR → kubeconfig < 5 phút ; node NotReady < 5 phút
\`\`\`

⚠️ **Lỗi thường gặp:** luyện restore mà quên bước **sửa \`hostPath\` trong etcd.yaml** trỏ sang data-dir mới — snapshot restore xong cluster vẫn dùng data cũ. Thứ hai: bấm giờ nhưng bỏ qua bước **verify** (\`k get nodes\`, \`k get pods -A\`) — thi thật chấm kết quả cuối, không chấm tốc độ gõ.`,
      },
      {
        id: "cka-w9-5",
        text: "Checklist hậu cần thi (giống CKAD)",
        lesson: `Đừng để công sức 10 tuần đổ vì chuyện hậu cần. Thi CKA từ xa qua **PSI Secure Browser**: cần phòng **riêng tư, yên tĩnh**, bàn trống trơn, một màn hình duy nhất, webcam và mạng ổn định. Giấy tờ tùy thân phải **khớp chính xác tên đăng ký** (hộ chiếu là an toàn nhất). Môi trường thi là **remote desktop XFCE**: terminal và Firefox nằm **bên trong** desktop đó, chỉ được mở tài liệu kubernetes.io/docs. Vào sớm 30 phút cho thủ tục quét phòng — proctor sẽ yêu cầu xoay webcam khắp nơi.

\`\`\`bash
# T-3 ngày : chạy PSI system check (link trong email xác nhận)
# T-1 ngày : dọn bàn — chỉ còn máy, chuột, bàn phím, giấy tờ, nước chai trong suốt bỏ nhãn
# T-30 phút: đăng nhập, quét phòng bằng webcam theo hướng dẫn proctor
# Trong thi (remote desktop XFCE):
#   - alias k đã có sẵn; thiết lập thêm: export do="--dry-run=client -o yaml"
#   - Copy/paste TRONG terminal: Ctrl+Shift+C / Ctrl+Shift+V
#   - Firefox chỉ mở kubernetes.io/docs — không tab nào khác
\`\`\`

⚠️ **Lỗi thường gặp:** phút chót mới chạy system check, phát hiện webcam/OS không tương thích thì đã muộn — kiểm tra trước **3 ngày**. Thứ hai: quen dùng Ctrl+C/Ctrl+V để paste trong terminal của remote desktop — Ctrl+C là **hủy lệnh**; tập phản xạ Ctrl+Shift+V từ tuần luyện đề.`,
      },
    ],
  },
];
