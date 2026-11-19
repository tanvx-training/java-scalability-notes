// Chặng 7 — Đóng gói và mở rộng: Helm, Kustomize, CRD.
// s37–s38 đã phát hành (đợt 4); s39–s40 là buổi khung: đủ trường cấu trúc (check-data PR7), nội dung đầy đủ ở task sau.

export const sessions = [
// ───────────────────────────── s37 ─────────────────────────────
  {
    id: "s37",
    stage: "st7",
    title: "Helm: cài component và viết chart cho shop",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-helm-kustomize"],
    requires: ["s36"],
    status: "published",
    pieces: ["helm"],
    goals: [
      "Cài một component từ repo Helm công khai đúng phiên bản chart chỉ định, ghi đè values bằng --set và -f.",
      "Đóng gói gateway, gateway-v1, catalog, order thành chart shop với values cho image tag, replicas, resources, rồi nhận lại các object đang chạy vào release mà không gián đoạn.",
      "Xem trước manifest bằng helm template và kubectl diff trước khi cài, rồi helm upgrade đổi một value và đọc helm history.",
    ],
    skills: [
      { skill: "k-helm-repo", level: "Gõ được không tra" },
      { skill: "k-helm-search", level: "Gõ được không tra" },
      { skill: "k-helm-install", level: "Gõ được không tra" },
      { skill: "k-helm-set", level: "Gõ được không tra" },
      { skill: "k-helm-list", level: "Gõ được không tra" },
      { skill: "k-helm-upgrade", level: "Gõ được không tra" },
      { skill: "k-helm-template", level: "Gõ được không tra" },
      { skill: "k-helm-create", level: "Làm được có tra" },
    ],
    uses: ["k-resources-yaml", "k-set-image", "k-get-pod-yaml", "vim-macro"],
    foundation: null,
    mindset: `**Chart là template, release là một lần cài, revision là một lần đổi.** Chart gồm \`Chart.yaml\` (tên, \`version\` của chart, \`appVersion\` của ứng dụng), \`values.yaml\` (giá trị mặc định) và \`templates/\` (manifest viết bằng Go template). \`helm install shop ~/charts/shop -n shop\` render template với values thành YAML thường, gửi lên apiserver, rồi ghi **release** \`shop\` vào chính namespace đó dưới dạng Secret \`sh.helm.release.v1.shop.v<revision>\` (type \`helm.sh/release.v1\`, chứa chart, values và manifest đã render, nén). Mỗi \`upgrade\` hay \`rollback\` thêm một revision; \`helm history\` đọc các Secret đó. Không có controller nào của Helm chạy trong cluster: Helm 4 cũng chỉ là một client như \`kubectl\`.

**values của Helm giống cấu hình của Spring Boot.**

| Spring Boot | Helm |
|---|---|
| \`application.yml\` trong jar: giá trị mặc định | \`values.yaml\` trong chart |
| \`application-prod.yml\` bật bằng \`spring.profiles.active=prod\` | \`-f values-prod.yaml\` (nhiều \`-f\` thì tệp sau đè tệp trước) |
| tham số dòng lệnh \`--server.port=9090\`: ưu tiên cao nhất | \`--set gateway.replicas=3\`: đè mọi \`-f\` |
| \`@ConfigurationProperties(prefix = "gateway")\` gom khoá thành một đối tượng có kiểu | \`.Values.gateway.image.tag\` trong template; \`values.schema.json\` đóng vai \`@Validated\` |
| \`/actuator/configprops\`: giá trị đang có hiệu lực | \`helm get values shop -n shop --all\` (bỏ \`--all\` thì chỉ thấy phần bạn ghi đè) |

Khác biệt quan trọng: Spring đọc lại cấu hình mỗi lần khởi động, còn Helm **nhớ** values bạn đưa lúc cài. \`helm upgrade\` không kèm \`-f\`/\`--set\` nào thì dùng lại values của revision trước (đo: cài bằng \`--set order.image.tag=1.0\`, sửa \`values.yaml\` thành \`2.0\` rồi \`helm upgrade shop ~/charts/shop -n shop\`: order vẫn 1.0). \`--reset-values\` bỏ values cũ, \`--reuse-values\` gộp values cũ với cái mới. Muốn chart là nguồn sự thật thì sửa \`values.yaml\` và đừng cài bằng \`--set\`.

**Nhận lại (adoption) thay vì xoá rồi cài.** shop đang chạy từ manifest rời. Helm từ chối "cướp" object không phải của nó: \`helm install\` khi object đã có báo \`exists and cannot be imported into the current release: invalid ownership metadata\` và không tạo gì. Helm coi một object là của release \`shop\` ở namespace \`shop\` khi object có **nhãn** \`app.kubernetes.io/managed-by=Helm\` và **hai annotation** \`meta.helm.sh/release-name=shop\`, \`meta.helm.sh/release-namespace=shop\`. Gắn đủ ba thứ đó cho 15 object rồi \`helm install\`: Helm thấy object đã là của mình và chỉ cập nhật chỗ khác. Đo trên lab: không ReplicaSet mới, không Pod nào khởi động lại, \`/api/products\` qua 30180 trả 200 suốt lúc cài. (Helm 3.17+ và 4 còn có \`--take-ownership\`, bỏ qua kiểm tra và tự gắn annotation.)

Đường còn lại là **xoá rồi cài**: \`k delete -f ~/shop/…\`, rồi \`helm install\`. Đơn giản, nhưng cái giá là thật: mọi Pod bị xoá cùng lúc (gateway, catalog, order cùng mất, request trả lỗi tới khi Pod mới Ready: JVM khởi động, initContainer của gateway chờ catalog), Service tạo lại có thể nhận ClusterIP khác, HPA mất lịch sử co giãn. Với StatefulSet, xoá kéo theo Pod và (tuỳ chính sách) PVC: đó là lý do PostgreSQL, Secret \`db-cred\`, NetworkPolicy, Ingress, Gateway/HTTPRoute, quota/LimitRange nằm ngoài chart. Nhóm thật nhận lại dần từng phần như vậy, phần hạ tầng sống lâu để riêng.

**Chart phải render ra đúng thứ đang chạy, nhất là selector.** \`spec.selector\` của Deployment **bất biến**: chart đổi nhãn selector (ví dụ thêm \`app.kubernetes.io/name\` như template của \`helm create\`) thì \`helm install\` bị apiserver từ chối \`field is immutable\`; đổi nhãn trong \`template.metadata.labels\` thì mọi Pod rollout. Vì vậy template giữ đúng \`app: <tên>\`. Kiểm trước bằng \`helm template shop ~/charts/shop -n shop | k diff -n shop -f -\`: trên lab khác biệt duy nhất là \`replicas: 2 → 1\` của catalog, vì chart cố ý **không ghi \`replicas\`** khi có HPA (mỗi lần upgrade sẽ kéo số replica về giá trị trong chart, giành với HPA). \`k diff\` dùng client-side apply nên thấy trường biến mất là "xoá về mặc định 1"; Helm 4 dùng server-side apply không đụng trường nó không quản, nên sau \`helm install\` catalog vẫn 2 replica do HPA giữ (đo).

**Helm 4 và server-side apply: chủ sở hữu từng trường.** Helm 4 (bản ghim của lab là v4.3.2) cài release mới bằng **server-side apply** (SSA): apiserver nhớ trường nào thuộc "field manager" nào (\`k get deploy order --show-managed-fields\`). Các object của shop được tạo bằng \`kubectl apply\` thường, nên mọi trường thuộc \`kubectl-client-side-apply\`. Lần \`helm upgrade\` đầu tiên đổi một trường như thế (image của order) bị từ chối: \`conflict with "kubectl-client-side-apply" … .spec.template.spec.containers[name="order"].image\`, release ghi revision \`failed\`, cluster không đổi (đo). \`--force-conflicts\` bảo apiserver chuyển quyền sở hữu trường đó sang Helm; từ đó về sau \`helm upgrade\` thường là đủ. Helm 3 dùng client-side 3-way merge nên không gặp lỗi này. Một hệ quả nữa: sau khi Helm nhận, đừng sửa bằng \`k set image\` hay \`k edit\`: release và cluster lệch nhau, upgrade sau đó hoặc ghi đè thay đổi của bạn hoặc báo conflict. Đổi image là đổi \`values.yaml\` rồi \`helm upgrade\`.

**Helm 3 và Helm 4 trên đề thi.** Lệnh của đề (\`repo add\`, \`search repo\`, \`install … --version --set -f -n --create-namespace\`, \`list\`, \`upgrade\`, \`history\`, \`rollback\`, \`uninstall\`, \`template\`, \`show values\`) giống nhau ở cả hai bản. Khác cần nhớ (trang "Helm 4 Overview" của helm.sh, đo trên v4.3.2): \`--atomic\` đổi tên thành \`--rollback-on-failure\`, \`--force\` thành \`--force-replace\` (tên cũ vẫn chạy kèm cảnh báo); release mới mặc định server-side apply (\`--server-side=false\` để dùng kiểu cũ); \`helm list -a\` không còn (\`unknown shorthand flag: 'a' in -a\`), \`helm list\` liệt kê mọi trạng thái, lọc bằng \`--failed\`, \`--pending\`, \`--deployed\`; \`--wait\` không ghi thì chỉ chờ hook (\`hookOnly\`), ghi \`--wait\` là chờ tài nguyên Ready.

**Component công khai: đọc values trước khi cài.** \`helm show values podinfo/podinfo --version 6.16.0\` là "tài liệu cấu hình" của chart: tên khoá (\`ui.message\`, \`nodeSelector\`, \`tolerations\`, \`resources\`) khác nhau giữa các chart, đừng đoán. Lab cài podinfo (chart của Stefan Prodan, image \`ghcr.io/stefanprodan/podinfo\` có arm64, ~13Mi RAM lúc chạy) lên cka-cp bằng toleration + nodeSelector của control plane để không lấy RAM của worker (cka-w1 còn ~800 MB).`,
    refs: [
      { label: "Bài lộ trình CKA: Helm & Kustomize trong curriculum CKA", href: "#/roadmap/cka/cka-w7-5" },
      { label: "Lộ trình CKA Study Guide: Helm và Kustomize — khác nhau ở đâu và gõ lệnh nào", href: "#/roadmap/ckabook/cb-w2-4" },
      { label: "CKA Study Guide, chương 8 — Helm và Kustomize", href: "#/docs/ckabook-08" },
      { label: "Kubernetes: Up and Running, chương 22 — tổ chức ứng dụng, tham số hoá bằng Helm", href: "#/docs/kuar-22" },
      { label: "Flash sale, giai đoạn 4 — Helm chart cho ba service Spring Boot (probe, resource, PDB)", href: "#/docs/fs-06" },
      { label: "helm.sh: Helm 4 Overview (đổi tên cờ, server-side apply)", href: "https://helm.sh/docs/overview" },
      { label: "helm.sh: helm install (thứ tự ưu tiên của -f và --set)", href: "https://helm.sh/docs/helm/helm_install/" },
      { label: "helm.sh: Chart Template Guide — values, named template, .Files", href: "https://helm.sh/docs/chart_template_guide/" },
      { label: "kubernetes.io: Server-Side Apply (field manager, conflict, --force-conflicts)", href: "https://kubernetes.io/docs/reference/using-api/server-side-apply/" },
    ],
    stateIn: "Đầu ra s36: shop cài bằng manifest rời trong ~/shop/ (kubectl apply); chưa có helm. `./labs/lab begin cka s37` kiểm đầu vào bằng check.sh riêng (mọi dòng của s36 trừ dòng \"~/shop/rbac.yaml đủ 7 object\", vì buổi này tách tệp đó) và tạo ~/drills/s37, ~/charts.",
    stateOut: "helm v4.3.2 trên cka-cp; release demo (podinfo 6.16.0, namespace demo, Pod trên cka-cp, ui.message và resources ghi đè); release shop (chart ~/charts/shop version 0.1.0, namespace shop, revision ≥ 2, order 2.0) nhận lại 15 object đang chạy: Deployment + Service của gateway, gateway-v1, catalog, order, ConfigMap shop-config, gateway-files, order-config, HPA catalog, SA/Role/RoleBinding của order; tệp của chúng ở ~/shop/pre-helm/; ~/shop/rbac.yaml còn RBAC của dev/ops.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s37`. Cài helm ghim bản: `curl -fsSLO https://get.helm.sh/helm-v4.3.2-linux-arm64.tar.gz`, kiểm `echo \"df31cb61680ef728f82c770e5280dd565617bee6b039d37e85c677288be4bbb0  helm-v4.3.2-linux-arm64.tar.gz\" | sha256sum -c`, giải nén, `sudo install -m 0755 linux-arm64/helm /usr/local/bin/helm`, `helm version`. (Trên đề, helm đã có sẵn.)",
      },
      {
        id: "t2",
        text: "Repo công khai: `helm repo add podinfo https://stefanprodan.github.io/podinfo`, `helm repo update`, `helm search repo podinfo` rồi `helm search repo podinfo/podinfo --versions | head -4`. Bản nào mới nhất, bản nào bạn được giao (6.16.0)? `helm show values podinfo/podinfo --version 6.16.0 | grep -nE '^(ui|resources|nodeSelector|tolerations):' -A3`: tên khoá của thông điệp giao diện, tài nguyên, nơi đặt Pod.",
      },
      {
        id: "t3",
        text: "Cài `demo`: tệp `~/drills/s37/demo-values.yaml` có `nodeSelector: {node-role.kubernetes.io/control-plane: \"\"}`, toleration `node-role.kubernetes.io/control-plane` (`Exists`, `NoSchedule`), `resources` requests 10m/32Mi, limits memory 64Mi. `helm install demo podinfo/podinfo --version 6.16.0 -n demo --create-namespace --set ui.message='Xin chào từ Helm' -f ~/drills/s37/demo-values.yaml --wait`. `helm list -A`, `helm get values demo -n demo` (thấy cả phần `--set` lẫn `-f`?), `k -n demo get pod -o wide` (node nào?), `k -n demo get deploy demo-podinfo -o jsonpath='{.spec.template.spec.containers[0].env}'`. Ghi `free -m` của cka-cp trước và sau.",
      },
      {
        id: "t4",
        text: "Chart cho shop. `cd ~/drills/s37 && helm create scaffold && find scaffold -type f`: đọc `values.yaml`, `templates/deployment.yaml`, `_helpers.tpl`, rồi tạo `~/charts/shop` từ khung đó: `Chart.yaml` (`name: shop`, `version: 0.1.0`, `appVersion: \"1.0\"`), xoá `ingress.yaml`, `httproute.yaml`, `serviceaccount.yaml`, `tests/`, `NOTES.txt`. Chép `~/shop/{gateway,gateway-v1,catalog,order,services,catalog-hpa,order-config}.yaml` vào `templates/`, bỏ mọi dòng `namespace: shop` (macro vim `qa/namespace: shop<Enter>ddq` rồi `100@a`, k-get-pod-yaml cho trường lạ), thay image, replicas, resources bằng `{{ .Values.<service>.image.repository }}:{{ .Values.<service>.image.tag }}`, `{{ .Values.<service>.replicas }}`, `{{- toYaml .Values.<service>.resources | nindent 10 }}` (k-resources-yaml). Thêm ConfigMap `shop-config` (từ values), `gateway-files` (`{{ .Files.Get \"files/application.yaml\" }}`, chép từ `~/shop/config/`), `order-config`, và SA/Role/RoleBinding của order (cắt từ `~/shop/rbac.yaml`). catalog: không ghi `replicas` khi có HPA. `values.yaml`: `gateway`, `gatewayV1`, `catalog`, `order` mỗi khoá có `image.tag`, `replicas`, `resources`; `order.image.tag: \"1.0\"` như đang chạy. `helm lint ~/charts/shop`.",
      },
      {
        id: "t5",
        text: "Xem trước: `helm template shop ~/charts/shop -n shop | grep -E '^kind:|^  name:' | paste - -` (đủ 15 object?), rồi `helm template shop ~/charts/shop -n shop | k diff -n shop -f -`. Chỉ được còn khác `replicas` của catalog; mọi khác biệt khác (selector, nhãn Pod, env, probe) sửa chart cho tới khi hết. Vì sao `replicas` khác mà vẫn để vậy?",
      },
      {
        id: "t6",
        text: "Tình huống hỏng: `helm install shop ~/charts/shop -n shop`. Đọc lỗi: object nào, thiếu nhãn/annotation gì? `helm list -n shop` có release nào không? Nhận lại: `o=\"deploy/gateway deploy/gateway-v1 deploy/catalog deploy/order svc/gateway svc/gateway-v1 svc/catalog svc/order cm/shop-config cm/gateway-files cm/order-config hpa/catalog sa/order role/order-config-reader rolebinding/order-config-reader\"`, `k label $o app.kubernetes.io/managed-by=Helm`, `k annotate $o meta.helm.sh/release-name=shop meta.helm.sh/release-namespace=shop`, rồi `helm install shop ~/charts/shop -n shop --wait`. `k get rs -l app=order` và `k get pod`: có ReplicaSet mới, Pod nào khởi động lại không? `k -n shop get secret -l owner=helm`.",
      },
      {
        id: "t7",
        text: "Upgrade đổi một value: sửa `order.image.tag` trong `~/charts/shop/values.yaml` thành `\"2.0\"` (đừng `k set image`: cluster sẽ lệch release), `helm upgrade shop ~/charts/shop -n shop --wait`. Đọc lỗi conflict: trường nào, của field manager nào? `k get deploy order --show-managed-fields -o jsonpath='{.metadata.managedFields[*].manager}'`. Chạy lại với `--force-conflicts`, `k rollout status deploy/order`, `helm history shop -n shop` (revision nào `failed`, nào `deployed`?), `helm get values shop -n shop --all | sed -n '/^order:/,$p'`.",
      },
      {
        id: "t8",
        text: "Dọn `~/shop/`: `mkdir ~/shop/pre-helm`, chuyển `gateway.yaml`, `gateway-v1.yaml`, `catalog.yaml`, `order.yaml`, `services.yaml`, `catalog-hpa.yaml`, `order-config.yaml` và `config/` vào đó; tách `~/shop/rbac.yaml`: SA `order`, Role và RoleBinding `order-config-reader` sang `~/shop/pre-helm/rbac-chart.yaml`, bốn object RBAC của dev/ops ở lại. `k apply -f ~/shop/ --dry-run=server` vẫn chạy (không còn tệp nào giành object với Helm). Trên Mac: `./labs/lab verify cka s37` phải 4/4.",
      },
    ],
    hints: [
      "`Error: INSTALLATION FAILED: unable to continue with install: ServiceAccount \"order\" in namespace \"shop\" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key \"app.kubernetes.io/managed-by\": must be set to \"Helm\"; annotation validation error: missing key \"meta.helm.sh/release-name\": must be set to \"shop\"; annotation validation error: missing key \"meta.helm.sh/release-namespace\": must be set to \"shop\"` (đo): Helm chỉ báo object đầu tiên nó gặp; thiếu ở object khác thì lần sau báo object khác. Gắn cho cả 15 một lượt. Lỗi này không tạo release nào (`helm list -n shop` rỗng).",
      "`Error: UPGRADE FAILED: conflict occurred while applying object shop/order apps/v1, Kind=Deployment: Apply failed with 1 conflict: conflict with \"kubectl-client-side-apply\" using apps/v1: .spec.template.spec.containers[name=\"order\"].image` (đo, Helm 4): trường do `kubectl apply` tạo, Helm 4 apply bằng SSA. `helm upgrade … --force-conflicts`. Revision lỗi vẫn nằm trong `helm history` với trạng thái `failed`; revision mới sẽ `deployed`.",
      "Upgrade xong mà order vẫn 1.0: bạn đã cài bằng `--set order.image.tag=…` nên Helm dùng lại values đó (đo). Xem `helm get values shop -n shop` (USER-SUPPLIED VALUES); dùng `--reset-values` hay bỏ `--set` khỏi lần cài.",
      "Chart đổi selector (thường do giữ `{{- include \"shop.selectorLabels\" . }}` của `helm create`): Helm 4 báo trước `conflict with \"kubectl-client-side-apply\" using apps/v1: .spec.selector` (đo); ép bằng `--force-conflicts` thì apiserver từ chối `spec.selector: Invalid value: {\"matchLabels\":{\"app\":\"order\",\"app.kubernetes.io/name\":\"order\"}}: field is immutable` (đo bằng `kubectl apply --server-side --dry-run=server`). Selector phải đúng `app: <tên>`; release ghi một revision `failed`, upgrade lại bằng chart đúng là xong.",
      "`helm list -a` báo `unknown shorthand flag: 'a' in -a`: Helm 4 bỏ cờ này; `helm list` đã liệt kê mọi trạng thái, lọc bằng `--failed`/`--pending`.",
      "`k diff` báo thêm khác ở `env`/`probe`/`strategy`: template thiếu hay thừa một trường so với tệp gốc. So hai bản bằng `diff <(k get deploy order -o yaml) <(helm template shop ~/charts/shop -n shop -s templates/order.yaml)` để tìm đúng chỗ.",
      "Pod demo `Pending`, Event `0/3 nodes are available: 1 node(s) had untolerated taint(s), 2 node(s) didn't match Pod's node affinity/selector` (đo, chỉ `--set nodeSelector…` mà không toleration): thêm `tolerations` (khoá ở gốc values của podinfo) cho taint `node-role.kubernetes.io/control-plane`.",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6, Helm v4.3.2); thời điểm, tên Pod sẽ khác. Context đã ở namespace shop.

**1. helm và component công khai**

\`\`\`bash
helm version
# version.BuildInfo{Version:"v4.3.2", GitCommit:"8346aaa55e7161f7c547212d0a87f01367976727", GitTreeState:"clean", GoVersion:"go1.27.4", KubeClientVersion:"v1.37"}
helm repo add podinfo https://stefanprodan.github.io/podinfo
helm search repo podinfo/podinfo --versions | head -4
# NAME           	CHART VERSION	APP VERSION	DESCRIPTION
# podinfo/podinfo	6.17.0       	6.17.0     	Podinfo Helm chart for Kubernetes
# podinfo/podinfo	6.16.0       	6.16.0     	Podinfo Helm chart for Kubernetes
# podinfo/podinfo	6.15.0       	6.15.0     	Podinfo Helm chart for Kubernetes
helm install demo podinfo/podinfo --version 6.16.0 -n demo --create-namespace \\
  --set ui.message='Xin chào từ Helm' -f ~/drills/s37/demo-values.yaml --wait
# NAME: demo … NAMESPACE: demo  STATUS: deployed  REVISION: 1
helm list -A
# NAME	NAMESPACE	REVISION	UPDATED   	STATUS  	CHART         	APP VERSION
# demo	demo     	1       	2026-11-19	deployed	podinfo-6.16.0	6.16.0
k -n demo get pod -o wide
# demo-podinfo-7f7d667448-nt5vx   1/1   Running   0   17s   10.244.160.55   cka-cp
k -n demo get deploy demo-podinfo -o jsonpath='{.spec.template.spec.containers[0].env}'
# [{"name":"PODINFO_UI_MESSAGE","value":"Xin chào từ Helm"},{"name":"PODINFO_UI_COLOR","value":"#34577c"}]
\`\`\`

\`~/drills/s37/demo-values.yaml\`:

\`\`\`yaml
nodeSelector:
  node-role.kubernetes.io/control-plane: ""
tolerations:
- key: node-role.kubernetes.io/control-plane
  operator: Exists
  effect: NoSchedule
resources:
  requests: {cpu: 10m, memory: 32Mi}
  limits: {memory: 64Mi}
\`\`\`

Pod demo dùng 13–14Mi (\`k top pod -n demo\`); \`free -m\` available của cka-cp 1703 → 1560 MB sau cả buổi (gồm helm, release shop).

**2. Chart \`~/charts/shop\`**

\`\`\`
~/charts/shop/Chart.yaml               name: shop, version: 0.1.0, appVersion: "1.0"
~/charts/shop/values.yaml
~/charts/shop/files/application.yaml   (trước là ~/shop/config/application.yaml)
~/charts/shop/templates/_helpers.tpl   cổng/probe/preStop chung, Service, biến DB
~/charts/shop/templates/gateway.yaml   gateway + gateway-v1 (range qua hai khoá values)
~/charts/shop/templates/catalog.yaml   Deployment (không replicas khi có HPA), Service, HPA
~/charts/shop/templates/order.yaml     Deployment (serviceAccountName order), Service
~/charts/shop/templates/configmaps.yaml   shop-config, gateway-files, order-config
~/charts/shop/templates/order-rbac.yaml   SA order, Role/RoleBinding order-config-reader
\`\`\`

\`values.yaml\` (phần của order và catalog):

\`\`\`yaml
catalog:
  image:
    repository: shop/catalog
    tag: "1.0"
  replicas: 2              # chỉ dùng khi autoscaling.enabled=false
  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 3
    targetCPUUtilizationPercentage: 60
  resources:
    requests: {cpu: 200m, memory: 256Mi}
    limits: {memory: 384Mi}
order:
  image:
    repository: shop/order
    tag: "1.0"             # t7 đổi thành "2.0"
  replicas: 1
  serviceAccount: order
  config:
    CATALOG_URL: http://catalog:8080
  resources:
    requests: {cpu: 100m, memory: 256Mi}
    limits: {memory: 384Mi}
\`\`\`

\`templates/catalog.yaml\` (đầu tệp):

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog
  labels:
    app: catalog
spec:
  {{- if not .Values.catalog.autoscaling.enabled }}
  replicas: {{ .Values.catalog.replicas }}
  {{- end }}
  selector:
    matchLabels:
      app: catalog          # bất biến: đúng như Deployment đang chạy
  template:
    metadata:
      labels:
        app: catalog
    spec:
      containers:
      - name: catalog
        image: "{{ .Values.catalog.image.repository }}:{{ .Values.catalog.image.tag }}"
        env:
        - name: JAVA_OPTS
          value: {{ .Values.javaOpts }}
        {{- include "shop.dbEnv" . | nindent 8 }}
        {{- include "shop.springContainer" . | nindent 8 }}
        resources:
          {{- toYaml .Values.catalog.resources | nindent 10 }}
\`\`\`

\`\`\`bash
helm lint ~/charts/shop
# 1 chart(s) linted, 0 chart(s) failed
helm template shop ~/charts/shop -n shop | grep -c '^kind:'
# 15
helm template shop ~/charts/shop -n shop | k diff -n shop -f -
# … apps.v1.Deployment.shop.catalog
# -  replicas: 2
# +  replicas: 1
\`\`\`

\`k diff\` mô phỏng \`kubectl apply\` (client-side): \`replicas\` có trong last-applied mà chart không ghi thì bị xoá về mặc định 1. Helm 4 dùng server-side apply và không đụng trường nó không quản: sau khi cài, catalog vẫn 2 replica (HPA giữ).

**3. Tình huống hỏng và nhận lại**

\`\`\`bash
helm install shop ~/charts/shop -n shop
# Error: INSTALLATION FAILED: unable to continue with install: ServiceAccount "order" in namespace "shop" exists and cannot be imported into the current release: invalid ownership metadata; label validation error: missing key "app.kubernetes.io/managed-by": must be set to "Helm"; annotation validation error: missing key "meta.helm.sh/release-name": must be set to "shop"; annotation validation error: missing key "meta.helm.sh/release-namespace": must be set to "shop"
o="deploy/gateway deploy/gateway-v1 deploy/catalog deploy/order svc/gateway svc/gateway-v1 svc/catalog svc/order cm/shop-config cm/gateway-files cm/order-config hpa/catalog sa/order role/order-config-reader rolebinding/order-config-reader"
k label $o app.kubernetes.io/managed-by=Helm
k annotate $o meta.helm.sh/release-name=shop meta.helm.sh/release-namespace=shop
helm install shop ~/charts/shop -n shop --wait
# NAME: shop … STATUS: deployed  REVISION: 1  DESCRIPTION: Install complete
k get rs -l app=order -o name | wc -l
# 10                 (trước khi cài cũng 10: không ReplicaSet mới, Pod giữ nguyên tuổi)
\`\`\`

Lúc cài \`generation\` của bốn Deployment tăng 1 (Helm ghi lại spec bằng SSA) nhưng pod template không đổi, nên không có rollout.

**4. Upgrade, conflict của Helm 4, history**

\`\`\`bash
vim ~/charts/shop/values.yaml          # order.image.tag: "2.0"
helm upgrade shop ~/charts/shop -n shop --wait
# Error: UPGRADE FAILED: conflict occurred while applying object shop/order apps/v1, Kind=Deployment: Apply failed with 1 conflict: conflict with "kubectl-client-side-apply" using apps/v1: .spec.template.spec.containers[name="order"].image
helm upgrade shop ~/charts/shop -n shop --force-conflicts --wait
# Release "shop" has been upgraded. Happy Helming!
helm history shop -n shop
# REVISION	UPDATED                 	STATUS    	CHART     	APP VERSION	DESCRIPTION
# 1       	Thu Nov 19 13:16:23 2026	superseded	shop-0.1.0	1.0        	Install complete
# 2       	Thu Nov 19 13:16:44 2026	superseded	shop-0.1.0	1.0        	Upgrade complete
# 3       	Thu Nov 19 13:16:45 2026	failed    	shop-0.1.0	1.0        	Upgrade "shop" failed: conflict occurred while applying object shop/order …
# 4       	Thu Nov 19 13:17:00 2026	deployed  	shop-0.1.0	1.0        	Upgrade complete
k get deploy order -o wide
# order   1/1   1   1   4d11h   order   shop/order:2.0   app=order
\`\`\`

Output trên là của lần soạn bài đầu tiên, khi release được cài bằng \`--set order.image.tag=1.0\`: revision 2 là \`helm upgrade\` không kèm values, Helm dùng lại \`--set\` cũ nên order vẫn 1.0 (hint thứ ba); revision 3 là lần upgrade có \`--reset-values\` gặp conflict. Cài thẳng từ \`values.yaml\` như t6 thì bạn chỉ thấy \`1 superseded\`, \`2 failed\`, \`3 deployed\`. Mỗi revision là một Secret:

\`\`\`bash
k get secret -l owner=helm
# NAME                         TYPE                 DATA   AGE
# sh.helm.release.v1.shop.v1   helm.sh/release.v1   1      10m
# sh.helm.release.v1.shop.v2   helm.sh/release.v1   1      10m
# sh.helm.release.v1.shop.v3   helm.sh/release.v1   1      9m52s
\`\`\`

Rollout của order mất 12 giây (\`--wait\` chờ Pod mới Ready). Sau lần \`--force-conflicts\` đó, trường image thuộc field manager \`helm\`; upgrade kế tiếp không cần cờ này.

**5. ~/shop/ sau buổi**

\`\`\`bash
ls ~/shop ~/shop/pre-helm
# /home/ubuntu/shop: gateway-nodeport.yaml httproute.yaml ingress.yaml limits.yaml log-agent.yaml netpol.yaml order-report.yaml
#   postgres-rw.yaml postgres.yaml pre-helm priorityclass.yaml quota.yaml rbac.yaml reports.yaml seed.yaml shop-data.yaml shop-gw.yaml
# /home/ubuntu/shop/pre-helm: catalog-hpa.yaml catalog.yaml config gateway-v1.yaml gateway.yaml order-config.yaml order.yaml rbac-chart.yaml services.yaml
k apply -f ~/shop/ --dry-run=server >/dev/null && echo được
# được
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s37/apply.sh\` (chart chuẩn ở \`files/chart/\`; \`files/solve.sh\` cài helm, demo, nhận lại, upgrade, dọn \`~/shop/\`; chạy lại được).`,
    exam: {
      patterns: [
        "\"Cài chart X bản Y từ repo Z vào namespace N, đặt value V\" — `helm repo add`, `helm search repo X --versions`, `helm install <release> <repo>/X --version Y -n N --create-namespace --set V` (hay `-f`), kiểm bằng `helm list -n N` và `helm get values`.",
        "\"Nâng release R lên bản chart mới / đổi value\" — `helm upgrade R <chart> --version … --reuse-values --set …`; xem `helm history R`.",
        "\"Liệt kê release đang lỗi / tìm release ở mọi namespace\" — `helm list -A --failed` (Helm 3 còn `-a`).",
        "\"In manifest sẽ được tạo mà không cài\" — `helm template <release> <chart> --version … -f …`, hay `helm install … --dry-run`.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 3 phút: cài podinfo bản 6.15.0 tên `drill` vào namespace `drill`, 2 replica, thông điệp `exam`; chứng minh bằng một lệnh helm và một lệnh kubectl; rồi gỡ sạch cả namespace.",
          timeLimitMin: 3,
          solution: "```bash\nhelm install drill podinfo/podinfo --version 6.15.0 -n drill --create-namespace --set replicaCount=2 --set ui.message=exam\nhelm get values drill -n drill          # replicaCount: 2, ui.message: exam\nk -n drill get deploy                    # drill-podinfo 2/2\nhelm uninstall drill -n drill && k delete ns drill\n```\nReplica của podinfo là `replicaCount` (đọc bằng `helm show values`), không phải `replicas` như chart shop.",
        },
        {
          text: "Trong 2 phút, không cài: chart podinfo 6.16.0 với `--set service.type=NodePort` tạo Service loại gì, cổng nào? Chỉ dùng helm và grep.",
          timeLimitMin: 2,
          solution: "```bash\nhelm template x podinfo/podinfo --version 6.16.0 --set service.type=NodePort -s templates/service.yaml | grep -E 'type:|port:'\n```\n`helm template … -s <tệp>` in một template; không cần cluster.",
        },
      ],
    },
    tips: [
      "Trước mọi `helm install` trên đề: `helm show values <chart> --version <v> | grep -n <khoá>`: tên khoá mỗi chart một kiểu (`replicaCount`, `replicas`, `controller.replicaCount`).",
      "`-n` của helm là namespace của release; quên `-n` thì release vào `default` và object cũng vậy. Thêm `--create-namespace` khi namespace chưa có.",
      "Đổi cấu hình release chỉ bằng helm: `k edit`/`k set image` làm cluster lệch release, Helm 4 sẽ báo conflict hoặc ghi đè ở lần upgrade sau.",
      "`helm get values R -n N` (phần bạn ghi đè) và `--all` (đã gộp mặc định) trả lời ngay câu \"release đang chạy với cấu hình gì\".",
    ],
    outcome: {
      md: `shop chạy từ release Helm \`shop\` mà không một Pod nào phải khởi động lại, và một component công khai chạy trên control plane đúng phiên bản. Trên Mac:

\`\`\`bash
./labs/lab verify cka s37
\`\`\`

Verify đọc bằng \`helm … -o json\` và kubectl: helm đúng v4.3.2; release \`demo\` ở namespace \`demo\` là \`podinfo-6.16.0\`, \`deployed\`, Pod mang \`PODINFO_UI_MESSAGE=Xin chào từ Helm\` (của \`--set\`), limit 64Mi và chạy trên cka-cp (của \`-f\`). Release \`shop\` ở namespace \`shop\` (release khác tên hay ở namespace khác đều đỏ), chart \`shop-0.1.0\`, \`deployed\`, revision ≥ 2 với \`order.image.tag\` 2.0; image, resources, replicas của bốn Deployment bằng \`helm get values --all\`; \`~/charts/shop\` có \`Chart.yaml\` đúng tên/bản và \`values.yaml\` đủ \`image.tag\`, \`replicas\`, \`resources\` cho từng service. Manifest của release đúng 15 object (thiếu hay thừa, ví dụ đưa \`postgres\` vào chart: đỏ), mỗi object mang nhãn và annotation của release \`shop\`, không object nào khác trong shop mang annotation release, Deployment và Service có \`creationTimestamp\` trước revision 1 (xoá rồi cài: đỏ). Selector của bốn Deployment vẫn \`app: <tên>\`, cả bốn Available, order chạy bằng SA \`order\`, và \`curl\` từ máy Mac tới \`<IP cka-w1>:30180/api/products\` trả 200 với 3 sản phẩm. \`~/shop/*.yaml\` không còn object nào của chart, \`~/shop/pre-helm/\` giữ bốn Deployment cũ, \`~/shop/rbac.yaml\` giữ bốn object RBAC của dev/ops.`,
      verifyOutput: "lab: kiểm s37\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~15 phút)\n  ✓ helm v4.3.2 trên cka-cp; release demo (namespace demo) deployed, chart podinfo-6.16.0, ui.message và limits/nodeSelector ghi đè có hiệu lực, Pod trên cka-cp\n  ✓ Release shop ở namespace shop: deployed, chart shop-0.1.0, đã upgrade (order.image.tag 2.0); Deployment khớp values; ~/charts/shop đủ khoá\n  ✓ Đúng 15 object trong release, mang nhãn/annotation của release shop, nhận lại chứ không tạo lại, ngoài chart không object nào mang annotation release; selector không đổi, bốn Deployment Available, order chạy bằng SA order; từ Mac curl <IP cka-w1>:30180/api/products trả 200 với 3 sản phẩm\n  ✓ ~/shop/ không còn tệp của object đã vào chart (bản cũ ở ~/shop/pre-helm/); ~/shop/rbac.yaml giữ RBAC của dev/ops\n  → 4/4 đạt",
      projectDelta: "shop có chart Helm riêng (~/charts/shop, 0.1.0) quản lý bốn workload, ConfigMap, HPA và danh tính của order; đổi image hay replicas từ nay là sửa values.yaml rồi helm upgrade, có history để quay lại (s40). PostgreSQL, Secret, NetworkPolicy và cửa vào vẫn là manifest trong ~/shop/.",
    },
    review: [
      { q: "Vì sao chart shop nhận lại object đang chạy thay vì `k delete` rồi `helm install`? Cái giá của cách thứ hai trên lab là gì?", a: "Nhận lại chỉ gắn nhãn `app.kubernetes.io/managed-by=Helm` và annotation `meta.helm.sh/release-name`/`release-namespace` rồi `helm install`: pod template không đổi nên không rollout (đo: không ReplicaSet mới, 30180 trả 200 suốt). Xoá rồi cài làm mọi Pod mất cùng lúc (shop lỗi tới khi JVM và initContainer xong), Service có thể đổi ClusterIP, HPA mất trạng thái; với StatefulSet còn đụng PVC, nên PostgreSQL để ngoài chart." },
      { q: "`values.yaml`, `-f values-prod.yaml`, `--set` tương ứng gì trong Spring Boot, và cái nào thắng?", a: "`application.yml` mặc định, profile `application-prod.yml`, tham số dòng lệnh. Thứ tự ưu tiên: values của chart < các `-f` (tệp sau đè tệp trước) < `--set`. `helm get values --all` giống `/actuator/configprops`. Khác Spring: Helm nhớ values đã đưa lúc cài, upgrade không kèm values thì dùng lại chúng." },
      { q: "`helm upgrade` đầu tiên sau khi nhận lại báo `conflict with \"kubectl-client-side-apply\" … image`. Vì sao, và vì sao lần sau không gặp nữa?", a: "Helm 4 apply bằng server-side apply; trường image do `kubectl apply` tạo nên thuộc field manager `kubectl-client-side-apply`, đổi nó là conflict. `--force-conflicts` chuyển quyền sở hữu trường sang `helm`; từ đó upgrade thường chạy được. Helm 3 (client-side 3-way merge) không gặp lỗi này." },
      { q: "Chart catalog không ghi `replicas`. `k diff` báo `replicas: 2 → 1`, vậy sau `helm install` catalog còn mấy replica và vì sao?", a: "2: HPA giữ số replica, và Helm 4 (SSA) không đụng trường nó không quản. `k diff` mô phỏng client-side apply, nơi trường có trong last-applied mà mất khỏi manifest bị xoá về mặc định 1. Ghi `replicas` trong chart thì mỗi upgrade kéo số replica về giá trị chart, giành với HPA." },
      { q: "Trên đề có Helm 3. Lệnh nào của buổi này viết khác?", a: "Hầu như không: `repo add`, `search repo --versions`, `install --version --set -f -n --create-namespace`, `upgrade`, `history`, `template`, `get values` giống nhau. Khác: Helm 3 có `helm list -a` (Helm 4 bỏ, dùng `--failed`/`--pending`), `--atomic`/`--force` (Helm 4 đổi thành `--rollback-on-failure`/`--force-replace`), và Helm 3 không báo conflict SSA khi upgrade object đã nhận lại." },
    ],
  },
// ───────────────────────────── s38 ─────────────────────────────
  {
    id: "s38",
    stage: "st7",
    title: "Kustomize: base và overlay",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-helm-kustomize"],
    requires: ["s37"],
    status: "published",
    pieces: [],
    goals: [
      "Dựng base chung và hai overlay dev/prod khác nhau ở namespace, replicas, image tag.",
      "Sinh ConfigMap bằng configMapGenerator và giải thích vì sao hậu tố hash làm Pod tự rollout.",
      "Xem kết quả bằng kubectl kustomize trước khi apply -k.",
    ],
    skills: [
      { skill: "k-kustomization-yaml", level: "Viết được không tra" },
      { skill: "k-kustomize-build", level: "Gõ được không tra" },
      { skill: "k-apply-k", level: "Gõ được không tra" },
      { skill: "k-kustomize-patches", level: "Viết được có tra" },
      { skill: "k-kustomize-images", level: "Viết được không tra" },
      { skill: "k-kustomize-generators", level: "Viết được có tra" },
    ],
    uses: ["k-cm-file", "k-create-ns", "k-helm-template", "vim-macro"],
    foundation: null,
    mindset: `**Kustomize không có template.** Helm (s37) sinh YAML từ khuôn \`{{ .Values… }}\`. Kustomize đi đường ngược: **base** là YAML thật, chạy được, không biến nào; **overlay** khai những thay đổi trên base (namespace, số replica, tag image, patch, ConfigMap sinh ra) và Kustomize áp chúng lên base để in ra YAML cuối. Nó nằm sẵn trong kubectl (kubectl 1.36.6 của lab nhúng Kustomize v5.8.1, \`k version --client\`): \`k kustomize <thư mục>\` chỉ in, \`k apply -k <thư mục>\` in rồi apply. Không có release, không có history, không có gì lưu trong cluster ngoài chính các object.

\`\`\`
~/kustomize/shop/
├── base/                 deployment.yaml, service.yaml, kustomization.yaml (configMapGenerator)
└── overlays/
    ├── dev/              namespace shop-dev, 1 replica, tag 1.0, patch memory, literal riêng   → apply
    └── prod/             namespace shop-prod, 2 replica, tag 2.0                             → chỉ build
\`\`\`

**Overlay giống Spring profile, và khác ở chỗ quan trọng.**

| Spring Boot | Kustomize |
|---|---|
| \`application.yml\`: cấu hình chung | \`base/\` |
| \`application-dev.yml\` đè vài khoá khi \`spring.profiles.active=dev\` | \`overlays/dev/kustomization.yaml\` đè vài trường của base |
| profile chọn **lúc chạy**, cùng một jar cho mọi môi trường | overlay chọn **lúc build**: mỗi môi trường ra một bộ YAML riêng, cùng image |
| \`@Profile("dev")\` bật/tắt cả bean | overlay thêm/bớt cả resource (\`resources:\`) hay patch \`$patch: delete\` |
| giá trị lạ ở profile chỉ lộ ra lúc ứng dụng khởi động | \`k kustomize overlays/prod\` cho thấy YAML cuối trước khi đụng cluster |

Hai thứ có thể đi cùng nhau: overlay dev của lab đặt \`LOGGING_LEVEL_SHOP=DEBUG\` vào ConfigMap; Spring Boot đọc biến môi trường đó như \`logging.level.shop=DEBUG\` (relaxed binding). Muốn bật profile thật thì overlay ghi \`SPRING_PROFILES_ACTIVE=dev\`.

**Bốn transformer của buổi.** \`namespace:\` gán namespace cho **mọi** object (và sửa \`subjects[].namespace\` của RoleBinding) nhưng **không tạo** namespace: \`k create ns shop-dev\` trước, hay thêm một \`Namespace\` vào \`resources\`. \`replicas:\` đổi \`spec.replicas\` theo tên Deployment. \`images:\` đổi image theo **tên image** (\`name: shop/catalog\` → \`newTag: "2.0"\`), không theo tên container. \`patches:\` sửa phần còn lại: patch strategic merge (một mảnh YAML có \`kind\` + \`metadata.name\` để nhắm object; danh sách container gộp theo \`name\`) hay JSON 6902 (\`op: replace, path: /spec/template/spec/containers/0/resources/limits/memory\`). Patch nhắm sai tên thì **build lỗi**, không im lặng bỏ qua: \`no matches for Id Deployment.v1.apps/catalog-api.[noNs]; failed to find unique target for patch\` (đo).

**Vì sao hậu tố hash làm Pod tự rollout.** \`configMapGenerator\` sinh ConfigMap tên \`catalog-config-<hash>\`, hash tính từ nội dung (đo: base một mình ra \`catalog-config-7fhk8bc7tc\`, ở cả shop-dev lẫn shop-prod, vì namespace không nằm trong hash; thêm literal \`LOGGING_LEVEL_SHOP=DEBUG\` thì thành \`catalog-config-t92k75m627\`), rồi **sửa mọi chỗ tham chiếu** tới \`catalog-config\` trong cùng lần build (\`envFrom\`, \`volumes\`, \`env.valueFrom\`). Đổi một literal → tên mới → \`spec.template\` của Deployment đổi → ReplicaSet mới → Pod mới đọc ConfigMap mới. Nhớ lại s12: \`envFrom\` chỉ được đọc lúc container khởi động; sửa ConfigMap \`shop-config\` tại chỗ thì Pod đang chạy giữ giá trị cũ và bạn phải \`k rollout restart\`. Hash biến "đổi cấu hình" thành "đổi phiên bản": có rollout, có \`rollout undo\` về đúng ConfigMap cũ (vì nó vẫn còn). Cái giá: **ConfigMap cũ không bị xoá** (\`apply -k\` không prune; đo: sau hai lần apply shop-dev có hai \`catalog-config-*\`), phải dọn tay hay dùng \`--prune\`. Helm làm điều tương tự bằng annotation \`checksum/config: {{ include (print $.Template.BasePath "/configmaps.yaml") . | sha256sum }}\` trong pod template. Tắt hậu tố bằng \`generatorOptions: {disableNameSuffixHash: true}\` khi một thứ ngoài Kustomize phải gọi ConfigMap bằng tên cố định.

**Helm hay Kustomize.** Helm khi cần đóng gói để người khác cài với vài tham số (chart công khai như podinfo, ingress-nginx), cần release/history/rollback. Kustomize khi bạn sở hữu YAML và chỉ cần vài khác biệt giữa môi trường, muốn diff YAML thật trong Git. Hai thứ hay đi cùng: \`helm template … > base/all.yaml\` (k-helm-template) rồi Kustomize vá phần chart không cho chỉnh. Đề CKA hỏi cả hai ở mức lệnh: \`k kustomize\`, \`k apply -k\`, \`k delete -k\`, viết \`kustomization.yaml\` có \`namespace\`, \`images\`, \`replicas\`, \`patches\`, \`configMapGenerator\`.

**Vừa RAM.** Base chỉ có catalog ở chế độ H2 (không \`DB_URL\`: không cần PostgreSQL, và Pod ở shop-dev không bị NetworkPolicy default-deny của shop chặn vì NetworkPolicy theo namespace). Limit nhỏ nhất đo được: \`-XX:MaxRAMPercentage=50\`, gọi 50 lần \`/products\` rồi chờ 20 giây; 128Mi, 160Mi, 176Mi luôn \`OOMKilled\`; 192Mi qua một lần, lần sau \`OOMKilled\` (\`memory.peak\` 188–192Mi); 208Mi qua ba lần (\`memory.peak\` 171–195Mi), 224Mi, 256Mi qua. Overlay dev đặt requests = limits = **208Mi**; Pod dùng 171Mi lúc rảnh (\`k top\`).`,
    refs: [
      { label: "Bài lộ trình CKA: Helm & Kustomize trong curriculum CKA", href: "#/roadmap/cka/cka-w7-5" },
      { label: "Lộ trình CKA Study Guide: Helm và Kustomize — khác nhau ở đâu và gõ lệnh nào", href: "#/roadmap/ckabook/cb-w2-4" },
      { label: "CKA Study Guide, chương 8 — Helm và Kustomize", href: "#/docs/ckabook-08" },
      { label: "Kubernetes: Up and Running, chương 22 — cấu trúc ứng dụng cho dev, kiểm thử, triển khai", href: "#/docs/kuar-22" },
      { label: "kubernetes.io: Declarative Management of Kubernetes Objects Using Kustomize", href: "https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/" },
      { label: "kubectl.docs.kubernetes.io: configMapGenerator, images, replicas, patches", href: "https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/" },
      { label: "Spring Boot: Externalized Configuration và Profiles", href: "https://docs.spring.io/spring-boot/reference/features/profiles.html" },
    ],
    stateIn: "Đầu ra s37: shop chạy từ release Helm shop; ~/shop/pre-helm/catalog.yaml là manifest catalog cũ. `./labs/lab begin cka s38` kiểm đầu vào bằng verify của s37, tạo ~/drills/s38 và ~/kustomize/shop, xoá answers.env cũ.",
    stateOut: "~/kustomize/shop/{base,overlays/dev,overlays/prod}; namespace shop-dev chạy catalog (H2) 1 replica tag 1.0, limit 208Mi, từ overlay dev, bằng ConfigMap catalog-config-<hash> sau một lần đổi literal (hai ReplicaSet, hai ConfigMap); overlay prod (shop-prod, 2 replica, tag 2.0) chỉ build; ~/drills/s38/answers.env (HASHED_CM_NAME); shop không đổi.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s38`. `k version --client` (dòng Kustomize Version). Base: `cd ~/kustomize/shop && mkdir -p base overlays/dev overlays/prod`. `base/deployment.yaml` từ `~/shop/pre-helm/catalog.yaml`: bỏ `namespace`, `DB_URL`, `DB_USER`, `DB_PASSWORD`, affinity, preStop (macro vim xoá các khối env lặp lại), thêm `envFrom: [{configMapRef: {name: catalog-config}}]`, `replicas: 1`. `base/service.yaml`: Service catalog cổng http 8080. `base/kustomization.yaml`: `resources` hai tệp, `configMapGenerator` tên `catalog-config` với `JAVA_OPTS=-XX:MaxRAMPercentage=50`, `LOGGING_LEVEL_SHOP=INFO`. `k kustomize base`: ConfigMap tên gì, `envFrom` của Deployment trỏ tên gì?",
      },
      {
        id: "t2",
        text: "Overlay dev: `overlays/dev/kustomization.yaml` có `namespace: shop-dev`, `resources: [../../base]`, `replicas: [{name: catalog, count: 1}]`, `images: [{name: shop/catalog, newTag: \"1.0\"}]`, `patches: [{path: memory.yaml}]`; `memory.yaml` là patch strategic merge đặt requests/limits memory 208Mi cho container `catalog`. `k kustomize overlays/dev | grep -nE '^kind:|namespace:|image:|replicas:|memory:'`. `k create ns shop-dev`, `k apply -k overlays/dev`, `k -n shop-dev rollout status deploy/catalog`, `k -n shop-dev get cm,rs`.",
      },
      {
        id: "t3",
        text: "Đổi literal, thấy rollout. Thêm vào overlay dev `configMapGenerator: [{name: catalog-config, behavior: merge, literals: [LOGGING_LEVEL_SHOP=DEBUG]}]`. `k diff -k overlays/dev` (chỗ nào đổi trong Deployment?), `k apply -k overlays/dev`, `k -n shop-dev rollout status deploy/catalog`, `k -n shop-dev get cm,rs`: ConfigMap cũ còn không, ReplicaSet nào 0? Ghi tên ConfigMap Pod đang dùng: `k -n shop-dev get deploy catalog -o jsonpath='{.spec.template.spec.containers[0].envFrom[0].configMapRef.name}'` vào `~/drills/s38/answers.env` dạng `HASHED_CM_NAME=<tên>`. So với s12 (k-cm-file): sửa ConfigMap không hash thì Pod có tự đổi không?",
      },
      {
        id: "t4",
        text: "Overlay prod: `namespace: shop-prod`, base, `replicas` 2, `images` tag `\"2.0\"`. **Chỉ build**, không apply: `k kustomize overlays/prod | grep -nE '^kind:|namespace:|image:|replicas:|name: catalog-config'`. Vì sao tên ConfigMap của prod trùng với bản đầu tiên của dev? `diff <(k kustomize overlays/dev) <(k kustomize overlays/prod)`. So độ dài với `helm template shop ~/charts/shop -n shop | wc -l`: chart render bao nhiêu dòng, overlay bao nhiêu?",
      },
      {
        id: "t5",
        text: "Tình huống hỏng: `cp -r overlays/dev ~/drills/s38/broken-dev`, sửa `resources` thành `../../../../kustomize/shop/base` và `metadata.name` trong `memory.yaml` thành `catalog-api`. `k kustomize ~/drills/s38/broken-dev`: lỗi nói gì? Thử thêm hai lỗi im lặng: `images: [{name: shop/catalogue, …}]` (build có lỗi không, image ra sao?) và patch đúng tên Deployment nhưng container tên `catalogue` (`k kustomize … | k apply --dry-run=server -f -`).",
      },
      {
        id: "t6",
        text: "Kiểm Pod dùng đúng ConfigMap và chạy H2: `k -n shop-dev get pod -o jsonpath='{.items[*].spec.containers[0].envFrom}'`, `k -n shop-dev exec deploy/catalog -- printenv LOGGING_LEVEL_SHOP DB_URL` (DB_URL không có), `k -n shop-dev top pod`. `k -n shop get cm | grep catalog-config` phải rỗng (overlay không chạm shop). Trên Mac: `./labs/lab verify cka s38` phải 4/4.",
      },
    ],
    hints: [
      "`error: no resource matches strategic merge patch \"Deployment.v1.apps/catalog-api.[noNs]\": no matches for Id Deployment.v1.apps/catalog-api.[noNs]; failed to find unique target for patch Deployment.v1.apps/catalog-api.[noNs]` (đo): tên trong patch không có trong base. `[noNs]` vì patch được khớp trước khi transformer `namespace` chạy.",
      "`new root '/home/ubuntu/kustomize/shop/base' cannot be absolute` (đo): `resources:` chỉ nhận đường dẫn tương đối (hay URL Git). Đếm `../` từ thư mục chứa kustomization.yaml.",
      "`apply -k` xong mà Pod không đổi: bạn sửa literal ở base nhưng overlay dùng `behavior: replace`, hay sửa ConfigMap trong cluster bằng `k edit` (Kustomize không biết). Xem `k diff -k overlays/dev` trước khi apply.",
      "`Error from server (NotFound): error when creating \"STDIN\": namespaces \"…\" not found` (đo) khi apply: `namespace:` trong kustomization không tạo namespace; `k create ns shop-dev`.",
      "Apply nhầm overlay dev vào shop (đổi `namespace: shop`) phá catalog của shop, đo: `kubectl apply` xoá `DB_URL`, `DB_USER`, `DB_PASSWORD` khỏi Deployment do Helm quản (catalog chạy H2 với dữ liệu mẫu), hạ limit xuống 208Mi, thêm `envFrom` tới `catalog-config-…`. `helm upgrade shop ~/charts/shop -n shop --force-conflicts` đưa env và resources về, nhưng **không gỡ `envFrom`** (trường đó thuộc field manager `kubectl-client-side-apply`, Helm không quản), và xoá ConfigMap kia thì Pod mới `CreateContainerConfigError`. Gỡ bằng `k -n shop patch deploy catalog --type=json -p '[{\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/envFrom\"}]'`.",
      "Patch đúng Deployment nhưng sai tên container (`catalogue`): build **không** lỗi, strategic merge thêm một container thứ hai chỉ có `resources`; apply mới lỗi `The Deployment \"catalog\" is invalid: spec.template.spec.containers[0].image: Required value` (đo). `images` sai tên image thì không lỗi ở đâu cả, image giữ nguyên (đo).",
      "Pod catalog ở shop-dev `OOMKilled` liên tục: limit dưới mức đo (192Mi trở xuống, với `MaxRAMPercentage=50`). `k -n shop-dev describe pod` → `Last State: Terminated, Reason: OOMKilled`; nâng lên 208Mi trở lên.",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6); hậu tố hash giống bên bạn nếu nội dung literal giống hệt (hash tính từ nội dung).

**1. Base**

\`base/kustomization.yaml\`:

\`\`\`yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
configMapGenerator:
- name: catalog-config
  literals:
  - JAVA_OPTS=-XX:MaxRAMPercentage=50
  - LOGGING_LEVEL_SHOP=INFO
\`\`\`

\`base/deployment.yaml\` (phần container): \`image: shop/catalog:1.0\`, \`envFrom: [{configMapRef: {name: catalog-config}}]\`, cổng \`http\` 8080, ba probe như shop, requests 100m/256Mi, limits memory 384Mi; không \`DB_URL\` (H2), không namespace.

**2. Overlay dev và lần apply đầu**

\`overlays/dev/kustomization.yaml\` (bản cuối, sau t3):

\`\`\`yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: shop-dev
resources:
- ../../base
replicas:
- name: catalog
  count: 1
images:
- name: shop/catalog
  newTag: "1.0"
patches:
- path: memory.yaml
configMapGenerator:
- name: catalog-config
  behavior: merge
  literals:
  - LOGGING_LEVEL_SHOP=DEBUG
\`\`\`

\`overlays/dev/memory.yaml\`:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: catalog
spec:
  template:
    spec:
      containers:
      - name: catalog
        resources:
          requests:
            memory: 208Mi
          limits:
            memory: 208Mi
\`\`\`

Lần đầu (chưa có \`configMapGenerator\` trong overlay):

\`\`\`bash
k kustomize overlays/dev | grep -nE '^kind:|^  name:|namespace:|image:|replicas:|memory:'
# 5:kind: ConfigMap
# 7:  name: catalog-config-7fhk8bc7tc
# 8:  namespace: shop-dev
# 11:kind: Service
# 15:  name: catalog
# 16:  namespace: shop-dev
# 26:kind: Deployment
# 30:  name: catalog
# 31:  namespace: shop-dev
# 33:  replicas: 1
# 46:        image: shop/catalog:1.0
# 65:            memory: 208Mi
# 68:            memory: 208Mi
k create ns shop-dev
k apply -k overlays/dev
# configmap/catalog-config-7fhk8bc7tc created
# service/catalog created
# deployment.apps/catalog created
k -n shop-dev rollout status deploy/catalog
# deployment "catalog" successfully rolled out
\`\`\`

**3. Đổi literal → hash mới → rollout**

\`\`\`bash
k apply -k overlays/dev
# configmap/catalog-config-t92k75m627 created
# service/catalog unchanged
# deployment.apps/catalog configured
k -n shop-dev get cm,rs
# NAME                                  DATA   AGE
# configmap/catalog-config-7fhk8bc7tc   2      24s
# configmap/catalog-config-t92k75m627   2      12s
# configmap/kube-root-ca.crt            1      24s
#
# NAME                                 DESIRED   CURRENT   READY   AGE
# replicaset.apps/catalog-656bbfffd    0         0         0       23s
# replicaset.apps/catalog-7d54d7cc7f   1         1         1       12s
cat ~/drills/s38/answers.env
# HASHED_CM_NAME=catalog-config-t92k75m627
\`\`\`

ConfigMap cũ vẫn còn: \`k rollout undo deploy/catalog -n shop-dev\` quay về ReplicaSet cũ vẫn chạy được vì nó trỏ \`catalog-config-7fhk8bc7tc\` còn đó. Apply lần nữa không đổi gì (\`unchanged\` cả ba).

**4. Overlay prod, chỉ build**

\`\`\`bash
k kustomize overlays/prod | grep -nE '^kind:|^  name:|namespace:|image:|replicas:'
# 5:kind: ConfigMap
# 7:  name: catalog-config-7fhk8bc7tc
# 8:  namespace: shop-prod
# 26:kind: Deployment
# 31:  namespace: shop-prod
# 33:  replicas: 2
# 46:        image: shop/catalog:2.0
\`\`\`

Tên ConfigMap của prod trùng bản đầu của dev: cùng literal của base, và namespace không nằm trong hash.

**5. Tình huống hỏng**

\`\`\`bash
k kustomize ~/drills/s38/broken-dev
# Error: no resource matches strategic merge patch "Deployment.v1.apps/catalog-api.[noNs]": no matches for Id Deployment.v1.apps/catalog-api.[noNs]; failed to find unique target for patch Deployment.v1.apps/catalog-api.[noNs]
\`\`\`

**6. Kiểm**

\`\`\`bash
k -n shop-dev get pod -o wide
# catalog-7d54d7cc7f-ml2r5   1/1   Running   0   14s   10.244.95.183   cka-w1
k get --raw "/api/v1/namespaces/shop-dev/pods/catalog-7d54d7cc7f-ml2r5:8080/proxy/products" | head -c 80
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây",…
k -n shop-dev top pod
# catalog-7d54d7cc7f-ml2r5   15m   171Mi
k -n shop-dev exec deploy/catalog -- printenv LOGGING_LEVEL_SHOP DB_URL
# DEBUG
# command terminated with exit code 1        (DB_URL không có: H2)
k -n shop-dev logs deploy/catalog | grep DEBUG | head -1
# 2026-11-19T07:00:42.158Z DEBUG 1 --- [catalog] [           main] shop.catalog.CatalogApplication          : Running with Spring Boot v4.1.2, Spring v7.0.10
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s38/apply.sh\` (cây chuẩn ở \`files/kustomize/\`, \`files/solve.sh\`; chạy lại được).`,
    exam: {
      patterns: [
        "\"Áp các manifest trong thư mục /opt/X có kustomization.yaml\" — `k apply -k /opt/X` (không phải `-f`); xem trước bằng `k kustomize /opt/X`.",
        "\"Sửa kustomization để mọi object vào namespace N / đổi image sang tag T / đặt replicas R\" — `namespace:`, `images: [{name, newTag}]`, `replicas: [{name, count}]`.",
        "\"Thêm ConfigMap từ tệp/literal bằng Kustomize và cho Deployment dùng nó\" — `configMapGenerator` (`files:` hay `literals:`), tham chiếu bằng tên gốc, Kustomize tự gắn hậu tố.",
        "\"Xoá mọi thứ một overlay đã tạo\" — `k delete -k <thư mục>`.",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Trong 3 phút: thư mục `/tmp/k` chỉ có `deploy.yaml` (Deployment `web`, image `nginx:1.27`). Viết kustomization đưa nó vào namespace `drill`, đổi image sang `nginx:1.28`, 3 replica; in kết quả mà không apply.",
          timeLimitMin: 3,
          solution: "```yaml\n# /tmp/k/kustomization.yaml\nnamespace: drill\nresources:\n- deploy.yaml\nimages:\n- name: nginx\n  newTag: \"1.28\"\nreplicas:\n- name: web\n  count: 3\n```\n```bash\nk kustomize /tmp/k | grep -E 'namespace:|image:|replicas:'\n```\n`images.name` là tên image (`nginx`), không phải tên container.",
        },
        {
          text: "Trong 2 phút: cùng thư mục, sinh ConfigMap `web-env` từ literal `MODE=exam` và cho container dùng qua `envFrom`. Tên ConfigMap trong output là gì, và Deployment có trỏ đúng tên đó không?",
          timeLimitMin: 2,
          solution: "```yaml\nconfigMapGenerator:\n- name: web-env\n  literals:\n  - MODE=exam\n```\nTrong `deploy.yaml`: `envFrom: [{configMapRef: {name: web-env}}]`. `k kustomize /tmp/k | grep web-env`: cả ConfigMap lẫn `configMapRef` cùng là `web-env-<hash>`.",
        },
      ],
    },
    tips: [
      "Luôn `k kustomize <dir>` (hay `k diff -k <dir>`) trước `k apply -k <dir>`: lỗi patch, sai namespace hiện ra trước khi đụng cluster.",
      "`images:` khớp theo tên image trong base, `replicas:` theo tên Deployment, patch theo `kind` + `metadata.name`: ba cách nhắm khác nhau, nhầm thì build lỗi (patch) hay im lặng không đổi gì (images, replicas).",
      "`namespace:` trong kustomization không tạo namespace; trên đề, đọc lỗi `namespaces \"…\" not found` là biết.",
      "Muốn Pod nhận cấu hình mới mà không cần `rollout restart`: để `configMapGenerator` sinh hậu tố hash (mặc định), đừng bật `disableNameSuffixHash`.",
    ],
    outcome: {
      md: `Có một base catalog và hai overlay; dev chạy thật ở namespace shop-dev, prod chỉ build, và bạn đã thấy một lần đổi literal biến thành rollout. Trên Mac:

\`\`\`bash
./labs/lab verify cka s38
\`\`\`

Verify **tự build** hai overlay bằng \`kubectl kustomize\` trên cka-cp (không apply). Overlay dev phải ra đúng một Deployment catalog, ConfigMap \`catalog-config-<hash>\` mà Deployment trỏ tới, Service, mọi object ở \`shop-dev\`, 1 replica, \`shop/catalog:1.0\`; Deployment trong shop-dev phải trùng kết quả build (ConfigMap, image, resources, replicas: sửa tệp mà chưa apply lại thì đỏ). Trong shop-dev: catalog Available, không \`DB_URL\`, limit memory ≤ 256Mi (patch đã áp), mọi Pod dùng đúng ConfigMap có hash đang tồn tại, và có ít nhất hai ReplicaSet trỏ hai ConfigMap khác nhau (đã đổi literal rồi apply lại). Overlay prod: 2 replica, \`shop/catalog:2.0\`, namespace không phải \`shop-dev\`, \`shop\`, \`default\`, và chưa có Deployment nào ở đó. \`HASHED_CM_NAME\` bằng ConfigMap Pod đang dùng. Cùng dòng shop-dev, verify chạy lại phần của s37 cho shop (release, 15 object, bốn Deployment Available) và đòi shop không có \`catalog-config-*\`, catalog của shop vẫn có \`DB_URL\` (overlay dev apply nhầm vào shop: đỏ).`,
      verifyOutput: "lab: kiểm s38\n  (chờ apiserver, shop và shop-dev, nếu đang khởi động: tối đa ~20 phút)\n  ✓ ~/kustomize/shop/{base,overlays/dev,overlays/prod}; build overlays/dev (namespace shop-dev, ConfigMap có hash) khớp shop-dev\n  ✓ shop-dev: catalog H2 Available, 1 replica, tag 1.0, limit hạ, Pod dùng đúng ConfigMap catalog-config-<hash>, đã rollout do đổi literal; shop như cuối s37, không bị overlay chạm\n  ✓ Build overlays/prod (verify tự build): 2 replica, tag 2.0, namespace riêng khác shop-dev và shop, chưa apply\n  ✓ answers.env: HASHED_CM_NAME là ConfigMap Pod catalog ở shop-dev đang dùng\n  → 4/4 đạt",
      projectDelta: "shop có thêm một môi trường dev (namespace shop-dev, catalog H2 nhỏ, cấu hình riêng) dựng bằng Kustomize từ cùng base với prod; shop chính vẫn do release Helm quản.",
    },
    review: [
      { q: "Overlay Kustomize và Spring profile giống và khác nhau ở đâu?", a: "Giống: một phần chung (base / `application.yml`) và phần đè theo môi trường (overlay / `application-dev.yml`). Khác: profile chọn lúc ứng dụng chạy, cùng một bộ cấu hình đi khắp nơi; overlay chọn lúc build, mỗi môi trường ra một bộ YAML riêng xem được trước bằng `k kustomize`. Hai thứ kết hợp được: overlay đặt `SPRING_PROFILES_ACTIVE` hay `LOGGING_LEVEL_*` vào ConfigMap." },
      { q: "Vì sao đổi một literal trong `configMapGenerator` làm Pod rollout, còn sửa ConfigMap `shop-config` của s12 thì không?", a: "Generator gắn hậu tố hash theo nội dung và sửa mọi tham chiếu trong lần build; literal đổi → tên ConfigMap đổi → pod template của Deployment đổi → ReplicaSet mới. `shop-config` giữ tên cố định nên pod template không đổi; `envFrom` chỉ đọc lúc container khởi động, nên Pod cũ giữ giá trị cũ tới khi `rollout restart`." },
      { q: "Sau hai lần `apply -k`, shop-dev có hai ConfigMap `catalog-config-*`. Có nên xoá cái cũ ngay không?", a: "Nó vô hại và là thứ giúp `rollout undo` về ReplicaSet cũ chạy được. `apply -k` không prune; dọn khi chắc không cần quay lại, bằng tay hay `--prune` có nhãn chọn. Xoá cái đang được dùng thì Pod mới `CreateContainerConfigError`." },
      { q: "Patch đặt `metadata.name: catalog-api` thì chuyện gì xảy ra? Còn `images: [{name: shop/catalogue, newTag: \"2.0\"}]`?", a: "Patch sai tên: build lỗi `no matches for Id Deployment.v1.apps/catalog-api.[noNs]; failed to find unique target for patch` (đo). `images` sai tên image thì không lỗi gì, chỉ không đổi: phải đọc output của `k kustomize` để thấy." },
      { q: "Khi nào chọn Helm, khi nào Kustomize, cho cùng ứng dụng shop?", a: "Helm khi đóng gói để người khác cài với tham số, cần release/history/rollback (chart shop của s37, component công khai). Kustomize khi bạn sở hữu YAML và chỉ cần vài khác biệt giữa môi trường (overlay dev/prod). Có thể ghép: `helm template` ra base rồi Kustomize vá." },
    ],
  },
// ───────────────────────────── s39 ─────────────────────────────
  {
    id: "s39",
    stage: "st7",
    title: "CRD và operator",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-crd"],
    requires: ["s38"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Viết một CRD nhỏ, tạo custom resource của nó và tra trường bằng kubectl explain.",
      "Cài một operator thật và tạo custom resource để nó dựng tài nguyên thay mình.",
      "Liệt kê CRD và custom resource có trong cluster, biết cái nào namespaced.",
    ],
    skills: [
      { skill: "k-crd-yaml", level: "Viết được có tra" },
      { skill: "k-api-resources-ns", level: "Gõ được không tra" },
      { skill: "k-explain-cr", level: "Gõ được không tra" },
      { skill: "k-operator-pattern", level: "Giải thích được" },
      { skill: "k-install-operator", level: "Làm được có tra" },
    ],
    uses: ["k-api-resources", "k-helm-install", "k-explain", "k-deploy-rs-pod"],
    stateIn: "Đầu ra s38.",
    stateOut: "CRD shopfeatures.shop.example.com có hai resource; operator đã cài và quản lý một custom resource đang Ready.",
  },
  {
    id: "s40",
    stage: "st7",
    title: "Sự cố chặng 7: release hỏng",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s39"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Đưa release shop từ failed về deployed trong 20 phút bằng history, values và log của Pod mới.",
      "Rollback release về revision chạy được gần nhất và chỉ ra values nào gây lỗi.",
      "Gỡ một release kẹt pending-upgrade một cách an toàn.",
    ],
    skills: [
      { skill: "k-helm-rollback", level: "Gõ được không tra" },
      { skill: "k-helm-history", level: "Gõ được không tra" },
      { skill: "k-helm-get-values", level: "Gõ được không tra" },
      { skill: "k-helm-uninstall", level: "Gõ được không tra" },
      { skill: "k-helm-repo-update", level: "Gõ được không tra" },
      { skill: "k-helm-status", level: "Gõ được không tra" },
    ],
    uses: ["k-helm-list", "k-logs-previous", "k-events-sorted", "k-rollout-history"],
    stateIn: "Đầu ra s39 cộng `./labs/lab break`: một lần helm upgrade lỗi để lại release shop failed.",
    stateOut: "Release shop deployed, đúng revision và cấu hình như cuối s37.",
  },
];
