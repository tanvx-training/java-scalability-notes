// CKA Roadmap Part 2 — Tuần 4, 5 & 6: Scheduling + Storage + Services & Networking
// Dữ liệu lộ trình CKA (tiếng Việt). KHÔNG đổi id/text — progress của người dùng lưu theo id.

export const ckaWeeksPart2 = [
  {
    id: "cka-w4",
    week: "Tuần 4",
    title: "Scheduling",
    goal: "Điều khiển Pod chạy ở đâu — và hiểu chuyện gì xảy ra khi scheduler vắng mặt.",
    practice:
      "Taint 1 node, tạo pod có/không toleration, quan sát. Drain node và xem pod dời đi đâu.",
    resources: [
      { label: "CKA Study Guide — Tuần 4", href: "#/docs/cka-study-guide" },
      { label: "CKA Cheat Sheet — Scheduling nâng cao", href: "#/docs/cka-cheat-sheet" },
      {
        label: "K8s Docs — Assigning Pods to Nodes",
        href: "https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/",
      },
      {
        label: "K8s Docs — Taints and Tolerations",
        href: "https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/",
      },
      {
        label: "Killercoda — CKA scenarios",
        href: "https://killercoda.com/killer-shell-cka",
      },
    ],
    items: [
      {
        id: "cka-w4-1",
        text: "nodeSelector & node affinity (required vs preferred)",
        lesson: `Hãy hình dung việc đặt phòng khách sạn: **nodeSelector** là yêu cầu cứng một dòng — "phòng phải có ban công", không có thì không nhận phòng. **Node affinity** là phiếu yêu cầu chi tiết hơn, chia hai mục: **required** (bắt buộc, không thỏa thì đứng chờ) và **preferred** (ưu tiên, không có cũng đành chấp nhận phòng khác).

Cả hai đều dựa trên **label của node**, nên bước đầu tiên luôn là gán label: \`k label node node01 disktype=ssd\`. Với nodeSelector, bạn chỉ khai cặp key-value, các cặp được AND với nhau — đơn giản nhưng không diễn đạt được "hoặc", "không phải".

Node affinity mạnh hơn nhờ **operators**: \`In\`, \`NotIn\`, \`Exists\`, \`DoesNotExist\`, \`Gt\`, \`Lt\`. Tên field dài dòng nhưng tự giải nghĩa: \`requiredDuringSchedulingIgnoredDuringExecution\` — bắt buộc **lúc xếp lịch**, nhưng **bỏ qua khi đang chạy** (node bị đổi label sau đó, pod đang chạy KHÔNG bị đuổi). Bản \`preferred...\` có thêm \`weight\` (1–100) để scheduler cộng điểm khi chấm node.

\`\`\`yaml
# Pod chỉ được xếp lên node có disktype=ssd, ưu tiên thêm zone=az1
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  containers:
  - name: web
    image: nginx
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:        # nhiều terms = OR giữa các terms
        - matchExpressions:       # nhiều expressions = AND trong 1 term
          - key: disktype
            operator: In
            values: ["ssd"]
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 50
        preference:
          matchExpressions:
          - key: zone
            operator: In
            values: ["az1"]
\`\`\`

Ghi nhớ cấu trúc: **OR giữa các \`nodeSelectorTerms\`, AND giữa các \`matchExpressions\`** trong cùng một term.

⚠️ **Lỗi thường gặp:** (1) Dùng \`required\` mà không node nào có label → Pod \`Pending\`, \`k describe pod\` báo "didn't match Pod's node affinity/selector" — chỉ cần \`k label node\` đúng là pod tự được xếp, không cần tạo lại. (2) Đề yêu cầu "ưu tiên" (prefer) mà bạn dùng \`required\` — sai ngữ nghĩa, mất điểm dù pod vẫn chạy.`,
      },
      {
        id: "cka-w4-2",
        text: "Taints & Tolerations: NoSchedule, PreferNoSchedule, NoExecute",
        lesson: `**Taint** giống tấm **biển cấm đỗ xe** cắm trước cổng node: mặc định mọi Pod đều bị xua đi. **Toleration** là **giấy phép đỗ đặc biệt** dán trên kính Pod: có giấy phép thì được phép đỗ ở node có biển cấm tương ứng — nhưng lưu ý, giấy phép chỉ nghĩa là **được phép**, không có nghĩa là **bắt buộc phải đỗ ở đó**.

Ba mức **effect** cần thuộc lòng:

- \`NoSchedule\` — không nhận Pod mới thiếu toleration; Pod đang chạy được ở lại.
- \`PreferNoSchedule\` — cố tránh, nhưng hết chỗ thì vẫn nhận.
- \`NoExecute\` — mạnh nhất: **đuổi cả Pod đang chạy** nếu không có toleration; toleration có thể khai \`tolerationSeconds\` để "ở lại thêm X giây rồi mới đi".

Kiến thức mức admin: control plane mặc định mang taint \`node-role.kubernetes.io/control-plane:NoSchedule\` — vì thế Pod thường không bao giờ lên master. Kubernetes cũng **tự taint** node lỗi bằng \`NoExecute\` (\`node.kubernetes.io/not-ready\`, \`unreachable\`) và mọi Pod được tự thêm toleration 300 giây — đó là lý do Pod "lì" lại 5 phút trước khi bị dời khỏi node chết.

\`\`\`bash
# Thêm taint vào node
k taint node node01 env=prod:NoSchedule

# Xem taint hiện có
k describe node node01 | grep -i taint

# Tạo pod KHÔNG toleration → Pending hoặc dồn sang node khác
k run test --image=nginx
k get pod test -o wide

# XÓA taint: cùng lệnh, thêm dấu trừ ở cuối
k taint node node01 env=prod:NoSchedule-
\`\`\`

Toleration khai trong \`spec.tolerations\` với \`operator: Equal\` (cần value) hoặc \`Exists\` (chỉ cần key).

⚠️ **Lỗi thường gặp:** (1) Quên **dấu \`-\` cuối lệnh** khi xóa taint — lệnh không có dấu trừ là THÊM taint. (2) Nghĩ toleration sẽ "hút" Pod về node đã taint — không, nó chỉ mở cửa; muốn Pod chỉ chạy đúng node đó phải kết hợp thêm nodeAffinity/nodeSelector.`,
      },
      {
        id: "cka-w4-3",
        text: "Pod affinity / anti-affinity",
        lesson: `Nếu node affinity là chọn phòng theo **đặc điểm của phòng**, thì pod affinity/anti-affinity là xếp chỗ theo **hàng xóm**. **Pod affinity**: "xếp tôi cùng bàn với nhóm marketing" — ví dụ web server muốn nằm cạnh Redis cache để giảm độ trễ. **Anti-affinity**: "hai MC không được đứng cùng một sân khấu" — các replica của cùng một app phải tách node để một node chết không kéo sập tất cả.

Hai khái niệm then chốt:

- \`labelSelector\` — match **label của Pod khác** (không phải label node!).
- \`topologyKey\` — định nghĩa "cùng chỗ" nghĩa là gì: \`kubernetes.io/hostname\` = cùng node; \`topology.kubernetes.io/zone\` = cùng zone. Field này **bắt buộc**.

Giống node affinity, có hai mức \`required...\` và \`preferred...\` (kèm weight). Với cluster lớn, phép tính anti-affinity kiểu required khá tốn kém cho scheduler — thực tế thường dùng preferred.

\`\`\`yaml
# Deployment 3 replica, mỗi replica BẮT BUỘC nằm trên node khác nhau
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      containers:
      - name: web
        image: nginx
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
          - labelSelector:
              matchLabels: { app: web }   # né các pod có label này
            topologyKey: kubernetes.io/hostname   # "cùng chỗ" = cùng node
\`\`\`

Đọc ngược lại cho dễ nhớ: "đừng xếp tôi vào node (\`topologyKey\`) đã có pod mang label \`app=web\`".

⚠️ **Lỗi thường gặp:** (1) \`required\` anti-affinity với **replicas nhiều hơn số node** → các pod thừa \`Pending\` vĩnh viễn — cluster 2 worker mà đòi 3 replica tách node là kẹt; đổi sang \`preferred\` nếu đề cho phép. (2) Quên \`topologyKey\` hoặc dùng nhầm label của node cho \`labelSelector\` — selector ở đây luôn match POD.`,
      },
      {
        id: "cka-w4-4",
        text: "Manual scheduling: `spec.nodeName` (bypass scheduler)",
        lesson: `Bình thường bạn lên máy bay với vé chưa có ghế, quầy check-in (scheduler) sẽ xếp chỗ. **\`spec.nodeName\`** là tấm vé **in sẵn số ghế**: bỏ qua hoàn toàn quầy check-in, đi thẳng đến chỗ ngồi.

Bản chất kỹ thuật: công việc của scheduler thực ra chỉ là... **điền \`nodeName\`** vào Pod (qua thao tác binding). Nếu bạn tự điền field này ngay từ YAML, kubelet trên node đó thấy Pod thuộc về mình và chạy luôn — **scheduler không tham gia**. Hệ quả quan trọng mức admin: mọi kiểm tra của scheduler bị bỏ qua — taint \`NoSchedule\`, node affinity, thậm chí node hết tài nguyên theo requests cũng không cản được (riêng taint \`NoExecute\` vẫn đuổi được vì cơ chế đó chạy sau khi Pod đã lên node). Đây chính là "lối thoát hiểm" khi kube-scheduler chết mà bạn vẫn cần chạy Pod gấp.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: manual-pod
spec:
  nodeName: node01        # gán thẳng node — KHÔNG qua scheduler
  containers:
  - name: app
    image: nginx
\`\`\`

\`\`\`bash
k apply -f manual-pod.yaml
k get pod manual-pod -o wide     # cột NODE phải là node01
# So sánh: pod thường có event "Scheduled" từ default-scheduler
k describe pod manual-pod | grep -A3 Events
\`\`\`

Lưu ý: \`nodeName\` là field **bất biến** — không sửa được trên Pod đang tồn tại; muốn đổi node phải xóa tạo lại. Static pod (bài sau) cũng tương tự tinh thần này: kubelet tự quản, không cần scheduler.

⚠️ **Lỗi thường gặp:** (1) Gõ **sai tên node** → Pod treo \`Pending\` vĩnh viễn và **không có event nào** (chẳng controller nào nhận trách nhiệm) — rất khó debug nếu không nhớ đặc điểm này; kiểm tra tên bằng \`k get nodes\` trước. (2) Dùng \`nodeName\` xong quên rằng resource requests không được kiểm tra — node có thể quá tải, Pod bị OOMKilled sau đó.`,
      },
      {
        id: "cka-w4-5",
        text: "Khi scheduler chết: pod Pending; static pod vẫn chạy",
        lesson: `Tưởng tượng quầy lễ tân xếp phòng của khách sạn **nghỉ việc đột xuất**: khách mới đến ôm vali đứng chờ ở sảnh (Pod mới → \`Pending\`), nhưng khách đã nhận phòng vẫn sinh hoạt bình thường (Pod đang chạy **không bị ảnh hưởng**). Riêng nhân viên trực của từng tầng (**static pod**) có chìa khóa do quản gia tầng đó (kubelet) tự cấp — không cần qua lễ tân, nên vẫn ra vào bình thường.

Kỹ thuật: \`kube-scheduler\` chạy dưới dạng **static pod** từ \`/etc/kubernetes/manifests/kube-scheduler.yaml\`. Khi nó chết:

- Pod mới tạo nằm \`Pending\`, \`k get pod -o wide\` cho thấy NODE là \`<none>\`, và \`k describe pod\` **không có event "Scheduled"** — dấu hiệu nhận diện quan trọng.
- Deployment/ReplicaSet vẫn **tạo** được Pod (việc của controller-manager) — chỉ là không ai gán node.
- Static pod vẫn chạy vì kubelet đọc manifest trực tiếp từ đĩa, hoàn toàn không qua scheduler.

\`\`\`bash
# Mô phỏng scheduler chết (trên control plane):
mv /etc/kubernetes/manifests/kube-scheduler.yaml /root/

# Quan sát: pod mới sẽ Pending, không có event Scheduled
k run victim --image=nginx
k get pod victim -o wide          # NODE: <none>
k get pods -n kube-system | grep scheduler   # scheduler biến mất

# Khôi phục: trả manifest về chỗ cũ, kubelet tự chạy lại
mv /root/kube-scheduler.yaml /etc/kubernetes/manifests/
k get pod victim -o wide          # sau ~30s: đã được gán node
\`\`\`

Cách chữa cháy khi cần Pod chạy gấp lúc scheduler chưa hồi: gán tay \`spec.nodeName\` (bài trước).

⚠️ **Lỗi thường gặp:** (1) Trả manifest về rồi **verify ngay** — kubelet quét thư mục theo chu kỳ, hãy chờ 30–60 giây rồi mới kết luận. (2) Thấy pod \`kube-scheduler-controlplane\` lỗi mà đi \`kubectl delete pod\` — vô ích, static pod bị xóa sẽ được kubelet tạo lại nguyên trạng; muốn sửa phải **sửa file manifest** trên node.`,
      },
      {
        id: "cka-w4-6",
        text: "`kubectl cordon` / `drain` / `uncordon`",
        lesson: `Bảo trì một node giống **đóng cửa một sảnh khách sạn để sửa chữa**. \`cordon\` là treo biển "ngừng nhận khách mới" — khách đang ở **vẫn ở nguyên**, chỉ là không xếp thêm ai vào. \`drain\` mạnh hơn: treo biển **rồi mời toàn bộ khách chuyển sang tòa khác** để thợ vào làm việc. Xong việc, \`uncordon\` gỡ biển — nhưng khách cũ **không tự động quay lại**.

Chi tiết kỹ thuật đáng nhớ:

- \`cordon\` đặt \`spec.unschedulable: true\` và node được taint \`node.kubernetes.io/unschedulable:NoSchedule\`. Trạng thái hiện ra là \`Ready,SchedulingDisabled\`.
- \`drain\` = cordon + **evict** từng Pod (tôn trọng PodDisruptionBudget). Pod thuộc Deployment/ReplicaSet sẽ được controller tạo lại ở node khác.
- DaemonSet pod **không evict được** (nó sinh ra để bám node) → phải thêm \`--ignore-daemonsets\`.
- Pod "mồ côi" (tạo trực tiếp, không có controller) cần \`--force\` — và sẽ **mất luôn**, không ai tạo lại.
- Pod dùng \`emptyDir\` cần \`--delete-emptydir-data\` — chấp nhận mất dữ liệu tạm.

\`\`\`bash
# Quy trình bảo trì chuẩn:
k drain node01 --ignore-daemonsets --delete-emptydir-data
k get nodes                     # node01: Ready,SchedulingDisabled
k get pods -o wide -A           # pod đã dồn sang node khác

# ... bảo trì node (upgrade kubelet, restart...) ...

k uncordon node01               # mở cửa lại
k get nodes                     # node01: Ready
\`\`\`

Đây là thao tác bắt buộc trong quy trình **cluster upgrade** (Tuần 3): drain → upgrade kubelet → uncordon, từng node một.

⚠️ **Lỗi thường gặp:** (1) Chạy \`drain\` không kèm \`--ignore-daemonsets\` khi node có DaemonSet → lệnh **từ chối chạy** — đọc thông báo lỗi, nó gợi ý sẵn flag. (2) Tưởng \`uncordon\` sẽ kéo Pod cũ về node — không hề; muốn cân bằng lại phải \`k rollout restart deploy\` hoặc xóa Pod để chúng được xếp lại.`,
      },
      {
        id: "cka-w4-7",
        text: "DaemonSets — vì sao chạy được trên mọi node",
        lesson: `DaemonSet giống chính sách **"mỗi tầng đúng một nhân viên vệ sinh"**: tòa nhà xây thêm tầng, công ty tự cử thêm người; dỡ tầng nào, rút người tầng đó. Và vì mang "giấy phép đặc biệt", nhân viên này vào được cả tầng đang treo biển cấm. Đó chính là cách kube-proxy, CNI plugin (flannel/calico) và log agent phủ kín mọi node.

Vì sao DaemonSet "lách" được các rào cản mà Pod thường bị chặn? Hai cơ chế:

- DaemonSet controller tạo Pod **cho từng node cụ thể** (gắn node affinity trỏ đích danh node), rồi default scheduler xếp như bình thường.
- Quan trọng hơn: mỗi Pod được **tự động thêm tolerations** cho loạt taint hệ thống — \`node.kubernetes.io/not-ready\`, \`unreachable\`, \`disk-pressure\`, \`memory-pressure\`, \`pid-pressure\` và cả \`unschedulable\`. Nhờ toleration cuối cùng, DaemonSet pod chạy được **cả trên node đã cordon** — và đây cũng là lý do \`drain\` cần \`--ignore-daemonsets\`.

Muốn phủ cả control plane, phải **tự thêm** toleration cho taint của nó:

\`\`\`yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: log-agent
spec:
  selector:
    matchLabels: { app: log-agent }
  template:
    metadata:
      labels: { app: log-agent }
    spec:
      tolerations:                 # để chạy cả trên control plane
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
      containers:
      - name: agent
        image: fluentd
\`\`\`

Mẹo phòng thi (không có lệnh imperative cho DaemonSet): \`k create deploy log-agent --image=fluentd $do > ds.yaml\` → đổi \`kind: DaemonSet\`, **xóa \`replicas\` và \`strategy\`**.

⚠️ **Lỗi thường gặp:** (1) Convert từ Deployment mà quên xóa \`replicas\`/\`strategy\` → apply báo lỗi field không hợp lệ. (2) Thắc mắc "sao DaemonSet không chạy trên master" — thiếu toleration control-plane; kiểm tra \`k describe node | grep -i taint\` rồi đối chiếu tolerations.`,
      },
      {
        id: "cka-w4-8",
        text: "PriorityClass & ảnh hưởng của resource requests tới scheduling",
        lesson: `Hãy nghĩ về **phòng cấp cứu**: bệnh nhân nguy kịch (priority cao) được khám trước; hết giường thì bệnh nhân nhẹ thậm chí bị "mượn" giường (**preemption** — Pod ưu tiên thấp bị evict nhường chỗ). Còn **resource requests** là mức **đặt cọc giường**: bệnh viện xếp giường theo số đã đặt cọc, không theo việc bệnh nhân thực tế nằm chiếm bao nhiêu.

**PriorityClass** là object **cluster-scoped**: \`value\` càng lớn, ưu tiên càng cao. Kubernetes có sẵn hai class hệ thống \`system-cluster-critical\` và \`system-node-critical\` (~2 tỷ) cho các thành phần sống còn. Pod tham chiếu qua \`spec.priorityClassName\`. Khai \`globalDefault: true\` để áp cho mọi Pod không ghi gì; \`preemptionPolicy: Never\` cho phép xếp hàng trước nhưng **không đuổi ai**.

Về requests: scheduler tính \`allocatable − tổng requests\` của node — **hoàn toàn không nhìn usage thực tế**. Node "trông rảnh" trên \`k top nodes\` vẫn có thể từ chối Pod vì tổng đặt cọc đã kín.

\`\`\`yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority
value: 100000              # số càng lớn càng ưu tiên
globalDefault: false
description: "Cho workload quan trọng"
---
apiVersion: v1
kind: Pod
metadata:
  name: vip-pod
spec:
  priorityClassName: high-priority
  containers:
  - name: app
    image: nginx
    resources:
      requests:            # scheduler xếp node dựa trên con số này
        cpu: 100m
        memory: 128Mi
\`\`\`

\`\`\`bash
k get priorityclass                      # xem cả class hệ thống
k get pod vip-pod -o jsonpath='{.spec.priority}'   # value đã gán
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Debug Pod \`Pending\` bằng \`k top nodes\` thấy CPU thấp rồi kết luận "đủ chỗ mà?" — phải xem \`k describe node\` mục **Allocated resources** (tổng requests) mới đúng bản chất. (2) Tự đặt \`value\` cao hơn cả class hệ thống → Pod của bạn có thể **preempt nhầm thành phần cluster**, gây sự cố dây chuyền.`,
      },
    ],
  },
  {
    id: "cka-w5",
    week: "Tuần 5",
    title: "Storage",
    goal: "Nắm dynamic provisioning — domain 10% nhưng dễ ăn điểm.",
    practice:
      "Tạo StorageClass + PVC không chỉ định PV → quan sát dynamic provisioning (minikube có sẵn provisioner).",
    resources: [
      { label: "Lab 05 — PersistentVolume, PVC và mount vào Pod", href: "#/labs/lab05" },
      { label: "CKA Cheat Sheet — StorageClass & Dynamic Provisioning", href: "#/docs/cka-cheat-sheet" },
      {
        label: "K8s Docs — Storage Classes",
        href: "https://kubernetes.io/docs/concepts/storage/storage-classes/",
      },
      {
        label: "K8s Docs — Persistent Volumes",
        href: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/",
      },
    ],
    items: [
      {
        id: "cka-w5-1",
        text: "Ôn PV/PVC, accessModes, reclaim policies",
        lesson: `Ôn lại mô hình thuê kho: **PersistentVolume (PV)** là **căn kho có sẵn của tòa nhà** — tài sản chung, **cluster-scoped**, thường do admin chuẩn bị. **PersistentVolumeClaim (PVC)** là **đơn xin thuê kho** của một phòng ban — **namespaced**, do dev viết. Kubernetes làm mai: đơn nào khớp kho nào (đủ dung lượng, đúng kiểu ra vào, cùng \`storageClassName\`) thì ký hợp đồng **1-1** — trạng thái \`Bound\`.

**accessModes** — kiểu ra vào của kho:

- \`ReadWriteOnce\` (RWO) — **một node** mount đọc-ghi (chú ý: tính theo NODE, không phải pod).
- \`ReadOnlyMany\` (ROX) — nhiều node cùng mount chỉ-đọc.
- \`ReadWriteMany\` (RWX) — nhiều node đọc-ghi (cần storage hỗ trợ, vd NFS).
- \`ReadWriteOncePod\` (RWOP) — đúng **một pod** duy nhất trong cả cluster (GA từ 1.29).

**persistentVolumeReclaimPolicy** — số phận kho khi người thuê trả (xóa PVC):

- \`Retain\` — giữ nguyên kho lẫn đồ đạc; PV chuyển sang \`Released\` (bài cuối tuần này).
- \`Delete\` — xóa cả PV lẫn storage phía sau; đây là mặc định của PV sinh từ dynamic provisioning.

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: pv-data
spec:
  capacity:
    storage: 1Gi
  accessModes: ["ReadWriteOnce"]
  persistentVolumeReclaimPolicy: Retain
  hostPath:
    path: /mnt/data          # chỉ dùng để học/lab
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: pvc-data
spec:
  accessModes: ["ReadWriteOnce"]   # phải khớp PV
  resources:
    requests:
      storage: 500Mi               # <= capacity của PV là khớp
\`\`\`

Verify: \`k get pv,pvc\` — cả hai phải \`Bound\` và trỏ vào nhau.

⚠️ **Lỗi thường gặp:** (1) PVC \`Pending\` dù có PV dung lượng thừa — thủ phạm thường là **lệch accessModes hoặc storageClassName**; \`k describe pvc\` để xem lý do. (2) Hiểu nhầm RWO là "một pod": hai pod trên **cùng một node** vẫn mount chung được volume RWO.`,
      },
      {
        id: "cka-w5-2",
        text: "StorageClass & dynamic provisioning; `volumeBindingMode: WaitForFirstConsumer`",
        lesson: `**StorageClass** là **dịch vụ kho tự động cấp theo yêu cầu**: thời "thủ công", admin phải xây sẵn từng căn kho (PV tĩnh) rồi chờ người thuê; với StorageClass, khách chỉ cần nộp đơn (PVC) ghi tên gói dịch vụ — hệ thống **tự xây kho đúng cỡ** ngay khi cần. Đó là **dynamic provisioning**, phần "dễ ăn điểm" của domain Storage.

Các field then chốt:

- \`provisioner\` — "nhà thầu" thực thi: \`ebs.csi.aws.com\` (AWS), \`k8s.io/minikube-hostpath\` (minikube)... Đặc biệt \`kubernetes.io/no-provisioner\` nghĩa là **KHÔNG dynamic** — dùng cho local volume, PV vẫn phải tạo tay.
- \`reclaimPolicy\` — mặc định \`Delete\` cho PV sinh tự động.
- \`volumeBindingMode\` — thời điểm "xây kho": \`Immediate\` = provision + bind ngay khi PVC ra đời; \`WaitForFirstConsumer\` = **chờ Pod đầu tiên mount** mới làm. Chờ để làm gì? Để biết Pod bị xếp lên node/zone nào rồi tạo volume **đúng chỗ đó** — bắt buộc với local volume và ổ đĩa theo zone trên cloud.

\`\`\`yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast
provisioner: k8s.io/minikube-hostpath   # lab minikube; cloud thì vd ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer # chờ pod dùng mới provision + bind
reclaimPolicy: Delete
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: claim-fast
spec:
  storageClassName: fast     # chỉ cần trỏ tên SC — KHÔNG cần PV có sẵn
  accessModes: ["ReadWriteOnce"]
  resources:
    requests:
      storage: 1Gi
\`\`\`

Quan sát: \`k get pvc\` — với \`WaitForFirstConsumer\`, PVC nằm \`Pending\` kèm event "waiting for first consumer"; tạo Pod mount nó là PV tự sinh và cả hai \`Bound\`.

⚠️ **Lỗi thường gặp:** (1) Thấy PVC \`Pending\` với SC \`WaitForFirstConsumer\` rồi lao vào "debug" — đó là **hành vi đúng thiết kế**, chỉ cần một Pod dùng nó. (2) Dùng SC \`no-provisioner\` mà mong PV tự xuất hiện — không bao giờ; loại này chỉ dùng để trì hoãn binding cho PV local tạo tay.`,
      },
      {
        id: "cka-w5-3",
        text: "Default StorageClass (annotation)",
        lesson: `Default StorageClass giống **quầy phục vụ mặc định** ở căng-tin: phiếu ăn nào không ghi tên quầy sẽ tự động được chuyển tới quầy này. Cụ thể: PVC **không khai** \`storageClassName\` sẽ được admission plugin \`DefaultStorageClass\` tự điền tên SC mặc định vào lúc tạo.

Cách đánh dấu là một **annotation** (điểm hay ra hỏi):

- \`storageclass.kubernetes.io/is-default-class: "true"\`

SC mặc định hiển thị hậu tố \`(default)\` trong \`k get sc\`. Trên minikube, SC \`standard\` có sẵn cờ này — vì thế mọi PVC "trơn" đều tự có PV.

Phân biệt ba trường hợp của PVC — bẫy kinh điển:

- **Không có field** \`storageClassName\` → dùng SC mặc định (nếu có).
- \`storageClassName: "fast"\` → dùng đúng SC tên đó.
- \`storageClassName: ""\` (**chuỗi rỗng**) → **từ chối mọi SC**, chỉ bind với PV tĩnh không có class — hoàn toàn khác "không có field"!

\`\`\`bash
# Xem SC nào đang là default
k get sc

# Đặt SC "fast" làm default
k patch sc fast -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

# Gỡ cờ default khỏi SC cũ (nên chỉ giữ MỘT default)
k patch sc standard -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'

k get sc     # xác nhận: chỉ một dòng có (default)
\`\`\`

Nếu lỡ có **nhiều** SC cùng gắn cờ default, các bản Kubernetes gần đây chọn SC **được tạo mới nhất** — nhưng đây là tình huống nên tránh vì khó đoán, hãy giữ đúng một default.

⚠️ **Lỗi thường gặp:** (1) Nhầm \`storageClassName: ""\` với việc bỏ trống field — chuỗi rỗng nghĩa là "không dùng dynamic provisioning", PVC sẽ Pending nếu không có PV tĩnh khớp. (2) Đổi default SC rồi mong PVC **đã tạo trước đó** đổi theo — không: field đã được điền cứng vào PVC ngay lúc tạo, muốn đổi phải tạo lại PVC.`,
      },
      {
        id: "cka-w5-4",
        text: "Mở rộng PVC (allowVolumeExpansion)",
        lesson: `Mở rộng PVC giống **cơi nới căn kho đang thuê**: được phép xây rộng thêm, nhưng **không được thu nhỏ** — đồ đạc đã chất đầy, co lại là mất dữ liệu, nên Kubernetes cấm hẳn chiều giảm.

Điều kiện tiên quyết: StorageClass của PVC phải bật \`allowVolumeExpansion: true\` và CSI driver phía dưới hỗ trợ resize. Khi đủ điều kiện, thao tác chỉ là **sửa \`spec.resources.requests.storage\` của PVC** lên con số lớn hơn — bằng \`k edit\` hoặc \`k patch\`. Không tạo PVC mới, không đụng vào PV.

Diễn biến phía sau gồm hai bước: mở rộng volume ở storage backend, rồi **mở rộng filesystem** bên trong. Với nhiều driver, bước hai chỉ hoàn tất khi volume đang được Pod mount (online resize) hoặc khi Pod khởi động lại — trong lúc chờ, PVC mang condition \`FileSystemResizePending\`. Chỉ khi xong, \`status.capacity\` mới nhảy lên số mới — đừng hoảng khi thấy spec và status lệch nhau tạm thời.

\`\`\`bash
# 0. Kiểm tra SC có cho phép mở rộng không
k get sc fast -o jsonpath='{.allowVolumeExpansion}'    # phải là true

# 1. Nới PVC từ 1Gi lên 2Gi
k patch pvc claim-fast -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'

# 2. Theo dõi tiến trình
k describe pvc claim-fast      # xem Conditions / Events
k get pvc claim-fast           # cột CAPACITY đổi khi resize xong
\`\`\`

Với đề thi, câu hỏi thường chỉ dừng ở: sửa SC thêm \`allowVolumeExpansion: true\` (field **nằm ở cấp cao nhất** của SC, ngang hàng \`provisioner\`) và patch PVC.

⚠️ **Lỗi thường gặp:** (1) Patch **giảm** dung lượng → API từ chối thẳng: "field can not be less than previous value" — không có cách shrink hợp lệ. (2) SC chưa bật \`allowVolumeExpansion\` → lỗi Forbidden khi sửa PVC; sửa SC trước rồi mới patch PVC.`,
      },
      {
        id: "cka-w5-5",
        text: "hostPath vs local volume",
        lesson: `Cả hai đều là **cất đồ ngay trong một tòa nhà cụ thể** (đĩa của một node), khác nhau ở chỗ có "đăng ký địa chỉ" hay không. **hostPath** như giấu đồ trong phòng một tòa nhà mà **không ghi lại địa chỉ**: lần sau bị xếp sang tòa khác (Pod reschedule sang node khác) là ngơ ngác — thư mục trống trơn. **local volume** cũng cất trong tòa đó nhưng **có đăng ký địa chỉ** (\`nodeAffinity\` trên PV) để lễ tân (scheduler) luôn dẫn bạn về đúng tòa.

**hostPath**: khai trực tiếp trong \`pod.spec.volumes\`, mount một đường dẫn của node vào container. Hợp với DaemonSet cần đọc tài nguyên node (\`/var/log\`, socket của runtime) và môi trường lab. Nhược điểm mức admin: không ràng buộc scheduling, và là **lỗ hổng bảo mật** — Pod ghi thẳng vào filesystem node (Pod Security chuẩn \`restricted\` chặn hostPath).

**local**: là một **loại PV** hẳn hoi, **bắt buộc** khai \`nodeAffinity\`; đi cùng StorageClass \`kubernetes.io/no-provisioner\` + \`volumeBindingMode: WaitForFirstConsumer\` để scheduler cân nhắc "kho nằm ở node nào" ngay khi xếp Pod.

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: local-pv
spec:
  capacity:
    storage: 5Gi
  accessModes: ["ReadWriteOnce"]
  storageClassName: local-storage    # SC no-provisioner + WaitForFirstConsumer
  local:
    path: /mnt/disks/ssd1            # thư mục/ổ đĩa có thật trên node
  nodeAffinity:                      # BẮT BUỘC với local volume
    required:
      nodeSelectorTerms:
      - matchExpressions:
        - key: kubernetes.io/hostname
          operator: In
          values: ["node01"]         # kho nằm ở node01
\`\`\`

Pod dùng PVC trỏ SC này sẽ **tự được kéo về node01** — đó là khác biệt cốt lõi so với hostPath.

⚠️ **Lỗi thường gặp:** (1) Dùng hostPath cho Deployment nhiều replica → mỗi node một bản dữ liệu khác nhau, bug "lúc thấy file lúc không" tùy pod nào trả lời. (2) Tạo local PV **thiếu \`nodeAffinity\`** → API từ chối ngay lúc apply.`,
      },
      {
        id: "cka-w5-6",
        text: "Trạng thái PV: Available / Bound / Released — vì sao Released không bind lại được",
        lesson: `Vòng đời PV giống **phòng khách sạn**: \`Available\` — phòng trống sẵn sàng đón khách; \`Bound\` — đang có khách ở; \`Released\` — khách đã trả phòng (PVC bị xóa) nhưng **đồ đạc cũ còn nguyên, phòng chưa dọn** — lễ tân nhất quyết không xếp khách mới vào. Ngoài ra còn \`Failed\` khi việc thu hồi tự động gặp lỗi.

Vì sao \`Released\` **không bao giờ tự quay về** \`Available\`? Hai lý do:

- PV vẫn giữ \`spec.claimRef\` — "biên nhận" trỏ tới PVC cũ (kèm cả \`uid\`). Chừng nào biên nhận còn đó, không PVC mới nào bind được, kể cả PVC trùng tên (uid đã khác).
- Chủ đích an toàn dữ liệu: \`reclaimPolicy: Retain\` nghĩa là "giữ đồ của khách cũ" — Kubernetes không dám tự giao dữ liệu đó cho người thuê mới.

Quy trình tái sử dụng PV Released đúng chuẩn admin:

\`\`\`bash
# 1. Xem hiện trạng — PV Released, claimRef còn trỏ PVC cũ
k get pv
k get pv pv-data -o jsonpath='{.spec.claimRef.name}'

# 2. (Ngoài Kubernetes) backup / xóa dữ liệu cũ trên storage nếu cần

# 3. Gỡ "biên nhận" — PV lập tức trở về Available
k patch pv pv-data -p '{"spec":{"claimRef":null}}'
k get pv           # STATUS: Available

# 4. Tạo PVC mới → bind bình thường
\`\`\`

Đối chiếu với \`reclaimPolicy: Delete\` (mặc định của dynamic provisioning): xóa PVC là PV **và** storage phía sau biến mất luôn — không có trạng thái Released.

⚠️ **Lỗi thường gặp:** (1) Ngồi chờ PV \`Released\` "tự hồi" về Available — không bao giờ xảy ra, phải gỡ \`claimRef\` thủ công. (2) Gỡ \`claimRef\` mà **quên dọn dữ liệu** — người thuê mới mount lên đọc được toàn bộ dữ liệu của team cũ: sự cố rò rỉ dữ liệu thực thụ trong môi trường production.`,
      },
    ],
  },
  {
    id: "cka-w6",
    week: "Tuần 6",
    title: "Services & Networking (mức admin)",
    goal: "Debug được DNS và hiểu hạ tầng mạng bên dưới Service.",
    practice:
      "Sửa hỏng CoreDNS (scale về 0) → quan sát lỗi DNS → khôi phục. Tạo HTTPRoute với Gateway API trên lab.",
    resources: [
      { label: "Lab 19 — ClusterIP và NodePort", href: "#/labs/lab19" },
      { label: "Lab 20 — Ingress hai path", href: "#/labs/lab20" },
      { label: "Lab 21 — NetworkPolicy default-deny", href: "#/labs/lab21" },
      { label: "Lab 22 — Debug Service không có endpoints", href: "#/labs/lab22" },
      {
        label: "Gateway API — tài liệu chính thức",
        href: "https://gateway-api.sigs.k8s.io/",
      },
      {
        label: "K8s Docs — Debugging DNS Resolution",
        href: "https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/",
      },
    ],
    items: [
      {
        id: "cka-w6-1",
        text: "kube-proxy làm gì: iptables/ipvs mode",
        lesson: `ClusterIP của Service giống **số tổng đài ảo**: không có chiếc máy nào thật sự cầm số đó cả. **kube-proxy** là kỹ thuật viên đến **từng node** lập trình sẵn bảng chuyển hướng cuộc gọi — ai quay số tổng đài sẽ được nối thẳng tới máy của một nhân viên thật (Pod). Không có process nào "listen" trên ClusterIP; tất cả là **luật chuyển gói tin trong kernel**.

Kỹ thuật: kube-proxy chạy dưới dạng **DaemonSet trong \`kube-system\`**, watch Service + EndpointSlice từ API server, rồi ghi luật xuống kernel theo một trong hai mode (cấu hình trong ConfigMap \`kube-proxy\`):

- **iptables** (mặc định): sinh chuỗi \`KUBE-SERVICES\` → \`KUBE-SVC-*\` → \`KUBE-SEP-*\` trong bảng \`nat\`, thực hiện **DNAT** từ \`ClusterIP:port\` sang \`podIP:targetPort\`, chọn backend ngẫu nhiên theo xác suất.
- **ipvs**: dùng bảng băm trong kernel — tra cứu O(1), scale tốt khi có hàng nghìn Service, hỗ trợ nhiều thuật toán cân bằng (\`rr\`, \`lc\`...).

\`\`\`bash
# kube-proxy có chạy đủ trên các node không?
k get ds kube-proxy -n kube-system
k get pods -n kube-system -l k8s-app=kube-proxy -o wide

# Đang chạy mode nào?
k logs -n kube-system -l k8s-app=kube-proxy | grep -i "using"
k get cm kube-proxy -n kube-system -o yaml | grep mode

# Soi luật iptables mà một Service sinh ra (trên node)
iptables-save | grep my-service
\`\`\`

⚠️ **Lỗi thường gặp:** (1) \`ping\` vào ClusterIP không thấy trả lời rồi kết luận "mạng hỏng" — **bình thường**: luật DNAT chỉ áp cho TCP/UDP đúng port, còn IP thì ảo; hãy test bằng \`curl ip:port\`. (2) kube-proxy chết trên **một** node → chỉ Pod trên node đó gọi Service IP bị lỗi, trong khi gọi thẳng Pod IP vẫn thông — dấu hiệu vàng để khoanh vùng khi troubleshooting.`,
      },
      {
        id: "cka-w6-2",
        text: "CoreDNS: pod ở kube-system, ConfigMap `coredns`, debug khi DNS hỏng",
        lesson: `CoreDNS là **danh bạ nội bộ** của cluster: thay vì nhớ số máy lẻ (ClusterIP) của từng phòng ban, mọi Pod chỉ cần tra tên — \`db-service\` — và danh bạ trả về đúng số. Danh bạ này chết thì cả công ty gọi nhầm lung tung dù đường dây điện thoại (network) vẫn hoàn toàn bình thường.

Bản đồ triển khai phải thuộc:

- **Deployment \`coredns\`** (thường 2 replica) trong \`kube-system\`, pod mang label \`k8s-app=kube-dns\` (tên giữ lại từ thời kube-dns cũ — bẫy hay gặp khi grep).
- **Service \`kube-dns\`**, ClusterIP thường là \`.10\` của service CIDR (vd \`10.96.0.10\`).
- Cấu hình là file **Corefile** nằm trong **ConfigMap \`coredns\`** — sửa forward, log, rewrite ở đây.
- kubelet điền \`nameserver <ClusterIP kube-dns>\` vào \`/etc/resolv.conf\` của từng Pod, kèm search domain để \`db-service\` tự nở thành FQDN \`db-service.<ns>.svc.cluster.local\`.

Trình tự debug khi "app không gọi được service":

\`\`\`bash
# 1. CoreDNS có sống không? Có endpoint không?
k get pods -n kube-system -l k8s-app=kube-dns
k get endpoints kube-dns -n kube-system      # RỖNG = không pod nào phục vụ DNS

# 2. Test phân giải từ một pod (busybox 1.28 — bản mới nslookup lỗi)
k run tmp --image=busybox:1.28 --rm -it --restart=Never -- nslookup kubernetes.default

# 3. resolv.conf của pod có trỏ đúng ClusterIP kube-dns?
k exec tmp -- cat /etc/resolv.conf

# 4. Đọc log + config
k logs -n kube-system -l k8s-app=kube-dns
k get cm coredns -n kube-system -o yaml      # Corefile
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Dùng \`busybox:latest\` để nslookup — bản mới có bug trả kết quả sai/lỗi, luôn dùng \`busybox:1.28\`. (2) DNS chết nhưng \`curl\` thẳng vào ClusterIP vẫn chạy — đó là manh mối kết luận "lỗi ở DNS, không phải kube-proxy/network", đừng đi sửa nhầm tầng.`,
      },
      {
        id: "cka-w6-3",
        text: "CNI: config ở `/etc/cni/net.d/`, binary ở `/opt/cni/bin/`",
        lesson: `Khi kubelet "xây xong căn phòng" (tạo container), nó gọi **đội thi công điện nước** — CNI plugin — đến cấp ổ cắm và địa chỉ cho phòng: tạo cặp veth, gán **IP từ pod CIDR**, nối vào mạng chung của cluster. Không có đội thi công này, phòng xây xong vẫn là phòng tối: node báo \`NotReady\`, Pod mới kẹt \`ContainerCreating\`.

Hai đường dẫn phải thuộc lòng (hay ra trong câu troubleshooting):

- \`/etc/cni/net.d/\` — **file config** CNI (JSON/conflist). Container runtime chọn file **đầu tiên theo thứ tự alphabet**. Thư mục rỗng = "chưa thuê đội thi công" → kubelet log báo \`cni plugin not initialized\`.
- \`/opt/cni/bin/\` — **binary** các plugin (\`bridge\`, \`flannel\`, \`calico\`, \`host-local\`, \`loopback\`...) mà runtime sẽ gọi.

Các CNI phổ biến (Flannel/Calico/Cilium) chạy dưới dạng **DaemonSet** trong \`kube-system\`: pod agent trên mỗi node tự ghi file config và copy binary vào hai thư mục trên — vì thế "cài CNI" đơn giản là \`kubectl apply\` một manifest.

\`\`\`bash
# Khám bệnh node NotReady nghi do CNI:
ls /etc/cni/net.d/                      # rỗng? → thiếu config
ls /opt/cni/bin/                        # có đủ binary chưa?
journalctl -u kubelet | grep -i cni     # "cni plugin not initialized"?
k get pods -n kube-system -o wide       # pod flannel/calico trên node đó có Running?

# Cài Flannel (chú ý pod CIDR phải khớp lúc kubeadm init)
k apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
k get nodes      # chờ node chuyển Ready
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Flannel mặc định dùng \`10.244.0.0/16\` — nếu \`kubeadm init\` không truyền \`--pod-network-cidr=10.244.0.0/16\` (hoặc không sửa manifest Flannel cho khớp), pod mạng sẽ CrashLoop. (2) Hoảng khi node \`NotReady\` **ngay sau** \`kubeadm init\` — hoàn toàn bình thường: chưa cài CNI thì node chưa thể Ready.`,
      },
      {
        id: "cka-w6-4",
        text: "Ingress + IngressClass; cài ingress controller",
        lesson: `Ingress giống **tấm bảng chỉ dẫn ở cổng chính** tòa nhà: "/api → phòng A, /web → phòng B". Nhưng tấm bảng tự nó không dẫn ai đi cả — cần **nhân viên lễ tân** đứng đó đọc bảng và dắt khách: đó là **ingress controller**. Điểm mấu chốt mức admin: cluster chuẩn (kubeadm) **không có sẵn lễ tân** — Ingress resource tạo ra sẽ nằm im vô dụng cho đến khi bạn cài controller.

Ba mảnh ghép:

- **Ingress controller** (vd ingress-nginx) — cài bằng manifest hoặc Helm; bản chất là Deployment/DaemonSet + Service (thường \`NodePort\`/\`LoadBalancer\`) trong namespace riêng.
- **IngressClass** — "danh thiếp" của mỗi controller; khi cluster có nhiều controller, Ingress chọn qua \`spec.ingressClassName\`. IngressClass có thể được đánh dấu mặc định bằng annotation \`ingressclass.kubernetes.io/is-default-class: "true"\`.
- **Ingress** — rule định tuyến L7: host, path (\`Prefix\`/\`Exact\`), backend service + port; thêm \`tls\` với Secret type \`tls\` khi cần HTTPS.

\`\`\`bash
# Cài ingress-nginx (lab; trên minikube: minikube addons enable ingress)
k apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
k get pods -n ingress-nginx
k get ingressclass                    # phải thấy "nginx"

# Tạo Ingress bằng lệnh imperative — nhanh nhất trong phòng thi
k create ingress web-ing --class=nginx \\
  --rule="app.example.com/api*=api-svc:8080" \\
  --rule="app.example.com/*=web-svc:80"

k get ingress web-ing                 # chờ cột ADDRESS có giá trị
k describe ingress web-ing            # kiểm tra backend đã đúng service:port
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Tạo Ingress khi **chưa có controller** → cột ADDRESS trống mãi, rule không bao giờ hiệu lực — kiểm tra \`k get pods -n ingress-nginx\` trước khi debug rule. (2) Cluster có nhiều IngressClass nhưng Ingress **quên \`ingressClassName\`** và không class nào là default → không controller nào nhận xử lý, Ingress "mồ côi" trong im lặng.`,
      },
      {
        id: "cka-w6-5",
        text: "Gateway API: GatewayClass, Gateway, HTTPRoute",
        lesson: `Gateway API là **bản nâng cấp của Ingress**, tách vai trò như quy trình xây một **sân bay**: **GatewayClass** là mẫu thiết kế nhà ga do hãng hạ tầng cung cấp (nginx, istio, cilium...); **Gateway** là nhà ga thật được dựng lên — cổng, port, giao thức — do **admin hạ tầng** quản; **HTTPRoute** là bảng chỉ đường tới từng quầy — do **đội dev** của mỗi team tự gắn vào nhà ga. Ba object, ba chủ sở hữu, phân quyền RBAC rạch ròi — điều Ingress một-cục không làm được.

Kiến thức thi (curriculum CKA mới):

- API version chuẩn: \`gateway.networking.k8s.io/v1\` (đã GA cho GatewayClass, Gateway, HTTPRoute).
- Đây là **CRD phải cài riêng** — cluster chuẩn không có sẵn; sau đó cài controller (implementation) hỗ trợ.
- \`Gateway.spec.listeners[].allowedRoutes.namespaces.from\`: \`Same\` | \`All\` | \`Selector\` — quyết định Route ở namespace nào được gắn vào.
- HTTPRoute match phong phú hơn Ingress: path (\`PathPrefix\`/\`Exact\`), header, method, query — và chia tải theo \`weight\` giữa các \`backendRefs\` không cần annotation độc quyền.

\`\`\`yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: web-route
spec:
  parentRefs:
  - name: my-gateway          # gắn vào Gateway đã có (do admin dựng)
  hostnames: ["app.example.com"]
  rules:
  - matches:
    - path:
        type: PathPrefix      # PathPrefix | Exact
        value: /login
    backendRefs:
    - name: web-svc           # Service đích
      port: 80
\`\`\`

Verify: \`k get gatewayclass,gateway,httproute\` rồi \`k describe httproute web-route\` — nhìn mục \`status.parents\`: condition \`Accepted=True\` nghĩa là Gateway đã nhận Route.

⚠️ **Lỗi thường gặp:** (1) Apply báo \`no matches for kind "Gateway"\` — chưa cài CRD Gateway API; đây không phải lỗi YAML của bạn. (2) HTTPRoute nằm **khác namespace** với Gateway trong khi listener để \`allowedRoutes: from: Same\` → Route bị từ chối (\`Accepted=False\`); đọc status thay vì ngồi dò rule.`,
      },
      {
        id: "cka-w6-6",
        text: "NetworkPolicies (ôn từ CKAD)",
        lesson: `Mặc định, mọi phòng trong tòa nhà Kubernetes **mở cửa tự do** — Pod nào cũng gọi được Pod nào, xuyên cả namespace. **NetworkPolicy** như lắp **khóa từ**: Pod nào bị policy chọn (\`podSelector\`) lập tức "đóng cửa mặc định" theo chiều đã khai trong \`policyTypes\`, chỉ ai có thẻ (match rule) mới qua. Nhiều policy cùng chọn một Pod thì quyền được **cộng dồn** (union allow) — không có khái niệm deny rule.

Cấu trúc cần nhớ:

- \`podSelector\` — chọn Pod bị áp (rỗng \`{}\` = mọi Pod trong namespace).
- \`policyTypes: [Ingress, Egress]\` — chiều bị siết. Khai \`Ingress\` mà không có rule nào = **chặn toàn bộ chiều vào** (default-deny).
- Rule \`from\`/\`to\` nhận: \`podSelector\`, \`namespaceSelector\`, \`ipBlock\`.

Góc nhìn admin — điều CKAD ít nhấn: NetworkPolicy chỉ là **bản khai**, việc thực thi thuộc về **CNI plugin**. Calico/Cilium enforce đầy đủ; **Flannel thuần KHÔNG hỗ trợ** — policy apply thành công nhưng im lặng vô tác dụng, một cái bẫy rất khó chịu khi debug.

\`\`\`yaml
# Chỉ cho frontend gọi backend port 80 — mọi nguồn khác bị chặn
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
spec:
  podSelector:
    matchLabels: { app: backend }   # pod bị "đóng cửa"
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:
        matchLabels: { app: frontend }
    ports:
    - protocol: TCP
      port: 80
\`\`\`

Test nhanh: \`k run tmp --image=busybox:1.28 --rm -it --restart=Never -- wget -qO- --timeout=2 backend-svc\` từ pod có/không label \`app=frontend\`.

⚠️ **Lỗi thường gặp:** (1) Policy "không ăn" trên cluster Flannel — không phải bạn viết sai, là CNI không enforce. (2) Nhầm AND/OR trong \`from\`: hai phần tử list (hai dấu \`-\`) là **OR**; \`podSelector\` và \`namespaceSelector\` nằm **cùng một phần tử** mới là **AND** — thụt lề lệch một dấu gạch là đổi hẳn ngữ nghĩa.`,
      },
      {
        id: "cka-w6-7",
        text: "Port các thành phần: apiserver 6443, etcd 2379–2380, kubelet 10250, NodePort 30000–32767",
        lesson: `Bảng port của cluster giống **sơ đồ số phòng của tòa nhà**: admin phải thuộc để gõ đúng cửa khi debug và mở firewall đúng chỗ khi dựng cluster. Đây cũng là dạng kiến thức bị "gài" nhiều nhất trong câu troubleshooting kubeconfig.

Bản đồ port phải thuộc lòng:

- **6443** — kube-apiserver: cửa chính duy nhất; \`kubectl\`, kubelet, controller... tất cả nói chuyện với cluster qua đây; \`kubeadm join\` cũng trỏ về \`<master>:6443\`.
- **2379** — etcd nhận client (thực tế chỉ apiserver gọi); **2380** — etcd nói chuyện **peer với nhau** trong cụm HA.
- **10250** — kubelet API (HTTPS): apiserver gọi **vào** kubelet khi bạn chạy \`k logs\`/\`k exec\` — chiều đi "ngược" mà nhiều người không ngờ.
- **10257 / 10259** — controller-manager / scheduler (metrics, healthz, localhost).
- **30000–32767** — dải NodePort, mở trên **MỌI node**, không riêng node chứa Pod (kube-proxy chuyển tiếp hộ).

\`\`\`bash
# Trên control plane: ai đang listen port nào?
ss -tlnp | grep -E '6443|2379|2380|10250|10257|10259'

# apiserver còn sống? (bỏ qua verify cert bằng -k)
curl -k https://127.0.0.1:6443/livez

# Kubeconfig đang trỏ đi đâu? — chỗ đề thi hay gài số sai
k config view -o jsonpath='{.clusters[0].cluster.server}'
\`\`\`

Ứng dụng thực chiến: \`kubectl\` báo \`connection refused\` → nhìn ngay \`server:\` trong kubeconfig; \`k logs\`/\`k exec\` treo với một node → nghi firewall chặn 10250 từ control plane tới node đó; etcd HA lỗi đồng bộ → kiểm tra 2380 giữa các member.

⚠️ **Lỗi thường gặp:** (1) Bẫy kinh điển trong đề: kubeconfig ghi \`https://...:6433\` (đảo số) thay vì **6443** — mắt thường rất dễ lướt qua. (2) Tưởng NodePort chỉ truy cập được qua node đang chạy Pod — thực tế **mọi node** đều mở port đó; ngược lại, quên mở firewall dải 30000–32767 thì chẳng node nào vào được.`,
      },
    ],
  },
];
