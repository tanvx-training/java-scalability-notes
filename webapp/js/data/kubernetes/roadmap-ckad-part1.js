// Nội dung bài học chi tiết cho roadmap CKAD — Phần 1 (Tuần 1–3).
// Mỗi item có `lesson` (markdown) hiển thị trong accordion.
// GIỮ NGUYÊN id và text — tiến độ người dùng lưu theo các id này.

export const weeksPart1 = [
  {
    id: "w1",
    week: "Tuần 1",
    title: "Nền tảng — Container & Kubernetes Architecture",
    goal: "Hiểu Kubernetes là gì và tại sao cần nó.",
    practice: "Tạo/xóa 10 Pod khác nhau, đọc `kubectl describe pod` và hiểu từng section.",
    resources: [
      { label: "Điều kiện tiên quyết (Docker, YAML, vim)", href: "#/docs/prerequisites" },
      { label: "Cheat sheet §1 Setup & kubectl", href: "#/docs/cheat-sheet" },
      { label: "Tra cứu lệnh kubectl", href: "#/commands" },
      { label: "K8s docs: Kubernetes Components", href: "https://kubernetes.io/docs/concepts/overview/components/" },
      { label: "K8s docs: kubectl Quick Reference", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
    ],
    items: [
      {
        id: "w1-1",
        text: "Ôn lại Docker: build image, Dockerfile, registry",
        lesson: `Trước khi học Kubernetes, bạn cần chắc tay với container — vì Kubernetes **không tạo ra container**, nó chỉ *điều phối* (orchestrate) chúng. Hãy hình dung: **Dockerfile** là công thức nấu ăn, **image** là món ăn đóng hộp sẵn (bất biến, mang đi đâu cũng dùng được), còn **container** là món ăn đã hâm nóng dọn ra bàn — một tiến trình đang chạy thật sự.

Ba khái niệm phải nắm:

- **Dockerfile**: file văn bản mô tả cách build image — \`FROM\` (image gốc), \`COPY\` (chép file vào), \`EXPOSE\` (khai báo port), \`ENTRYPOINT\`/\`CMD\` (lệnh chạy khi container khởi động). Cặp ENTRYPOINT/CMD sẽ gặp lại ở K8s dưới tên \`command\`/\`args\` (Tuần 2).
- **Image & tag**: đặt tên dạng \`registry/tên:tag\` (vd \`docker.io/nginx:1.25\`). Không ghi tag → mặc định \`latest\`.
- **Registry**: kho chứa image (Docker Hub, Harbor, ECR...). Bạn \`push\` image lên; các node Kubernetes sẽ tự \`pull\` về khi chạy Pod.

\`\`\`bash
# Dockerfile tối thiểu
cat <<EOF > Dockerfile
FROM nginx:1.25
COPY index.html /usr/share/nginx/html/
EXPOSE 80
EOF

docker build -t myapp:v1 .                 # build image từ Dockerfile
docker tag myapp:v1 registry.io/myapp:v1   # gắn tag kèm registry
docker push registry.io/myapp:v1           # đẩy lên registry
docker save myapp:v1 -o myapp.tar          # export image ra file (HAY RA THI)
docker load -i myapp.tar                   # nạp lại từ file
docker run -d -p 8080:80 --name web myapp:v1
\`\`\`

Đề CKAD có thể yêu cầu build image và **export ra file tar** — nhớ cặp \`docker save\` / \`docker load\`. **Podman** dùng cú pháp y hệt docker, gặp trong đề cứ thay chữ là xong.

⚠️ **Lỗi thường gặp:** nhầm \`docker save\` (lưu *image* thành tar) với \`docker export\` (lưu *filesystem của container*); và quên \`-o file.tar\` khiến output đổ ra màn hình.`,
      },
      {
        id: "w1-2",
        text: "Kiến trúc K8s: Control Plane (API Server, etcd, Scheduler, Controller Manager) vs Worker Node (kubelet, kube-proxy, runtime)",
        lesson: `Hãy tưởng tượng cluster Kubernetes như một **sân bay**: **Control Plane** là đài kiểm soát không lưu — ra quyết định, giữ sổ sách; còn **Worker Node** là đường băng — nơi "máy bay" (Pod) thực sự cất và hạ cánh.

**Control Plane** gồm:

- **API Server**: cổng vào *duy nhất* của cluster. Mọi lệnh \`kubectl\` thực chất là một REST request gửi tới đây. Các thành phần khác cũng chỉ nói chuyện với nhau qua API Server.
- **etcd**: database key-value lưu **toàn bộ trạng thái** cluster — "sổ cái" duy nhất. Mất etcd là mất cluster.
- **Scheduler**: chọn node phù hợp cho Pod mới dựa trên resource requests, nodeSelector, taints... Nó chỉ *ghi tên node vào Pod*, không tự chạy container.
- **Controller Manager**: chạy các **control loop** — liên tục so sánh trạng thái *mong muốn* (desired) với *thực tế* (actual) và tự sửa lệch. Đây là lý do khi bạn xóa Pod của một Deployment, Pod mới mọc lại ngay.

**Worker Node** gồm:

- **kubelet**: agent trên mỗi node — theo dõi API Server, bảo container runtime chạy container, báo cáo trạng thái ngược lại.
- **kube-proxy**: lo phần mạng — chuyển tiếp traffic của Service tới đúng Pod.
- **Container runtime** (containerd, CRI-O): thứ thực sự chạy container.

\`\`\`bash
k cluster-info                    # địa chỉ API Server
k get nodes -o wide               # các node + IP, OS, runtime
k describe node <tên-node>        # capacity, taints, pods đang chạy
k get pods -n kube-system         # xem chính các thành phần hệ thống
\`\`\`

Với CKAD bạn **không phải quản trị** các thành phần này, nhưng hiểu mô hình *desired state* giúp đọc lỗi nhanh hơn rất nhiều.

⚠️ **Lỗi thường gặp:** nghĩ rằng \`kubectl\` "SSH vào node" để chạy lệnh — thực ra mọi thứ đi qua API Server; và tưởng Scheduler chạy container — việc đó là của kubelet + runtime.`,
      },
      {
        id: "w1-3",
        text: "Cài môi trường lab: minikube / kind / Killercoda",
        lesson: `Học Kubernetes mà không có cluster để "vọc" thì như học bơi trên cạn. Bạn cần một **sân tập** — và có 3 lựa chọn phổ biến, đều miễn phí:

- **minikube**: chạy một cluster 1 node trong Docker hoặc VM trên máy bạn. Đầy đủ tính năng (addons, ingress, metrics-server), phù hợp học hàng ngày.
- **kind** (Kubernetes IN Docker): mỗi "node" là một container Docker — nhẹ, tạo/xóa cluster trong vài chục giây, chạy được cluster nhiều node.
- **Killercoda** (killercoda.com): lab chạy ngay trên trình duyệt, **giống môi trường thi thật nhất** — không cần cài gì.

Khuyến nghị: dùng **minikube hoặc kind** để học hàng ngày, và **Killercoda** để luyện đề sát phòng thi.

\`\`\`bash
# --- minikube (macOS: brew install minikube) ---
minikube start --driver=docker    # tạo cluster (cần Docker đang chạy)
minikube status
k get nodes                       # verify: 1 node Ready

# --- kind ---
kind create cluster --name ckad-lab
kind get clusters
k config get-contexts             # kind tự thêm context kind-ckad-lab

# Dọn dẹp khi cần
minikube delete
kind delete cluster --name ckad-lab
\`\`\`

Sau khi cluster chạy, làm ngay 2 việc như thói quen phòng thi: đặt \`alias k=kubectl\` và \`export do="--dry-run=client -o yaml"\` (xem cheat sheet §1). Từ giờ mọi bài học đều giả định bạn có cluster này để gõ theo — **đọc 1 lần, gõ 3 lần** mới nhớ.

⚠️ **Lỗi thường gặp:** \`minikube start\` fail vì Docker Desktop chưa chạy; và khi có nhiều cluster, \`kubectl\` trỏ nhầm context — luôn kiểm tra bằng \`k config get-contexts\` trước khi thao tác (thói quen này ăn điểm trong phòng thi).`,
      },
      {
        id: "w1-4",
        text: "Làm quen `kubectl`: `get`, `describe`, `create`, `delete`, `apply`",
        lesson: `\`kubectl\` là chiếc **remote control** của cluster — mỗi nút bấm là một REST request gửi tới API Server. Bạn sẽ sống cùng nó suốt 2 giờ thi, nên hãy thuộc 5 "nút" cơ bản:

- \`get\`: liệt kê tài nguyên — thêm \`-o wide\` (kèm IP, node), \`-o yaml\` (spec đầy đủ), \`-A\` (mọi namespace).
- \`describe\`: chi tiết một tài nguyên ở dạng dễ đọc, **kèm Events ở cuối** — nơi đầu tiên phải nhìn khi có lỗi.
- \`create\`: tạo mới — báo lỗi nếu đã tồn tại.
- \`apply\`: khai báo trạng thái mong muốn từ file YAML — *chưa có thì tạo, có rồi thì cập nhật*. Đây là lệnh "declarative" chủ lực.
- \`delete\`: xóa — thêm \`--force --grace-period=0\` khi cần xóa nhanh trong phòng thi.

Ngoài ra có một lệnh "phao cứu sinh": \`kubectl explain\` — tra tên field ngay trên terminal, khỏi mở docs.

\`\`\`bash
alias k=kubectl
export do="--dry-run=client -o yaml"   # setup 1 lần đầu giờ

k get pods                             # liệt kê pod trong namespace hiện tại
k get pods -o wide                     # + IP, node
k describe pod nginx                   # chi tiết + Events (đọc từ dưới lên)
k create -f pod.yaml                   # tạo mới từ file
k apply -f pod.yaml                    # tạo hoặc cập nhật (idempotent)
k delete pod nginx --force --grace-period=0
k explain pod.spec.containers          # tra field — cực hữu ích
k api-resources                        # tên viết tắt + apiVersion mọi resource
\`\`\`

Học thuộc luôn các tên viết tắt: \`po\`, \`deploy\`, \`svc\`, \`cm\`, \`ns\`, \`pvc\`... — gõ \`k get po\` nhanh hơn \`kubectl get pods\` rất nhiều lần trong 2 giờ.

⚠️ **Lỗi thường gặp:** quên \`-n <namespace>\` rồi hoảng vì "not found" (tài nguyên vẫn ở đó, chỉ là bạn nhìn nhầm chỗ); và nhầm \`describe\` (bản tóm tắt + Events) với \`get -o yaml\` (toàn bộ manifest) — mỗi cái phục vụ một mục đích debug khác nhau.`,
      },
      {
        id: "w1-5",
        text: "Tạo Pod đầu tiên bằng cả imperative (`kubectl run`) và declarative (YAML)",
        lesson: `Có 2 phong cách làm việc với Kubernetes. **Imperative** giống gọi món tại quầy: "cho tôi một Pod nginx" — nhanh, gọn, một dòng lệnh. **Declarative** giống gửi bản thiết kế: bạn mô tả trạng thái mong muốn trong file YAML rồi \`apply\`, Kubernetes lo phần thi công. Trong phòng thi, chiến thuật tối ưu là **kết hợp cả hai**: dùng lệnh imperative với \`$do\` để *generate* YAML, sửa vài dòng, rồi apply.

\`\`\`bash
# Cách 1: imperative — 1 dòng là có Pod
k run nginx --image=nginx --port=80

# Cách 2: generate YAML từ lệnh trên (không tạo gì cả nhờ --dry-run)
k run nginx --image=nginx --port=80 $do > pod.yaml
vim pod.yaml            # sửa nếu cần
k apply -f pod.yaml     # tạo từ file

# Verify — LUÔN LUÔN làm sau mỗi câu
k get pod nginx -o wide
k describe pod nginx
\`\`\`

File YAML sinh ra có 4 phần gốc mà mọi resource đều có: \`apiVersion\`, \`kind\`, \`metadata\` (tên, labels, namespace), \`spec\` (nội dung chính — với Pod là danh sách \`containers\`). Đọc kỹ file này một lần và hiểu từng dòng — nó là khung xương của tất cả YAML về sau.

Vài biến thể \`k run\` đáng thuộc lòng:

\`\`\`bash
k run busybox --image=busybox --command -- sleep 3600   # kèm command
k run tmp --image=busybox --rm -it --restart=Never -- sh # pod tạm để test rồi tự xóa
\`\`\`

⚠️ **Lỗi thường gặp:** cố \`k edit\` một Pod đang chạy để đổi field bị cấm (hầu hết field của Pod là **immutable**) — cách đúng là export YAML, sửa, rồi \`k replace -f pod.yaml --force\`; và kỳ vọng Pod trần tự hồi sinh khi bị xóa — không có đâu, tính năng self-healing thuộc về Deployment (Tuần 3).`,
      },
    ],
  },
  {
    id: "w2",
    week: "Tuần 2",
    title: "Pods chuyên sâu & Multi-Container Patterns",
    goal: "Thành thạo Pod — đơn vị cơ bản nhất.",
    practice: "Tạo Pod có init container chờ service khác, Pod có sidecar ghi log chung volume.",
    resources: [
      { label: "Lab 1 — Init container chờ service", href: "#/labs/lab01" },
      { label: "Lab 2 — Sidecar ghi log chung volume", href: "#/labs/lab02" },
      { label: "Cheat sheet §2–3 Pods & Multi-container", href: "#/docs/cheat-sheet" },
      { label: "Trắc nghiệm domain Design", href: "#/quiz" },
      { label: "K8s docs: Pods", href: "https://kubernetes.io/docs/concepts/workloads/pods/" },
      { label: "K8s docs: Init Containers", href: "https://kubernetes.io/docs/concepts/workloads/pods/init-containers/" },
    ],
    items: [
      {
        id: "w2-1",
        text: "Pod lifecycle & phases (Pending, Running, Succeeded, Failed)",
        lesson: `Đời một Pod giống một **chuyến bay**: chờ cất cánh (Pending), đang bay (Running), hạ cánh an toàn (Succeeded), hoặc gặp sự cố (Failed). Trường \`status.phase\` cho biết Pod đang ở chặng nào:

- **Pending**: API Server đã nhận Pod nhưng nó chưa chạy — đang chờ Scheduler chọn node, hoặc đang pull image. Pending *kéo dài* thường do thiếu resource hoặc không node nào khớp.
- **Running**: Pod đã gắn vào node, ít nhất 1 container đang chạy.
- **Succeeded**: mọi container kết thúc với exit code 0 và không restart (điển hình cho Pod của Job).
- **Failed**: có container kết thúc thất bại (exit khác 0).
- **Unknown**: mất liên lạc với node.

Bên dưới phase, từng **container** có state riêng: \`Waiting\` (kèm *reason* như ImagePullBackOff), \`Running\`, \`Terminated\` (kèm exit code). Trường \`restartPolicy\` (\`Always\` | \`OnFailure\` | \`Never\`) quyết định kubelet có khởi động lại container khi nó chết hay không.

\`\`\`bash
k run demo --image=nginx
k get pod demo -w                                   # theo dõi phase thay đổi realtime
k get pod demo -o jsonpath='{.status.phase}'        # lấy đúng phase
k describe pod demo                                 # Conditions + Events — nơi chẩn đoán
\`\`\`

Điểm hay nhầm: \`CrashLoopBackOff\` hay \`ImagePullBackOff\` **không phải phase** — chúng chỉ là *reason* của container state Waiting, hiển thị ở cột STATUS của \`k get pod\`. Pod lúc đó vẫn có phase Pending/Running.

⚠️ **Lỗi thường gặp:** thấy Running là yên tâm — nhưng Pod có thể Running mà **không Ready** (readiness probe fail, không nhận traffic); và gặp Pending thì loay hoay xem log — Pending nghĩa là container *chưa chạy*, manh mối nằm ở \`k describe pod\` → Events, không phải \`k logs\`.`,
      },
      {
        id: "w2-2",
        text: "Multi-container Pods: sidecar, init containers, adapter, ambassador",
        lesson: `Pod giống một **căn hộ**, các container là **bạn cùng phòng**: chung địa chỉ nhà (Pod IP), gọi nhau qua \`localhost\`, và có thể chung "tủ đồ" (volume). Khi một container chính cần trợ thủ đứng sát bên, ta nhét cả hai vào cùng Pod — đó là multi-container patterns:

- **Init container**: chạy **trước** và **tuần tự**; tất cả phải xong thì container chính mới khởi động. Kinh điển: chờ database sẵn sàng, tải config về trước.
- **Sidecar**: chạy **song song** với container chính để hỗ trợ — ship log, proxy, refresh certificate. Từ K8s 1.29, **native sidecar** = init container có \`restartPolicy: Always\` — khởi động trước app, sống suốt đời Pod.
- **Adapter**: sidecar "phiên dịch" output của app sang định dạng chuẩn (vd log → metrics).
- **Ambassador**: sidecar làm proxy giúp app nói chuyện với dịch vụ bên ngoài. Hai pattern sau về kỹ thuật vẫn là sidecar — đề thi chủ yếu hỏi init + sidecar.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: myapp
spec:
  initContainers:
  - name: wait-for-db                 # init: chạy xong mới đến app
    image: busybox
    command: ['sh', '-c', 'until nslookup db-service; do sleep 2; done']
  - name: log-sidecar                 # native sidecar (K8s 1.29+)
    image: busybox
    restartPolicy: Always             # biến init thành sidecar sống suốt đời pod
    command: ['sh', '-c', 'tail -F /var/log/app.log']
    volumeMounts:
    - { name: logs, mountPath: /var/log }
  containers:
  - name: app
    image: nginx
    volumeMounts:
    - { name: logs, mountPath: /var/log }
  volumes:
  - name: logs
    emptyDir: {}
\`\`\`

⚠️ **Lỗi thường gặp:** quên rằng init containers chạy **tuần tự** — một init treo (vd service chưa tồn tại) là Pod kẹt ở \`Init:0/1\` mãi; và xem log Pod nhiều container mà không chỉ định \`-c <tên-container>\` (hoặc \`--all-containers\`).`,
      },
      {
        id: "w2-3",
        text: "`command` vs `args` (tương ứng ENTRYPOINT vs CMD)",
        lesson: `Nghĩ về lệnh khởi động container như một câu: **ENTRYPOINT là động từ** cố định, **CMD là tân ngữ** mặc định có thể thay. Kubernetes đặt tên lại (dễ gây nhầm!):

| Docker | Kubernetes |
|---|---|
| ENTRYPOINT | \`command\` |
| CMD | \`args\` |

Quy tắc override:

- Chỉ set \`args\` → **giữ** ENTRYPOINT của image, chỉ thay tham số.
- Set \`command\` → **thay hoàn toàn** ENTRYPOINT (và CMD của image bị bỏ qua nếu bạn không set \`args\`).

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: cmd-demo
spec:
  containers:
  - name: main
    image: busybox
    command: ["/bin/sh"]          # override ENTRYPOINT
    args: ["-c", "echo hello && sleep 3600"]   # override CMD
  restartPolicy: Never
\`\`\`

Với lệnh imperative, vị trí cờ \`--command\` quyết định tất cả:

\`\`\`bash
# KHÔNG có --command: phần sau "--" là ARGS (giữ entrypoint của image)
k run p1 --image=nginx -- -g 'daemon off;'

# CÓ --command: phần sau "--" là COMMAND (thay cả entrypoint)
k run p2 --image=busybox --command -- sleep 3600

# Generate YAML để kiểm tra field sinh ra là command hay args
k run p2 --image=busybox --command $do -- sleep 3600
\`\`\`

Mẹo kiểm chứng: generate YAML bằng \`$do\` rồi nhìn xem lệnh của bạn rơi vào \`command\` hay \`args\` — cách nhanh nhất để hết nhầm.

⚠️ **Lỗi thường gặp:** viết \`command: ["echo hello && sleep 10"]\` và thắc mắc vì sao fail — \`command\` **không chạy qua shell**, nên muốn dùng \`&&\`, biến, wildcard phải bọc \`["sh", "-c", "..."]\`; và quên rằng với image có ENTRYPOINT riêng (như nginx), truyền args mà tưởng mình đang thay lệnh chính.`,
      },
      {
        id: "w2-4",
        text: "Environment variables trong Pod",
        lesson: `Biến môi trường là cách "nhét giấy nhắn vào túi áo" container trước khi nó chạy — app đọc config từ đó thay vì hard-code. Kubernetes có nhiều nguồn để bơm env vào container:

- **Giá trị tĩnh**: \`env\` với cặp \`name\`/\`value\` — đơn giản nhất.
- **Từ ConfigMap/Secret**: \`valueFrom.configMapKeyRef\` / \`secretKeyRef\` (từng key), hoặc \`envFrom\` (nạp cả ConfigMap/Secret thành env một lượt — học kỹ ở Tuần 4).
- **Downward API**: \`valueFrom.fieldRef\` lấy thông tin của chính Pod (tên, namespace, IP...) — rất hay ra thi dạng "inject tên pod vào env".
- **resourceFieldRef**: lấy requests/limits của container.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: env-demo
spec:
  containers:
  - name: main
    image: busybox
    command: ["sh", "-c", "env && sleep 3600"]
    env:
    - name: MODE                      # giá trị tĩnh
      value: "production"
    - name: POD_NAME                  # Downward API
      valueFrom:
        fieldRef:
          fieldPath: metadata.name
    - name: POD_IP
      valueFrom:
        fieldRef:
          fieldPath: status.podIP
\`\`\`

\`\`\`bash
# Imperative: --env dùng được nhiều lần
k run env-demo --image=busybox --env="MODE=production" --env="DEBUG=true" --command -- sleep 3600

k exec env-demo -- env        # verify biến đã vào container
\`\`\`

Lưu ý giá trị \`value\` luôn là **string** — số hay boolean đều phải để trong nháy kép (\`"8080"\`, \`"true"\`), nếu không YAML parser sẽ báo lỗi kiểu dữ liệu.

⚠️ **Lỗi thường gặp:** env chỉ được inject **một lần lúc container khởi động** — sửa ConfigMap xong env không tự đổi, phải restart Pod; và tham chiếu biến khác bằng cú pháp \`$(VAR)\` chỉ hoạt động khi VAR được khai báo **trước đó** trong danh sách \`env\`.`,
      },
      {
        id: "w2-5",
        text: "Labels, Selectors, Annotations",
        lesson: `**Labels** như nhãn dán màu trên hồ sơ — máy móc dùng chúng để *phân loại và lựa chọn*. **Annotations** như ghi chú viết tay ngoài bìa — chứa thông tin cho người hoặc tool đọc (mô tả, changelog, config của ingress-controller...), nhưng **không bao giờ dùng để chọn** tài nguyên.

Labels là cặp \`key=value\` gắn vào metadata. Chúng là **trái tim của Kubernetes**: Service tìm Pod qua labels, Deployment quản lý Pod qua labels, NetworkPolicy khoanh vùng qua labels. Selector có 2 kiểu:

- **Equality-based**: \`env=prod\`, \`tier!=frontend\`
- **Set-based**: \`env in (prod,dev)\`, \`tier notin (cache)\`, \`!canary\`

\`\`\`bash
k run nginx --image=nginx --labels="app=web,env=dev"   # tạo pod kèm labels

k label pod nginx tier=frontend            # thêm label
k label pod nginx env=prod --overwrite     # sửa label đã tồn tại (bắt buộc --overwrite)
k label pod nginx tier-                    # xóa label (dấu trừ ở cuối)

k get pods --show-labels                   # xem labels
k get pods -l env=prod                     # lọc equality
k get pods -l 'env in (prod,dev)'          # lọc set-based
k get pods -l env=prod,app=web             # AND nhiều điều kiện

k annotate pod nginx description="app demo tuan 2"   # thêm annotation
k annotate pod nginx description-                    # xóa annotation
\`\`\`

Trong đề thi, thao tác label xuất hiện khắp nơi: "tạo pod với label X", "liệt kê pod có label Y", và đặc biệt là kỹ thuật **canary bằng labels** (Tuần 3) — nơi việc Service chọn nhãn nào quyết định traffic đi đâu.

⚠️ **Lỗi thường gặp:** sửa label đã tồn tại mà quên \`--overwrite\` → lệnh bị từ chối; và đổi label của Pod đang chạy khiến nó **rơi khỏi selector của Service** (mất traffic) hoặc bị ReplicaSet coi là "người lạ" và tạo Pod thay thế — con dao hai lưỡi, dùng chủ động để cô lập Pod lỗi ra debug thì lại rất hay.`,
      },
      {
        id: "w2-6",
        text: "Namespaces",
        lesson: `Namespace giống các **tầng trong một tòa nhà văn phòng**: cùng một tòa nhà (cluster) nhưng mỗi tầng có không gian riêng, danh bạ riêng, quy định riêng. Chúng giúp tách môi trường (dev/staging/prod), tách team, và là ranh giới áp **ResourceQuota**, **LimitRange**, **RBAC**, **NetworkPolicy**.

Điểm cần nắm:

- Hai tài nguyên **cùng tên** có thể tồn tại ở 2 namespace khác nhau.
- Cluster có sẵn: \`default\`, \`kube-system\` (thành phần hệ thống), \`kube-public\`, \`kube-node-lease\`.
- DNS xuyên namespace: \`<service>.<namespace>.svc.cluster.local\` — cùng namespace chỉ cần tên service.
- Một số tài nguyên **cluster-scoped**, không thuộc namespace nào: Node, PersistentVolume, Namespace, ClusterRole...

\`\`\`bash
k create ns dev                                 # tạo namespace
k get ns                                        # liệt kê
k run nginx --image=nginx -n dev                # tạo pod trong ns dev
k get pods -n dev                               # xem theo ns
k get pods -A                                   # MỌI namespace

# Đặt namespace mặc định cho context — đỡ gõ -n mỗi lệnh (làm ngay mỗi câu thi!)
k config set-context --current --namespace=dev

k api-resources --namespaced=false              # tài nguyên cluster-scoped
\`\`\`

Trong đề CKAD, **mỗi câu hỏi chỉ định một namespace** (và context) riêng. Kỹ năng phản xạ: đọc đề → \`k config use-context ...\` → \`set-context --current --namespace=...\` → mới bắt đầu làm. Quên bước này là làm đúng hết nhưng **0 điểm** vì tài nguyên nằm sai chỗ.

⚠️ **Lỗi thường gặp:** quên \`-n <ns>\` rồi kết luận "tài nguyên không tồn tại" (nó vẫn đó, ở namespace khác — kiểm tra bằng \`-A\`); và xóa namespace mà không biết lệnh này **xóa toàn bộ tài nguyên bên trong** — đừng chạy thử trên namespace có đồ thật.`,
      },
    ],
  },
  {
    id: "w3",
    week: "Tuần 3",
    title: "Workloads — Deployments, Jobs, CronJobs",
    goal: "Quản lý ứng dụng ở quy mô production.",
    practice: "Deploy app, update image sai → quan sát lỗi → rollback. Tạo CronJob chạy mỗi phút.",
    resources: [
      { label: "Lab 3 — Job completions/parallelism", href: "#/labs/lab03" },
      { label: "Lab 4 — CronJob", href: "#/labs/lab04" },
      { label: "Lab 6 — Rolling update maxSurge", href: "#/labs/lab06" },
      { label: "Lab 7 — Canary bằng labels", href: "#/labs/lab07" },
      { label: "Cheat sheet §4–5 Deployments, Jobs & CronJobs", href: "#/docs/cheat-sheet" },
      { label: "K8s docs: Deployments", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
    ],
    items: [
      {
        id: "w3-1",
        text: "ReplicaSets — cơ chế duy trì số replica",
        lesson: `ReplicaSet (RS) như một **quản ca trực** với đúng một nhiệm vụ: đảm bảo luôn có đủ *N* nhân viên (Pod) đứng máy. Ai nghỉ đột xuất — gọi ngay người thay; thừa người — cho bớt về. Đó chính là **control loop**: liên tục so sánh \`replicas\` mong muốn với số Pod thực tế (đếm qua **selector** khớp labels) và tự điều chỉnh.

Ba mảnh ghép trong spec của RS:

- \`replicas\`: số Pod mong muốn.
- \`selector.matchLabels\`: cách RS "nhận diện" Pod của mình.
- \`template\`: khuôn để dập Pod mới — \`template.metadata.labels\` **bắt buộc khớp** selector.

Thực tế bạn **hầu như không tạo RS trực tiếp** — Deployment tạo và quản lý RS hộ bạn (mỗi lần đổi template là một RS mới, đó là nền tảng của rolling update & rollback). Nhưng phải hiểu RS để đọc được chuyện gì xảy ra bên dưới.

\`\`\`bash
k create deploy web --image=nginx --replicas=3
k get rs                            # deployment đã tạo 1 RS (tên: web-<hash>)
k get pods --show-labels            # pods mang label pod-template-hash

# Thí nghiệm self-healing: xóa 1 pod và xem RS tạo lại ngay
k delete pod <tên-pod-bất-kỳ>
k get pods -w                       # pod mới mọc lên trong vài giây

k scale rs <tên-rs> --replicas=5    # scale trực tiếp RS (chỉ để học — thực tế scale deploy)
k describe rs <tên-rs>              # Events: đã tạo/xóa pod nào
\`\`\`

⚠️ **Lỗi thường gặp:** sửa image trong RS và chờ Pod đổi theo — RS **chỉ đếm số lượng**, không rolling update Pod đang chạy (template mới chỉ áp cho Pod tạo sau); muốn update có kiểm soát phải dùng Deployment. Và cố "giảm tải" bằng cách xóa Pod thủ công — RS lập tức tạo bù, muốn giảm thật phải \`scale\`.`,
      },
      {
        id: "w3-2",
        text: "Deployments: tạo, scale, update image",
        lesson: `Nếu RS là quản ca thì **Deployment là giám đốc vận hành**: bạn chỉ nói kết quả mong muốn — "5 bản, image v2" — nó lo toàn bộ phần thực thi: tạo RS mới, tăng dần bản mới, giảm dần bản cũ, giữ lịch sử để quay đầu. Đây là workload **quan trọng nhất** với ứng dụng chạy dài hạn (web, API).

Chuỗi quản lý: **Deployment → ReplicaSet → Pods**. Ba thao tác cốt lõi:

\`\`\`bash
# 1. TẠO — thuộc lòng dòng này
k create deploy web --image=nginx:1.25 --replicas=3
k create deploy web --image=nginx:1.25 --replicas=3 $do > deploy.yaml  # generate YAML

# 2. SCALE
k scale deploy web --replicas=5
k autoscale deploy web --min=2 --max=10 --cpu-percent=80   # HPA tự scale theo CPU

# 3. UPDATE IMAGE — chú ý: nginx= là TÊN CONTAINER, không phải tên image
k set image deploy/web nginx=nginx:1.26
k rollout status deploy/web          # theo dõi tiến trình update

# Verify
k get deploy,rs,pods
k describe deploy web
\`\`\`

Khi \`set image\`, Deployment tạo RS **mới** cho template mới rồi dịch chuyển dần số replica từ RS cũ sang — Pod được **thay thế** chứ không sửa tại chỗ. RS cũ giữ lại (replicas=0) làm lịch sử cho rollback.

Trong YAML, chỗ dễ sai nhất: \`spec.selector.matchLabels\` **phải khớp** \`spec.template.metadata.labels\` — lệch nhau là API Server từ chối tạo.

⚠️ **Lỗi thường gặp:** \`k set image deploy/web web=nginx:1.26\` fail vì gõ sai **tên container** (xem tên đúng bằng \`k get deploy web -o jsonpath='{.spec.template.spec.containers[0].name}'\`); và tưởng \`scale\` tạo revision mới — scale chỉ đổi số lượng, không đổi template nên **không** ghi vào rollout history.`,
      },
      {
        id: "w3-3",
        text: "Rolling updates & rollbacks (`rollout status/undo/history`)",
        lesson: `Triển khai bản mới giống **thay lốp xe khi đang chạy chậm**: thay từng bánh một, xe không bao giờ dừng. Và nếu lốp mới hỏng? Lắp lại lốp cũ — đó là **rollback**. Bộ lệnh \`k rollout\` là vô lăng của toàn bộ quá trình này.

Cơ chế: mỗi lần **template đổi** (image, env, labels...), Deployment tạo một **revision** mới (ứng với một ReplicaSet). Lịch sử revision là danh sách các "điểm quay đầu".

\`\`\`bash
k create deploy web --image=nginx:1.25 --replicas=3

# Update image → tạo revision 2
k set image deploy/web nginx=nginx:1.26
k rollout status deploy/web              # theo dõi: đang thay dần pod

# Cố tình update image SAI → revision 3, pods mới ImagePullBackOff
k set image deploy/web nginx=nginx:sai-tag
k rollout status deploy/web              # treo — bản mới không bao giờ Ready
k get pods                               # pod cũ VẪN CHẠY (nhờ rolling update giữ lại)

# Xem lịch sử và rollback
k rollout history deploy/web
k rollout history deploy/web --revision=2   # chi tiết 1 revision
k rollout undo deploy/web                   # về revision liền trước
k rollout undo deploy/web --to-revision=1   # về revision chỉ định
k rollout restart deploy/web                # thay mới toàn bộ pods (không đổi template)
\`\`\`

Mẹo: ghi chú lý do deploy bằng annotation \`kubernetes.io/change-cause\` — cột CHANGE-CAUSE trong \`history\` sẽ hiển thị nó, giúp biết revision nào là gì.

Điều đáng quý của rolling update: khi image mới lỗi, các Pod **cũ vẫn phục vụ traffic** — hệ thống không sập, bạn có thời gian bình tĩnh \`undo\`.

⚠️ **Lỗi thường gặp:** đứng chờ \`rollout status\` mãi khi image sai — nó sẽ treo vô hạn, hãy mở terminal khác \`k get pods\` để thấy ImagePullBackOff rồi \`undo\` ngay; và nhớ rằng \`undo\` tạo ra **revision mới** (số revision luôn tăng), đừng bối rối khi thấy history "nhảy số".`,
      },
      {
        id: "w3-4",
        text: "Strategies: RollingUpdate (maxSurge/maxUnavailable) vs Recreate",
        lesson: `Có 2 chiến lược thay bản mới. **RollingUpdate** (mặc định) như đội bảo trì thay từng thang máy một — tòa nhà luôn có thang chạy. **Recreate** như tắt cả tòa nhà để thay đồng loạt — nhanh, dứt khoát, nhưng có **downtime**.

RollingUpdate được tinh chỉnh bằng 2 núm vặn (nhận số tuyệt đối hoặc %):

- \`maxSurge\`: được phép tạo **thêm** tối đa bao nhiêu Pod vượt số replicas trong lúc update (mặc định 25%). Tăng → update nhanh hơn, tốn tài nguyên hơn.
- \`maxUnavailable\`: cho phép tối đa bao nhiêu Pod **thiếu hụt** so với replicas (mặc định 25%). Đặt 0 → luôn đủ công suất phục vụ.

Ví dụ replicas=4, \`maxSurge=1\`, \`maxUnavailable=0\`: hệ thống lên tối đa 5 Pod, không bao giờ dưới 4 — update "không mất một nhịp".

**Recreate** dùng khi app **không thể chạy 2 version song song**: schema database không tương thích, hoặc volume RWO chỉ một Pod mount được.

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 4
  strategy:                    # NGANG HÀNG với replicas — không nằm trong template!
    type: RollingUpdate        # hoặc: Recreate (không có rollingUpdate bên dưới)
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
      - name: nginx
        image: nginx:1.25
\`\`\`

Tra nhanh field trong phòng thi: \`k explain deploy.spec.strategy --recursive\`.

⚠️ **Lỗi thường gặp:** đặt cả \`maxSurge: 0\` và \`maxUnavailable: 0\` — bị từ chối vì update không thể nhúc nhích; và đặt \`strategy\` **sai chỗ** (lọt vào trong \`template\`) — nó phải ngang hàng \`replicas\`/\`selector\`, sai vị trí là YAML bị từ chối hoặc âm thầm vô tác dụng.`,
      },
      {
        id: "w3-5",
        text: "Blue/Green và Canary deployment bằng labels + services",
        lesson: `Hai chiến thuật release nâng cao, đều dựng bằng nguyên liệu đã học: **labels + Service selector**. Hình dung: **Blue/Green** là hai sân khấu dựng sẵn — chuyển toàn bộ đèn spotlight sang sân khấu mới trong một nốt nhạc. **Canary** là "chim hoàng yến trong mỏ than" — thả một lượng nhỏ người dùng vào bản mới để dò rủi ro trước.

Chìa khóa nằm ở **selector của Service** — nó chính là công tắc traffic:

- **Canary**: 2 Deployment cùng label \`app=web\`, khác \`version\`. Service chỉ select \`app=web\` (KHÔNG select version) → traffic chia **xấp xỉ theo tỷ lệ số Pod** (4 pod v1 + 1 pod v2 ≈ 80/20).
- **Blue/Green**: Service select cả \`app=web\` **và** \`version=blue\`. Khi green sẵn sàng và đã test kỹ → patch selector sang \`version=green\` — chuyển 100% traffic tức thì, rollback cũng chỉ là patch ngược lại.

\`\`\`bash
# --- Canary ---
k create deploy web-v1 --image=nginx:1.25 --replicas=4
k create deploy web-v2 --image=nginx:1.26 --replicas=1
k label deploy web-v1 --overwrite app=web    # đảm bảo pods 2 bên chung label app=web
# (thực tế: sửa template.metadata.labels của cả 2 deployment: app=web, version=v1/v2)

# Service chỉ chọn app=web → nhận pod của CẢ HAI deployment
k expose deploy web-v1 --name=web-svc --port=80 --selector="app=web"
k get endpoints web-svc                      # phải thấy IP của cả 5 pod

# --- Blue/Green: chuyển spotlight bằng 1 lệnh patch ---
k patch svc web-svc -p '{"spec":{"selector":{"app":"web","version":"green"}}}'
\`\`\`

Tăng dần canary = scale: \`k scale deploy web-v2 --replicas=4\` rồi giảm v1 — đến khi v2 gánh 100% thì xóa v1.

⚠️ **Lỗi thường gặp:** Service của canary lỡ chứa \`version\` trong selector → 100% traffic dồn một phía, canary vô nghĩa — luôn verify bằng \`k get endpoints\` xem đủ Pod hai bản chưa; và kỳ vọng chia % chính xác — tỷ lệ chỉ xấp xỉ theo số Pod, muốn chia chuẩn (vd 1%) cần Ingress controller hoặc service mesh.`,
      },
      {
        id: "w3-6",
        text: "Jobs: completions, parallelism, backoffLimit, activeDeadlineSeconds",
        lesson: `Deployment nuôi app chạy **mãi mãi**; còn **Job** là "hợp đồng khoán việc": chạy cho *xong* rồi nghỉ — xử lý batch, migrate database, render báo cáo. Job tạo Pod, theo dõi đến khi đủ số lần **thành công** (container exit 0) thì đánh dấu Complete.

Bốn núm điều khiển phải thuộc:

- \`completions\`: tổng số lần chạy thành công cần đạt (mặc định 1).
- \`parallelism\`: số Pod chạy **song song** tại một thời điểm (mặc định 1). Ví dụ \`completions: 6, parallelism: 2\` → luôn có 2 Pod chạy đến khi đủ 6 lần xong.
- \`backoffLimit\`: số lần **retry** khi fail trước khi Job bị đánh dấu Failed (mặc định 6, delay tăng dần).
- \`activeDeadlineSeconds\`: thời gian sống tối đa của **cả Job** — quá hạn là Failed và mọi Pod bị dừng, **bất kể** backoffLimit còn hay hết.

\`\`\`bash
# Imperative — nhớ dạng này
k create job hello --image=busybox -- sh -c "echo hello CKAD"
k create job hello --image=busybox $do -- sh -c "echo hi" > job.yaml
\`\`\`

\`\`\`yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: batch-job
spec:
  completions: 6
  parallelism: 2
  backoffLimit: 3
  activeDeadlineSeconds: 120
  template:
    spec:
      containers:
      - name: worker
        image: busybox
        command: ["sh", "-c", "echo processing && sleep 5"]
      restartPolicy: Never       # Never hoặc OnFailure — KHÔNG được Always
\`\`\`

Theo dõi: \`k get jobs\` (cột COMPLETIONS), \`k get pods -l job-name=batch-job\`. Chọn \`restartPolicy: Never\` khi muốn **giữ Pod lỗi lại để đọc log**; \`OnFailure\` thì kubelet restart tại chỗ, log cũ khó truy.

⚠️ **Lỗi thường gặp:** để \`restartPolicy: Always\` (mặc định của Pod template) — Job **từ chối tạo**, phải tự set Never/OnFailure; và Pod của Job xong việc vẫn nằm đó ở trạng thái Completed (để bạn xem log) — muốn tự dọn thì thêm \`ttlSecondsAfterFinished\`.`,
      },
      {
        id: "w3-7",
        text: "CronJobs: cron syntax, concurrencyPolicy, successfulJobsHistoryLimit",
        lesson: `CronJob là chiếc **đồng hồ báo thức** của cluster: đến giờ hẹn, nó tạo một **Job** mới (Job lại tạo Pod). Chuỗi sở hữu: **CronJob → Job → Pod** — nên spec của nó lồng \`jobTemplate\` bên trong. Dùng cho backup định kỳ, gửi báo cáo, dọn dẹp dữ liệu.

Lịch hẹn viết bằng **cron syntax** 5 trường:

\`\`\`
┌──── phút (0-59)
│ ┌──── giờ (0-23)
│ │ ┌──── ngày trong tháng (1-31)
│ │ │ ┌──── tháng (1-12)
│ │ │ │ ┌──── thứ (0-6, 0=CN)
* * * * *
"*/5 * * * *"  → mỗi 5 phút        "0 3 * * *"  → 3h sáng hàng ngày
"0 0 * * 0"    → nửa đêm Chủ nhật
\`\`\`

Các field điều khiển hành vi:

- \`concurrencyPolicy\`: xử lý khi lần chạy trước **chưa xong** mà đến giờ chạy mới — \`Allow\` (chạy chồng, mặc định) | \`Forbid\` (bỏ qua lần mới) | \`Replace\` (hủy cũ, chạy mới).
- \`successfulJobsHistoryLimit\` / \`failedJobsHistoryLimit\`: giữ lại bao nhiêu Job cũ (mặc định 3/1).
- \`startingDeadlineSeconds\`: lỡ hẹn quá số giây này thì bỏ luôn lượt đó.

\`\`\`bash
# Imperative — schedule LUÔN để trong nháy kép
k create cronjob backup --image=busybox --schedule="*/1 * * * *" -- sh -c "date; echo backup done"

k get cj                                  # xem cronjob
k get jobs -w                             # mỗi phút một job mới xuất hiện
k create job test-run --from=cronjob/backup   # chạy tay NGAY để test, khỏi chờ lịch
\`\`\`

Mẹo thi: đừng ngồi chờ đến giờ chạy — dùng \`--from=cronjob/...\` để kích hoạt ngay và verify kết quả.

⚠️ **Lỗi thường gặp:** YAML của CronJob có **hai tầng spec lồng nhau** (\`spec.jobTemplate.spec.template.spec\`) — sai indent ở đây là lỗi kinh điển, cứ generate bằng \`$do\` rồi sửa; và schedule tính theo **múi giờ của controller-manager (thường UTC)** — "3h sáng" của đề chưa chắc là 3h sáng giờ bạn nghĩ; K8s 1.27+ có field \`timeZone\` để chỉ định rõ.`,
      },
    ],
  },
];
