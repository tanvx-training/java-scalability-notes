// Chặng 8 — Vận hành cluster: bảo trì node, nâng cấp, etcd, chứng chỉ, HA.
// s41–s42 đã phát hành (đợt 4); s43–s45 là buổi khung: đủ trường cấu trúc (check-data PR7), nội dung ở đợt sau.

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

**RAM khi drain (đo).** Sau khi thêm replica thứ hai của order: \`free -m\` available cka-w1 624, cka-w2 725 MB. Drain cka-w1 dồn Pod sang cka-w2 tới khi hết chỗ theo **requests** (256Mi mỗi service): vài Pod lên được, phần còn lại \`Pending\` (\`Insufficient memory\`) cho tới khi uncordon; cka-w2 còn 370–493 MB (đo qua ba lần drain). Pending không làm mất request: Pod còn lại trên cka-w2 vẫn phục vụ, và PDB đã đảm bảo nó Ready trước khi Pod kia bị đuổi. Lab không hạ requests để mọi Pod chen lên một node: requests thấp mà RAM thật vẫn 170Mi mỗi Pod thì node bị OOM, tệ hơn Pending.

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
        text: "`k uncordon cka-w1`. Pod `Pending` đi đâu? Service nào giờ có cả hai Pod trên cka-w2? `k rollout restart deploy/<tên>` cho service đó và xem Pod mới trải ra hai node. `~/drills/s41/loop.sh stop ~/drills/s41/loop.log`: bao nhiêu request, bao nhiêu lỗi? `grep '^#' ~/drills/s41/loop.log`: đọc từng dòng trạng thái (cordon, số Pod trên cka-w1 về 0, uncordon).",
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
grep '^#' ~/drills/s41/loop.log      # (lần chạy của apply.sh sau khi sửa priority: 235 request, 0 lỗi)
# # 1795115879 02:17:59 start http://192.168.252.36:30180/api/products
# # 1795115880 02:18:00 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=5 cka-w2=3
# # 1795115891 02:18:11 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/cordon cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=3
# # 1795115905 02:18:25 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/cordon cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=0 cka-w2=4
# # 1795115934 02:18:54 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=0 cka-w2=4
# # 1795115955 02:19:15 nodes cka-cp=v1.36.6/sched cka-w1=v1.36.6/sched cka-w2=v1.36.6/sched pods cka-cp=0 cka-w1=3 cka-w2=4
# # 1795115999 02:19:59 stop
\`\`\`

Đọc từ trên xuống: cordon lúc 02:18:11, Pod shop trên cka-w1 về 0 sau 14 giây (drain xong), uncordon 02:18:54, ba Pod trở lại cka-w1 sau 21 giây. Lần làm tay trên máy soạn bài: 1286 request trong ~10 phút (gồm cả lần drain treo, lần upgrade lỗi và lần drain thật), không request nào khác 200. Lúc drain, cka-w2 còn 370 MB available (\`free -m\`).

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

Verify đọc ba PDB \`gateway-pdb\`, \`catalog-pdb\`, \`order-pdb\`: \`minAvailable: 1\` (không \`maxUnavailable\`), selector \`app=<service>\`, nằm trong manifest của release shop (tạo bằng \`kubectl\` ngoài chart: đỏ), healthy ≥ 2 và ALLOWED DISRUPTIONS ≥ 1 (\`minAvailable: 2\`: đỏ, đo), values \`<service>.pdb.minAvailable\` là 1, và không PDB nào khác chọn Pod của ba service (một PDB \`shop-all\` \`--min-available=2\` thêm vào: đỏ, đo). Release shop \`deployed\`, chart \`shop-0.2.0\`, \`javaOpts\` và \`order.image.tag\` như cuối s37; Deployment gateway, catalog, order ≥ 2 replica (catalog: HPA \`minReplicas\` ≥ 2), pod template trải theo \`kubernetes.io/hostname\` (\`topologySpreadConstraints\` \`maxSkew: 1\` hay \`podAntiAffinity\`) và cách trải đó có trong manifest của release; Pod Ready của mỗi service có trên cả cka-w1 lẫn cka-w2; catalog, order (trong chart) và StatefulSet postgres (cả trong \`~/shop/\`) có priority không thấp hơn PriorityClass của gateway (thiếu: đỏ). \`~/drills/s41/loop.log\`: có một đoạn cka-w1 bị cordon, trong đoạn đó số Pod gateway/catalog/order trên cka-w1 về 0 rồi node được uncordon (cordon/uncordon không drain: đỏ, đo), ≥ 20 request trong đoạn, không khoảng hở nào quá 8 giây (mỗi request chờ tối đa 5 giây), và cả log không có request nào khác 200. Ba node Ready, cka-w1 và cka-w2 schedulable.`,
      verifyOutput: "lab: kiểm s41\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)\n  ✓ PDB gateway-pdb, catalog-pdb, order-pdb trong chart: minAvailable 1, selector app=<service>, ALLOWED DISRUPTIONS ≥ 1; không PDB thừa\n  ✓ Release shop deployed (shop-0.2.0, javaOpts và order 2.0 như cũ); gateway, catalog, order ≥ 2 replica, trải theo hostname trong chart, Pod Ready trên cka-w1 và cka-w2; catalog, order, postgres có priority không thấp hơn gateway\n  ✓ ~/drills/s41/loop.log: drain cka-w1 (cordon → Pod về 0 → uncordon) với request đều, 0 lỗi; ba node Ready, cka-w1 và cka-w2 schedulable\n  → 3/3 đạt",
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
| 3. Drain | \`k drain cka-cp --ignore-daemonsets\` | \`k drain <node> --ignore-daemonsets --delete-emptydir-data\` (gõ trên cka-cp) |
| 4. kubelet | unhold, cài \`kubelet\`, \`kubectl\` 1.37.2-1.1, hold; \`systemctl daemon-reload\`, \`systemctl restart kubelet\` | như vậy |
| 5. | \`k uncordon cka-cp\` | \`k uncordon <node>\` |

Repo pkgs.k8s.io **tách theo minor**: không đổi URL ở bước 0 thì \`apt-cache madison kubeadm\` chỉ thấy 1.36.x. \`hold\` có từ s06 để \`apt upgrade\` không vô tình kéo kubelet lệch control plane; nâng có chủ đích thì unhold, cài, hold lại. Bản lab dùng: **1.37.2**, bản vá mới nhất của 1.37 ngày 2026-11-20 (\`https://dl.k8s.io/release/stable-1.37.txt\`; repo có 1.37.0-1.1, 1.37.1-1.1, 1.37.2-1.1). \`kubeadm upgrade plan\` chỉ chọn được bản mà chính \`kubeadm\` đang cài biết: nâng kubeadm trước, rồi mới plan.

**Version skew policy: vì sao thứ tự là control plane rồi worker, và chỉ một minor.** Chính sách của Kubernetes (từ 1.28): kube-apiserver là mốc; \`kubelet\` và \`kube-proxy\` **không được mới hơn** apiserver và được **cũ hơn tối đa ba minor**; kube-controller-manager, kube-scheduler cũ hơn tối đa **một** minor; \`kubectl\` lệch ±1. Nên lúc cka-cp đã 1.37 mà hai worker còn 1.36 là hợp lệ (đo: \`k get node\` có ba node Ready với hai bản khác nhau suốt mười phút), còn worker 1.37 dưới apiserver 1.36 thì không. \`kubeadm upgrade apply\` từ chối nhảy hai minor (1.36 → 1.38): mỗi lần nâng một minor vì mỗi minor có thể đổi API, cờ, định dạng lưu trong etcd, và bản trung gian là nơi chuyển đổi đó được kiểm thử.

**Vì sao drain từng node mà shop không mất request, và vì sao cka-w2 thì có.** s41 đã cho mỗi service hai Pod trên hai worker với PDB. Drain cka-cp chỉ đuổi các controller ghim control plane (ingress-nginx, NGINX Gateway Fabric và data plane \`shop-gw\`, cert-manager, demo, local-path-provisioner: 8 Pod \`Pending\` trong ~1 phút, đo), nên Ingress (:30080) và Gateway (:30280) tạm mất, còn đường \`gateway-nodeport\` :30180 thì không: vòng request của buổi đi qua 30180. **Nhưng DNS thì có.** \`kubeadm upgrade apply\` trả về khi Deployment CoreDNS và DaemonSet kube-proxy **còn đang rollout**; kubeadm cũng không tạo PDB cho CoreDNS. Lần chạy tự động đầu tiên drain cka-cp 7 giây sau \`upgrade apply\`: Pod CoreDNS cũ trên cka-cp bị đuổi khi Pod mới còn \`Readiness probe failed\`, khoảng 25 giây không có CoreDNS Ready, gateway hết cache DNS của JVM (30 giây) và không phân giải được \`catalog\`: 3 request hết 5 giây rồi 9 request \`503\` \`{"error":"không kết nối được catalog"}\`, 12/1105 lỗi (đo; verify đỏ đúng như vậy). Hai việc trước khi drain cka-cp: \`k -n kube-system rollout status deploy/coredns\` (và \`ds/kube-proxy\`), và PDB \`coredns-pdb\` (\`minAvailable: 1\`, selector \`k8s-app: kube-dns\`) để mọi lần drain sau đuổi CoreDNS từng Pod một. Drain cka-w1: như s41.

cka-w2 khác: \`postgres-0\` là StatefulSet 1 replica, PV \`local-path\` ghim cka-w2 bằng \`nodeAffinity\` (s24). Drain cka-w2 đuổi \`postgres-0\`; Pod mới chỉ chạy được ở cka-w2 mà cka-w2 đang cordon, nên \`Pending\` (\`didn't match PersistentVolume's node affinity\`, \`were unschedulable\`) tới khi uncordon. Suốt lúc đó catalog và order không có database: \`/api/products\` chờ kết nối rồi hết giờ. Đo: 50/192 request lỗi trong **103 giây** (49 hết giờ, 1 mã 500), từ lúc drain tới khi postgres-0 Ready và Hikari nối lại. PDB không cứu được: \`minAvailable: 1\` cho StatefulSet 1 replica chỉ làm drain treo. Gỡ thật sự cần bỏ ràng buộc vào một node: storage mạng (CSI: NFS, Ceph, EBS) để Pod lên node khác cùng dữ liệu, hay PostgreSQL có bản sao (operator như CloudNativePG, Patroni) để failover. Lab ghi nhận cái giá đó bằng \`W2_OUTAGE_SECONDS\`, đúng việc của một kỹ sư vận hành: biết node nào nâng là có gián đoạn, đo nó, báo trước.

**Ubuntu tự restart kubelet, đề thi có thể không.** Trên Ubuntu 24.04, \`needrestart\` chạy sau \`apt-get install\`; với \`DEBIAN_FRONTEND=noninteractive\` nó tự \`systemctl restart kubelet.service\` (đo trên cka-cp: kubelet mới chạy ngay khi cài xong). Gõ tay trong terminal thì nó hiện hộp thoại chọn dịch vụ. Bỏ bước restart là thói quen xấu: trên máy không có needrestart (hay đặt \`NEEDRESTART_MODE=l\`, tình huống hỏng của buổi) kubelet cũ vẫn chạy và \`k get node\` vẫn báo \`v1.36.6\` dù gói đã là 1.37.2 (đo trên cka-w1). \`daemon-reload\` vì gói kubelet có thể đổi unit systemd và drop-in \`10-kubeadm.conf\`.

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
        text: "Vòng request cho phần không được gián đoạn: `~/drills/s42/loop.sh start ~/drills/s42/loop-cp-w1.log`. cka-cp: đổi repo sang `v1.37` (`sudo sed -i 's#/v1.36/#/v1.37/#' …`), `sudo apt-get update`, `apt-cache madison kubeadm`, unhold/cài `kubeadm=1.37.2-1.1`/hold, `kubeadm version -o short`. `sudo kubeadm config images pull --kubernetes-version v1.37.2` (kéo trước image, máy soạn bài mất 6 phút), `sudo kubeadm upgrade plan`: những thành phần nào đổi bản, cái nào phải nâng tay?",
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
      "Gõ `kubeadm upgrade apply` trên worker: sai lệnh. Worker (và control plane thứ hai trở đi) dùng `kubeadm upgrade node`.",
      "`postgres-0` `Pending` suốt lúc cka-w2 cordon: đúng như dự kiến (PV local-path ghim cka-w2, s24). Đừng xoá PVC; uncordon là Pod lên lại với dữ liệu cũ.",
      "Verify báo `W2_OUTAGE_SECONDS=… lệch khoảng lỗi trong log quá 10 giây`: đọc lại khoảng từ request lỗi đầu tới request lỗi cuối trong `loop-w2.log`, không phải từ lúc drain tới lúc uncordon.",
    ],
    solution: `Output là của máy soạn bài (2026-11-20, nâng 1.36.6 → 1.37.2); thời điểm, tên Pod sẽ khác. Lệnh có \`sudo\` chạy trên node được ghi ở đầu khối; \`k\` luôn chạy trên cka-cp.

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
k -n kube-system rollout status deploy/coredns && k -n kube-system rollout status ds/kube-proxy
k -n kube-system create pdb coredns-pdb --selector=k8s-app=kube-dns --min-available=1
k -n kube-system get pdb
# NAME                      MIN AVAILABLE   MAX UNAVAILABLE   ALLOWED DISRUPTIONS   AGE
# calico-kube-controllers   N/A             1                 1                     6d
# coredns-pdb               1               N/A               1                     5s
\`\`\`

Vòng request trong 3 phút này: 0 lỗi (apiserver khởi động lại không ảnh hưởng đường dữ liệu; kube-proxy giữ rule iptables trong lúc Pod của nó được thay).

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

Khoảng 19 phút (gồm 6 phút kéo image), control plane khởi động lại, hai lần drain, 2353 request, không lỗi nào.

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
# đã dừng; 192 request, 50 lỗi
grep -v '^#' ~/drills/s42/loop-w2.log | awk '{print $3}' | sort | uniq -c
#      49 000
#     124 200
#       1 500
grep -v '^#' ~/drills/s42/loop-w2.log | awk '$3!=200 {if(!f) f=$1; l=$1} END {print l-f}'
# 103.292
echo W2_OUTAGE_SECONDS=103 >> ~/drills/s42/answers.env
\`\`\`

\`000\` là curl hết 2 giây: catalog chờ kết nối database (Hikari) chứ không trả lỗi ngay, nên mỗi request lỗi chiếm 2 giây và vòng chỉ ghi ~1 request/2 giây trong cửa sổ đó. Lúc cka-w2 drain, cka-w1 còn 443 MB available (\`free -m\`).

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

Verify đọc ba node: kubelet \`v1.37.x\` cùng một bản, Ready, không cordon; Pod \`kube-apiserver\`, \`kube-controller-manager\`, \`kube-scheduler\` của cka-cp mang image \`v1.37.x\`, \`etcd\`, CoreDNS, kube-proxy đúng image \`kubeadm config images list --kubernetes-version <bản>\` in ra, CoreDNS có PDB, \`kubeadm-config\` ghi \`kubernetesVersion: v1.37.x\`. Cùng dòng: release shop \`deployed\`, gateway/catalog/order ≥ 2 replica Available, \`postgres-0\` Ready, ba Deployment cert-manager Available, Certificate \`shop-local\` Ready, webhook nhận một Certificate tạo thử bằng \`--dry-run=server\`, và từ Mac \`:30180\`, Ingress \`shop.local:30080\`, Gateway \`shop.local:30280\` trả 200 với 3 sản phẩm. Trên từng node (\`files/node-facts.sh\` qua \`multipass exec\`): \`kubeadm\`, \`kubelet\`, \`kubectl\` 1.37.x, cả ba \`hold\` (\`apt-mark unhold kubelet\` trên cka-w2: đỏ, đo), repo \`core:/stable:/v1.37\`, \`kubelet --version\` 1.37, dịch vụ \`active\`. \`loop-cp-w1.log\`: có đoạn cka-cp và đoạn cka-w1 bị cordon, số Pod shop trên node về 0, kubelet của node đổi \`v1.36\` → \`v1.37\` **trong** đoạn đó (bỏ đoạn cordon của cka-w1 khỏi log: đỏ, đo), cka-cp lên trước cka-w1, cka-w2 không lên trong log này, request không hở quá 8 giây, 0 lỗi (log của lần drain cka-cp khi CoreDNS còn rollout: \`12/1105 request lỗi (mã 000, 503)\`, đỏ, đo). \`loop-w2.log\`: đoạn drain cka-w2 với kubelet đổi bản bên trong, request cuối trả 200, và \`W2_OUTAGE_SECONDS\` cách khoảng từ request lỗi đầu tới request lỗi cuối không quá 10 giây (\`60\` khi log đo 103: đỏ, đo). \`SKEW_RULE=3\` (\`2\`: đỏ, đo).`,
      verifyOutput: "lab: kiểm s42\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~22 phút)\n  ✓ Ba node v1.37.x cùng bản, Ready, schedulable; control plane, etcd, CoreDNS (có PDB), kube-proxy theo kubeadm 1.37; shop, cert-manager (Certificate, webhook) chạy; từ Mac :30180, Ingress :30080, Gateway :30280 trả 200\n  ✓ Ba node: kubeadm, kubelet, kubectl 1.37.x và hold; repo pkgs.k8s.io trỏ v1.37; kubelet active bản 1.37\n  ✓ ~/drills/s42/loop-cp-w1.log: cka-cp rồi cka-w1 được drain, lên 1.37 trong lúc drain, uncordon; request đều, 0 lỗi\n  ✓ ~/drills/s42/loop-w2.log: cka-w2 được drain, lên 1.37, uncordon; W2_OUTAGE_SECONDS khớp khoảng lỗi trong log (±10 giây)\n  ✓ answers.env: SKEW_RULE là số minor kubelet được cũ hơn kube-apiserver\n  → 5/5 đạt",
      projectDelta: "Cluster chạy Kubernetes 1.37.2, minor của đề thi, nâng từng node một. shop không gián đoạn khi nâng control plane và cka-w1; nâng cka-w2 làm shop mất ~100 giây vì PostgreSQL nằm trên PV cục bộ của node đó, một giới hạn đã đo và ghi lại. Mốc st8-upgraded.",
    },
    review: [
      { q: "Thứ tự nâng một cluster kubeadm ba node, và lệnh nào khác giữa control plane đầu tiên và worker?", a: "Control plane trước, rồi từng worker. Mỗi node: đổi repo, nâng kubeadm, bước nâng (control plane đầu tiên `kubeadm upgrade apply v1.37.2`, mọi node khác `kubeadm upgrade node`), drain, nâng kubelet + kubectl, `daemon-reload`, restart kubelet, uncordon. `apply` viết lại static pod và addon của cả cluster; `upgrade node` chỉ cập nhật cấu hình kubelet của node đó (0,3 giây, đo)." },
      { q: "Vì sao được phép có worker 1.36 dưới apiserver 1.37, nhưng không được ngược lại? SKEW_RULE là gì?", a: "Version skew policy: kubelet không được mới hơn kube-apiserver và được cũ hơn tối đa 3 minor (SKEW_RULE=3, từ 1.28; trước đó là 2). apiserver mới vẫn phục vụ API cũ cho kubelet cũ; kubelet mới có thể dùng API mà apiserver cũ chưa có. Nên control plane luôn nâng trước." },
      { q: "Sau khi cài gói kubelet 1.37.2, `k get node` vẫn báo v1.36.6. Vì sao, và trên lab vì sao lần đầu bạn không thấy chuyện này?", a: "Cột VERSION là bản do tiến trình kubelet đang chạy báo; gói mới chỉ thay tệp `/usr/bin/kubelet`. Phải `systemctl daemon-reload && systemctl restart kubelet`. Trên Ubuntu 24.04, needrestart chạy sau apt và tự restart kubelet (đo trên cka-cp); với `NEEDRESTART_MODE=l` thì không, và node giữ v1.36.6 (đo trên cka-w1)." },
      { q: "Vì sao nâng cka-cp và cka-w1 không mất request nào mà cka-w2 thì mất ~100 giây? Làm gì để hết?", a: "s41 đã cho gateway/catalog/order hai Pod trên hai worker có PDB, nên drain một node luôn còn Pod Ready ở node kia; drain cka-cp chỉ đuổi controller của Ingress/Gateway/cert-manager, vòng request đi qua NodePort 30180. postgres-0 là một replica trên PV local-path ghim cka-w2: drain là Pod Pending tới khi uncordon, catalog/order mất database (đo 103 giây, 50/192 request lỗi). Hết được bằng storage mạng (CSI) hay PostgreSQL có bản sao để failover; PDB không giúp được một replica." },
      { q: "Cert-manager 1.21 chỉ ghi hỗ trợ tới Kubernetes 1.36. Lab làm gì sau khi nâng lên 1.37?", a: "Kiểm thật: Pod Ready, Certificate shop-local Ready, webhook nhận dry-run, xoá Secret thì được cấp lại (0,39 giây, serial mới). Chạy được nên giữ v1.21.3, ghi rõ \"chạy được, chưa được hỗ trợ\"; khi cert-manager 1.22 ra (hỗ trợ 1.37) thì nâng chart. Trước khi nâng cluster ở công ty, đọc bảng hỗ trợ của mọi operator đang chạy." },
    ],
  },
// ───────────────────────────── s43 (khung) ─────────────────────────────
  {
    id: "s43",
    stage: "st8",
    title: "Backup và restore etcd",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-lifecycle"],
    requires: ["s42"],
    status: "skeleton",
    pieces: ["etcd-restore"],
    goals: [
      "Chụp snapshot etcd với đủ endpoint và ba chứng chỉ, kiểm snapshot bằng status.",
      "Xoá một Deployment của shop, khôi phục etcd từ snapshot vào data-dir mới và trỏ static pod etcd sang đó.",
      "Thấy đối tượng đã xoá quay lại và giải thích vì sao đối tượng tạo sau snapshot thì mất.",
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
    stateIn: "Đầu ra s42 (mốc trước etcd): cluster đã nâng cấp.",
    stateOut: "Có /opt/backup/etcd.db hợp lệ; etcd chạy từ /var/lib/etcd-restore và shop trở về đúng trạng thái lúc chụp.",
  },
  {
    id: "s44",
    stage: "st8",
    title: "Gia hạn chứng chỉ và control plane HA",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-ha", "ar-lifecycle"],
    requires: ["s43"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Gia hạn toàn bộ chứng chỉ kubeadm, khởi động lại control plane và kiểm ngày hết hạn mới.",
      "Vẽ được topology HA stacked etcd và external etcd, nói quorum của 3 và 5 node.",
      "Viết đúng lệnh kubeadm init/join cho control plane thứ hai (--control-plane-endpoint, --upload-certs) dù lab chỉ có một control plane.",
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
    stateIn: "Đầu ra s43.",
    stateOut: "Mọi chứng chỉ kubeadm có ngày hết hạn mới; admin.conf mới đã chép lại vào ~/.kube/config; cluster hoạt động bình thường.",
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
