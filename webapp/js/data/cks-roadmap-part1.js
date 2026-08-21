// CKS Roadmap Part 1 — Tuần 1–4: Cluster Setup, Cluster Hardening, System Hardening, Pod Security & Secrets
// Dữ liệu lộ trình CKS (tiếng Việt). KHÔNG đổi id/text — progress của người dùng lưu theo id.

export const cksWeeksPart1 = [
  {
    id: "cks-w1",
    week: "Tuần 1",
    title: "Cluster Setup — CIS Benchmark & nền tảng",
    goal: "Điểm khởi đầu: audit cluster theo chuẩn CIS và vá các cấu hình mặc định nguy hiểm.",
    practice:
      "Chạy kube-bench trên lab, chọn 5 finding FAIL và fix từng cái, chạy lại xác nhận PASS.",
    resources: [
      { label: "CKS Study Guide — lộ trình đầy đủ", href: "#/docs/cks-study-guide" },
      { label: "CKS Cheat Sheet — kube-bench & API Server", href: "#/docs/cks-cheat-sheet" },
      { label: "Lab 21 — NetworkPolicy", href: "#/labs/lab21" },
      { label: "CKA Cheat Sheet — nền tảng dùng chung", href: "#/docs/cka-cheat-sheet" },
      { label: "Killercoda — Killer Shell CKS", href: "https://killercoda.com/killer-shell-cks" },
    ],
    items: [
      {
        id: "cks-w1-1",
        text: "Mô hình 4C: Cloud → Cluster → Container → Code",
        lesson: `Hãy hình dung bảo mật Kubernetes như **các lớp vỏ hành tây**, hoặc một tòa nhà kho bạc: **Cloud** là khuôn viên và hàng rào bên ngoài, **Cluster** là tòa nhà với hệ thống cửa và lễ tân, **Container** là từng căn phòng có khóa riêng, còn **Code** là chiếc két sắt đặt trong phòng. Nguyên tắc cốt lõi: **lớp ngoài thủng thì lớp trong khó tự cứu** — code an toàn đến mấy cũng vô nghĩa nếu attacker chiếm được node.

Mỗi lớp có mối lo và công cụ riêng, và toàn bộ CKS thực chất là đi lần lượt qua 4 lớp này:

- **Cloud**: hạ tầng, network, metadata endpoint \`169.254.169.254\`, firewall, quyền IAM.
- **Cluster**: cấu hình apiserver/kubelet theo **CIS Benchmark** (kube-bench), RBAC, NetworkPolicy, encryption at rest, audit logging.
- **Container**: image sạch (Trivy), SecurityContext, seccomp/AppArmor, sandbox runtime.
- **Code**: không hardcode secret, dependency không lỗ hổng, mTLS giữa services.

Đây là **defense in depth**: mỗi lớp đều có thể thất thủ, nên phải bố trí phòng thủ chồng lên nhau — attacker vượt qua một lớp vẫn vấp lớp kế tiếp.

\`\`\`bash
# Một câu hỏi kiểm tra nhanh cho mỗi lớp:

# Cloud — pod có gọi được metadata endpoint không? (phải CHẶN)
curl -s --max-time 2 http://169.254.169.254/ && echo "metadata dang MO!"

# Cluster — control plane lệch chuẩn CIS bao nhiêu finding?
kube-bench run --targets master | grep -c "\\[FAIL\\]"

# Container — image có CVE nghiêm trọng không?
trivy image --severity HIGH,CRITICAL nginx:1.25

# Code — secret có bị hardcode trong source không?
grep -rniE "password|api_key|secret" ./src | head
\`\`\`

Khi học từng tool trong các tuần sau, hãy luôn tự hỏi: *tool này bảo vệ lớp nào?* — cách gắn kiến thức này giúp bạn không bị "ngợp tool" khi ôn thi.

⚠️ **Lỗi thường gặp:** (1) Nghĩ rằng một biện pháp là đủ — ví dụ đã có NetworkPolicy thì bỏ qua SecurityContext; đề CKS thường yêu cầu **kết hợp nhiều lớp** cho cùng một pod. (2) Học tool rời rạc không gắn vào lớp nào → vào bài dài nhiều bước sẽ không biết bắt đầu từ đâu.`,
      },
      {
        id: "cks-w1-2",
        text: "kube-bench: chạy trên control plane & worker, đọc FAIL/WARN, fix theo remediation",
        lesson: `**kube-bench** giống một **đoàn thanh tra PCCC** đến kiểm tra tòa nhà với checklist in sẵn — chính là **CIS Kubernetes Benchmark**. Đoàn đi từng mục: bình chữa cháy đủ chưa (PASS), cửa thoát hiểm bị khóa (FAIL), đèn exit mờ (WARN) — và quan trọng nhất: **mỗi mục không đạt đều kèm hướng dẫn khắc phục** (phần *Remediation*).

Dạng bài thi phổ biến: *"chạy kube-bench, fix các finding sau"*. Quy trình chuẩn:

- Chạy đúng **target**: \`--targets master\` cho control plane (apiserver, etcd, scheduler...), \`--targets node\` cho worker (kubelet, proxy).
- Đọc finding **FAIL** kèm số hiệu check (vd \`1.2.20\`, \`4.2.1\`) và phần Remediation ngay bên dưới.
- Sửa **đúng theo Remediation** — thường là thêm/sửa flag trong static pod manifest hoặc \`/var/lib/kubelet/config.yaml\`.
- Chạy lại **đúng check đó** để xác nhận PASS — đừng chạy cả bộ cho mất thời gian.

\`\`\`bash
kube-bench run --targets master        # audit control plane
kube-bench run --targets node          # audit worker (kubelet, kube-proxy)
kube-bench | grep -B1 -A5 FAIL         # lọc finding FAIL kèm Remediation

# Ví dụ fix một finding phía kubelet rồi verify lại đúng check đó:
vim /var/lib/kubelet/config.yaml       # sửa theo hướng dẫn Remediation
systemctl restart kubelet              # kubelet là service — phải restart
kube-bench run --targets node --check 4.2.1   # chạy lại 1 check → PASS?
\`\`\`

Remediation phía control plane thường yêu cầu sửa \`/etc/kubernetes/manifests/kube-apiserver.yaml\` — static pod sẽ tự khởi động lại khi file thay đổi.

⚠️ **Lỗi thường gặp:** (1) Sửa sai flag apiserver là **apiserver chết** và \`kubectl\` tê liệt — LUÔN \`cp\` manifest ra ngoài thư mục manifests trước khi sửa, theo dõi bằng \`watch crictl ps\`, hỏng thì chép backup đè lại. (2) Sửa kubelet config nhưng **quên \`systemctl restart kubelet\`** → chạy lại kube-bench vẫn FAIL, ngồi hoang mang dù đã sửa đúng.`,
      },
      {
        id: "cks-w1-3",
        text: "Các fix CIS kinh điển: anonymous-auth, profiling, quyền file manifest, authorization-mode",
        lesson: `Cluster kubeadm mặc định giống một tòa nhà mới bàn giao: chắc chắn, nhưng **vài cánh cửa vẫn quen tay để ngỏ**. Bộ fix CIS "kinh điển" dưới đây xuất hiện đi xuất hiện lại trong đề thi — thuộc lòng chúng là cầm chắc điểm:

- **Tắt anonymous trên kubelet**: \`authentication.anonymous.enabled: false\` trong \`/var/lib/kubelet/config.yaml\` — kubelet có API riêng trên port 10250, để ẩn danh là attacker có thể dò thông tin, thậm chí exec vào container.
- **Authorization của kubelet**: \`authorization.mode: Webhook\` — tuyệt đối không \`AlwaysAllow\` (ai hỏi gì cũng gật).
- **API server**: \`--profiling=false\` (endpoint debug không cần thiết), \`--authorization-mode=Node,RBAC\` (không chứa AlwaysAllow).
- **Quyền file**: manifest control plane \`644\` và \`root:root\`; \`/var/lib/kubelet/config.yaml\` chặt hơn — \`600\`. File cấu hình lỏng quyền giống hồ sơ vận hành tòa nhà vứt ở sảnh cho ai cũng đọc-sửa được.

\`\`\`bash
# 1) Kubelet — sửa /var/lib/kubelet/config.yaml:
#      authentication.anonymous.enabled: false
#      authorization.mode: Webhook        # KHÔNG AlwaysAllow
systemctl restart kubelet

# 2) API server — backup trước, rồi sửa manifest:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml
#      - --profiling=false
#      - --authorization-mode=Node,RBAC
watch crictl ps                            # chờ container apiserver lên lại

# 3) Quyền file:
chmod 644 /etc/kubernetes/manifests/*.yaml
chown root:root /etc/kubernetes/manifests/*.yaml
chmod 600 /var/lib/kubelet/config.yaml
\`\`\`

Sau mỗi fix, chạy lại đúng check kube-bench tương ứng để xác nhận PASS.

⚠️ **Lỗi thường gặp:** (1) Sửa nhiều flag apiserver **cùng lúc** — khi apiserver không lên nổi bạn không biết flag nào gây lỗi; sửa **từng flag, verify từng bước**, đọc \`crictl logs\` hoặc \`/var/log/pods/\` khi hỏng. (2) Nhầm chỗ: \`anonymous-auth\` của **kubelet** nằm trong config.yaml + restart kubelet, không phải flag apiserver — hai thứ khác nhau dù tên giống nhau.`,
      },
      {
        id: "cks-w1-4",
        text: "Verify platform binaries bằng `sha512sum`",
        lesson: `Trước khi lắp một khóa cửa mua ngoài chợ, thợ khóa cẩn thận sẽ **soi tem niêm phong chống giả** — vì một chiếc khóa bị tráo ruột nhìn ngoài y hệt hàng thật. Binary của Kubernetes cũng vậy: \`kubelet\`, \`kubectl\`, \`kubeadm\` tải về hoặc đang nằm trên node có thể **đã bị thay thế** bởi bản cài backdoor. Cách kiểm tra: so **vân tay số** (hash SHA-512) của file với hash chính thức mà dự án Kubernetes công bố trên \`dl.k8s.io\` — chỉ cần file khác **một byte**, hash sẽ khác hoàn toàn.

Dạng bài thi: cho sẵn một binary (hoặc vài binary) và file hash chính thức, hỏi binary nào đã bị sửa đổi. Kỹ thuật quan trọng nhất: **so bằng \`diff\`, không so bằng mắt** — hash SHA-512 dài 128 ký tự hex, mắt người dò từng ký tự vừa chậm vừa dễ sót đúng chỗ khác biệt.

\`\`\`bash
# 1) Tính hash binary đang nghi ngờ, chỉ giữ cột hash:
sha512sum /usr/bin/kubelet | cut -d' ' -f1 > got.txt

# 2) Hash chính thức (đề cho sẵn file, hoặc tải đúng VERSION từ dl.k8s.io):
cut -d' ' -f1 kubelet.sha512 > want.txt

# 3) So bằng diff — không output nghĩa là KHỚP:
diff got.txt want.txt && echo "KHOP - binary sach" || echo "KHAC - da bi thay doi!"
\`\`\`

Lưu ý hash gắn với **từng phiên bản**: hash chính thức của v1.30.2 chỉ so được với binary v1.30.2 — kiểm tra version bằng \`kubelet --version\` trước khi tải file checksum.

⚠️ **Lỗi thường gặp:** (1) So hash bằng mắt và kết luận "giống nhau" — đề thi cố tình làm hash chỉ khác vài ký tự ở giữa; luôn đưa cả hai vào file rồi \`diff\`. (2) File checksum tải về chứa cả **tên file** phía sau hash (\`abc123...  kubelet\`) — diff trực tiếp sẽ luôn báo khác; phải \`cut\` lấy riêng cột hash trước khi so.`,
      },
      {
        id: "cks-w1-5",
        text: "Ingress + TLS: secret tls, cấu hình HTTPS",
        lesson: `Gửi dữ liệu qua HTTP giống **gửi bưu thiếp** — ai cầm qua tay cũng đọc được nội dung. HTTPS/TLS biến nó thành **phong bì niêm phong kèm con dấu xác thực**: nội dung được mã hóa và người nhận chứng minh được mình đúng là người nhận. Trong Kubernetes, **Ingress** là bưu điện trung tâm nhận mọi thư từ bên ngoài — và đó chính là nơi gắn TLS (TLS termination): traffic được giải mã tại Ingress controller rồi chuyển tiếp tới Service phía sau.

Quy trình 3 bước rất hay ra thi:

- **Tạo cert + key** (thi thường cho sẵn, hoặc tự ký bằng \`openssl\`).
- **Tạo Secret type \`tls\`** — bắt buộc đúng type này, chứa cặp \`tls.crt\` + \`tls.key\`.
- **Khai báo trong Ingress**: block \`spec.tls\` với \`hosts\` và \`secretName\`; host trong \`tls\` phải **trùng** với host trong \`rules\` và trùng CN/SAN của cert.

\`\`\`bash
# 1) Cert tự ký + Secret type tls:
openssl req -x509 -newkey rsa:2048 -nodes -days 365 \\
  -keyout tls.key -out tls.crt -subj "/CN=app.example.com"
kubectl create secret tls app-tls --cert=tls.crt --key=tls.key

# 2) Ingress HTTPS (imperative — nhanh trong phòng thi):
kubectl create ingress web --class=nginx \\
  --rule="app.example.com/*=web-svc:80,tls=app-tls"

# 3) Verify TLS handshake (-k vì cert tự ký, -v xem chi tiết cert):
curl -kv https://app.example.com
\`\`\`

Trong output \`curl -v\`, kiểm tra dòng \`subject: CN=app.example.com\` — thấy cert "Kubernetes Ingress Controller Fake Certificate" nghĩa là Ingress **chưa nhận** secret của bạn.

⚠️ **Lỗi thường gặp:** (1) Secret nằm **khác namespace** với Ingress — Ingress chỉ đọc secret cùng namespace, sai chỗ là controller âm thầm dùng cert fake mặc định. (2) Tạo secret \`generic\` thay vì \`tls\`, hoặc host trong \`spec.tls.hosts\` không khớp host trong \`rules\` — HTTPS vẫn chạy nhưng sai cert, rất khó phát hiện nếu không \`curl -v\`.`,
      },
      {
        id: "cks-w1-6",
        text: "Bảo vệ node metadata endpoint (169.254.169.254) bằng NetworkPolicy egress",
        lesson: `Trên mọi VM cloud (AWS/GCP/Azure) có một "quầy hồ sơ nội bộ" ở địa chỉ cố định \`169.254.169.254\` — **metadata endpoint** — nơi VM tự hỏi thông tin về chính nó: hostname, cấu hình, và nguy hiểm nhất là **credentials của cloud** (IAM token, service account key). Vấn đề: pod chạy trên node **mặc định cũng gọi được** quầy này. Một pod bị chiếm (qua lỗ hổng web app chẳng hạn) chỉ cần một lệnh \`curl\` là cầm được chìa khóa cloud của node — từ container escape thành **chiếm cả hạ tầng**. Đây là kịch bản tấn công thật (vụ Capital One 2019 nổi tiếng bắt đầu đúng như vậy).

Phòng thủ chuẩn CKS: **NetworkPolicy egress** cho phép pod ra ngoài bình thường nhưng **trừ đúng IP metadata**:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-metadata
  namespace: default
spec:
  podSelector: {}                # {} = áp cho MỌI pod trong namespace
  policyTypes: ["Egress"]
  egress:
  - to:
    - ipBlock:
        cidr: 0.0.0.0/0                    # vẫn cho ra mọi nơi khác
        except: ["169.254.169.254/32"]     # trừ đúng metadata IP
\`\`\`

Verify từ trong pod: \`kubectl exec <pod> -- curl -s --max-time 3 http://169.254.169.254/\` phải **timeout**, trong khi \`curl\` tới địa chỉ khác vẫn chạy. Nếu đề chỉ yêu cầu áp cho một nhóm pod, thay \`podSelector: {}\` bằng \`matchLabels\` tương ứng.

⚠️ **Lỗi thường gặp:** (1) Viết policy egress kiểu **default-deny rồi allow từng đích** nhưng quên DNS (port 53) — mọi pod đột nhiên không resolve được tên miền; mẫu \`cidr + except\` ở trên tránh được bẫy này vì chỉ chặn đúng một IP. (2) Quên rằng NetworkPolicy chỉ có tác dụng khi **CNI hỗ trợ** (Calico, Cilium...) — trên lab dùng CNI không hỗ trợ, policy được tạo thành công nhưng không chặn gì cả, verify bằng curl mới biết.`,
      },
    ],
  },
  {
    id: "cks-w2",
    week: "Tuần 2",
    title: "Cluster Hardening — RBAC & API Access",
    goal: "Thu hẹp mọi quyền về mức tối thiểu cần thiết.",
    practice:
      "Audit 1 namespace: liệt kê SA nào bind vào cluster-admin, thu hồi; tắt automount token cho pod không cần gọi API.",
    resources: [
      { label: "Lab 17 — SA + Role + RoleBinding + can-i", href: "#/labs/lab17" },
      { label: "CKS Cheat Sheet — RBAC & SA Hardening", href: "#/docs/cks-cheat-sheet" },
      { label: "CKA Cheat Sheet — kubeadm upgrade", href: "#/docs/cka-cheat-sheet" },
      { label: "Tra cứu lệnh nhanh", href: "#/commands" },
      { label: "Killercoda — Killer Shell CKS", href: "https://killercoda.com/killer-shell-cks" },
    ],
    items: [
      {
        id: "cks-w2-1",
        text: "RBAC least privilege: thu hẹp verbs/resources, tránh wildcard `*`",
        lesson: `Một công ty vận hành tử tế không phát **chìa khóa tổng** cho mọi nhân viên — ai làm việc gì được phát đúng chìa phòng đó. RBAC least privilege là nguyên tắc ấy áp cho Kubernetes: mỗi user/ServiceAccount chỉ được đúng **verbs** (get, list, create...) trên đúng **resources** (pods, secrets...) trong đúng **namespace** mà nó thật sự cần. Wildcard \`*\` trong Role chính là chìa khóa tổng: hôm nay tiện, ngày mai thành thảm họa khi SA đó bị chiếm.

Dạng bài CKS: *"SA X đang thừa quyền, thu hẹp về mức chỉ đọc pods"*. Quy trình audit — thu hẹp — verify:

- **Tìm binding nguy hiểm**: ai đang bind vào \`cluster-admin\`? SA nào có ClusterRoleBinding (quyền toàn cluster) trong khi chỉ cần Role trong 1 namespace?
- **Đo quyền hiện tại** bằng \`kubectl auth can-i --list --as=...\` — đây là "máy đo" quan trọng nhất của tuần này.
- **Thu hẹp**: sửa Role thay \`verbs: ["*"]\` và \`resources: ["*"]\` bằng danh sách cụ thể; xóa binding thừa.
- **Verify lại** bằng \`can-i\`: việc cần → yes, việc không cần → no.

\`\`\`bash
# Ai đang cầm "chìa khóa tổng"?
kubectl get clusterrolebindings -o wide | grep cluster-admin

# SA này hiện làm được những gì?
kubectl auth can-i --list --as=system:serviceaccount:dev:app-sa -n dev

# Thu hẹp Role — bỏ wildcard, liệt kê cụ thể:
kubectl edit role app-role -n dev
#   rules:
#   - apiGroups: [""]
#     resources: ["pods"]          # KHÔNG ["*"]
#     verbs: ["get", "list"]       # KHÔNG ["*"]

# Verify sau khi sửa:
kubectl auth can-i delete pods --as=system:serviceaccount:dev:app-sa -n dev   # mong đợi: no
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Nhớ nhầm cú pháp impersonate SA: phải đủ \`system:serviceaccount:<namespace>:<tên-sa>\` — thiếu namespace là \`can-i\` luôn trả lời no và bạn tưởng mình đã thu quyền xong. (2) Thu hẹp Role nhưng quên SA còn **binding khác** (đặc biệt ClusterRoleBinding) vẫn cấp quyền rộng — phải grep tên SA trên **cả** rolebindings lẫn clusterrolebindings ở mọi namespace.`,
      },
      {
        id: "cks-w2-2",
        text: "ServiceAccount hardening: `automountServiceAccountToken: false`, SA riêng thay vì default",
        lesson: `Mặc định, mỗi pod khi khởi động được Kubernetes **tự nhét vào túi một thẻ ra vào** — token của ServiceAccount — mount sẵn tại \`/var/run/secrets/kubernetes.io/serviceaccount/\`. Với đa số app (một web server chỉ phục vụ HTTP, không hề gọi Kubernetes API), tấm thẻ này **hoàn toàn thừa** — nhưng nếu container bị chiếm, attacker lục túi là có ngay thẻ để nói chuyện với API server. Nguyên tắc: **không cần thẻ thì đừng phát thẻ**.

Hai việc phải làm thành phản xạ:

- **Không dùng SA \`default\`**: SA default dùng chung cho mọi pod trong namespace — cấp quyền cho nó là cấp cho tất cả. Tạo **SA riêng** cho từng app rồi bind đúng quyền tối thiểu.
- **Tắt automount token**: field \`automountServiceAccountToken: false\` — đặt ở mức **ServiceAccount** (áp cho mọi pod dùng SA đó) hoặc mức **Pod** (\`spec\`, override cấu hình của SA).

\`\`\`yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: dev
automountServiceAccountToken: false   # NGANG CẤP metadata — SA không có spec!
---
apiVersion: v1
kind: Pod
metadata:
  name: web
  namespace: dev
spec:
  serviceAccountName: app-sa          # SA riêng, không dùng default
  automountServiceAccountToken: false # hoặc tắt ở mức pod (override SA)
  containers:
  - name: web
    image: nginx:1.25
\`\`\`

Verify: \`kubectl exec web -- ls /var/run/secrets/kubernetes.io/serviceaccount\` phải báo **No such file or directory**. Đây là một mắt xích trong chuỗi hardening pod chuẩn CKS: SA riêng + không token + RBAC tối thiểu.

⚠️ **Lỗi thường gặp:** (1) Đặt \`automountServiceAccountToken\` sai chỗ trong manifest SA — nó nằm **ngang cấp** với \`metadata\`, không phải trong spec; đặt sai là apply lỗi hoặc âm thầm vô tác dụng. (2) Sửa field trên pod **đang chạy** — pod spec bất biến, phải xóa tạo lại (hoặc rollout Deployment) thì token mới thật sự biến mất; sửa xong quên recreate là verify vẫn thấy token.`,
      },
      {
        id: "cks-w2-3",
        text: "Token SA: TokenRequest API, thời hạn token, tìm pod đang mount token",
        lesson: `Token ServiceAccount kiểu cũ giống **thẻ ra vào không có hạn sử dụng**: lưu vĩnh viễn trong Secret, rơi vào tay ai người đó dùng mãi mãi. Kubernetes hiện đại đã chuyển sang **TokenRequest API**: token được phát hành **có thời hạn** (bound token), gắn với đúng pod đang dùng nó, hết hạn tự vô hiệu — như vé sự kiện chỉ có giá trị trong ngày, mất vé cũng chỉ thiệt một buổi. Từ K8s 1.24, tạo SA **không còn tự sinh Secret token** nữa; token trong pod được mount qua **projected volume** và kubelet tự xoay vòng.

Kỹ năng cần luyện:

- **Phát token có thời hạn** bằng \`kubectl create token\` (gọi TokenRequest API) — dùng cho debug, CI, kiểm thử quyền.
- **Đọc thời hạn**: token là JWT — decode phần payload thấy \`exp\` (expiry) và \`aud\` (audience).
- **Tìm pod đang mount token** — bước đầu của mọi bài audit: pod nào không cần gọi API mà vẫn cầm token thì tắt automount (bài trước).

\`\`\`bash
# Token có thời hạn 10 phút qua TokenRequest API:
kubectl create token app-sa -n dev --duration=10m

# Pod có đang mount token không?
kubectl exec web -n dev -- cat /var/run/secrets/kubernetes.io/serviceaccount/token \\
  && echo "TOKEN DANG MOUNT" || echo "khong mount"

# Quét cả namespace: pod nào chưa tắt automount?
kubectl get pods -n dev \\
  -o custom-columns=NAME:.metadata.name,SA:.spec.serviceAccountName,AUTOMOUNT:.spec.automountServiceAccountToken
\`\`\`

Cột AUTOMOUNT trống (\`<none>\`) nghĩa là dùng mặc định — tức **có mount** nếu SA không tắt; chỉ \`false\` mới chắc chắn an toàn.

⚠️ **Lỗi thường gặp:** (1) Tưởng cột AUTOMOUNT \`<none>\` là "không mount" — thực tế ngược lại: không khai báo = kế thừa mặc định = mount; phải kiểm chứng bằng \`exec\` vào pod. (2) Vẫn tạo Secret token kiểu cũ (type \`kubernetes.io/service-account-token\`) cho tiện — token này **không hết hạn**, đi ngược toàn bộ mục đích hardening; khi thấy nó trong bài audit, hãy coi là finding cần xóa.`,
      },
      {
        id: "cks-w2-4",
        text: "Hạn chế truy cập API server: tắt anonymous auth, admission plugins",
        lesson: `API server là **cổng chính duy nhất** của tòa nhà Kubernetes — mọi lệnh \`kubectl\`, mọi kubelet, mọi controller đều đi qua đây. Hardening cổng chính gồm hai tầng: **ai được bước vào** (authentication) và **hồ sơ mang vào bị kiểm tra thế nào** (admission). Để cổng cho phép **khách ẩn danh** (\`--anonymous-auth=true\` là mặc định) nghĩa là người lạ không xưng tên vẫn đứng được trong sảnh — họ chưa chắc làm được gì (còn RBAC chặn), nhưng bề mặt tấn công đã mở.

Các điểm khóa quan trọng trên \`/etc/kubernetes/manifests/kube-apiserver.yaml\`:

- \`--anonymous-auth=false\` — từ chối request không xưng danh.
- \`--authorization-mode=Node,RBAC\` — tuyệt đối không \`AlwaysAllow\`.
- \`--enable-admission-plugins=NodeRestriction\` — bật "lễ tân kiểm tra hồ sơ" (bài sau nói kỹ về NodeRestriction).
- Không bao giờ dùng lại các cấu hình đã khai tử: insecure port, \`AlwaysAdmit\`.

\`\`\`bash
# Backup TRƯỚC khi đụng vào control plane:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml

# Sửa manifest — mỗi lần MỘT flag:
#   - --anonymous-auth=false
#   - --authorization-mode=Node,RBAC
#   - --enable-admission-plugins=NodeRestriction
watch crictl ps        # chờ apiserver lên lại rồi mới sửa flag tiếp theo

# Verify: ẩn danh còn làm được gì không?
kubectl auth can-i list pods --as=system:anonymous      # mong đợi: no
\`\`\`

Admission plugins là tuyến phòng thủ **sau** authentication + authorization: request hợp lệ về danh tính và quyền vẫn có thể bị admission **từ chối hoặc chỉnh sửa** trước khi ghi vào etcd — nền tảng cho Pod Security Admission, ImagePolicyWebhook, OPA/Kyverno ở các tuần sau.

⚠️ **Lỗi thường gặp:** (1) Tắt anonymous xong health check hạ tầng (probe gọi \`/healthz\` ẩn danh) bắt đầu fail — hiểu trade-off này và làm theo đúng yêu cầu đề, đừng tự ý "hardening thêm" ngoài đề bài. (2) Viết flag \`--enable-admission-plugins\` lần thứ hai thay vì **nối thêm vào flag đã có** — apiserver chỉ nhận một flag, danh sách plugin cũ bị đè mất; luôn grep manifest xem flag đã tồn tại chưa.`,
      },
      {
        id: "cks-w2-5",
        text: "NodeRestriction: giới hạn kubelet chỉ sửa được node/pod của chính nó",
        lesson: `Hãy tưởng tượng mỗi kubelet là một **nhân viên hành chính của một phòng ban**: anh ta cần quyền cập nhật hồ sơ **phòng mình** (status node, pod chạy trên node), nhưng nếu được sửa hồ sơ **mọi phòng**, một nhân viên bị mua chuộc có thể sửa cả hồ sơ phòng giám đốc. **NodeRestriction** — một admission plugin — chính là quy định "nhân viên chỉ được sửa hồ sơ phòng mình": kubelet xác thực bằng danh tính \`system:node:<tên-node>\` chỉ được sửa **Node object của chính nó** và **Pod đang chạy trên nó**.

Vì sao quan trọng: nếu một worker node bị chiếm, attacker cầm credential kubelet của node đó. Không có NodeRestriction, attacker có thể tự **gắn label** cho node khác hoặc chính node mình (vd \`node-role.kubernetes.io/control-plane\`) để lừa scheduler kéo các pod nhạy cảm về node đã chiếm — bàn đạp leo thang đặc quyền toàn cluster. NodeRestriction chặn kubelet sửa node khác và chặn cả việc tự gắn/sửa label có prefix bảo vệ \`node-restriction.kubernetes.io/\`.

Bật rất đơn giản — thêm vào manifest apiserver: \`--enable-admission-plugins=NodeRestriction\` (mặc định có sẵn trên kubeadm mới, nhưng đề thi hay bắt kiểm tra/bật lại).

\`\`\`bash
# Thử "đóng vai" kubelet của node01 — chạy TRÊN node01:
export KUBECONFIG=/etc/kubernetes/kubelet.conf

kubectl label node node01 env=test          # node CỦA MÌNH → OK
kubectl label node controlplane hacked=yes  # node KHÁC → Forbidden ✓
kubectl label node node01 \\
  node-restriction.kubernetes.io/zone=x     # prefix bảo vệ → Forbidden ✓

# Xong nhớ trả lại KUBECONFIG admin:
unset KUBECONFIG
\`\`\`

Cả ba kết quả trên đúng như vậy nghĩa là plugin đang hoạt động.

⚠️ **Lỗi thường gặp:** (1) Thêm flag admission plugins **lần thứ hai** vào manifest thay vì nối \`,NodeRestriction\` vào flag sẵn có — danh sách cũ bị đè, apiserver có thể mất plugin khác đang cần. (2) Test xong quên \`unset KUBECONFIG\` — mọi lệnh kubectl sau đó chạy với quyền kubelet và fail khó hiểu (Forbidden hàng loạt), mất thời gian quý trong phòng thi.`,
      },
      {
        id: "cks-w2-6",
        text: "Upgrade cluster kịp thời (ôn kubeadm upgrade từ CKA)",
        lesson: `Chạy Kubernetes phiên bản cũ giống **ở trong căn nhà mà sơ đồ những cánh cửa hỏng khóa đã bị công bố công khai**: mỗi CVE được vá trong bản mới là một chỉ dẫn tấn công miễn phí cho kẻ nhắm vào bản cũ. Vì thế "upgrade kịp thời" nằm hẳn trong domain Cluster Hardening của CKS — cộng đồng chỉ hỗ trợ security patch cho **3 minor version gần nhất**, tụt lại phía sau là tự chạy ngoài vùng phủ sóng vá lỗi.

Quy trình kubeadm upgrade (ôn từ CKA — CKS coi là kỹ năng đương nhiên):

- **Control plane trước, worker sau**; mỗi lần chỉ nhảy **một minor version** (1.29 → 1.30, không nhảy cóc lên 1.31).
- Trình tự mỗi node: nâng \`kubeadm\` → \`kubeadm upgrade apply\` (control plane) hoặc \`kubeadm upgrade node\` (worker) → **drain** node → nâng \`kubelet\` + \`kubectl\` → restart kubelet → **uncordon**.
- Version skew: kubelet được phép **cũ hơn** apiserver tối đa 3 minor, nhưng không bao giờ **mới hơn**.

\`\`\`bash
# Trên control plane:
apt update && apt install -y kubeadm=1.30.2-1.1   # nâng kubeadm đúng version đích
kubeadm upgrade plan                              # xem đường upgrade khả dụng
kubeadm upgrade apply v1.30.2

# Với từng node (kể cả control plane) — drain trước khi nâng kubelet:
kubectl drain node01 --ignore-daemonsets --delete-emptydir-data
apt install -y kubelet=1.30.2-1.1 kubectl=1.30.2-1.1
systemctl daemon-reload && systemctl restart kubelet
kubectl uncordon node01

kubectl get nodes    # VERSION phải hiện v1.30.2
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Quên **drain** trước khi nâng kubelet — workload bị gián đoạn đột ngột thay vì được di tản êm; và quên **uncordon** sau đó — node kẹt \`SchedulingDisabled\`, đề chấm điểm trạng thái node là mất điểm. (2) \`apt upgrade\` không ghim version kéo kubelet lên bản **mới hơn apiserver** → vi phạm version skew, node báo lỗi; luôn cài đúng version cụ thể (và dùng \`apt-mark hold\` giữ chân các gói k8s ngày thường).`,
      },
    ],
  },
  {
    id: "cks-w3",
    week: "Tuần 3",
    title: "System Hardening — AppArmor, seccomp, Host",
    goal: "Khóa chặt container ở tầng syscall và Mandatory Access Control.",
    practice:
      "Viết seccomp profile chặn `mkdir`, gắn vào pod, xác nhận bị chặn. Load AppArmor profile deny-write và gắn vào container nginx.",
    resources: [
      { label: "CKS Cheat Sheet — AppArmor & seccomp", href: "#/docs/cks-cheat-sheet" },
      { label: "Lab 16 — SecurityContext", href: "#/labs/lab16" },
      { label: "CKS Study Guide — Tuần 3", href: "#/docs/cks-study-guide" },
      { label: "Killercoda — Killer Shell CKS", href: "https://killercoda.com/killer-shell-cks" },
    ],
    items: [
      {
        id: "cks-w3-1",
        text: "AppArmor: viết/load profile, enforce/complain, gắn vào container qua `securityContext.appArmorProfile`",
        lesson: `Phân quyền file kiểu Unix truyền thống giống nội quy "phòng ai nấy vào" — nhưng **root là giám đốc, muốn vào đâu cũng được**. **AppArmor** thuộc loại **Mandatory Access Control (MAC)**: một bản mô tả công việc chi tiết dán lên từng chương trình — "anh chỉ được đọc thư mục này, không được ghi file kia" — và **kể cả root cũng không vượt qua được**. Profile có hai chế độ: **enforce** (chặn thật) và **complain** (chỉ ghi log vi phạm — dùng khi thử nghiệm).

Quy trình 3 bước của dạng bài thi:

- **Viết profile** trên node (file trong \`/etc/apparmor.d/\`) — thi thường cho sẵn, bạn cần đọc hiểu các dòng \`deny\`.
- **Load vào kernel** bằng \`apparmor_parser\` — nhớ: phải load trên **đúng node mà pod sẽ chạy**.
- **Gắn vào pod/container** qua \`securityContext.appArmorProfile\` (field chính thức từ K8s 1.30; manifest cũ dùng annotation \`container.apparmor.security.beta.kubernetes.io/<container>\` — cần nhận ra khi đọc).

\`\`\`bash
# 1) Viết profile deny-write trên NODE nơi pod sẽ chạy:
cat <<'EOF' > /etc/apparmor.d/k8s-deny-write
#include <tunables/global>
profile k8s-deny-write flags=(attach_disconnected) {
  #include <abstractions/base>
  file,                # cho phép thao tác file nói chung...
  deny /** w,          # ...nhưng CẤM GHI ở mọi đường dẫn
}
EOF

# 2) Load vào kernel + xác nhận:
apparmor_parser -q /etc/apparmor.d/k8s-deny-write
aa-status | grep k8s-deny-write        # phải thấy trong danh sách enforce

# 3) Gắn vào container (K8s 1.30+), rồi verify:
#    securityContext:
#      appArmorProfile:
#        type: Localhost              # Localhost | RuntimeDefault | Unconfined
#        localhostProfile: k8s-deny-write
kubectl exec secured -- touch /tmp/x   # "Permission denied" = profile hoạt động
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Profile chưa load trên node (hoặc load nhầm node) → pod kẹt ở trạng thái lỗi/Blocked — \`kubectl describe pod\` sẽ nói rõ profile không tồn tại; luôn \`aa-status\` trên đúng node trước khi tạo pod. (2) Gõ sai tên profile trong \`localhostProfile\` so với tên khai báo **bên trong file** profile (dòng \`profile <tên> ...\`) — tên file và tên profile có thể khác nhau, cái được dùng là tên trong file.`,
      },
      {
        id: "cks-w3-2",
        text: "seccomp: profile JSON, RuntimeDefault vs Localhost, `/var/lib/kubelet/seccomp/`",
        lesson: `Mọi việc container làm — mở file, tạo thư mục, kết nối mạng — cuối cùng đều là **syscall** gọi xuống kernel. **seccomp** đặt một **lễ tân gác cửa kernel với danh sách câu hỏi được phép**: syscall trong danh sách thì cho qua, ngoài danh sách thì từ chối. Linux có ~300+ syscall nhưng app thường chỉ dùng vài chục — số còn lại là bề mặt tấn công cho container escape, và seccomp cắt phăng chúng.

Hai kiểu profile trong \`securityContext.seccompProfile\`:

- **\`RuntimeDefault\`** — bộ lọc mặc định của container runtime, chặn sẵn các syscall nguy hiểm; là **baseline khuyến nghị** cho mọi pod (và bắt buộc với Pod Security Standard \`restricted\`).
- **\`Localhost\`** — profile JSON tự viết, đặt trong thư mục gốc \`/var/lib/kubelet/seccomp/\` của node; \`localhostProfile\` khai báo đường dẫn **tương đối** so với thư mục đó.

Trong JSON: \`defaultAction\` là phán quyết mặc định, danh sách \`syscalls\` là ngoại lệ. \`SCMP_ACT_ALLOW\` cho qua, \`SCMP_ACT_ERRNO\` từ chối trả lỗi, \`SCMP_ACT_LOG\` cho qua nhưng ghi log (dùng để "đo" app cần syscall gì).

\`\`\`bash
# 1) Profile chặn mkdir — viết trên node, trong thư mục seccomp của kubelet:
mkdir -p /var/lib/kubelet/seccomp/profiles
cat <<'EOF' > /var/lib/kubelet/seccomp/profiles/deny-mkdir.json
{
  "defaultAction": "SCMP_ACT_ALLOW",
  "syscalls": [
    { "names": ["mkdir", "mkdirat"], "action": "SCMP_ACT_ERRNO" }
  ]
}
EOF

# 2) Gắn vào pod — đường dẫn TƯƠNG ĐỐI so với /var/lib/kubelet/seccomp/:
#    securityContext:
#      seccompProfile:
#        type: Localhost
#        localhostProfile: profiles/deny-mkdir.json

# 3) Verify:
kubectl exec app -- mkdir /tmp/test    # "Operation not permitted" = bị chặn ✓
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Khai \`localhostProfile\` bằng đường dẫn **tuyệt đối** (\`/var/lib/kubelet/seccomp/profiles/...\`) — sai, phải là đường dẫn tương đối \`profiles/...\`; sai là pod không tạo được container. (2) Viết profile whitelist (\`defaultAction: SCMP_ACT_ERRNO\`) nhưng thiếu các syscall nền như \`exit_group\`, \`futex\`, \`read\`, \`write\` — container chết ngay khi khởi động, trông như lỗi image chứ không như lỗi seccomp.`,
      },
      {
        id: "cks-w3-3",
        text: "Giảm bề mặt tấn công host: tắt service, đóng port (`ss -tlnp`), gỡ package thừa",
        lesson: `Một ngôi nhà **càng nhiều cửa càng khó canh** — mỗi cửa là một điểm cần khóa, cần kiểm tra, cần tin rằng bản lề không hỏng. Node Kubernetes cũng vậy: mỗi service đang chạy, mỗi port đang listen, mỗi package đã cài là **một cánh cửa thêm cho attacker**. Node lý tưởng chỉ chạy đúng những gì Kubernetes cần: kubelet, container runtime, và các thành phần hệ thống tối thiểu. Nguyên tắc: **không dùng thì tắt, tắt rồi thì gỡ**.

Dạng bài thi: *"trên node có một service lạ đang listen port X — tìm và vô hiệu hóa nó"*. Bộ kỹ năng truy vết:

- **\`ss -tlnp\`** — liệt kê port TCP đang listen kèm **process** mở nó (nhớ nghĩa cờ: **t**cp, **l**isten, **n**umeric, **p**rocess).
- Từ PID truy ra binary và service: \`ls -l /proc/<pid>/exe\`, hoặc \`systemctl status <pid>\`.
- **\`systemctl disable --now\`** — vừa dừng vừa cấm khởi động lại cùng hệ thống (chỉ \`stop\` thì reboot xong nó sống dậy).
- Gỡ hẳn package không cần bằng trình quản lý gói.

\`\`\`bash
# Port nào đang mở? Process nào mở?
ss -tlnp

# Truy từ port khả nghi về service:
ss -tlnp | grep 6666           # lấy pid trong ngoặc (pid=1234,...)
ls -l /proc/1234/exe           # binary thật sự là gì?
systemctl status 1234          # thuộc unit/service nào?

# Vô hiệu hóa vĩnh viễn + xác nhận port đã đóng:
systemctl disable --now vulnerable-app.service
ss -tlnp | grep 6666 || echo "port da dong"

# Gỡ package không dùng:
apt remove -y telnetd
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Chỉ \`systemctl stop\` mà quên \`disable\` — service bật lại sau reboot, và grader của kỳ thi hoàn toàn có thể kiểm tra trạng thái *enabled*; dùng một phát \`disable --now\` cho chắc. (2) Tay nhanh tắt nhầm service **thiết yếu** (kubelet, containerd) vì thấy tên lạ — trước khi tắt, luôn xác minh service đó là gì; node mất kubelet là mất luôn điểm những câu sau trên node đó.`,
      },
      {
        id: "cks-w3-4",
        text: "Least privilege trên node: kiểm soát sudo, khóa user",
        lesson: `Trong một tòa nhà an ninh tốt, **chìa khóa tổng chỉ nằm trong tay vài người có tên trong sổ**, và nhân viên đã nghỉ việc thì thẻ ra vào bị thu hồi ngay hôm đó. Trên node Linux, "chìa khóa tổng" là **sudo/root**, còn "nhân viên cũ chưa thu thẻ" là những **user account thừa** vẫn login được. CKS domain System Hardening yêu cầu bạn dọn cả hai: user không dùng thì **khóa**, quyền sudo không cần thì **thu hồi**.

Ba nguồn cấp quyền sudo cần rà:

- File \`/etc/sudoers\` và thư mục \`/etc/sudoers.d/\` — các dòng cấp quyền trực tiếp.
- Group \`sudo\` (Debian/Ubuntu) hoặc \`wheel\` (RHEL) — thành viên group này mặc nhiên có sudo.
- Khóa user: \`usermod -L\` khóa password, đổi shell sang \`nologin\` chặn login tương tác — làm **cả hai** mới kín (khóa password không chặn SSH key).

\`\`\`bash
# Ai đang được cấp sudo?
grep -rE '^[^#]' /etc/sudoers /etc/sudoers.d/ 2>/dev/null
getent group sudo                     # thành viên group sudo

# Thu quyền sudo của user không cần:
deluser dev-user sudo                 # gỡ khỏi group (Debian/Ubuntu)

# Khóa user không còn dùng:
usermod -L olduser                    # khóa password (-U để mở lại)
usermod -s /usr/sbin/nologin olduser  # chặn cả login shell

# Verify:
su - olduser                          # "This account is currently not available"
passwd -S olduser                     # cột 2 hiện L = locked
\`\`\`

Tư duy này nối thẳng vào Kubernetes: node là nơi chứa credential kubelet và socket container runtime — một user thường trên node chiếm được sudo là chiếm được **mọi container đang chạy** trên node đó.

⚠️ **Lỗi thường gặp:** (1) Chỉ khóa password mà quên user vẫn **SSH bằng key** được — kiểm tra và dọn \`~/.ssh/authorized_keys\`, hoặc đổi shell sang nologin. (2) Sửa \`/etc/sudoers\` bằng vim thường và lưu file lỗi cú pháp — **toàn bộ sudo trên node chết**, không ai leo root được nữa; luôn dùng \`visudo\` (có kiểm tra cú pháp trước khi lưu).`,
      },
    ],
  },
  {
    id: "cks-w4",
    week: "Tuần 4",
    title: "Pod Security & Secrets",
    goal: "Chinh phục 2 dạng bài trọng điểm: Pod Security Admission và Encryption at Rest.",
    practice:
      "Bật encryption at rest → tạo secret mới → `etcdctl get` xác nhận ciphertext; re-encrypt secret cũ bằng `kubectl get secrets -A -o json | kubectl replace -f -`.",
    resources: [
      { label: "Lab 16 — SecurityContext", href: "#/labs/lab16" },
      { label: "CKS Cheat Sheet — PSA & Encryption at Rest", href: "#/docs/cks-cheat-sheet" },
      {
        label: "K8s Docs — Pod Security Standards",
        href: "https://kubernetes.io/docs/concepts/security/pod-security-standards/",
      },
      {
        label: "K8s Docs — Encrypting Secret Data at Rest",
        href: "https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/",
      },
      { label: "Quiz ôn tập", href: "#/quiz" },
    ],
    items: [
      {
        id: "cks-w4-1",
        text: "SecurityContext chuyên sâu: runAsNonRoot, readOnlyRootFilesystem, drop ALL, không privileged",
        lesson: `Cấp quyền cho container giống **phát thẻ cho nhân viên vào kho**: mặc định Kubernetes phát thẻ khá rộng rãi (chạy root, được ghi khắp nơi trong container, mang theo cả chùm capabilities). SecurityContext là nơi bạn **thu thẻ về mức tối thiểu**. Bộ cấu hình "restricted chuẩn" cần thuộc như bảng cửu chương:

- **\`runAsNonRoot: true\`** (+ \`runAsUser: 1000\`) — từ chối khởi động nếu process là root; root trong container thoát ra ngoài là root thật trên node.
- **\`allowPrivilegeEscalation: false\`** — cấm leo quyền qua binary setuid như \`sudo\`.
- **\`capabilities.drop: ["ALL"]\`** — vứt cả chùm chìa khóa đặc quyền kernel, chỉ \`add\` lại đúng cái cần (vd \`NET_BIND_SERVICE\` để bind port < 1024).
- **\`readOnlyRootFilesystem: true\`** — container thành "phòng trưng bày không được sờ hiện vật"; app cần ghi thì cấp \`emptyDir\` đúng chỗ.
- **Không bao giờ \`privileged: true\`** — nó tắt gần như mọi lớp cách ly, container gần bằng root trên host.

Nhớ vị trí: pod-level \`spec.securityContext\` áp chung, container-level ghi đè pod-level.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened
spec:
  securityContext:              # pod-level
    runAsNonRoot: true
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:1.25
    securityContext:            # container-level (ghi đè pod-level)
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      privileged: false
      capabilities:
        drop: ["ALL"]
    volumeMounts:
    - name: tmp
      mountPath: /tmp           # RO rootfs → cấp chỗ ghi bằng emptyDir
  volumes:
  - name: tmp
    emptyDir: {}
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Bật \`runAsNonRoot\` với image mặc định chạy root (như \`nginx\` chuẩn) → pod lỗi \`CreateContainerConfigError: container has runAsNonRoot and image will run as root\` — phải thêm \`runAsUser\` hoặc đổi image (vd \`nginxinc/nginx-unprivileged\`). (2) Bật \`readOnlyRootFilesystem\` mà quên cấp \`emptyDir\` cho thư mục app cần ghi (\`/tmp\`, \`/var/cache/nginx\`...) → container CrashLoop; đọc log để biết app đòi ghi vào đâu rồi mount đúng chỗ đó.`,
      },
      {
        id: "cks-w4-2",
        text: "Pod Security Standards & Admission: label namespace enforce/audit/warn",
        lesson: `Nếu SecurityContext là ý thức tự giác của từng pod, thì **Pod Security Admission (PSA)** là **quy định an toàn bắt buộc dán trên cửa từng khu vực** của tòa nhà — pod nào không đạt chuẩn thì **không được bước vào namespace**. PSA là admission controller **có sẵn** trong apiserver (chính thức từ K8s 1.25, thay thế PodSecurityPolicy đã khai tử), bật chỉ bằng cách **dán label lên namespace** — không cần cài gì thêm.

Hai trục cần nhớ:

- **3 level chuẩn (Pod Security Standards)**: \`privileged\` (không hạn chế) < \`baseline\` (chặn các escalation đã biết: privileged, hostNetwork, hostPath...) < \`restricted\` (hardening tối đa: bắt buộc runAsNonRoot, drop ALL, seccomp RuntimeDefault...).
- **3 mode**: \`enforce\` (chặn pod vi phạm), \`audit\` (cho qua nhưng ghi audit log), \`warn\` (cho qua nhưng cảnh báo trên kubectl).

Chiến thuật thực tế: \`enforce=baseline\` + \`warn=restricted\` — chặn cái nguy hiểm, nhắc dần lên chuẩn cao; với namespace mới thì enforce thẳng \`restricted\`.

\`\`\`bash
# Bật enforce mức restricted cho namespace dev:
kubectl label ns dev pod-security.kubernetes.io/enforce=restricted
kubectl label ns dev pod-security.kubernetes.io/enforce-version=latest

# Kết hợp mode mềm hơn để quan sát:
kubectl label ns dev pod-security.kubernetes.io/warn=restricted
kubectl label ns dev pod-security.kubernetes.io/audit=baseline

# Kiểm tra pod có pass không mà KHÔNG tạo thật:
kubectl apply -f pod.yaml --dry-run=server
\`\`\`

Dạng bài thi kết hợp: enforce \`restricted\` lên namespace → pod cũ không tạo lại được → bạn phải **sửa manifest cho đạt chuẩn** (chính là bộ SecurityContext bài trước: runAsNonRoot, drop ALL, seccompProfile RuntimeDefault, allowPrivilegeEscalation false).

⚠️ **Lỗi thường gặp:** (1) Dán label enforce xong tưởng pod **đang chạy** vi phạm sẽ bị xóa — không: PSA chỉ chặn lúc **tạo/cập nhật**; pod cũ vẫn chạy cho tới khi bị recreate (dùng \`warn\`/\`audit\` để phát hiện chúng). (2) Gõ sai key label (thiếu prefix \`pod-security.kubernetes.io/\`) — label vẫn dán thành công mà không có tác dụng gì, và bạn mất thời gian tự hỏi vì sao pod vi phạm vẫn lọt.`,
      },
      {
        id: "cks-w4-3",
        text: "Encryption at Rest: EncryptionConfiguration, apiserver flag, verify bằng etcdctl",
        lesson: `Mặc định, Secret nằm trong etcd chỉ được **base64** — như sổ cái kế toán viết bằng ký hiệu tốc ký rồi cất trong **ngăn kéo không khóa**: ai đọc được ổ đĩa etcd (backup bị lộ, snapshot, quyền file) là đọc được mọi mật khẩu. **Encryption at Rest** đặt hẳn một **két sắt cho sổ cái**: apiserver mã hóa Secret trước khi ghi vào etcd và giải mã khi đọc ra — app không thấy gì khác biệt.

Quy trình 4 bước (dạng bài trọng điểm, mục tiêu < 8 phút):

- **Viết \`EncryptionConfiguration\`** (file trên control plane) — sinh key bằng \`head -c 32 /dev/urandom | base64\`.
- **Gắn flag** \`--encryption-provider-config=/etc/kubernetes/etcd/enc.yaml\` vào manifest apiserver **và mount** thư mục chứa file đó vào static pod (hostPath volume + volumeMount) — quên mount là apiserver không đọc được file.
- **Chờ apiserver lên lại** (\`watch crictl ps\`), tạo secret mới, verify bằng etcdctl (bài sau).
- **Re-encrypt secret cũ**: \`kubectl get secrets -A -o json | kubectl replace -f -\` — ghi đè lại để chúng đi qua đường mã hóa.

\`\`\`yaml
# /etc/kubernetes/etcd/enc.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: ["secrets"]
  providers:
  - aescbc:                        # provider ĐẦU danh sách → dùng để MÃ HÓA khi ghi
      keys:
      - name: key1
        secret: REPLACE_BASE64     # head -c 32 /dev/urandom | base64
  - identity: {}                   # đứng SAU → vẫn ĐỌC được secret cũ chưa mã hóa
\`\`\`

Thứ tự providers là linh hồn của bài này: provider **đầu tiên** mã hóa khi ghi, các provider sau chỉ dùng để **đọc** dữ liệu cũ. Muốn giải mã toàn bộ (decrypt), đảo \`identity: {}\` lên đầu rồi replace lại secrets.

⚠️ **Lỗi thường gặp:** (1) Sửa flag/manifest sai là **apiserver chết** — backup manifest trước, sửa xong \`watch crictl ps\`, hỏng thì đọc \`crictl logs\`; lỗi kinh điển: quên mount volume chứa enc.yaml. (2) Bật mã hóa xong tưởng mọi secret đã an toàn — **secret cũ không tự re-encrypt**, chúng vẫn nằm plaintext trong etcd cho tới khi bạn chạy lệnh replace toàn bộ.`,
      },
      {
        id: "cks-w4-4",
        text: "Đọc secret từ etcd — góc nhìn attacker để hiểu vì sao phải mã hóa",
        lesson: `Muốn hiểu vì sao phải khóa két, hãy **thử làm kẻ trộm một lần**. etcd là "phòng lưu trữ hồ sơ gốc" của cả cluster — mọi object, kể cả Secret, nằm ở đó dưới dạng key \`/registry/<resource>/<namespace>/<tên>\`. Attacker chiếm được control plane (hoặc chỉ cần **một bản backup etcd** bị lộ) sẽ không thèm hỏi apiserver — nơi còn RBAC gác cửa — mà **đọc thẳng etcd**, vòng qua toàn bộ hệ thống phân quyền.

Bài thực hành "attacker view" — cũng chính là bước **verify** của bài encryption at rest:

\`\`\`bash
# Đọc secret thẳng từ etcd (chạy trên control plane):
ETCDCTL_API=3 etcdctl get /registry/secrets/default/db-pass \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key | hexdump -C | head

# CHƯA mã hóa → thấy plaintext/base64 đọc được ngay trong hexdump
# ĐÃ mã hóa   → thấy prefix "k8s:enc:aescbc:v1:key1" + ciphertext ✓

# Còn base64 thì "giải mã" nhanh cỡ này:
kubectl get secret db-pass -o jsonpath='{.data.password}' | base64 -d
\`\`\`

Ba tham số TLS (\`--cacert\`, \`--cert\`, \`--key\`) lấy từ \`/etc/kubernetes/pki/etcd/\` — hoặc mở manifest \`/etc/kubernetes/manifests/etcd.yaml\` chép đúng đường dẫn etcd đang dùng, khỏi nhớ máy móc. Bài học rút ra xếp thành chuỗi phòng thủ: **base64 không phải mã hóa** → bật encryption at rest cho etcd → siết RBAC quyền \`get secrets\` (đọc được secret qua API thì mã hóa cũng vô nghĩa) → bảo vệ file backup etcd nghiêm ngặt như chính secret.

⚠️ **Lỗi thường gặp:** (1) Quên \`ETCDCTL_API=3\` hoặc thiếu bộ ba cert → lỗi kết nối/permission denied khó hiểu — cứ mở manifest etcd chép đường dẫn cert là chắc ăn. (2) Verify xong thấy ciphertext liền kết luận "xong bài" — nhớ kiểm tra cả **secret tạo từ trước** khi bật mã hóa: chúng vẫn plaintext nếu chưa chạy \`kubectl get secrets -A -o json | kubectl replace -f -\`.`,
      },
    ],
  },
];
