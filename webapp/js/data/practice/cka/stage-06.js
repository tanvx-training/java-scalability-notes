// Chặng 6 — Bảo mật truy cập: PKI, kubeconfig, RBAC.
// s33–s36 đã phát hành (đợt 4).

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
| \`ca.crt\` (\`CN=kubernetes\`, 10 năm) | \`apiserver.crt\` (server), \`apiserver-kubelet-client.crt\`, cert client trong \`admin.conf\`, \`super-admin.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`, cert **client** của kubelet (cert serving của kubelet mặc định tự ký, trừ khi bật \`serverTLSBootstrap\`); **và mọi CSR \`kube-apiserver-client\`** | tin cậy chung của cluster; \`--client-ca-file\` của apiserver |
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

**CSR là object tạm.** kube-controller-manager có bộ dọn CSR (csrcleaner): CSR đã cấp cert bị xoá khi điều kiện \`Approved\` cũ hơn 1 giờ (bị từ chối hay Failed: 1 giờ; đang chờ: 24 giờ; cert đã hết hạn: xoá). Nó quét lúc controller khởi động rồi cứ mỗi giờ một lần. Đo trên lab (2026-11-19): lượt quét lúc khởi động (04:21 UTC) không xoá gì, kể cả CSR \`csr-…\` của kubelet đã duyệt từ 5 ngày trước; lượt quét đúng 1 giờ sau (05:21, kube-controller-manager giữ leader suốt) xoá ba CSR \`csr-…\` đó, còn \`dev\`, \`ops\` mới duyệt được 59 phút nên chờ tới lượt sau. Vì sao lượt đầu không thấy gì: đọc mã nguồn thì lượt đó chạy trước khi cache của controller kịp đồng bộ (giả thuyết, chưa chứng minh). Hệ quả đo được: CSR chỉ mất khi controller chạy liền ít nhất một giờ, nên trên lab hay tắt bật VM, CSR có thể còn nhiều ngày, còn cluster chạy liên tục dọn CSR \`dev\` sau 1–2 giờ. Đừng dựa vào việc nó còn hay mất: lưu \`status.certificate\` ra tệp ngay, và giữ YAML của CSR trong \`~/users/\` để làm lại được. Cert đã cấp không bị ảnh hưởng khi CSR bị xoá.`,
    refs: [
      { label: "Bài lộ trình CKA: tạo user bằng certificate — key, CSR, approve, kubeconfig", href: "#/roadmap/cka/cka-w7-2" },
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
      { label: "Bài lộ trình CKA: tạo user bằng certificate — đến bước kubeconfig", href: "#/roadmap/cka/cka-w7-2" },
      { label: "CKA Study Guide, chương 3 — tương tác với Kubernetes", href: "#/docs/ckabook-03" },
      { label: "kubernetes.io: Organizing Cluster Access Using kubeconfig Files", href: "https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/" },
      { label: "kubernetes.io: Configure Access to Multiple Clusters", href: "https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/" },
      { label: "kubernetes.io: kubectl config (reference)", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_config/" },
      { label: "Bài thực hành s33 — PKI, CSR cho dev và ops", href: "#/practice/cka/s33" },
    ],
    stateIn: "Đầu ra s33: ~/users/dev.{key,crt}, ~/users/ops.{key,crt} do CA cluster ký; ~/.kube/config là kubernetes-admin. `./labs/lab begin cka s34` kiểm đầu vào bằng verify của s33, tạo ~/drills/s34 với stranger.kubeconfig (kubeconfig lạ ba context), xoá answers.env cũ.",
    stateOut: "Trên cka-cp: /home/ubuntu/dev.kubeconfig (context dev@kubernetes, namespace shop) và /home/ubuntu/ops.kubeconfig (ops@kubernetes, namespace default), mỗi tệp một cluster/user/context, server như admin.conf (https://192.168.252.35:6443 trên lab), CA + cert + key nhúng, quyền 600 chủ ubuntu; gọi API bằng chúng được xác thực nhưng chưa có quyền nào (Forbidden); ~/.kube/config vẫn là kubernetes-admin; ~/drills/s34/answers.env.",
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

Verify đọc \`~/dev.kubeconfig\`, \`~/ops.kubeconfig\` bằng PyYAML: đúng một cluster, một user, một context, \`current-context\` trỏ nó; \`server\` như trong \`/etc/kubernetes/admin.conf\` (verify đọc bằng sudo); \`certificate-authority-data\` là CA của cluster, không \`insecure-skip-tls-verify\`; user chỉ có \`client-certificate-data\` + \`client-key-data\` (đường dẫn tệp, token hay \`exec\` đều đỏ), cert nhúng do CA cluster ký với đúng CN/O và key khớp; namespace mặc định \`shop\` (dev) và \`default\` (ops); quyền \`600\`, chủ \`ubuntu\`. Rồi **gọi API bằng chính hai tệp**: \`auth whoami\` ra đúng user và group, \`get pods\` phải \`Forbidden\` có \`User "dev"\`/\`"ops"\` và đúng namespace (không \`Unauthorized\`; chạy được là đã có quyền, sớm hơn s35), và \`~/.kube/config\` vẫn xác thực là \`kubernetes-admin\`. Ba đáp án về \`stranger.kubeconfig\`.`,
      verifyOutput: "lab: kiểm s34\n  (chờ apiserver, nếu đang khởi động: tối đa ~5 phút)\n  ✓ ~/dev.kubeconfig: 1 cluster/user/context, server như admin.conf, CA + cert dev nhúng, namespace shop, quyền 600\n  ✓ ~/ops.kubeconfig: 1 cluster/user/context, server như admin.conf, CA + cert ops nhúng, namespace default, quyền 600\n  ✓ Gọi API bằng hai tệp: whoami ra dev/shop-dev, ops/shop-ops; get pods Forbidden đúng user; ~/.kube/config vẫn là admin\n  ✓ answers.env: STRANGER_SERVER, STRANGER_USER, STRANGER_NS của current-context trong stranger.kubeconfig\n  → 4/4 đạt",
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
    status: "published",
    pieces: ["rbac"],
    goals: [
      "Cho group shop-dev quyền triển khai trong namespace shop, group shop-ops quyền chỉ đọc node và mọi namespace.",
      "Chạy order bằng ServiceAccount riêng chỉ đọc được ConfigMap của nó.",
      "Kiểm từng quyền bằng auth can-i --as trước khi giao, rồi bằng kubeconfig thật của người dùng.",
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
    foundation: null,
    mindset: `**RBAC chỉ cộng, không trừ.** Một request được phép khi **có ít nhất một** binding cho chủ thể của nó mang rule khớp. Không có rule "cấm", không có thứ tự ưu tiên. Mặc định là cấm (đầu s35 dev và ops đều \`Forbidden\`, s34). Vì thế: muốn biết ai làm được gì, phải nhìn **mọi** binding trỏ tới user, **mọi** group của user (kể cả \`system:authenticated\`, group mọi người đã xác thực đều có) và ServiceAccount. Muốn rút quyền, phải gỡ đúng binding đang cấp nó: thêm một Role "hẹp hơn" không làm gì cả.

**Bốn object, hai câu hỏi: "quyền gì" và "cho ai, ở đâu".**

| | Định nghĩa quyền (rules) | Gắn quyền cho chủ thể |
|---|---|---|
| Trong một namespace | **Role** (namespaced) | **RoleBinding**: hiệu lực chỉ trong namespace của nó; trỏ được tới Role cùng namespace **hay một ClusterRole** (dùng lại bộ rule chung, như \`view\`, \`edit\`) |
| Cả cluster | **ClusterRole** | **ClusterRoleBinding**: hiệu lực ở mọi namespace và với resource không thuộc namespace nào (\`nodes\`, \`namespaces\`, \`persistentvolumes\`, \`clusterroles\`) |

Đọc node chỉ cấp được bằng ClusterRole + **ClusterRoleBinding**: một RoleBinding trỏ ClusterRole có \`nodes\` vẫn không cho đọc node, vì node không nằm trong namespace nào. \`roleRef\` của binding **không sửa được** sau khi tạo (muốn đổi thì xoá rồi tạo lại); \`subjects\` thì sửa được.

**Một rule = apiGroups × resources × verbs** (thêm \`resourceNames\` nếu cần). API group lấy ở cột APIVERSION của \`k api-resources\`: \`v1\` là group lõi \`""\`, \`apps/v1\` là \`apps\`, \`autoscaling/v2\` là \`autoscaling\`. Verb: \`get\`, \`list\`, \`watch\` (đọc), \`create\`, \`update\`, \`patch\`, \`delete\`, \`deletecollection\`. **Subresource là resource riêng:** \`pods/log\` (\`k logs\`), \`pods/exec\` (\`k exec\`, verb \`create\`), \`deployments/scale\` (\`k scale\`). Quyền trên \`pods\` không kéo theo \`pods/exec\`. \`resourceNames\` chỉ giới hạn được thao tác có tên trên URL: \`get configmap/order-config\` thì được, \`list configmaps\` thì không (đo: SA order bị \`Forbidden\` khi \`list\` dù rule có \`list\`).

**Chủ thể có ba loại, và loại là một phần của tên.** \`kind: User\`, \`kind: Group\` (cả hai \`apiGroup: rbac.authorization.k8s.io\`) và \`kind: ServiceAccount\` (có \`namespace\`). Cert của dev mang \`CN=dev, O=shop-dev\`: username \`dev\`, group \`shop-dev\`. Binding cho **User** \`shop-dev\` là cho một người tên "shop-dev" không tồn tại, và dev không được gì (tình huống hỏng của buổi, đo bằng \`--as\`). Gắn quyền theo **group** để người mới vào đội chỉ cần cert có đúng \`O\`.

**ServiceAccount là danh tính của Pod.** Mỗi namespace có SA \`default\`; Pod không khai \`serviceAccountName\` chạy bằng nó. SA \`order\` xác thực là \`system:serviceaccount:shop:order\`, thuộc group \`system:serviceaccounts\`, \`system:serviceaccounts:shop\` (đo bằng \`auth whoami\` với token của nó). Token được kubelet chiếu vào Pod tại \`/var/run/secrets/kubernetes.io/serviceaccount/token\` (\`automountServiceAccountToken\` mặc định bật; token có hạn, kubelet tự xoay). \`k create token order\` xin một token mới qua TokenRequest: không tạo Secret nào, chỉ in token ra. SA của Pod **không đổi được** trên Pod đang chạy: đổi \`serviceAccountName\` của Deployment thì ReplicaSet mới tạo Pod mới. Ngược lại, sửa Role hay binding có hiệu lực **ngay ở request kế tiếp**, không cần khởi động lại gì.

**Ai đọc ConfigMap.** \`envFrom: configMapRef\` do **kubelet** đọc, bằng danh tính của node, nên app không cần quyền RBAC nào để có biến môi trường. Role \`order-config-reader\` có nghĩa khi **chính app** gọi API: Spring Cloud Kubernetes Config (\`spring.cloud.kubernetes.config.sources\`) đọc ConfigMap qua API bằng token của SA để nạp lại cấu hình khi ConfigMap đổi. Lab không cài thư viện đó; buổi này kiểm quyền bằng chính token của SA (\`create token\`, rồi \`curl\` từ một Pod tạm), như app sẽ làm.

**Cùng ý với Spring Security.**

| Spring Security | RBAC |
|---|---|
| \`GrantedAuthority\` / role \`ROLE_DEV\` gắn cho user | Role \`shop-deployer\` gắn cho group \`shop-dev\` bằng RoleBinding |
| \`requestMatchers("/api/orders/**").hasRole("DEV")\` | rule \`apiGroups: [apps], resources: [deployments], verbs: [patch]\` |
| \`authorizeHttpRequests(...).anyRequest().denyAll()\`: không khớp quy tắc nào thì cấm | RBAC mặc định cấm; nhưng RBAC **không có** \`denyAll()\` cho một đường cụ thể: chỉ có quyền cộng thêm |
| \`@PreAuthorize\` trên method, kiểm từng hành động | verb trên từng resource và subresource (\`pods/exec\` khác \`pods\`) |
| Test bằng \`@WithMockUser(roles = "DEV")\` | \`k auth can-i … --as dev --as-group shop-dev\` |

**Vừa đủ quyền cho \`shop-deployer\`.** Việc của đội dev trong shop: apply/rollout/set image Deployment (\`create/update/patch/delete\` trên \`deployments\`; \`rollout restart\` là một \`patch\`), Service, ConfigMap, HPA của catalog; xem Pod, log, Event, ReplicaSet (\`rollout status/history\` đọc ReplicaSet); \`exec\` vào Pod; xoá Pod để nó được tạo lại. Không có: Secret (mật khẩu PostgreSQL), NetworkPolicy, StatefulSet \`postgres\`, ResourceQuota/LimitRange (việc của ops), RBAC (tự cấp quyền) và \`deployments/scale\` (catalog do HPA co giãn; s36 dùng đúng lỗ hổng này làm bài đọc Forbidden).`,
    refs: [
      { label: "Bài lộ trình CKA: RBAC chuyên sâu — Role/ClusterRole, aggregated ClusterRoles", href: "#/roadmap/cka/cka-w7-1" },
      { label: "Bài lộ trình CKA: ServiceAccounts và token", href: "#/roadmap/cka/cka-w7-3" },
      { label: "Bài lộ trình CKA: kubectl auth can-i mọi biến thể", href: "#/roadmap/cka/cka-w7-4" },
      { label: "CKA Study Guide, chương 6 — xác thực, uỷ quyền và kiểm soát tiếp nhận", href: "#/docs/ckabook-06" },
      { label: "Spring Security in Action, chương 7 — authorization ở mức endpoint (authority và role)", href: "#/docs/springsec-07" },
      { label: "kubernetes.io: Using RBAC Authorization", href: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/" },
      { label: "kubernetes.io: Configure Service Accounts for Pods", href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/" },
      { label: "kubernetes.io: Managing Service Accounts (TokenRequest, bound token)", href: "https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/" },
    ],
    stateIn: "Đầu ra s34: ~/dev.kubeconfig và ~/ops.kubeconfig xác thực được nhưng Forbidden mọi thứ; order chạy bằng SA default và không dùng ConfigMap nào. `./labs/lab begin cka s35` kiểm đầu vào bằng check.sh riêng (phần bền của s34: kubeconfig, whoami, đáp án; không đòi Forbidden, để chạy lại được giữa buổi) và tạo ~/drills/s35.",
    stateOut: "~/shop/rbac.yaml (SA order; Role shop-deployer + RoleBinding shop-dev cho Group shop-dev ở shop; ClusterRole shop-ops-view chỉ get/list/watch, có nodes, không Secret + ClusterRoleBinding shop-ops cho Group shop-ops; Role order-config-reader theo resourceNames [order-config] + RoleBinding cùng tên cho SA shop/order) khớp cluster; ConfigMap order-config (~/shop/order-config.yaml); Deployment order chạy bằng SA order, envFrom order-config. dev triển khai được trong shop, không đọc node hay kube-system; ops đọc được node và mọi namespace (trừ Secret), không sửa được gì.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s35`. Đọc RBAC có sẵn: `k get clusterrole | grep -v '^system:'` (ngoài role của Calico, ingress-nginx…, có bốn ClusterRole mặc định cho người dùng: `cluster-admin`, `admin`, `edit`, `view`), `k describe clusterrole view | head -20`, `k get clusterrolebinding -o wide | grep -E 'NAME|cluster-admin'` (ai đang là cluster-admin, qua group nào?). `k auth can-i get nodes --as dev` và `… --as dev --as-group shop-dev`: vì sao `--as` một mình chưa giống dev thật?",
      },
      {
        id: "t2",
        text: "Role `shop-deployer` ở shop: sinh khung `k -n shop create role shop-deployer --verb=get,list,watch,create,update,patch,delete --resource=deployments.apps,services,configmaps,horizontalpodautoscalers.autoscaling $do > ~/shop/rbac.yaml`, rồi sửa tệp thêm rule: `replicasets` (apps) và `events` chỉ đọc; `pods` đọc và `delete`; `pods/log` `get`; `pods/exec` `create`. RoleBinding `shop-dev`: `k -n shop create rolebinding shop-dev --role=shop-deployer --group=shop-dev $do`, nối vào tệp sau một dòng `---`. `k apply -f ~/shop/rbac.yaml`. Vì sao không cho Secret và `deployments/scale`?",
      },
      {
        id: "t3",
        text: "Kiểm trước khi giao: `k auth can-i create deployments -n shop --as dev --as-group shop-dev`, `… get nodes …`, `… list pods -n kube-system …`, `… create clusterroles …`, rồi `k auth can-i --list -n shop --as dev --as-group shop-dev`. Rồi bằng danh tính thật: `k --kubeconfig ~/dev.kubeconfig auth can-i --list`, `k --kubeconfig ~/dev.kubeconfig get pods`, `k --kubeconfig ~/dev.kubeconfig -n shop create deploy probe --image=shop/catalog:1.0 --dry-run=server` (server kiểm quyền mà không tạo gì), `… get nodes`.",
      },
      {
        id: "t4",
        text: "Bấm giờ, dưới 4 phút: ClusterRole `shop-ops-view` chỉ `get,list,watch` trên `nodes,namespaces,pods,pods/log,services,endpoints,events,configmaps,persistentvolumes,persistentvolumeclaims,deployments.apps,replicasets.apps,statefulsets.apps,daemonsets.apps,horizontalpodautoscalers.autoscaling,jobs.batch,cronjobs.batch,networkpolicies.networking.k8s.io,ingresses.networking.k8s.io,endpointslices.discovery.k8s.io,nodes.metrics.k8s.io,pods.metrics.k8s.io` (không Secret), ClusterRoleBinding `shop-ops` cho `--group=shop-ops`; thêm cả hai vào `~/shop/rbac.yaml` và apply. Bằng `~/ops.kubeconfig`: `get nodes`, `get pods -A`, `top node` được; `-n shop delete pod <một Pod>`, `cordon cka-w1`, `-n shop get secret db-cred` phải `Forbidden`.",
      },
      {
        id: "t5",
        text: "ServiceAccount của order. `k -n shop create configmap order-config --from-literal=CATALOG_URL=http://catalog:8080 $do > ~/shop/order-config.yaml`, apply. Vào `~/shop/rbac.yaml` (mỗi object sau một `---`): `k -n shop create sa order $do`, `k -n shop create role order-config-reader --verb=get,list,watch --resource=configmaps --resource-name=order-config $do`, `k -n shop create rolebinding order-config-reader --role=order-config-reader --serviceaccount=shop:order $do`. Sửa `~/shop/order.yaml`: `serviceAccountName: order` trong `spec.template.spec`, `envFrom: [{configMapRef: {name: order-config}}]` trong container. Apply cả ba tệp, `k rollout restart deploy order`, `k rollout status deploy order`, rồi `k get pod -l app=order -o custom-columns=POD:.metadata.name,SA:.spec.serviceAccountName`. Pod cũ có đổi SA tại chỗ không?",
      },
      {
        id: "t6",
        text: "Gọi API bằng token của SA. `t=$(k -n shop create token order --duration=10m)`; giải mã phần giữa: `echo $t | cut -d. -f2 | base64 -d` (sub, aud, exp?). Pod tạm ở **default** (shop đã default-deny, Pod mới ở đó không ra được apiserver): `k -n default run sa-probe --image=nicolaka/netshoot:v0.16@sha256:b09d9b21381f47a79b3cbcb30da25266dc17186ea00ae65e99fdc51396f48e70 --command -- sleep 600`, rồi `k -n default exec sa-probe -- curl -s -o /dev/null -w '%{http_code}\\n' --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt -H \"Authorization: Bearer $t\" https://kubernetes.default.svc/api/v1/namespaces/shop/configmaps/order-config`; thử `configmaps/shop-config` và `secrets/db-cred`. `k auth can-i --list -n shop --as=system:serviceaccount:shop:order`. Xoá `sa-probe`.",
      },
      {
        id: "t7",
        text: "Tình huống hỏng: `k -n default create rolebinding dev-draft --clusterrole=view --group=shop-dev $do > ~/drills/s35/dev-draft.yaml`, đổi `kind: Group` thành `kind: User`, apply. `k auth can-i list pods -n default --as dev --as-group shop-dev` và `… --as shop-dev`: kết quả nói gì? `k -n default get rolebinding dev-draft -o wide` (cột USERS hay GROUPS?). Xoá `dev-draft`. Trên Mac: `./labs/lab verify cka s35` phải đạt 4/4.",
      },
    ],
    hints: [
      "`--as dev` không kèm `--as-group` là hỏi cho một user `dev` **không có group nào** (ngoài `system:authenticated`): binding theo group shop-dev không áp vào, kết quả `no` dù dev thật làm được. Luôn ghép `--as dev --as-group shop-dev`, hay hỏi thẳng bằng `--kubeconfig ~/dev.kubeconfig`.",
      "`auth can-i get nodes` với dev.kubeconfig in thêm `Warning: resource 'nodes' is not namespace scoped` (đo): context của dev có `namespace: shop`, can-i báo cờ namespace thừa; kết quả vẫn đúng.",
      "`error: failed to create rolebinding: … cannot change roleRef` khi apply lại binding với Role khác: `roleRef` bất biến; `k delete rolebinding <tên>` rồi apply.",
      "`k logs` bị `Forbidden … cannot get resource \"pods/log\"` hay `k exec` bị `cannot create resource \"pods/exec\"`: subresource cần rule riêng; quyền `pods` không bao gồm chúng.",
      "SA order `list configmaps` bị `Forbidden` dù Role có verb `list`: `resourceNames` không lọc được `list` không tên (đo). Dùng `get configmap order-config`.",
      "Pod order vẫn SA `default` sau khi sửa tệp: bạn chưa apply `~/shop/order.yaml`, hay sửa nhầm `spec.serviceAccountName` của Deployment thay vì `spec.template.spec`. `k get deploy order -o jsonpath='{.spec.template.spec.serviceAccountName}'`.",
      "`curl` từ Pod tạm treo rồi `000`: Pod đang ở namespace có default-deny (shop). Dùng `default`.",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6); tên Pod, UID, token sẽ khác. Context đã ở namespace shop, \`do='--dry-run=client -o yaml'\` (k-exam-vars).

**1. RBAC có sẵn**

\`\`\`bash
k auth can-i get pods --as dev
# no
k auth can-i get pods --as dev --as-group shop-dev
# no                 (chưa có binding nào; sau t2 lệnh này ra yes, lệnh trên vẫn no)
\`\`\`

**2. Role shop-deployer và RoleBinding shop-dev**

\`~/shop/rbac.yaml\` sau t2, t4, t5 (bảy object, mỗi object sau một \`---\`; ClusterRole cắt bớt):

\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: order
  namespace: shop
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: shop-deployer
  namespace: shop
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: [""]
  resources: ["services", "configmaps"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["autoscaling"]
  resources: ["horizontalpodautoscalers"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["apps"]
  resources: ["replicasets"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch", "delete"]
- apiGroups: [""]
  resources: ["events"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
- apiGroups: [""]
  resources: ["pods/exec"]
  verbs: ["create"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: shop-dev
  namespace: shop
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: shop-deployer
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: shop-dev
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: shop-ops-view
rules:
- apiGroups:
  - ""
  resources:
  - nodes
  - namespaces
  - pods
  - pods/log
  # … services, endpoints, events, configmaps, persistentvolumes, persistentvolumeclaims
  verbs:
  - get
  - list
  - watch
- apiGroups:
  - apps
  # … deployments, replicasets, statefulsets, daemonsets; rồi autoscaling, batch, discovery.k8s.io, metrics.k8s.io, networking.k8s.io
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: shop-ops
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: shop-ops-view
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: shop-ops
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: order-config-reader
  namespace: shop
rules:
- apiGroups:
  - ""
  resourceNames:
  - order-config
  resources:
  - configmaps
  verbs:
  - get
  - list
  - watch
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: order-config-reader
  namespace: shop
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: order-config-reader
subjects:
- kind: ServiceAccount
  name: order
  namespace: shop
\`\`\`

\`create role\` chỉ nhận một bộ verb cho mọi \`--resource\` trong một lệnh, nên Role nhiều bộ verb là "sinh khung rồi sửa". \`--dry-run=client\` in thêm \`creationTimestamp: null\`: để nguyên hay xoá đều được.

\`\`\`bash
k apply -f ~/shop/rbac.yaml
# serviceaccount/order created
# role.rbac.authorization.k8s.io/shop-deployer created
# rolebinding.rbac.authorization.k8s.io/shop-dev created
# clusterrole.rbac.authorization.k8s.io/shop-ops-view created
# clusterrolebinding.rbac.authorization.k8s.io/shop-ops created
# role.rbac.authorization.k8s.io/order-config-reader created
# rolebinding.rbac.authorization.k8s.io/order-config-reader created
k describe rolebinding shop-dev
# Name:         shop-dev
# Role:
#   Kind:  Role
#   Name:  shop-deployer
# Subjects:
#   Kind   Name      Namespace
#   ----   ----      ---------
#   Group  shop-dev
\`\`\`

**3. Kiểm quyền của dev**

\`\`\`bash
for q in 'create deployments -n shop' 'patch deployments -n shop' 'get pods -n shop' 'get nodes' 'list pods -n kube-system' 'create clusterroles'; do
  printf '%-28s --as: %-4s dev.kubeconfig: %s\\n' "$q" "$(k auth can-i $q --as dev --as-group shop-dev)" "$(k --kubeconfig ~/dev.kubeconfig auth can-i $q 2>/dev/null)"
done
# create deployments -n shop   --as: yes  dev.kubeconfig: yes
# patch deployments -n shop    --as: yes  dev.kubeconfig: yes
# get pods -n shop             --as: yes  dev.kubeconfig: yes
# get nodes                    --as: no   dev.kubeconfig: no
# list pods -n kube-system     --as: no   dev.kubeconfig: no
# create clusterroles          --as: no   dev.kubeconfig: no
k --kubeconfig ~/dev.kubeconfig auth can-i --list | grep -v '\\[/'
# Resources                                       Non-Resource URLs   Resource Names   Verbs
# pods/exec                                       []                  []               [create]
# selfsubjectreviews.authentication.k8s.io        []                  []               [create]
# selfsubjectaccessreviews.authorization.k8s.io   []                  []               [create]
# selfsubjectrulesreviews.authorization.k8s.io    []                  []               [create]
# configmaps                                      []                  []               [get list watch create update patch delete]
# services                                        []                  []               [get list watch create update patch delete]
# deployments.apps                                []                  []               [get list watch create update patch delete]
# horizontalpodautoscalers.autoscaling            []                  []               [get list watch create update patch delete]
# pods                                            []                  []               [get list watch delete]
# events                                          []                  []               [get list watch]
# replicasets.apps                                []                  []               [get list watch]
# pods/log                                        []                  []               [get]
\`\`\`

Bốn dòng \`self…reviews\` có sẵn cho mọi user đã xác thực (\`auth whoami\`, \`auth can-i\` chạy được nhờ chúng). \`--dry-run=server\` của dev đi qua RBAC thật mà không tạo object.

**4. ops**

\`\`\`bash
k --kubeconfig ~/ops.kubeconfig get nodes
# NAME     STATUS   ROLES           AGE     VERSION
# cka-cp   Ready    control-plane   5d10h   v1.36.6
# cka-w1   Ready    <none>          5d10h   v1.36.6
# cka-w2   Ready    <none>          5d10h   v1.36.6
for q in 'get nodes' 'list pods -A' 'delete pods -n shop' 'patch nodes' 'get secrets -n shop'; do
  printf '%-28s ops.kubeconfig: %s\\n' "$q" "$(k --kubeconfig ~/ops.kubeconfig auth can-i $q 2>/dev/null)"
done
# get nodes                    ops.kubeconfig: yes
# list pods -A                 ops.kubeconfig: yes
# delete pods -n shop          ops.kubeconfig: no
# patch nodes                  ops.kubeconfig: no
# get secrets -n shop          ops.kubeconfig: no
k --kubeconfig ~/ops.kubeconfig -n shop scale deploy order --replicas=1
# Error from server (Forbidden): deployments.apps "order" is forbidden: User "ops" cannot patch resource "deployments/scale" in API group "apps" in the namespace "shop"
\`\`\`

Vì sao không Secret: ai \`get secret\` được là đọc được mật khẩu PostgreSQL và token cũ, tức "chỉ đọc" thành "đóng vai được người khác". ClusterRole \`view\` có sẵn cũng bỏ Secret vì lý do đó. \`cordon\` là \`patch nodes\`: \`no\`.

**5. ServiceAccount của order**

\`\`\`bash
k apply -f ~/shop/rbac.yaml -f ~/shop/order-config.yaml -f ~/shop/order.yaml
# configmap/order-config created
# deployment.apps/order configured
k rollout restart deploy order && k rollout status deploy order
# deployment "order" successfully rolled out
k get pod -l app=order -o custom-columns=POD:.metadata.name,SA:.spec.serviceAccountName
# POD                      SA
# order-5cc94c55ff-jrdfp   order
\`\`\`

Ngay sau \`apply\`, trong lúc rollout, có hai dòng: Pod cũ \`order-5b887cccd9-bpzxk  default\` và Pod mới \`order\`. \`serviceAccountName\` của Pod không đổi tại chỗ: Pod mới thay Pod cũ.

**6. Token của SA**

\`\`\`bash
t=$(k -n shop create token order --duration=10m)
echo $t | cut -d. -f2 | base64 -d; echo
# {"aud":["https://kubernetes.default.svc.cluster.local"],"exp":1795063833,"iat":1795063233,"iss":"https://kubernetes.default.svc.cluster.local","jti":"6e4bc5dd-…","kubernetes.io":{"namespace":"shop","serviceaccount":{"name":"order","uid":"dbc95306-…"}},"nbf":1795063233,"sub":"system:serviceaccount:shop:order"}
k -n default run sa-probe --image=nicolaka/netshoot:v0.16@sha256:b09d9b21381f47a79b3cbcb30da25266dc17186ea00ae65e99fdc51396f48e70 --command -- sleep 600
k -n default wait --for=condition=Ready pod/sa-probe
for p in configmaps/order-config configmaps/shop-config secrets/db-cred; do
  echo "$p → $(k -n default exec sa-probe -- curl -s -o /dev/null -w '%{http_code}' --cacert /var/run/secrets/kubernetes.io/serviceaccount/ca.crt -H "Authorization: Bearer $t" https://kubernetes.default.svc/api/v1/namespaces/shop/$p)"
done
# configmaps/order-config → 200
# configmaps/shop-config → 403
# secrets/db-cred → 403
k auth can-i --list -n shop --as=system:serviceaccount:shop:order | grep -v '\\[/'
# Resources                                       Non-Resource URLs   Resource Names   Verbs
# selfsubjectreviews.authentication.k8s.io        []                  []               [create]
# selfsubjectaccessreviews.authorization.k8s.io   []                  []               [create]
# selfsubjectrulesreviews.authorization.k8s.io    []                  []               [create]
# configmaps                                      []                  [order-config]   [get list watch]
k -n default delete pod sa-probe
\`\`\`

\`ca.crt\` mượn từ SA \`default\` của chính Pod tạm (mọi SA được chiếu cùng CA); token dùng là của \`order\`. Cùng token đó qua kubectl: \`k --kubeconfig /dev/null --server https://192.168.252.35:6443 --certificate-authority /etc/kubernetes/pki/ca.crt --token $t -n shop get secret db-cred\` → \`Error from server (Forbidden): secrets "db-cred" is forbidden: User "system:serviceaccount:shop:order" cannot get resource "secrets" in API group "" in the namespace "shop"\`. (\`--kubeconfig /dev/null\` để cert admin của \`~/.kube/config\` không được gửi kèm: đo, \`k --token $t auth whoami\` với \`~/.kube/config\` vẫn ra \`kubernetes-admin\`.)

**7. Tình huống hỏng**

\`\`\`bash
k -n default create rolebinding dev-draft --clusterrole=view --group=shop-dev $do | sed 's/kind: Group/kind: User/' > ~/drills/s35/dev-draft.yaml
k apply -f ~/drills/s35/dev-draft.yaml
k auth can-i list pods -n default --as dev --as-group shop-dev
# no
k auth can-i list pods -n default --as shop-dev
# yes
k -n default delete rolebinding dev-draft
\`\`\`

Binding cho \`User shop-dev\` có hiệu lực, nhưng cho một user tên "shop-dev" mà không cert nào mang CN đó. \`-o wide\` in \`shop-dev\` ở cột USERS thay vì GROUPS: chỗ nhìn nhanh nhất.

Lời giải tự động: \`labs/cka/sessions/s35/apply.sh\` (\`files/solve.sh\`: sinh \`~/shop/rbac.yaml\` bằng \`create … --dry-run=client\`, sửa \`order.yaml\` bằng PyYAML, apply; chạy lại được).`,
    exam: {
      patterns: [
        "\"Tạo Role/ClusterRole X cho phép <verb> trên <resource>, gắn cho user/group/SA Y trong namespace Z\" — `k create role|clusterrole … --verb … --resource …`, `k create rolebinding|clusterrolebinding … --role|--clusterrole … --user|--group|--serviceaccount ns:sa`; kiểm bằng `k auth can-i … --as`.",
        "\"Tạo ServiceAccount và cho Deployment dùng nó\" — `k create sa`, `k set serviceaccount deploy/<tên> <sa>` (hay sửa `spec.template.spec.serviceAccountName`), Pod mới tự thay Pod cũ.",
        "\"SA X có được làm Y không? Ghi kết quả vào /opt/…\" — `k auth can-i <verb> <resource> -n <ns> --as=system:serviceaccount:<ns>:<sa>`.",
        "\"Lấy token của SA\" — `k create token <sa> -n <ns>` (từ 1.24 SA không tự có Secret token).",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 3 phút: SA `reporter` ở shop, chỉ `list` và `get` Pod ở shop, không gì khác. Chứng minh bằng hai lệnh `auth can-i` (một yes, một no). Rồi xoá cả ba object.",
          timeLimitMin: 3,
          solution: "```bash\nk -n shop create sa reporter\nk -n shop create role pod-lister --verb=get,list --resource=pods\nk -n shop create rolebinding reporter --role=pod-lister --serviceaccount=shop:reporter\nk auth can-i list pods -n shop --as=system:serviceaccount:shop:reporter      # yes\nk auth can-i delete pods -n shop --as=system:serviceaccount:shop:reporter    # no\nk -n shop delete rolebinding reporter && k -n shop delete role pod-lister && k -n shop delete sa reporter\n```\nTên trong `--serviceaccount` là `<namespace>:<sa>`; trong `--as` là `system:serviceaccount:<namespace>:<sa>`.",
        },
        {
          text: "Trong 2 phút: cho group `shop-dev` quyền `view` (ClusterRole có sẵn) chỉ trong namespace `default`, không tạo Role mới. Kiểm dev đọc được Pod ở default nhưng vẫn không đọc được node. Rồi gỡ.",
          timeLimitMin: 2,
          solution: "```bash\nk -n default create rolebinding dev-view --clusterrole=view --group=shop-dev\nk auth can-i list pods -n default --as dev --as-group shop-dev   # yes\nk auth can-i list nodes --as dev --as-group shop-dev             # no\nk -n default delete rolebinding dev-view\n```\nRoleBinding trỏ ClusterRole: dùng lại bộ rule chung, hiệu lực chỉ trong namespace của binding.",
        },
      ],
    },
    tips: [
      "Sau mọi câu RBAC: `k auth can-i <verb> <resource> -n <ns> --as <user> [--as-group <group>]` cho một trường hợp \"được\" và một trường hợp \"không được\". Hai giây, bắt được lỗi `User`/`Group`.",
      "`k create clusterrole … --resource=` nhận `deployments.apps`, `horizontalpodautoscalers.autoscaling`: viết `<resource>.<group>` thì khỏi tra `apiGroups`.",
      "Trên đề, `--dry-run=client -o yaml > tệp` rồi sửa nhanh hơn viết YAML RBAC từ đầu, nhất là `roleRef`/`subjects`.",
      "`k get rolebinding,clusterrolebinding -A -o wide | grep <tên>` tìm mọi binding nhắc tới một user/group/SA (cột USERS, GROUPS, SERVICEACCOUNTS).",
    ],
    outcome: {
      md: `dev triển khai được trong shop, ops nhìn được cả cluster mà không sửa được gì, order chạy bằng danh tính riêng. Trên Mac:

\`\`\`bash
./labs/lab verify cka s35
\`\`\`

Verify hỏi quyền **bằng chính hai kubeconfig** của s34 (không \`--as\`), nên cert, kubeconfig và binding cùng được chấm. dev: \`create\`/\`patch\` Deployment và \`get pods\` ở shop phải \`yes\` (và một \`get pods\` thật chạy được); \`get nodes\`, \`list pods\`/\`get secrets\`/\`create deployments\`/\`delete configmaps\`/\`patch daemonsets\` ở kube-system và \`create clusterroles\` phải \`no\` (dev là cluster-admin, hay RoleBinding cho \`system:authenticated\`: đỏ). ops: \`get nodes\`, \`list pods -A\` \`yes\`; \`create\`/\`patch\`/\`delete\` trên Deployment, Pod, node, namespace, ClusterRoleBinding và đọc Secret \`no\` (ops có \`*\`: đỏ). SA order: Deployment và mọi Pod order chạy bằng SA \`order\`, Deployment dùng ConfigMap \`order-config\`, Available; token thật của SA (\`create token\`) đọc được \`order-config\`, không đọc \`shop-config\`, không \`list\` ConfigMap, không đọc \`db-cred\`. Cuối cùng \`~/shop/rbac.yaml\` có đủ bảy object và khớp cluster (rules, subjects, roleRef), binding gắn đúng **Group**, \`shop-ops-view\` chỉ \`get\`/\`list\`/\`watch\` và có \`nodes\`, \`order-config-reader\` chỉ theo \`resourceNames\`; \`~/shop/\` có Deployment order với \`serviceAccountName: order\` và ConfigMap \`order-config\`.`,
      verifyOutput: "lab: kiểm s35\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~9 phút)\n  ✓ dev (dev.kubeconfig): create/patch deploy, get pods ở shop được; get nodes, kube-system, create clusterrole không\n  ✓ ops (ops.kubeconfig): get nodes, list pods -A được; create/patch/delete ở mọi nơi và đọc Secret không\n  ✓ Pod order chạy bằng SA order, Available; token SA order đọc được ConfigMap của order, không ConfigMap khác, không Secret db-cred\n  ✓ ~/shop/rbac.yaml có đủ 7 object RBAC/SA và khớp cluster; ~/shop/ giữ serviceAccountName: order\n  → 4/4 đạt",
      projectDelta: "shop có phân quyền theo vai: đội dev (group shop-dev) triển khai trong namespace shop, đội vận hành (shop-ops) chỉ đọc cả cluster, và order chạy bằng ServiceAccount riêng chỉ đọc được ConfigMap order-config. Mọi quyền nằm trong ~/shop/rbac.yaml; chart Helm ở s37 nhận lại SA/Role/RoleBinding của order.",
    },
    review: [
      { q: "RBAC có rule \"cấm\" không? Muốn chắc dev không đọc được Secret thì phải kiểm gì?", a: "Không: RBAC chỉ cộng, mặc định là cấm. Một request được phép khi bất kỳ binding nào cho user, cho một group của user (kể cả `system:authenticated`) hay cho SA có rule khớp. Kiểm bằng `k auth can-i get secrets -n shop --as dev --as-group shop-dev` và tìm mọi binding nhắc tới dev/shop-dev/system:authenticated (`k get rolebinding,clusterrolebinding -A -o wide`)." },
      { q: "ops cần đọc node. Vì sao một RoleBinding trỏ ClusterRole `shop-ops-view` không đủ?", a: "RoleBinding chỉ có hiệu lực trong namespace của nó; node không thuộc namespace nào, nên chỉ ClusterRoleBinding cấp được quyền trên `nodes` (cùng `namespaces`, `persistentvolumes`). RoleBinding trỏ ClusterRole dùng để tái sử dụng bộ rule trong một namespace." },
      { q: "RoleBinding với `subjects: [{kind: User, name: shop-dev}]` có lỗi gì, và nhìn ra ở đâu nhanh nhất?", a: "Gắn quyền cho một user tên shop-dev, trong khi dev là user `dev` thuộc group `shop-dev`: dev không được gì (`can-i … --as dev --as-group shop-dev` ra no). `k get rolebinding -o wide`: tên nằm ở cột USERS thay vì GROUPS; `k describe rolebinding`: `Kind User`." },
      { q: "Pod order dùng `envFrom` ConfigMap `order-config`. Nó có cần Role `order-config-reader` để nhận biến môi trường không?", a: "Không: kubelet đọc ConfigMap bằng danh tính của node khi dựng container. Role cho SA chỉ cần khi chính app gọi API bằng token của nó (ví dụ Spring Cloud Kubernetes Config đọc và theo dõi ConfigMap). Buổi này kiểm quyền đó bằng token thật của SA." },
      { q: "So với Spring Security, `hasRole(\"DEV\")` trên một đường dẫn tương ứng với gì trong RBAC, và RBAC thiếu gì so với Spring?", a: "Role (tập rule verb × resource) gắn cho group shop-dev qua RoleBinding; `@WithMockUser` tương ứng `auth can-i --as`. RBAC không có quy tắc cấm cho một đường cụ thể như `denyAll()` hay thứ tự matcher: chỉ có cộng quyền, nên quyền rộng ở một binding không thể bị một binding khác thu hẹp." },
    ],
  },
// ───────────────────────────── s36 ─────────────────────────────
  {
    id: "s36",
    stage: "st6",
    title: "Sự cố chặng 6: Forbidden và kubeconfig hỏng",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-components"],
    requires: ["s35"],
    status: "published",
    pieces: [],
    goals: [
      "Sửa trong 20 phút một kubeconfig trỏ sai server và sai cert, cùng một ClusterRoleBinding gắn nhầm chủ thể.",
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
    foundation: null,
    mindset: `**Một lệnh kubectl đi qua ba cửa, và mỗi cửa hỏng theo một kiểu.** Đọc dòng lỗi là biết request dừng ở cửa nào, và cần nhìn phần nào của kubeconfig hay RBAC:

| Thông báo (đo trên lab) | Request dừng ở | Nhìn vào |
|---|---|---|
| \`Unable to connect to the server: dial tcp …: connect: connection refused\` / \`i/o timeout\` | chưa tới được ai | \`server\` (IP, cổng) của cluster trong kubeconfig |
| \`Unable to connect to the server: tls: failed to verify certificate: x509: …\` | TLS: client không tin server | \`server\` trỏ nhầm dịch vụ khác, hay \`certificate-authority-data\` sai CA |
| \`error: You must be logged in to the server (Unauthorized)\` (401) | xác thực: apiserver không nhận ra bạn | cert không do CA cluster ký, hết hạn, token sai hay hết hạn |
| \`Error from server (Forbidden): … User "x" cannot <verb> resource "<r>" in API group "<g>" …\` (403) | uỷ quyền: biết bạn là ai, RBAC không cho | danh tính trong câu (đúng người chưa?), rồi binding và rule |

Biến thể TLS của sự cố hôm nay: \`server\` trỏ cổng 10250 của cka-cp, nơi **kubelet** nghe. Cert serving của kubelet tự ký (\`issuer=CN = cka-cp-ca@…\`) và chỉ có \`DNS:cka-cp\` trong SAN, nên kubectl báo \`x509: cannot validate certificate for 192.168.252.35 because it doesn't contain any IP SANs\` (đo). Câu đó **không** nói apiserver sai cert: nó nói bạn không nói chuyện với apiserver. \`curl -sk https://<ip>:<cổng>/healthz\` cho biết ai đang nghe (kubelet trả \`Unauthorized\`, apiserver trả \`ok\`).

**Forbidden đọc theo năm phần.** \`deployments.apps "order" is forbidden: User "dev" cannot patch resource "deployments/scale" in API group "apps" in the namespace "shop"\`: **ai** (\`User "dev"\`: có đúng người bạn nghĩ không?), **verb** (\`patch\`), **resource** (\`deployments/scale\`: subresource, cần rule riêng), **API group** (\`apps\`; \`""\` là group lõi), **phạm vi** (\`in the namespace "shop"\` hay \`at the cluster scope\`: cần Role hay ClusterRole). Đủ năm thứ đó để viết đúng một rule, không hơn.

**Tên trong kubeconfig là nhãn, danh tính là cert.** Một kubeconfig tên \`dev.kubeconfig\`, user tên \`dev\`, mà cert nhúng là của ops thì mọi request là của ops. \`k auth whoami\` hỏi chính apiserver (đo: \`Username ops\`, \`Groups [shop-ops system:authenticated]\`); đọc cert nhúng bằng \`k config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject\`. Lỗi Forbidden có \`User "ops"\` khi bạn đang dùng tệp của dev là dấu hiệu rõ nhất.

**Binding sai chủ thể trông như "thiếu quyền".** ops nhận \`Forbidden\` cho mọi thứ, nhưng ClusterRole \`shop-ops-view\` vẫn đủ rule: lỗi nằm ở binding. Thứ tự đọc: \`k auth can-i --list\` bằng tệp của ops (chỉ còn bốn dòng \`self…reviews\`: không binding nào áp vào ops) → \`k get clusterrolebinding -o wide | grep shop-ops\` (\`shop-ops\` nằm ở cột USERS, không phải GROUPS) → \`k describe clusterrolebinding shop-ops\` (\`Kind User\`). Sửa \`subjects\` trong tệp rồi apply (\`subjects\` sửa được; \`roleRef\` thì không).

**API group khi viết Role.** \`k api-resources\` có cột APIVERSION: group là phần trước \`/\`, \`v1\` là \`""\`. Cùng một tên resource có thể nằm ở hai group: trên lab \`networkpolicies\` có cả \`networking.k8s.io/v1\` (của Kubernetes, s31 dùng) và \`crd.projectcalico.org/v1\` (CRD của Calico, đo). Role với \`apiGroups: [""]\` cho \`networkpolicies\` không cho gì cả. \`k api-resources --api-group=apps\`, \`k explain <resource>\` (dòng GROUP) xác nhận nhanh.

**Sửa ở tệp, không chỉ ở cluster.** Sự cố sửa cả \`~/shop/rbac.yaml\` (PyYAML, comment mất) rồi apply. \`kubectl patch\` lên cluster làm ops chạy lại, nhưng lần \`k apply -f ~/shop/\` tiếp theo đưa lỗi trở lại: verify chấm cả tệp lẫn cluster.`,
    refs: [
      { label: "Bài lộ trình CKA: kubectl auth can-i mọi biến thể", href: "#/roadmap/cka/cka-w7-4" },
      { label: "Bài lộ trình CKA: RBAC chuyên sâu — Role/ClusterRole", href: "#/roadmap/cka/cka-w7-1" },
      { label: "CKA Study Guide, chương 6 — xác thực, uỷ quyền và kiểm soát tiếp nhận", href: "#/docs/ckabook-06" },
      { label: "kubernetes.io: Using RBAC Authorization — Referring to resources, subjects", href: "https://kubernetes.io/docs/reference/access-authn-authz/rbac/#referring-to-resources" },
      { label: "kubernetes.io: Authenticating — anonymous, 401 và danh tính", href: "https://kubernetes.io/docs/reference/access-authn-authz/authentication/" },
      { label: "kubernetes.io: kubectl auth whoami", href: "https://kubernetes.io/docs/reference/kubectl/generated/kubectl_auth/kubectl_auth_whoami/" },
      { label: "Bài thực hành s35 — RBAC và ServiceAccount", href: "#/practice/cka/s35" },
    ],
    stateIn: "Đầu ra s35. Trên Mac chạy `./labs/lab begin cka s36`: lệnh kiểm đầu vào bằng check.sh riêng (phần s35 sự cố không phá: SA order, ops.kubeconfig, RBAC của dev trong cluster), đặt ~/drills/s36/forbidden.txt rồi **gây sự cố**: \"một đồng nghiệp sửa lại quyền truy cập\". dev và ops đều không làm được việc của mình. Bấm giờ 20 phút.",
    stateOut: "Mọi dòng verify của s35 xanh lại: ~/dev.kubeconfig trỏ apiserver (server như admin.conf) với cert/key của dev, ClusterRoleBinding shop-ops gắn Group shop-ops trong cluster và trong ~/shop/rbac.yaml; ~/drills/s36/answers.env (FORBIDDEN_MISSING).",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s36`, bấm giờ 20 phút. Trên cka-cp, chưa sửa gì: `k --kubeconfig ~/dev.kubeconfig get pods`, `k --kubeconfig ~/ops.kubeconfig get nodes`. Mỗi lỗi dừng ở cửa nào (kết nối, TLS, xác thực, uỷ quyền)? Ghi ra trước khi đọc tiếp.",
      },
      {
        id: "t2",
        text: "dev, cửa thứ nhất: `k config view --minify --kubeconfig ~/dev.kubeconfig | grep server`, so với `sudo grep server /etc/kubernetes/admin.conf`. Ai đang nghe cổng đó: `curl -sk https://192.168.252.35:<cổng>/healthz`, `openssl s_client -connect 192.168.252.35:<cổng> </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName`. Sửa server bằng `k config set-cluster kubernetes --server=… --kubeconfig ~/dev.kubeconfig`.",
      },
      {
        id: "t3",
        text: "dev, cửa thứ hai: `k --kubeconfig ~/dev.kubeconfig get pods` lần nữa. Thông báo nói `User` nào? `k --kubeconfig ~/dev.kubeconfig auth whoami`; đọc cert nhúng: `k config view --raw --kubeconfig ~/dev.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject`. Nhúng lại cert và key của dev (s34: `set-credentials … --embed-certs`). `auth whoami` phải ra `dev`, `[shop-dev system:authenticated]`.",
      },
      {
        id: "t4",
        text: "ops: `k --kubeconfig ~/ops.kubeconfig auth whoami` (danh tính đúng chưa?), `k --kubeconfig ~/ops.kubeconfig auth can-i --list`. Rồi bằng admin: `k get clusterrolebinding -o wide | grep -E 'NAME|shop-ops'`, `k describe clusterrolebinding shop-ops`, `k describe clusterrole shop-ops-view | head`. Lỗi ở Role hay ở binding? Sửa trong `~/shop/rbac.yaml`, `k apply -f ~/shop/rbac.yaml`, `k --kubeconfig ~/ops.kubeconfig get nodes`.",
      },
      {
        id: "t5",
        text: "Đọc Forbidden cho sẵn: `cat ~/drills/s36/forbidden.txt`. Ghi `FORBIDDEN_MISSING=<verb>,<resource>,<API group>` (ba phần cách nhau bằng dấu phẩy, đúng như trong thông báo) vào `~/drills/s36/answers.env`. Rule nào sẽ cho dev làm việc đó? (Viết ra, **đừng** thêm vào `shop-deployer`.)",
      },
      {
        id: "t6",
        text: "API group: `k api-resources | grep -E '^(NAME|deployments|networkpolicies|poddisruptionbudgets|cronjobs) '`. Vì sao `networkpolicies` có hai dòng, và Role cho NetworkPolicy của s31 phải ghi `apiGroups` nào? `k explain networkpolicy | head -3`. Trên Mac: `./labs/lab verify cka s36` phải đạt 6/6.",
      },
    ],
    hints: [
      "`x509: cannot validate certificate for 192.168.252.35 because it doesn't contain any IP SANs`: cert server không có IP trong SAN. apiserver có (s33); kubelet thì không. Lỗi TLS kiểu này gần như luôn là sai cổng hay sai máy, không phải CA hỏng.",
      "Đừng \"sửa\" lỗi TLS bằng `k config set-cluster kubernetes --insecure-skip-tls-verify=true`: lệnh đó **xoá** `certificate-authority-data` khỏi tệp (đo), đặt lại `false` không đưa CA về, và verify đỏ dòng kubeconfig. Nếu lỡ, `set-cluster … --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs`.",
      "`Forbidden … User \"ops\"` khi bạn đang dùng `~/dev.kubeconfig`: tệp mang cert của ops. Tên user trong kubeconfig không quyết định gì; cert quyết định.",
      "`k --kubeconfig ~/ops.kubeconfig auth can-i --list` chỉ còn bốn dòng `self…reviews`: không binding nào áp vào ops; đừng thêm rule vào ClusterRole, hãy đọc binding.",
      "Thêm một ClusterRoleBinding mới cho Group shop-ops thay vì sửa `shop-ops`: ops chạy lại, nhưng `shop-ops` vẫn gắn nhầm và `~/shop/rbac.yaml` vẫn sai; verify đỏ dòng tệp. Sửa đúng binding hỏng.",
      "`kubectl patch clusterrolebinding shop-ops …` mà không sửa `~/shop/rbac.yaml`: verify đỏ dòng \"rbac.yaml khớp cluster\" (đo).",
    ],
    solution: `Quy trình dưới đây là cách tìm ra lỗi, không chỉ lệnh sửa. Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6); fingerprint, tuổi object sẽ khác.

**1. Hai triệu chứng**

\`\`\`bash
k --kubeconfig ~/dev.kubeconfig get pods
# E1119 11:42:06.261366   37229 memcache.go:265] "Unhandled Error" err="couldn't get current server API group list: Get \\"https://192.168.252.35:10250/api?timeout=32s\\": tls: failed to verify certificate: x509: cannot validate certificate for 192.168.252.35 because it doesn't contain any IP SANs"
# … (lặp 5 lần)
# Unable to connect to the server: tls: failed to verify certificate: x509: cannot validate certificate for 192.168.252.35 because it doesn't contain any IP SANs
k --kubeconfig ~/ops.kubeconfig get nodes
# Error from server (Forbidden): nodes is forbidden: User "ops" cannot list resource "nodes" in API group "" at the cluster scope
\`\`\`

dev dừng ở TLS (chưa tới apiserver); ops tới được, được nhận ra là \`ops\`, bị RBAC chặn.

**2. dev: server**

\`\`\`bash
k config view --minify --kubeconfig ~/dev.kubeconfig | grep server
#     server: https://192.168.252.35:10250
sudo grep server /etc/kubernetes/admin.conf
#     server: https://192.168.252.35:6443
curl -sk https://192.168.252.35:10250/healthz; echo
# Unauthorized
openssl s_client -connect 192.168.252.35:10250 </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -ext subjectAltName
# subject=CN = cka-cp@1794591561
# issuer=CN = cka-cp-ca@1794591561
# X509v3 Subject Alternative Name:
#     DNS:cka-cp
k config set-cluster kubernetes --server=https://192.168.252.35:6443 --kubeconfig ~/dev.kubeconfig
\`\`\`

10250 là kubelet (cert tự ký, CA \`cka-cp-ca@…\` riêng của kubelet); apiserver nghe 6443.

**3. dev: cert của ai**

\`\`\`bash
k --kubeconfig ~/dev.kubeconfig get pods
# Error from server (Forbidden): pods is forbidden: User "ops" cannot list resource "pods" in API group "" in the namespace "shop"
k --kubeconfig ~/dev.kubeconfig auth whoami
# ATTRIBUTE                                           VALUE
# Username                                            ops
# Groups                                              [shop-ops system:authenticated]
k config view --raw --kubeconfig ~/dev.kubeconfig -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -subject
# subject=O = shop-ops, CN = ops
k config set-credentials dev --client-certificate=$HOME/users/dev.crt --client-key=$HOME/users/dev.key --embed-certs --kubeconfig ~/dev.kubeconfig
k --kubeconfig ~/dev.kubeconfig auth whoami | sed -n 2,3p
# Username                                            dev
# Groups                                              [shop-dev system:authenticated]
\`\`\`

\`set-credentials\` với cả \`--client-certificate\` và \`--client-key\` ghi đè cả hai: nhúng lại đủ cặp của dev, đừng chỉ thay cert.

**4. ops: binding**

\`\`\`bash
k --kubeconfig ~/ops.kubeconfig auth can-i --list | grep -v '\\[/'
# Resources                                       Non-Resource URLs   Resource Names   Verbs
# selfsubjectreviews.authentication.k8s.io        []                  []               [create]
# selfsubjectaccessreviews.authorization.k8s.io   []                  []               [create]
# selfsubjectrulesreviews.authorization.k8s.io    []                  []               [create]
k get clusterrolebinding -o wide | grep -E 'NAME|shop-ops'
# NAME       ROLE                        AGE   USERS      GROUPS   SERVICEACCOUNTS
# shop-ops   ClusterRole/shop-ops-view   17m   shop-ops
k describe clusterrolebinding shop-ops | sed -n '/^Subjects/,$p'
# Subjects:
#   Kind  Name      Namespace
#   ----  ----      ---------
#   User  shop-ops
\`\`\`

Trong \`~/shop/rbac.yaml\`, object \`ClusterRoleBinding shop-ops\`, \`subjects\` trở lại:

\`\`\`yaml
subjects:
- apiGroup: rbac.authorization.k8s.io
  kind: Group
  name: shop-ops
\`\`\`

\`\`\`bash
k apply -f ~/shop/rbac.yaml
# clusterrolebinding.rbac.authorization.k8s.io/shop-ops configured   (các dòng khác: unchanged)
k --kubeconfig ~/ops.kubeconfig get nodes
# NAME     STATUS   ROLES           AGE     VERSION
# cka-cp   Ready    control-plane   5d10h   v1.36.6
# …
\`\`\`

**5–6. Đọc Forbidden, API group**

\`\`\`bash
cat ~/drills/s36/forbidden.txt
# $ kubectl --kubeconfig ~/dev.kubeconfig -n shop scale deploy order --replicas=2
# Error from server (Forbidden): deployments.apps "order" is forbidden: User "dev" cannot patch resource "deployments/scale" in API group "apps" in the namespace "shop"
echo 'FORBIDDEN_MISSING=patch,deployments/scale,apps' >> ~/drills/s36/answers.env
k api-resources | awk 'NR==1 || $1 ~ /^(deployments|networkpolicies)$/'
# NAME              SHORTNAMES   APIVERSION                 NAMESPACED   KIND
# deployments       deploy       apps/v1                    true         Deployment
# networkpolicies                crd.projectcalico.org/v1   true         NetworkPolicy
# networkpolicies   netpol       networking.k8s.io/v1       true         NetworkPolicy
\`\`\`

Rule cho \`k scale\`: \`{apiGroups: [apps], resources: [deployments/scale], verbs: [patch]}\` (thêm \`get\` nếu muốn \`k get --subresource=scale\`). Không thêm vào \`shop-deployer\`: catalog do HPA co giãn (s35). \`networkpolicies\` thứ hai là CRD của Calico (\`crd.projectcalico.org\`); NetworkPolicy của s31 ở \`networking.k8s.io\`.

Lời giải tự động: \`labs/cka/sessions/s36/apply.sh\` (gây sự cố như \`begin\`, rồi \`files/solve.sh\`; chạy lại được).`,
    exam: {
      patterns: [
        "\"User X báo lỗi khi làm Y, sửa để X làm được Y (và chỉ Y)\" — đọc Forbidden (verb, resource, group, phạm vi), `k auth can-i … --as X`, tìm binding bằng `-o wide`, sửa rule hay binding nhỏ nhất.",
        "\"Kubeconfig ở /opt/… không dùng được, sửa nó\" — `k config view --minify --kubeconfig …` (server, cert), `auth whoami`, `set-cluster`/`set-credentials --embed-certs`.",
        "\"Resource X thuộc API group nào / có namespaced không\" — `k api-resources | grep X`, `k explain X`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 1 phút, chỉ đọc: `Error from server (Forbidden): cronjobs.batch is forbidden: User \"system:serviceaccount:shop:order\" cannot list resource \"cronjobs\" in API group \"batch\" in the namespace \"shop\"`. Ai, verb, resource, group, Role hay ClusterRole, và lệnh `create role` vừa đủ?",
          timeLimitMin: 1,
          solution: "SA `order` ở shop; `list`; `cronjobs`; `batch`; trong namespace shop nên Role là đủ.\n```bash\nk -n shop create role cronjob-lister --verb=list --resource=cronjobs.batch\nk -n shop create rolebinding order-cronjobs --role=cronjob-lister --serviceaccount=shop:order\n```",
        },
        {
          text: "Trong 2 phút: ai đang được gắn ClusterRole `cluster-admin`? In mọi binding và chủ thể của chúng, chỉ bằng kubectl.",
          timeLimitMin: 2,
          solution: "```bash\nk get clusterrolebinding -o wide | awk 'NR==1 || $2==\"ClusterRole/cluster-admin\"'\n```\nTrên lab: `cluster-admin` (group `system:masters`) và `kubeadm:cluster-admins` (group cùng tên, của `admin.conf`). Thêm `k get rolebinding -A -o wide | grep cluster-admin` cho binding trong namespace.",
        },
      ],
    },
    tips: [
      "Ba lệnh đầu tiên cho mọi lỗi truy cập: `k config view --minify` (đang gọi đâu, bằng gì), `k auth whoami` (apiserver thấy bạn là ai), `k auth can-i --list` (bạn được gì).",
      "\"at the cluster scope\" trong Forbidden: cần ClusterRole + ClusterRoleBinding; \"in the namespace\": Role + RoleBinding là đủ.",
      "Lỗi TLS: đọc SAN và issuer của cert server (`openssl s_client … | openssl x509 -noout -subject -issuer -ext subjectAltName`) trước khi nghi CA của kubeconfig.",
    ],
    outcome: {
      md: `dev và ops làm lại được việc của mình với đúng danh tính và đúng quyền. Trên Mac:

\`\`\`bash
./labs/lab verify cka s36
\`\`\`

Verify chạy lại bốn dòng của s35 (quyền của dev và ops hỏi bằng chính hai kubeconfig, SA order, \`~/shop/rbac.yaml\` khớp cluster với binding gắn đúng **Group**), cộng dòng kubeconfig của dev như cuối s34 (server như \`admin.conf\`, CA cluster, cert + key nhúng đúng \`CN=dev, O=shop-dev\`, không \`insecure-skip-tls-verify\`, namespace shop, quyền 600) và đáp án \`FORBIDDEN_MISSING\` (so khoan dung hoa thường, dấu cách). Thêm ClusterRoleBinding mới thay vì sửa \`shop-ops\`, hay sửa cluster mà không sửa tệp, đều đỏ dòng \`rbac.yaml\`.`,
      verifyOutput: "lab: kiểm s36\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~10 phút)\n  ✓ dev (dev.kubeconfig): create/patch deploy, get pods ở shop được; get nodes, kube-system, create clusterrole không\n  ✓ ops (ops.kubeconfig): get nodes, list pods -A được; create/patch/delete ở mọi nơi và đọc Secret không\n  ✓ Pod order chạy bằng SA order, Available; token SA order đọc được ConfigMap của order, không ConfigMap khác, không Secret db-cred\n  ✓ ~/shop/rbac.yaml có đủ 7 object RBAC/SA và khớp cluster; ~/shop/ giữ serviceAccountName: order\n  ✓ ~/dev.kubeconfig như cuối s34: server như admin.conf, cert + key nhúng là của dev (CN=dev, O=shop-dev), namespace shop, quyền 600\n  ✓ answers.env: FORBIDDEN_MISSING (verb, resource, API group) của thông báo trong forbidden.txt\n  → 6/6 đạt",
      projectDelta: "Chặng 6 xong: shop có danh tính riêng cho dev, ops và order, quyền theo vai nằm trong ~/shop/rbac.yaml, và bạn đọc được mọi lỗi truy cập theo ba cửa kết nối/TLS, xác thực, uỷ quyền. Mốc snapshot st6-done.",
    },
    review: [
      { q: "`Unable to connect to the server: tls: failed to verify certificate: x509: … doesn't contain any IP SANs` với kubeconfig vừa chạy hôm qua. Bạn kiểm gì đầu tiên?", a: "`server` trong kubeconfig (`k config view --minify`): request chưa tới apiserver, client không tin cert của bên kia. So IP/cổng với `admin.conf`; `openssl s_client` xem cert của ai (ở đây kubelet cổng 10250, cert tự ký chỉ có `DNS:cka-cp`). Không dùng `--insecure-skip-tls-verify`." },
      { q: "401 và 403 khác nhau thế nào về chỗ cần sửa?", a: "401 `Unauthorized`: apiserver không xác thực được (cert không do CA cluster ký, hết hạn, token sai): sửa credential trong kubeconfig. 403 `Forbidden`: đã biết bạn là ai (tên có trong thông báo), RBAC không cho: sửa binding hay rule, hoặc bạn đang dùng nhầm danh tính." },
      { q: "`Forbidden … User \"ops\"` khi bạn chạy với `~/dev.kubeconfig`. Giải thích và cách xác nhận.", a: "Cert nhúng trong tệp là của ops; tên user trong kubeconfig chỉ là nhãn. Xác nhận bằng `k --kubeconfig ~/dev.kubeconfig auth whoami` và `openssl x509 -noout -subject` trên `client-certificate-data`. Sửa bằng `set-credentials dev --client-certificate … --client-key … --embed-certs`." },
      { q: "ops bị Forbidden mọi thứ, ClusterRole `shop-ops-view` vẫn đủ rule. Ba lệnh nào chỉ ra lỗi ở binding?", a: "`k --kubeconfig ~/ops.kubeconfig auth can-i --list` (không còn rule nào ngoài self…reviews), `k get clusterrolebinding -o wide | grep shop-ops` (tên ở cột USERS chứ không phải GROUPS), `k describe clusterrolebinding shop-ops` (`Kind User`). Sửa `subjects` trong tệp rồi apply." },
      { q: "Đọc `User \"dev\" cannot patch resource \"deployments/scale\" in API group \"apps\" in the namespace \"shop\"` thành một rule.", a: "Role ở shop: `apiGroups: [apps]`, `resources: [deployments/scale]`, `verbs: [patch]`, gắn cho group shop-dev bằng RoleBinding. Subresource là resource riêng: quyền `patch deployments` không bao gồm `deployments/scale`." },
    ],
  },
];
