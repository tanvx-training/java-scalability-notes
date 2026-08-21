// CKS Roadmap Part 2 — Tuần 5 đến Tuần 9–10 (Admission & Isolation, Supply Chain, Runtime Security, Tổng hợp, Luyện đề)
// Lưu ý: id và text của từng item KHÔNG được thay đổi — tiến độ học của người dùng lưu theo các id này.

export const cksWeeksPart2 = [
  {
    id: "cks-w5",
    week: "Tuần 5",
    title: "Admission & Isolation",
    goal: "Chặn từ cổng vào (admission control) và cách ly runtime.",
    practice: "Cài gVisor trên lab (Killercoda có sẵn), tạo RuntimeClass, chạy pod với runsc, so sánh `dmesg`/`uname` trong pod thường vs sandbox.",
    resources: [
      { label: "CKS Cheat Sheet — mục OPA Gatekeeper & Kyverno, RuntimeClass", href: "#/docs/cks-cheat-sheet" },
      { label: "Kyverno Docs — Writing Policies", href: "https://kyverno.io/docs/" },
      { label: "Kubernetes Docs — RuntimeClass", href: "https://kubernetes.io/docs/concepts/containers/runtime-class/" },
      { label: "Lab 21 — NetworkPolicy default-deny + allow", href: "#/labs/lab21" },
      { label: "Killercoda — Killer Shell CKS scenarios", href: "https://killercoda.com/killer-shell-cks" },
    ],
    items: [
      {
        id: "cks-w5-1",
        text: "Admission controllers: mutating vs validating, thứ tự xử lý",
        lesson: `Mỗi request tạo/sửa resource khi đến API server phải qua ba trạm: **authentication** (bạn là ai?), **authorization** (bạn có quyền không?) và cuối cùng là **admission controllers** — đội **bảo vệ soát vé trước cửa** hội trường. Có vé hợp lệ (đã đăng nhập, RBAC cho phép) vẫn chưa chắc được vào: bảo vệ còn kiểm tra vật dụng mang theo, thậm chí *chỉnh lại trang phục* cho bạn trước khi mở cửa.

Hai loại bảo vệ, làm việc theo thứ tự cố định:

- **Mutating admission** — chạy TRƯỚC, được phép *sửa* object: thêm sidecar, gán ServiceAccount mặc định, điền field còn thiếu.
- **Validating admission** — chạy SAU, chỉ được *chấp nhận hoặc từ chối*, không sửa gì.

Thứ tự đầy đủ: **mutating → schema validation → validating**. Nhờ vậy validating luôn nhìn thấy object *sau khi* đã bị sửa — không ai lách luật bằng cách nhờ mutating "độ" lại object sau khâu kiểm tra.

Các plugin built-in quan trọng cho CKS: \`NodeRestriction\`, \`PodSecurity\`, \`ImagePolicyWebhook\`. Còn OPA Gatekeeper/Kyverno hoạt động qua cơ chế **webhook động**: chúng đăng ký \`MutatingWebhookConfiguration\` / \`ValidatingWebhookConfiguration\` để apiserver gọi ra ngoài hỏi ý kiến.

\`\`\`bash
# Xem apiserver đang bật những admission plugin nào
grep enable-admission-plugins /etc/kubernetes/manifests/kube-apiserver.yaml
# → - --enable-admission-plugins=NodeRestriction

# Bật thêm plugin: nối vào danh sách, phân tách bằng dấu phẩy
# - --enable-admission-plugins=NodeRestriction,ImagePolicyWebhook

# Liệt kê webhook động (Gatekeeper/Kyverno đăng ký ở đây)
kubectl get mutatingwebhookconfigurations
kubectl get validatingwebhookconfigurations
\`\`\`

⚠️ **Lỗi thường gặp:** sửa flag \`--enable-admission-plugins\` mà gõ sai tên plugin → apiserver không lên nổi; luôn \`cp\` backup manifest ra ngoài thư mục manifests trước và \`watch crictl ps\` sau khi sửa. Bẫy thứ hai: nhầm thứ tự xử lý — nhớ **M trước V** (Mutating trước Validating), câu tình huống rất hay gài ngược lại.`,
      },
      {
        id: "cks-w5-2",
        text: "OPA Gatekeeper / Kyverno: policy chặn registry lạ, bắt buộc label",
        lesson: `Admission controller là đội bảo vệ, còn **policy engine** là **cuốn nội quy** đội bảo vệ cầm trên tay: "không nhận hàng từ nhà cung cấp lạ", "mọi kiện hàng phải dán nhãn chủ sở hữu". **OPA Gatekeeper** và **Kyverno** đều là validating/mutating webhook cho phép bạn viết nội quy đó bằng YAML thay vì phải code.

Khác biệt chính giữa hai công cụ:

- **Gatekeeper** — kiến trúc 2 tầng: \`ConstraintTemplate\` (định nghĩa logic bằng Rego, sinh ra CRD mới) và \`Constraint\` (áp template với tham số cụ thể). Trong thi thường chỉ cần *đọc và sửa* template có sẵn, không viết Rego từ đầu.
- **Kyverno** — 1 resource \`ClusterPolicy\` duy nhất, pattern YAML dễ đọc; \`validationFailureAction: Enforce\` chặn thật, \`Audit\` chỉ ghi nhận vi phạm.

\`\`\`yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: pod-baseline
spec:
  validationFailureAction: Enforce   # Enforce = chặn; Audit = chỉ ghi nhận
  rules:
  - name: allowed-registry           # nội quy 1: chỉ nhận image registry công ty
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
  - name: require-team-label         # nội quy 2: bắt buộc label team
    match:
      any:
      - resources:
          kinds: ["Pod"]
    validate:
      message: "Pod phải có label team"
      pattern:
        metadata:
          labels:
            team: "?*"               # ?* = chuỗi bất kỳ nhưng không rỗng
\`\`\`

Verify bằng cách tạo pod vi phạm: \`kubectl run test --image=nginx\` phải bị từ chối kèm đúng message thì policy mới đạt.

⚠️ **Lỗi thường gặp:** để \`validationFailureAction: Audit\` rồi quên chuyển sang \`Enforce\` — policy "có cũng như không", pod xấu vẫn lọt qua. Với Gatekeeper: apply \`Constraint\` khi \`ConstraintTemplate\` chưa được tạo → lỗi "no matches for kind" vì CRD chưa tồn tại; luôn apply template trước.`,
      },
      {
        id: "cks-w5-3",
        text: "Sandbox runtime gVisor: RuntimeClass + `runtimeClassName`",
        lesson: `Container thường dùng **chung kernel** với host — như các căn phòng chung một hệ thống ống nước: chỉ cần một lỗ hổng kernel là kẻ tấn công "chui theo đường ống" thoát ra ngoài host (container escape). **gVisor** xử lý bằng cách nhốt workload lạ vào **phòng cách ly kính**: một kernel giả lập (Sentry, viết bằng Go) đứng chắn giữa, tự bắt và xử lý syscall của container — syscall độc hại không bao giờ chạm tới kernel thật của node.

Kubernetes tích hợp gVisor qua **RuntimeClass**: node phải cài sẵn \`runsc\` và khai báo handler trong config containerd; bạn chỉ việc tạo RuntimeClass trỏ tới handler đó rồi gắn \`runtimeClassName\` vào pod.

\`\`\`yaml
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc                 # PHẢI khớp tên handler đã cấu hình trong containerd
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
\`\`\`

Verify — đề thi rất hay yêu cầu chứng minh pod đang chạy sandbox: \`kubectl exec sandboxed -- dmesg | head\` sẽ in dòng có chữ **gVisor**, và \`kubectl exec sandboxed -- uname -r\` trả về version kernel *giả lập* khác hẳn kernel host. Chạy hai lệnh này trên một pod thường để so sánh — đây chính là bài practice tuần này.

⚠️ **Lỗi thường gặp:** tạo được RuntimeClass nhưng pod kẹt \`ContainerCreating\` với lỗi "handler not found" — node đó chưa cài runsc hoặc tên handler không khớp config containerd; kiểm tra bằng \`kubectl describe pod\` và \`kubectl get runtimeclass\`. Bẫy thứ hai: coi gVisor là thuốc tiên cho mọi workload — sandbox có overhead và không hỗ trợ đủ 100% syscall, chỉ dành cho workload không tin cậy/multi-tenant.`,
      },
      {
        id: "cks-w5-4",
        text: "mTLS giữa services & service mesh — mức khái niệm",
        lesson: `TLS thông thường giống việc khách kiểm tra thẻ nhân viên của lễ tân: chỉ **một chiều** — client xác minh server, còn server không biết client là ai. **mTLS (mutual TLS)** là hai bên **cùng xuất trình giấy tờ**: cả client lẫn server đều trình certificate và xác minh lẫn nhau trước khi nói chuyện. Trong cluster, điều này chặn cả hai mối nguy của traffic east-west (service gọi service): **nghe lén** (traffic được mã hóa) và **giả mạo** (pod lạ không có cert hợp lệ thì không bắt tay được).

Vấn đề thực tế: hàng trăm service, cert phải cấp phát và xoay vòng liên tục — làm tay là bất khả thi. Đó là việc của **service mesh** (Istio, Linkerd): mỗi pod được tiêm một **sidecar proxy**, mọi traffic đi qua proxy này và được tự động mTLS hóa — ứng dụng không phải đổi một dòng code. Đề CKS chỉ yêu cầu **mức khái niệm**: hiểu vì sao cần mTLS và nhận diện được cấu hình khi nhìn thấy.

\`\`\`yaml
# Ví dụ nhận diện (Istio): bắt buộc mTLS cho mọi workload trong namespace prod
apiVersion: security.istio.io/v1
kind: PeerAuthentication
metadata:
  name: default
  namespace: prod
spec:
  mtls:
    mode: STRICT     # STRICT = chỉ chấp nhận traffic đã mTLS
                     # PERMISSIVE = nhận cả plaintext (giai đoạn chuyển đổi)
\`\`\`

Điểm cần phân biệt trong bài thi: TLS ở **Ingress** bảo vệ traffic north-south (ngoài → trong), còn mTLS của mesh bảo vệ traffic **service-to-service** bên trong cluster — hai lớp khác nhau, không thay thế nhau.

⚠️ **Lỗi thường gặp:** nghĩ NetworkPolicy thay được mTLS — NetworkPolicy chỉ *chặn/cho phép* kết nối theo label/IP/port (L3/L4), hoàn toàn không mã hóa và không xác thực danh tính; hai cơ chế bổ sung cho nhau. Bẫy thứ hai: nhầm PERMISSIVE là an toàn — nó vẫn nhận plaintext, chỉ dùng tạm khi migrate.`,
      },
      {
        id: "cks-w5-5",
        text: "Cách ly kết hợp: namespace + NetworkPolicy + RuntimeClass",
        lesson: `Một khách sạn tiếp khách lạ không chỉ dựa vào một ổ khóa: khách được xếp vào **khu riêng** (namespace), **thang máy chỉ mở đúng tầng của họ** (NetworkPolicy), phòng thuộc loại **cách ly kính** (RuntimeClass gVisor), và **nội quy dán ngay cửa** — vi phạm là không được nhận phòng (Pod Security Admission). Đây là tư duy **defense in depth**: một lớp bị xuyên thủng thì các lớp còn lại vẫn giữ.

Kịch bản thi điển hình: "triển khai workload không tin cậy với mức cách ly tối đa". Bài làm là ghép cả bốn mảnh vào một bộ manifest:

\`\`\`yaml
apiVersion: v1
kind: Namespace
metadata:
  name: untrusted
  labels:
    pod-security.kubernetes.io/enforce: restricted   # nội quy dán cửa (PSA)
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: untrusted
spec:
  podSelector: {}                        # áp cho MỌI pod trong namespace
  policyTypes: ["Ingress", "Egress"]     # không khai rule nào → chặn cả 2 chiều
---
apiVersion: v1
kind: Pod
metadata:
  name: guest
  namespace: untrusted
spec:
  runtimeClassName: gvisor               # phòng cách ly kính
  securityContext:
    runAsNonRoot: true
    seccompProfile: {type: RuntimeDefault}
  containers:
  - name: app
    image: nginx:1.25
    securityContext:                     # đủ điều kiện PSA restricted
      allowPrivilegeEscalation: false
      capabilities: {drop: ["ALL"]}
\`\`\`

Thứ tự tư duy khi làm: tạo namespace + label PSA trước, đến NetworkPolicy default-deny, rồi mới đến pod — pod phải *thỏa cả nội quy* mới được admission cho vào.

⚠️ **Lỗi thường gặp:** default-deny egress chặn luôn cả DNS — nếu pod cần resolve tên miền, phải thêm rule egress mở port 53 UDP+TCP, không thì mọi kết nối theo tên "chết lặng". Bẫy thứ hai: namespace đã enforce \`restricted\` mà pod thiếu \`seccompProfile\` hoặc \`drop: ["ALL"]\` → bị từ chối ngay khâu admission; đọc kỹ message lỗi, nó liệt kê đúng từng field còn thiếu.`,
      },
    ],
  },
  {
    id: "cks-w6",
    week: "Tuần 6",
    title: "Supply Chain Security",
    goal: "An toàn từ Dockerfile đến registry — domain 20%.",
    practice: "Scan 4 image, tìm image nào chứa CVE cụ thể (dạng bài thi thật). Viết Kyverno/Gatekeeper policy chỉ cho phép image từ `docker.io/library/`.",
    resources: [
      { label: "CKS Cheat Sheet — mục Supply Chain (Trivy, SBOM, ImagePolicyWebhook)", href: "#/docs/cks-cheat-sheet" },
      { label: "Trivy Docs", href: "https://aquasecurity.github.io/trivy" },
      { label: "Kyverno Docs — Restrict Image Registries", href: "https://kyverno.io/docs/" },
      { label: "Killercoda — Killer Shell CKS scenarios", href: "https://killercoda.com/killer-shell-cks" },
      { label: "Quiz — kiểm tra nhanh kiến thức", href: "#/quiz" },
    ],
    items: [
      {
        id: "cks-w6-1",
        text: "Dockerfile hardening: distroless, tag+digest, USER không root, multi-stage, COPY thay ADD",
        lesson: `Đóng gói một kiện hàng an toàn cần hai nguyên tắc: **hộp càng gọn càng ít chỗ giấu đồ cấm**, và **niêm phong để biết hộp chưa bị mở**. Với image cũng vậy: base image **distroless** không có shell, không package manager — kẻ tấn công vào được cũng "tay không tấc sắt"; còn **digest** (\`image@sha256:...\`) chính là **niêm phong hộp hàng**: tag như \`nginx:latest\` có thể bị trỏ sang nội dung khác bất kỳ lúc nào, digest thì bất biến tuyệt đối.

Checklist hardening đầy đủ — mỗi dòng là một câu hỏi khi review Dockerfile trong đề:

- Base image tối giản + ghim **tag cụ thể**, tốt nhất là **digest**.
- **\`USER\` không phải root** — tạo user riêng và chuyển sang trước ENTRYPOINT.
- **Multi-stage build** — toolchain build (compiler, npm...) không đi vào image cuối.
- **COPY thay ADD** — ADD có hai hành vi "thừa" nguy hiểm: tự giải nén file tar và tự tải URL.
- Không nhúng secret vào image (ENV, COPY khóa/token).

\`\`\`dockerfile
# Stage 1: build — chứa toolchain, KHÔNG đi vào image cuối
FROM golang:1.22 AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -o /app

# Stage 2: runtime — distroless: không shell, không package manager
FROM gcr.io/distroless/static@sha256:abc123def456   # ghim digest = "niêm phong"
COPY --from=build /app /app        # COPY, không dùng ADD
USER nonroot                        # KHÔNG chạy root
ENTRYPOINT ["/app"]
\`\`\`

⚠️ **Lỗi thường gặp:** dùng ADD chép file \`.tar.gz\` rồi ngỡ ngàng vì nó bị *tự giải nén* vào image — dạng bài "tìm lỗi trong Dockerfile" rất thích gài chi tiết này. Bẫy thứ hai: COPY secret vào image rồi \`RUN rm\` ở layer sau — file vẫn nằm nguyên trong layer cũ, ai pull image đều moi ra được; secret phải mount lúc runtime, không bao giờ nướng vào image.`,
      },
      {
        id: "cks-w6-2",
        text: "Phân tích tĩnh manifest: soi privileged, hostPath, hostNetwork",
        lesson: `Trước khi hành khách lên máy bay, hành lý phải qua **máy soi**: không cần mở từng vali, ảnh chụp X-quang đã lộ ra vật cấm. Phân tích tĩnh manifest cũng vậy — chưa cần chạy pod, chỉ *đọc YAML* là thấy ngay những cấu hình có thể phá vỡ cách ly. Danh sách "vật cấm" phải thuộc lòng:

- \`privileged: true\` — container thành root trên host, tắt gần hết cơ chế cách ly.
- \`hostPID\` / \`hostIPC\` / \`hostNetwork: true\` — nhìn thấy process, IPC, network của host.
- \`hostPath\` — mount filesystem của node; đặc biệt nguy hiểm với \`/\`, \`/etc\`, \`/var/run/containerd\`.
- \`capabilities.add: ["SYS_ADMIN"]\` — capability "gần bằng root".
- \`runAsUser: 0\` / thiếu \`runAsNonRoot\` — chạy root trong container.

\`\`\`bash
# Soi 1 file YAML tìm cấu hình nguy hiểm
grep -nE "privileged|hostNetwork|hostPID|hostIPC|hostPath|runAsUser: 0|SYS_ADMIN" pod.yaml

# Quét toàn cluster: pod nào có container privileged?
kubectl get pods -A -o json | jq -r '.items[] | select(any(.spec.containers[]; .securityContext.privileged == true)) | .metadata.namespace + "/" + .metadata.name'

# Pod nào dùng hostNetwork?
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.hostNetwork == true) | .metadata.name'

# Pod nào mount hostPath? (dấu ? tránh lỗi khi pod không có volumes)
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.volumes[]?.hostPath) | .metadata.name'
\`\`\`

Dạng bài thi: "trong các manifest sau, manifest nào an toàn nhất / nguy hiểm nhất" hoặc "gỡ bỏ cấu hình không an toàn khỏi Deployment X" — kỹ năng là nhìn phát ra ngay red flag, sửa xong apply lại và verify pod vẫn chạy.

⚠️ **Lỗi thường gặp:** chỉ soi \`securityContext\` mức pod mà bỏ sót mức **container** — container-level override pod-level, một container lén \`privileged: true\` vẫn qua mặt được người review vội. Bẫy thứ hai: quên rằng \`hostPath\` nằm ở \`volumes\` chứ không phải securityContext — mount \`/var/run/containerd/containerd.sock\` nguy hiểm ngang privileged nhưng dễ lọt lưới khi chỉ chăm chăm soi securityContext.`,
      },
      {
        id: "cks-w6-3",
        text: "Trivy: scan image theo severity, tìm CVE cụ thể trong nhiều image",
        lesson: `**Trivy** là trạm **kiểm dịch hàng hóa**: mỗi image được "tháo tung" ra từng package, đối chiếu số lô với **danh sách hàng bị thu hồi** (CVE database) — kiện nào dính lô lỗi là lộ ra ngay kèm mức độ nghiêm trọng. Đây là một trong những câu "điểm cho không" của đề CKS nếu bạn đã luyện tay.

Hai dạng bài kinh điển: (1) "scan image X, liệt kê lỗ hổng HIGH/CRITICAL ra file"; (2) "trong 4 image sau, image nào chứa CVE-XXXX-YYYY — xóa/scale về 0 các pod dùng image đó". Dạng 2 giải nhanh nhất bằng vòng lặp:

\`\`\`bash
# Scan 1 image, chỉ hiện lỗ hổng nặng
trivy image --severity HIGH,CRITICAL nginx:1.25

# Dạng bài thi: 4 image, image nào chứa CVE-2024-1234?
for i in nginx:1.25 httpd:2.4 redis:7 alpine:3.19; do
  echo "== $i"
  trivy image -q $i | grep CVE-2024-1234   # -q: tắt progress bar cho grep sạch
done

# Scan image đóng gói dạng tar (không có trên registry)
trivy image --input /root/image.tar

# Xuất JSON khi đề yêu cầu lưu kết quả
trivy image -f json -o /root/result.json nginx:1.25
\`\`\`

Sau khi tìm ra image nhiễm, bước hai thường là hành động trên cluster: \`kubectl get pods -A -o wide\` tìm pod nào đang dùng image đó, rồi làm đúng theo yêu cầu đề (delete pod, scale deployment về 0, hay chỉ ghi tên ra file — đọc kỹ, mỗi đề mỗi khác).

⚠️ **Lỗi thường gặp:** quên \`-q\` khiến progress output trộn vào kết quả, grep nhìn rối mắt dễ sót; và lần scan đầu tiên Trivy tải vulnerability DB hơi lâu — cứ để nó chạy, đừng sốt ruột Ctrl+C rồi tưởng lệnh treo. Bẫy thứ hai: đề yêu cầu "scale về 0" mà bạn lại delete pod (hoặc ngược lại) — làm đúng *hành động* đề yêu cầu mới được điểm.`,
      },
      {
        id: "cks-w6-4",
        text: "SBOM: `trivy image --format cyclonedx/spdx-json`",
        lesson: `**SBOM (Software Bill of Materials)** là **bảng thành phần in trên bao bì thực phẩm**: không cần "nếm lại" (scan lại image), chỉ đọc nhãn là biết bên trong có đúng những nguyên liệu gì, phiên bản nào. Giá trị lớn nhất lộ ra khi một CVE mới được công bố: thay vì scan lại hàng nghìn image, chỉ cần tra kho SBOM là biết ngay hệ thống nào đang chứa package dính lỗi — đây chính là bài học rút ra từ sự cố Log4Shell.

Hai định dạng chuẩn cần nhận diện: **CycloneDX** và **SPDX**. Trivy tạo được cả hai, và ngược lại còn scan được lỗ hổng *từ chính file SBOM* mà không cần kéo image về:

\`\`\`bash
# Tạo SBOM định dạng CycloneDX
trivy image --format cyclonedx --output sbom.cdx.json nginx:1.25

# Hoặc định dạng SPDX JSON
trivy image --format spdx-json --output sbom.spdx.json nginx:1.25

# Scan lỗ hổng TỪ SBOM — không cần pull lại image
trivy sbom sbom.cdx.json

# Tool "bom" (nếu đề chỉ định dùng nó thay Trivy)
bom generate --image nginx:1.25 -o sbom.spdx
\`\`\`

Trong đề thi, dạng bài SBOM thường rất "thẳng": tạo SBOM cho image X theo format Y, lưu vào đúng đường dẫn đề cho — điểm nằm ở việc gõ đúng cú pháp flag và đúng path output. Mở tab docs Trivy sẵn để tra nếu quên flag.

⚠️ **Lỗi thường gặp:** nhầm SBOM với kết quả scan — SBOM chỉ là *danh sách thành phần*, tự nó không nói gì về lỗ hổng; muốn biết CVE phải chạy \`trivy sbom <file>\` thêm một bước. Bẫy thứ hai: gõ sai giá trị \`--format\` — đúng là \`cyclonedx\` và \`spdx-json\` (còn có \`spdx\` dạng tag-value), không tồn tại format tên "sbom".`,
      },
      {
        id: "cks-w6-5",
        text: "Giới hạn registry được phép: OPA/Kyverno hoặc ImagePolicyWebhook",
        lesson: `Một công ty cẩn thận chỉ nhận hàng từ **nhà cung cấp đã ký hợp đồng** — bảo vệ đối chiếu tên người gửi trên từng kiện hàng, sai tên là trả về. Với cluster, "tên người gửi" là registry trong image reference, và có hai cách dựng chốt chặn:

- **Kyverno/Gatekeeper** (tầng webhook, dễ triển khai): policy validate pattern image như bài \`cks-w5-2\` — đây là cách nên chọn khi đề cho tùy ý.
- **ImagePolicyWebhook** (admission plugin của chính apiserver): apiserver gọi một webhook server bên ngoài để hỏi "image này được phép không?". Cấu hình rắc rối hơn nên hay được đề cho sẵn một nửa, yêu cầu hoàn thiện:

\`\`\`yaml
# /etc/kubernetes/policywebhook/admission_config.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: AdmissionConfiguration
plugins:
- name: ImagePolicyWebhook
  configuration:
    imagePolicy:
      kubeConfigFile: /etc/kubernetes/policywebhook/kubeconf  # trỏ tới webhook server
      allowTTL: 50
      denyTTL: 50
      retryBackoff: 500
      defaultAllow: false     # ⭐ webhook chết → TỪ CHỐI (fail-closed) — hay được hỏi
\`\`\`

Sau đó sửa apiserver: thêm \`ImagePolicyWebhook\` vào \`--enable-admission-plugins\`, thêm \`--admission-control-config-file=/etc/kubernetes/policywebhook/admission_config.yaml\`, và **mount hostPath volume** chứa thư mục config vào static pod. Verify: tạo pod với image ngoài danh sách phải bị từ chối.

⚠️ **Lỗi thường gặp:** để \`defaultAllow: true\` — webhook sập một cái là *mọi* image lọt qua, phá vỡ toàn bộ mục đích; đề rất hay hỏi đúng field này. Bẫy thứ hai: sửa flags apiserver mà quên mount volume chứa file config → apiserver crash "no such file or directory"; luôn backup manifest trước và \`watch crictl ps\` sau. Với Kyverno, nhớ image ngắn như \`nginx\` được chuẩn hóa thành \`docker.io/library/nginx\` — pattern phải tính cả trường hợp này.`,
      },
      {
        id: "cks-w6-6",
        text: "Image signing/verification (cosign) — mức nhận biết",
        lesson: `Digest giống **niêm phong** — chứng minh hộp hàng *chưa bị mở* — nhưng không cho biết **ai là người đóng hộp**. Chữ ký số bù đúng chỗ thiếu đó: **cosign** ký image bằng private key như công chứng viên đóng dấu và ký tên lên tài liệu; ai cầm public key cũng xác minh được tài liệu do đúng người đó phát hành và chưa bị sửa chữ nào. Đề CKS chỉ yêu cầu **mức nhận biết**: hiểu quy trình sign/verify và đọc được cấu hình enforce.

\`\`\`bash
# Tạo cặp khóa (sinh ra cosign.key + cosign.pub)
cosign generate-key-pair

# Ký image — ký theo DIGEST, chữ ký được đẩy lên cùng registry
cosign sign --key cosign.key registry.company.io/app@sha256:abc123def456

# Verify — thất bại nghĩa là image bị thay đổi hoặc không do ta ký
cosign verify --key cosign.pub registry.company.io/app@sha256:abc123def456
\`\`\`

Mảnh ghép cuối để thành chính sách cluster: bắt buộc *mọi* image phải có chữ ký hợp lệ mới được chạy. Kyverno có rule \`verifyImages\` làm đúng việc này ở tầng admission — pod dùng image không có chữ ký (hoặc ký bằng khóa khác) bị chặn ngay từ cổng. Ghép với bài registry whitelist, bạn có chuỗi supply chain khép kín: registry tin cậy → image có chữ ký → digest bất biến.

⚠️ **Lỗi thường gặp:** ký theo **tag** thay vì digest — sau khi ký, tag có thể bị trỏ sang image khác, chữ ký thành vô nghĩa; luôn ký và verify theo \`@sha256:...\`. Bẫy thứ hai: verify fail chỉ vì dùng nhầm public key — đề cho sẵn key ở đường dẫn nào thì đọc kỹ và dùng đúng đường dẫn đó, đừng vội kết luận image "đã bị tấn công".`,
      },
    ],
  },
  {
    id: "cks-w7",
    week: "Tuần 7",
    title: "Monitoring, Logging & Runtime Security",
    goal: "Hai dạng bài gần như chắc chắn có: Falco và audit logging.",
    practice: "Viết audit policy log RequestResponse cho secrets trong 1 namespace → bật → tạo secret → grep audit log. Sửa 1 Falco rule đổi output format và trigger nó (exec shell vào container).",
    resources: [
      { label: "CKS Cheat Sheet — mục Audit Logging & Falco", href: "#/docs/cks-cheat-sheet" },
      { label: "Falco Docs — Rules & Supported Fields", href: "https://falco.org/docs/" },
      { label: "Kubernetes Docs — Auditing", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/audit/" },
      { label: "Lab 16 — SecurityContext (readOnlyRootFilesystem)", href: "#/labs/lab16" },
      { label: "Killercoda — Falco & Audit scenarios", href: "https://killercoda.com/killer-shell-cks" },
    ],
    items: [
      {
        id: "cks-w7-1",
        text: "Falco ⭐: rules file, sửa output format (%evt.time, %user.name…), condition/macro/list",
        lesson: `**Falco** là hệ thống **camera an ninh + chuông báo động** của cluster: nó không chặn kẻ trộm, nhưng theo dõi *hành vi* (dòng syscall trên node qua driver/eBPF) và hú còi ngay khi có chuyện bất thường — mở shell trong container, đọc \`/etc/shadow\`, ghi file vào thư mục nhị phân. Vị trí file phải thuộc lòng: \`/etc/falco/falco.yaml\` (config chung), \`/etc/falco/falco_rules.yaml\` (rules mặc định — KHÔNG sửa trực tiếp), \`/etc/falco/falco_rules.local.yaml\` (⭐ nơi đặt rule custom/override). Xem alert bằng \`journalctl -u falco -f\`.

Một rule gồm 5 phần: \`rule\` (tên), \`desc\`, \`condition\`, \`output\`, \`priority\` — cộng thêm hai khối tái sử dụng là \`macro\` (mảnh condition đặt tên) và \`list\` (danh sách giá trị):

\`\`\`yaml
# /etc/falco/falco_rules.local.yaml
- list: sensitive_files              # list: danh sách giá trị dùng lại
  items: [/etc/shadow, /etc/sudoers]

- macro: open_sensitive              # macro: mảnh condition đặt tên
  condition: open_read and fd.name in (sensitive_files)

- rule: Read Sensitive File
  desc: Phat hien doc file nhay cam trong container
  condition: open_sensitive and container
  output: "%evt.time,%user.name,%proc.cmdline,%container.name,%fd.name"
  priority: WARNING                  # EMERGENCY..DEBUG
\`\`\`

Dạng bài chắc suất: "sửa rule X để output theo format %evt.time,%user.name,...". Quy trình 4 bước: \`grep -A 10 "rule: <tên>" /etc/falco/falco_rules.yaml\` tìm rule gốc → copy nguyên rule sang \`falco_rules.local.yaml\`, chỉ sửa dòng \`output\` → \`systemctl restart falco\` → trigger (exec shell vào container) và xác nhận trong \`journalctl -u falco\`.

⚠️ **Lỗi thường gặp:** sửa rule xong **quên restart Falco** — rule cũ vẫn đang chạy, bạn trigger mãi không thấy format mới rồi tưởng mình sửa sai. Bẫy thứ hai: sửa thẳng vào \`falco_rules.yaml\` thay vì override trong file local — vừa sai best practice, vừa dễ bị chấm sai vị trí; khi hai file cùng định nghĩa một rule, bản trong file local (nạp sau) thắng.`,
      },
      {
        id: "cks-w7-2",
        text: "Kubernetes Audit Logging ⭐: audit policy 4 level, bật trên apiserver kèm mount volume",
        lesson: `Audit log là **sổ ghi chép ra vào tòa nhà**: ai (user) vào phòng nào (resource, namespace) làm gì (verb) lúc mấy giờ. **Audit policy** quy định mức chi tiết cho từng loại khách qua 4 level: \`None\` (không ghi) < \`Metadata\` (chỉ ghi ai-làm-gì-lúc-nào) < \`Request\` (+ nội dung mang vào) < \`RequestResponse\` (+ cả nội dung mang ra). Quy tắc vàng: **rule khớp ĐẦU TIÊN được áp dụng** — thứ tự trong danh sách quyết định tất cả.

\`\`\`yaml
# /etc/kubernetes/audit/policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:
# Rule khớp đầu tiên thắng — đặt rule cụ thể lên TRÊN
- level: RequestResponse        # log cả body request + response
  resources:
  - group: ""                   # "" = core API group
    resources: ["secrets"]
  namespaces: ["prod"]
- level: Metadata               # chỉ user/verb/resource/timestamp
  resources:
  - group: ""
    resources: ["pods"]
  verbs: ["delete"]
- level: None                   # còn lại không log — giảm noise, đặt CUỐI
\`\`\`

Bật trên apiserver — đủ bộ 4 việc: (1) flags \`--audit-policy-file=/etc/kubernetes/audit/policy.yaml\`, \`--audit-log-path=/var/log/kubernetes/audit/audit.log\`; (2) flags xoay vòng \`--audit-log-maxage=30\`, \`--audit-log-maxbackup=5\`, \`--audit-log-maxsize=100\`; (3) **mount 2 hostPath volume** — thư mục chứa policy (readOnly) và thư mục ghi log; (4) chờ apiserver lên lại rồi verify: tạo secret trong \`prod\`, \`grep '"resource":"secrets"' audit.log | jq .\` phải thấy event level RequestResponse.

⚠️ **Lỗi thường gặp:** bẫy số 1 của cả kỳ thi — thêm flag nhưng **quên mount volume vào static pod** apiserver: container không đọc được policy file, apiserver crash và \`kubectl\` chết theo; cứu bằng \`crictl logs\` + backup manifest. Bẫy thứ hai: đặt \`level: None\` lên đầu danh sách — nó "nuốt" mọi request, audit log trống trơn mà không báo lỗi gì.`,
      },
      {
        id: "cks-w7-3",
        text: "Immutable containers: readOnlyRootFilesystem + emptyDir cho thư mục cần ghi",
        lesson: `Phòng trưng bày bảo tàng treo biển **"không chạm vào hiện vật"**: khách tham quan (kể cả kẻ gian trà trộn) không thể sơn vẽ hay tráo đổi đồ vật. Container immutable cũng vậy — \`readOnlyRootFilesystem: true\` biến toàn bộ filesystem thành chỉ-đọc: kẻ xâm nhập dù exec được vào cũng **không thể tải malware về, không sửa được binary, không cài thêm tool**. Đổi lại, chỗ nào app *thật sự* cần ghi thì cấp riêng một "khay ghi chú" — volume \`emptyDir\` — mất sạch khi pod chết, đúng tinh thần tạm bợ.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: immutable-web
spec:
  containers:
  - name: web
    image: nginx:1.25
    securityContext:
      readOnlyRootFilesystem: true   # ở CONTAINER-level, pod-level không có field này
    volumeMounts:                    # nginx cần ghi 3 chỗ → cấp emptyDir đúng 3 chỗ
    - {name: tmp, mountPath: /tmp}
    - {name: cache, mountPath: /var/cache/nginx}
    - {name: run, mountPath: /var/run}
  volumes:
  - {name: tmp, emptyDir: {}}
  - {name: cache, emptyDir: {}}
  - {name: run, emptyDir: {}}
\`\`\`

Quy trình làm bài: bật \`readOnlyRootFilesystem\` → pod CrashLoopBackOff → \`kubectl logs\` đọc xem app đòi ghi vào đâu ("Read-only file system: /var/cache/nginx") → cấp emptyDir đúng chỗ đó → lặp lại đến khi Running. Verify chốt hạ: \`kubectl exec immutable-web -- touch /bin/x\` phải báo "Read-only file system".

⚠️ **Lỗi thường gặp:** bật RO filesystem mà không cấp emptyDir → CrashLoop, rồi loay hoay đoán mò thay vì **đọc log** — log nói đích danh thư mục app cần ghi. Bẫy thứ hai: đặt \`readOnlyRootFilesystem\` vào \`spec.securityContext\` mức pod — field này **chỉ tồn tại ở container-level**, apply sẽ báo unknown field.`,
      },
      {
        id: "cks-w7-4",
        text: "Phát hiện xâm nhập: process lạ trong container, tìm pod bị chiếm (`crictl`, Falco events)",
        lesson: `Nghi có kẻ lạ đột nhập tòa nhà, đội an ninh làm ba việc theo thứ tự: **xem lại camera** (Falco events), **lật sổ trực** (audit log), rồi **đi tuần từng phòng** (kiểm tra process). Điều tra pod bị chiếm trong cluster đúng y trình tự đó — và nguyên tắc số một của forensics: **cô lập, đừng tiêu hủy tang chứng**.

\`\`\`bash
# 1. Camera an ninh: Falco đã ghi nhận gì?
journalctl -u falco | grep -iE "shell|write below"

# 2. Đi tuần trong container: process lạ?
kubectl exec <pod> -- ps aux            # sh/nc/wget lạ đang chạy?

# 3. Nhìn từ phía node bằng crictl:
crictl ps                               # container nào đang chạy trên node
crictl inspect <container-id>           # image, mounts, PID trên host
crictl logs <container-id>
ss -tlnp                                # port lạ đang listen trên node?

# 4. CÔ LẬP thay vì xóa — giữ nguyên tang chứng:
kubectl label pod <pod> quarantine=true      # rồi áp NetworkPolicy deny-all theo label
kubectl cordon <node>                        # chặn pod mới lên node nghi nhiễm
\`\`\`

Các dấu hiệu pod bị chiếm cần nhạy: image lạ không thuộc registry công ty, process con của app là shell (\`sh\` fork từ \`nginx\` là cực kỳ bất thường), kết nối ra ngoài tới IP lạ, file mới xuất hiện trong \`/bin\` hay \`/usr/bin\`. Falco rule mặc định "Terminal shell in container" bắt đúng kịch bản phổ biến nhất — exec shell — nên hãy tự trigger nó trong lab để quen mặt alert.

⚠️ **Lỗi thường gặp:** phản xạ \`kubectl delete pod\` ngay khi thấy pod khả nghi — vừa **mất sạch tang chứng**, vừa vô ích nếu pod thuộc Deployment (ReplicaSet tạo lại pod mới ngay); bài bản là label + NetworkPolicy cô lập hoặc cordon node rồi mới điều tra. Bẫy thứ hai: chỉ soi trong container mà quên soi **node** — nếu kẻ tấn công đã escape, \`crictl\` và \`ss -tlnp\` trên node mới lộ ra dấu vết.`,
      },
      {
        id: "cks-w7-5",
        text: "strace / syscall analysis mức cơ bản",
        lesson: `Hãy tưởng tượng một **máy quay chậm ghi lại từng cử động tay** của nhân viên: mỗi lần "với tay" lấy đồ là một **syscall** — lời xin phép kernel làm một việc (mở file, tạo process, kết nối mạng). \`strace\` chính là máy quay đó cho một process: nó liệt kê mọi syscall kèm tham số và kết quả. Với CKS, strace là cây cầu nối hai chủ đề lớn: kết quả strace cho biết app cần *những syscall nào* — chính là dữ liệu để viết **seccomp allow-list**; còn **Falco** thì theo dõi đúng dòng syscall này ở quy mô toàn node.

\`\`\`bash
# Thống kê syscall một lệnh sử dụng (nền tảng viết seccomp profile)
strace -c ls

# Bám theo process ĐANG chạy, kèm mọi process con (-f)
strace -f -p 1234

# Chỉ xem nhóm syscall thao tác file
strace -e trace=file cat /etc/hosts

# Tìm PID (trên host) của process trong container để attach:
crictl ps                                  # lấy container-id
crictl inspect <container-id> | grep -i pid
\`\`\`

Ứng dụng thực tế trong bài thi/lab: pod bị seccomp chặn syscall nào đó và crash khó hiểu → chạy lại binary dưới \`strace -c\` (hoặc bật seccomp profile \`SCMP_ACT_LOG\` rồi đọc \`journalctl | grep SECCOMP\`) để biết syscall nào bị thiếu, bổ sung vào allow-list. Mức yêu cầu của đề chỉ dừng ở đọc-hiểu output và mấy flag cơ bản \`-c\`, \`-f\`, \`-p\`, \`-e trace=\`.

⚠️ **Lỗi thường gặp:** cố chạy strace *bên trong* container distroless/minimal — làm gì có strace trong đó; đúng bài là đứng **trên node**, lấy PID qua \`crictl inspect\` rồi \`strace -f -p <pid>\` từ ngoài. Bẫy thứ hai: quên \`-f\` nên bỏ lọt toàn bộ syscall của process con — shell và app hiện đại fork liên tục, thiếu \`-f\` là nhìn thiếu nửa bức tranh.`,
      },
    ],
  },
  {
    id: "cks-w8",
    week: "Tuần 8",
    title: "Tổng hợp & kịch bản tấn công–phòng thủ",
    goal: "Ghép mọi mảnh thành phản xạ phòng thủ hoàn chỉnh.",
    practice: "Harden 1 pod \"tệ nhất\" (root+privileged+hostPath) thành \"chuẩn nhất\" và ghi lại từng bước.",
    resources: [
      { label: "CKS Cheat Sheet — SecurityContext restricted & apiserver flags", href: "#/docs/cks-cheat-sheet" },
      { label: "CKS Study Guide — Tuần 8", href: "#/docs/cks-study-guide" },
      { label: "Lab 16 — SecurityContext hardening", href: "#/labs/lab16" },
      { label: "Lab 21 — NetworkPolicy default-deny + allow", href: "#/labs/lab21" },
      { label: "CKA Cheat Sheet — static pods & etcd (ôn nền)", href: "#/docs/cka-cheat-sheet" },
    ],
    items: [
      {
        id: "cks-w8-1",
        text: "Chuỗi hardening pod: root+privileged+hostPath → nonroot, RO filesystem, drop caps, seccomp, AppArmor",
        lesson: `Bài tổng hợp kinh điển: nhận một căn nhà **cửa mở toang** — pod chạy root, \`privileged: true\`, mount \`hostPath\` — và cải tạo thành **két sắt nhiều lớp**. Nguyên tắc thi công: **mỗi bước một thay đổi, verify xong mới sang bước kế** — đổi hết một lượt mà pod crash thì không biết hỏng tại lớp nào.

Trình tự cải tạo: (1) bỏ root — \`runAsNonRoot\` + \`runAsUser\`; (2) bỏ \`privileged\`, thay \`hostPath\` bằng \`emptyDir\`/PVC; (3) khóa filesystem — \`readOnlyRootFilesystem\` + \`drop: ["ALL"]\` + \`allowPrivilegeEscalation: false\`; (4) lọc syscall — seccomp \`RuntimeDefault\`; (5) AppArmor profile; (6) cắt luôn API access — \`automountServiceAccountToken: false\`.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: hardened
spec:
  automountServiceAccountToken: false   # b6: không cần gọi API → bỏ token
  securityContext:
    runAsNonRoot: true                  # b1: bỏ root
    runAsUser: 1000
    seccompProfile:
      type: RuntimeDefault              # b4: lọc syscall mặc định
    appArmorProfile:                    # b5: MAC profile (field chính thức từ K8s 1.30)
      type: RuntimeDefault
  containers:
  - name: app
    image: nginx:1.25
    securityContext:
      privileged: false                 # b2: bỏ privileged
      allowPrivilegeEscalation: false   # b3: chặn leo thang
      readOnlyRootFilesystem: true      # b3: filesystem bất biến
      capabilities:
        drop: ["ALL"]                   # b3: bỏ mọi capability
    volumeMounts:
    - {name: tmp, mountPath: /tmp}      # RO rootfs → cấp chỗ ghi tạm
  volumes:
  - {name: tmp, emptyDir: {}}           # b2: emptyDir thay hostPath
\`\`\`

Sau mỗi bước: \`kubectl apply\` + \`kubectl get pod\` (Running? READY?) + \`kubectl logs\` nếu crash. Đích đến là pod pass được namespace có PSA \`enforce=restricted\` — test bằng \`kubectl apply --dry-run=server\` trong namespace đó.

⚠️ **Lỗi thường gặp:** \`drop: ["ALL"]\` làm nginx không bind được port 80 (cần \`NET_BIND_SERVICE\`) → hoặc add lại đúng 1 capability đó, hoặc dùng image nghe port cao như \`nginxinc/nginx-unprivileged\` (port 8080). Bẫy thứ hai: bật \`readOnlyRootFilesystem\` mà quên emptyDir cho \`/tmp\`, \`/var/cache/nginx\`, \`/var/run\` → CrashLoop; đọc log để biết chính xác app đòi ghi đâu.`,
      },
      {
        id: "cks-w8-2",
        text: "Tìm và vá pod nguy hiểm: `kubectl get pods -o json | jq` lọc privileged/hostNetwork",
        lesson: `Kịch bản đề thi: "trong cluster có pod cấu hình nguy hiểm — tìm và xử lý". Đây là cuộc **tổng rà soát tòa nhà xem cửa nào đang quên khóa**: không thể đi mở từng file YAML bằng mắt, phải dùng \`jq\` quét một phát ra hết. Bộ lệnh dưới đây đáng học thuộc như bảng cửu chương:

\`\`\`bash
# Pod nào có container privileged? (any() = kiểm tra MỌI container trong pod)
kubectl get pods -A -o json | jq -r '.items[] | select(any(.spec.containers[]; .securityContext.privileged == true)) | .metadata.namespace + "/" + .metadata.name'

# Pod dùng hostNetwork hoặc hostPID?
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.hostNetwork == true or .spec.hostPID == true) | .metadata.name'

# Pod mount hostPath? (dấu ? để không lỗi khi pod thiếu field volumes)
kubectl get pods -A -o json | jq -r '.items[] | select(.spec.volumes[]?.hostPath) | .metadata.namespace + "/" + .metadata.name'

# Vá: pod thuộc Deployment → sửa TEMPLATE, không sửa pod trực tiếp
kubectl get pod <tên-pod> -o jsonpath='{.metadata.ownerReferences[0].kind}'  # ai sở hữu pod?
kubectl edit deploy <tên-deploy>    # gỡ privileged/hostPath trong spec.template
\`\`\`

Sau khi tìm ra thủ phạm, **đọc kỹ yêu cầu đề**: có đề bắt xóa, có đề bắt sửa cho an toàn, có đề chỉ yêu cầu ghi tên pod ra file như \`/root/danger.txt\` — làm sai hành động là mất điểm dù tìm đúng. Sửa xong quét lại lần nữa: danh sách phải trống thì mới chắc chắn "sạch".

⚠️ **Lỗi thường gặp:** sửa trực tiếp pod trong khi nó thuộc Deployment/ReplicaSet — pod bị thay thế ở lần rollout kế tiếp và cấu hình nguy hiểm **quay trở lại**; luôn kiểm tra \`ownerReferences\` rồi sửa ở tầng cao nhất (Deployment/DaemonSet). Bẫy thứ hai: viết filter jq trên \`containers[]\` mà không dùng \`any()\` — pod nhiều container bị in trùng dòng, hoặc query lỗi khi field không tồn tại (thiếu dấu \`?\`).`,
      },
      {
        id: "cks-w8-3",
        text: "NetworkPolicy nâng cao: default deny + DNS + multi-rule",
        lesson: `NetworkPolicy nâng cao là nghệ thuật **khóa mọi cửa mặc định rồi phát thẻ từ đúng những cửa cần đi** — và đừng bao giờ quên "cửa tổng đài" DNS, vì khóa nhầm nó là cả tòa nhà không gọi được cho ai. Cấu trúc chuẩn của một bài đầy đủ: một policy default-deny cả hai chiều cho namespace, rồi các policy mở chọn lọc cho từng app.

Ngữ nghĩa phải nắm chắc: trong **cùng một rule**, \`from\`/\`to\` + \`ports\` là **AND** (đúng nguồn VÀ đúng port); các rule trong danh sách là **OR**. Tinh vi hơn: \`podSelector\` + \`namespaceSelector\` viết trong **cùng một item** là AND (pod đó *trong* namespace đó), tách thành **hai item** (thêm dấu \`-\`) là OR — một dấu gạch đổi hẳn nghĩa policy.

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: prod
spec:
  podSelector:
    matchLabels: {app: backend}
  policyTypes: ["Ingress", "Egress"]
  ingress:
  - from:                              # CHỈ frontend được gọi vào port 8080
    - podSelector:
        matchLabels: {app: frontend}
    ports:
    - {protocol: TCP, port: 8080}
  egress:
  - ports:                             # rule 1: mở DNS — không có "to" = đi mọi đích
    - {protocol: UDP, port: 53}
    - {protocol: TCP, port: 53}
  - to:                                # rule 2: chỉ được gọi database port 5432
    - podSelector:
        matchLabels: {app: db}
    ports:
    - {protocol: TCP, port: 5432}
\`\`\`

Verify bằng pod tạm: \`kubectl run tmp --rm -it --image=busybox -- sh\` rồi \`nslookup\` (DNS thông chưa?) và \`nc -z -w 2 <svc> <port>\` (đúng cửa mở, sai cửa đóng?).

⚠️ **Lỗi thường gặp:** default-deny egress mà quên mở **port 53 cả UDP lẫn TCP** — mọi kết nối theo tên service fail hết trong khi gọi bằng IP vẫn chạy, debug rất lú nếu không biết trước. Bẫy thứ hai: thừa/thiếu dấu \`-\` trước \`namespaceSelector\` biến AND thành OR — policy bỗng mở rộng cho *mọi pod* của namespace kia, lỗi thẩm định kinh điển.`,
      },
      {
        id: "cks-w8-4",
        text: "Ôn file paths & flags apiserver liên quan security",
        lesson: `Trước trận chung kết, người thợ khóa phải thuộc **sơ đồ tòa nhà**: cửa nào nằm đâu (file paths) và chìa nào mở cửa nào (flags). Trong phòng thi, mỗi giây lục lọi tìm đường dẫn là một giây mất điểm. Bản đồ tối thiểu phải nằm trong đầu:

- \`/etc/kubernetes/manifests/\` — static pods (apiserver, etcd...); sửa file là component tự restart.
- \`/var/lib/kubelet/config.yaml\` — kubelet: \`anonymous.enabled: false\`, \`authorization.mode: Webhook\`; sửa xong \`systemctl restart kubelet\`.
- \`/var/lib/kubelet/seccomp/\` — seccomp profiles (\`localhostProfile\` tính tương đối từ đây).
- \`/etc/apparmor.d/\` — AppArmor profiles, load bằng \`apparmor_parser\` trên đúng node.
- \`/etc/falco/\` — \`falco_rules.local.yaml\` là nơi sửa rule.
- \`/etc/kubernetes/pki/\` — cert của cluster; \`/etc/kubernetes/audit/\` + \`/etc/kubernetes/etcd/enc.yaml\` — vị trí quen thuộc cho audit policy và EncryptionConfiguration.

Flags apiserver phải đọc-hiểu-viết được: \`--enable-admission-plugins\`, \`--encryption-provider-config\`, \`--audit-policy-file\` / \`--audit-log-path\` (+maxage/maxbackup/maxsize), \`--anonymous-auth=false\`, \`--authorization-mode=Node,RBAC\`, \`--admission-control-config-file\`, \`--profiling=false\`.

\`\`\`bash
# Phản xạ bắt buộc TRƯỚC khi đụng control plane (backup ra NGOÀI thư mục manifests):
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml

# Tự kiểm tra: đọc được hết các flag security hiện tại không?
grep -E "encryption-provider|audit-policy|audit-log|admission-plugins|anonymous-auth|authorization-mode" /etc/kubernetes/manifests/kube-apiserver.yaml

# Sau khi sửa — chờ apiserver lên lại:
watch crictl ps
# Không lên → đọc log tìm nguyên nhân:
crictl ps -a | grep api
crictl logs <container-id>
ls /var/log/pods/ | grep apiserver
\`\`\`

⚠️ **Lỗi thường gặp:** thêm flag trỏ tới file mới (audit policy, encryption config) mà **quên mount hostPath volume** → apiserver chết với "no such file or directory" — cặp flag+volume luôn đi đôi. Bẫy thứ hai: sửa nhiều flag một lượt rồi apiserver không lên, không biết flag nào gây lỗi — sửa **từng flag một**, verify từng bước, có backup thì khôi phục trong 30 giây.`,
      },
    ],
  },
  {
    id: "cks-w9",
    week: "Tuần 9–10",
    title: "Luyện đề",
    goal: "Chỉ tiêu tốc độ: audit policy < 8 phút, Falco rule < 6 phút, encryption at rest < 8 phút, kube-bench fix < 5 phút/finding.",
    practice: "killer.sh CKS 2 lượt — bắt buộc trước khi thi thật (khó hơn đề thật, đừng nản nếu điểm thấp).",
    resources: [
      { label: "killer.sh — CKS simulator", href: "https://killer.sh" },
      { label: "Killercoda — Killer Shell CKS scenarios", href: "https://killercoda.com/killer-shell-cks" },
      { label: "Mock Exam trong app", href: "#/exam" },
      { label: "Quiz ôn tập", href: "#/quiz" },
      { label: "Bảng lệnh nhanh", href: "#/commands" },
      { label: "CKS Cheat Sheet — ôn lượt cuối", href: "#/docs/cks-cheat-sheet" },
    ],
    items: [
      {
        id: "cks-w9-1",
        text: "Killercoda CKS scenarios — làm hết",
        lesson: `Killercoda là **phòng gym miễn phí** với môi trường cluster thật có sẵn Falco, gVisor, Trivy. Mục tiêu tuần này: **làm hết** bộ scenario CKS, ưu tiên các nhóm trọng điểm: Falco (sửa rule, tìm rule đã trigger), audit logging, gVisor/RuntimeClass, ImagePolicyWebhook, apiserver misconfig/crash, NetworkPolicy, Trivy, encryption at rest.

Cách luyện đúng: mỗi scenario làm **2 lần** — lần 1 hiểu bản chất (được phép xem gợi ý), lần 2 bấm giờ làm sạch không nhìn gì. Lỗi nào vấp thì ghi vào sổ tay kèm nguyên nhân cụ thể.

\`\`\`bash
# Nghi thức 30 giây đầu MỌI scenario — luyện thành phản xạ:
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
printf 'set tabstop=2 expandtab shiftwidth=2\n' > ~/.vimrc

# Trước khi đụng control plane trong bất kỳ scenario nào:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/bak.yaml
\`\`\`

⚠️ **Lỗi thường gặp:** làm scenario theo kiểu "xem lời giải rồi gõ theo" — cảm giác hiểu nhưng vào thi tay cứng đờ; lần 2 bấm giờ tự làm mới là lần tính. Đừng bỏ qua scenario khó (ImagePolicyWebhook) chỉ vì ngại — đề thật không cho bạn chọn.`,
      },
      {
        id: "cks-w9-2",
        text: "Mock exam bấm giờ + chỉ tiêu tốc độ từng dạng bài",
        lesson: `Đậu CKS là bài toán **tốc độ**: ~15–20 câu trong 120 phút, trung bình 6–8 phút/câu. Luyện mock phải kèm **chỉ tiêu cho từng dạng bài**: audit policy **< 8 phút**, Falco rule **< 6 phút**, encryption at rest **< 8 phút**, kube-bench fix **< 5 phút/finding**; còn NetworkPolicy, RBAC, SecurityContext, Trivy scan là nhóm "điểm cho không" — phải xong **dưới 5 phút** mỗi câu.

Chiến thuật thi: câu nào vượt chỉ tiêu quá ~2 phút → **flag lại, đi tiếp**, quay lại sau khi vét hết câu chắc điểm. Câu dài kiểu ImagePolicyWebhook để cuối.

\`\`\`bash
# Bấm giờ thủ công từng dạng bài khi luyện:
date +%T                    # ghi giờ bắt đầu
# ... làm bài ...
date +%T                    # giờ kết thúc → tự chấm so với chỉ tiêu
# Chỉ tiêu: audit <8' | Falco <6' | encryption <8' | kube-bench <5'/finding
# Vượt chỉ tiêu ~2 phút → flag câu đó, làm câu chắc điểm trước
\`\`\`

⚠️ **Lỗi thường gặp:** luyện mock nhưng **không đo giờ từng câu** — chỉ biết tổng điểm mà không biết dạng nào đang ngốn thời gian để luyện bù; và sa lầy 15 phút vào một câu 4% điểm thay vì flag — bỏ câu đúng lúc là kỹ năng, không phải thất bại.`,
      },
      {
        id: "cks-w9-3",
        text: "killer.sh CKS — 2 lượt",
        lesson: `Mua voucher CKS được tặng **2 session killer.sh** — simulator giao diện giống hệt phòng thi PSI, và **khó hơn đề thật rõ rệt**: điểm thấp lượt đầu là *bình thường*, đừng nản. Mỗi session mở **36 giờ**, môi trường reset thoải mái trong thời gian đó.

Cách dùng chuẩn: **lượt 1** (khoảng 1 tuần trước thi) — làm nghiêm túc đúng 2 tiếng như thi thật, sau đó dành 34 giờ còn lại đọc **solution từng câu** (phần giá trị nhất của killer.sh) và gõ lại bằng tay mọi câu sai. **Lượt 2** (2–3 ngày trước thi) — đề giống lượt 1, mục tiêu là tốc độ: xong sớm, điểm vọt hẳn lên, vào thi với tâm lý thắng.

\`\`\`bash
# 3 phản xạ phải tự động trước khi vào killer.sh:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/bak.yaml  # backup control plane
watch crictl ps                                                  # chờ apiserver hồi sinh
k config get-contexts                                            # LUÔN đổi đúng context
k config use-context <context-đề-cho>
\`\`\`

⚠️ **Lỗi thường gặp:** thấy điểm lượt 1 thấp (30–50% là phổ biến) rồi hoảng loạn dời lịch thi — killer.sh cố tình khó hơn đề thật; thước đo đúng là *lượt 2 tiến bộ bao nhiêu*. Và đừng đọc solution trước khi tự làm — mất trắng giá trị của session.`,
      },
      {
        id: "cks-w9-4",
        text: "Luyện tra nhanh docs: PSS, Encrypt at Rest, Audit, AppArmor, seccomp, Falco",
        lesson: `Trong phòng thi bạn được mở docs — nhưng chỉ hữu ích nếu **tìm ra đúng trang dưới 30 giây**. Tuần cuối hãy luyện như luyện bản đồ: với mỗi chủ đề, tự bấm giờ từ lúc gõ search đến lúc copy được YAML mẫu. Nguyên tắc vàng: **copy mẫu từ docs rồi sửa, không bao giờ gõ tay từ đầu** — audit policy hay EncryptionConfiguration gõ tay rất dễ sai indent/field.

\`\`\`bash
# Từ khóa search trên kubernetes.io — luyện ra đúng trang < 30 giây:
#   "pod security standards"   → bảng baseline/restricted từng field
#   "encrypt data at rest"     → mẫu EncryptionConfiguration + flag apiserver
#   "auditing"                 → mẫu audit Policy 4 level + flags --audit-*
#   "apparmor"                 → field appArmorProfile + apparmor_parser
#   "seccomp"                  → mẫu profile JSON + đường dẫn Localhost
#   "runtimeclass"             → mẫu RuntimeClass handler runsc
# Ngoài kubernetes.io: falco.org/docs → mục "Supported Fields" (%evt.*, %user.*)
# và aquasecurity.github.io/trivy → cú pháp flag khi quên
\`\`\`

⚠️ **Lỗi thường gặp:** vào thi mới lần đầu mò cấu trúc docs → lạc trong menu; phải thuộc *trang nào chứa mẫu YAML nào* từ trước. Bẫy thứ hai: copy YAML từ docs vào vim mà quên \`:set paste\` — auto-indent phá nát cấu trúc, mất thêm vài phút dọn dẹp.`,
      },
    ],
  },
];
