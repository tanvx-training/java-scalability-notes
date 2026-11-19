// Chặng 6 — Bảo mật truy cập: PKI, kubeconfig, RBAC.
// s33–s34 đã phát hành (đợt 4); s35–s36 là buổi khung: đủ trường cấu trúc (check-data PR7), nội dung đầy đủ ở task sau.

export const sessions = [
  {
    id: "s33",
    stage: "st6",
    title: "PKI của cluster, openssl và CSR cho user mới",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-rbac"],
    requires: ["s32"],
    status: "published",
    pieces: [],
    goals: [
      "Đọc chứng chỉ apiserver bằng openssl: ai ký, SAN gồm những tên nào, hết hạn khi nào.",
      "Cấp danh tính cho user dev và ops: tạo key, CSR với CN/O đúng, gửi CertificateSigningRequest, approve, lấy cert về.",
      "Giải thích Kubernetes lấy username và group từ trường nào của chứng chỉ.",
    ],
    skills: [
      { skill: "lx-openssl-req", level: "Gõ được có tra" },
      { skill: "lx-openssl-x509", level: "Gõ được không tra" },
      { skill: "net-tls-chain", level: "Giải thích được" },
      { skill: "k-csr-yaml", level: "Viết được có tra" },
      { skill: "k-get-csr", level: "Gõ được không tra" },
      { skill: "k-certificate-approve", level: "Gõ được không tra" },
      { skill: "k-new-user-flow", level: "Dưới 6 phút" },
    ],
    uses: ["k-pki-dir", "lx-base64", "k-certs-check-expiration", "k-secret-jsonpath"],
    foundation: {
      area: "network",
      md: `**Chuỗi chứng chỉ trong một trang** (kỹ năng \`net-tls-chain\`). Buổi này đọc và tạo chứng chỉ X.509, nên cần chắc ba ý sau.

**1. Chứng chỉ là một lời khẳng định có chữ ký.** Nó gói một **public key** với một **subject** (\`CN=dev, O=shop-dev\`), thời hạn (\`notBefore\`/\`notAfter\`) và phần mở rộng (SAN, Key Usage, Extended Key Usage, \`CA:TRUE/FALSE\`), rồi được **issuer** ký bằng private key của issuer. Ai có cert của issuer (public key của nó) thì kiểm được chữ ký. Private key của chủ cert không bao giờ nằm trong cert; nó nằm riêng trong tệp \`.key\` và không rời máy.

**2. Kiểm một cert là đi ngược chuỗi tới một CA mình tin.** Leaf (\`apiserver.crt\`) do CA (\`ca.crt\`) ký; CA tự ký chính nó (issuer = subject) và được tin vì bạn **đặt nó vào chỗ tin cậy** (truststore), không phải vì chữ ký của nó. Có thể có CA trung gian ở giữa; kubeadm dùng chuỗi phẳng: một CA ký thẳng các leaf. Người kiểm còn soát: cert còn hạn, dùng đúng mục đích (EKU \`serverAuth\` cho server, \`clientAuth\` cho client), và **tên mình gọi nằm trong SAN** của cert server. Gọi \`https://192.168.252.35:6443\` mà IP đó không có trong SAN thì client từ chối dù chữ ký đúng.

**3. mTLS: cả hai phía cùng trình cert.** TLS thường chỉ server chứng minh danh tính. Với mTLS, server đòi client gửi cert và kiểm nó bằng CA mà server tin. kube-apiserver làm đúng như vậy: \`--client-ca-file=/etc/kubernetes/pki/ca.crt\`; cert client nào do CA đó ký và còn hạn là **đã xác thực**, và apiserver lấy **CN làm username, mỗi O là một group**. Không có object User nào trong Kubernetes.

| Khái niệm Java | Trong cluster | Trong buổi này |
|---|---|---|
| **keystore** (private key + chuỗi cert của mình) | \`client-key-data\` + \`client-certificate-data\` của kubeconfig | \`~/users/dev.key\` + \`~/users/dev.crt\` |
| **truststore** (CA mình tin) | \`certificate-authority-data\` của kubeconfig; \`--client-ca-file\` của apiserver | \`/etc/kubernetes/pki/ca.crt\` |
| mTLS ở Spring Boot: \`server.ssl.client-auth=need\` + \`server.ssl.trust-store\` | apiserver bắt buộc cert client do CA ký (hay token) | bạn tạo cert client cho dev, ops |
| Spring Security \`http.x509(…)\`: lấy username từ CN của subject (\`subjectPrincipalRegex\`) | CN → username, O → group | \`CN=dev\`, \`O=shop-dev\` |

Spring Boot 3.1+ đọc thẳng PEM bằng SSL bundle (\`spring.ssl.bundle.pem.<tên>.keystore.certificate\`, \`.private-key\`, \`.truststore.certificate\`), nên cặp \`dev.crt\`/\`dev.key\` của buổi này dùng được cho một client Java mà không phải đổi định dạng; bản cũ hơn cần PKCS#12: \`openssl pkcs12 -export -in dev.crt -inkey dev.key -out dev.p12\`.

**Bài tập nền (5 phút, trên cka-cp):** xem chuỗi mà apiserver trình ra và kiểm nó bằng CA của cluster:

\`\`\`bash
openssl s_client -connect 192.168.252.35:6443 -CAfile /etc/kubernetes/pki/ca.crt </dev/null 2>/dev/null | grep -E 'subject=|issuer=|Verify return code'
# subject=CN=kube-apiserver
# issuer=CN=kubernetes
#     Verify return code: 0 (ok)
# Verify return code: 0 (ok)
\`\`\`

Bỏ \`-CAfile\` thì dòng cuối là \`Verify return code: 21 (unable to verify the first certificate)\`: máy không tin CA \`kubernetes\` cho tới khi bạn đưa nó vào truststore.`,
    },
    mindset: `**Kubernetes không lưu user.** Không có \`kubectl create user\`. apiserver nhận danh tính từ authenticator: cert client (bài này), bearer token (ServiceAccount, s35), OIDC. Với cert: CA của cluster ký là tin, **CN là username, mỗi O là một group**. Ai nắm \`ca.key\` là tạo được bất kỳ danh tính nào, nên tệp đó là thứ quý nhất trên control plane.

**PKI của kubeadm ở \`/etc/kubernetes/pki\`.** Ba CA riêng, mỗi CA ký một nhóm leaf:

| CA | Ký cho | Dùng làm gì |
|---|---|---|
| \`ca.crt\` (\`CN=kubernetes\`, 10 năm) | \`apiserver.crt\` (server), \`apiserver-kubelet-client.crt\`, cert client trong \`admin.conf\`, \`super-admin.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`, cert kubelet; **và mọi CSR \`kube-apiserver-client\`** | tin cậy chung của cluster; \`--client-ca-file\` của apiserver |
| \`etcd/ca.crt\` | \`etcd/server.crt\`, \`etcd/peer.crt\`, \`etcd/healthcheck-client.crt\`, \`apiserver-etcd-client.crt\` | chỉ etcd và người gọi etcd |
| \`front-proxy-ca.crt\` | \`front-proxy-client.crt\` | aggregation layer (metrics-server…) |

\`sa.key\`/\`sa.pub\` không phải cert: cặp khoá ký token của ServiceAccount. Leaf của kubeadm sống **1 năm** (\`kubeadm certs check-expiration\`, \`kubeadm upgrade\` tự gia hạn, chuyện của s44); CA 10 năm.

**Ba danh tính admin của kubeadm (1.29+).** \`admin.conf\` mang \`CN=kubernetes-admin, O=kubeadm:cluster-admins\`, group được ClusterRoleBinding gắn \`cluster-admin\`: gỡ binding là tước được quyền. \`super-admin.conf\` mang \`O=system:masters\`, group **bỏ qua RBAC** hoàn toàn, chỉ để cứu hộ. Vì thế signer \`kube-apiserver-client\` **từ chối** CSR có \`O=system:masters\` (đo trên lab: \`use of kubernetes.io/kube-apiserver-client signer with system:masters group is not allowed\`, ngay lúc tạo).

**CertificateSigningRequest** là cách xin CA cluster ký mà không đụng \`ca.key\`: bạn gửi CSR (PEM, base64 một dòng) với \`signerName\`, \`usages\`, \`expirationSeconds\`; người có quyền \`approve\`; controller \`csrsigning\` trong kube-controller-manager (\`--cluster-signing-cert-file=/etc/kubernetes/pki/ca.crt\`) ký và ghi cert vào \`status.certificate\`. Approve và ký là **hai bước khác nhau**: approve chỉ là điều kiện \`Approved\`; ký chỉ xảy ra nếu có signer nhận \`signerName\` đó và CSR hợp lệ với nó.

| \`signerName\` | Ai ký | Dùng cho |
|---|---|---|
| \`kubernetes.io/kube-apiserver-client\` | controller-manager | cert client cho người/công cụ gọi apiserver (buổi này) |
| \`kubernetes.io/kube-apiserver-client-kubelet\` | controller-manager, tự duyệt | kubelet xin cert client (\`CN=system:node:<node>\`) |
| \`kubernetes.io/kubelet-serving\` | controller-manager, không tự duyệt | cert server của kubelet |
| \`kubernetes.io/legacy-unknown\` | không ai | API \`v1\` từ chối tạo |
| tên khác (\`example.com/…\`) | signer bạn tự viết (cert-manager có thể đóng vai này) | không có signer thì Approved mãi mà không có cert |

**Không thu hồi được cert.** apiserver không kiểm CRL hay OCSP: cert client đã cấp còn hiệu lực tới \`notAfter\`. Cắt quyền một người là gỡ RoleBinding (s35); vì thế cert cho người nên ngắn hạn. Lab chọn \`expirationSeconds: 31536000\` (365 ngày, bằng mức trần mặc định \`--cluster-signing-duration\` 8760h) vì dev/ops phải dùng được tới hết chương trình; ví dụ trên kubernetes.io để \`86400\` (một ngày), chép nguyên thì sáng mai kubeconfig của s34 hết hạn.

**CSR là object tạm.** Tài liệu ghi kube-controller-manager dọn CSR tự động (đã duyệt: sau 1 giờ; đang chờ: sau 24 giờ; cert đã hết hạn thì xoá CSR của nó). Trên lab, CSR \`csr-…\` của kubelet lúc join vẫn còn sau 5 ngày, nên đừng dựa vào việc nó còn hay mất: lưu \`status.certificate\` ra tệp ngay, và giữ YAML của CSR trong \`~/users/\` để làm lại được. Cert đã cấp không bị ảnh hưởng khi CSR bị xoá.`,
    refs: [
      { label: "Bài lộ trình CKA: tạo user bằng certificate — key, CSR, approve, kubeconfig", href: "#/roadmap/cka/cka-w7-3" },
      { label: "CKA Study Guide, chương 6 — xác thực, uỷ quyền và kiểm soát tiếp nhận", href: "#/docs/ckabook-06" },
      { label: "Thực hành nhanh › Playbook: tạo user mới (key → CSR → approve → RBAC)", href: "#/commands/playbooks" },
      { label: "kubernetes.io: Certificates and Certificate Signing Requests", href: "https://kubernetes.io/docs/reference/access-authn-authz/certificate-signing-requests/" },
      { label: "kubernetes.io: PKI certificates and requirements", href: "https://kubernetes.io/docs/setup/best-practices/certificates/" },
      { label: "kubernetes.io: Authenticating — X509 client certificates", href: "https://kubernetes.io/docs/reference/access-authn-authz/authentication/#x509-client-certificates" },
      { label: "kubernetes.io: Certificate Management with kubeadm", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/" },
    ],
    stateIn: "Đầu ra s32: cluster 1.36 ba node, shop phục vụ qua ba cửa dưới NetworkPolicy default-deny; ~/.kube/config của ubuntu là kubernetes-admin (namespace shop). `./labs/lab begin cka s33` kiểm đầu vào bằng verify của s32, tạo ~/drills/s33 và ~/users, xoá answers.env cũ.",
    stateOut: "Trên cka-cp: ~/users/dev.{key,crt} (CN=dev, O=shop-dev) và ~/users/ops.{key,crt} (CN=ops, O=shop-ops) do CA cluster ký qua CSR kube-apiserver-client (365 ngày), YAML của CSR trong ~/users/dev-csr.yaml, ops-csr.yaml; CSR dev, ops Approved,Issued; ~/drills/s33/answers.env (APISERVER_SANS, CERT_GROUP_FIELD).",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s33`. Trên cka-cp: `ls -l /etc/kubernetes/pki /etc/kubernetes/pki/etcd` (tệp nào là key, quyền bao nhiêu?). `openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -text` và tìm Issuer, Subject, Validity, `X509v3 Subject Alternative Name`, `Extended Key Usage`; rồi bản gọn `-noout -issuer -subject -enddate -ext subjectAltName`. `sudo kubeadm certs check-expiration`. Ghi `APISERVER_SANS=<mọi tên và IP trong SAN, phân cách bằng dấu phẩy, bỏ tiền tố DNS:/IP Address:>` vào `~/drills/s33/answers.env`. Vì sao `10.96.0.1` nằm trong đó?",
      },
      {
        id: "t2",
        text: "CA và danh tính admin: `openssl x509 -in /etc/kubernetes/pki/ca.crt -noout -subject -issuer -enddate` (vì sao issuer bằng subject?); `openssl verify -CAfile /etc/kubernetes/pki/ca.crt /etc/kubernetes/pki/apiserver.crt`; cert trong kubeconfig của bạn: `k config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject`. Username là gì, group là gì, đọc từ trường nào? Ghi `CERT_GROUP_FIELD=<tên trường chứa group>`.",
      },
      {
        id: "t3",
        text: "Key và CSR của dev: `mkdir -p ~/users && cd ~/users`, `openssl genrsa -out dev.key 2048`, `openssl req -new -key dev.key -subj \"/CN=dev/O=shop-dev\" -out dev.csr`. Kiểm `openssl req -in dev.csr -noout -subject -verify` và `ls -l dev.key` (quyền?).",
      },
      {
        id: "t4",
        text: "CertificateSigningRequest: chép ví dụ ở trang \"Certificates and Certificate Signing Requests\" của kubernetes.io vào `~/users/dev-csr.yaml`: `name: dev`, `request` là `base64 -w0 dev.csr` (một dòng), `signerName: kubernetes.io/kube-apiserver-client`, `expirationSeconds: 31536000`, `usages: [client auth]`. `k apply -f dev-csr.yaml`, `k get csr` (CONDITION?), `k certificate approve dev`, `k get csr dev`. Lấy cert: `k get csr dev -o jsonpath='{.status.certificate}' | base64 -d > dev.crt`. Kiểm: `openssl x509 -in dev.crt -noout -subject -issuer -dates`, `openssl verify -CAfile /etc/kubernetes/pki/ca.crt dev.crt`, và key khớp cert: `openssl x509 -in dev.crt -noout -pubkey | sha256sum` so với `openssl pkey -in dev.key -pubout | sha256sum`.",
      },
      {
        id: "t5",
        text: "Bấm giờ, dưới 6 phút: làm lại cả chuỗi cho ops (`CN=ops`, `O=shop-ops`, `~/users/ops.{key,csr,crt}`, `~/users/ops-csr.yaml`, CSR tên `ops`). `k get csr` phải có `dev` và `ops` ở `Approved,Issued`, REQUESTEDDURATION `365d`.",
      },
      {
        id: "t6",
        text: "Tình huống hỏng: `cp ~/users/dev-csr.yaml ~/drills/s33/dev-draft.yaml`, đổi `name: dev-draft`. (a) Xoá khối `usages` rồi apply: lỗi gì? (b) Trả `usages`, đổi `signerName: example.com/shop-client`, apply, `k certificate approve dev-draft`, chờ 10 giây: `k get csr dev-draft` (CONDITION?) và `k get csr dev-draft -o jsonpath='{.status.certificate}'`. (c) Thử thêm `O=system:masters` vào subject của một CSR `kube-apiserver-client`: chuyện gì xảy ra? Xoá `dev-draft`. Trên Mac: `./labs/lab verify cka s33` phải đạt 6/6.",
      },
    ],
    hints: [
      "`openssl x509 -text` dài: dùng `-noout -ext subjectAltName` (OpenSSL 3) để chỉ in SAN, `-noout -enddate` cho hạn. Đếm đủ: kubeadm đặt tên node, bốn tên `kubernetes…`, ClusterIP của Service `kubernetes` và IP node.",
      "`k apply` báo `error converting YAML to JSON: yaml: line 8: could not find expected ':'` (đo): `request` bị xuống dòng, vì `base64` mặc định ngắt dòng ở 76 ký tự. Dùng `base64 -w0 dev.csr` (Linux) hay `base64 dev.csr | tr -d '\\n'`.",
      "`spec.usages: Required value`, `spec.signerName: Required value`: API `v1` bắt buộc cả hai (đo). `signerName: kubernetes.io/legacy-unknown` bị từ chối: `the legacy signerName is not allowed via this API version`.",
      "CSR `Approved` mà không bao giờ có `Issued`, `status.certificate` rỗng: không signer nào nhận `signerName` đó (gõ sai, hay tên tự đặt). CSR `Approved,Failed`: signer có nhận nhưng từ chối nội dung; đọc `k get csr <tên> -o jsonpath='{.status.conditions}'`, ví dụ `SignerValidationFailure: invalid usage for client certificate: server auth` khi để `usages: [server auth]` (đo).",
      "REQUESTEDDURATION `24h`: bạn chép nguyên `expirationSeconds: 86400` của ví dụ. Cert một ngày làm kubeconfig s34 hết hạn sau một đêm; xoá CSR, sửa `31536000`, gửi lại (key giữ nguyên).",
      "`k get csr dev` báo `AlreadyExists` khi làm lại: tên CSR là duy nhất trong cluster, `k delete csr dev` trước khi apply bản mới. Cert cũ vẫn dùng được tới hết hạn; không có cách thu hồi.",
      "`openssl verify` báo `unable to get local issuer certificate`: cert không do `ca.crt` này ký (bạn tự ký, hay lấy nhầm tệp).",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6); thời điểm và fingerprint sẽ khác. Context đã ở namespace shop.

**1. Cert của apiserver và hạn các cert kubeadm**

\`\`\`bash
ls -l /etc/kubernetes/pki | head -4
# total 60
# -rw-r--r-- 1 root root 1123 Nov 14 00:39 apiserver-etcd-client.crt
# -rw------- 1 root root 1675 Nov 14 00:39 apiserver-etcd-client.key
# -rw-r--r-- 1 root root 1131 Nov 14 00:39 apiserver-kubelet-client.crt
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -issuer -subject -enddate -ext subjectAltName
# issuer=CN = kubernetes
# subject=CN = kube-apiserver
# notAfter=Nov 13 17:38:39 2027 GMT
# X509v3 Subject Alternative Name:
#     DNS:cka-cp, DNS:kubernetes, DNS:kubernetes.default, DNS:kubernetes.default.svc, DNS:kubernetes.default.svc.cluster.local, IP Address:10.96.0.1, IP Address:192.168.252.35
sudo kubeadm certs check-expiration
# CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
# admin.conf                 Nov 13, 2027 17:38 UTC   359d            ca                      no
# apiserver                  Nov 13, 2027 17:38 UTC   359d            ca                      no
# apiserver-etcd-client      Nov 13, 2027 17:38 UTC   359d            etcd-ca                 no
# apiserver-kubelet-client   Nov 13, 2027 17:38 UTC   359d            ca                      no
# controller-manager.conf    Nov 13, 2027 17:38 UTC   359d            ca                      no
# etcd-healthcheck-client    Nov 13, 2027 17:38 UTC   359d            etcd-ca                 no
# etcd-peer                  Nov 13, 2027 17:38 UTC   359d            etcd-ca                 no
# etcd-server                Nov 13, 2027 17:38 UTC   359d            etcd-ca                 no
# front-proxy-client         Nov 13, 2027 17:38 UTC   359d            front-proxy-ca          no
# scheduler.conf             Nov 13, 2027 17:38 UTC   359d            ca                      no
# super-admin.conf           Nov 13, 2027 17:38 UTC   359d            ca                      no
#
# CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
# ca                      Nov 10, 2036 17:38 UTC   9y              no
# etcd-ca                 Nov 10, 2036 17:38 UTC   9y              no
# front-proxy-ca          Nov 10, 2036 17:38 UTC   9y              no
mkdir -p ~/drills/s33
echo 'APISERVER_SANS=cka-cp,kubernetes,kubernetes.default,kubernetes.default.svc,kubernetes.default.svc.cluster.local,10.96.0.1,192.168.252.35' >> ~/drills/s33/answers.env
\`\`\`

\`10.96.0.1\` là ClusterIP của Service \`kubernetes\` ở \`default\` (IP đầu tiên của Service CIDR \`10.96.0.0/12\`): Pod gọi apiserver qua IP đó và qua tên \`kubernetes.default.svc\`, nên cert phải mang cả hai. Thêm tên hay IP mới (một load balancer trước apiserver) thì phải cấp lại cert apiserver với \`--apiserver-cert-extra-sans\`.

**2. CA và danh tính admin**

\`\`\`bash
openssl x509 -in /etc/kubernetes/pki/ca.crt -noout -subject -issuer -enddate
# subject=CN = kubernetes
# issuer=CN = kubernetes
# notAfter=Nov 10 17:38:39 2036 GMT
openssl verify -CAfile /etc/kubernetes/pki/ca.crt /etc/kubernetes/pki/apiserver.crt
# /etc/kubernetes/pki/apiserver.crt: OK
k config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject
# subject=O = kubeadm:cluster-admins, CN = kubernetes-admin
echo 'CERT_GROUP_FIELD=O' >> ~/drills/s33/answers.env
\`\`\`

CA tự ký (issuer = subject): nó là gốc của chuỗi. Username \`kubernetes-admin\` (CN), group \`kubeadm:cluster-admins\` (O).

**3–4. Key, CSR và cert của dev**

\`\`\`bash
mkdir -p ~/users && cd ~/users
openssl genrsa -out dev.key 2048
openssl req -new -key dev.key -subj "/CN=dev/O=shop-dev" -out dev.csr
openssl req -in dev.csr -noout -subject -verify
# subject=CN = dev, O = shop-dev
# Certificate request self-signature verify OK
ls -l dev.key
# -rw------- 1 ubuntu ubuntu 1704 Nov 19 10:16 dev.key       (OpenSSL 3 tự tạo key với quyền 600)
\`\`\`

\`~/users/dev-csr.yaml\` (\`request\` là output của \`base64 -w0 dev.csr\`, cắt bớt ở đây):

\`\`\`yaml
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: dev
spec:
  request: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURSBSRVFVRVNULS0tLS0KTUlJQ1p6Q0NBVThDQVFBd0l...
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 31536000
  usages:
  - client auth
\`\`\`

\`\`\`bash
k apply -f dev-csr.yaml
k get csr dev
# NAME   AGE   SIGNERNAME                            REQUESTOR          REQUESTEDDURATION   CONDITION
# dev    0s    kubernetes.io/kube-apiserver-client   kubernetes-admin   365d                Pending
k certificate approve dev
# certificatesigningrequest.certificates.k8s.io/dev approved
k get csr dev
# dev    3s    kubernetes.io/kube-apiserver-client   kubernetes-admin   365d                Approved,Issued
k get csr dev -o jsonpath='{.status.certificate}' | base64 -d > dev.crt
openssl x509 -in dev.crt -noout -subject -issuer -dates
# subject=O = shop-dev, CN = dev
# issuer=CN = kubernetes
# notBefore=Nov 19 03:13:38 2026 GMT
# notAfter=Nov 19 03:13:38 2027 GMT
openssl verify -CAfile /etc/kubernetes/pki/ca.crt dev.crt
# dev.crt: OK
openssl x509 -in dev.crt -noout -pubkey | sha256sum; openssl pkey -in dev.key -pubout | sha256sum
# (hai dòng giống nhau)
\`\`\`

\`notBefore\` lùi 5 phút so với lúc ký (controller cho phép lệch đồng hồ), \`notAfter\` cách \`notBefore\` đúng \`expirationSeconds\`. Signer ghi lại subject theo thứ tự O rồi CN và thêm \`Extended Key Usage: TLS Web Client Authentication\`, \`CA:FALSE\`.

**5. ops**

\`\`\`bash
cd ~/users
openssl genrsa -out ops.key 2048
openssl req -new -key ops.key -subj "/CN=ops/O=shop-ops" -out ops.csr
sed -e 's/name: dev$/name: ops/' -e "s|request: .*|request: $(base64 -w0 ops.csr)|" dev-csr.yaml > ops-csr.yaml
k apply -f ops-csr.yaml && k certificate approve ops
k get csr ops -o jsonpath='{.status.certificate}' | base64 -d > ops.crt
openssl verify -CAfile /etc/kubernetes/pki/ca.crt ops.crt
# ops.crt: OK
k get csr
# NAME        AGE    SIGNERNAME                                    REQUESTOR                 REQUESTEDDURATION   CONDITION
# csr-q5bkh   5d9h   kubernetes.io/kube-apiserver-client-kubelet   system:bootstrap:e29sh8   <none>              Approved,Issued
# ...
# dev         1m     kubernetes.io/kube-apiserver-client           kubernetes-admin          365d                Approved,Issued
# ops         20s    kubernetes.io/kube-apiserver-client           kubernetes-admin          365d                Approved,Issued
\`\`\`

Các CSR \`csr-…\` là của kubelet lúc join (s07–s08), signer \`kube-apiserver-client-kubelet\`, được tự duyệt.

**6. Tình huống hỏng**

\`\`\`bash
cd ~/drills/s33
sed 's/name: dev$/name: dev-draft/' ~/users/dev-csr.yaml > dev-draft.yaml
sed '/usages:/,$d' dev-draft.yaml | k apply -f -
# The CertificateSigningRequest "dev-draft" is invalid: spec.usages: Required value
sed -i 's#signerName: kubernetes.io/kube-apiserver-client#signerName: example.com/shop-client#' dev-draft.yaml
k apply -f dev-draft.yaml && k certificate approve dev-draft
sleep 10; k get csr dev-draft
# NAME        AGE   SIGNERNAME                REQUESTOR          REQUESTEDDURATION   CONDITION
# dev-draft   11s   example.com/shop-client   kubernetes-admin   365d                Approved
k get csr dev-draft -o jsonpath='{.status.certificate}'; echo
#             (rỗng: không signer nào nhận example.com/shop-client)
k delete csr dev-draft
\`\`\`

Thêm \`O=system:masters\` (\`-subj "/CN=dev/O=shop-dev/O=system:masters"\`) thì apiserver chặn ngay lúc tạo: \`certificatesigningrequests.certificates.k8s.io "dev" is forbidden: use of kubernetes.io/kube-apiserver-client signer with system:masters group is not allowed\`. Một O thừa khác (\`O=shop-admins\`) thì được ký: cert mang \`O = shop-dev + O = shop-admins\`, dev có thêm một group, và verify đỏ dòng subject.

Lời giải tự động: \`labs/cka/sessions/s33/apply.sh\` (\`files/issue.sh\` cho từng user; chạy lại được: cert hợp lệ và CSR trong API khớp tệp thì giữ, nếu không thì dùng lại key, xoá CSR cũ cùng tên rồi xin lại).`,
    exam: {
      patterns: [
        "\"Tạo CSR cho user X với key có sẵn, approve, lưu cert vào /opt/…\" — YAML từ trang CSR của kubernetes.io (`request` base64 một dòng, `signerName: kubernetes.io/kube-apiserver-client`, `usages: [client auth]`), `k certificate approve`, `jsonpath='{.status.certificate}' | base64 -d`.",
        "\"Cert của apiserver hết hạn ngày nào / có SAN nào\" — `openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -enddate -ext subjectAltName`, hay `kubeadm certs check-expiration`.",
        "\"Duyệt/từ chối CSR đang chờ\" — `k get csr`, `k certificate approve|deny <tên>`; đọc REQUESTOR, SIGNERNAME trước khi duyệt.",
        "\"User X thuộc group nào\" — đọc O trong subject của cert (`openssl x509 -noout -subject`); không có object User để `get`.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 6 phút: user `qa` (group `shop-qa`): key, CSR, CertificateSigningRequest `qa` hạn 30 ngày, approve, cert ở `/tmp/qa.crt`; chứng minh cert do CA cluster ký. Rồi xoá CSR `qa`.",
          timeLimitMin: 6,
          solution: "```bash\ncd /tmp && openssl genrsa -out qa.key 2048\nopenssl req -new -key qa.key -subj '/CN=qa/O=shop-qa' -out qa.csr\ncat <<EOF | k apply -f -\napiVersion: certificates.k8s.io/v1\nkind: CertificateSigningRequest\nmetadata:\n  name: qa\nspec:\n  request: $(base64 -w0 qa.csr)\n  signerName: kubernetes.io/kube-apiserver-client\n  expirationSeconds: 2592000\n  usages: [client auth]\nEOF\nk certificate approve qa\nk get csr qa -o jsonpath='{.status.certificate}' | base64 -d > qa.crt\nopenssl verify -CAfile /etc/kubernetes/pki/ca.crt qa.crt\nk delete csr qa\n```\n`$(base64 -w0 qa.csr)` được shell thay vào heredoc trước khi tới kubectl; heredoc phải là `<<EOF` (không có nháy) thì mới thay.",
        },
        {
          text: "Trong 2 phút: liệt kê mọi tệp trong /etc/kubernetes/pki (cả etcd/) hết hạn trong 400 ngày tới, chỉ bằng openssl.",
          timeLimitMin: 2,
          solution: "```bash\nfor c in $(sudo find /etc/kubernetes/pki -name '*.crt'); do sudo openssl x509 -in $c -noout -checkend $((400*86400)) >/dev/null || echo $c; done\n```\n`-checkend N` trả mã khác 0 nếu cert hết hạn trong N giây tới. Trên lab in mọi leaf (hạn 1 năm), không in ba CA (10 năm).",
        },
      ],
    },
    tips: [
      "Trang \"Certificates and Certificate Signing Requests\" của kubernetes.io có sẵn cả chuỗi lệnh openssl và YAML CSR (mục \"Normal user\"): tìm \"certificate signing request\" trong ô tìm kiếm.",
      "`base64 -w0`: thiếu `-w0` là YAML hỏng ở dòng `request`. Trong heredoc không nháy (`<<EOF`) bạn nhúng thẳng `$(base64 -w0 x.csr)` được.",
      "Đọc REQUESTOR và SIGNERNAME trước khi `approve`: approve là cấp danh tính, không thu hồi được tới khi cert hết hạn.",
      "Lưu cert ra tệp ngay sau khi approve; CSR là object tạm, không phải chỗ cất cert.",
    ],
    outcome: {
      md: `dev và ops có danh tính do CA của cluster cấp. Trên Mac:

\`\`\`bash
./labs/lab verify cka s33
\`\`\`

Verify đọc bằng openssl bốn tệp trong \`~/users/\`: cert do \`/etc/kubernetes/pki/ca.crt\` ký (\`openssl verify\`), có EKU client auth, còn hạn ít nhất 30 ngày (để dùng tới hết chương trình), subject đúng một CN và một O (O thừa là group thừa: đỏ), key khớp cert. CSR \`dev\`, \`ops\` trong API phải có signer \`kube-apiserver-client\`, usage \`client auth\`, \`Approved\` và cert đã cấp trùng tệp trong \`~/users/\` (cert tự ký bằng CA khác hay ký tay bằng CA khác đều đỏ). Nếu controller đã dọn CSR (tài liệu ghi 1 giờ sau khi duyệt) và cert đã ký hơn 1 giờ, verify chấm \`~/users/<user>-csr.yaml\` thay cho object: đúng signer, usage và \`request\` mang public key của \`<user>.key\`. CSR nháp \`dev-draft\` phải đã xoá; \`APISERVER_SANS\` so với SAN thật của \`apiserver.crt\` (không kể thứ tự, hoa thường, tiền tố).`,
      verifyOutput: "lab: kiểm s33\n  (chờ apiserver, nếu đang khởi động: tối đa ~4 phút)\n  ✓ ~/users/dev.key, dev.crt, ops.key, ops.crt có đủ\n  ✓ dev.crt, ops.crt do CA của cluster ký (openssl verify), EKU client auth, còn hạn ≥ 30 ngày\n  ✓ Subject: dev.crt CN=dev O=shop-dev, ops.crt CN=ops O=shop-ops, không thêm trường nào\n  ✓ Key khớp cert (cùng public key) cho dev và ops\n  ✓ CSR dev, ops: kube-apiserver-client, client auth, Approved, cert cấp ra trùng ~/users/; CSR nháp dev-draft đã xoá\n  ✓ answers.env: APISERVER_SANS khớp SAN của apiserver.crt, CERT_GROUP_FIELD\n  → 6/6 đạt",
      projectDelta: "Chặng 6 bắt đầu: shop có hai người dùng thật, dev (đội ứng dụng, group shop-dev) và ops (vận hành, group shop-ops), mỗi người một cặp key/cert do CA của cluster ký. Buổi sau đóng cert vào kubeconfig riêng; s35 mới cấp quyền.",
    },
    review: [
      { q: "apiserver lấy username và group của một request dùng cert client từ đâu? Và vì sao không có `kubectl get users`?", a: "Từ subject của cert: CN là username, mỗi O là một group (cộng `system:authenticated`). Cert hợp lệ khi do CA trong `--client-ca-file` ký và còn hạn. Kubernetes không lưu user: authenticator chỉ đọc danh tính từ cert hay token mỗi request, RBAC gắn quyền cho chuỗi tên đó." },
      { q: "CSR `Approved` mà không bao giờ `Issued`. Hai nguyên nhân hay gặp, đọc ở đâu?", a: "`signerName` không có signer nào nhận (gõ sai, tên tự đặt như `example.com/…`): CONDITION chỉ `Approved`, `status.certificate` rỗng. Signer có nhận nhưng từ chối: `Approved,Failed`, `status.conditions` có `SignerValidationFailure` (vd. usage `server auth` cho signer client). Approve chỉ là điều kiện; ký là việc của signer." },
      { q: "Vì sao signer `kube-apiserver-client` từ chối `O=system:masters`, và kubeadm cho admin group gì thay thế?", a: "`system:masters` bỏ qua RBAC, không gỡ quyền được bằng cách xoá binding, và cert không thu hồi được: cấp nó qua CSR là trao quyền không thể rút. Từ 1.29 `admin.conf` dùng `O=kubeadm:cluster-admins`, group được ClusterRoleBinding gắn `cluster-admin`; chỉ `super-admin.conf` mang `system:masters` để cứu hộ." },
      { q: "Một nhân viên nghỉ việc mang theo `dev.key` + `dev.crt` còn hạn 300 ngày. Bạn làm gì?", a: "Không thu hồi được cert: apiserver không kiểm CRL/OCSP. Gỡ mọi RoleBinding/ClusterRoleBinding cho user `dev` và group `shop-dev` (hay đổi tên group bạn gắn quyền), cấp cert mới với tên/group khác cho người thay. Bài học: cert cho người nên ngắn hạn, quyền gắn theo group." },
      { q: "So sánh với Java: `dev.key` + `dev.crt` và `ca.crt` tương ứng với gì trong một client Spring gọi API bằng mTLS?", a: "`dev.key` + `dev.crt` là keystore (danh tính client trình ra); `ca.crt` là truststore (CA dùng để kiểm cert server). Spring Boot 3.1+ khai cả hai bằng SSL bundle PEM; bản cũ đóng thành PKCS#12. Phía server bật `client-auth=need` và trust-store chứa CA ký cert client, đúng như `--client-ca-file` của apiserver." },
    ],
  },
// ───────────────────────────── s34 ─────────────────────────────
  {
    id: "s34",
    stage: "st6",
    title: "kubeconfig: cluster, user, context",
    durationMin: 60,
    domain: "architecture",
    competencies: ["ar-rbac"],
    requires: ["s33"],
    status: "published",
    pieces: [],
    goals: [
      "Ghép kubeconfig riêng cho dev và ops từ cert ở s33, nhúng sẵn cert, chuyển context bằng một lệnh.",
      "Đọc một kubeconfig lạ và nói nó trỏ tới cluster nào, bằng user nào, namespace mặc định nào.",
      "Làm việc với nhiều kubeconfig cùng lúc qua --kubeconfig mà không làm hỏng ~/.kube/config.",
    ],
    skills: [
      { skill: "k-config-contexts", level: "Gõ được không tra" },
      { skill: "k-use-context", level: "Thành phản xạ" },
      { skill: "k-config-set-credentials", level: "Gõ được có tra" },
      { skill: "k-config-set-context", level: "Gõ được có tra" },
      { skill: "k-kubeconfig-flag", level: "Gõ được không tra" },
      { skill: "k-kubeconfig-structure", level: "Giải thích được" },
      { skill: "k-config-view-minify", level: "Gõ được không tra" },
    ],
    uses: ["k-set-context-ns", "k-kubeconfig-admin", "k-kubeconfig-files", "lx-chown-chmod"],
    foundation: null,
    mindset: `**kubeconfig là ba danh sách và một con trỏ.** \`clusters\` (tên → \`server\` + CA để kiểm cert của server), \`users\` (tên → cách chứng minh danh tính: cert + key, token, hay lệnh \`exec\`), \`contexts\` (tên → một bộ ba cluster + user + \`namespace\` mặc định), và \`current-context\` chọn bộ ba đang dùng. Tên trong tệp là **nhãn cục bộ**: user tên \`dev\` trong kubeconfig không làm bạn thành \`dev\`; danh tính thật là CN trong cert (s33) hay chủ của token.

\`\`\`text
current-context: dev@kubernetes
contexts:  dev@kubernetes ──► cluster: kubernetes ──► server: https://192.168.252.35:6443, certificate-authority-data (truststore)
                          └──► user: dev ──────────► client-certificate-data + client-key-data (keystore)
                          └──► namespace: shop
\`\`\`

**kubectl tìm kubeconfig theo thứ tự:** cờ \`--kubeconfig <tệp>\` (chỉ tệp đó); biến \`KUBECONFIG\` (danh sách tệp cách nhau bằng \`:\`, **gộp** lại: phần tử trùng tên thì tệp đứng trước thắng); cuối cùng \`~/.kube/config\`. \`kubectl config …\` **ghi** vào đúng tệp đó: với \`--kubeconfig\` là tệp đó; với \`KUBECONFIG\` nhiều tệp, \`use-context\` ghi \`current-context\` vào **tệp đầu tiên** (đo trên lab: \`KUBECONFIG=~/.kube/config:~/ops.kubeconfig kubectl config use-context ops@kubernetes\` sửa \`~/.kube/config\`, và vì context \`ops@kubernetes\` không nằm trong tệp đó, \`kubectl\` thường lỗi \`context was not found\` cho tới khi bạn đặt lại). Đó là lý do bài này làm mọi thứ qua \`--kubeconfig\`.

**Vì sao nhúng cert.** \`set-credentials --client-certificate=…\` mặc định ghi **đường dẫn**; kubectl đọc tệp lúc chạy. Đo trên lab: đường dẫn nằm dưới thư mục của kubeconfig được ghi **tương đối** với tệp kubeconfig (\`users/dev.crt\` khi kubeconfig ở \`~\`), còn lại ghi tuyệt đối. Chép kubeconfig sang máy khác (hay người khác, CI, thư mục khác với đường dẫn tương đối) là gãy: \`unable to read client-cert /home/ubuntu/users/dev.crt for dev due to open …: no such file or directory\`. \`--embed-certs\` đọc tệp **một lần** và ghi nội dung base64 vào \`client-certificate-data\`/\`client-key-data\` (và \`certificate-authority-data\` với \`set-cluster\`): tệp tự đủ, mang đi đâu cũng chạy. Cái giá: tệp chứa **private key**, nên quyền phải là \`600\` (\`kubectl config\` tạo tệp mới với \`600\`, đo), và ai đọc được tệp là đóng vai được user đó tới khi cert hết hạn.

**Bốn kubeconfig có sẵn của kubeadm** ở \`/etc/kubernetes/\`: \`admin.conf\` (\`kubeadm:cluster-admins\`, chép thành \`~/.kube/config\` ở s07), \`super-admin.conf\` (\`system:masters\`), \`controller-manager.conf\`, \`scheduler.conf\`, cộng \`kubelet.conf\` trên mỗi node. Cùng cấu trúc ba danh sách; chỉ khác danh tính.

**Xác thực và uỷ quyền là hai cửa.** \`Unauthorized\` (401): apiserver không nhận ra bạn (cert không do CA cluster ký, hết hạn, token sai). \`Forbidden\` (403): nhận ra bạn là ai (\`User "dev"\` có trong thông báo) nhưng RBAC không cho. Cuối buổi này dev và ops đi qua cửa thứ nhất và bị chặn ở cửa thứ hai: đúng trạng thái trước s35. \`kubectl auth whoami\` hỏi apiserver "tôi là ai" (SelfSubjectReview, mọi user đã xác thực đều được gọi), nên nó chạy được ngay cả khi chưa có quyền nào.

**Java.** Cùng ý với client mTLS của s33: kubeconfig nhúng cert là keystore + truststore + URL đóng chung một tệp. Client Java chính thức (\`io.kubernetes:client-java\`, \`Config.defaultClient()\`) và Fabric8 đọc đúng tệp này theo cùng thứ tự \`KUBECONFIG\` → \`~/.kube/config\`, nên ứng dụng chạy ngoài cluster dùng được \`dev.kubeconfig\` mà không cần gì thêm; trong cluster thì dùng token của ServiceAccount (s35).`,
    refs: [
      { label: "Bài lộ trình CKA: kubeconfig — cấu trúc file, contexts, users, clusters", href: "#/roadmap/cka/cka-w2-6" },
      { label: "Bài lộ trình CKA: tạo user bằng certificate — đến bước kubeconfig", href: "#/roadmap/cka/cka-w7-3" },
      { label: "CKA Study Guide, chương 3 — tương tác với Kubernetes", href: "#/docs/ckabook-03" },
      { label: "kubernetes.io: Organizing Cluster Access Using kubeconfig Files", href: "https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/" },
      { label: "kubernetes.io: Configure Access to Multiple Clusters", href: "https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/" },
      { label: "kubernetes.io: kubectl config (reference)", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_config/" },
      { label: "Bài thực hành s33 — PKI, CSR cho dev và ops", href: "#/practice/cka/s33" },
    ],
    stateIn: "Đầu ra s33: ~/users/dev.{key,crt}, ~/users/ops.{key,crt} do CA cluster ký; ~/.kube/config là kubernetes-admin. `./labs/lab begin cka s34` kiểm đầu vào bằng verify của s33, tạo ~/drills/s34 với stranger.kubeconfig (kubeconfig lạ ba context), xoá answers.env cũ.",
    stateOut: "Trên cka-cp: /home/ubuntu/dev.kubeconfig (context dev@kubernetes, namespace shop) và /home/ubuntu/ops.kubeconfig (ops@kubernetes, namespace default), mỗi tệp một cluster/user/context, server như ~/.kube/config (https://192.168.252.35:6443 trên lab), CA + cert + key nhúng, quyền 600 chủ ubuntu; gọi API bằng chúng được xác thực nhưng chưa có quyền nào (Forbidden); ~/.kube/config vẫn là kubernetes-admin; ~/drills/s34/answers.env.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s34`. Trên cka-cp: `k config view` (vì sao thấy `DATA+OMITTED`?), `k config get-contexts`, `k config current-context`, `k config view --minify` và `--minify --raw`. Ghi lại `sha256sum ~/.kube/config` để cuối buổi so. Ba danh sách và con trỏ nằm ở đâu trong tệp?",
      },
      {
        id: "t2",
        text: "Ghép `~/dev.kubeconfig` bằng bốn lệnh, mỗi lệnh có `--kubeconfig ~/dev.kubeconfig` (dấu cách, không `=`: xem gợi ý): `k config set-cluster kubernetes --server=<server trong ~/.kube/config> --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs`; `k config set-credentials dev --client-certificate=$HOME/users/dev.crt --client-key=$HOME/users/dev.key --embed-certs`; `k config set-context dev@kubernetes --cluster=kubernetes --user=dev --namespace=shop`; `k config use-context dev@kubernetes`. Kiểm: `k config view --minify --kubeconfig ~/dev.kubeconfig`, `ls -l ~/dev.kubeconfig` (quyền?), `grep -c 'data:' ~/dev.kubeconfig`.",
      },
      {
        id: "t3",
        text: "Gọi API bằng dev: `k --kubeconfig ~/dev.kubeconfig get pods`, `… get nodes`, `… auth whoami`. Thông báo là `Forbidden` hay `Unauthorized`, có tên user nào, namespace nào? So với một cert tự ký: `openssl req -x509 -newkey rsa:2048 -nodes -keyout /tmp/f.key -out /tmp/f.crt -subj '/CN=dev/O=shop-dev' -days 1`, chép `~/dev.kubeconfig` thành `/tmp/fake.kubeconfig`, thay credentials bằng cặp đó (`--embed-certs`), `get pods` lại. Xoá `/tmp/f.*` và `/tmp/fake.kubeconfig`.",
      },
      {
        id: "t4",
        text: "Bấm giờ, dưới 3 phút: `~/ops.kubeconfig` cho ops, context `ops@kubernetes`, namespace `default`, nhúng cert. `k --kubeconfig ~/ops.kubeconfig get pods` phải là `Forbidden` với `User \"ops\"` và `namespace \"default\"`. Xem cả ba cùng lúc mà không sửa tệp nào: `KUBECONFIG=~/.kube/config:~/dev.kubeconfig:~/ops.kubeconfig k config get-contexts`. Vì sao không chạy `use-context` với `KUBECONFIG` đó? `sha256sum ~/.kube/config` vẫn như ở t1?",
      },
      {
        id: "t5",
        text: "Tình huống hỏng: trong `~/drills/s34` ghép `noembed.kubeconfig` như t2 nhưng **không** `--embed-certs` (cluster và user). `grep -E 'certificate-authority|client-' noembed.kubeconfig`: tệp ghi gì? `auth whoami` bằng nó vẫn chạy. Giờ mang nó sang máy khác: `scp noembed.kubeconfig cka-w1:/tmp/` rồi `ssh cka-w1 kubectl --kubeconfig /tmp/noembed.kubeconfig get pods`. Lỗi gì? Xoá tệp trên cka-w1.",
      },
      {
        id: "t6",
        text: "Kubeconfig lạ: `~/drills/s34/stranger.kubeconfig` (đừng sửa nó). Chỉ bằng `k config … --kubeconfig ~/drills/s34/stranger.kubeconfig`, trả lời: context hiện tại trỏ tới server nào, bằng user nào, namespace mặc định nào? Ghi `STRANGER_SERVER=`, `STRANGER_USER=`, `STRANGER_NS=` vào `~/drills/s34/answers.env`. Trên Mac: `./labs/lab verify cka s34` phải đạt 4/4.",
      },
    ],
    hints: [
      "`--kubeconfig=~/dev.kubeconfig` (có `=`) tạo ra thư mục tên `~` trong thư mục hiện tại và tệp nằm trong đó (đo): bash không thay `~` khi nó đứng sau `=` trong một đối số thường. Viết `--kubeconfig ~/dev.kubeconfig` hay `--kubeconfig=$HOME/dev.kubeconfig`. Lỡ rồi thì `rm -r ./~` (đúng `./~`, không phải `~`).",
      "Quên `--kubeconfig` ở một trong bốn lệnh là ghi vào `~/.kube/config`: `k config get-contexts` (không cờ) thấy `dev@kubernetes` lẫn vào. Gỡ bằng `k config delete-context dev@kubernetes`, `k config delete-user dev`.",
      "`error: You must be logged in to the server (Unauthorized)` (đo với cert tự ký): apiserver không nhận ra cert, tức cert không do CA cluster ký hay đã hết hạn; khác `Forbidden`, nơi danh tính đã đúng.",
      "`Unable to connect to the server: tls: failed to verify certificate: x509: certificate signed by unknown authority` (đo với CA nhầm `front-proxy-ca.crt`): phía **server** chưa được tin, tức cluster thiếu `certificate-authority-data` hay trỏ sai CA. Đừng sửa bằng `--insecure-skip-tls-verify`: verify đỏ dòng đó, và mất luôn bảo vệ chống giả mạo server.",
      "`get pods` báo `in the namespace \"default\"` với dev: context thiếu `--namespace=shop`, hay `current-context` chưa đặt. `k config view --minify --kubeconfig ~/dev.kubeconfig` in đúng thứ kubectl sẽ dùng.",
      "Đọc kubeconfig lạ: `get-contexts` có dấu `*` ở context hiện tại, cột CLUSTER/AUTHINFO/NAMESPACE; `view --minify` in đúng cluster của context đó (cùng `server`). Tên context không nói gì về user: context `audit` có thể dùng user bất kỳ.",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6); fingerprint sẽ khác. IP cka-cp \`192.168.252.35\`.

**1. Tệp hiện có**

\`\`\`bash
k config get-contexts
# CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
# *         kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   shop
k config view --minify | grep -E 'server|data'
#     certificate-authority-data: DATA+OMITTED
#     server: https://192.168.252.35:6443
#     client-certificate-data: DATA+OMITTED
#     client-key-data: DATA+OMITTED
sha256sum ~/.kube/config > ~/drills/s34/kubeconfig.sha
\`\`\`

\`view\` giấu dữ liệu nhúng (key!) trừ khi có \`--raw\`.

**2–3. dev.kubeconfig**

\`\`\`bash
server=$(k config view --minify -o jsonpath='{.clusters[0].cluster.server}')
k config set-cluster kubernetes --server=$server --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig ~/dev.kubeconfig
k config set-credentials dev --client-certificate=$HOME/users/dev.crt --client-key=$HOME/users/dev.key --embed-certs --kubeconfig ~/dev.kubeconfig
k config set-context dev@kubernetes --cluster=kubernetes --user=dev --namespace=shop --kubeconfig ~/dev.kubeconfig
k config use-context dev@kubernetes --kubeconfig ~/dev.kubeconfig
# Switched to context "dev@kubernetes".
k config view --minify --kubeconfig ~/dev.kubeconfig
\`\`\`

\`\`\`yaml
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: DATA+OMITTED
    server: https://192.168.252.35:6443
  name: kubernetes
contexts:
- context:
    cluster: kubernetes
    namespace: shop
    user: dev
  name: dev@kubernetes
current-context: dev@kubernetes
kind: Config
users:
- name: dev
  user:
    client-certificate-data: DATA+OMITTED
    client-key-data: DATA+OMITTED
\`\`\`

\`\`\`bash
ls -l ~/dev.kubeconfig
# -rw------- 1 ubuntu ubuntu 5586 Nov 19 10:19 /home/ubuntu/dev.kubeconfig
k --kubeconfig ~/dev.kubeconfig get pods
# Error from server (Forbidden): pods is forbidden: User "dev" cannot list resource "pods" in API group "" in the namespace "shop"
k --kubeconfig ~/dev.kubeconfig get nodes
# Error from server (Forbidden): nodes is forbidden: User "dev" cannot list resource "nodes" in API group "" at the cluster scope
k --kubeconfig ~/dev.kubeconfig auth whoami
# ATTRIBUTE                                           VALUE
# Username                                            dev
# Groups                                              [shop-dev system:authenticated]
# Extra: authentication.kubernetes.io/credential-id   [X509SHA256=5a2849500e6eca6eccb2d727c6aecfc786495f3818c22a23cade72172c7e0a83]
\`\`\`

Với cert tự ký cùng subject \`CN=dev, O=shop-dev\`: \`error: You must be logged in to the server (Unauthorized)\`. Subject giống hệt không có nghĩa gì nếu chữ ký không phải của CA cluster.

**4. ops.kubeconfig và nhiều tệp cùng lúc**

\`\`\`bash
f=~/ops.kubeconfig
k config set-cluster kubernetes --server=$server --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig $f
k config set-credentials ops --client-certificate=$HOME/users/ops.crt --client-key=$HOME/users/ops.key --embed-certs --kubeconfig $f
k config set-context ops@kubernetes --cluster=kubernetes --user=ops --namespace=default --kubeconfig $f
k config use-context ops@kubernetes --kubeconfig $f
k --kubeconfig $f get pods
# Error from server (Forbidden): pods is forbidden: User "ops" cannot list resource "pods" in API group "" in the namespace "default"
KUBECONFIG=~/.kube/config:~/dev.kubeconfig:~/ops.kubeconfig k config get-contexts
# CURRENT   NAME                          CLUSTER      AUTHINFO           NAMESPACE
#           dev@kubernetes                kubernetes   dev                shop
# *         kubernetes-admin@kubernetes   kubernetes   kubernetes-admin   shop
#           ops@kubernetes                kubernetes   ops                default
sha256sum -c ~/drills/s34/kubeconfig.sha
# /home/ubuntu/.kube/config: OK
\`\`\`

Ba tệp cùng có cluster tên \`kubernetes\`: khi gộp, bản của tệp đầu thắng (ở đây cùng server, cùng CA nên không sao; hai cluster khác nhau mà cùng tên thì một cái biến mất khỏi bản gộp). Với \`KUBECONFIG\` đó, \`use-context ops@kubernetes\` ghi \`current-context: ops@kubernetes\` vào \`~/.kube/config\` (đo), và mọi lệnh \`kubectl\` không cờ sau đó báo \`Error in configuration: context was not found for specified context: ops@kubernetes\`. Đổi vai thì dùng \`--kubeconfig\` (hay \`--context\` trên bản gộp, không ghi gì).

**5. Tình huống hỏng: không nhúng cert**

\`\`\`bash
cd ~/drills/s34
k config set-cluster kubernetes --server=$server --certificate-authority=/etc/kubernetes/pki/ca.crt --kubeconfig noembed.kubeconfig
k config set-credentials dev --client-certificate=../../users/dev.crt --client-key=../../users/dev.key --kubeconfig noembed.kubeconfig
k config set-context dev --cluster=kubernetes --user=dev --namespace=shop --kubeconfig noembed.kubeconfig
k config use-context dev --kubeconfig noembed.kubeconfig
grep -E 'certificate-authority|client-' noembed.kubeconfig
#     certificate-authority: /etc/kubernetes/pki/ca.crt
#     client-certificate: /home/ubuntu/users/dev.crt
#     client-key: /home/ubuntu/users/dev.key
scp noembed.kubeconfig cka-w1:/tmp/
ssh cka-w1 kubectl --kubeconfig /tmp/noembed.kubeconfig get pods
# Error in configuration:
# * unable to read client-cert /home/ubuntu/users/dev.crt for dev due to open /home/ubuntu/users/dev.crt: no such file or directory
ssh cka-w1 rm /tmp/noembed.kubeconfig
\`\`\`

kubectl đổi \`../../users/dev.crt\` thành đường dẫn tuyệt đối lúc ghi (cert không nằm dưới thư mục của kubeconfig); trên cka-cp tệp vẫn chạy, mang đi là gãy. Sửa: ghép lại với \`--embed-certs\`, hay \`k config set-credentials dev --embed-certs --client-certificate=… --client-key=…\` trên tệp hỏng rồi chép lại.

**6. Kubeconfig lạ**

\`\`\`bash
f=~/drills/s34/stranger.kubeconfig
k config get-contexts --kubeconfig $f
# CURRENT   NAME    CLUSTER   AUTHINFO     NAMESPACE
# *         audit   staging   auditor      billing
#           dev     staging   dev          shop
#           prod    prod      prod-admin   default
k config view --minify --kubeconfig $f -o jsonpath='{.clusters[0].cluster.server}'; echo
# https://10.20.30.40:6443
cat >> ~/drills/s34/answers.env <<'EOF'
STRANGER_SERVER=https://10.20.30.40:6443
STRANGER_USER=auditor
STRANGER_NS=billing
EOF
\`\`\`

Context hiện tại tên \`audit\` nhưng user là \`auditor\` (token), cluster \`staging\`; tệp có cả \`prod\` với server khác. \`view --minify\` bỏ mọi thứ không thuộc context hiện tại.

Lời giải tự động: \`labs/cka/sessions/s34/apply.sh\` (ghép vào tệp tạm rồi \`mv\`, nên chạy lại được; kiểm \`~/.kube/config\` không đổi bằng sha256).`,
    exam: {
      patterns: [
        "Đầu mỗi câu: \"`kubectl config use-context k8s-c2`\" — đề có nhiều cluster, mỗi câu một context; quên lệnh này là làm đúng việc trên sai cluster.",
        "\"Ghi tên mọi context vào /opt/…/contexts\" và \"ghi context hiện tại bằng kubectl, rồi không dùng kubectl\" — `k config get-contexts -o name`; `k config current-context`; không kubectl thì `grep current-context ~/.kube/config`.",
        "\"Tạo kubeconfig cho user X tại /opt/…, cert nhúng sẵn\" — `set-cluster`/`set-credentials --embed-certs`/`set-context`/`use-context`, tất cả `--kubeconfig <tệp>`.",
        "\"Cert client trong kubeconfig hết hạn ngày nào\" — `k config view --raw -o jsonpath='{.users[?(@.name==\"x\")].user.client-certificate-data}' | base64 -d | openssl x509 -noout -enddate`.",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Trong 1 phút: in tên user và server của context hiện tại trong `~/drills/s34/stranger.kubeconfig`, mỗi thứ một dòng, chỉ bằng kubectl.",
          timeLimitMin: 1,
          solution: "```bash\nk config view --minify --kubeconfig ~/drills/s34/stranger.kubeconfig -o jsonpath='{.contexts[0].context.user}{\"\\n\"}{.clusters[0].cluster.server}{\"\\n\"}'\n```\n`--minify` chỉ còn đúng context hiện tại, nên `[0]` là nó.",
        },
        {
          text: "Trong 2 phút: không dùng kubectl, in ngày hết hạn của cert nhúng trong `~/ops.kubeconfig`.",
          timeLimitMin: 2,
          solution: "```bash\ngrep client-certificate-data ~/ops.kubeconfig | awk '{print $2}' | base64 -d | openssl x509 -noout -enddate\n# notAfter=Nov 19 03:12:21 2027 GMT\n```",
        },
      ],
    },
    tips: [
      "Trong phòng thi, chép nguyên lệnh `kubectl config use-context …` ở đầu mỗi câu và chạy nó trước khi đọc tiếp.",
      "`--kubeconfig <tệp>` không ghi gì vào `~/.kube/config`; `--context <tên>` chọn context cho một lệnh mà không đổi `current-context`.",
      "Viết `--kubeconfig ~/x` (dấu cách) hay `$HOME`: `--kubeconfig=~/x` không thay `~`.",
      "`k config view --minify` là câu hỏi \"kubectl đang dùng gì đây\": một cluster, một user, một context, đúng namespace mặc định.",
    ],
    outcome: {
      md: `dev và ops có kubeconfig riêng dùng được ở bất kỳ đâu, đã được apiserver nhận ra nhưng chưa có quyền. Trên Mac:

\`\`\`bash
./labs/lab verify cka s34
\`\`\`

Verify đọc \`~/dev.kubeconfig\`, \`~/ops.kubeconfig\` bằng PyYAML: đúng một cluster, một user, một context, \`current-context\` trỏ nó; \`server\` như \`~/.kube/config\`; \`certificate-authority-data\` là CA của cluster, không \`insecure-skip-tls-verify\`; user chỉ có \`client-certificate-data\` + \`client-key-data\` (đường dẫn tệp, token hay \`exec\` đều đỏ), cert nhúng do CA cluster ký với đúng CN/O và key khớp; namespace mặc định \`shop\` (dev) và \`default\` (ops); quyền \`600\`, chủ \`ubuntu\`. Rồi **gọi API bằng chính hai tệp**: \`auth whoami\` ra đúng user và group, \`get pods\` phải \`Forbidden\` có \`User "dev"\`/\`"ops"\` và đúng namespace (không \`Unauthorized\`; chạy được là đã có quyền, sớm hơn s35), và \`~/.kube/config\` vẫn xác thực là \`kubernetes-admin\`. Ba đáp án về \`stranger.kubeconfig\`.`,
      verifyOutput: "lab: kiểm s34\n  (chờ apiserver, nếu đang khởi động: tối đa ~5 phút)\n  ✓ ~/dev.kubeconfig: 1 cluster/user/context, server như ~/.kube/config, CA + cert dev nhúng, namespace shop, quyền 600\n  ✓ ~/ops.kubeconfig: 1 cluster/user/context, server như ~/.kube/config, CA + cert ops nhúng, namespace default, quyền 600\n  ✓ Gọi API bằng hai tệp: whoami ra dev/shop-dev, ops/shop-ops; get pods Forbidden đúng user; ~/.kube/config vẫn là admin\n  ✓ answers.env: STRANGER_SERVER, STRANGER_USER, STRANGER_NS của current-context trong stranger.kubeconfig\n  → 4/4 đạt",
      projectDelta: "shop có hai cửa đăng nhập riêng: dev.kubeconfig (namespace shop) và ops.kubeconfig (default), nhúng cert nên mang đi được. Cả hai đều Forbidden; s35 gắn quyền bằng RBAC theo group shop-dev và shop-ops.",
    },
    review: [
      { q: "Ba danh sách và một con trỏ của kubeconfig là gì, và tên user trong kubeconfig có quyết định danh tính không?", a: "`clusters` (server + CA), `users` (cách chứng minh danh tính), `contexts` (cluster + user + namespace), `current-context` chọn context. Tên trong tệp chỉ là nhãn cục bộ: danh tính là CN/O của cert hay chủ của token; đặt user tên `admin` với cert của dev thì vẫn là dev." },
      { q: "`KUBECONFIG=a:b kubectl config use-context x` ghi vào tệp nào? Vì sao bài dùng `--kubeconfig`?", a: "Vào tệp đầu tiên (`a`), kể cả khi context `x` nằm ở `b` (đo: `~/.kube/config` bị đổi `current-context`, kubectl không cờ báo `context was not found`). `--kubeconfig` chỉ đọc/ghi đúng một tệp, nên làm việc với tệp của dev/ops không đụng tệp admin." },
      { q: "Vì sao nhúng cert, và cái giá là gì?", a: "Không nhúng thì kubeconfig chỉ giữ đường dẫn, mang sang máy/người khác là `unable to read client-cert …: no such file or directory`. Nhúng thì tệp tự đủ; nhưng nó chứa private key, nên phải `600` và giữ như mật khẩu: ai có tệp là đóng vai được user tới khi cert hết hạn." },
      { q: "`Unauthorized` và `Forbidden` khác nhau thế nào khi gọi bằng kubeconfig mới?", a: "`Unauthorized` (401): apiserver không xác thực được (cert không do CA cluster ký, hết hạn, token sai): lỗi ở cert/kubeconfig. `Forbidden` (403): đã biết là `User \"dev\"` nhưng RBAC không cho: kubeconfig đúng, thiếu quyền. Cuối s34 dev và ops phải ra `Forbidden`." },
      { q: "Kubeconfig lạ có context hiện tại tên `audit`. Làm sao biết chắc nó dùng server và user nào trong 10 giây?", a: "`k config get-contexts --kubeconfig <tệp>` (dòng có `*`: CLUSTER, AUTHINFO, NAMESPACE), rồi `k config view --minify --kubeconfig <tệp>` cho `server` của cluster đó. Tên context không nói gì: ở đây `audit` → cluster `staging` (`https://10.20.30.40:6443`), user `auditor`, namespace `billing`." },
    ],
  },
// ───────────────────────────── s35 ─────────────────────────────
  {
    id: "s35",
    stage: "st6",
    title: "RBAC và ServiceAccount",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-rbac"],
    requires: ["s34"],
    status: "skeleton",
    pieces: ["rbac"],
    goals: [
      "Cho group shop-dev quyền triển khai trong namespace shop, group shop-ops quyền đọc node và mọi namespace.",
      "Chạy order bằng ServiceAccount riêng chỉ đọc được ConfigMap của nó.",
      "Kiểm từng quyền bằng auth can-i --as trước khi giao cho người dùng.",
    ],
    skills: [
      { skill: "k-create-role", level: "Gõ được không tra" },
      { skill: "k-create-rolebinding", level: "Gõ được không tra" },
      { skill: "k-create-clusterrole", level: "Gõ được không tra" },
      { skill: "k-create-clusterrolebinding", level: "Gõ được không tra" },
      { skill: "k-auth-can-i", level: "Thành phản xạ" },
      { skill: "k-auth-can-i-list", level: "Gõ được không tra" },
      { skill: "k-create-sa", level: "Gõ được không tra" },
      { skill: "k-create-token", level: "Gõ được không tra" },
    ],
    uses: ["k-kubeconfig-flag", "k-use-context", "k-exam-vars", "k-rollout-restart"],
    stateIn: "Đầu ra s34: dev và ops có kubeconfig nhưng chưa có quyền.",
    stateOut: "Vai dev triển khai được trong shop nhưng không đọc được node; vai ops đọc được mọi thứ nhưng không sửa được; order chạy bằng SA order.",
  },
  {
    id: "s36",
    stage: "st6",
    title: "Sự cố chặng 6: Forbidden và kubeconfig hỏng",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-components"],
    requires: ["s35"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Sửa trong 20 phút một kubeconfig trỏ sai server và sai cert, cùng một RoleBinding gắn nhầm chủ thể.",
      "Đọc một thông báo Forbidden và nói ngay thiếu quyền gì, ở API group nào, namespace nào.",
      "Tìm đúng API group của một resource để viết Role cho nó.",
    ],
    skills: [
      { skill: "k-forbidden-read", level: "Nhận ra trong 30 giây" },
      { skill: "k-auth-whoami", level: "Gõ được không tra" },
      { skill: "k-describe-rbac", level: "Gõ được không tra" },
      { skill: "k-kubeconfig-server", level: "Gõ được có tra" },
      { skill: "k-api-resources", level: "Gõ được không tra" },
    ],
    uses: ["k-auth-can-i", "k-config-view-minify", "lx-openssl-x509", "k-create-rolebinding"],
    stateIn: "Đầu ra s35 cộng `./labs/lab break`: kubeconfig của dev và quyền của ops bị làm hỏng.",
    stateOut: "dev và ops có đúng quyền như cuối s35, kubeconfig của cả hai dùng được.",
  },
];
