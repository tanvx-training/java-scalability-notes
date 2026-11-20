// Chặng 8 — Vận hành cluster: bảo trì node, nâng cấp, etcd, chứng chỉ, HA.
// s41–s44 đã phát hành (đợt 4); s45 là buổi khung: đủ trường cấu trúc (check-data PR7), nội dung ở đợt sau.

export const sessions = [
// ───────────────────────────── s41 ─────────────────────────────
  {
    id: "s41",
    stage: "st8",
    title: "Bảo trì node: cordon, drain, PodDisruptionBudget",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-lifecycle"],
    requires: ["s40"],
    status: "published",
    pieces: [],
    goals: [
      "Drain cka-w1 trong khi một vòng 2 request/giây tới shop không nhận lỗi nào, rồi đưa node trở lại và trải Pod đều như cũ.",
      "Đặt PodDisruptionBudget cho gateway, catalog, order trong chart, và thấy drain dừng lại chờ khi PDB không cho phép đuổi Pod.",
      "Biết vì sao drain cần --ignore-daemonsets, khi nào cần --delete-emptydir-data, và Spring Boot tắt êm thế nào khi Pod bị đuổi.",
    ],
    skills: [
      { skill: "k-cordon", level: "Gõ được không tra" },
      { skill: "k-drain", level: "Gõ được không tra" },
      { skill: "k-uncordon", level: "Gõ được không tra" },
      { skill: "k-pdb-yaml", level: "Viết được có tra" },
      { skill: "k-create-pdb", level: "Gõ được không tra" },
      { skill: "k-node-maintenance-flow", level: "Dưới 3 phút" },
    ],
    uses: ["k-get-wide", "k-daemonset-yaml", "k-pod-antiaffinity", "net-curl-host", "k-helm-upgrade"],
    foundation: null,
    mindset: `**cordon, drain, uncordon là ba việc khác nhau.** \`k cordon cka-w1\` chỉ đặt \`spec.unschedulable: true\` (node mang taint \`node.kubernetes.io/unschedulable:NoSchedule\`): Pod đang chạy ở yên, Pod mới không được xếp lên. \`k drain cka-w1\` cordon rồi **đuổi** (evict) từng Pod trên node qua Eviction API; Deployment/StatefulSet thấy thiếu Pod và tạo Pod thay ở node khác. \`k uncordon cka-w1\` gỡ cờ; **không** kéo Pod nào về: Pod đã dời giữ nguyên chỗ mới cho tới khi bị thay (đo: sau uncordon, hai Pod gateway vẫn cùng nằm trên cka-w2 cho tới khi \`rollout restart\`).

Hai cờ của drain có lý do riêng:

| Cờ | Không có thì | Vì sao |
|---|---|---|
| \`--ignore-daemonsets\` | drain dừng: \`cannot delete DaemonSet-managed Pods\` | Pod của DaemonSet (calico-node, kube-proxy, \`log-agent\` của s15) được tạo lại **ngay trên chính node đó** (DaemonSet bỏ qua cờ unschedulable), đuổi đi là vô ích; cờ này nói "để chúng lại" |
| \`--delete-emptydir-data\` | drain dừng nếu có Pod dùng \`emptyDir\` | dữ liệu \`emptyDir\` mất khi Pod rời node; cờ là lời xác nhận bạn chấp nhận điều đó |
| \`--force\` | drain dừng với Pod trần (không controller) | Pod trần bị xoá là mất hẳn, không ai tạo lại. Pod trần đã \`Completed\` thì drain xoá không cần cờ (đo: \`report-once\` trên cka-w2 ở s42) |

**Eviction tôn trọng PodDisruptionBudget, xoá thì không.** PDB nói "lúc nào cũng phải còn ít nhất \`minAvailable\` Pod Ready của nhóm này" (hay "thiếu tối đa \`maxUnavailable\`"). Mỗi lần drain gửi một Eviction, apiserver tính \`ALLOWED DISRUPTIONS\` = số Pod khoẻ − \`minAvailable\`; bằng 0 thì trả \`429\` và drain in \`Cannot evict pod as it would violate the pod's disruption budget\`, đợi 5 giây rồi thử lại, mãi (đo, với \`--timeout=45s\`: dừng sau 49 giây, \`global timeout reached\`). PDB chỉ chặn **gián đoạn tự nguyện** (drain, eviction của autoscaler); node chết, OOM, \`k delete pod\` không hỏi PDB. Ba lỗi hay gặp: \`minAvailable\` bằng số replica (drain treo mãi, đúng tình huống hỏng của buổi), PDB cho Deployment 1 replica với \`minAvailable: 1\` (không bao giờ drain được), và selector không khớp nhãn Pod (PDB vô hiệu, \`ALLOWED DISRUPTIONS\` = 0 với 0 Pod).

**Không mất request cần cả bốn thứ.** (1) Ít nhất 2 replica, (2) trải trên hai worker (nếu cả hai nằm cùng node thì drain node đó vẫn đuổi được Pod thứ nhất, nhưng lúc Pod thứ hai bị đuổi thì Pod thay của Pod thứ nhất có thể chưa Ready), (3) PDB \`minAvailable: 1\` để drain đuổi từng Pod một và chờ, (4) Pod tắt êm. Chart 0.2.0 của buổi lo (1)–(3) bằng values: \`order.replicas: 2\`, \`pdb.minAvailable: 1\` mỗi service, \`spread\` sinh \`topologySpreadConstraints\`:

\`\`\`yaml
topologySpreadConstraints:
- maxSkew: 1                         # hai node lệch nhau tối đa 1 Pod
  topologyKey: kubernetes.io/hostname
  whenUnsatisfiable: DoNotSchedule
  nodeTaintsPolicy: Honor            # node có taint Pod không chịu (control plane, node đang cordon) không tính
  matchLabelKeys: [pod-template-hash]  # đếm riêng từng ReplicaSet: rollout trải Pod mới đều
  labelSelector: {matchLabels: {app: order}}
\`\`\`

\`nodeTaintsPolicy: Honor\` quan trọng lúc drain: không có nó, cka-cp (taint control-plane) và cka-w1 (đang cordon) vẫn được tính là miền có 0 Pod, nên Pod thay trên cka-w2 làm lệch 2 và bị \`DoNotSchedule\` chặn. Với nó, chỉ còn cka-w2 là miền, Pod thay xếp được nếu đủ RAM. \`podAntiAffinity\` \`preferred\` (catalog có từ s19) chỉ là "nên", không đảm bảo hai node.

**RAM khi drain (đo).** Sau khi thêm replica thứ hai của order: \`free -m\` available cka-w1 624, cka-w2 725 MB. Drain cka-w1 dồn Pod sang cka-w2 tới khi hết chỗ theo **requests** (256Mi mỗi service): vài Pod lên được, phần còn lại \`Pending\` (\`Insufficient memory\`) cho tới khi uncordon; cka-w2 còn 370 MB (lần làm tay, \`free -m\` trên cka-w2 ngay sau drain). Pending không làm mất request: Pod còn lại trên cka-w2 vẫn phục vụ, và PDB đã đảm bảo nó Ready trước khi Pod kia bị đuổi. Lab không hạ requests để mọi Pod chen lên một node: requests thấp mà RAM thật vẫn 170Mi mỗi Pod thì node bị OOM, tệ hơn Pending.

**Drain dồn Pod sang worker còn lại: PriorityClass quyết định ai bị đá.** gateway chạy bằng PriorityClass \`shop-critical\` (100000, \`PreemptLowerPriority\`, s19). Một lần đo của buổi, khi catalog, order, postgres còn priority 0: Pod thay của gateway không đủ chỗ trên cka-w2 nên scheduler **preempt** Pod ưu tiên thấp hơn ở đó, đúng \`postgres-0\` và catalog của \`shop-dev\` (\`Preempted by pod 92d3dc83-… on node cka-w2\`, đo). postgres-0 mới không có chỗ (\`Insufficient memory\`, priority 0 nên không preempt lại được), catalog và order mất database, vòng request 51/75 lỗi, và drain treo ở \`catalog-pdb\` vì Pod catalog còn lại không Ready nữa. PDB không ngăn được: preemption chỉ **cố** tránh vi phạm PDB. Sửa: mọi Pod trên đường phục vụ cùng mức ưu tiên với gateway: chart 0.2.0 đặt \`priorityClassName: shop-critical\` cho catalog và order (values \`priorityClassName\`), \`~/shop/postgres.yaml\` (s24) thêm dòng đó cho StatefulSet rồi \`k apply\` (postgres-0 khởi động lại một lần, trước khi chạy vòng request). Sau đó Pod thay chỉ \`Pending\` với \`Preemption is not helpful for scheduling\` và vòng request 0 lỗi (đo). Lúc rollout đổi priority, Pod catalog/order mới cũng preempt Pod cũ priority 0 của chính Deployment đó trên cka-w2 (đo: \`catalog-6c6bbc46f-r4x6j: Preempted by pod …\`); làm bước này khi chưa chạy vòng request.

**Pod tắt êm: Kubernetes và Spring Boot cùng làm.** Khi bị đuổi, Pod chuyển sang Terminating; cùng lúc (không theo thứ tự) kubelet chạy \`preStop\` và EndpointSlice gỡ Pod khỏi Service, kube-proxy trên mọi node xoá rule. \`preStop: sleep 10\` của chart giữ container nhận request thêm 10 giây, đủ cho kube-proxy cập nhật. Sau đó kubelet gửi \`SIGTERM\`; Spring Boot với \`server.shutdown: graceful\` ngừng nhận kết nối mới, chờ request đang chạy xong (tối đa \`spring.lifecycle.timeout-per-shutdown-phase: 20s\`), rồi đóng. \`terminationGracePeriodSeconds: 45\` là trần cho **cả** preStop + tắt: 10 + 20 < 45, nên kubelet không phải \`SIGKILL\`. Giống \`@PreDestroy\` và \`SmartLifecycle.stop()\` trong Spring: Kubernetes chỉ cho bạn thời gian, ứng dụng phải tự dùng nó. Thiếu \`preStop\` thì vài request rơi vào Pod đã nhận \`SIGTERM\` (connection refused); thiếu graceful shutdown thì request đang chạy bị cắt ngang.`,
    refs: [
      { label: "Bài lộ trình CKA: Cluster upgrade với kubeadm, drain/uncordon", href: "#/roadmap/cka/cka-w3-4" },
      { label: "CKA Study Guide, chương 4 — Cài đặt và nâng cấp cluster (drain, uncordon)", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Safely Drain a Node", href: "https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/" },
      { label: "kubernetes.io: Specifying a Disruption Budget for your Application", href: "https://kubernetes.io/docs/tasks/run-application/configure-pdb/" },
      { label: "kubernetes.io: Disruptions (tự nguyện và không tự nguyện)", href: "https://kubernetes.io/docs/concepts/workloads/pods/disruptions/" },
      { label: "kubernetes.io: Pod Topology Spread Constraints (nodeTaintsPolicy, matchLabelKeys)", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/" },
      { label: "kubernetes.io: Pod lifecycle — Termination of Pods", href: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination" },
      { label: "Spring Boot: Graceful Shutdown", href: "https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html" },
    ],
    stateIn: "Đầu ra s40 (cluster 1.36.6): release shop chart 0.1.0, gateway và catalog 2 replica, order 1 replica, chưa có PDB. `./labs/lab begin cka s41` kiểm đầu vào bằng check.sh riêng (release shop deployed với javaOpts và order 2.0 như cuối s37, release demo, demo-canary đã gỡ, đáp án s40: những gì buổi này không được đổi) và đặt vòng request ~/drills/s41/loop.sh.",
    stateOut: "Release shop chart 0.2.0: order 2 replica; gateway, catalog, order trải theo topologySpreadConstraints, mỗi service một Pod Ready trên cka-w1 và một trên cka-w2; PDB gateway-pdb, catalog-pdb, order-pdb (minAvailable 1) trong chart; catalog, order, postgres-0 dùng PriorityClass shop-critical như gateway (postgres qua ~/shop/postgres.yaml); ~/drills/s41/loop.log ghi một vòng drain/uncordon cka-w1 với 0 request lỗi; cka-w1 Ready, schedulable.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s41`. Trên cka-cp: `k get pod -o wide -l 'app in (gateway,catalog,order)'`, `k get pdb`. Mỗi service có mấy replica, nằm trên node nào? Nếu drain cka-w1 bây giờ thì service nào chắc chắn mất request? Đọc `~/drills/s41/loop.sh` (phần đầu tệp) để biết nó ghi gì.",
      },
      {
        id: "t2",
        text: "Viết PDB: `k create pdb order-pdb --selector=app=order --min-available=1 $do` để lấy khung YAML, rồi đưa nó vào chart thành `~/charts/shop/templates/pdb.yaml` lặp cho gateway, catalog, order với `{{ .Values.<service>.pdb.minAvailable }}`. values.yaml: `order.replicas: 2`, `pdb.minAvailable: 1` cho ba service, khối `spread` và `topologySpreadConstraints` như phần Tư duy (helper trong `_helpers.tpl`, gọi trong ba Deployment). Tăng `version` trong Chart.yaml lên `0.2.0`. `helm template shop ~/charts/shop -n shop | grep -A8 PodDisruptionBudget` để xem trước.",
      },
      {
        id: "t3",
        text: "Trước khi upgrade: `k get priorityclass`, `k get deploy gateway -o jsonpath='{.spec.template.spec.priorityClassName}'`, và cùng câu đó cho catalog, order, `sts/postgres`. Thêm `priorityClassName: shop-critical` vào pod template của StatefulSet trong `~/shop/postgres.yaml` (ngay trên `nodeSelector`), `k apply -f ~/shop/postgres.yaml`, `k rollout status sts/postgres`; trong values.yaml của chart đặt `priorityClassName: shop-critical` và dùng nó trong template của catalog, order. Rồi `helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait`. `k get pdb` (cột ALLOWED DISRUPTIONS), `k get pod -o wide -l 'app in (gateway,catalog,order)'`: mỗi service có một Pod trên mỗi worker chưa? Đo RAM: `free -m` trên cka-w1, cka-w2 (`ssh cka-w1 free -m`), `k describe node cka-w2 | grep -A8 'Allocated resources'`.",
      },
      {
        id: "t4",
        text: "Tình huống hỏng (cố ý): đặt `order.pdb.minAvailable: 2`, upgrade lại, `k get pdb order-pdb` (ALLOWED DISRUPTIONS bằng mấy?). `~/drills/s41/loop.sh start ~/drills/s41/loop.log`, rồi `k drain cka-w1 --ignore-daemonsets --delete-emptydir-data --timeout=45s`. Đọc thông báo lặp lại, Pod nào kẹt, drain dừng thế nào. `k get pod -o wide`: Pod nào đã đi, Pod nào `Pending`, vì sao? Gỡ: `k uncordon cka-w1` trước (để Pod Pending có chỗ), trả `minAvailable: 1`, upgrade lại với `--wait`.",
      },
      {
        id: "t5",
        text: "Vòng thật: (vòng request vẫn chạy, hay `loop.sh start` lại) `k cordon cka-w1`, `k drain cka-w1 --ignore-daemonsets --delete-emptydir-data`. Ghi thời gian drain. `k get pod -A -o wide --field-selector spec.nodeName=cka-w1`: còn những Pod nào và vì sao chúng được ở lại? `tail -f ~/drills/s41/loop.log` ở terminal khác trong lúc drain.",
      },
      {
        id: "t6",
        text: "`k uncordon cka-w1`. Pod `Pending` đi đâu? Service nào giờ có cả hai Pod trên cka-w2? `k rollout restart deploy/<tên>` cho service đó và xem Pod mới trải ra hai node. `~/drills/s41/loop.sh stop ~/drills/s41/loop.log`: bao nhiêu request, bao nhiêu lỗi? `grep '^#' ~/drills/s41/loop.log`: đọc từng dòng trạng thái (cordon, `ev:cka-w1=N` là số Pod đang bị đuổi qua Eviction API, số Pod trên cka-w1 về 0, uncordon).",
      },
      {
        id: "t7",
        text: "Trên Mac: `./labs/lab verify cka s41` phải 3/3. Rồi trả lời miệng: một Pod gateway nhận `SIGTERM` lúc 10:00:00, khi nào nó ngừng nhận request mới, khi nào kubelet `SIGKILL` nếu ứng dụng treo? (preStop, graceful shutdown, `terminationGracePeriodSeconds` của chart).",
      },
    ],
    hints: [
      "`error when evicting pods/\"order-94cc644cf-gzx9x\" -n \"shop\" (will retry after 5s): Cannot evict pod as it would violate the pod's disruption budget.` (đo): PDB không cho đuổi thêm. `k get pdb`: ALLOWED DISRUPTIONS 0. Hoặc `minAvailable` bằng số replica, hoặc Pod kia của service chưa Ready.",
      "`helm upgrade --wait` hết 5 phút, `UPGRADE FAILED: resource Deployment/shop/catalog not ready … Available: 1/2` (đo, lúc cka-w1 còn cordon sau lần drain treo): Pod Pending không có node để lên, `--wait` chờ nó Ready. `k uncordon cka-w1` trước rồi mới upgrade.",
      "`cannot delete DaemonSet-managed Pods (use --ignore-daemonsets to ignore)`: thiếu cờ. `cannot delete Pods with local storage (use --delete-emptydir-data to override)`: có Pod dùng emptyDir.",
      "Pod thay ở trạng thái `Pending` với `0/3 nodes are available: 1 Insufficient memory, 1 node(s) had untolerated taint(s) {node-role.kubernetes.io/control-plane: }, 1 node(s) were unschedulable` (đọc `k describe pod`): cka-w2 hết chỗ theo requests. Bình thường trong lúc drain; Pod còn lại vẫn phục vụ.",
      "`postgres-0: Preempted by pod … on node cka-w2` trong `k get events` lúc drain cka-w1 (đo, trước khi sửa priority), shop trả `000`/`503`: Pod thay của gateway (shop-critical) đá Pod priority 0. Cho catalog, order, postgres cùng PriorityClass với gateway (t3). Gỡ ngay lúc đó: uncordon, và nếu postgres-0 vẫn `Insufficient memory` thì xoá một Pod gateway trên cka-w2 để spread đưa nó sang cka-w1.",
      "Sau uncordon, verify báo `gateway: Pod Ready chỉ ở cka-w2`: uncordon không dời Pod về. `k rollout restart deploy/gateway` (spread với `matchLabelKeys: [pod-template-hash]` trải ReplicaSet mới đều hai node).",
      "Verify báo `đoạn cordon không có Pod nào bị evict (xoá Pod thay vì drain?)` (đo): bạn cordon rồi `k delete pod`; delete bỏ qua PDB và không để lại dấu Eviction API. Làm lại t5–t6 bằng `k drain`. `Pod trên cka-w1 có trước lúc cordon trong log`: log không khớp Pod đang chạy (log cũ hay viết tay); `~/drills/s41/loop.sh khác bản cho sẵn`: `./labs/lab begin cka s41` đặt lại tệp.",
      "Dòng log của verify báo `trong đoạn cordon, Pod … trên cka-w1 chưa về 0`: bạn đã cordon/uncordon nhưng chưa drain xong trong lúc vòng chạy. Chạy lại t5–t6 với vòng request đang ghi.",
    ],
    solution: `Output là của máy soạn bài (2026-11-20, Kubernetes 1.36.6, Helm v4.3.2); tên Pod, số revision, thời điểm sẽ khác. Context đã ở namespace shop.

**1. Trạng thái đầu và vòng request**

\`\`\`bash
k get pod -o wide -l 'app in (gateway,catalog,order)' | awk '{print $1, $3, $7}'
# catalog-7f7ff485b9-rqdgf Running cka-w2
# catalog-7f7ff485b9-t4szt Running cka-w1
# gateway-6bb658ccc4-rj29m Running cka-w1
# gateway-6bb658ccc4-s8zvb Running cka-w2
# order-86498bc69d-nztnv   Running cka-w1      ← một replica: drain cka-w1 là mất order
k get pdb -A
# kube-system   calico-kube-controllers   N/A   1   1   6d      (shop chưa có PDB nào)
~/drills/s41/loop.sh start ~/drills/s41/loop.log
# đã chạy nền (PID 11849), ghi vào /home/ubuntu/drills/s41/loop.log; dừng: … stop …
head -4 ~/drills/s41/loop.log
# # 1795111973 01:12:53 start http://192.168.252.36:30180/api/products
# # 1795111973 01:12:53 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=2
# 1795111973.698 01:12:53 200 0.513784
# 1795111973.758 01:12:53 200 0.047928
\`\`\`

**2. Chart 0.2.0: PDB, replica, spread**

\`\`\`bash
k create pdb order-pdb --selector=app=order --min-available=1 $do    # khung YAML, không tạo gì
\`\`\`

\`~/charts/shop/templates/pdb.yaml\`:

\`\`\`yaml
{{- range $name := list "gateway" "catalog" "order" }}
{{- $v := index $.Values $name }}
{{- if $v.pdb }}
---
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ $name }}-pdb
  labels:
    app: {{ $name }}
spec:
  minAvailable: {{ $v.pdb.minAvailable }}
  selector:
    matchLabels:
      app: {{ $name }}
{{- end }}
{{- end }}
\`\`\`

Thêm vào cuối \`templates/_helpers.tpl\`, rồi gọi \`{{- include "shop.spread" (dict "app" "order" "Values" .Values) | nindent 6 }}\` ngay dưới \`serviceAccountName\` của order (catalog: dưới \`affinity\`; gateway: dưới \`terminationGracePeriodSeconds\`, bọc \`{{- if ne $name "gateway-v1" }}\` vì gateway-v1 là canary 1 replica):

\`\`\`yaml
{{- define "shop.spread" -}}
{{- if .Values.spread.enabled }}
topologySpreadConstraints:
- maxSkew: {{ .Values.spread.maxSkew }}
  topologyKey: kubernetes.io/hostname
  whenUnsatisfiable: DoNotSchedule
  nodeTaintsPolicy: Honor
  matchLabelKeys:
  - pod-template-hash
  labelSelector:
    matchLabels:
      app: {{ .app }}
{{- end }}
{{- end }}
\`\`\`

values.yaml (phần đổi): \`spread: {enabled: true, maxSkew: 1}\` và \`priorityClassName: shop-critical\` ở đầu tệp (template catalog, order: \`{{- with .Values.priorityClassName }} priorityClassName: {{ . }} {{- end }}\`); \`gateway.pdb.minAvailable: 1\`, \`catalog.pdb.minAvailable: 1\`, \`order.replicas: 2\`, \`order.pdb.minAvailable: 1\`. Chart.yaml: \`version: 0.2.0\`.

postgres-0 cùng mức ưu tiên (trước khi chạy vòng request):

\`\`\`bash
k get priorityclass shop-critical
# NAME            VALUE    GLOBAL-DEFAULT   AGE     PREEMPTIONPOLICY
# shop-critical   100000   false            4d23h   PreemptLowerPriority
vim ~/shop/postgres.yaml          # pod template: priorityClassName: shop-critical, ngay trên nodeSelector: role: db
k apply -f ~/shop/postgres.yaml
# service/postgres unchanged
# statefulset.apps/postgres configured
k rollout status sts/postgres
# partitioned roll out complete: 1 new pods have been updated...
\`\`\`

\`\`\`bash
helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait --timeout 5m
# Release "shop" has been upgraded. Happy Helming!
# STATUS: deployed
# REVISION: 19                (62 giây: catalog, gateway, order rollout với spread mới)
k get pdb
# NAME          MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
# catalog-pdb   1               N/A               1                     62s
# gateway-pdb   1               N/A               1                     62s
# order-pdb     1               N/A               1                     62s
k get pod -o wide -l 'app in (gateway,catalog,order)' | awk '{print $1, $7}'
# catalog-6c6bbc46f-whq68  cka-w2
# catalog-6c6bbc46f-xm2jb  cka-w1
# gateway-7b46fbdfd9-ddzdr cka-w1
# gateway-7b46fbdfd9-ht7st cka-w2
# order-94cc644cf-gzx9x    cka-w1
# order-94cc644cf-nhl95    cka-w2
ssh cka-w1 free -m | awk '/Mem/{print $7}'; ssh cka-w2 free -m | awk '/Mem/{print $7}'
# 624
# 725
\`\`\`

Vòng request trong lúc upgrade: 170 request, 0 lỗi (gateway \`maxUnavailable: 0\`; catalog, order đã có PDB nhưng rollout không đi qua Eviction API, PDB không áp cho rollout).

**3. Tình huống hỏng: minAvailable bằng số replica**

\`\`\`bash
sed -i -E '/^order:/,/^[a-zA-Z]/ s/^(    minAvailable: ).*/\\12/' ~/charts/shop/values.yaml
helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait
k get pdb order-pdb
# order-pdb   2   N/A   0   81s
k drain cka-w1 --ignore-daemonsets --delete-emptydir-data --timeout=45s
# node/cka-w1 cordoned
# error when evicting pods/"order-94cc644cf-gzx9x" -n "shop" (will retry after 5s): Cannot evict pod as it would violate the pod's disruption budget.
# evicting pod shop/order-94cc644cf-gzx9x
# pod/reports-f5c4559f8-q52lc evicted
# …
# error: unable to drain node "cka-w1" due to error: error when evicting pods/"order-94cc644cf-gzx9x" -n "shop": global timeout reached: 45s, continuing command...
# There are pending nodes to be drained:
#  cka-w1
k get pod -A -o wide | grep -E 'Pending|cka-w1' | grep -v -E 'calico|kube-proxy|log-agent'
# shop   catalog-6c6bbc46f-pxnqb    0/1   Pending   …   <none>
# shop   order-94cc644cf-gzx9x      1/1   Running   …   cka-w1     ← Pod duy nhất bị PDB giữ lại
# shop   reports-f5c4559f8-wqqqh    0/1   Pending   …   <none>
\`\`\`

Drain không dừng ở lỗi đầu: nó đuổi mọi Pod khác (gateway, catalog, \`shop-dev\`, reports), chỉ order bị giữ. Pod thay của catalog \`Pending\` vì cka-w2 hết chỗ theo requests. Gỡ theo đúng thứ tự:

\`\`\`bash
k uncordon cka-w1                    # Pod Pending có chỗ lại
sed -i -E '/^order:/,/^[a-zA-Z]/ s/^(    minAvailable: ).*/\\11/' ~/charts/shop/values.yaml
helm upgrade shop ~/charts/shop -n shop --reset-values --force-conflicts --wait
\`\`\`

(Máy soạn bài upgrade **trước** khi uncordon: \`--wait\` chờ catalog Pending đủ 5 phút, revision đó \`failed\`; đừng lặp lại.)

**4. Drain thật**

\`\`\`bash
k cordon cka-w1
time k drain cka-w1 --ignore-daemonsets --delete-emptydir-data
# Warning: ignoring DaemonSet-managed Pods: kube-system/calico-node-bhzlq, kube-system/kube-proxy-ppwsv, shop/log-agent-cl46x
# evicting pod shop/order-94cc644cf-gzx9x
# pod/order-94cc644cf-gzx9x evicted
# node/cka-w1 drained
# real 0m13.706s
k get pod -A -o wide --field-selector spec.nodeName=cka-w1 | awk '{print $1, $2}'
# default      web-static-cka-w1        ← static pod của s08 (mirror pod: drain không đụng)
# kube-system  calico-node-bhzlq
# kube-system  kube-proxy-ppwsv
# shop         log-agent-cl46x
\`\`\`

Còn lại: ba Pod DaemonSet và static pod (kubelet đọc từ \`/etc/kubernetes/manifests\`, không qua apiserver).

**5. Uncordon, trải lại, đọc log**

\`\`\`bash
k uncordon cka-w1
k get pod -o wide -l 'app in (gateway,catalog,order)' | awk '{print $1, $7}'
# catalog-6c6bbc46f-pxnqb  cka-w1       ← Pod Pending lên cka-w1 ngay khi có chỗ
# catalog-6c6bbc46f-whq68  cka-w2
# gateway-7b46fbdfd9-7ttfz cka-w2       ← đã lên được cka-w2 lúc drain: ở lại đó
# gateway-7b46fbdfd9-ht7st cka-w2
# order-94cc644cf-nc4dz    cka-w1
# order-94cc644cf-nhl95    cka-w2
k rollout restart deploy/gateway && k rollout status deploy/gateway      # 44 giây
k get pod -o wide -l app=gateway | awk '{print $1, $7}'
# gateway-68c4768b4f-vn7cr cka-w2
# gateway-68c4768b4f-vzxmk cka-w1
~/drills/s41/loop.sh stop ~/drills/s41/loop.log
# đã dừng; 1286 request, 0 lỗi
grep '^#' ~/drills/s41/loop.log      # (lần chạy của apply.sh, bản loop.sh có ev:, fix round 1: 188 request, 0 lỗi)
# # 1795126263 05:11:03 start http://192.168.252.36:30180/api/products
# # 1795126264 05:11:04 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=4
# # 1795126276 05:11:16 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/cordon cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=4 ev:cka-w1=3
# # 1795126287 05:11:27 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/cordon cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=0 cka-w2=4
# # 1795126319 05:11:59 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=1 cka-w2=4
# # 1795126332 05:12:12 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=4
# # 1795126359 05:12:39 stop
\`\`\`

Đọc từ trên xuống: cordon lúc 05:11:16 và cùng lúc ba Pod trên cka-w1 mang condition "bị đuổi qua Eviction API" (\`ev:cka-w1=3\`: đó là drain, \`k delete pod\` thì không có), Pod shop trên cka-w1 về 0 sau 11 giây, uncordon trước 05:11:59, ba Pod trở lại cka-w1 lúc 05:12:12. Lần làm tay trên máy soạn bài: 1286 request trong ~10 phút (gồm cả lần drain treo, lần upgrade lỗi và lần drain thật), không request nào khác 200. Lúc drain, cka-w2 còn 370 MB available (\`free -m\`).

Lời giải tự động: \`labs/cka/sessions/s41/apply.sh\` (chép các tệp đổi của chart ở \`files/chart/\` đè lên \`~/charts/shop\`, upgrade, rồi \`files/solve.sh\`: vòng request, cordon + drain + uncordon cka-w1, \`rollout restart\` service nào dồn về một worker; chạy lại được, mỗi lần là một vòng drain mới).`,
    exam: {
      patterns: [
        "\"Đưa node X vào bảo trì, chuyển hết Pod đi, rồi đưa trở lại\" — `k drain X --ignore-daemonsets --delete-emptydir-data` (thêm `--force` nếu đề có Pod trần), làm việc, `k uncordon X`; kiểm `k get node` không còn `SchedulingDisabled`.",
        "\"Đánh dấu node X không nhận Pod mới nhưng giữ Pod đang chạy\" — `k cordon X` (không phải drain).",
        "\"Tạo PDB cho Deployment Y để luôn còn ít nhất N Pod\" — `k create pdb y-pdb --selector=app=y --min-available=N`; kiểm `k get pdb` cột ALLOWED DISRUPTIONS.",
        "\"Drain treo, tìm vì sao\" — đọc thông báo `violate the pod's disruption budget`, `k get pdb -A`, so `minAvailable` với số Pod Ready.",
      ],
      timeTargetMin: 4,
      drills: [
        {
          text: "Trong 3 phút: tạo Deployment `web` (nginx, 3 replica) ở namespace `drill`, PDB `web-pdb` cho phép thiếu tối đa 1 Pod, rồi chứng minh bằng một lệnh rằng lúc này có thể đuổi đúng 1 Pod.",
          timeLimitMin: 3,
          solution: "```bash\nk create ns drill\nk -n drill create deploy web --image=nginx --replicas=3\nk -n drill create pdb web-pdb --selector=app=web --max-unavailable=1\nk -n drill get pdb web-pdb        # MAX UNAVAILABLE 1, ALLOWED DISRUPTIONS 1 (sau khi 3 Pod Ready)\nk delete ns drill\n```",
        },
        {
          text: "Trong 2 phút: `k drain node01` báo `cannot delete Pods declare no controller (use --force to override): default/debug`. Bạn gõ gì, và Pod `debug` sẽ ra sao?",
          timeLimitMin: 2,
          solution: "```bash\nk drain node01 --ignore-daemonsets --delete-emptydir-data --force\n```\nPod `debug` không có controller nên bị xoá hẳn, không ai tạo lại. Nếu cần giữ nó, chép YAML ra trước (`k get pod debug -o yaml > debug.yaml`) và tạo lại sau uncordon.",
        },
      ],
    },
    tips: [
      "`k drain` tự cordon: không cần gõ `cordon` trước. Gõ `cordon` riêng chỉ khi muốn dừng xếp Pod mới mà chưa đuổi gì.",
      "Trên đề, gõ luôn `--ignore-daemonsets --delete-emptydir-data`: gần như node nào cũng có Pod DaemonSet (CNI, kube-proxy).",
      "PDB `minAvailable` bằng số replica là PDB chặn mọi drain. Muốn 'luôn còn 1', viết `minAvailable: 1`, hay `maxUnavailable: 1`.",
      "Sau `uncordon`, `k get pod -o wide`: Pod không tự quay về. Cần trải lại thì `rollout restart`.",
    ],
    outcome: {
      md: `shop sống qua một lần bảo trì node: mỗi service hai Pod trên hai worker, PDB buộc drain đuổi từng Pod một, Spring Boot tắt êm, và vòng 2 request/giây không thấy lỗi nào. Trên Mac:

\`\`\`bash
./labs/lab verify cka s41
\`\`\`

Verify đọc ba PDB \`gateway-pdb\`, \`catalog-pdb\`, \`order-pdb\`: \`minAvailable: 1\` (không \`maxUnavailable\`), selector \`app=<service>\`, nằm trong manifest của release shop (tạo bằng \`kubectl\` ngoài chart: đỏ), healthy ≥ 2 và ALLOWED DISRUPTIONS ≥ 1 (\`minAvailable: 2\`: đỏ, đo), values \`<service>.pdb.minAvailable\` là 1, và không PDB nào khác chọn Pod của ba service (một PDB \`shop-all\` \`--min-available=2\` thêm vào: đỏ, đo). Release shop \`deployed\`, chart \`shop-0.2.0\`, \`javaOpts\` và \`order.image.tag\` như cuối s37; Deployment gateway, catalog, order ≥ 2 replica (catalog: HPA \`minReplicas\` ≥ 2), pod template trải theo \`kubernetes.io/hostname\` (\`topologySpreadConstraints\` \`maxSkew: 1\` hay \`podAntiAffinity\`) và cách trải đó có trong manifest của release; Pod Ready của mỗi service có trên cả cka-w1 lẫn cka-w2; catalog, order (trong chart) và StatefulSet postgres (cả trong \`~/shop/\`) có priority không thấp hơn PriorityClass của gateway (thiếu: đỏ). \`~/drills/s41/loop.log\`: có một đoạn cka-w1 bị cordon, trong đoạn đó số Pod gateway/catalog/order trên cka-w1 về 0 rồi node được uncordon (cordon/uncordon không drain: đỏ, đo), ≥ 20 request trong đoạn, không khoảng hở nào quá 8 giây (mỗi request chờ tối đa 5 giây), và cả log không có request nào khác 200. Bằng chứng drain là thật: trong đoạn đó \`loop.sh\` thấy ít nhất một Pod trên cka-w1 bị đuổi qua Eviction API (\`ev:cka-w1\`, condition \`DisruptionTarget=EvictionByEvictionAPI\`; cordon rồi \`k delete pod\`: đỏ, đo), mọi Pod gateway/catalog/order đang ở cka-w1 được tạo sau lúc cordon trong log (log viết tay mang giờ hiện tại: đỏ, đo), và \`~/drills/s41/loop.sh\` đúng bản cho sẵn (sửa tệp: đỏ). Ba node Ready, cka-w1 và cka-w2 schedulable.`,
      verifyOutput: "lab: kiểm s41\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)\n  ✓ PDB gateway-pdb, catalog-pdb, order-pdb trong chart: minAvailable 1, selector app=<service>, ALLOWED DISRUPTIONS ≥ 1; không PDB thừa\n  ✓ Release shop deployed (shop-0.2.0, javaOpts và order 2.0 như cũ); gateway, catalog, order ≥ 2 replica, trải theo hostname trong chart, Pod Ready trên cka-w1 và cka-w2; catalog, order, postgres có priority không thấp hơn gateway\n  ✓ ~/drills/s41/loop.log: drain cka-w1 (cordon → Pod bị evict, về 0 → uncordon) với request đều, 0 lỗi; Pod trên cka-w1 tạo sau lúc cordon; ba node Ready, hai worker schedulable\n  → 3/3 đạt",
      projectDelta: "Chart shop lên 0.2.0: order 2 replica, ba service trải đều hai worker bằng topologySpreadConstraints, có PDB minAvailable 1 và cùng PriorityClass với gateway (postgres cũng vậy). Từ đây bảo trì một worker không làm shop mất request; đó là điều kiện để nâng cấp cluster ở s42.",
    },
    review: [
      { q: "cordon, drain, uncordon khác nhau thế nào? Sau uncordon Pod có quay về không?", a: "cordon chỉ đặt unschedulable (Pod đang chạy ở yên); drain cordon rồi đuổi từng Pod qua Eviction API (tôn trọng PDB), Pod của DaemonSet và static pod ở lại; uncordon gỡ cờ. Pod không quay về: đo trên lab, hai Pod gateway ở lại cka-w2 sau uncordon cho tới khi `rollout restart`." },
      { q: "PDB `minAvailable: 2` cho Deployment 2 replica: drain node có một Pod của nó thì sao?", a: "ALLOWED DISRUPTIONS = 2 − 2 = 0. Eviction bị từ chối (`Cannot evict pod as it would violate the pod's disruption budget`), drain thử lại mỗi 5 giây tới khi hết `--timeout` (đo: 45 giây rồi `global timeout reached`). Các Pod khác trên node vẫn bị đuổi; chỉ Pod đó ở lại." },
      { q: "Vì sao chart dùng `nodeTaintsPolicy: Honor` trong topologySpreadConstraints?", a: "Không có nó, cka-cp (taint control-plane) và node đang cordon vẫn tính là miền có 0 Pod; Pod thay trên worker còn lại làm lệch 2 > maxSkew 1 và `DoNotSchedule` chặn nó. Honor bỏ qua node có taint mà Pod không chịu, nên lúc drain Pod thay vẫn xếp được." },
      { q: "Pod gateway bị đuổi: liệt kê những gì xảy ra tới khi container dừng, và vì sao không mất request.", a: "Pod Terminating; song song EndpointSlice gỡ Pod khỏi Service (kube-proxy xoá rule) và kubelet chạy `preStop: sleep 10`, nên trong 10 giây đó request cũ vẫn được phục vụ. Rồi SIGTERM: Spring Boot `server.shutdown: graceful` ngừng nhận kết nối mới, chờ request đang chạy tối đa 20 giây. `terminationGracePeriodSeconds: 45` là trần cho cả hai; quá thì SIGKILL. Pod kia ở worker còn lại đã Ready nhờ PDB." },
      { q: "Một lần drain trên máy soạn bài làm shop mất 51/75 request dù PDB đúng. Chuyện gì đã xảy ra, và vì sao không hạ requests để mọi Pod vừa một node?", a: "cka-w2 hết chỗ theo requests; Pod thay của gateway mang PriorityClass shop-critical nên scheduler preempt Pod priority 0 trên cka-w2: postgres-0 và catalog của shop-dev (`Preempted by pod … on node cka-w2`, đo). postgres-0 mới không lên lại được, catalog/order mất DB. Sửa bằng cách cho catalog, order, postgres cùng PriorityClass với gateway. Hạ requests thì scheduler xếp thêm Pod Java (~170Mi thật) lên một node 2 GB và node có thể OOM; Pod Pending trong lúc drain không mất request vì PDB giữ Pod còn lại Ready." },
    ],
  },
// ───────────────────────────── s42 ─────────────────────────────
  {
    id: "s42",
    stage: "st8",
    title: "Nâng cấp cluster bằng kubeadm",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-lifecycle"],
    requires: ["s41"],
    status: "published",
    pieces: ["upgraded"],
    goals: [
      "Nâng control plane từ 1.36 lên 1.37 (minor của đề thi) theo đúng trang Upgrading kubeadm clusters.",
      "Nâng lần lượt hai worker (kubeadm upgrade node → drain → kubelet → uncordon): shop không mất request nào khi nâng cka-cp và cka-w1, và đo được thời gian gián đoạn khi nâng cka-w2, node giữ PostgreSQL.",
      "Giải thích version skew policy, vì sao chỉ nâng một minor mỗi lần và vì sao lưu trữ cục bộ buộc shop gián đoạn.",
    ],
    skills: [
      { skill: "k-upgrade-plan", level: "Gõ được không tra" },
      { skill: "k-upgrade-apply", level: "Gõ được không tra" },
      { skill: "k-upgrade-node", level: "Gõ được không tra" },
      { skill: "k-upgrade-cp-flow", level: "Dưới 12 phút" },
      { skill: "k-upgrade-worker-flow", level: "Dưới 6 phút một node" },
      { skill: "lx-apt-unhold", level: "Gõ được có tra" },
      { skill: "k-version-skew", level: "Giải thích được" },
      { skill: "k-docs-upgrade", level: "Tìm được trong 30 giây" },
    ],
    uses: ["k-drain", "k-uncordon", "lx-apt-repo", "lx-daemon-reload", "k-get-nodes-wide"],
    foundation: null,
    mindset: `**kubeadm nâng control plane, apt nâng kubelet.** Một cluster kubeadm có hai loại thành phần. Loại một là **static pod** trên control plane (kube-apiserver, kube-controller-manager, kube-scheduler, etcd) và hai addon (CoreDNS, kube-proxy): \`kubeadm upgrade apply\` viết lại manifest trong \`/etc/kubernetes/manifests\` bằng image mới, chờ từng cái lên lại, gia hạn chứng chỉ, cập nhật ConfigMap \`kubeadm-config\` và \`kubelet-config\`, rồi rollout CoreDNS và DaemonSet kube-proxy. Loại hai là **gói Debian** trên mỗi node: \`kubeadm\`, \`kubelet\`, \`kubectl\`; không lệnh kubeadm nào đổi chúng, bạn cài bằng apt. Vì vậy mỗi node có cùng một nhịp:

| Bước | cka-cp (control plane đầu tiên) | cka-w1, cka-w2 |
|---|---|---|
| 0. Repo | \`/etc/apt/sources.list.d/kubernetes.list\` từ \`…/core:/stable:/v1.36/deb/\` sang \`v1.37\`, \`apt-get update\` | như vậy |
| 1. kubeadm | \`apt-mark unhold kubeadm\`, \`apt-get install kubeadm=1.37.2-1.1\`, \`apt-mark hold kubeadm\` | như vậy |
| 2. Nâng | \`kubeadm upgrade plan\`, \`kubeadm upgrade apply v1.37.2\` | \`kubeadm upgrade node\` (chỉ cập nhật cấu hình kubelet: 0,3 giây, đo) |
| 3. Drain | \`k drain cka-cp --ignore-daemonsets --delete-emptydir-data\` (kubernetes.io chỉ ghi \`--ignore-daemonsets\`; lab thêm cờ thứ hai để drain không dừng nếu Pod nào trên node dùng \`emptyDir\`) | \`k drain <node> --ignore-daemonsets --delete-emptydir-data\` (gõ trên cka-cp) |
| 4. kubelet | unhold, cài \`kubelet\`, \`kubectl\` 1.37.2-1.1, hold; \`systemctl daemon-reload\`, \`systemctl restart kubelet\` | như vậy |
| 5. | \`k uncordon cka-cp\` | \`k uncordon <node>\` |

Repo pkgs.k8s.io **tách theo minor**: không đổi URL ở bước 0 thì \`apt-cache madison kubeadm\` chỉ thấy 1.36.x. \`hold\` có từ s06 để \`apt upgrade\` không vô tình kéo kubelet lệch control plane; nâng có chủ đích thì unhold, cài, hold lại. Bản lab dùng: **1.37.2**, bản vá mới nhất của 1.37 ngày 2026-11-20 (\`https://dl.k8s.io/release/stable-1.37.txt\`; repo có 1.37.0-1.1, 1.37.1-1.1, 1.37.2-1.1). \`kubeadm upgrade plan\` chỉ chọn được bản mà chính \`kubeadm\` đang cài biết: nâng kubeadm trước, rồi mới plan.

**Version skew policy: vì sao thứ tự là control plane rồi worker, và chỉ một minor.** Chính sách của Kubernetes (từ 1.28): kube-apiserver là mốc; \`kubelet\` và \`kube-proxy\` **không được mới hơn** apiserver và được **cũ hơn tối đa ba minor**; kube-controller-manager, kube-scheduler cũ hơn tối đa **một** minor; \`kubectl\` lệch ±1. Nên lúc cka-cp đã 1.37 mà hai worker còn 1.36 là hợp lệ (đo: \`k get node\` có ba node Ready với hai bản khác nhau suốt mười phút), còn worker 1.37 dưới apiserver 1.36 thì không. \`kubeadm upgrade apply\` từ chối nhảy hai minor (1.36 → 1.38): mỗi lần nâng một minor vì mỗi minor có thể đổi API, cờ, định dạng lưu trong etcd, và bản trung gian là nơi chuyển đổi đó được kiểm thử.

**Vì sao drain từng node mà shop không mất request, và vì sao cka-w2 thì có.** s41 đã cho mỗi service hai Pod trên hai worker với PDB. Drain cka-cp chỉ đuổi các controller ghim control plane (ingress-nginx, NGINX Gateway Fabric và data plane \`shop-gw\`, cert-manager, demo, local-path-provisioner: 8 Pod \`Pending\` trong ~1 phút, đo), nên Ingress (:30080) và Gateway (:30280) tạm mất, còn đường \`gateway-nodeport\` :30180 thì không: vòng request của buổi đi qua 30180. **Nhưng DNS thì có.** \`kubeadm upgrade apply\` trả về khi Deployment CoreDNS và DaemonSet kube-proxy **còn đang rollout**; kubeadm cũng không tạo PDB cho CoreDNS. Lần chạy tự động đầu tiên drain cka-cp 7 giây sau \`upgrade apply\`: Pod CoreDNS cũ trên cka-cp bị đuổi khi Pod mới còn \`Readiness probe failed\`, khoảng 25 giây không có CoreDNS Ready, gateway hết cache DNS của JVM (30 giây) và không phân giải được \`catalog\`: 3 request hết 5 giây rồi 9 request \`503\` \`{"error":"không kết nối được catalog"}\`, 12/1105 lỗi (đo; verify đỏ đúng như vậy). Hai việc trước khi drain cka-cp: \`k -n kube-system rollout status deploy/coredns\` (và \`ds/kube-proxy\`), và PDB \`coredns-pdb\` (\`minAvailable: 1\`, selector \`k8s-app: kube-dns\`) để mọi lần drain sau đuổi CoreDNS từng Pod một. Lần chạy thứ hai (đã có PDB và chờ rollout) vẫn 16 lỗi, lần này **trong** \`upgrade apply\`: DaemonSet kube-proxy thay Pod trên cka-w2 cùng lúc CoreDNS đổi Pod, Pod kube-proxy mới phải kéo image 22 giây, suốt lúc đó rule iptables cũ của cka-w2 còn gửi truy vấn DNS tới Pod CoreDNS đã xoá (đo: Pod kube-proxy cũ của cka-w2 bị xoá, Pod mới kéo image xong sau 22 giây; 16 request lỗi trong 19 giây nằm trong khoảng đó). Vì vậy kéo trước image addon trên mọi worker (\`sudo crictl pull registry.k8s.io/kube-proxy:v1.37.2\`, \`coredns/coredns:v1.14.6\`, \`pause:3.10.2\`) trước \`upgrade apply\`; lần đo tay đã kéo trước và có 0 lỗi. Trang của kubernetes.io không nhắc bước này; nó chỉ quan trọng khi bạn đòi không mất request nào. Drain cka-w1: như s41.

cka-w2 khác: \`postgres-0\` là StatefulSet 1 replica, PV \`local-path\` ghim cka-w2 bằng \`nodeAffinity\` (s24). Drain cka-w2 đuổi \`postgres-0\`; Pod mới chỉ chạy được ở cka-w2 mà cka-w2 đang cordon, nên \`Pending\` (\`didn't match PersistentVolume's node affinity\`, \`were unschedulable\`) tới khi uncordon. Suốt lúc đó catalog và order không có database: \`/api/products\` chờ kết nối rồi hết giờ. Đo (lần chạy cuối, \`loop.sh\` chờ tối đa 5 giây mỗi request): 13/267 request lỗi, cả 13 là hết giờ, trong **60 giây** từ lúc drain tới khi postgres-0 Ready và Hikari nối lại; lần đo tay trước đó (curl chờ 2 giây) 50/192 lỗi trong 103 giây. Cửa sổ dài ngắn tuỳ lúc postgres-0 được đuổi và lúc kubelet cka-w2 lên lại. PDB không cứu được: \`minAvailable: 1\` cho StatefulSet 1 replica chỉ làm drain treo. Gỡ thật sự cần bỏ ràng buộc vào một node: storage mạng (CSI: NFS, Ceph, EBS) để Pod lên node khác cùng dữ liệu, hay PostgreSQL có bản sao (operator như CloudNativePG, Patroni) để failover. Lab ghi nhận cái giá đó bằng \`W2_OUTAGE_SECONDS\`, đúng việc của một kỹ sư vận hành: biết node nào nâng là có gián đoạn, đo nó, báo trước.

**Ubuntu tự restart kubelet, đề thi có thể không.** Trên Ubuntu 24.04, \`needrestart\` chạy sau \`apt-get install\`; với \`DEBIAN_FRONTEND=noninteractive\` nó tự \`systemctl restart kubelet.service\` (đo trên cka-cp: kubelet mới chạy ngay khi cài xong). (Mọi output của buổi lấy qua phiên không có TTY; trong terminal tương tác needrestart có thể hỏi trước khi restart, lab chưa đo.) Bỏ bước restart là thói quen xấu: trên máy không có needrestart (hay đặt \`NEEDRESTART_MODE=l\`, tình huống hỏng của buổi) kubelet cũ vẫn chạy và \`k get node\` vẫn báo \`v1.36.6\` dù gói đã là 1.37.2 (đo trên cka-w1). \`daemon-reload\` vì gói kubelet có thể đổi unit systemd và drop-in \`10-kubeadm.conf\`.

**cert-manager v1.21.3 trên 1.37 (đo).** Bảng hỗ trợ của cert-manager (\`cert-manager.io/docs/releases\`, đọc 2026-11-20) ghi 1.21 chỉ tới Kubernetes 1.36; 1.22 chưa ra. Sau nâng cấp: ba Pod cert-manager Ready trên cka-cp, Certificate \`shop-local\` Ready, webhook nhận một Certificate tạo thử \`--dry-run=server\`, xoá Secret \`shop-local-cm-tls\` thì có lại sau 0,39 giây với serial mới. Lab giữ v1.21.3; "chạy được" không phải "được hỗ trợ": khi 1.22 ra thì nâng chart.`,
    refs: [
      { label: "Bài lộ trình CKA: Cluster upgrade với kubeadm — control plane trước, worker sau", href: "#/roadmap/cka/cka-w3-4" },
      { label: "Lộ trình CKA Study Guide: dựng cluster bằng kubeadm và nâng cấp phiên bản", href: "#/roadmap/ckabook/cb-w1-4" },
      { label: "CKA Study Guide, chương 4 — Nâng cấp phiên bản cluster", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Upgrading kubeadm clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/" },
      { label: "kubernetes.io: Changing the Kubernetes package repository", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/change-package-repository/" },
      { label: "kubernetes.io: Version Skew Policy", href: "https://kubernetes.io/releases/version-skew-policy/" },
      { label: "kubernetes.io: Volumes — local (ràng buộc node của PV cục bộ)", href: "https://kubernetes.io/docs/concepts/storage/volumes/#local" },
      { label: "cert-manager: Supported Releases (bảng Kubernetes được hỗ trợ)", href: "https://cert-manager.io/docs/releases/" },
    ],
    stateIn: "Đầu ra s41 (mốc trước nâng cấp là st7-done): cluster 1.36.6, gói 1.36.6-1.1 hold, repo apt v1.36; shop chart 0.2.0 có PDB, hai Pod mỗi service trên hai worker. `./labs/lab begin cka s42` kiểm đầu vào bằng check.sh riêng (PDB, release shop, log drain của s41; không đòi Pod trên cả hai worker vì chính buổi này drain từng node), đặt ~/drills/s42/loop.sh và xoá answers.env cũ.",
    stateOut: "Ba node v1.37.2 Ready, schedulable; control plane, etcd 3.7.0-0, CoreDNS v1.14.6 (có PDB coredns-pdb), kube-proxy theo kubeadm 1.37.2; gói kubeadm/kubelet/kubectl 1.37.2-1.1 hold, repo apt v1.37 trên cả ba node; ~/drills/s42/loop-cp-w1.log 0 request lỗi khi nâng cka-cp và cka-w1; loop-w2.log ghi khoảng gián đoạn khi nâng cka-w2 (postgres-0, PV local-path), W2_OUTAGE_SECONDS và SKEW_RULE trong answers.env; shop, Ingress, Gateway, cert-manager chạy như trước. Mốc st8-upgraded chụp ở đây.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s42`. Mở trang \"Upgrading kubeadm clusters\" (kubernetes.io, ô tìm kiếm: `kubeadm upgrade`): tìm được trong 30 giây không? `k get node -o wide`, `kubeadm version -o short`, `apt-mark showhold`, `cat /etc/apt/sources.list.d/kubernetes.list`. Trên trang Version Skew Policy: kubelet được cũ hơn kube-apiserver tối đa mấy minor? Ghi `SKEW_RULE=<số>` vào `~/drills/s42/answers.env`.",
      },
      {
        id: "t2",
        text: "Vòng request cho phần không được gián đoạn: `~/drills/s42/loop.sh start ~/drills/s42/loop-cp-w1.log`. **Một log phải chứa cả lúc cka-cp lẫn cka-w1 lên 1.37**: đừng `stop`/`start` lại vòng này cho tới hết t5 (`start` ghi đè log). Lỡ khởi động lại sau khi cka-cp đã nâng thì log mất đoạn cka-cp và verify dòng đó đỏ mãi; gỡ bằng `./labs/lab restore cka s41` (khoảng 11 phút) rồi làm lại từ t2. cka-cp: đổi repo sang `v1.37` (`sudo sed -i 's#/v1.36/#/v1.37/#' …`), `sudo apt-get update`, `apt-cache madison kubeadm`, unhold/cài `kubeadm=1.37.2-1.1`/hold, `kubeadm version -o short`. `sudo kubeadm config images pull --kubernetes-version v1.37.2` (kéo trước image, máy soạn bài mất 6 phút); trên cka-w1 và cka-w2 `sudo crictl pull` ba image `kube-proxy`, `coredns`, `pause` mà `kubeadm config images list --kubernetes-version v1.37.2` in ra. `sudo kubeadm upgrade plan`: những thành phần nào đổi bản, cái nào phải nâng tay?",
      },
      {
        id: "t3",
        text: "`sudo kubeadm upgrade apply v1.37.2` (hỏi xác nhận; ~3 phút). Trong lúc chạy, ở terminal khác: `watch -n2 'sudo crictl ps | grep -E \"apiserver|etcd|scheduler|controller\"'` và `tail -f ~/drills/s42/loop-cp-w1.log`. Xong: `k -n kube-system rollout status deploy/coredns` và `ds/kube-proxy` (chờ tới khi xong), `k -n kube-system get pod -o wide | grep -E 'coredns|proxy'` (CoreDNS mới nằm ở đâu?), `k get node` (VERSION của cka-cp đổi chưa, vì sao?). `k -n kube-system get pdb`: CoreDNS có PDB không? Tạo `coredns-pdb` (`k -n kube-system create pdb coredns-pdb --selector=k8s-app=kube-dns --min-available=1`, hay YAML trong `~/drills/s42/coredns-pdb.yaml`).",
      },
      {
        id: "t4",
        text: "`k drain cka-cp --ignore-daemonsets --delete-emptydir-data`. `k get pod -A --field-selector status.phase=Pending`: những gì đang chờ, và vì sao shop vẫn trả lời ở 30180? Unhold, cài `kubelet=1.37.2-1.1 kubectl=1.37.2-1.1`, hold; đọc output của apt (needrestart làm gì?); `sudo systemctl daemon-reload && sudo systemctl restart kubelet`; `k get node`; `k uncordon cka-cp`. Ghi thời gian từ t2 tới đây.",
      },
      {
        id: "t5",
        text: "cka-w1 (`ssh cka-w1`): repo, kubeadm như t2, `sudo kubeadm upgrade node`. Trên cka-cp: `k drain cka-w1 --ignore-daemonsets --delete-emptydir-data`. Tình huống hỏng (cố ý): trên cka-w1 cài kubelet/kubectl bằng `sudo NEEDRESTART_MODE=l apt-get install -y kubelet=1.37.2-1.1 kubectl=1.37.2-1.1` và **chưa** restart. `kubelet --version` nói gì, `k get node cka-w1` nói gì? `systemctl show kubelet -p ActiveEnterTimestamp`. Sửa: `sudo systemctl daemon-reload && sudo systemctl restart kubelet`, `k get node`, `k uncordon cka-w1`, `rollout restart` service nào dồn về một worker. `loop.sh stop ~/drills/s42/loop-cp-w1.log`: bao nhiêu lỗi?",
      },
      {
        id: "t6",
        text: "cka-w2, node giữ `postgres-0`: `loop.sh start ~/drills/s42/loop-w2.log`, rồi làm như t5 (lần này restart kubelet ngay). Trong lúc drain: `k get pod postgres-0 -o wide`, `k describe pod postgres-0 | tail -3`. Sau uncordon, chờ `curl http://<IP cka-w1>:30180/api/products` trả 200, đợi thêm 15 giây, `loop.sh stop ~/drills/s42/loop-w2.log`. Tính khoảng gián đoạn: `grep -v '^#' ~/drills/s42/loop-w2.log | awk '$3!=200 {if(!f) f=$1; l=$1} END {print l-f}'`; ghi `W2_OUTAGE_SECONDS=<số giây, làm tròn>` vào answers.env.",
      },
      {
        id: "t7",
        text: "Kiểm toàn cảnh: `k get node -o wide`; `k -n kube-system get pod -o custom-columns=NAME:.metadata.name,IMAGE:.spec.containers[0].image | grep -E 'apiserver|etcd|coredns|proxy'`; trên từng node `apt-mark showhold` và `dpkg -l kubeadm kubelet kubectl | tail -3`; `k -n shop get certificate`, `k -n cert-manager get pod`. Trên Mac: `./labs/lab verify cka s42` phải 5/5. Rồi `./labs/lab snapshot cka st8-upgraded` nếu bạn muốn có mốc của chính mình (lab đã có sẵn).",
      },
    ],
    hints: [
      "`apt-cache madison kubeadm` chỉ thấy `1.36.x`: repo còn trỏ `…/core:/stable:/v1.36/deb/`. Sửa `/etc/apt/sources.list.d/kubernetes.list` rồi `apt-get update`; khoá `/etc/apt/keyrings/kubernetes-apt-keyring.gpg` dùng chung cho mọi minor (đo: `apt-get update` qua ngay với khoá cũ).",
      "`E: Held packages were changed and -y was used without --allow-change-held-packages`: gói đang `hold`. `sudo apt-mark unhold kubeadm` trước, cài kèm `=1.37.2-1.1`, `apt-mark hold` lại.",
      "`kubeadm upgrade plan` báo target là bản 1.36.x: bạn chưa nâng chính `kubeadm` (`kubeadm version -o short` vẫn v1.36.6). kubeadm chỉ nâng tới bản nó biết.",
      "`kubelet --version` báo `Kubernetes v1.37.2` mà `k get node` vẫn `v1.36.6` (đo trên cka-w1 với `NEEDRESTART_MODE=l`): gói mới đã cài nhưng tiến trình kubelet cũ vẫn chạy (`ActiveEnterTimestamp` trước lúc cài). `sudo systemctl daemon-reload && sudo systemctl restart kubelet`.",
      "`loop-cp-w1.log` có `503` ngay sau khi drain cka-cp (đo: 12 lỗi trong 25 giây, `{\"error\":\"không kết nối được catalog\"}`): CoreDNS mất hết Pod Ready. Bạn drain khi CoreDNS còn rollout sau `upgrade apply`, hay CoreDNS chưa có PDB. `rollout status deploy/coredns`, tạo `coredns-pdb`, rồi làm lại phần cka-cp/cka-w1 với log mới (restore về s41 nếu đã nâng xong).",
      "`loop-cp-w1.log` có `000` rồi `503` trong lúc `kubeadm upgrade apply` (đo: 16 lỗi trong 19 giây): Pod kube-proxy mới trên một worker đang kéo image, node đó còn rule cũ trỏ Pod CoreDNS đã xoá. Kéo trước `kube-proxy`, `coredns`, `pause` trên mọi worker bằng `crictl pull` trước `upgrade apply`.",
      "Gõ `kubeadm upgrade apply` trên worker: sai lệnh. Worker (và control plane thứ hai trở đi) dùng `kubeadm upgrade node`.",
      "`postgres-0` `Pending` suốt lúc cka-w2 cordon: đúng như dự kiến (PV local-path ghim cka-w2, s24). Đừng xoá PVC; uncordon là Pod lên lại với dữ liệu cũ.",
      "Verify báo `W2_OUTAGE_SECONDS=…, log đo …`: đọc lại khoảng từ request lỗi đầu tới request lỗi cuối trong `loop-w2.log`, không phải từ lúc drain tới lúc uncordon.",
    ],
    solution: `Output là của máy soạn bài (2026-11-20, nâng 1.36.6 → 1.37.2); thời điểm, tên Pod sẽ khác. **Hai lần đo, ghi rõ từng chỗ:** bước 1–5 là **lần làm tay** (vòng request với curl chờ 2 giây; lần đó chưa có \`coredns-pdb\` và giữa \`upgrade apply\` với drain cka-cp có vài phút); bước 6 và các con số tiêu đề của buổi (gián đoạn cka-w2 ~60 giây) là **lần chạy tự động cuối** của \`apply.sh\` (curl chờ 5 giây, đủ ba bước sửa ở phần Tư duy). Con số của lần làm tay luôn ghi kèm chữ "lần làm tay". Lệnh có \`sudo\` chạy trên node được ghi ở đầu khối; \`k\` luôn chạy trên cka-cp.

**1. Đầu buổi**

\`\`\`bash
k get node
# cka-cp   Ready    control-plane   6d1h   v1.36.6
# cka-w1   Ready    <none>          6d1h   v1.36.6
# cka-w2   Ready    <none>          6d1h   v1.36.6
cat /etc/apt/sources.list.d/kubernetes.list
# deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.36/deb/ /
apt-mark showhold
# jq
# kubeadm
# kubectl
# kubelet
echo SKEW_RULE=3 >> ~/drills/s42/answers.env
~/drills/s42/loop.sh start ~/drills/s42/loop-cp-w1.log
\`\`\`

**2. cka-cp: repo, kubeadm, plan**

\`\`\`bash
sudo sed -i 's#/core:/stable:/v1.36/deb/#/core:/stable:/v1.37/deb/#' /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
apt-cache madison kubeadm | head -3
#    kubeadm | 1.37.2-1.1 | https://pkgs.k8s.io/core:/stable:/v1.37/deb  Packages
#    kubeadm | 1.37.1-1.1 | https://pkgs.k8s.io/core:/stable:/v1.37/deb  Packages
#    kubeadm | 1.37.0-1.1 | https://pkgs.k8s.io/core:/stable:/v1.37/deb  Packages
sudo apt-mark unhold kubeadm && sudo apt-get install -y kubeadm=1.37.2-1.1 && sudo apt-mark hold kubeadm
kubeadm version -o short
# v1.37.2
kubeadm config images list --kubernetes-version v1.37.2
# registry.k8s.io/kube-apiserver:v1.37.2
# registry.k8s.io/kube-controller-manager:v1.37.2
# registry.k8s.io/kube-scheduler:v1.37.2
# registry.k8s.io/kube-proxy:v1.37.2
# registry.k8s.io/coredns/coredns:v1.14.6
# registry.k8s.io/pause:3.10.2
# registry.k8s.io/etcd:3.7.0-0
sudo kubeadm config images pull --kubernetes-version v1.37.2      # 5 phút 57 giây trên máy soạn bài
for w in cka-w1 cka-w2; do ssh $w 'for i in registry.k8s.io/kube-proxy:v1.37.2 registry.k8s.io/coredns/coredns:v1.14.6 registry.k8s.io/pause:3.10.2; do sudo crictl pull $i; done'; done
sudo kubeadm upgrade plan
# [upgrade/versions] Cluster version: 1.36.6
# [upgrade/versions] kubeadm version: v1.37.2
# Components that must be upgraded manually after you have upgraded the control plane with 'kubeadm upgrade apply':
# COMPONENT   NODE      CURRENT   TARGET
# kubelet     cka-cp    v1.36.6   v1.37.2
# kubelet     cka-w1    v1.36.6   v1.37.2
# kubelet     cka-w2    v1.36.6   v1.37.2
#
# Upgrade to the latest stable version:
# COMPONENT                 NODE      CURRENT   TARGET
# kube-apiserver            cka-cp    v1.36.6   v1.37.2
# kube-controller-manager   cka-cp    v1.36.6   v1.37.2
# kube-scheduler            cka-cp    v1.36.6   v1.37.2
# kube-proxy                          1.36.6    v1.37.2
# CoreDNS                             v1.14.2   v1.14.6
# etcd                      cka-cp    3.6.8-0   3.7.0-0
#
# You can now apply the upgrade by executing the following command:
#
# 	kubeadm upgrade apply v1.37.2
\`\`\`

**3. kubeadm upgrade apply**

\`\`\`bash
time sudo kubeadm upgrade apply v1.37.2
# …
# [addons] Applied essential addon: CoreDNS
# [addons] Applied essential addon: kube-proxy
#
# [upgrade] SUCCESS! A control plane node of your cluster was upgraded to "v1.37.2".
#
# [upgrade] Now please proceed with upgrading the rest of the nodes by following the right order.
# real	3m7.373s
k -n kube-system get pod -o wide | grep -E 'coredns|proxy' | awk '{print $1, $3, $7}'
# coredns-559f6c778d-gtfpb Running cka-w2
# coredns-559f6c778d-rd8cf Running cka-w1
# kube-proxy-6dkg2 Running cka-cp
# kube-proxy-9w9sj Running cka-w1
# kube-proxy-fhzdf Running cka-w2
k get node cka-cp
# cka-cp   Ready   control-plane   6d1h   v1.36.6     ← VERSION là bản kubelet, chưa nâng
# Hai lệnh sau thêm vào lời giải SAU lần làm tay (lần làm tay không có chúng, xem Tư duy); output là của lần chạy tự động thứ hai:
k -n kube-system rollout status deploy/coredns && k -n kube-system rollout status ds/kube-proxy
k -n kube-system create pdb coredns-pdb --selector=k8s-app=kube-dns --min-available=1
k -n kube-system get pdb
# NAME                      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
# calico-kube-controllers   N/A             1                 1                     6d2h
# coredns-pdb               1               N/A               1                     10m
\`\`\`

Vòng request trong 3 phút này (lần làm tay): 0 lỗi (apiserver khởi động lại không ảnh hưởng đường dữ liệu; kube-proxy giữ rule iptables trong lúc Pod của nó được thay).

**4. cka-cp: drain, kubelet, uncordon**

\`\`\`bash
time k drain cka-cp --ignore-daemonsets --delete-emptydir-data
# evicting pod shop/shop-gw-nginx-5d5b66d846-qshm9
# evicting pod demo/demo-podinfo-7f7d667448-l68lv
# evicting pod cert-manager/cert-manager-75548d487f-9zrrv
# …
# node/cka-cp drained
# real	0m14.621s
k get pod -A --field-selector status.phase=Pending | awk '{print $1, $2}'
# cert-manager        cert-manager-75548d487f-t7hwp
# cert-manager        cert-manager-cainjector-8b587f56d-wgpgk
# cert-manager        cert-manager-webhook-5bf5c8f6c-5sv8m
# demo                demo-podinfo-7f7d667448-9kf55
# ingress-nginx       ingress-nginx-controller-684b947cc6-mcvqd
# local-path-storage  local-path-provisioner-6bbd7f54bf-hj2rt
# nginx-gateway       nginx-gateway-7fb4f695f5-tdrhs
# shop                shop-gw-nginx-5d5b66d846-gg6mk
sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet=1.37.2-1.1 kubectl=1.37.2-1.1
# Setting up kubelet (1.37.2-1.1) ...
# Restarting services...
#  systemctl restart kubelet.service          ← needrestart của Ubuntu tự restart
sudo apt-mark hold kubelet kubectl
sudo systemctl daemon-reload && sudo systemctl restart kubelet
k get node cka-cp
# cka-cp   Ready,SchedulingDisabled   control-plane   6d1h   v1.37.2
k uncordon cka-cp
\`\`\`

Tám Pod chờ vì đều ghim control plane (\`nodeSelector\` + toleration, s29/s30/s37/s39); uncordon là chúng lên lại (\`No resources found\` sau 40 giây). Trong lúc đó Ingress và Gateway không trả lời, 30180 thì có.

**5. cka-w1 và tình huống hỏng**

\`\`\`bash
# trên cka-w1 (ssh cka-w1): repo + kubeadm như bước 2, rồi
sudo kubeadm upgrade node
# [upgrade/kubelet-config] The kubelet configuration for this node was successfully upgraded!
# [upgrade/addon] Skipping the addon/coredns phase. Not a control plane node.
# [upgrade/addon] Skipping the addon/kube-proxy phase. Not a control plane node.
# (trên cka-cp)
time k drain cka-w1 --ignore-daemonsets --delete-emptydir-data
# pod/coredns-559f6c778d-rd8cf evicted
# pod/catalog-6c6bbc46f-pxnqb evicted
# pod/gateway-68c4768b4f-vzxmk evicted
# pod/order-94cc644cf-nc4dz evicted
# node/cka-w1 drained
# real	0m32.170s
# trên cka-w1: cài mà không để needrestart restart
sudo apt-mark unhold kubelet kubectl
sudo NEEDRESTART_MODE=l apt-get install -y kubelet=1.37.2-1.1 kubectl=1.37.2-1.1
sudo apt-mark hold kubelet kubectl
kubelet --version
# Kubernetes v1.37.2
systemctl show kubelet -p ActiveEnterTimestamp
# ActiveEnterTimestamp=Fri 2026-11-20 01:07:27 +07     ← tiến trình từ lúc boot, trước khi cài
# (trên cka-cp)
k get node cka-w1
# cka-w1   Ready,SchedulingDisabled   <none>   6d1h   v1.36.6
# trên cka-w1
sudo systemctl daemon-reload && sudo systemctl restart kubelet
# (trên cka-cp)
k get node
# cka-cp   Ready                      control-plane   6d1h   v1.37.2
# cka-w1   Ready,SchedulingDisabled   <none>          6d1h   v1.37.2
# cka-w2   Ready                      <none>          6d1h   v1.36.6
k uncordon cka-w1
k -n shop rollout restart deploy/gateway        # hai Pod gateway đã dồn về cka-w2
~/drills/s42/loop.sh stop ~/drills/s42/loop-cp-w1.log
# đã dừng; 2353 request, 0 lỗi
\`\`\`

Lần làm tay: khoảng 19 phút (gồm 6 phút kéo image), control plane khởi động lại, hai lần drain, 2353 request, không lỗi nào. Lần chạy tự động cuối: \`loop-cp-w1.log\` 1234 request, không lỗi nào.

**6. cka-w2: node giữ PostgreSQL**

\`\`\`bash
~/drills/s42/loop.sh start ~/drills/s42/loop-w2.log
# trên cka-w2: repo, kubeadm, sudo kubeadm upgrade node như cka-w1
time k drain cka-w2 --ignore-daemonsets --delete-emptydir-data
# pod/report-once evicted                     ← Pod trần đã Completed: drain xoá không cần --force
# pod/postgres-0 evicted
# pod/order-94cc644cf-tcjjh evicted
# pod/catalog-6c6bbc46f-whq68 evicted
# …
# node/cka-w2 drained
# real	0m34.366s
# trên cka-w2: unhold, cài kubelet/kubectl 1.37.2-1.1, hold, daemon-reload, restart kubelet
k get node cka-w2
# cka-w2   Ready,SchedulingDisabled   <none>   6d1h   v1.37.2
k uncordon cka-w2
# chờ 30180 trả 200 (23 giây sau uncordon), đợi thêm 15 giây
~/drills/s42/loop.sh stop ~/drills/s42/loop-w2.log
# đã dừng; 267 request, 13 lỗi
grep -v '^#' ~/drills/s42/loop-w2.log | awk '{print $3}' | sort | uniq -c      # cột 5 là mã thoát của curl: 28 = hết giờ
#      13 000
#     254 200
grep -v '^#' ~/drills/s42/loop-w2.log | awk '$3!=200 {if(!f) f=$1; l=$1} END {print l-f}'
# 60.3
echo W2_OUTAGE_SECONDS=60 >> ~/drills/s42/answers.env
\`\`\`

\`000\` là curl hết 5 giây (mã thoát 28): catalog chờ kết nối database (Hikari) chứ không trả lỗi ngay, nên mỗi request lỗi chiếm 5 giây và vòng chỉ ghi ~1 request/5 giây trong cửa sổ đó. Output của bước này là của lần chạy tự động cuối (cùng lời giải); lần làm tay với curl chờ 2 giây ghi 50/192 lỗi, 103 giây. Lúc cka-w2 drain, cka-w1 còn 443 MB available (\`free -m\`, lần làm tay).

**7. Kiểm**

\`\`\`bash
k get node
# cka-cp   Ready    control-plane   6d1h   v1.37.2
# cka-w1   Ready    <none>          6d1h   v1.37.2
# cka-w2   Ready    <none>          6d1h   v1.37.2
ssh cka-w2 'apt-mark showhold | grep kube; cat /etc/apt/sources.list.d/kubernetes.list'
# kubeadm
# kubectl
# kubelet
# deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.37/deb/ /
k -n shop get certificate
# shop-local   True    shop-local-cm-tls   139m
\`\`\`

Thời gian trên máy soạn bài (không gồm 6 phút kéo image): cka-cp \`upgrade apply\` 3 phút 07 giây, drain + kubelet + uncordon thêm 1 phút 30 giây; cka-w1 từ đổi repo tới uncordon 1 phút 43 giây (gồm cả tình huống hỏng); cka-w2 2 phút 07 giây tới uncordon.

Lời giải tự động: \`labs/cka/sessions/s42/apply.sh\` (đúng các bước trên, từng node qua \`files/node.sh\`: \`repo\`, \`kubeadm\`, \`kubelet\`; node đã ở 1.37.2 với gói hold thì bỏ qua, nên chạy lần hai chỉ ghi lại answers.env).`,
    exam: {
      patterns: [
        "\"Nâng control plane (và chỉ control plane) lên 1.xx.y\" — `ssh` vào node, đổi repo nếu khác minor, unhold/cài kubeadm, `kubeadm upgrade plan`, `kubeadm upgrade apply v1.xx.y`, drain, kubelet + kubectl, `daemon-reload`, `restart kubelet`, uncordon. Đề thường cho sẵn repo minor đích; đọc kỹ có cần nâng worker không.",
        "\"Nâng worker node01\" — trên node01: kubeadm, `kubeadm upgrade node` (không phải apply); trên control plane: drain; trên node01: kubelet + kubectl, restart; trên control plane: uncordon.",
        "\"Node vẫn báo bản cũ sau khi nâng\" — `kubelet --version` so với `k get node`; `systemctl status kubelet` (thời điểm khởi động); `daemon-reload` + restart.",
        "\"Cluster đang 1.35, nâng lên 1.37\" — không làm một lần: 1.35 → 1.36 → 1.37, mỗi minor đủ nhịp (kubeadm không cho nhảy hai minor).",
      ],
      timeTargetMin: 12,
      drills: [
        {
          text: "Trong 1 phút: kể từ trí nhớ ba con số của version skew policy cho kubelet, kube-controller-manager và kubectl so với kube-apiserver.",
          timeLimitMin: 1,
          solution: "kubelet (và kube-proxy): không mới hơn apiserver, cũ hơn tối đa 3 minor. kube-controller-manager, kube-scheduler, cloud-controller-manager: không mới hơn, cũ hơn tối đa 1 minor. kubectl: lệch ±1 minor.",
        },
        {
          text: "Trong 6 phút: nâng worker `node01` từ 1.36.6 lên 1.37.2 (repo đã trỏ v1.37). Gõ đủ lệnh, ghi rõ lệnh nào chạy ở đâu.",
          timeLimitMin: 6,
          solution: "```bash\n# trên node01\nsudo apt-mark unhold kubeadm && sudo apt-get update && sudo apt-get install -y kubeadm=1.37.2-1.1 && sudo apt-mark hold kubeadm\nsudo kubeadm upgrade node\n# trên control plane\nk drain node01 --ignore-daemonsets --delete-emptydir-data\n# trên node01\nsudo apt-mark unhold kubelet kubectl && sudo apt-get install -y kubelet=1.37.2-1.1 kubectl=1.37.2-1.1 && sudo apt-mark hold kubelet kubectl\nsudo systemctl daemon-reload && sudo systemctl restart kubelet\n# trên control plane\nk uncordon node01 && k get node node01\n```",
        },
      ],
    },
    tips: [
      "Trên đề, mở trang \"Upgrading kubeadm clusters\" và chép từng khối lệnh: trang có sẵn biến `1.xx.x-*`; chỉ thay bản đích. Đừng gõ từ trí nhớ.",
      "`kubeadm upgrade apply` chỉ một lần, trên control plane đầu tiên. Mọi node còn lại (kể cả control plane khác): `kubeadm upgrade node`.",
      "Sau mỗi node: `k get node` phải thấy đúng bản và không còn `SchedulingDisabled`. Quên uncordon là lỗi mất điểm phổ biến nhất của câu này.",
      "Ghi `kubectl` cùng lúc với `kubelet`: quên nó thì `kubectl version` báo client cũ, vô hại với cluster nhưng đề có thể chấm.",
    ],
    outcome: {
      md: `Cluster lên đúng minor của đề thi, từng node một, mà shop không mất request nào ngoài cửa sổ của node giữ PostgreSQL, và cửa sổ đó được đo. Trên Mac:

\`\`\`bash
./labs/lab verify cka s42
\`\`\`

Bảy dòng, mỗi dòng gom ít tiêu chí và lý do đỏ viết ngắn (lab chỉ in 80 ký tự đầu của lý do). Verify đọc ba node: kubelet \`v1.37.x\` cùng một bản, Ready, không cordon; Pod \`kube-apiserver\`, \`kube-controller-manager\`, \`kube-scheduler\` của cka-cp mang image \`v1.37.x\`, \`etcd\`, CoreDNS, kube-proxy đúng image \`kubeadm config images list --kubernetes-version <bản>\` in ra, \`kubeadm-config\` ghi \`kubernetesVersion: v1.37.x\`. Dòng ứng dụng: CoreDNS có PDB thật sự giữ Pod (\`minAvailable\` ≥ 1 hay ≥ 1%, hoặc \`maxUnavailable\` là số hay phần trăm dưới 100%, và ALLOWED DISRUPTIONS nhỏ hơn số Pod khoẻ; \`minAvailable: 50%\` xanh; \`maxUnavailable: 100%\`: đỏ, đo), release shop \`deployed\`, gateway/catalog/order ≥ 2 replica Available, \`postgres-0\` Ready, ba Deployment cert-manager Available, Certificate \`shop-local\` Ready, webhook nhận một Certificate tạo thử bằng \`--dry-run=server\`, và từ Mac \`:30180\`, Ingress \`shop.local:30080\`, Gateway \`shop.local:30280\` trả 200 với 3 sản phẩm. Trên từng node (\`files/node-facts.sh\` qua \`multipass exec\`): \`kubeadm\`, \`kubelet\`, \`kubectl\` 1.37.x, cả ba \`hold\` (\`apt-mark unhold kubelet\` trên cka-w2: đỏ, đo), repo \`core:/stable:/v1.37\`, \`kubelet --version\` 1.37, dịch vụ \`active\`. \`loop-cp-w1.log\`: có đoạn cka-cp và đoạn cka-w1 bị cordon, kubelet của node đổi \`v1.36\` → \`v1.37\` **trong** đoạn đó (bỏ đoạn cordon của cka-w1 khỏi log: đỏ, đo); với cka-w1 số Pod shop trên node phải về 0 (drain), với cka-cp chỉ chấm được cordon vì \`loop.sh\` không đếm Pod của control plane (giới hạn đã biết); cka-cp lên trước cka-w1, cka-w2 còn \`v1.36\` từ đầu tới cuối log này (sửa log cho cka-w2 thành 1.37: đỏ, đo), request không hở quá 8 giây, 0 lỗi (log của lần drain cka-cp khi CoreDNS còn rollout: 12/1105 request lỗi, đỏ, đo). \`loop-w2.log\`: bắt đầu sau khi \`loop-cp-w1.log\` kết thúc và lúc đó cka-cp, cka-w1 đã 1.37 (sửa dòng đầu cho cka-cp còn 1.36: đỏ, đo); đoạn drain cka-w2 với kubelet đổi bản bên trong, request cuối trả 200, và \`W2_OUTAGE_SECONDS\` cách khoảng từ request lỗi đầu tới request lỗi cuối không quá 10 giây (\`60\` khi log đo 103: đỏ, đo). \`SKEW_RULE=3\` (\`2\`: đỏ, đo).`,
      verifyOutput: "lab: kiểm s42\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~22 phút)\n  ✓ Ba node kubelet v1.37.x cùng bản, Ready, schedulable; kubeadm-config 1.37\n  ✓ Static pod control plane v1.37.x; etcd, CoreDNS, kube-proxy đúng image của kubeadm 1.37\n  ✓ CoreDNS có PDB; shop, postgres, cert-manager (Certificate, webhook) chạy; từ Mac :30180, Ingress :30080, Gateway :30280 trả 200\n  ✓ Ba node: kubeadm, kubelet, kubectl 1.37.x và hold; repo pkgs.k8s.io trỏ v1.37; kubelet active bản 1.37\n  ✓ ~/drills/s42/loop-cp-w1.log: cka-cp (cordon) rồi cka-w1 (drain) lên 1.37 trong đoạn đó, uncordon; cka-w2 còn 1.36; request đều, 0 lỗi\n  ✓ ~/drills/s42/loop-w2.log (sau loop-cp-w1, cp/w1 đã 1.37): cka-w2 được drain, lên 1.37, uncordon; W2_OUTAGE_SECONDS khớp khoảng lỗi (±10 giây)\n  ✓ answers.env: SKEW_RULE là số minor kubelet được cũ hơn kube-apiserver\n  → 7/7 đạt",
      projectDelta: "Cluster chạy Kubernetes 1.37.2, minor của đề thi, nâng từng node một. shop không gián đoạn khi nâng control plane và cka-w1; nâng cka-w2 làm shop mất ~60 giây (lần chạy cuối; 103 giây ở lần làm tay với curl chờ 2 giây) vì PostgreSQL nằm trên PV cục bộ của node đó, một giới hạn đã đo và ghi lại. Mốc st8-upgraded.",
    },
    review: [
      { q: "Thứ tự nâng một cluster kubeadm ba node, và lệnh nào khác giữa control plane đầu tiên và worker?", a: "Control plane trước, rồi từng worker. Mỗi node: đổi repo, nâng kubeadm, bước nâng (control plane đầu tiên `kubeadm upgrade apply v1.37.2`, mọi node khác `kubeadm upgrade node`), drain, nâng kubelet + kubectl, `daemon-reload`, restart kubelet, uncordon. `apply` viết lại static pod và addon của cả cluster; `upgrade node` chỉ cập nhật cấu hình kubelet của node đó (0,3 giây, đo)." },
      { q: "Vì sao được phép có worker 1.36 dưới apiserver 1.37, nhưng không được ngược lại? SKEW_RULE là gì?", a: "Version skew policy: kubelet không được mới hơn kube-apiserver và được cũ hơn tối đa 3 minor (SKEW_RULE=3, từ 1.28; trước đó là 2). apiserver mới vẫn phục vụ API cũ cho kubelet cũ; kubelet mới có thể dùng API mà apiserver cũ chưa có. Nên control plane luôn nâng trước." },
      { q: "Sau khi cài gói kubelet 1.37.2, `k get node` vẫn báo v1.36.6. Vì sao, và trên lab vì sao lần đầu bạn không thấy chuyện này?", a: "Cột VERSION là bản do tiến trình kubelet đang chạy báo; gói mới chỉ thay tệp `/usr/bin/kubelet`. Phải `systemctl daemon-reload && systemctl restart kubelet`. Trên Ubuntu 24.04, needrestart chạy sau apt và tự restart kubelet (đo trên cka-cp); với `NEEDRESTART_MODE=l` thì không, và node giữ v1.36.6 (đo trên cka-w1)." },
      { q: "Vì sao nâng cka-cp và cka-w1 không mất request nào mà cka-w2 thì mất khoảng một phút? Làm gì để hết?", a: "s41 đã cho gateway/catalog/order hai Pod trên hai worker có PDB, nên drain một node luôn còn Pod Ready ở node kia; drain cka-cp chỉ đuổi controller của Ingress/Gateway/cert-manager, vòng request đi qua NodePort 30180. postgres-0 là một replica trên PV local-path ghim cka-w2: drain là Pod Pending tới khi uncordon, catalog/order mất database (đo 60 giây, 13/267 request lỗi ở lần chạy cuối; 103 giây ở lần làm tay). Hết được bằng storage mạng (CSI) hay PostgreSQL có bản sao để failover; PDB không giúp được một replica." },
      { q: "Cert-manager 1.21 chỉ ghi hỗ trợ tới Kubernetes 1.36. Lab làm gì sau khi nâng lên 1.37?", a: "Kiểm thật: Pod Ready, Certificate shop-local Ready, webhook nhận dry-run, xoá Secret thì được cấp lại (0,39 giây, serial mới). Chạy được nên giữ v1.21.3, ghi rõ \"chạy được, chưa được hỗ trợ\"; khi cert-manager 1.22 ra (hỗ trợ 1.37) thì nâng chart. Trước khi nâng cluster ở công ty, đọc bảng hỗ trợ của mọi operator đang chạy." },
    ],
  },
// ───────────────────────────── s43 ─────────────────────────────
  {
    id: "s43",
    stage: "st8",
    title: "Backup và restore etcd",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-lifecycle"],
    requires: ["s42"],
    status: "published",
    pieces: ["etcd-restore"],
    goals: [
      "Chụp snapshot etcd với đủ endpoint và ba chứng chỉ đọc từ manifest, kiểm snapshot bằng `etcdutl snapshot status`.",
      "Xoá một Deployment của shop, khôi phục etcd từ snapshot vào data-dir mới và trỏ static pod etcd sang đó ở đủ ba chỗ (`--data-dir`, volumeMount, hostPath).",
      "Thấy đối tượng đã xoá quay lại, giải thích vì sao đối tượng tạo sau snapshot thì mất, và nhận ra etcd đang chạy trên một thư mục rỗng.",
    ],
    skills: [
      { skill: "k-etcd-snapshot-save", level: "Gõ được có tra" },
      { skill: "k-etcd-snapshot-status", level: "Gõ được không tra" },
      { skill: "k-etcd-restore", level: "Gõ được có tra" },
      { skill: "k-etcd-backup-flow", level: "Dưới 4 phút" },
      { skill: "k-etcd-restore-flow", level: "Dưới 10 phút" },
      { skill: "k-etcd-manifest", level: "Sửa được không tra" },
      { skill: "k-etcd-certs", level: "Biết đường dẫn không tra" },
      { skill: "k-docs-etcd", level: "Tìm được trong 30 giây" },
    ],
    uses: ["k-static-pod-dir", "k-pki-dir", "k-crictl-ps", "vim-move-jump"],
    foundation: null,
    mindset: `**etcd là toàn bộ trạng thái của cluster, và chỉ trạng thái đó.** Mọi đối tượng bạn tạo bằng \`k\` (Deployment, ConfigMap, Secret của Helm, RoleBinding, Certificate của cert-manager) là một key trong etcd, dạng \`/registry/<loại>/<namespace>/<tên>\`. Snapshot etcd là ảnh chụp toàn bộ key đó tại một revision. Restore đưa cả cluster về đúng lúc chụp: thứ bị xoá sau đó quay lại, **thứ tạo sau đó biến mất**. Buổi này đo cả hai: \`before-snapshot\` có lại, \`after-snapshot\` mất, Deployment \`order\` đã xoá có lại với đúng tên Pod cũ và tuổi \`5d3h\` (đối tượng cũ, không phải tạo mới). Cùng lúc, mọi thay đổi khác sau lúc chụp cũng lùi về: ReplicaSet, Pod, Lease, Event, revision Helm nào tạo sau snapshot. Chụp xong mà còn \`helm upgrade\` thì restore trả release về revision trước; buổi này không có upgrade nào giữa hai mốc, nên release \`shop\` vẫn \`deployed\` revision 20 (Secret \`sh.helm.release.v1.shop.v20\` có trong snapshot, đo).

**etcd không phải backup của ứng dụng.** Dữ liệu của PostgreSQL nằm trong PV \`local-path\` trên đĩa cka-w2 (s24), không nằm trong etcd. Snapshot etcd giữ *đối tượng* PVC/PV (tên, kích thước, node), không giữ một dòng nào trong bảng \`products\`. Cluster mất etcd thì restore etcd; database hỏng thì cần \`pg_dump\`/WAL archive như mọi database, giống bạn backup MySQL của một ứng dụng Spring chứ không backup \`application.yml\`. Ngược lại, restore etcd về một tuần trước không đưa database về một tuần trước: Pod \`postgres-0\` cũ chạy lại trên dữ liệu hiện tại.

**Bốn thứ đọc từ manifest, không học thuộc.** \`etcdctl\` nói chuyện với etcd qua TLS hai chiều; mọi giá trị nằm trong \`/etc/kubernetes/manifests/etcd.yaml\`, tên cờ khác tên cờ của etcd:

| etcdctl | đọc từ cờ etcd | giá trị trên cka-cp |
|---|---|---|
| \`--endpoints\` | \`--listen-client-urls\` (lấy địa chỉ loopback) | \`https://127.0.0.1:2379\` |
| \`--cacert\` | \`--trusted-ca-file\` | \`/etc/kubernetes/pki/etcd/ca.crt\` |
| \`--cert\` | \`--cert-file\` | \`/etc/kubernetes/pki/etcd/server.crt\` |
| \`--key\` | \`--key-file\` | \`/etc/kubernetes/pki/etcd/server.key\` |

(Đề thi đôi khi dùng \`healthcheck-client.crt/.key\` hay \`apiserver-etcd-client.crt/.key\`; cặp nào do CA của etcd ký đều được.) Từ etcd 3.6, **\`etcdctl\` chỉ còn \`snapshot save\`**: \`status\` và \`restore\` chuyển sang \`etcdutl\`, công cụ làm việc thẳng với tệp, không cần endpoint hay cert (đo trên 3.7.0: \`etcdctl snapshot --help\` chỉ liệt kê \`save\`). Lab cài \`etcdctl\` và \`etcdutl\` **v3.7.0** (đúng bản server của image \`registry.k8s.io/etcd:3.7.0-0\` mà kubeadm 1.37.2 chạy) từ release chính thức trên GitHub, kiểm sha256 trong \`SHA256SUMS\`, vào \`/usr/local/bin\` như máy thi có sẵn. Không có binary trên host thì vẫn chụp được bằng \`sudo crictl exec <id etcd> etcdctl …\` (image có \`etcdctl\`), nhưng tệp snapshot khi đó nằm trong container: học lệnh host, đề thi chấm tệp trên node.

**Restore là chép ra một cuốn sổ mới, không ghi đè cuốn đang dùng.** \`etcdutl snapshot restore /opt/backup/etcd.db --data-dir /var/lib/etcd-restore\` tạo một data-dir mới (99 MB, so với 221 MB của \`/var/lib/etcd\` đang chạy vì snapshot đã bỏ lịch sử cũ, đo). Rồi bảo kubelet chạy etcd trên thư mục đó bằng manifest static pod. Có **ba** chỗ trỏ tới data-dir, và chúng phải khớp nhau:

| Dòng trong etcd.yaml | Nghĩa |
|---|---|
| \`- --data-dir=/var/lib/etcd\` | etcd đọc/ghi ở đường dẫn này **bên trong container** |
| \`volumeMounts: - mountPath: /var/lib/etcd\` (\`name: etcd-data\`) | gắn volume \`etcd-data\` vào đường dẫn đó trong container |
| \`volumes: - hostPath: path: /var/lib/etcd\` (\`name: etcd-data\`) | volume \`etcd-data\` là thư mục nào **trên node** |

Trang kubernetes.io cho cách ngắn nhất: chỉ đổi \`hostPath\` (container vẫn thấy \`/var/lib/etcd\`, nhưng đó là thư mục mới trên node). Lab đòi đổi cả ba sang \`/var/lib/etcd-restore\`, để \`ps\` hay \`crictl inspect\` nói thật thư mục nào đang chạy. Đổi \`--data-dir\` mà quên hai chỗ kia là tình huống hỏng của buổi, và nó **không báo lỗi**: \`/var/lib/etcd-restore\` bên trong container không được mount nên là một thư mục rỗng trong lớp ghi của container; etcd 3.7.0 log \`"data-dir":"/var/lib/etcd-restore","dir-type":"empty"\`, \`bootstrapping cluster\`, và sau 14 giây là \`ready to serve client requests\` với **0 key**, DB 20 kB (đo). Member ID (\`9c6d935895988819\`) và cluster ID giống hệt bản thật, vì etcd tính chúng từ \`--name\`, \`--initial-cluster\` và token: \`etcdctl member list\`, \`endpoint health\` đều xanh. Ngược lại cũng vậy: hostPath mang \`type: DirectoryOrCreate\`, trỏ hostPath sang một thư mục chưa restore thì kubelet tạo thư mục rỗng và etcd khởi động trên đó. Dấu hiệu duy nhất là dữ liệu mất.

**Cluster trên etcd rỗng trông như bị xoá sạch.** Đo trên lab (apiserver bật lại trên etcd rỗng ~50 giây): apiserver lên, tự tạo bốn namespace mặc định (\`default\`, \`kube-node-lease\`, \`kube-public\`, \`kube-system\`, tuổi 46 giây) và ClusterRole mặc định; \`k get node\` với \`~/.kube/config\` trả \`Forbidden: User "kubernetes-admin" cannot list resource "nodes"\`, vì từ 1.29 \`kubernetes-admin\` nằm trong nhóm \`kubeadm:cluster-admins\` mà ClusterRoleBinding của nhóm đó do \`kubeadm init\` tạo, không phải apiserver: etcd rỗng thì không có. Chỉ \`/etc/kubernetes/super-admin.conf\` (nhóm \`system:masters\`) đọc được: \`No resources found\` cho node, Pod, Deployment. kubelet trên worker log \`nodes "cka-w1" not found\` và \`Forbidden\` cho mọi Pod của nó (Node authorizer không thấy node), nên trong ~50 giây đó **container trên worker vẫn chạy** (cka-w1: 10 container trước và sau) và shop vẫn trả lời. Đừng dựa vào điều đó: lab không đo để lâu hơn. Gỡ: sửa nốt \`mountPath\` và \`hostPath\` (hay đưa \`--data-dir\` về đúng), kubelet thay container etcd, mọi thứ có lại (đo: \`order\` 2/2 tuổi \`5d3h\`); đối tượng apiserver ghi vào etcd rỗng nằm trong lớp ghi của container cũ và mất theo nó. Bài học: sau mỗi restore, \`k get deploy -A\` hay đếm key bằng \`etcdctl get / --prefix --keys-only | wc -l\` (đo: 4490 key lúc chụp), đừng chỉ nhìn \`endpoint health\`.

**Dừng apiserver trước khi restore.** kubernetes.io: đang có apiserver chạy thì không restore etcd; dừng mọi apiserver, restore, bật lại, và khởi động lại kube-controller-manager, kube-scheduler để chúng không giữ dữ liệu cũ. Với kubeadm, "dừng" là dời manifest khỏi \`/etc/kubernetes/manifests\` (kubelet dừng static pod khi tệp biến mất; đo: ba container dừng sau 30 giây) và đặt lại sau. Lab dời \`kube-apiserver.yaml\`, \`kube-controller-manager.yaml\`, \`kube-scheduler.yaml\` sang \`/etc/kubernetes/s43-off/\`, **không** để bản sao nào trong thư mục manifests (kubelet chạy mọi tệp ở đó). Restore thêm \`--bump-revision 1000000000 --mark-compacted\` theo trang Disaster recovery của etcd: revision sau restore nhảy vượt mọi revision client đã thấy (đo: 53019 → 1000053019) và được đánh dấu compacted, nên watch cũ của controller (và của cert-manager, NGINX Gateway Fabric) buộc phải list lại thay vì tin cache. Đề thi thường chỉ cần dạng ngắn \`etcdutl snapshot restore <tệp> --data-dir <thư mục>\`; lab ghi thêm \`--name cka-cp --initial-cluster cka-cp=https://192.168.252.35:2380 --initial-advertise-peer-urls https://192.168.252.35:2380\` để member sau restore giữ đúng peer URL của node (mặc định là \`default=http://localhost:2380\`).

**Sau s43 trên đĩa cka-cp** (s45 cần biết): etcd chạy từ \`/var/lib/etcd-restore\`; \`/var/lib/etcd\` cũ còn nguyên, không dùng; bản gốc manifest ở \`~/drills/s43/etcd.yaml.orig\`; snapshot ở \`/opt/backup/etcd.db\`.`,
    refs: [
      { label: "Bài lộ trình CKA: etcd backup — etcdctl snapshot save với đủ cert flags", href: "#/roadmap/cka/cka-w3-1" },
      { label: "Bài lộ trình CKA: etcd restore — snapshot restore rồi trỏ static pod sang data-dir mới", href: "#/roadmap/cka/cka-w3-2" },
      { label: "Bài lộ trình CKA: tìm endpoint và cert của etcd trong etcd.yaml", href: "#/roadmap/cka/cka-w3-3" },
      { label: "CKA Study Guide, chương 5 — Sao lưu và khôi phục etcd", href: "#/docs/ckabook-05" },
      { label: "kubernetes.io: Operating etcd clusters for Kubernetes (Backing up / Restoring an etcd cluster)", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" },
      { label: "etcd.io: Disaster recovery (snapshot save, etcdutl snapshot restore, --bump-revision)", href: "https://etcd.io/docs/v3.6/op-guide/recovery/" },
      { label: "etcd release v3.7.0 (etcdctl, etcdutl linux-arm64, SHA256SUMS)", href: "https://github.com/etcd-io/etcd/releases/tag/v3.7.0" },
    ],
    stateIn: "Đầu ra s42 (mốc st8-upgraded): cluster 1.37.2, etcd 3.7.0-0 chạy từ /var/lib/etcd, shop chart 0.2.0 (order 2 replica), cert-manager, Ingress, Gateway. `./labs/lab begin cka s43` kiểm đầu vào bằng verify s42, cài etcdctl/etcdutl v3.7.0 (bản ghim, có sha256) vào /usr/local/bin trên cka-cp, tạo ~/drills/s43 và /opt/backup.",
    stateOut: "/opt/backup/etcd.db là snapshot chụp sau ConfigMap before-snapshot, trước after-snapshot và trước khi xoá order; etcd chạy từ /var/lib/etcd-restore (--data-dir, volumeMount, hostPath trong /etc/kubernetes/manifests/etcd.yaml); /var/lib/etcd cũ còn trên đĩa, không dùng; bản gốc manifest ở ~/drills/s43/etcd.yaml.orig; shop như lúc chụp: Deployment order có lại (2 Pod), before-snapshot có, after-snapshot không, release shop deployed; ~/drills/s43/answers.env có LOST_OBJECT.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s43`, rồi `ssh cka-cp`. Mở trang \"Operating etcd clusters for Kubernetes\" (kubernetes.io, ô tìm: `etcd backup`): tìm được trong 30 giây không? `etcdctl version`, `etcdutl version`. Đọc `sudo grep -E 'listen-client|cert-file|key-file|trusted-ca|data-dir' /etc/kubernetes/manifests/etcd.yaml` và ghi ra bốn giá trị `--endpoints`, `--cacert`, `--cert`, `--key` cho etcdctl (cờ etcd nào ứng với cờ etcdctl nào?). `sudo etcdctl … member list -w table`, `endpoint status -w table`.",
      },
      {
        id: "t2",
        text: "Đánh dấu trạng thái trước khi chụp: `k -n shop create configmap before-snapshot --from-literal=note=truoc`. Chụp: `sudo etcdctl --endpoints=… --cacert=… --cert=… --key=… snapshot save /opt/backup/etcd.db` (bấm giờ: dưới 4 phút từ lúc mở manifest). Kiểm: `sudo etcdutl snapshot status /opt/backup/etcd.db -w table` (REVISION, TOTAL KEYS). Thử `etcdctl snapshot status`: có chạy không?",
      },
      {
        id: "t3",
        text: "Sau snapshot: `k -n shop create configmap after-snapshot --from-literal=note=sau`, rồi `k -n shop delete deploy order` (`k -n shop get pod -l app=order`: Pod đâu?). Đoán trước: sau restore, `before-snapshot`, `after-snapshot`, `order` cái nào còn? Ghi tên đối tượng sẽ mất (dạng `configmap/<tên>`) vào `~/drills/s43/answers.env`: `LOST_OBJECT=…`.",
      },
      {
        id: "t4",
        text: "Dừng control plane: `sudo mkdir -p /etc/kubernetes/s43-off && sudo mv /etc/kubernetes/manifests/{kube-apiserver,kube-controller-manager,kube-scheduler}.yaml /etc/kubernetes/s43-off/`. Theo dõi bằng `watch -n2 'sudo crictl ps | grep -E \"etcd|kube-\"'` tới khi ba container biến mất (`k get node` lúc này nói gì?). Restore: `sudo etcdutl snapshot restore /opt/backup/etcd.db --data-dir /var/lib/etcd-restore --name cka-cp --initial-cluster cka-cp=https://<IP cka-cp>:2380 --initial-advertise-peer-urls https://<IP cka-cp>:2380 --bump-revision 1000000000 --mark-compacted`; `sudo du -sh /var/lib/etcd /var/lib/etcd-restore`.",
      },
      {
        id: "t5",
        text: "Tình huống hỏng (cố ý): chép manifest ra ngoài (`sudo cp /etc/kubernetes/manifests/etcd.yaml ~/drills/s43/etcd.yaml.orig`; **không** để bản sao trong thư mục manifests), rồi chỉ sửa `--data-dir=/var/lib/etcd-restore` (`sudo vim /etc/kubernetes/manifests/etcd.yaml`, `/data-dir`). Chờ `sudo crictl ps --name etcd` có container mới; `sudo crictl logs <id> 2>&1 | grep -E 'dir-type|ready to serve'`; `sudo etcdctl … endpoint health`; `sudo etcdctl … get / --prefix --keys-only | wc -l`. etcd có khoẻ không? Dữ liệu đâu? `sudo crictl inspect <id> | grep -A2 containerPath` cho thấy gì? (Đừng đưa apiserver lại lúc này.)",
      },
      {
        id: "t6",
        text: "Sửa cho đúng: trong cùng tệp, `mountPath` của volume `etcd-data` và `path` của hostPath `etcd-data` cũng thành `/var/lib/etcd-restore`. Chờ container etcd mới, kiểm lại số key (phải xấp xỉ TOTAL KEYS của snapshot). Đưa ba manifest về: `sudo mv /etc/kubernetes/s43-off/*.yaml /etc/kubernetes/manifests/`; chờ `k get --raw /readyz` trả `ok`. Kiểm: `k -n shop get deploy order` (AGE là bao nhiêu, vì sao? READY `2/2` có đáng tin ngay sau restore không?), `k -n shop get pod -l app=order -o wide` (Pod nào chạy thật, Pod nào là bóng ma của snapshot?), `curl http://<IP cka-w1>:30180/api/orders`, `k -n shop get cm | grep snapshot`, `helm -n shop list`, `k get node`, `curl http://<IP cka-w1>:30180/api/products`.",
      },
      {
        id: "t7",
        text: "Trên Mac: `./labs/lab verify cka s43` phải 4/4. Ghi lại: thư mục etcd nào đang chạy, thư mục nào còn trên đĩa mà không dùng (`sudo ls /var/lib | grep etcd`). Nghĩ: database của PostgreSQL có được snapshot này bảo vệ không?",
      },
    ],
    hints: [
      "`etcdctl snapshot save` treo không in gì, hay `endpoint health` báo `failed to commit proposal: context deadline exceeded` / `Error: unhealthy cluster`: sai `--cacert` (đo với `/etc/kubernetes/pki/ca.crt`: `snapshot save` treo hơn 3 phút tới khi bị kill). `--cacert` là CA của **etcd** (`/etc/kubernetes/pki/etcd/ca.crt`), không phải CA của cluster. Thử bốn cờ bằng `endpoint health` trước khi `snapshot save`.",
      "`Error: open /etc/kubernetes/pki/etcd/server.key: permission denied` (đo): chạy `etcdctl` bằng `sudo`, key chỉ root đọc được. Tạo `/opt/backup` trước (`sudo mkdir -p`).",
      "`etcdctl snapshot status …` chỉ in lại trợ giúp `Manages etcd node snapshots` với một lệnh con `save` (đo trên 3.7.0): etcd 3.6+ chuyển `status` và `restore` sang `etcdutl`. `sudo etcdutl snapshot status /opt/backup/etcd.db -w table`.",
      "`Error: data-dir \"/var/lib/etcd-restore\" not empty or could not be read` (đo): `etcdutl` không ghi đè thư mục có sẵn. Thư mục đó không phải data-dir đang chạy thì đổi tên (`sudo mv /var/lib/etcd-restore /var/lib/etcd-restore.old`), **không** `rm -rf` khi chưa chắc etcd không chạy trên nó.",
      "etcd healthy, `member list` đúng tên, mà `k get node` trả `Forbidden` cho `kubernetes-admin` và `get / --prefix --keys-only` gần như rỗng: etcd đang chạy trên thư mục rỗng. Ba chỗ `--data-dir`, `mountPath`, `hostPath` chưa khớp nhau (thường là quên hostPath). `sudo crictl inspect <id etcd>` xem mount thật.",
      "Đừng để bản sao manifest (`etcd.yaml.bak`, `etcd.yaml.orig`) trong `/etc/kubernetes/manifests`: kubelet chạy mọi tệp ở đó như một static pod (lab không thử để lại bản sao; verify đỏ nếu thư mục có hơn một manifest etcd).",
      "`k get --raw /readyz` mãi không `ok` sau khi đưa manifest về: chờ thêm (apiserver cần ~30–60 giây), xem `sudo crictl ps -a --name kube-apiserver` và `sudo crictl logs <id>`; lỗi `connection refused … 2379` là etcd chưa lên.",
    ],
    solution: `Output là của máy soạn bài (2026-11-20, Kubernetes 1.37.2, etcd 3.7.0); revision, thời điểm, tên Pod sẽ khác. Bước 1–6 là **lần làm tay**; số đo của lời giải tự động ghi ở cuối. Mọi lệnh chạy trên cka-cp; \`E\` là viết tắt cho bốn cờ:

\`\`\`bash
E="--endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key"
\`\`\`

**1. Đọc manifest**

\`\`\`bash
sudo grep -E 'listen-client|cert-file|key-file|trusted-ca|data-dir' /etc/kubernetes/manifests/etcd.yaml
#     - --cert-file=/etc/kubernetes/pki/etcd/server.crt
#     - --data-dir=/var/lib/etcd
#     - --key-file=/etc/kubernetes/pki/etcd/server.key
#     - --listen-client-urls=https://127.0.0.1:2379,https://192.168.252.35:2379
#     - --peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt
#     - --peer-key-file=/etc/kubernetes/pki/etcd/peer.key
#     - --peer-trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
#     - --trusted-ca-file=/etc/kubernetes/pki/etcd/ca.crt
sudo etcdctl $E member list -w table
# | 9c6d935895988819 | started | cka-cp | https://192.168.252.35:2380 | https://192.168.252.35:2379 |      false |
\`\`\`

**2. Đánh dấu và chụp**

\`\`\`bash
k -n shop create configmap before-snapshot --from-literal=note=truoc
sudo mkdir -p /opt/backup
time sudo etcdctl $E snapshot save /opt/backup/etcd.db
# …"msg":"fetched snapshot","endpoint":"https://127.0.0.1:2379","size":"39 MB","took":"371.430011ms","etcd-version":"3.7.0"}
# Snapshot saved at /opt/backup/etcd.db
# Server version 3.7.0
# real	0m0.383s
sudo etcdutl snapshot status /opt/backup/etcd.db -w table
# ┌──────────┬──────────┬────────────┬────────────┬─────────┐
# │   HASH   │ REVISION │ TOTAL KEYS │ TOTAL SIZE │ VERSION │
# ├──────────┼──────────┼────────────┼────────────┼─────────┤
# │ a39d0d66 │    53019 │       4490 │      39 MB │   3.7.0 │
# └──────────┴──────────┴────────────┴────────────┴─────────┘
etcdctl snapshot status /opt/backup/etcd.db
# Manages etcd node snapshots          ← in lại trợ giúp: chỉ còn lệnh con save
# …
# Available Commands:
#   save        Stores an etcd node backend snapshot to a given file
\`\`\`

**3. Sau snapshot**

\`\`\`bash
k -n shop create configmap after-snapshot --from-literal=note=sau
k -n shop delete deploy order
# deployment.apps "order" deleted from shop namespace
k -n shop get deploy,rs,pod -l app=order          # 15 giây sau
# No resources found in shop namespace.
echo LOST_OBJECT=configmap/after-snapshot > ~/drills/s43/answers.env
\`\`\`

**4. Dừng control plane, restore**

\`\`\`bash
sudo mkdir -p /etc/kubernetes/s43-off
sudo mv /etc/kubernetes/manifests/{kube-apiserver,kube-controller-manager,kube-scheduler}.yaml /etc/kubernetes/s43-off/
# 30 giây sau ba container biến mất khỏi sudo crictl ps; etcd vẫn chạy
k get node
# The connection to the server 192.168.252.35:6443 was refused - did you specify the right host or port?
sudo etcdutl snapshot restore /opt/backup/etcd.db --data-dir /var/lib/etcd-restore --name cka-cp \
  --initial-cluster cka-cp=https://192.168.252.35:2380 --initial-advertise-peer-urls https://192.168.252.35:2380 \
  --bump-revision 1000000000 --mark-compacted
# … bumping latest revision {"latest-revision": 53019, "bump-amount": 1000000000, "new-latest-revision": 1000053019}
# … marking revision compacted {"revision": 1000053019}
# … added member {"cluster-id": "e9b2005d5ce4abef", … "added-peer-id": "9c6d935895988819", "added-peer-peer-urls": ["https://192.168.252.35:2380"]…}
# … restored snapshot {"path": "/opt/backup/etcd.db", … "data-dir": "/var/lib/etcd-restore", …}
sudo du -sh /var/lib/etcd-restore /var/lib/etcd
# 99M	/var/lib/etcd-restore
# 221M	/var/lib/etcd
\`\`\`

**5. Tình huống hỏng: chỉ sửa \`--data-dir\`**

\`\`\`bash
sudo cp /etc/kubernetes/manifests/etcd.yaml ~/drills/s43/etcd.yaml.orig
sudo sed -i 's#- --data-dir=/var/lib/etcd$#- --data-dir=/var/lib/etcd-restore#' /etc/kubernetes/manifests/etcd.yaml
sudo grep -nE 'data-dir|mountPath: /var/lib|path: /var/lib' /etc/kubernetes/manifests/etcd.yaml
# 18:    - --data-dir=/var/lib/etcd-restore
# 75:    - mountPath: /var/lib/etcd
# 91:      path: /var/lib/etcd
# 14 giây sau: container etcd mới (ATTEMPT 0)
sudo crictl logs <id> 2>&1 | grep -E 'dir-type|ready to serve'
# {"level":"info",…,"msg":"Initialize and start etcd server","data-dir":"/var/lib/etcd-restore","dir-type":"empty"}
# {"level":"info",…,"msg":"ready to serve client requests"}
sudo crictl inspect <id> | grep -A1 '"containerPath": "/var/lib'
#     "containerPath": "/var/lib/etcd",
#     "hostPath": "/var/lib/etcd",           ← /var/lib/etcd-restore trong container không được mount
sudo etcdctl $E endpoint status -w table | cut -d'│' -f2,3,6
#  https://127.0.0.1:2379 │ 9c6d935895988819 │   20 kB      ← cùng member ID, DB 20 kB
sudo etcdctl $E get / --prefix --keys-only | grep -c .
# 0
\`\`\`

Lab đã thử đưa apiserver lại lúc này (~50 giây) để xem cluster trên etcd rỗng: \`k get ns\`, \`k get node\` đều \`Error from server (Forbidden): … User "kubernetes-admin" cannot list resource …\`; với \`sudo kubectl --kubeconfig /etc/kubernetes/super-admin.conf get ns\` chỉ có \`default\`, \`kube-node-lease\`, \`kube-public\`, \`kube-system\` tuổi 46 giây, \`get node\`, \`get pod -A\` là \`No resources found\`. kubelet của cka-w1 log \`nodes "cka-w1" not found\` và \`Forbidden\` cho Pod của nó; 10 container trên cka-w1 vẫn chạy. Đừng lặp lại phần này trên đề.

**6. Sửa đủ ba chỗ, bật lại**

\`\`\`bash
sudo vim /etc/kubernetes/manifests/etcd.yaml     # mountPath và hostPath path của etcd-data → /var/lib/etcd-restore
sudo grep -nE 'data-dir|mountPath: /var/lib|path: /var/lib' /etc/kubernetes/manifests/etcd.yaml
# 18:    - --data-dir=/var/lib/etcd-restore
# 75:    - mountPath: /var/lib/etcd-restore
# 91:      path: /var/lib/etcd-restore
sudo mv /etc/kubernetes/s43-off/*.yaml /etc/kubernetes/manifests/
until [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; do sleep 2; done
k -n shop get deploy order
# NAME    READY   UP-TO-DATE   AVAILABLE   AGE
# order   2/2     2            2           5d3h      ← đối tượng cũ từ snapshot
k -n shop get cm | grep snapshot
# before-snapshot                    1      4m6s     ← after-snapshot không còn
helm -n shop list
# shop	shop     	20      	2026-11-20 04:02:12.607126879 +0700 +07	deployed	shop-0.2.0	1.0
k -n shop get pod -l app=order
# order-5549bb6c64-qbhjf   1/1   Running   2 (14m ago)   82m   …   cka-w2
# order-5549bb6c64-stt2c   0/1   Running   3 (14m ago)   81m   …   cka-w1     ← Pod cũ (đã bị xoá) được kubelet chạy lại, Ready sau ít phút
sudo ls /var/lib | grep etcd
# etcd
# etcd-restore
\`\`\`

Lần làm tay: từ lúc sửa nốt hostPath tới khi \`order\` 2/2 và release \`deployed\` là 77 giây. Sau lần làm tay, Pod \`nginx-gateway\` (control plane của NGINX Gateway Fabric) vào \`CrashLoopBackOff\` vì nó khởi động lại đúng lúc apiserver tắt (\`dial tcp 10.96.0.1:443: connect: connection refused\`) và kubelet lùi thời gian thử lại tới 5 phút: Gateway \`:30280\` không trả lời cho tới lần thử sau. Ở lần chạy tự động (dưới), nơi apiserver chỉ tắt một lần, mọi Pod của NGINX Gateway Fabric Running và Gateway \`:30280\` trả 200 ngay sau đó.

**Lời giải tự động** (\`labs/cka/sessions/s43/apply.sh\` → \`files/solve.sh\`, trên trạng thái cuối s42 sau \`restore cka s42\`): cùng luồng, nhưng sửa đủ ba chỗ ngay (không đi qua tình huống hỏng) và chỉ bật control plane lại sau khi container etcd mới đã mount \`/var/lib/etcd-restore\` vào đúng \`--data-dir\`. Lần chạy cuối: 2 phút 13 giây gồm vòng chờ; snapshot revision 51714, 4469 key; sau restore revision 1000051714; ba container control plane dừng sau ~30 giây. **Status cũ sau restore:** hai Pod \`order\` của lúc chụp có lại trong API với status \`Running\`/Ready của lúc chụp, mà container của chúng đã bị xoá; Deployment \`order\` cũng mang status \`2/2 available\` của lúc chụp. Ở một lần chạy, \`k -n shop get deploy order\` báo \`2/2\` trong khi không có Pod \`order\` nào chạy và \`/api/orders\` không trả lời (đo): kubelet không dọn được sandbox của Pod cũ lúc apiserver tắt (\`KillPodSandboxError: … plugin type="calico" failed (delete): … dial tcp 10.96.0.1:443: connect: connection refused\`), Pod cũ nằm ở \`Terminating\`/\`Error\` vài phút, ReplicaSet chỉ tạo Pod mới khi chúng biến mất, và kubelet nhận Pod mới chậm thêm ~1 phút (Pod \`Pending\` 65 giây trên node đã gán). Vì thế \`solve.sh\` ghi tên Pod \`order\` ngay trước khi xoá Deployment, sau restore xoá đúng các Pod đó, rồi chờ tới khi có đủ Pod Ready **mang tên mới** và \`/api/orders\` qua NodePort trả 200; verify cũng đếm Pod Ready và gọi \`/api/orders\` từ Mac thay vì tin status của Deployment. Chạy lần hai: manifest đã trỏ \`/var/lib/etcd-restore\` ở cả ba chỗ, \`before-snapshot\` có, \`after-snapshot\` không, \`order\` chạy → bỏ qua (1,4 giây). Gặp manifest trỏ \`/var/lib/etcd-restore\` một phần (tình huống hỏng, hay kiểu chỉ đổi hostPath) và thư mục đó có \`member/snap/db\` thì nó sửa nốt cho đủ ba chỗ (đo: từ trạng thái hỏng ở bước 5, 77 giây tới 4/4; từ kiểu chỉ đổi hostPath, verify đỏ \`--data-dir=/var/lib/etcd\` rồi apply sửa xong). Script không bao giờ xoá \`/var/lib/etcd\` và không trỏ etcd sang thư mục chưa có dữ liệu.`,
    exam: {
      patterns: [
        "\"Chụp snapshot etcd tại https://127.0.0.1:2379 vào /opt/xxx/etcd-snapshot.db, cert ở …\" — đọc lại cert trong manifest nếu đề không cho; `sudo etcdctl --endpoints … --cacert … --cert … --key … snapshot save <tệp>`; kiểm bằng `etcdutl snapshot status <tệp>`.",
        "\"Khôi phục từ snapshot /opt/xxx.db\" — `etcdutl snapshot restore <tệp> --data-dir /var/lib/etcd-backup`, sửa `/etc/kubernetes/manifests/etcd.yaml` (ít nhất hostPath của `etcd-data`; đổi `--data-dir` thì đổi cả mountPath), chờ etcd và apiserver lên, `k get` đối tượng đề nhắc.",
        "\"etcd không lên sau khi ai đó sửa manifest\" — `sudo crictl ps -a --name etcd`, `sudo crictl logs <id>`; so ba chỗ data-dir; đếm key.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 4 phút, không mở tài liệu: từ một shell trên control plane, chụp snapshot vào `/opt/backup/drill.db` và in REVISION của nó.",
          timeLimitMin: 4,
          solution: "```bash\nsudo grep -E 'listen-client|cert-file|key-file|trusted-ca' /etc/kubernetes/manifests/etcd.yaml\nsudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt \\\n  --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \\\n  snapshot save /opt/backup/drill.db\nsudo etcdutl snapshot status /opt/backup/drill.db -w table\n```",
        },
        {
          text: "Trong 2 phút: manifest etcd có `--data-dir=/var/lib/etcd-new`, `mountPath: /var/lib/etcd`, `hostPath.path: /var/lib/etcd-new`. etcd chạy trên dữ liệu nào? Sửa ít nhất mấy dòng để nó chạy trên `/var/lib/etcd-new` của node?",
          timeLimitMin: 2,
          solution: "Trong container, `/var/lib/etcd-new` không được mount (volume `etcd-data` gắn ở `/var/lib/etcd`), nên etcd chạy trên một thư mục rỗng trong lớp ghi của container: cluster trông như bị xoá. Sửa một dòng: `mountPath: /var/lib/etcd-new` (ba chỗ khớp nhau), hoặc đưa `--data-dir` về `/var/lib/etcd` (hostPath đã trỏ thư mục mới).",
        },
      ],
    },
    tips: [
      "Trên đề, mở trang \"Operating etcd clusters for Kubernetes\" và chép khối lệnh; chỉ thay bốn giá trị đọc từ `etcd.yaml`. Đừng gõ đường dẫn cert từ trí nhớ.",
      "Trước khi sửa manifest, chép nó ra **ngoài** `/etc/kubernetes/manifests` (`~/etcd.yaml.orig`). Bản sao trong thư mục đó là một static pod thứ hai.",
      "Restore xong, kiểm dữ liệu chứ không chỉ kiểm sức khoẻ: `k get` đúng đối tượng đề nhắc, hay đếm key. etcd rỗng vẫn `healthy`.",
      "Đề có thể không có `etcdutl` mà có `etcdctl` cũ (3.5) vẫn còn `snapshot status`/`restore` (đã deprecated). Gõ `etcdctl version`, `which etcdutl` trước.",
    ],
    outcome: {
      md: `Cluster đã đi một vòng mất dữ liệu và lấy lại: Deployment \`order\` bị xoá có lại đúng đối tượng cũ, ConfigMap tạo sau snapshot mất, release shop vẫn \`deployed\`. Trên Mac:

\`\`\`bash
./labs/lab verify cka s43
\`\`\`

Bốn dòng. **Snapshot:** \`sudo etcdutl snapshot status /opt/backup/etcd.db -w json\` đọc được và có key; tệp chứa key \`/registry/configmaps/shop/before-snapshot\` và \`/registry/deployments/shop/order\`, không chứa \`/registry/configmaps/shop/after-snapshot\` (tìm chuỗi byte trong tệp bbolt; snapshot chụp lại sau khi tạo \`after-snapshot\`: đỏ \`snapshot có after-snapshot\`, đo). **etcd:** đúng một manifest có \`component: etcd\` trong \`/etc/kubernetes/manifests\`; \`--data-dir\` là \`/var/lib/etcd-restore\`, có volumeMount ở đúng đường dẫn đó và volume của nó là hostPath \`/var/lib/etcd-restore\` (chỉ đổi hostPath như trang kubernetes.io: đỏ \`--data-dir=/var/lib/etcd\`, đo); container etcd đang chạy (\`crictl inspect\`) mount \`/var/lib/etcd-restore\` của node vào chính \`--data-dir\` của nó (đổi \`--data-dir\` mà quên hostPath: đỏ, etcd đang chạy trên thư mục trong container); \`/var/lib/etcd-restore/member/snap/db\` có; \`etcdctl endpoint health\` và apiserver \`/readyz\` ok. **shop:** \`before-snapshot\` có, \`after-snapshot\` trả \`NotFound\` (lệnh lỗi khác: đỏ), \`order\` chạy thật: số Pod Ready (không đang xoá) đủ replica và từ chính máy Mac \`:30180/api/orders\` trả 200 với một mảng JSON (không tin status của Deployment: ngay sau restore nó là status lúc chụp, đo \`2/2 available\` khi chưa có Pod \`order\` nào chạy; scale \`order\` về 0: đỏ, đo), release \`shop\` \`deployed\`, ba node Ready, và \`:30180/api/products\` trả 200 với 3 sản phẩm. **answers.env:** \`LOST_OBJECT\` là \`after-snapshot\` (chấp nhận \`configmap/\`, \`cm/\` ở trước). Trên đầu vào (cuối s42) cả bốn dòng đỏ (**0/4**, đo).`,
      verifyOutput: "lab: kiểm s43\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)\n  ✓ /opt/backup/etcd.db: etcdutl snapshot status đọc được; có before-snapshot và order, không có after-snapshot\n  ✓ etcd chạy từ /var/lib/etcd-restore (--data-dir, volumeMount, hostPath, container đang chạy); etcd healthy, apiserver /readyz\n  ✓ shop như lúc chụp: before-snapshot có, after-snapshot không, order chạy (Pod Ready, Mac /api/orders 200), release deployed; ba node Ready; Mac /api/products 200\n  ✓ answers.env: LOST_OBJECT là đối tượng mất khi restore\n  → 4/4 đạt",
      projectDelta: "etcd của cluster đã được chụp và khôi phục thật: Deployment order bị xoá có lại cùng tên Pod, cùng tuổi; ConfigMap tạo sau snapshot mất đúng như dự kiến; release shop vẫn deployed. etcd chạy từ /var/lib/etcd-restore (dữ liệu cũ /var/lib/etcd giữ trên đĩa). Mốc etcd-restore.",
    },
    review: [
      { q: "Bốn cờ etcdctl cần để chụp snapshot trên cluster kubeadm, và mỗi cờ đọc từ đâu?", a: "`--endpoints=https://127.0.0.1:2379` (từ `--listen-client-urls`), `--cacert=/etc/kubernetes/pki/etcd/ca.crt` (từ `--trusted-ca-file`), `--cert=/etc/kubernetes/pki/etcd/server.crt` (từ `--cert-file`), `--key=/etc/kubernetes/pki/etcd/server.key` (từ `--key-file`), đều trong `/etc/kubernetes/manifests/etcd.yaml`. Chạy bằng sudo vì key chỉ root đọc được." },
      { q: "Chụp snapshot, tạo ConfigMap B, xoá Deployment D, restore. B và D ra sao, và còn gì khác lùi về?", a: "D có lại (đối tượng cũ: đo `order` tuổi `5d3h`, tên Pod như trước khi xoá), B mất. Mọi thứ ghi vào etcd sau lúc chụp đều lùi: ReplicaSet/Pod mới, Event, Lease, Secret của Helm cho revision mới (release lùi về revision trong snapshot), CSR, token. Dữ liệu ngoài etcd (PV của PostgreSQL, tệp trên node) thì không." },
      { q: "Sửa `--data-dir=/var/lib/etcd-restore` mà quên hostPath. Bạn thấy gì, và vì sao `etcdctl endpoint health` không giúp?", a: "Đường dẫn đó trong container không được mount, nên etcd khởi động trên thư mục rỗng (đo: `dir-type: empty`, 0 key, DB 20 kB) với cùng member ID và cluster ID, nên health và member list đều xanh. apiserver trên etcd rỗng chỉ có bốn namespace mặc định; `kubernetes-admin` bị Forbidden vì ClusterRoleBinding `kubeadm:cluster-admins` không còn; chỉ `super-admin.conf` đọc được, thấy không có node nào. Sửa mountPath và hostPath cho khớp là dữ liệu có lại." },
      { q: "Vì sao dừng kube-apiserver trước khi restore, và `--bump-revision`/`--mark-compacted` giải quyết gì?", a: "apiserver và controller giữ cache và watch theo revision. Restore đưa revision về quá khứ (53019), client đang watch ở revision cao hơn có thể bỏ sót hay tin cache cũ. kubernetes.io bảo dừng mọi apiserver, restore, bật lại, và khởi động lại controller-manager, scheduler. `--bump-revision 1000000000 --mark-compacted` (trang Disaster recovery của etcd) đẩy revision vượt mọi giá trị đã thấy (đo: 1000053019) và đánh dấu compacted, nên mọi watch cũ phải list lại." },
      { q: "Một đồng nghiệp nói \"có snapshot etcd hằng ngày rồi, database của shop an toàn\". Bạn trả lời sao?", a: "Không. etcd chỉ giữ đối tượng Kubernetes: PVC, PV, StatefulSet. Dữ liệu PostgreSQL nằm trên PV `local-path` ở đĩa cka-w2; snapshot etcd không có một dòng nào của bảng. Cần backup riêng (pg_dump, WAL archive, snapshot volume của CSI) và thử restore riêng. Hai loại backup bổ sung cho nhau: etcd đưa lại cấu hình cluster, backup database đưa lại dữ liệu." },
    ],
  },
// ───────────────────────────── s44 ─────────────────────────────
  {
    id: "s44",
    stage: "st8",
    title: "Gia hạn chứng chỉ và control plane HA",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-ha", "ar-lifecycle"],
    requires: ["s43"],
    status: "published",
    pieces: [],
    goals: [
      "Gia hạn toàn bộ chứng chỉ kubeadm, khởi động lại control plane và chứng minh apiserver đang phục vụ cert mới.",
      "Cập nhật kubeconfig admin sau gia hạn và giải thích vì sao kubeconfig của người dùng khác không bị ảnh hưởng.",
      "Vẽ được topology HA stacked etcd và external etcd, nói quorum của 3 và 5 node, và viết đúng lệnh kubeadm init/join cho control plane thứ hai.",
    ],
    skills: [
      { skill: "k-certs-renew", level: "Gõ được không tra" },
      { skill: "k-restart-static-pod", level: "Làm được không tra" },
      { skill: "k-ha-topology", level: "Giải thích được" },
      { skill: "k-cp-endpoint", level: "Viết được có tra" },
      { skill: "k-etcd-member-list", level: "Gõ được có tra" },
      { skill: "k-kubelet-cert-rotation", level: "Giải thích được" },
      { skill: "k-docs-ha", level: "Tìm được trong 30 giây" },
    ],
    uses: ["k-certs-check-expiration", "lx-openssl-x509", "k-static-pod-dir", "k-etcd-certs", "k-kubeconfig-admin"],
    foundation: null,
    mindset: `**Một năm, trừ năm phút.** kubeadm ký mọi cert lá của control plane với hạn một năm (\`certificateValidityPeriod: 8760h0m0s\` trong ConfigMap \`kubeadm-config\`) và CA mười năm (\`caCertificateValidityPeriod: 87600h0m0s\`; ba CA của lab hết hạn 2036-11-10, đo). Đo trên 1.37.2: \`notBefore\` lùi 5 phút so với lúc ký (\`renew apiserver\` lúc 22:56:17 UTC cho \`notBefore=Nov 19 22:51:17 2026 GMT\`, \`notAfter=Nov 19 22:56:17 2027 GMT\`), để node lệch đồng hồ vài phút vẫn tin cert. \`kubeadm upgrade apply\` tự gia hạn mọi cert (s42 làm điều đó: đầu buổi mọi cert hết hạn \`Nov 19, 2027 21:08 UTC\`, cùng một phút), nên cluster nâng cấp đều đặn mỗi năm thì không bao giờ hết hạn. Cluster bị bỏ quên một năm thì hết: \`k\` báo \`x509: certificate has expired\`, kubelet không nói chuyện được với apiserver. Vì thế verify của buổi so với mốc \`~/drills/s44/started\` mà \`begin\` ghi, không so với hạn.

**Mười một cert, một lệnh, bốn lần khởi động lại.** \`kubeadm certs check-expiration\` liệt kê đúng những gì \`renew all\` ký lại: bảy tệp trong \`/etc/kubernetes/pki\` (\`apiserver\`, \`apiserver-kubelet-client\`, \`apiserver-etcd-client\`, \`front-proxy-client\`, \`etcd/server\`, \`etcd/peer\`, \`etcd/healthcheck-client\`) và cert nhúng trong bốn kubeconfig (\`admin.conf\`, \`super-admin.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`). CA không đổi, khoá riêng không đổi, chỉ cert được ký lại (đo: 0,97 giây cho cả mười một). Dòng cuối của output nói việc tiếp theo: \`You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.\` Với static pod, "restart" là dời manifest ra khỏi \`/etc/kubernetes/manifests\`, chờ kubelet dừng container (đo: 30–31 giây cho cả bốn), rồi đưa lại (apiserver \`/readyz\` ok sau 5 giây). Trong khoảng đó \`k\` báo \`connection refused\`; Pod của ứng dụng vẫn chạy, chỉ không ai thay đổi được gì.

**Đo: apiserver và etcd tự nạp lại cert phục vụ; controller-manager và scheduler thì không.** Sau \`kubeadm certs renew apiserver\` (chưa khởi động lại gì), fingerprint mà \`openssl s_client -connect 127.0.0.1:6443\` thấy đã là cert mới ngay lập tức; sau \`renew all\`, cổng etcd 2379 cũng vậy (đo trên 1.37.2 / etcd 3.7.0). kube-apiserver nạp lại cert phục vụ khi tệp \`--tls-cert-file\` đổi, và etcd 3.7 cũng phục vụ cert mới mà không cần khởi động lại. Nhưng đó chỉ là cert **phục vụ**: kube-controller-manager và kube-scheduler dùng cert nhúng trong kubeconfig của chúng, còn apiserver dùng \`apiserver-etcd-client\`, \`apiserver-kubelet-client\` làm client; kubeadm không hứa những cert đó được nạp lại, và chính nó bảo khởi động lại cả bốn. "Fingerprint khớp" vì vậy chưa chứng minh bạn đã khởi động lại: verify so thêm giờ khởi động của bốn container (\`crictl inspect\`, \`startedAt\`) với giờ ghi tệp cert/kubeconfig của chính nó (renew mà không khởi động lại: đỏ \`apiserver chưa khởi động lại; controller-manager chưa khởi động lại; …\`, đo). Làm theo kubeadm: khởi động lại cả bốn.

**kubeconfig của bạn không tự đổi.** \`renew\` ghi \`/etc/kubernetes/admin.conf\` mới, \`~/.kube/config\` vẫn là bản chép cũ (của s06). Nó vẫn chạy (đo: \`k auth whoami\` ra \`kubernetes-admin\` trước khi chép) vì cert cũ do cùng CA ký và chưa hết hạn; nhưng hạn của nó là hạn cũ. Chép lại: \`sudo cp /etc/kubernetes/admin.conf ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config\`. Cert của \`dev\` và \`ops\` (s34) do controller-manager ký qua CSR bằng chính CA đó, nên không cần làm gì (đo: \`whoami\` ra \`dev\` nhóm \`shop-dev\`, \`ops\` nhóm \`shop-ops\` sau khi gia hạn). Đổi CA mới là việc khác hẳn (\`kubeadm certs renew\` không làm): mọi kubeconfig, mọi kubelet phải nhận CA mới. Với người viết Java: giống thay keystore của server bằng cert mới cùng CA; truststore của client không đổi nên client không biết gì; thay CA thì phải phát lại truststore cho mọi client.

**kubelet tự xoay cert của nó.** \`/etc/kubernetes/kubelet.conf\` không nhúng cert mà trỏ \`client-certificate: /var/lib/kubelet/pki/kubelet-client-current.pem\`, một symlink tới tệp có ngày trong tên (\`kubelet-client-2026-11-14-00-39-21.pem\`, hạn \`Nov 13 17:38:39 2027 GMT\` trên cka-cp, đo). \`/var/lib/kubelet/config.yaml\` có \`rotateCertificates: true\`: gần hết hạn, kubelet tạo khoá mới, gửi CSR \`kubernetes.io/kube-apiserver-client-kubelet\`, controller-manager tự duyệt, kubelet ghi tệp mới và đổi symlink. Vì vậy \`check-expiration\` không liệt kê kubelet, và \`renew all\` không đụng tới nó.

**HA: thêm control plane là thêm quầy, etcd là sổ cái cần đa số.** Topology **stacked** (mặc định của kubeadm): mỗi control plane chạy apiserver, controller-manager, scheduler và một member etcd; ít máy, nhưng mất một node là mất cả control plane lẫn member etcd của nó. **External etcd**: cụm etcd riêng trên máy riêng, control plane trỏ \`--etcd-servers\` vào đó; nhiều máy hơn, lỗi tách bạch. Cả hai đều cần một **load balancer** TCP 6443 trước mọi apiserver, và mọi kubeconfig, mọi kubelet trỏ vào địa chỉ của LB. etcd ghi được khi **đa số** member đồng ý: quorum = ⌊n/2⌋ + 1. 3 member → quorum 2, chịu 1 member chết; 5 → quorum 3, chịu 2; 4 → quorum 3, cũng chỉ chịu 1, nên số member luôn lẻ. Cụm lab có 1 member (\`etcdctl member list\`: \`9c6d935895988819 started cka-cp\`): quorum 1, mất cka-cp là mất cluster.

**HA phải quyết lúc \`kubeadm init\`.** \`--control-plane-endpoint lb:6443\` ghi địa chỉ chung vào \`kubeadm-config\` và mọi kubeconfig; \`--upload-certs\` mã hoá các CA và khoá dùng chung, lưu vào Secret \`kubeadm-certs\` (hết hạn sau 2 giờ) và in \`--certificate-key\`. Control plane thứ hai: \`kubeadm join lb:6443 --token … --discovery-token-ca-cert-hash sha256:… --control-plane --certificate-key …\`. Cluster lab không có \`controlPlaneEndpoint\` (đo: \`kubeadm-config\` không có dòng đó; \`kubeadm token create --print-join-command\` in \`kubeadm join 192.168.252.35:6443 …\`, IP của cka-cp), nên không thêm control plane được: lab chỉ viết lệnh vào \`ha.txt\`. \`kubeadm init phase upload-certs --upload-certs\` vẫn chạy được trên lab (đo: \`Storing the certificates in Secret "kubeadm-certs"\`, in một key 64 ký tự hex); đó là cách lấy lại certificate key sau 2 giờ.`,
    refs: [
      { label: "Bài lộ trình CKA: Certificates & kubeconfig — /etc/kubernetes/pki, /etc/kubernetes/*.conf", href: "#/roadmap/cka/cka-w1-5" },
      { label: "Bài lộ trình CKA: Static Pods — kubelet tự quản lý /etc/kubernetes/manifests", href: "#/roadmap/cka/cka-w1-3" },
      { label: "CKA Study Guide, chương 4 — Cài đặt và nâng cấp cluster (HA control plane)", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Certificate Management with kubeadm", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/" },
      { label: "kubernetes.io: Options for Highly Available Topology", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/ha-topology/" },
      { label: "kubernetes.io: Creating Highly Available Clusters with kubeadm", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/high-availability/" },
      { label: "kubernetes.io: Configure Certificate Rotation for the Kubelet", href: "https://kubernetes.io/docs/tasks/tls/certificate-rotation/" },
      { label: "etcd.io: FAQ — Why an odd number of cluster members?", href: "https://etcd.io/docs/v3.6/faq/" },
    ],
    stateIn: "Đầu ra s43: etcd chạy từ /var/lib/etcd-restore, shop như lúc chụp; cert kubeadm do `kubeadm upgrade apply` ở s42 ký lại (hạn 2027-11-19). `./labs/lab begin cka s44` kiểm đầu vào bằng verify s43, ghi mốc giờ vào ~/drills/s44/started và xoá answers.env cũ.",
    stateOut: "Mười một chứng chỉ kubeadm (apiserver, apiserver-kubelet-client, apiserver-etcd-client, front-proxy-client, etcd server/peer/healthcheck-client, admin.conf, super-admin.conf, controller-manager.conf, scheduler.conf) ký lại sau mốc started, CA không đổi; bốn static pod control plane đã khởi động lại và phục vụ cert mới; ~/.kube/config là bản chép của admin.conf mới; dev/ops.kubeconfig của s34 vẫn dùng được; ~/drills/s44/ha.txt có lệnh init/join HA; answers.env QUORUM_5=3; shop, Ingress, Gateway, cert-manager chạy như trước.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s44` (ghi mốc `~/drills/s44/started`), rồi `ssh cka-cp`. Mở trang \"Certificate Management with kubeadm\" (kubernetes.io, ô tìm: `kubeadm certs`): tìm được trong 30 giây không? `sudo kubeadm certs check-expiration`: cert nào hết hạn khi nào, CA nào, cột `EXTERNALLY MANAGED`? Vì sao các cert đều hết hạn vào cùng một ngày, gần một năm sau s42? `sudo openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -subject -startdate -enddate -fingerprint -sha256`.",
      },
      {
        id: "t2",
        text: "So cert trên đĩa với cert apiserver đang phục vụ: `echo | openssl s_client -connect 127.0.0.1:6443 2>/dev/null | openssl x509 -noout -fingerprint -sha256`. Tình huống hỏng (cố ý): `sudo kubeadm certs renew apiserver` (chỉ một cert), rồi so lại hai fingerprint: apiserver đã phục vụ cert mới chưa, dù chưa khởi động lại gì? `./labs/lab verify cka s44` trên Mac: dòng nào đỏ, vì sao fingerprint khớp mà vẫn đỏ?",
      },
      {
        id: "t3",
        text: "`sudo kubeadm certs renew all` (đọc dòng cuối của output). `sudo kubeadm certs check-expiration` lần nữa. Khởi động lại bốn static pod: `sudo mkdir -p /etc/kubernetes/s44-off && sudo mv /etc/kubernetes/manifests/*.yaml /etc/kubernetes/s44-off/`, `watch -n2 'sudo crictl ps | grep -E \"etcd|kube-(apiserver|controller|scheduler)\"'` tới khi bốn container biến mất, rồi `sudo mv /etc/kubernetes/s44-off/*.yaml /etc/kubernetes/manifests/`; chờ `k get --raw /readyz` trả `ok` (`k` lúc này dùng kubeconfig nào, có chạy không?). So lại fingerprint của 6443 với tệp.",
      },
      {
        id: "t4",
        text: "kubeconfig: `sudo cp /etc/kubernetes/admin.conf ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config`; `k auth whoami`. Kubeconfig của dev/ops ở s34: `k --kubeconfig ~/dev.kubeconfig auth whoami`, `k --kubeconfig ~/ops.kubeconfig auth whoami`: còn chạy không, vì sao? Kubelet thì sao: `sudo ls -l /var/lib/kubelet/pki/`, `sudo openssl x509 -in /var/lib/kubelet/pki/kubelet-client-current.pem -noout -enddate`, `sudo grep rotateCertificates /var/lib/kubelet/config.yaml`.",
      },
      {
        id: "t5",
        text: "HA (lab chỉ có một control plane): mở \"Options for Highly Available Topology\" và \"Creating Highly Available Clusters with kubeadm\". Vẽ trên giấy stacked etcd và external etcd (mỗi máy chạy gì, load balancer ở đâu, kubelet của worker trỏ vào đâu). `sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=… --cert=… --key=… member list -w table`: mấy member, quorum của cụm này là bao nhiêu, mất cka-cp thì sao? Ghi `QUORUM_5=<số member phải còn sống để cụm 5 member còn quorum>` vào `~/drills/s44/answers.env`.",
      },
      {
        id: "t6",
        text: "Viết vào `~/drills/s44/ha.txt` (mỗi lệnh một dòng, được dùng `\\` xuống dòng): lệnh `kubeadm init` cho control plane đầu tiên của một cluster HA sau load balancer `lb.cka.local:6443` (với `--control-plane-endpoint` và `--upload-certs`), lệnh `kubeadm join` cho control plane thứ hai (với `--control-plane` và `--certificate-key`) và lệnh join của worker. `k -n kube-system get cm kubeadm-config -o yaml | grep controlPlaneEndpoint`: cluster lab có thêm control plane được không? Trên Mac: `./labs/lab verify cka s44` phải 5/5.",
      },
    ],
    hints: [
      "`kubeadm certs check-expiration` báo cert còn gần một năm ngay từ đầu buổi: `kubeadm upgrade apply` ở s42 đã tự gia hạn mọi cert (mặc định của `upgrade apply`; tắt bằng `--certificate-renewal=false`). Verify vì vậy so với mốc `~/drills/s44/started`, không so với hạn.",
      "Fingerprint ở 6443 đã khớp tệp mà verify vẫn đỏ `apiserver chưa khởi động lại`: apiserver (và etcd) tự phục vụ cert mới (đo), nhưng controller-manager, scheduler và các cert client thì kubeadm bảo phải khởi động lại. Dời bốn manifest ra, chờ container dừng, đưa lại.",
      "Verify đỏ `controller-manager không chạy` ngay sau khi đưa manifest lại: kubelet tạo lại bốn Pod không cùng lúc (đo). Chờ `sudo crictl ps` có đủ bốn container rồi chạy lại verify.",
      "Dòng cert đỏ `10/11 chưa gia hạn` (hay số khác): bạn gia hạn từng cert (`renew apiserver`) thay vì `renew all`, hoặc gia hạn **trước** lúc `begin` (mốc mới hơn lần ký). Gia hạn lại sau mốc.",
      "Verify dòng kubeconfig báo `~/.kube/config khác admin.conf`: chưa chép, renew lần nữa sau khi chép, hay chép `super-admin.conf`. Chép lại `admin.conf` sau lần renew cuối.",
      "`kubeadm join … --control-plane` trên cluster lab sẽ không có tác dụng như mong đợi: `kubeadm-config` không có `controlPlaneEndpoint` (cluster init bằng IP của cka-cp, đo). HA phải quyết từ lúc `kubeadm init`.",
    ],
    solution: `Output là của máy soạn bài (2026-11-20, Kubernetes 1.37.2, sau s43); giờ, fingerprint, hạn sẽ khác. Bước 1–5 là **lần làm tay** (gồm hai lần cố ý làm thiếu); số đo của lời giải tự động ở cuối. Mọi lệnh chạy trên cka-cp.

**1. Đầu buổi**

\`\`\`bash
cat ~/drills/s44/started
# 1795128944                     ← 2026-11-20 05:55:44 +07 (22:55:44 UTC), begin ghi
sudo kubeadm certs check-expiration
# CERTIFICATE                EXPIRES                  RESIDUAL TIME   CERTIFICATE AUTHORITY   EXTERNALLY MANAGED
# admin.conf                 Nov 19, 2027 21:08 UTC   364d            ca                      no
# apiserver                  Nov 19, 2027 21:08 UTC   364d            ca                      no
# apiserver-etcd-client      Nov 19, 2027 21:08 UTC   364d            etcd-ca                 no
# apiserver-kubelet-client   Nov 19, 2027 21:08 UTC   364d            ca                      no
# controller-manager.conf    Nov 19, 2027 21:08 UTC   364d            ca                      no
# etcd-healthcheck-client    Nov 19, 2027 21:08 UTC   364d            etcd-ca                 no
# etcd-peer                  Nov 19, 2027 21:08 UTC   364d            etcd-ca                 no
# etcd-server                Nov 19, 2027 21:08 UTC   364d            etcd-ca                 no
# front-proxy-client         Nov 19, 2027 21:08 UTC   364d            front-proxy-ca          no
# scheduler.conf             Nov 19, 2027 21:08 UTC   364d            ca                      no
# super-admin.conf           Nov 19, 2027 21:08 UTC   364d            ca                      no
#
# CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   EXTERNALLY MANAGED
# ca                      Nov 10, 2036 17:38 UTC   9y              no
# etcd-ca                 Nov 10, 2036 17:38 UTC   9y              no
# front-proxy-ca          Nov 10, 2036 17:38 UTC   9y              no
sudo openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -subject -startdate -enddate -fingerprint -sha256
# subject=CN = kube-apiserver
# notBefore=Nov 19 21:03:18 2026 GMT          ← s42: upgrade apply lúc 21:08, lùi 5 phút
# notAfter=Nov 19 21:08:18 2027 GMT
# sha256 Fingerprint=0B:79:75:EB:…:A4:73
echo | openssl s_client -connect 127.0.0.1:6443 2>/dev/null | openssl x509 -noout -fingerprint -sha256
# sha256 Fingerprint=0B:79:75:EB:…:A4:73
\`\`\`

**2. Làm thiếu lần một: chỉ một cert**

\`\`\`bash
sudo kubeadm certs renew apiserver
# certificate for serving the Kubernetes API renewed
sudo openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -startdate -enddate -fingerprint -sha256
# notBefore=Nov 19 22:51:17 2026 GMT
# notAfter=Nov 19 22:56:17 2027 GMT
# sha256 Fingerprint=C8:63:80:48:…:54:8C
echo | openssl s_client -connect 127.0.0.1:6443 2>/dev/null | openssl x509 -noout -fingerprint -sha256
# sha256 Fingerprint=C8:63:80:48:…:54:8C     ← apiserver đã phục vụ cert mới, chưa khởi động lại gì
\`\`\`

Verify lúc này (trên Mac):

\`\`\`
  ✗ Mười một cert kubeadm (pki, etcd, bốn kubeconfig) ký lại sau mốc ~/drills/s44/started (thực tế: 10/11 chưa gia hạn: as-kubelet-client,as-etcd-client,front-proxy-client,etcd-ser)
  ✗ apiserver :6443 và etcd :2379 phục vụ cert trên đĩa; … (thực tế: apiserver chưa khởi động lại; controller-manager chưa khởi động lại; scheduler c)
\`\`\`

**3. Làm thiếu lần hai: renew all mà không khởi động lại**

\`\`\`bash
time sudo kubeadm certs renew all
# certificate embedded in the kubeconfig file for the admin to use and for kubeadm itself renewed
# certificate for serving the Kubernetes API renewed
# … (11 dòng)
# certificate embedded in the kubeconfig file for the super-admin renewed
#
# Done renewing certificates. You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd, so that they can use the new certificates.
# real	0m0.970s
P=/etc/kubernetes/pki/etcd
sudo openssl x509 -in $P/server.crt -noout -fingerprint -sha256
# sha256 Fingerprint=AC:8C:E7:B6:…:AF:29
echo | sudo openssl s_client -connect 127.0.0.1:2379 -cert $P/healthcheck-client.crt -key $P/healthcheck-client.key -CAfile $P/ca.crt 2>/dev/null | openssl x509 -noout -fingerprint -sha256
# sha256 Fingerprint=AC:8C:E7:B6:…:AF:29     ← etcd cũng đã phục vụ cert mới
sudo kubeadm certs check-expiration | grep -E '^(admin|apiserver |scheduler)'
# admin.conf                 Nov 19, 2027 22:56 UTC   364d            ca                      no
# apiserver                  Nov 19, 2027 22:56 UTC   364d            ca                      no
# scheduler.conf             Nov 19, 2027 22:56 UTC   364d            ca                      no
\`\`\`

Verify: dòng cert xanh, dòng thứ hai vẫn đỏ \`apiserver chưa khởi động lại; controller-manager chưa khởi động lại; scheduler c…\` (giờ khởi động container trước giờ ghi tệp), dòng kubeconfig đỏ \`~/.kube/config khác admin.conf\`. Fingerprint khớp không đủ: kubeadm bảo khởi động lại cả bốn.

**4. Khởi động lại bốn static pod, kubeconfig**

\`\`\`bash
sudo mkdir -p /etc/kubernetes/s44-off
sudo mv /etc/kubernetes/manifests/*.yaml /etc/kubernetes/s44-off/
until [ -z "$(sudo crictl ps -q --name '^(etcd|kube-apiserver|kube-controller-manager|kube-scheduler)$')" ]; do sleep 2; done   # 31 giây
k get node
# The connection to the server 192.168.252.35:6443 was refused - did you specify the right host or port?
sudo mv /etc/kubernetes/s44-off/*.yaml /etc/kubernetes/manifests/
until [ "$(k get --raw /readyz 2>/dev/null)" = ok ]; do sleep 2; done                                                          # 5 giây
sudo crictl ps --name '^(etcd|kube-apiserver|kube-controller-manager|kube-scheduler)$'
# cc5e761958713   a6d02e64d4827   3 seconds ago   Running   kube-apiserver            0   …
# 19fffd055a6d1   97b03ac504259   4 seconds ago   Running   kube-scheduler            4   …
# 052593755100d   c2e426bbd1cd6   4 seconds ago   Running   etcd                      1   …
# f2065cda8b46a   9958587f99032   4 seconds ago   Running   kube-controller-manager   4   …
k auth whoami | head -2              # vẫn bản ~/.kube/config cũ
# ATTRIBUTE   VALUE
# Username    kubernetes-admin
sudo cp /etc/kubernetes/admin.conf ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config
k --kubeconfig ~/dev.kubeconfig auth whoami
# Username    dev
# Groups      [shop-dev system:authenticated]
k --kubeconfig ~/ops.kubeconfig auth whoami
# Username    ops
# Groups      [shop-ops system:authenticated]
sudo ls -l /var/lib/kubelet/pki/
# -rw------- 1 root root 2822 Nov 14 00:39 kubelet-client-2026-11-14-00-39-21.pem
# lrwxrwxrwx 1 root root   59 Nov 14 00:39 kubelet-client-current.pem -> /var/lib/kubelet/pki/kubelet-client-2026-11-14-00-39-21.pem
# -rw-r--r-- 1 root root 2254 Nov 14 00:39 kubelet.crt
# -rw------- 1 root root 1679 Nov 14 00:39 kubelet.key
sudo openssl x509 -in /var/lib/kubelet/pki/kubelet-client-current.pem -noout -subject -enddate
# subject=O = system:nodes, CN = system:node:cka-cp
# notAfter=Nov 13 17:38:39 2027 GMT
sudo grep -n rotateCertificates /var/lib/kubelet/config.yaml
# 42:rotateCertificates: true
\`\`\`

**5. HA**

\`\`\`bash
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$P/ca.crt --cert=$P/server.crt --key=$P/server.key member list -w table
# | 9c6d935895988819 | started | cka-cp | https://192.168.252.35:2380 | https://192.168.252.35:2379 |      false |
k -n kube-system get cm kubeadm-config -o jsonpath='{.data.ClusterConfiguration}' | grep controlPlaneEndpoint
# (không in gì: cluster init không có controlPlaneEndpoint)
sudo kubeadm token create --print-join-command --ttl 10m
# kubeadm join 192.168.252.35:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>     ← IP của cka-cp, không phải LB
sudo kubeadm init phase upload-certs --upload-certs
# [upload-certs] Storing the certificates in Secret "kubeadm-certs" in the "kube-system" Namespace
# [upload-certs] Using certificate key:
# fbc0d6fb2eae846e81683b7dfb7ed87702a7377b7297fc964e012b6ff231f638
cat > ~/drills/s44/ha.txt <<'HA'
sudo kubeadm init --control-plane-endpoint lb.cka.local:6443 --upload-certs --pod-network-cidr 192.168.0.0/16
sudo kubeadm join lb.cka.local:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash> --control-plane --certificate-key <key>
sudo kubeadm join lb.cka.local:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
HA
echo QUORUM_5=3 > ~/drills/s44/answers.env
\`\`\`

Lần làm tay đầu tiên viết \`join\` thiếu \`--certificate-key\` và \`QUORUM_5=2\`: verify đỏ \`join thiếu --control-plane/--certificate-key\` và \`QUORUM_5=2 chưa đúng\` (3/5); sửa thì 5/5. Lệnh trải nhiều dòng bằng \`\\\` vẫn được chấm (verify nối dòng trước khi đọc).

**Lời giải tự động** (\`labs/cka/sessions/s44/apply.sh\` → \`setup.sh\` đặt mốc mới, rồi \`files/solve.sh\`): \`check-expiration\`, \`renew all\`, dời bốn manifest ra \`/etc/kubernetes/s44-off\`, chờ container dừng (30–31 giây), đưa lại, chờ \`/readyz\` **và** đủ bốn container chạy (lần đầu chưa chờ bước này: verify chạy ngay sau đó thấy \`controller-manager không chạy\`, 4/5, đo), chép \`admin.conf\`, \`member list\`, \`ha.txt\`, \`answers.env\`. 39 giây tới 1 phút 28 giây (tuỳ lúc kubelet tạo lại container); chạy lại được (mỗi lần là một mốc mới và một lần gia hạn mới), lần hai 5/5.`,
    exam: {
      patterns: [
        "\"Cert của apiserver sắp hết hạn, gia hạn mọi cert của control plane bằng kubeadm\" — `kubeadm certs check-expiration`, `kubeadm certs renew all`, khởi động lại bốn static pod (dời manifest ra rồi vào), chép `admin.conf` vào `~/.kube/config`, `check-expiration` lại.",
        "\"Cert của apiserver hết hạn khi nào? Ghi ngày vào /opt/xxx\" — `kubeadm certs check-expiration` hay `openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -enddate`.",
        "\"Cluster HA: control plane thứ hai join thế nào?\" (thường là câu hỏi lý thuyết hoặc chọn lệnh) — `kubeadm join <LB>:6443 --token … --discovery-token-ca-cert-hash sha256:… --control-plane --certificate-key …`; certificate-key từ `kubeadm init --upload-certs` hay `kubeadm init phase upload-certs --upload-certs`.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 8 phút: gia hạn mọi cert kubeadm của control plane, làm cho apiserver dùng cert mới, và chứng minh bằng một lệnh so fingerprint.",
          timeLimitMin: 8,
          solution: "```bash\nsudo kubeadm certs renew all\nsudo mkdir -p /etc/kubernetes/off && sudo mv /etc/kubernetes/manifests/*.yaml /etc/kubernetes/off/\nwatch -n2 'sudo crictl ps | grep -E \"etcd|kube-\"'     # chờ bốn container biến mất\nsudo mv /etc/kubernetes/off/*.yaml /etc/kubernetes/manifests/\nsudo cp /etc/kubernetes/admin.conf ~/.kube/config && sudo chown $(id -u):$(id -g) ~/.kube/config\ndiff <(sudo openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -fingerprint -sha256) \\\n     <(echo | openssl s_client -connect 127.0.0.1:6443 2>/dev/null | openssl x509 -noout -fingerprint -sha256) && echo khớp\n```",
        },
        {
          text: "Trong 1 phút: cụm etcd 3, 4, 5, 6 member chịu được mấy member chết? Vì sao không ai chạy 4?",
          timeLimitMin: 1,
          solution: "Quorum = ⌊n/2⌋ + 1. 3 → quorum 2, chịu 1; 4 → quorum 3, chịu 1; 5 → quorum 3, chịu 2; 6 → quorum 4, chịu 2. Thêm member thứ 4 không chịu thêm được lỗi nào mà tăng số máy phải đồng ý mỗi lần ghi (và chia mạng 2–2 thì cả hai nửa đều mất quorum).",
        },
      ],
    },
    tips: [
      "`kubeadm certs renew all` in sẵn việc phải làm tiếp: \"You must restart the kube-apiserver, kube-controller-manager, kube-scheduler and etcd\". Đọc dòng cuối của output trước khi gõ lệnh tiếp.",
      "Đừng quên `~/.kube/config`: renew ghi `admin.conf` mới, không đụng bản chép trong thư mục home.",
      "Dời manifest **ra ngoài** `/etc/kubernetes/manifests` (không đổi tên trong cùng thư mục: kubelet đọc mọi tệp ở đó).",
      "Câu HA trên đề thường là lý thuyết: nhớ ba thứ — load balancer trước apiserver (`--control-plane-endpoint`), `--upload-certs` để control plane mới tải cert về, `--control-plane --certificate-key` khi join.",
    ],
    outcome: {
      md: `Control plane đã có cert mới và đang dùng chúng, kubeconfig admin đã cập nhật, kubeconfig của dev/ops vẫn chạy. Trên Mac:

\`\`\`bash
./labs/lab verify cka s44
\`\`\`

Năm dòng. **Cert:** mười một cert của \`kubeadm certs check-expiration\` (bảy tệp trong \`/etc/kubernetes/pki\`, cert nhúng trong \`admin.conf\`, \`super-admin.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`) có \`notBefore\` + 300 giây (kubeadm lùi 5 phút, đo) không sớm hơn mốc \`~/drills/s44/started\` của \`begin\` (chỉ \`renew apiserver\`: đỏ \`10/11 chưa gia hạn\`, đo). **Control plane:** fingerprint SHA-256 mà \`openssl s_client\` thấy ở \`127.0.0.1:6443\` và \`127.0.0.1:2379\` bằng tệp \`apiserver.crt\`, \`etcd/server.crt\`; container \`kube-apiserver\`, \`kube-controller-manager\`, \`kube-scheduler\`, \`etcd\` (\`crictl inspect\`, \`startedAt\`) khởi động sau mốc và sau lần ghi tệp cert/kubeconfig của chính nó (\`renew all\` không khởi động lại: đỏ \`apiserver chưa khởi động lại; …\`, đo, dù fingerprint đã khớp); \`/readyz\`; ba node Ready; ba Deployment cert-manager Available, Certificate \`shop-local\` Ready, webhook nhận một Certificate tạo thử \`--dry-run=server\`; gateway, catalog, order Available; và từ chính máy Mac \`:30180\`, Ingress \`shop.local:30080\`, Gateway \`shop.local:30280\` trả 200 với 3 sản phẩm. **kubeconfig:** client cert trong \`~/.kube/config\` trùng cert của \`admin.conf\` (đã gia hạn sau mốc), \`k auth whoami\` ra \`kubernetes-admin\`; \`~/dev.kubeconfig\`, \`~/ops.kubeconfig\` của s34 \`whoami\` ra \`dev\`, \`ops\`. **ha.txt:** có dòng \`kubeadm init\` mang \`--control-plane-endpoint\` và \`--upload-certs\`, và dòng \`kubeadm join\` mang \`--control-plane\` và \`--certificate-key\` (dòng nối bằng \`\\\` được ghép lại; thiếu \`--certificate-key\`: đỏ, đo). **answers.env:** \`QUORUM_5=3\` (\`2\`: đỏ, đo). Trên đầu vào (cuối s43) cả năm dòng đỏ, trước \`begin\` (\`chưa có mốc started\`) và ngay sau \`begin\` (**0/5**, đo); chạy lại \`begin\` là đặt mốc mới, phải gia hạn lại.`,
      verifyOutput: "lab: kiểm s44\n  (chờ apiserver, Deployment của shop và cert-manager, nếu đang khởi động: tối đa ~30 phút)\n  ✓ Mười một cert kubeadm (pki, etcd, bốn kubeconfig) ký lại sau mốc ~/drills/s44/started\n  ✓ apiserver :6443 và etcd :2379 phục vụ cert trên đĩa; control plane khởi động lại sau gia hạn; node, cert-manager, shop chạy; Mac :30180, :30080, :30280 trả 200\n  ✓ ~/.kube/config dùng client cert của admin.conf mới; dev/ops.kubeconfig (s34) vẫn gọi được API\n  ✓ ~/drills/s44/ha.txt: kubeadm init --control-plane-endpoint --upload-certs; kubeadm join --control-plane --certificate-key\n  ✓ answers.env: QUORUM_5 là số member etcd phải sống trong cụm 5\n  → 5/5 đạt",
      projectDelta: "Chứng chỉ của control plane có hạn mới (một năm từ hôm nay), apiserver và etcd đang dùng chúng, kubeconfig admin đã cập nhật mà kubeconfig dev/ops cấp ở s34 vẫn chạy vì CA không đổi. Bản kế hoạch HA (lệnh init/join, quorum) nằm trong ~/drills/s44/ha.txt.",
    },
    review: [
      { q: "Vì sao sau `kubeadm certs renew all` vẫn phải khởi động lại control plane, và làm sao chứng minh đã khởi động lại đúng?", a: "kube-apiserver, controller-manager, scheduler và etcd đọc cert/kubeconfig lúc khởi động; renew chỉ ghi tệp mới. Dời bốn manifest ra khỏi /etc/kubernetes/manifests, chờ container dừng, đưa lại. Chứng minh: fingerprint của `openssl s_client -connect 127.0.0.1:6443` (và :2379) bằng tệp trên đĩa, **và** `crictl inspect` cho giờ khởi động mỗi container sau giờ ghi tệp của nó. Fingerprint một mình không đủ: đo trên 1.37.2, apiserver và etcd đã phục vụ cert mới ngay sau `renew` mà chưa khởi động lại gì; verify vẫn đỏ `apiserver chưa khởi động lại; controller-manager chưa khởi động lại; …`." },
      { q: "Renew xong, `~/dev.kubeconfig` của s34 có cần cấp lại không? Còn `~/.kube/config`?", a: "dev.kubeconfig không: cert của dev do CA của cluster ký qua CSR, `kubeadm certs renew` ký lại cert của control plane bằng chính CA đó, CA (10 năm) không đổi, nên mọi cert client do CA ký vẫn được tin (đo: whoami ra dev, ops). ~/.kube/config cũ cũng vẫn chạy tới hạn của nó, nhưng đó là cert admin cũ: chép admin.conf mới để có hạn mới." },
      { q: "kubelet có được `kubeadm certs renew` gia hạn không?", a: "Không. kubelet.conf trỏ tới /var/lib/kubelet/pki/kubelet-client-current.pem, và kubelet tự xoay cert client đó (`rotateCertificates: true` trong /var/lib/kubelet/config.yaml): gần hết hạn thì nó gửi CSR mới, controller-manager tự duyệt và ký. Vì thế `check-expiration` không liệt kê kubelet." },
      { q: "Stacked etcd và external etcd khác nhau thế nào? Cụm 5 member cần mấy member sống?", a: "Stacked: mỗi control plane chạy cả apiserver lẫn một member etcd (mặc định của kubeadm, ít máy, nhưng mất một node là mất cả hai). External: cụm etcd riêng trên máy riêng, control plane chỉ trỏ vào (nhiều máy hơn, cô lập lỗi). Quorum ⌊n/2⌋+1: 5 member cần 3 sống (QUORUM_5=3), chịu 2 member chết; 3 member cần 2, chịu 1." },
      { q: "Vì sao không thêm được control plane thứ hai vào cluster lab, và lần sau dựng cluster bạn làm gì khác?", a: "kubeadm-config không có `controlPlaneEndpoint`: mọi kubeconfig và kubelet trỏ thẳng IP của cka-cp, nên không có địa chỉ chung để control plane thứ hai đứng sau. Lần sau `kubeadm init --control-plane-endpoint lb:6443 --upload-certs` ngay từ đầu (kể cả khi lúc đó chỉ có một control plane), rồi `kubeadm join lb:6443 … --control-plane --certificate-key …`." },
    ],
  },
  {
    id: "s45",
    stage: "st8",
    title: "Sự cố chặng 8: sau nâng cấp và sau restore",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-components"],
    requires: ["s44"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Sửa trong 20 phút một worker còn kubelet bản cũ và một etcd khởi động sai data-dir sau restore.",
      "Đọc phiên bản của từng thành phần để tìm chỗ lệch.",
      "Đọc log container control plane bằng crictl khi kubectl chưa dùng được.",
    ],
    skills: [
      { skill: "k-version-check", level: "Gõ được không tra" },
      { skill: "k-etcd-health", level: "Gõ được có tra" },
      { skill: "k-crictl-logs", level: "Gõ được không tra" },
      { skill: "k-post-restore-check", level: "Dưới 5 phút" },
    ],
    uses: ["k-version-skew", "k-etcd-manifest", "k-kubelet-journal", "k-upgrade-worker-flow", "k-crictl-ps"],
    stateIn: "Đầu ra s44 cộng `./labs/lab break`.",
    stateOut: "Ba node Ready cùng minor, etcd khoẻ, shop chạy đủ như cuối s44.",
  },
];
