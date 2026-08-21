// Roadmap Part 2 — Tuần 4 & 5: Configuration + Observability
// Dữ liệu lộ trình CKAD (tiếng Việt). KHÔNG đổi id/text — progress của người dùng lưu theo id.

export const weeksPart2 = [
  {
    id: "w4",
    week: "Tuần 4",
    title: "Configuration — ConfigMaps, Secrets, Resources",
    goal: "Chinh phục domain có tỷ trọng cao nhất (25%).",
    practice:
      "Tạo app đọc config từ ConfigMap + Secret; giới hạn quyền bằng SecurityContext; tạo Role chỉ cho get/list pods.",
    resources: [
      { label: "Lab 14 — ConfigMap envFrom + volume", href: "#/labs/lab14" },
      { label: "Lab 15 — Secret create/mount/decode", href: "#/labs/lab15" },
      { label: "Lab 16 — SecurityContext", href: "#/labs/lab16" },
      { label: "Lab 17 — SA + Role + RoleBinding + can-i", href: "#/labs/lab17" },
      { label: "Lab 18 — ResourceQuota / LimitRange", href: "#/labs/lab18" },
      {
        label: "K8s Docs — Configuration",
        href: "https://kubernetes.io/docs/concepts/configuration/",
      },
    ],
    items: [
      {
        id: "w4-1",
        text: "ConfigMaps: tạo từ literal/file/env-file; inject qua env, envFrom, volume",
        lesson: `Hãy tưởng tượng ConfigMap như một **tờ ghi chú cài đặt** dán bên ngoài chiếc máy: cấu hình (URL database, log level, feature flag...) được tách khỏi image, nên cùng một image chạy được ở dev lẫn prod chỉ bằng cách thay tờ ghi chú — không cần build lại. ConfigMap lưu dữ liệu **không nhạy cảm** dưới dạng cặp key-value.

**3 cách tạo** (imperative, rất nhanh trong phòng thi):

- \`--from-literal=KEY=value\` — gõ trực tiếp từng cặp.
- \`--from-file=config.txt\` — key là **tên file**, value là toàn bộ nội dung file.
- \`--from-env-file=app.env\` — mỗi dòng \`KEY=value\` trong file thành một entry riêng.

**3 cách inject vào Pod:**

- \`env\` + \`valueFrom.configMapKeyRef\` — lấy **từng key** làm biến môi trường (đổi được tên biến).
- \`envFrom\` + \`configMapRef\` — đổ **toàn bộ** ConfigMap thành biến môi trường (ít gõ nhất).
- **Volume mount** — khai báo \`volumes\` với \`configMap.name\`, mount vào \`mountPath\`; mỗi key trở thành một **file** trong thư mục đó.

\`\`\`bash
# Tạo ConfigMap từ literal
k create cm appcfg --from-literal=APP_MODE=dev --from-literal=LOG_LEVEL=debug

# Xem nội dung
k get cm appcfg -o yaml

# Generate Pod YAML rồi thêm envFrom bằng vim
k run web --image=nginx $do > pod.yaml
# Trong pod.yaml, thêm dưới container:
#   envFrom:
#   - configMapRef:
#       name: appcfg
k apply -f pod.yaml
k exec web -- env | grep -E 'APP_MODE|LOG_LEVEL'   # verify
\`\`\`

Ghi nhớ vị trí field: \`env\`/\`envFrom\`/\`volumeMounts\` nằm ở **container-level**, còn \`volumes\` nằm ở **Pod-level** (\`spec.volumes\`).

⚠️ **Lỗi thường gặp:** (1) Biến môi trường **không tự cập nhật** khi ConfigMap thay đổi — phải tạo lại Pod; chỉ volume mount mới được đồng bộ (sau vài chục giây). (2) Tham chiếu ConfigMap chưa tồn tại → Pod kẹt ở \`CreateContainerConfigError\` — kiểm tra bằng \`k describe pod\`. Đừng nhầm \`envFrom\` (cả ConfigMap) với \`env\` (từng key).`,
      },
      {
        id: "w4-2",
        text: "Secrets: types (Opaque, docker-registry, tls); base64; inject qua env & volume",
        lesson: `Secret giống một **phong bì niêm phong**: nội dung nhạy cảm (mật khẩu, token, chứng chỉ) được cất riêng, không in thẳng lên YAML của app. Nhưng lưu ý ngay từ đầu: phong bì này chỉ **dán hờ** — dữ liệu được encode **base64**, ai có quyền đọc Secret đều decode được trong một giây.

**3 type hay gặp trong đề:**

- **Opaque** (\`generic\`) — key-value tùy ý, dùng nhiều nhất.
- **docker-registry** — chứa thông tin đăng nhập registry riêng, gắn vào Pod qua \`imagePullSecrets\`.
- **tls** — cặp \`tls.crt\` + \`tls.key\`, thường dùng cho Ingress TLS.

**Inject vào Pod** giống hệt ConfigMap, chỉ đổi tên field: \`secretKeyRef\` (từng key), \`envFrom\` + \`secretRef\` (toàn bộ), hoặc volume với \`secret.secretName\` (mỗi key thành một file, nên thêm \`readOnly: true\`).

\`\`\`bash
# Tạo Secret Opaque
k create secret generic dbsecret --from-literal=password=S3cret!

# Secret cho private registry
k create secret docker-registry regcred \\
  --docker-server=myregistry.io --docker-username=user \\
  --docker-password=pass --docker-email=a@b.c

# Secret TLS
k create secret tls mytls --cert=tls.crt --key=tls.key

# Decode khi cần đọc lại giá trị (HAY RA THI)
k get secret dbsecret -o jsonpath='{.data.password}' | base64 -d

# Encode/decode thủ công
echo -n 'S3cret!' | base64      # -n để không dính ký tự xuống dòng
\`\`\`

Khi viết YAML tay, bạn có thể dùng \`stringData\` để ghi giá trị **plain text** — Kubernetes tự encode giúp, đỡ sai sót hơn tự base64 rồi dán vào \`data\`.

⚠️ **Lỗi thường gặp:** (1) **Base64 không phải mã hóa** — đừng trả lời "Secret đã được encrypt"; nó chỉ là encoding. (2) Quên \`-n\` khi \`echo\` để encode → giá trị bị thừa ký tự newline, app đăng nhập fail rất khó truy vết. (3) Dùng \`configMapKeyRef\` thay vì \`secretKeyRef\` (hoặc ngược lại) — Pod sẽ báo \`CreateContainerConfigError\`.`,
      },
      {
        id: "w4-3",
        text: "Resource requests & limits (CPU, memory); QoS classes",
        lesson: `Hãy nghĩ **requests** là tiền **đặt cọc** và **limits** là **trần chi tiêu**. Requests là lượng CPU/memory bạn "đặt chỗ trước" — scheduler chỉ xếp Pod lên node còn đủ chỗ trống theo con số này. Limits là mức tối đa container được phép dùng — chạm trần thì bị xử lý.

**Đơn vị cần thuộc lòng:**

- CPU: \`100m\` = 100 millicores = 0.1 CPU. CPU là tài nguyên **nén được** — vượt limit chỉ bị **throttle** (chạy chậm lại), không bị giết.
- Memory: \`128Mi\`, \`1Gi\`. Memory **không nén được** — vượt limit → container bị **OOMKilled** (exit code 137) và restart.

Cả hai khai báo ở **container-level**: \`spec.containers[].resources.requests/limits\`.

**QoS classes** — Kubernetes tự gán dựa trên cách bạn set, quyết định thứ tự bị **evict** khi node thiếu memory:

- **Guaranteed**: mọi container đều có requests = limits (cả CPU lẫn memory) — an toàn nhất.
- **Burstable**: có set requests nhưng thấp hơn limits (hoặc chỉ set một phần).
- **BestEffort**: không set gì — bị hy sinh **đầu tiên**.

Mẹo: nếu chỉ set limits mà bỏ trống requests, Kubernetes tự gán requests = limits → Pod thành Guaranteed.

\`\`\`bash
# Generate Pod rồi thêm resources
k run app --image=nginx $do > pod.yaml
# Thêm vào container trong pod.yaml:
#   resources:
#     requests:
#       cpu: 100m
#       memory: 128Mi
#     limits:
#       cpu: 500m
#       memory: 256Mi
k apply -f pod.yaml
k get pod app -o jsonpath='{.status.qosClass}'   # xem QoS class
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Nhầm hành vi hai loại tài nguyên: vượt **CPU** limit chỉ bị throttle, vượt **memory** limit mới bị OOMKilled. (2) Requests đặt quá cao → Pod \`Pending\` mãi vì không node nào đủ chỗ — đọc Events bằng \`k describe pod\`. (3) Viết nhầm đơn vị \`256m\` cho memory (m là milli, gần như bằng 0) thay vì \`256Mi\`.`,
      },
      {
        id: "w4-4",
        text: "LimitRange & ResourceQuota theo namespace",
        lesson: `Nếu namespace là một **căn phòng tập thể**, thì **ResourceQuota** là **ngân sách chung của cả phòng** (tổng cộng mọi người được tiêu bao nhiêu), còn **LimitRange** là **quy định suất ăn mỗi người** (mỗi container tối thiểu/tối đa bao nhiêu, và nếu không đăng ký thì phát suất mặc định).

**ResourceQuota** — giới hạn **tổng** tài nguyên trong một namespace: tổng \`requests.cpu\`, \`requests.memory\`, \`limits.memory\`, số lượng \`pods\`, \`services\`, \`secrets\`... Khi tổng vượt quota, Pod mới bị **từ chối ngay lúc tạo** (lỗi Forbidden), không phải Pending.

**LimitRange** — áp cho **từng container/Pod** trong namespace:

- \`default\`: limit mặc định nếu container không khai báo.
- \`defaultRequest\`: request mặc định.
- \`min\` / \`max\`: chặn dưới và chặn trên — khai báo ngoài khoảng này là bị từ chối.

Hai object này **phối hợp** với nhau: khi namespace có quota về CPU/memory, mọi Pod **bắt buộc** phải khai báo requests/limits tương ứng — LimitRange với default sẽ "điền hộ" cho Pod nào quên, giúp Pod không bị từ chối.

\`\`\`bash
# ResourceQuota — có lệnh imperative, rất nhanh
k create quota myquota -n dev \\
  --hard=pods=10,requests.cpu=4,requests.memory=4Gi,limits.memory=8Gi
k describe quota myquota -n dev    # xem Used / Hard

# LimitRange — phải viết YAML (không có lệnh create riêng)
# spec.limits[].type: Container, kèm default/defaultRequest/min/max
k get limitrange -n dev
k describe limitrange -n dev       # xem default được áp
\`\`\`

Cả hai đều có \`apiVersion: v1\` và chỉ có hiệu lực **trong namespace** chứa chúng.

⚠️ **Lỗi thường gặp:** (1) Namespace có quota CPU/memory nhưng Pod không set requests/limits → bị từ chối với lỗi \`must specify requests...\` — hoặc thêm resources vào Pod, hoặc tạo LimitRange có default. (2) Quota chỉ áp cho tài nguyên **tạo mới** — Pod đang chạy từ trước không bị đụng đến, dễ gây hiểu nhầm khi kiểm tra.`,
      },
      {
        id: "w4-5",
        text: "SecurityContext: runAsUser, fsGroup, capabilities, allowPrivilegeEscalation, readOnlyRootFilesystem (Pod-level vs Container-level)",
        lesson: `SecurityContext giống **nội quy tòa nhà và nội quy từng phòng**: quy định ở Pod-level áp cho **mọi container** bên trong, còn container-level là nội quy riêng của từng phòng — khi hai nơi cùng quy định một điều, **container-level thắng** (override).

**Phân bổ field — điểm bẫy số một trong đề thi:**

- **Chỉ Pod-level** (\`spec.securityContext\`): \`fsGroup\` — group sở hữu các file trong volume, giúp container non-root ghi được vào volume.
- **Chỉ Container-level** (\`spec.containers[].securityContext\`): \`capabilities\` (add/drop), \`allowPrivilegeEscalation\`, \`readOnlyRootFilesystem\`, \`privileged\`.
- **Cả hai level**: \`runAsUser\`, \`runAsGroup\`, \`runAsNonRoot\`.

Câu thần chú: **"fsGroup ở Pod, capabilities ở Container"**.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:            # POD-LEVEL: áp cho mọi container
    runAsUser: 1000
    runAsGroup: 3000
    fsGroup: 2000             # CHỈ có ở pod-level
  containers:
  - name: app
    image: busybox
    command: ["sleep", "3600"]
    securityContext:          # CONTAINER-LEVEL: override pod-level
      runAsUser: 2000
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:           # CHỈ có ở container-level
        drop: ["ALL"]
        add: ["NET_BIND_SERVICE"]
\`\`\`

Ý nghĩa nhanh: \`runAsUser: 1000\` chạy process bằng UID 1000 thay vì root; \`allowPrivilegeEscalation: false\` chặn process con leo thang quyền (setuid, sudo); \`readOnlyRootFilesystem: true\` khóa toàn bộ filesystem gốc thành chỉ-đọc; \`capabilities\` thêm/bớt từng quyền kernel nhỏ (thay vì cấp cả quyền root).

Khi quên field nằm ở đâu, tra ngay: \`k explain pod.spec.securityContext\` và \`k explain pod.spec.containers.securityContext\` — so sánh hai danh sách là thấy khác biệt.

⚠️ **Lỗi thường gặp:** (1) Đặt \`capabilities\` ở Pod-level → apply báo lỗi \`unknown field\` — nó chỉ tồn tại ở container-level. (2) Bật \`readOnlyRootFilesystem: true\` cho app cần ghi file tạm (nginx ghi \`/var/cache\`, \`/var/run\`) → CrashLoopBackOff; phải mount thêm \`emptyDir\` vào các đường dẫn ghi.`,
      },
      {
        id: "w4-6",
        text: "ServiceAccounts & gắn vào Pod",
        lesson: `ServiceAccount (SA) là **thẻ nhân viên** của Pod: khi app bên trong Pod muốn gọi Kubernetes API (liệt kê pods, đọc configmap...), nó xuất trình thẻ này để API server biết "ai đang gọi". Người dùng thật thì có user account; còn **process trong Pod** thì có ServiceAccount.

**Điều cần biết:**

- Mỗi namespace tự động có SA tên \`default\`. Pod không khai báo gì sẽ dùng SA này.
- Gắn SA cho Pod qua field **Pod-level**: \`spec.serviceAccountName: mysa\`.
- Token của SA được **tự động mount** vào container tại \`/var/run/secrets/kubernetes.io/serviceaccount/token\`. Nếu app không cần gọi API, nên tắt bằng \`automountServiceAccountToken: false\` (đặt được ở SA hoặc ở Pod) — giảm bề mặt tấn công.
- Từ K8s 1.24+, SA **không còn** tự sinh Secret token vĩnh viễn; cần token thủ công thì dùng \`k create token mysa\` (token có hạn dùng).
- SA chỉ là **danh tính** — bản thân nó chưa có quyền gì. Muốn có quyền phải gắn Role/RoleBinding (bài RBAC tiếp theo).

\`\`\`bash
# Tạo ServiceAccount
k create sa mysa

# Gắn vào Pod ngay khi generate YAML
k run app --image=nginx $do > pod.yaml
# Thêm vào spec (cùng cấp với containers):
#   serviceAccountName: mysa
k apply -f pod.yaml

# Verify
k get pod app -o jsonpath='{.spec.serviceAccountName}'

# Tạo token thủ công khi cần (K8s 1.24+)
k create token mysa
\`\`\`

Với Deployment, field này nằm trong Pod template: \`spec.template.spec.serviceAccountName\`.

⚠️ **Lỗi thường gặp:** (1) \`serviceAccountName\` là field **immutable** trên Pod đang chạy — muốn đổi phải xóa và tạo lại Pod (với Deployment thì sửa template, nó tự rollout). (2) Tưởng gắn SA xong là Pod gọi được API — thiếu RoleBinding thì mọi request vẫn bị 403 Forbidden; kiểm tra bằng \`k auth can-i --as=system:serviceaccount:<ns>:<sa>\`.`,
      },
      {
        id: "w4-7",
        text: "RBAC cơ bản: Role, RoleBinding, ClusterRole, ClusterRoleBinding; `kubectl auth can-i`",
        lesson: `RBAC (Role-Based Access Control) hoạt động như **phân quyền thẻ từ trong tòa nhà**: **Role** là danh sách cửa được mở (quyền gì, trên tài nguyên nào), còn **RoleBinding** là việc **gắn danh sách đó vào một chiếc thẻ cụ thể** (user, group, hay ServiceAccount). Có danh sách mà chưa gắn thẻ thì chưa ai vào được.

**4 object — chia theo phạm vi:**

- **Role** + **RoleBinding**: hiệu lực **trong 1 namespace**.
- **ClusterRole** + **ClusterRoleBinding**: hiệu lực **toàn cluster**, và bắt buộc dùng cho tài nguyên không thuộc namespace (\`nodes\`, \`persistentvolumes\`, \`namespaces\`).
- Kết hợp hay gặp: **RoleBinding tham chiếu ClusterRole** → tái sử dụng một bộ quyền chung nhưng chỉ cấp trong 1 namespace.

Một rule gồm 3 phần: \`apiGroups\` (\`""\` = core group cho pods/services; \`"apps"\` cho deployments), \`resources\`, \`verbs\` (\`get\`, \`list\`, \`watch\`, \`create\`, \`update\`, \`patch\`, \`delete\`).

\`\`\`bash
# Role chỉ cho get/list pods trong namespace dev
k create role pod-reader --verb=get,list --resource=pods -n dev

# Gắn cho ServiceAccount (định dạng: <namespace>:<sa-name>)
k create rolebinding read-pods \\
  --role=pod-reader --serviceaccount=dev:mysa -n dev

# ClusterRole cho tài nguyên cluster-scoped
k create clusterrole node-reader --verb=get,list --resource=nodes
k create clusterrolebinding read-nodes --clusterrole=node-reader --user=jane

# Kiểm tra quyền — RẤT HAY RA THI
k auth can-i list pods --as=system:serviceaccount:dev:mysa -n dev   # yes
k auth can-i delete pods --as=system:serviceaccount:dev:mysa -n dev # no
k auth can-i --list -n dev    # liệt kê mọi quyền của mình
\`\`\`

Cả 4 object đều dùng \`apiVersion: rbac.authorization.k8s.io/v1\`.

⚠️ **Lỗi thường gặp:** (1) Sai \`apiGroups\`: pods thuộc core group \`""\`, còn deployments thuộc \`"apps"\` — sai group là quyền không có hiệu lực dù verbs đúng. (2) Nhớ định danh SA khi test: \`--as=system:serviceaccount:<namespace>:<tên-sa>\` — thiếu prefix \`system:serviceaccount:\` là kết quả luôn \`no\`. (3) Quyền \`list\` và \`get\` là hai verb khác nhau: \`k get pods\` (danh sách) cần \`list\`, \`k get pod tên-cụ-thể\` cần \`get\`.`,
      },
    ],
  },
  {
    id: "w5",
    week: "Tuần 5",
    title: "Observability — Probes, Logging, Debugging",
    goal: "Debug nhanh — kỹ năng sống còn trong phòng thi.",
    practice:
      "Cố tình tạo Pod lỗi (sai image, thiếu resource, probe fail) rồi tự chẩn đoán và sửa.",
    resources: [
      { label: "Lab 11 — Liveness/Readiness probe", href: "#/labs/lab11" },
      { label: "Lab 12 — Debug CrashLoopBackOff", href: "#/labs/lab12" },
      { label: "Lab 13 — Logs & JSONPath", href: "#/labs/lab13" },
      { label: "Lab 10 — Rollout undo", href: "#/labs/lab10" },
      { label: "Cheat Sheet — Debugging", href: "#/docs/cheat-sheet" },
      {
        label: "K8s Docs — Liveness/Readiness/Startup Probes",
        href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/",
      },
    ],
    items: [
      {
        id: "w5-1",
        text: "Liveness probe: httpGet, exec, tcpSocket",
        lesson: `Liveness probe là **bác sĩ khám sức khỏe định kỳ** cho container: kubelet cứ vài giây lại "khám" một lần, và nếu container fail liên tiếp đủ số lần quy định, kubelet kết luận app đã **treo/deadlock** và **restart container** (theo \`restartPolicy\`). Đây là cơ chế tự chữa lành: app treo nhưng process chưa chết thì Kubernetes không tự biết — liveness probe chính là cách bạn dạy nó cách nhận biết.

**3 kiểu khám** (cả 3 dùng chung cho mọi loại probe):

- **\`httpGet\`** — gọi HTTP vào \`path\` + \`port\`; status code **2xx/3xx = pass**. Dùng nhiều nhất với web app có endpoint \`/healthz\`.
- **\`exec\`** — chạy một lệnh trong container; **exit code 0 = pass**. Hợp với app không có HTTP (vd: kiểm tra file tồn tại).
- **\`tcpSocket\`** — thử mở kết nối TCP tới port; **kết nối được = pass**. Hợp với database, service TCP thuần.

(K8s còn hỗ trợ \`grpc\` cho app có gRPC health service.)

Probe khai báo ở **container-level**, ngang hàng với \`image\`:

\`\`\`yaml
spec:
  containers:
  - name: app
    image: nginx
    livenessProbe:
      httpGet:
        path: /healthz
        port: 80
      initialDelaySeconds: 5   # chờ 5s trước lần khám đầu
      periodSeconds: 10        # khám mỗi 10s
      failureThreshold: 3      # fail 3 lần liên tiếp → restart
    # Hai kiểu còn lại (tham khảo):
    # livenessProbe:
    #   exec:
    #     command: ["cat", "/tmp/healthy"]
    # livenessProbe:
    #   tcpSocket:
    #     port: 3306
\`\`\`

Trong phòng thi, generate Pod bằng \`k run app --image=nginx $do > pod.yaml\` rồi thêm block probe bằng vim; tra field nhanh với \`k explain pod.spec.containers.livenessProbe\`.

⚠️ **Lỗi thường gặp:** (1) Probe trỏ **sai port/path** → container khỏe vẫn bị restart vòng lặp vô tận (CrashLoopBackOff giả); đối chiếu port probe với \`containerPort\` thật của app. (2) Liveness quá "gắt" (initialDelay ngắn, threshold thấp) với app khởi động chậm → bị giết trước khi kịp chạy — trường hợp này cần startup probe (bài sau).`,
      },
      {
        id: "w5-2",
        text: "Readiness & Startup probe — hiểu rõ sự khác biệt",
        lesson: `Ba loại probe trả lời **ba câu hỏi khác nhau**, và hình phạt khi fail cũng khác nhau — đây là điểm hay bị nhầm nhất:

- **Liveness** — "app còn sống không?" Fail → **restart container**.
- **Readiness** — "app sẵn sàng nhận khách chưa?" Fail → Pod bị **loại khỏi danh sách endpoints của Service** (ngừng nhận traffic), nhưng **không restart**. Giống treo biển "tạm đóng cửa nhận khách" — cửa hàng vẫn đó, chỉ tạm không phục vụ. Khi probe pass trở lại, Pod tự động được đưa vào lại endpoints.
- **Startup** — "app khởi động xong chưa?" Là **thời gian ân hạn**: khi startup probe còn chạy, liveness và readiness bị **tạm hoãn**. Startup pass rồi thì hai probe kia mới bắt đầu. Startup fail hết \`failureThreshold\` → restart container.

**Khi nào dùng gì:**

- App cần warm-up, load cache, chờ kết nối database → **readiness** (tránh nhận request khi chưa sẵn sàng).
- App legacy khởi động rất chậm (1-5 phút) → **startup** với \`failureThreshold\` cao, để liveness sau đó được phép "gắt" mà không giết oan app đang khởi động.
- Cả ba viết chung cú pháp (\`httpGet\`/\`exec\`/\`tcpSocket\`), chỉ khác tên field: \`livenessProbe\`, \`readinessProbe\`, \`startupProbe\`.

\`\`\`yaml
spec:
  containers:
  - name: app
    image: myapp:1.0
    startupProbe:
      httpGet: {path: /healthz, port: 8080}
      failureThreshold: 30    # 30 lần x 10s = tối đa 300s để khởi động
      periodSeconds: 10
    readinessProbe:
      httpGet: {path: /ready, port: 8080}
      periodSeconds: 5
    livenessProbe:
      httpGet: {path: /healthz, port: 8080}
      periodSeconds: 10
\`\`\`

Debug: \`k describe pod\` → mục **Conditions** có \`Ready=False\` khi readiness fail, và **Events** ghi rõ probe nào fail.

⚠️ **Lỗi thường gặp:** (1) Dùng liveness cho việc của readiness: app chỉ tạm bận mà bị restart liên tục → mất luôn cả phần đang xử lý. (2) Pod \`Running\` nhưng Service không có traffic — quên rằng readiness fail làm **endpoints rỗng**; kiểm tra \`k get endpoints <svc>\` trước khi đổ lỗi cho Service.`,
      },
      {
        id: "w5-3",
        text: "Probe parameters: initialDelaySeconds, periodSeconds, failureThreshold",
        lesson: `Các tham số probe giống **quy tắc của người gác cổng**: chờ bao lâu mới bắt đầu kiểm tra, bao lâu kiểm tra một lần, và nhân nhượng mấy lần trước khi hành động. Chỉnh sai một con số là app khỏe cũng bị phạt oan.

**5 tham số áp dụng cho mọi loại probe:**

- **\`initialDelaySeconds\`** (mặc định 0) — chờ bao nhiêu giây sau khi container start mới khám lần đầu.
- **\`periodSeconds\`** (mặc định 10) — tần suất khám.
- **\`timeoutSeconds\`** (mặc định 1) — mỗi lần khám chờ phản hồi tối đa bao lâu; quá hạn tính là fail.
- **\`failureThreshold\`** (mặc định **3**) — fail **liên tiếp** bao nhiêu lần mới ra tay (restart với liveness/startup; rút khỏi endpoints với readiness).
- **\`successThreshold\`** (mặc định 1) — pass liên tiếp bao nhiêu lần mới tính là khỏe lại. **Bắt buộc = 1** với liveness và startup; chỉ readiness được phép đặt cao hơn.

**Phép tính cần thuộc:** thời gian tối đa trước khi hành động ≈ \`initialDelaySeconds + periodSeconds × failureThreshold\`. Ví dụ startup probe \`failureThreshold: 30\`, \`periodSeconds: 10\` → app có tối đa **300 giây** để khởi động.

\`\`\`bash
# Tra nhanh tên + ý nghĩa field trong phòng thi (không cần mở docs)
k explain pod.spec.containers.livenessProbe

# Xem probe đang cấu hình của một Pod
k get pod app -o jsonpath='{.spec.containers[0].livenessProbe}'

# Quan sát probe fail trong Events
k describe pod app | grep -A5 Events
# "Liveness probe failed: ..." kèm số lần và lý do
\`\`\`

Chiến thuật chỉnh số: app khởi động chậm → tăng \`initialDelaySeconds\` hoặc thêm startup probe; mạng chập chờn/endpoint chậm → tăng \`timeoutSeconds\` và \`failureThreshold\` thay vì tắt probe.

⚠️ **Lỗi thường gặp:** (1) Tưởng fail 1 lần là restart ngay — mặc định phải fail **3 lần liên tiếp**; ngược lại, đề yêu cầu "restart ngay khi fail" thì phải set \`failureThreshold: 1\`. (2) \`timeoutSeconds\` mặc định chỉ **1 giây** — endpoint health trả lời chậm hơn 1s sẽ fail dù app vẫn khỏe; đây là thủ phạm thầm lặng của nhiều vụ restart khó hiểu.`,
      },
      {
        id: "w5-4",
        text: "Logging: `kubectl logs` (multi-container, `--previous`, `-f`)",
        lesson: `\`kubectl logs\` là **cửa sổ nhìn vào bên trong container**: nó đọc mọi thứ app in ra **stdout/stderr** — triết lý logging của Kubernetes là app cứ in ra màn hình, phần thu gom để hệ thống lo. App ghi log vào file riêng thì \`k logs\` **không thấy** (đó là lý do tồn tại của sidecar đọc log).

**Các biến thể phải thuộc lòng:**

- \`k logs <pod>\` — log container duy nhất trong Pod.
- \`k logs <pod> -c <container>\` — Pod có **nhiều container** (kể cả init container) thì **bắt buộc** chỉ định \`-c\`.
- \`k logs <pod> --all-containers\` — gộp log mọi container.
- \`k logs <pod> --previous\` (viết tắt \`-p\`) — log của container **đã crash lần trước**. Đây là lệnh **sống còn** khi debug CrashLoopBackOff: container hiện tại vừa restart nên log trống, còn nguyên nhân chết nằm ở log của "kiếp trước".
- \`k logs <pod> -f\` — theo dõi realtime (như \`tail -f\`).
- \`k logs deploy/web\` — trỏ thẳng Deployment, kubectl tự chọn một Pod.
- Lọc bớt: \`--tail=20\` (20 dòng cuối), \`--since=5m\` (5 phút gần nhất), \`-l app=web\` (mọi Pod khớp label).

\`\`\`bash
# Pod đang CrashLoopBackOff? Xem log lần chạy trước
k logs myapp --previous

# Multi-container: xem log sidecar
k logs myapp -c log-reader

# Theo dõi realtime, chỉ lấy 50 dòng gần nhất
k logs myapp -f --tail=50

# Log của mọi pod thuộc một Deployment (theo label)
k logs -l app=web --all-containers --since=10m
\`\`\`

Ghi chú thi: câu hỏi dạng "trích log của pod X ghi vào file Y" xuất hiện thường xuyên — chỉ cần \`k logs X > /path/Y\`, nhớ đúng namespace.

⚠️ **Lỗi thường gặp:** (1) Pod multi-container mà quên \`-c\` → lỗi \`a container name must be specified\`; đọc thông báo, nó liệt kê sẵn tên các container cho bạn chọn. (2) Debug container đang crash mà quên \`--previous\` → nhìn log rỗng của container mới restart rồi kết luận sai "app không in gì".`,
      },
      {
        id: "w5-5",
        text: "Debug workflow: `describe` → `events` → `logs` → `exec`",
        lesson: `Debug Pod cũng như **khám bệnh theo quy trình**: nhìn tổng quát trước, hỏi tiền sử, xét nghiệm, cuối cùng mới "mổ". Làm đúng thứ tự giúp bạn định vị lỗi trong 1-2 phút thay vì mò mẫm — trong phòng thi, đây là kỹ năng ăn điểm trực tiếp.

**Quy trình 5 bước:**

- **Bước 1 — \`k get pod\`**: nhìn cột STATUS (\`Pending\`, \`CrashLoopBackOff\`, \`ImagePullBackOff\`...) và cột RESTARTS. Trạng thái đã gợi ý hướng đi.
- **Bước 2 — \`k describe pod <name>\`**: kéo xuống **mục Events ở cuối** — 80% nguyên nhân nằm ở đây (kéo image fail, không đủ resource, probe fail, mount lỗi). Xem thêm \`Last State\` và \`Exit Code\` của container.
- **Bước 3 — events toàn namespace**: khi describe chưa đủ, xem dòng thời gian đầy đủ với \`k get events\` (sắp xếp theo thời gian).
- **Bước 4 — \`k logs\`**: lỗi từ **bên trong app** (exception, config sai, không kết nối được DB). Container đang crash → thêm \`--previous\`.
- **Bước 5 — \`k exec\`**: vào hẳn bên trong kiểm tra tận tay — biến môi trường, file config đã mount, gọi thử service khác.

\`\`\`bash
k get pod                                  # 1. trạng thái tổng quan
k describe pod myapp                       # 2. Events + Last State
k get events --sort-by=.metadata.creationTimestamp   # 3. dòng thời gian
k logs myapp --previous                    # 4. log lần crash trước
k exec -it myapp -- sh                     # 5. vào trong kiểm tra
# trong shell: env | grep DB_ ; cat /etc/config/... ; wget -qO- http://backend-svc
\`\`\`

Phân loại nhanh: lỗi ở bước 2 (Events) thường là **lỗi hạ tầng/cấu hình Pod** (image, resource, volume, probe); lỗi ở bước 4 (logs) là **lỗi bên trong app**. Container crash quá nhanh không exec được → toàn bộ manh mối nằm ở \`describe\` + \`logs --previous\`.

⚠️ **Lỗi thường gặp:** (1) Nhảy thẳng vào \`logs\` khi Pod \`Pending\` — Pod chưa được schedule thì **chưa có log nào cả**; nguyên nhân Pending luôn nằm trong Events của \`describe\`. (2) Sửa mò rồi apply lại nhiều lần thay vì đọc kỹ Events một lần — tốn thời gian gấp nhiều lần trong phòng thi.`,
      },
      {
        id: "w5-6",
        text: "Metrics: `kubectl top pod/node`",
        lesson: `\`kubectl top\` là **đồng hồ đo điện nước** của cluster: cho biết Pod và node đang **thực dùng** bao nhiêu CPU/memory ngay lúc này. Lưu ý phân biệt: \`requests/limits\` là con số bạn **đăng ký** trong YAML, còn \`k top\` đo mức **tiêu thụ thực tế** — hai thứ hoàn toàn khác nhau.

**Điều kiện tiên quyết:** cluster phải cài **metrics-server**. Chưa có thì lệnh báo \`error: Metrics API not available\` — trong môi trường thi, metrics-server đã được cài sẵn; ở lab cá nhân với minikube thì bật bằng \`minikube addons enable metrics-server\`.

**Các lệnh chính:**

- \`k top node\` — CPU (cores), memory, và **tỷ lệ %** so với tổng tài nguyên node.
- \`k top pod\` — mức dùng của từng Pod trong namespace hiện tại; thêm \`-A\` cho mọi namespace.
- \`k top pod --containers\` — tách chi tiết từng container trong Pod.
- \`k top pod --sort-by=cpu\` hoặc \`--sort-by=memory\` — tìm Pod "ngốn" nhất, dạng câu hỏi kinh điển: *"tìm pod tiêu thụ CPU cao nhất và ghi tên vào file"*.

\`\`\`bash
# Node nào đang quá tải?
k top node

# Pod ngốn memory nhất trong namespace dev
k top pod -n dev --sort-by=memory

# Ghi tên pod đứng đầu vào file trả lời (dạng đề hay gặp)
k top pod -n dev --sort-by=cpu --no-headers | head -1 > /tmp/answer.txt

# Chi tiết từng container
k top pod myapp --containers
\`\`\`

Ứng dụng khi debug: Pod bị **OOMKilled** lặp lại → \`k top pod\` xem mức dùng thật, đối chiếu với \`limits.memory\` để quyết định nâng limit hay sửa app. Node có tỷ lệ % cao bất thường → giải thích vì sao Pod mới cứ \`Pending\`.

⚠️ **Lỗi thường gặp:** (1) Đọc kết quả \`k top\` như thể đó là requests/limits — thực tế nó là usage tức thời, có Pod usage vượt request là chuyện bình thường (Burstable). (2) Pod vừa tạo chưa hiện trong \`k top\` — metrics-server thu thập theo chu kỳ, cần chờ khoảng 15-60 giây, đừng vội kết luận lệnh hỏng.`,
      },
      {
        id: "w5-7",
        text: "Lỗi phổ biến: ImagePullBackOff, CrashLoopBackOff, Pending, OOMKilled",
        lesson: `Bốn "căn bệnh" này chiếm phần lớn câu hỏi debug trong đề thi. Học thuộc **triệu chứng → nguyên nhân → lệnh chẩn đoán** của từng loại là bạn xử lý được đa số tình huống dưới 3 phút.

- **\`ImagePullBackOff\` / \`ErrImagePull\`** — không kéo được image. Nguyên nhân: **sai tên/tag image** (gõ nhầm \`ngnix\`), tag không tồn tại, hoặc registry riêng **thiếu \`imagePullSecrets\`**. Chẩn đoán: \`k describe pod\` → Events ghi rõ lý do pull fail. Sửa nhanh: \`k set image pod/myapp myapp=nginx:1.25\` hoặc sửa YAML.

- **\`CrashLoopBackOff\`** — container **chạy lên rồi chết**, Kubernetes restart theo backoff tăng dần. Nguyên nhân: app crash (thiếu config, sai command/args, exception lúc boot) hoặc liveness probe giết nhầm. Chẩn đoán: \`k logs --previous\` (log kiếp trước) + \`describe\` xem Exit Code.

- **\`Pending\`** — Pod **chưa được xếp lên node nào**. Nguyên nhân: không node nào đủ CPU/memory theo \`requests\`, node bị taint mà Pod thiếu toleration, \`nodeSelector\` không khớp, hoặc PVC đang Pending. Chẩn đoán: \`k describe pod\` → Events có dòng \`FailedScheduling\` kèm lý do đếm từng node.

- **\`OOMKilled\`** — container dùng **vượt memory limit** và bị kernel giết (exit code **137**). Trạng thái hiện \`CrashLoopBackOff\` nhưng bằng chứng nằm ở \`Last State: Terminated, Reason: OOMKilled\`. Sửa: tăng \`limits.memory\` hoặc tối ưu app.

\`\`\`bash
k get pod                          # nhận diện triệu chứng
k describe pod myapp | grep -A10 Events        # ImagePull / Pending
k describe pod myapp | grep -A5 'Last State'   # OOMKilled, Exit Code 137
k logs myapp --previous            # CrashLoopBackOff — vì sao chết
\`\`\`

Thêm một mã cần nhớ: \`CreateContainerConfigError\` = ConfigMap/Secret được tham chiếu **không tồn tại**.

⚠️ **Lỗi thường gặp:** (1) Thấy \`CrashLoopBackOff\` liền đổ cho image — image kéo về **thành công** rồi, vấn đề là app chết khi chạy; hai bệnh khác nhau, thuốc khác nhau. (2) Tìm chữ "OOMKilled" ở cột STATUS — nó không nằm đó; phải \`describe\` và nhìn **Last State** mới thấy.`,
      },
      {
        id: "w5-8",
        text: "API deprecations: `kubectl api-resources`, `kubectl explain`",
        lesson: `Kubernetes API cũng có **vòng đời như phiên bản ứng dụng**: một resource ra đời ở \`v1alpha1\`, trưởng thành qua \`v1beta1\`, ổn định ở \`v1\` — và các phiên bản cũ dần bị **deprecated rồi gỡ bỏ**. YAML viết cho phiên bản đã gỡ sẽ bị từ chối thẳng: \`no matches for kind "Deployment" in version "extensions/v1beta1"\`. Dạng đề kinh điển: đưa bạn một file YAML cũ, yêu cầu sửa cho chạy được trên cluster hiện tại.

**Bộ công cụ tra cứu tại chỗ (không cần mở docs):**

- \`k api-resources\` — liệt kê **mọi resource** cluster hỗ trợ, kèm tên viết tắt, apiVersion hiện hành, và có thuộc namespace hay không.
- \`k api-versions\` — mọi API version đang bật trên cluster.
- \`k explain <resource>\` — dòng đầu output in ra **VERSION chuẩn** của resource; thêm \`--recursive\` để xem toàn bộ cây field.

**Bảng apiVersion phải thuộc lòng:** Pod/Service/ConfigMap/Secret/PV/PVC → \`v1\`; Deployment/ReplicaSet/DaemonSet/StatefulSet → \`apps/v1\`; Job/CronJob → \`batch/v1\`; Ingress/NetworkPolicy → \`networking.k8s.io/v1\`; Role/RoleBinding → \`rbac.authorization.k8s.io/v1\`; HPA → \`autoscaling/v2\`.

\`\`\`bash
# Resource này giờ dùng apiVersion nào?
k explain deployment | head -3     # KIND + VERSION: apps/v1
k api-resources | grep -i ingress  # networking.k8s.io/v1

# Quy trình sửa YAML cũ:
# 1. Đổi apiVersion (vd: extensions/v1beta1 -> apps/v1)
# 2. Kiểm tra field bắt buộc mới: k explain deploy.spec | grep -A2 selector
# 3. Thử apply khô để bắt lỗi còn sót
k apply -f old-deploy.yaml --dry-run=server
\`\`\`

Mẹo: \`--dry-run=server\` gửi YAML lên API server **validate thật** mà không tạo gì — bắt được lỗi apiVersion lẫn field sai, an toàn hơn \`--dry-run=client\`.

⚠️ **Lỗi thường gặp:** (1) Chỉ đổi mỗi dòng \`apiVersion\` mà quên field bắt buộc kèm theo — Deployment \`apps/v1\` **bắt buộc có \`spec.selector.matchLabels\`** khớp với labels của template, thiếu là bị từ chối. (2) Copy YAML từ blog cũ trên mạng mà không kiểm chứng lại bằng \`k explain\` — thói quen nguy hiểm cả trong phòng thi lẫn ngoài đời.`,
      },
    ],
  },
];
