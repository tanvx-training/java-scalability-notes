// Chặng 7 — Đóng gói và mở rộng: Helm, Kustomize, CRD.
// s37–s40 đã phát hành (đợt 4).

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
    uses: ["k-resources-yaml", "k-get-pod-yaml", "vim-macro"],
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

**Nhận lại (adoption) thay vì xoá rồi cài.** shop đang chạy từ manifest rời. Helm từ chối "cướp" object không phải của nó: \`helm install\` khi object đã có báo \`exists and cannot be imported into the current release: invalid ownership metadata\` và không tạo gì. Helm coi một object là của release \`shop\` ở namespace \`shop\` khi object có **nhãn** \`app.kubernetes.io/managed-by=Helm\` và **hai annotation** \`meta.helm.sh/release-name=shop\`, \`meta.helm.sh/release-namespace=shop\`. Gắn đủ ba thứ đó cho 15 object rồi \`helm install\`: Helm thấy object đã là của mình và chỉ cập nhật chỗ khác. Đo trên lab: không ReplicaSet mới, không Pod nào khởi động lại, và một vòng \`curl\` 5 request/giây tới 30180 trong 20 giây bao quanh lần cài (cài mất 2,4 giây) được 70/70 mã 200. (Helm 3.17+ và 4 còn có \`--take-ownership\`, bỏ qua kiểm tra và tự gắn annotation.)

Đường còn lại là **xoá rồi cài**: \`k delete -f ~/shop/…\`, rồi \`helm install\`. Đơn giản, nhưng cái giá là thật: mọi Pod bị xoá cùng lúc (gateway, catalog, order cùng mất, request trả lỗi tới khi Pod mới Ready: JVM khởi động, initContainer của gateway chờ catalog), Service tạo lại có thể nhận ClusterIP khác, HPA mất lịch sử co giãn. Với StatefulSet, xoá kéo theo Pod và (tuỳ chính sách) PVC: đó là lý do PostgreSQL, Secret \`db-cred\`, NetworkPolicy, Ingress, Gateway/HTTPRoute, quota/LimitRange nằm ngoài chart. Nhóm thật nhận lại dần từng phần như vậy, phần hạ tầng sống lâu để riêng.

**Chart phải render ra đúng thứ đang chạy, nhất là selector.** \`spec.selector\` của Deployment **bất biến**: chart đổi nhãn selector (ví dụ thêm \`app.kubernetes.io/name\` như template của \`helm create\`) thì Helm 4 báo trước một conflict trên \`.spec.selector\` (trường đó thuộc \`kubectl-client-side-apply\`, đo), và ép bằng \`--force-conflicts\` thì apiserver từ chối \`spec.selector: … field is immutable\` (đo); đổi nhãn trong \`template.metadata.labels\` thì mọi Pod rollout. Vì vậy template giữ đúng \`app: <tên>\`. Kiểm trước bằng \`helm template shop ~/charts/shop -n shop | k diff -n shop -f -\`: trên lab khác biệt duy nhất là \`replicas: 2 → 1\` của catalog, vì chart cố ý **không ghi \`replicas\`** khi có HPA (mỗi lần upgrade sẽ kéo số replica về giá trị trong chart, giành với HPA). \`k diff\` dùng client-side apply nên thấy trường biến mất là "xoá về mặc định 1"; Helm 4 dùng server-side apply không đụng trường nó không quản, nên sau \`helm install\` catalog vẫn 2 replica do HPA giữ (đo).

**Helm 4 và server-side apply: chủ sở hữu từng trường.** Helm 4 (bản ghim của lab là v4.3.2) cài release mới bằng **server-side apply** (SSA): apiserver nhớ trường nào thuộc "field manager" nào (\`k get deploy order --show-managed-fields\`). Các object của shop được tạo bằng \`kubectl apply\` thường, nên mọi trường thuộc \`kubectl-client-side-apply\`. Lần \`helm upgrade\` đầu tiên đổi một trường như thế (image của order) bị từ chối: \`conflict with "kubectl-client-side-apply" … .spec.template.spec.containers[name="order"].image\`, release ghi revision \`failed\`, cluster không đổi (đo). \`--force-conflicts\` bảo apiserver chuyển quyền sở hữu **đúng trường đang xung đột** sang Helm, không phải cả object. Đo ngay sau đó: \`helm upgrade\` thường đổi \`APP_GREETING\` của \`shop-config\` lại conflict (\`.data.APP_GREETING\`), đổi \`maxReplicas\` của HPA conflict, đổi \`requests.cpu\` của chính order cũng conflict; chỉ trường đã ép một lần (đưa \`APP_GREETING\` về giá trị cũ) mới upgrade thường được. Nghĩa là: với release nhận lại từ \`kubectl apply\`, **mọi** \`helm upgrade\`/\`helm rollback\` đổi một trường chưa từng bị ép sẽ conflict. Hai cách bền: luôn thêm \`--force-conflicts\` khi upgrade/rollback release này (lab làm vậy), hoặc gỡ một lần mục \`kubectl-client-side-apply\` khỏi \`metadata.managedFields\` của từng object để Helm là chủ duy nhất (đo trên Deployment order: gỡ xong, upgrade thường đổi \`requests.cpu\` chạy được). Helm 3 dùng client-side 3-way merge, không có field manager, nên không gặp lỗi này. Một hệ quả nữa: sau khi Helm nhận, đừng sửa bằng \`k set image\` hay \`k edit\`: release và cluster lệch nhau, upgrade sau đó hoặc ghi đè thay đổi của bạn hoặc báo conflict. Đổi image là đổi \`values.yaml\` rồi \`helm upgrade\`.

**Helm 3 và Helm 4 trên đề thi.** Lệnh của đề (\`repo add\`, \`search repo\`, \`install … --version --set -f -n --create-namespace\`, \`list\`, \`upgrade\`, \`history\`, \`rollback\`, \`uninstall\`, \`template\`, \`show values\`) giống nhau ở cả hai bản. Khác cần nhớ (trang "Helm 4 Overview" của helm.sh, đo trên v4.3.2): \`--atomic\` đổi tên thành \`--rollback-on-failure\`, \`--force\` thành \`--force-replace\` (tên cũ vẫn chạy kèm cảnh báo); release mới mặc định server-side apply (\`--server-side=false\` để dùng kiểu cũ); \`helm list -a\` không còn (\`unknown shorthand flag: 'a' in -a\`); đo trên v4.3.2: \`helm list\` trần đã in release \`failed\` lẫn \`pending-upgrade\`, \`--failed\` chỉ in release \`failed\`, \`--pending\` in \`pending-upgrade\`, \`--deployed\` bỏ chúng (help của Helm 3 ghi \`helm list\` trần chỉ in release \`deployed\` và \`failed\`, \`-a\` mới gồm mọi trạng thái); \`--wait\` không ghi thì chỉ chờ hook (\`hookOnly\`), ghi \`--wait\` là chờ tài nguyên Ready.

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
        text: "Upgrade đổi một value: sửa `order.image.tag` trong `~/charts/shop/values.yaml` thành `\"2.0\"` (đừng `k set image`: cluster sẽ lệch release), `helm upgrade shop ~/charts/shop -n shop --wait`. Đọc lỗi conflict: trường nào, của field manager nào? `k get deploy order --show-managed-fields -o jsonpath='{.metadata.managedFields[*].manager}'`. Chạy lại với `--force-conflicts`, `k rollout status deploy/order`, `helm history shop -n shop` (revision nào `failed`, nào `deployed`?), `helm get values shop -n shop --all | sed -n '/^order:/,$p'`. Rồi đổi `config.APP_GREETING` và `helm upgrade` thường lần nữa: có conflict không, trên trường nào? Từ đây mọi upgrade/rollback của release này kèm `--force-conflicts` (hay gỡ mục `kubectl-client-side-apply` khỏi `managedFields`); trả `APP_GREETING` về `Xin chào từ ConfigMap`.",
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
      "`helm list -a` báo `unknown shorthand flag: 'a' in -a`: Helm 4 bỏ cờ này. Đo: `helm list` trần đã in release `failed` và `pending-upgrade`; lọc bằng `--failed` (chỉ `failed`) hay `--pending` (`pending-install`/`pending-upgrade`/`pending-rollback`).",
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
# STATUS: deployed  REVISION: 3
k get deploy order -o wide
# order   1/1   1   1   4d11h   order   shop/order:2.0   app=order
\`\`\`

Ép một lần **không** làm Helm thành chủ cả object. Cùng lần chạy, đổi tiếp vài value khác bằng upgrade thường:

\`\`\`bash
vim ~/charts/shop/values.yaml          # config.APP_GREETING: Xin chào từ Helm
helm upgrade shop ~/charts/shop -n shop --wait
# Error: UPGRADE FAILED: conflict occurred while applying object shop/shop-config /v1, Kind=ConfigMap: Apply failed with 1 conflict: conflict with "kubectl-client-side-apply" using v1: .data.APP_GREETING
vim ~/charts/shop/values.yaml          # catalog.autoscaling.maxReplicas: 4
helm upgrade shop ~/charts/shop -n shop --wait
# Error: UPGRADE FAILED: … .data.APP_GREETING && conflict occurred while applying object shop/catalog autoscaling/v2, Kind=HorizontalPodAutoscaler: …
helm upgrade shop ~/charts/shop -n shop --force-conflicts --wait      # REVISION: 6, deployed
vim ~/charts/shop/values.yaml          # trả APP_GREETING và maxReplicas về như cũ
helm upgrade shop ~/charts/shop -n shop --wait                        # REVISION: 7, deployed: hai trường này đã là của helm
vim ~/charts/shop/values.yaml          # order.resources.requests.cpu: 110m
helm upgrade shop ~/charts/shop -n shop --wait
# Error: UPGRADE FAILED: … conflict with "kubectl-client-side-apply" using apps/v1: .spec.template.spec.containers[name="order"].resources.requests.cpu
# Gỡ mục kubectl-client-side-apply khỏi managedFields của Deployment order (JSON patch thay /metadata/managedFields bằng
# danh sách đã lọc), rồi upgrade thường lại:
k get deploy order --show-managed-fields -o jsonpath='{.metadata.managedFields[*].manager}'
# helm kubectl-label kubectl-annotate kube-controller-manager
helm upgrade shop ~/charts/shop -n shop --wait                        # REVISION: 9, deployed, requests.cpu 110m
vim ~/charts/shop/values.yaml          # order.resources.requests.cpu: 100m (trả về như cũ)
helm upgrade shop ~/charts/shop -n shop --wait                        # REVISION: 10, deployed: upgrade thường qua
helm history shop -n shop
# REVISION	UPDATED                 	STATUS    	CHART     	APP VERSION	DESCRIPTION
# 1       	Thu Nov 19 14:28:36 2026	superseded	shop-0.1.0	1.0        	Install complete
# 2       	Thu Nov 19 14:28:52 2026	failed    	shop-0.1.0	1.0        	Upgrade "shop" failed: conflict occurred while applying object shop/order …
# 3       	Thu Nov 19 14:28:53 2026	superseded	shop-0.1.0	1.0        	Upgrade complete
# 4       	Thu Nov 19 14:29:12 2026	failed    	shop-0.1.0	1.0        	Upgrade "shop" failed: conflict occurred while applying object shop/shop-config …
# 5       	Thu Nov 19 14:29:13 2026	failed    	shop-0.1.0	1.0        	Upgrade "shop" failed: conflict occurred while applying object shop/shop-config …
# 6       	Thu Nov 19 14:29:14 2026	superseded	shop-0.1.0	1.0        	Upgrade complete
# 7       	Thu Nov 19 14:29:16 2026	superseded	shop-0.1.0	1.0        	Upgrade complete
# 8       	Thu Nov 19 14:29:18 2026	failed    	shop-0.1.0	1.0        	Upgrade "shop" failed: conflict occurred while applying object shop/order …
# 9       	Thu Nov 19 14:29:21 2026	superseded	shop-0.1.0	1.0        	Upgrade complete
# 10      	Thu Nov 19 14:29:58 2026	deployed  	shop-0.1.0	1.0        	Upgrade complete
k get secret -l owner=helm
# NAME                          TYPE                 DATA   AGE
# sh.helm.release.v1.shop.v1    helm.sh/release.v1   1      2m22s
# sh.helm.release.v1.shop.v10   helm.sh/release.v1   1      60s
# sh.helm.release.v1.shop.v2    helm.sh/release.v1   1      2m6s
# …                             (v3 … v9, mỗi revision một Secret, cả revision failed)
\`\`\`

Kết luận đo được: với release nhận lại, chỉ \`helm upgrade\` (và \`helm rollback\`, cũng có cờ \`--force-conflicts\`) **kèm \`--force-conflicts\`** là đi chắc; lời giải tự động luôn ghi cờ này. Cài từ \`values.yaml\` rồi upgrade không \`--set\` thì không vướng chuyện values được nhớ (hint thứ ba). Rollout của order lúc đổi image mất 12 giây (\`--wait\` chờ Pod mới Ready).

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

Verify đọc bằng \`helm … -o json\` và kubectl: helm đúng v4.3.2; release \`demo\` ở namespace \`demo\` là \`podinfo-6.16.0\`, \`deployed\`, Pod mang \`PODINFO_UI_MESSAGE=Xin chào từ Helm\` (của \`--set\`), limit 64Mi và chạy trên cka-cp (của \`-f\`). Release \`shop\` ở namespace \`shop\` (release khác tên hay ở namespace khác đều đỏ), chart \`shop-0.1.0\`, \`deployed\`, revision ≥ 2 với \`order.image.tag\` 2.0; image, resources, replicas của bốn Deployment bằng \`helm get values --all\`; \`~/charts/shop\` có \`Chart.yaml\` đúng tên/bản và \`values.yaml\` đủ \`image.tag\`, \`replicas\`, \`resources\` cho từng service. Manifest của release đúng 15 object (thiếu hay thừa, ví dụ đưa \`postgres\` vào chart: đỏ), mỗi object mang nhãn và annotation của release \`shop\`, không object nào khác trong shop mang annotation release, Deployment và Service có \`creationTimestamp\` trước revision 1 (xoá rồi cài: đỏ). Mỗi object có field manager \`helm\` (Helm thật sự đã apply nó, không chỉ gắn nhãn tay) và manifest không ghi namespace nào khác \`shop\`. Selector của bốn Deployment vẫn \`app: <tên>\`, cả bốn Available, order chạy bằng SA \`order\`; Role \`order-config-reader\` (nay do chart tạo) chỉ \`get\`/\`list\`/\`watch\` configmaps theo \`resourceNames: [order-config]\`, và token thật của SA order đọc được \`order-config\`, không đọc \`shop-config\`, không \`list\` ConfigMap, không đọc Secret (dòng SA của s35; Role trong chart bỏ \`resourceNames\`: đỏ, đo); và \`curl\` từ máy Mac tới \`<IP cka-w1>:30180/api/products\` trả 200 với 3 sản phẩm. \`~/shop/*.yaml\` không còn object nào của chart, \`~/shop/pre-helm/\` giữ bốn Deployment cũ, \`~/shop/rbac.yaml\` giữ bốn object RBAC của dev/ops.`,
      verifyOutput: "lab: kiểm s37\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~24 phút)\n  ✓ helm v4.3.2 trên cka-cp; release demo (namespace demo) deployed, chart podinfo-6.16.0, ui.message và limits/nodeSelector ghi đè có hiệu lực, Pod trên cka-cp\n  ✓ Release shop ở namespace shop: deployed, chart shop-0.1.0, đã upgrade (order.image.tag 2.0); Deployment khớp values; ~/charts/shop đủ khoá\n  ✓ Đúng 15 object trong release, mang nhãn/annotation của release shop, nhận lại chứ không tạo lại, ngoài chart không object nào mang annotation release; selector không đổi, bốn Deployment Available, order chạy bằng SA order chỉ đọc được ConfigMap order-config; từ Mac curl <IP cka-w1>:30180/api/products trả 200 với 3 sản phẩm\n  ✓ ~/shop/ không còn tệp của object đã vào chart (bản cũ ở ~/shop/pre-helm/); ~/shop/rbac.yaml giữ RBAC của dev/ops\n  → 4/4 đạt",
      projectDelta: "shop có chart Helm riêng (~/charts/shop, 0.1.0) quản lý bốn workload, ConfigMap, HPA và danh tính của order; đổi image hay replicas từ nay là sửa values.yaml rồi helm upgrade, có history để quay lại (s40). PostgreSQL, Secret, NetworkPolicy và cửa vào vẫn là manifest trong ~/shop/.",
    },
    review: [
      { q: "Vì sao chart shop nhận lại object đang chạy thay vì `k delete` rồi `helm install`? Cái giá của cách thứ hai trên lab là gì?", a: "Nhận lại chỉ gắn nhãn `app.kubernetes.io/managed-by=Helm` và annotation `meta.helm.sh/release-name`/`release-namespace` rồi `helm install`: pod template không đổi nên không rollout (đo: không ReplicaSet mới, 30180 trả 200 suốt). Xoá rồi cài làm mọi Pod mất cùng lúc (shop lỗi tới khi JVM và initContainer xong), Service có thể đổi ClusterIP, HPA mất trạng thái; với StatefulSet còn đụng PVC, nên PostgreSQL để ngoài chart." },
      { q: "`values.yaml`, `-f values-prod.yaml`, `--set` tương ứng gì trong Spring Boot, và cái nào thắng?", a: "`application.yml` mặc định, profile `application-prod.yml`, tham số dòng lệnh. Thứ tự ưu tiên: values của chart < các `-f` (tệp sau đè tệp trước) < `--set`. `helm get values --all` giống `/actuator/configprops`. Khác Spring: Helm nhớ values đã đưa lúc cài, upgrade không kèm values thì dùng lại chúng." },
      { q: "`helm upgrade` đầu tiên sau khi nhận lại báo `conflict with \"kubectl-client-side-apply\" … image`. Vì sao, và sau một lần `--force-conflicts` thì upgrade thường có đủ không?", a: "Helm 4 apply bằng server-side apply; mọi trường do `kubectl apply` tạo thuộc field manager `kubectl-client-side-apply`, đổi chúng là conflict. `--force-conflicts` chỉ chuyển **trường đang xung đột** sang `helm`. Đo: sau khi ép image của order, upgrade thường đổi `APP_GREETING`, `maxReplicas` của HPA hay `requests.cpu` của order đều conflict lại. Nên với release nhận lại: luôn `--force-conflicts` khi upgrade/rollback, hoặc gỡ một lần mục `kubectl-client-side-apply` khỏi `managedFields` của từng object. Helm 3 (client-side 3-way merge) không gặp lỗi này." },
      { q: "Chart catalog không ghi `replicas`. `k diff` báo `replicas: 2 → 1`, vậy sau `helm install` catalog còn mấy replica và vì sao?", a: "2: HPA giữ số replica, và Helm 4 (SSA) không đụng trường nó không quản. `k diff` mô phỏng client-side apply, nơi trường có trong last-applied mà mất khỏi manifest bị xoá về mặc định 1. Ghi `replicas` trong chart thì mỗi upgrade kéo số replica về giá trị chart, giành với HPA." },
      { q: "Trên đề có Helm 3. Lệnh nào của buổi này viết khác?", a: "Hầu như không: `repo add`, `search repo --versions`, `install --version --set -f -n --create-namespace`, `upgrade`, `history`, `template`, `get values` giống nhau. Khác: Helm 3 có `helm list -a` (Helm 4 bỏ; đo: `helm list` trần của Helm 4 đã in cả `failed` và `pending-upgrade`, lọc bằng `--failed`/`--pending`), `--atomic`/`--force` (Helm 4 đổi thành `--rollback-on-failure`/`--force-replace`), và Helm 3 không báo conflict SSA khi upgrade object đã nhận lại." },
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
    uses: ["k-create-ns", "k-helm-template", "vim-macro"],
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

**Vừa RAM.** Base chỉ có catalog ở chế độ H2 (không \`DB_URL\`: không cần PostgreSQL, và Pod ở shop-dev không bị NetworkPolicy default-deny của shop chặn vì NetworkPolicy theo namespace). Limit nhỏ nhất đo được: \`-XX:MaxRAMPercentage=50\`, gọi 50 lần \`/products\` rồi chờ 20 giây; 128Mi, 160Mi, 176Mi luôn \`OOMKilled\`; 192Mi qua một lần (\`memory.peak\` 188Mi), lần sau \`OOMKilled\`; 208Mi qua ba lần (\`memory.peak\` 171–195Mi), 224Mi, 256Mi qua. 208Mi là mức nhỏ nhất qua 3/3, nhưng đỉnh 195Mi chỉ cách giới hạn ~6%, và mỗi lần VM bật lại JVM khởi động giữa cửa sổ tải cao: overlay dev đặt requests = limits = **224Mi** cho có khoảng dư; Pod dùng 171–174Mi lúc rảnh (\`k top\`).`,
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
    stateOut: "~/kustomize/shop/{base,overlays/dev,overlays/prod}; namespace shop-dev chạy catalog (H2) 1 replica tag 1.0, limit 224Mi, từ overlay dev, bằng ConfigMap catalog-config-<hash> sau một lần đổi literal (hai ReplicaSet, hai ConfigMap); overlay prod (shop-prod, 2 replica, tag 2.0) chỉ build; ~/drills/s38/answers.env (HASHED_CM_NAME); shop không đổi.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s38`. `k version --client` (dòng Kustomize Version). Base: `cd ~/kustomize/shop && mkdir -p base overlays/dev overlays/prod`. `base/deployment.yaml` từ `~/shop/pre-helm/catalog.yaml`: bỏ `namespace`, `DB_URL`, `DB_USER`, `DB_PASSWORD`, affinity, preStop (macro vim xoá các khối env lặp lại), thêm `envFrom: [{configMapRef: {name: catalog-config}}]`, `replicas: 1`. `base/service.yaml`: Service catalog cổng http 8080. `base/kustomization.yaml`: `resources` hai tệp, `configMapGenerator` tên `catalog-config` với `JAVA_OPTS=-XX:MaxRAMPercentage=50`, `LOGGING_LEVEL_SHOP=INFO`. `k kustomize base`: ConfigMap tên gì, `envFrom` của Deployment trỏ tên gì?",
      },
      {
        id: "t2",
        text: "Overlay dev: `overlays/dev/kustomization.yaml` có `namespace: shop-dev`, `resources: [../../base]`, `replicas: [{name: catalog, count: 1}]`, `images: [{name: shop/catalog, newTag: \"1.0\"}]`, `patches: [{path: memory.yaml}]`; `memory.yaml` là patch strategic merge đặt requests/limits memory 224Mi cho container `catalog`. `k kustomize overlays/dev | grep -nE '^kind:|namespace:|image:|replicas:|memory:'`. `k create ns shop-dev`, `k apply -k overlays/dev`, `k -n shop-dev rollout status deploy/catalog`, `k -n shop-dev get cm,rs`.",
      },
      {
        id: "t3",
        text: "Đổi literal, thấy rollout. Thêm vào overlay dev `configMapGenerator: [{name: catalog-config, behavior: merge, literals: [LOGGING_LEVEL_SHOP=DEBUG]}]`. `k diff -k overlays/dev` (chỗ nào đổi trong Deployment?), `k apply -k overlays/dev`, `k -n shop-dev rollout status deploy/catalog`, `k -n shop-dev get cm,rs`: ConfigMap cũ còn không, ReplicaSet nào 0? Ghi tên ConfigMap Pod đang dùng: `k -n shop-dev get deploy catalog -o jsonpath='{.spec.template.spec.containers[0].envFrom[0].configMapRef.name}'` vào `~/drills/s38/answers.env` dạng `HASHED_CM_NAME=<tên>`. So với s12: sửa ConfigMap không hash thì Pod có tự đổi không?",
      },
      {
        id: "t4",
        text: "Overlay prod: `namespace: shop-prod`, base, `replicas` 2, `images` tag `\"2.0\"`. **Chỉ build**, không apply: `k kustomize overlays/prod | grep -nE '^kind:|namespace:|image:|replicas:|name: catalog-config'`. Vì sao tên ConfigMap của prod trùng với bản đầu tiên của dev? `diff <(k kustomize overlays/dev) <(k kustomize overlays/prod)`. So độ dài với `helm template shop ~/charts/shop -n shop | wc -l`: chart render bao nhiêu dòng, overlay bao nhiêu?",
      },
      {
        id: "t5",
        text: "Tình huống hỏng: `mkdir -p ~/drills/s38/broken && cp -r overlays/dev ~/drills/s38/broken/dev`, sửa `resources` thành `../../../../kustomize/shop/base` (bốn `..` từ `~/drills/s38/broken/dev` về `~`) và `metadata.name` trong `memory.yaml` thành `catalog-api`. `k kustomize ~/drills/s38/broken/dev`: lỗi nói gì? Thử thêm hai lỗi im lặng: `images: [{name: shop/catalogue, …}]` (build có lỗi không, image ra sao?) và patch đúng tên Deployment nhưng container tên `catalogue` (`k kustomize … | k apply --dry-run=server -f -`).",
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
      "Apply nhầm overlay dev vào shop (đổi `namespace: shop`) phá catalog của shop, đo: `kubectl apply` xoá `DB_URL`, `DB_USER`, `DB_PASSWORD` khỏi Deployment do Helm quản (catalog chạy H2 với dữ liệu mẫu), hạ limit xuống mức của overlay, thêm `envFrom` tới `catalog-config-…`. `helm upgrade shop ~/charts/shop -n shop --force-conflicts` đưa env và resources về, nhưng **không gỡ `envFrom`** (trường đó thuộc field manager `kubectl-client-side-apply`, Helm không quản), và xoá ConfigMap kia thì Pod mới `CreateContainerConfigError`. Gỡ bằng `k -n shop patch deploy catalog --type=json -p '[{\"op\":\"remove\",\"path\":\"/spec/template/spec/containers/0/envFrom\"}]'`.",
      "Patch đúng Deployment nhưng sai tên container (`catalogue`): build **không** lỗi, strategic merge thêm một container thứ hai chỉ có `resources`; apply mới lỗi `The Deployment \"catalog\" is invalid: spec.template.spec.containers[0].image: Required value` (đo). `images` sai tên image thì không lỗi ở đâu cả, image giữ nguyên (đo).",
      "Pod catalog ở shop-dev `OOMKilled` liên tục: limit dưới mức đo (dưới ~208Mi với `MaxRAMPercentage=50`; 192Mi đã OOMKilled 1/2 lần). `k -n shop-dev describe pod` → `Last State: Terminated, Reason: OOMKilled`; lab dùng 224Mi.",
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
            memory: 224Mi
          limits:
            memory: 224Mi
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
# 65:            memory: 224Mi
# 68:            memory: 224Mi
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
# replicaset.apps/catalog-5978d98bcd   0         0         0       23s
# replicaset.apps/catalog-648fcf698c   1         1         1       12s
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
k kustomize ~/drills/s38/broken/dev
# Error: no resource matches strategic merge patch "Deployment.v1.apps/catalog-api.[noNs]": no matches for Id Deployment.v1.apps/catalog-api.[noNs]; failed to find unique target for patch Deployment.v1.apps/catalog-api.[noNs]
\`\`\`

**6. Kiểm**

\`\`\`bash
k -n shop-dev get pod -o wide
# catalog-648fcf698c-qgjht   1/1   Running   0   14s   10.244.95.183   cka-w1
k get --raw "/api/v1/namespaces/shop-dev/pods/catalog-648fcf698c-qgjht:8080/proxy/products" | head -c 80
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây",…
k -n shop-dev top pod
# catalog-648fcf698c-qgjht   11m   174Mi
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
      verifyOutput: "lab: kiểm s38\n  (chờ apiserver, shop và shop-dev, nếu đang khởi động: tối đa ~33 phút)\n  ✓ ~/kustomize/shop/{base,overlays/dev,overlays/prod}; build overlays/dev (namespace shop-dev, ConfigMap có hash) khớp shop-dev\n  ✓ shop-dev: catalog H2 Available, 1 replica, tag 1.0, limit hạ, Pod dùng đúng ConfigMap catalog-config-<hash>, đã rollout do đổi literal; shop như cuối s37, không bị overlay chạm\n  ✓ Build overlays/prod (verify tự build): 2 replica, tag 2.0, namespace riêng khác shop-dev và shop, chưa apply\n  ✓ answers.env: HASHED_CM_NAME là ConfigMap Pod catalog ở shop-dev đang dùng\n  → 4/4 đạt",
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
    title: "CRD và operator: ShopFeature tự viết, cert-manager cài bằng Helm",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-crd"],
    requires: ["s38"],
    status: "published",
    pieces: [],
    goals: [
      "Viết một CRD nhỏ có schema (ShopFeature), tạo custom resource của nó, tra trường bằng kubectl explain và thấy schema chặn resource sai.",
      "Cài operator cert-manager bằng Helm (chart ghim, CRD kèm theo, chạy trên control plane) rồi tạo Issuer và Certificate để nó dựng Secret TLS thay mình.",
      "Liệt kê CRD và custom resource có trong cluster, biết cái nào namespaced, và giải thích vòng reconcile của một operator.",
    ],
    skills: [
      { skill: "k-crd-yaml", level: "Viết được có tra" },
      { skill: "k-api-resources-ns", level: "Gõ được không tra" },
      { skill: "k-explain-cr", level: "Gõ được không tra" },
      { skill: "k-operator-pattern", level: "Giải thích được" },
      { skill: "k-install-operator", level: "Làm được có tra" },
    ],
    uses: ["k-api-resources", "k-helm-install", "k-explain", "k-deploy-rs-pod"],
    foundation: null,
    mindset: `**CRD thêm một loại object vào API, không thêm hành vi.** Sau \`k apply -f ~/shop/shopfeature-crd.yaml\`, apiserver phục vụ đường \`/apis/shop.example.com/v1/namespaces/shop/shopfeatures\`, lưu ShopFeature vào etcd như mọi object khác, và mọi công cụ quen thuộc dùng được ngay: \`k get sf\`, \`k describe\`, \`k explain\`, RBAC theo \`resources: [shopfeatures]\`, \`-o yaml\`. Nhưng không ai đọc chúng: một ShopFeature \`enabled: true\` chẳng bật gì cho tới khi có code đọc nó. CRD gồm năm phần cần nhớ:

| Trường | Ý nghĩa | Ở lab |
|---|---|---|
| \`metadata.name\` | bắt buộc đúng \`<plural>.<group>\` | \`shopfeatures.shop.example.com\` |
| \`spec.group\` | API group (phần trước \`/v1\` trong \`apiVersion\`) | \`shop.example.com\` |
| \`spec.names\` | \`plural\` (đường URL, tên dùng trong RBAC), \`singular\`, \`kind\` (trong YAML), \`shortNames\` | \`shopfeatures\`, \`shopfeature\`, \`ShopFeature\`, \`sf\` |
| \`spec.scope\` | \`Namespaced\` (như Deployment) hay \`Cluster\` (như Node, ClusterIssuer) | \`Namespaced\` |
| \`spec.versions[]\` | mỗi bản \`served\`, đúng một bản \`storage: true\`, kèm \`schema.openAPIV3Schema\` | \`v1\` |

**Schema là hợp đồng, apiserver giữ nó.** \`apiextensions.k8s.io/v1\` bắt buộc schema có cấu trúc. Nó làm ba việc: **kiểm** (\`type: boolean\`, \`minimum: 0\`/\`maximum: 100\`, \`required: [enabled]\`; đo: \`enabled: "yes"\` và \`rolloutPercent: 150\` bị từ chối cùng lúc với hai dòng lý do, thiếu \`enabled\` báo \`spec.enabled: Required value\`), **điền mặc định** (\`default: 0\`; đo: tạo không ghi \`rolloutPercent\` thì đọc lại ra \`{"enabled":true,"rolloutPercent":0}\`), và **gọt** trường lạ (trường không khai trong schema bị bỏ khi lưu; \`kubectl apply\` mặc định \`--validate=strict\` nên báo lỗi luôn: \`strict decoding error: unknown field "spec.colour"\`, đo). \`description\` trong schema chính là thứ \`k explain shopfeature.spec\` in ra. CRD không schema (hay \`x-kubernetes-preserve-unknown-fields: true\` ở \`spec\`) nhận mọi thứ: verify của buổi tạo thử resource sai bằng \`--dry-run=server\` để bắt đúng trường hợp đó (đo: thay schema như vậy thì dòng CRD đỏ).

**Namespaced hay cluster-scoped.** \`k api-resources --namespaced=true\` và \`--namespaced=false\` chia API thành hai nửa (đo trên lab: 61 và 55 loại trước buổi, 67 và 56 sau buổi). Cluster-scoped là thứ không thuộc namespace nào: Node, PersistentVolume, StorageClass, Namespace, ClusterRole, IngressClass, chính CRD, và \`ClusterIssuer\` của cert-manager; \`Issuer\` thì namespaced (chỉ ký cho Certificate cùng namespace). Câu hỏi "cần Role hay ClusterRole để đọc X" bắt đầu từ cột \`NAMESPACED\`.

**Operator = CRD + controller chạy vòng reconcile.** Controller theo dõi (watch) các object của nó, so **mong muốn** (\`spec\`) với **thực tế**, làm cho thực tế khớp, rồi ghi kết quả vào \`status\`. Bạn đã thấy vòng này từ s07: Deployment controller tạo ReplicaSet, ReplicaSet controller tạo Pod (k-deploy-rs-pod). cert-manager làm y hệt với kiểu riêng: \`Certificate\` → \`CertificateRequest\` (mang \`ownerReferences\` trỏ về Certificate) → Issuer ký → \`Secret\` \`shop-local-cm-tls\`, rồi \`status.conditions\` của Certificate thành \`Ready=True\` với \`Certificate is up to date and has not expired\`. Đo vòng reconcile: xoá Secret \`shop-local-cm-tls\` thì 0,4 giây sau nó có lại, chứng chỉ mới (serial khác), Event \`Issuing certificate as Secret does not exist\`. Không ai gõ lệnh nào: controller thấy thực tế lệch mong muốn và sửa.

**Trong Java, bạn đã viết vòng này.**

| Spring Boot | Operator |
|---|---|
| \`@Scheduled(fixedDelay = 30000) void reconcile()\`: đọc trạng thái mong muốn trong DB, đọc trạng thái thật, sửa phần lệch | vòng reconcile của controller |
| hàm phải chạy lại nhiều lần mà không hỏng (idempotent), vì lần trước có thể chết giữa chừng | reconcile "theo mức" (level-triggered): mỗi lần nhìn toàn bộ trạng thái, không dựa vào việc nhớ sự kiện nào đã xử lý |
| poll theo giờ, trễ tới một chu kỳ | watch qua informer: có thay đổi là chạy ngay (0,4 giây ở trên), cộng resync định kỳ phòng lỡ sự kiện |
| \`RestTemplate\` gọi API ngoài | Kubernetes Java client: \`SharedInformerFactory\` (cache + watch), \`ControllerBuilder\`, interface \`Reconciler\` với \`Result reconcile(Request)\` (trả \`new Result(true)\` để chạy lại); hay Java Operator SDK: \`Reconciler<P>\` với \`UpdateControl<P> reconcile(P resource, Context<P> ctx)\` |

Muốn \`ShopFeature\` thật sự bật tính năng, bạn viết đúng một controller như vậy (hay đơn giản hơn: gateway đọc ShopFeature qua API với một ServiceAccount có quyền \`get\`/\`list\`/\`watch\` \`shopfeatures\`). Buổi này dừng ở CRD; cert-manager cho thấy phần controller.

**Cài operator bằng Helm: CRD, quyền và nơi chạy.** Chart \`jetstack/cert-manager\` v1.21.3 (bản mới nhất trên \`charts.jetstack.io\` lúc soạn; trang "Supported Releases" của cert-manager ghi 1.21 hỗ trợ Kubernetes 1.33–1.36, bản cho 1.37 chưa phát hành) cài ba Deployment: \`cert-manager\` (controller), \`cert-manager-webhook\` (admission webhook kiểm và điền mặc định cho Certificate/Issuer), \`cert-manager-cainjector\` (chép CA vào webhook configuration). \`crds.enabled=true\` để chart cài luôn 6 CRD \`*.cert-manager.io\` (thiếu nó thì Issuer/Certificate báo \`no matches for kind\`); CRD mang annotation của release và \`helm.sh/resource-policy: keep\`, nên \`helm uninstall\` không xoá chúng (xoá CRD là xoá mọi Certificate trong cluster). Mỗi thành phần có \`nodeSelector\`/\`tolerations\`/\`resources\` riêng trong values (\`webhook.*\`, \`cainjector.*\`, \`startupapicheck.*\`): đặt cả bốn lên cka-cp, không đụng RAM của worker. Đo: \`free -m\` available của cka-cp 1598 → 1366 MB sau khi cài (ba Pod dùng 22Mi, 22Mi, 8Mi; phần còn lại là image và cache), requests memory của cka-cp 426Mi → 546Mi; cka-w1, cka-w2 không đổi.

**Secret riêng, không thay \`shop-tls\`.** Ingress của s29 dùng \`shop-tls\` (chứng chỉ bạn tự ký bằng openssl). Certificate ghi vào \`shop-local-cm-tls\`. Trỏ \`secretName: shop-tls\` thì cert-manager sẽ ghi đè Secret đang chạy Ingress và từ đó quản nó: verify đòi \`shop-tls\` vẫn đúng tệp \`~/drills/s29/tls.crt\`.`,
    refs: [
      { label: "Bài lộ trình CKA: CRD & Operator — cài CRD, tạo custom resource", href: "#/roadmap/cka/cka-w7-6" },
      { label: "Lộ trình CKA Study Guide: Service Account, kiểm soát tiếp nhận, Operator và CRD", href: "#/roadmap/ckabook/cb-w2-3" },
      { label: "CKA Study Guide, chương 7 — Operator và CRD", href: "#/docs/ckabook-07" },
      { label: "Kubernetes: Up and Running, chương 17 — mở rộng Kubernetes (CRD, controller)", href: "#/docs/kuar-17" },
      { label: "Kubernetes: Up and Running, chương 18 — truy cập Kubernetes từ ngôn ngữ lập trình (client Java, informer)", href: "#/docs/kuar-18" },
      { label: "kubernetes.io: Extend the Kubernetes API with CustomResourceDefinitions", href: "https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/" },
      { label: "kubernetes.io: Operator pattern", href: "https://kubernetes.io/docs/concepts/extend-kubernetes/operator/" },
      { label: "cert-manager.io: Helm installation (crds.enabled)", href: "https://cert-manager.io/docs/installation/helm/" },
      { label: "cert-manager.io: Supported Releases (bản nào cho Kubernetes nào)", href: "https://cert-manager.io/docs/releases/" },
      { label: "cert-manager.io: SelfSigned issuer", href: "https://cert-manager.io/docs/configuration/selfsigned/" },
    ],
    stateIn: "Đầu ra s38: helm v4.3.2, release shop và demo; Ingress shop dùng Secret shop-tls (s29). `./labs/lab begin cka s39` kiểm đầu vào bằng verify của s38, tạo ~/drills/s39, xoá answers.env cũ.",
    stateOut: "CRD shopfeatures.shop.example.com (Namespaced, v1, schema) và hai ShopFeature new-checkout, dark-mode ở shop, manifest trong ~/shop/; release cert-manager (v1.21.3, namespace cert-manager, CRD kèm theo, ba Deployment trên cka-cp); Issuer selfsigned và Certificate shop-local Ready ở shop, Secret shop-local-cm-tls (SAN shop.local); shop-tls của s29 không đổi; ~/drills/s39/answers.env (CERT_MANAGER_CRDS).",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s39`. Bản đồ API trước khi thêm gì: `k api-resources --namespaced=true --no-headers | wc -l`, `k api-resources --namespaced=false --no-headers | wc -l`, `k get crd | wc -l`. Trong `nodes`, `persistentvolumes`, `persistentvolumeclaims`, `storageclasses`, `ingressclasses`, `ingresses`, `clusterroles`, `roles`, cái nào cluster-scoped? Kiểm bằng `k api-resources --namespaced=false | grep -E '^(nodes|persistentvolumes|storageclasses|ingressclasses|clusterroles) '`.",
      },
      {
        id: "t2",
        text: "Viết `~/shop/shopfeature-crd.yaml`: `apiextensions.k8s.io/v1`, tên `shopfeatures.shop.example.com`, group `shop.example.com`, `scope: Namespaced`, names `shopfeatures`/`shopfeature`/`ShopFeature`, shortName `sf`; một bản `v1` `served` + `storage`, schema: `spec` bắt buộc, trong đó `enabled` (boolean, bắt buộc), `rolloutPercent` (integer 0–100, mặc định 0), `owner` (string), mỗi trường có `description`; thêm `additionalPrinterColumns` cho `enabled` và `rolloutPercent`. `k apply -f ~/shop/shopfeature-crd.yaml`, `k wait --for=condition=Established crd/shopfeatures.shop.example.com`, `k api-resources --api-group=shop.example.com`.",
      },
      {
        id: "t3",
        text: "`~/shop/shopfeatures.yaml` có hai ShopFeature ở namespace shop: `new-checkout` (`enabled: true`, `rolloutPercent: 20`, `owner: order`) và `dark-mode` (`enabled: false`, `rolloutPercent: 0`, `owner: gateway`). `k apply -f ~/shop/shopfeatures.yaml`, `k get sf` (cột nào hiện ra, từ đâu?), `k get shopfeatures -A`, `k explain shopfeature.spec`, `k explain shopfeature.spec.rolloutPercent`.",
      },
      {
        id: "t4",
        text: "Tình huống hỏng: `~/drills/s39/bad-feature.yaml` là ShopFeature `bad-feature` với `enabled: \"yes\"` và `rolloutPercent: 150`. `k apply -f ~/drills/s39/bad-feature.yaml`: bao nhiêu lỗi, mỗi lỗi chỉ trường nào? Thử thêm hai biến thể bằng `--dry-run=server`: bỏ hẳn `enabled`; giữ `enabled: true` và thêm `colour: red`. Ai từ chối từng cái: schema trong apiserver hay kubectl? Rồi `k get sf -n shop` vẫn chỉ hai resource.",
      },
      {
        id: "t5",
        text: "Cài operator: `helm repo add jetstack https://charts.jetstack.io`, `helm repo update`, `helm search repo jetstack/cert-manager --versions | head -5`. Dùng bản `v1.21.3`: `helm show values jetstack/cert-manager --version v1.21.3 | grep -nE '^(crds|nodeSelector|tolerations|resources|webhook|cainjector|startupapicheck):'`. Viết `~/drills/s39/cert-manager-values.yaml`: `crds.enabled: true`; controller, `webhook`, `cainjector`, `startupapicheck` cùng nodeSelector + toleration control-plane như demo ở s37; requests nhỏ (controller và cainjector 10m/48Mi, limit 128Mi; webhook 10m/24Mi, limit 64Mi). Ghi `free -m` của cka-cp, rồi `helm install cert-manager jetstack/cert-manager --version v1.21.3 -n cert-manager --create-namespace -f ~/drills/s39/cert-manager-values.yaml --wait`. `k -n cert-manager get deploy,pod -o wide` (node nào?), `free -m` lần nữa, `k top pod -n cert-manager`.",
      },
      {
        id: "t6",
        text: "Đếm CRD operator vừa thêm: `k get crd | grep cert-manager.io`, `k api-resources --api-group=cert-manager.io` (cái nào không namespaced?). Ghi `CERT_MANAGER_CRDS=<số CRD có tên kết thúc bằng .cert-manager.io>` vào `~/drills/s39/answers.env`. `k get crd certificates.cert-manager.io -o jsonpath='{.metadata.annotations}'`: CRD thuộc release nào, có bị xoá khi `helm uninstall` không?",
      },
      {
        id: "t7",
        text: "`~/shop/shop-local-cert.yaml`: Issuer `selfsigned` (`spec.selfSigned: {}`) và Certificate `shop-local` ở shop: `secretName: shop-local-cm-tls`, `commonName` và `dnsNames` `shop.local`, `issuerRef` Issuer `selfsigned`, khoá ECDSA 256. `k apply -f ~/shop/shop-local-cert.yaml`, `k -n shop get issuer,certificate,certificaterequest`, `k -n shop get certificate shop-local -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.message}{\"\\n\"}{end}'`, `k -n shop get certificaterequest -o jsonpath='{.items[0].metadata.ownerReferences[0].kind}'`. Giải chứng chỉ: `k -n shop get secret shop-local-cm-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -subject -issuer -ext subjectAltName -enddate`. So fingerprint của `shop-tls` với `~/drills/s29/tls.crt`: vẫn là một?",
      },
      {
        id: "t8",
        text: "Thấy vòng reconcile: ghi serial hiện tại, `k -n shop delete secret shop-local-cm-tls`, rồi ngay lập tức `k -n shop get secret shop-local-cm-tls` vài lần và `k -n shop describe certificate shop-local | sed -n '/Events/,$p'`. Secret có lại sau bao lâu, serial có đổi không, Event nói gì? Trên Mac: `./labs/lab verify cka s39` phải 5/5.",
      },
    ],
    hints: [
      "`The ShopFeature \"bad-feature\" is invalid: * spec.rolloutPercent: Invalid value: 150: spec.rolloutPercent in body should be less than or equal to 100 * spec.enabled: Invalid value: \"string\": spec.enabled in body must be of type boolean: \"string\"` (đo): apiserver kiểm theo schema và báo mọi trường sai một lượt. Kiểu trong schema là kiểu JSON: `\"yes\"`, `\"true\"` có dấu nháy là string, không phải boolean.",
      "`error: resource mapping not found for name: \"x\" namespace: \"shop\" from \"STDIN\": no matches for kind \"ShopFeatur\" in version \"shop.example.com/v1\"` kèm `ensure CRDs are installed first` (đo, gõ sai kind): kubectl không tìm thấy kind trong discovery. Cùng thông báo khi bạn apply resource trước khi CRD `Established`, hay apply một thư mục chứa cả CRD lẫn resource lần đầu (kubectl đọc discovery một lần cho cả lệnh): apply lại là qua.",
      "`Error from server (BadRequest): … strict decoding error: unknown field \"spec.colour\"` (đo): trường không có trong schema. `kubectl apply` mặc định `--validate=strict`; với `--validate=false` apiserver nhận và lặng lẽ gọt trường đó khi lưu.",
      "`The ShopFeature \"x\" is invalid: spec.enabled: Required value` (đo): `required` nằm ở object cha (`spec.required: [enabled]`), không phải trên trường.",
      "Pod cert-manager `Pending` với Event `didn't match Pod's node affinity/selector` hay `untolerated taint`: thiếu nodeSelector hay toleration ở **một** thành phần. Mỗi thành phần có khoá riêng (`webhook.tolerations`, `cainjector.tolerations`, `startupapicheck.tolerations`); khoá ở gốc chỉ áp cho controller.",
      "`no matches for kind \"Certificate\" in version \"cert-manager.io/v1\"`: chart cài thiếu CRD (quên `crds.enabled=true`). `helm upgrade cert-manager jetstack/cert-manager --version v1.21.3 -n cert-manager --reuse-values --set crds.enabled=true`.",
      "Certificate `Ready=False` lâu: `k -n shop describe certificate shop-local` (Events), `k -n shop get certificaterequest` (cột READY, ISSUER), `k -n cert-manager logs deploy/cert-manager | grep shop-local`. Hay gặp nhất: `issuerRef` trỏ tên Issuer không có, hay `kind: ClusterIssuer` trong khi bạn tạo Issuer.",
    ],
    solution: `Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6, Helm v4.3.2, cert-manager v1.21.3); serial, tên Pod, thời điểm sẽ khác. Context đã ở namespace shop.

**1. Bản đồ API**

\`\`\`bash
k api-resources --namespaced=true --no-headers | wc -l     # 61
k api-resources --namespaced=false --no-headers | wc -l    # 55
\`\`\`

**2. CRD**

\`~/shop/shopfeature-crd.yaml\`:

\`\`\`yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: shopfeatures.shop.example.com      # bắt buộc đúng <plural>.<group>
spec:
  group: shop.example.com
  scope: Namespaced
  names:
    plural: shopfeatures
    singular: shopfeature
    kind: ShopFeature
    shortNames:
    - sf
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        description: Cờ tính năng của shop.
        properties:
          spec:
            type: object
            description: Cấu hình của cờ.
            required:
            - enabled
            properties:
              enabled:
                type: boolean
                description: Bật tính năng hay không.
              rolloutPercent:
                type: integer
                minimum: 0
                maximum: 100
                default: 0
                description: Phần trăm người dùng thấy tính năng (0–100).
              owner:
                type: string
                description: Nhóm phụ trách.
        required:
        - spec
    additionalPrinterColumns:
    - name: Enabled
      type: boolean
      jsonPath: .spec.enabled
    - name: Rollout
      type: integer
      jsonPath: .spec.rolloutPercent
    - name: Age
      type: date
      jsonPath: .metadata.creationTimestamp
\`\`\`

\`\`\`bash
k apply -f ~/shop/shopfeature-crd.yaml
# customresourcedefinition.apiextensions.k8s.io/shopfeatures.shop.example.com created
k wait --for=condition=Established crd/shopfeatures.shop.example.com --timeout=60s
# customresourcedefinition.apiextensions.k8s.io/shopfeatures.shop.example.com condition met
k api-resources --api-group=shop.example.com
# NAME           SHORTNAMES   APIVERSION            NAMESPACED   KIND
# shopfeatures   sf           shop.example.com/v1   true         ShopFeature
\`\`\`

**3. Hai ShopFeature, explain**

\`~/shop/shopfeatures.yaml\`:

\`\`\`yaml
apiVersion: shop.example.com/v1
kind: ShopFeature
metadata:
  name: new-checkout
  namespace: shop
spec:
  enabled: true
  rolloutPercent: 20
  owner: order
---
apiVersion: shop.example.com/v1
kind: ShopFeature
metadata:
  name: dark-mode
  namespace: shop
spec:
  enabled: false
  rolloutPercent: 0
  owner: gateway
\`\`\`

\`\`\`bash
k apply -f ~/shop/shopfeatures.yaml
k get sf
# NAME           ENABLED   ROLLOUT   AGE
# dark-mode      false     0         0s
# new-checkout   true      20        0s
k explain shopfeature.spec
# GROUP:      shop.example.com
# KIND:       ShopFeature
# VERSION:    v1
#
# FIELD: spec <Object>
#
# DESCRIPTION:
#     Cấu hình của cờ.
#
# FIELDS:
#   enabled	<boolean> -required-
#     Bật tính năng hay không.
#
#   owner	<string>
#     Nhóm phụ trách.
#
#   rolloutPercent	<integer>
#     Phần trăm người dùng thấy tính năng (0–100).
\`\`\`

Các cột \`ENABLED\`, \`ROLLOUT\` đến từ \`additionalPrinterColumns\`.

**4. Tình huống hỏng: schema chặn**

\`\`\`bash
k apply -f ~/drills/s39/bad-feature.yaml
# The ShopFeature "bad-feature" is invalid:
# * spec.rolloutPercent: Invalid value: 150: spec.rolloutPercent in body should be less than or equal to 100
# * spec.enabled: Invalid value: "string": spec.enabled in body must be of type boolean: "string"
# (bỏ enabled)
# The ShopFeature "x" is invalid: spec.enabled: Required value
# (thêm colour: red)
# Error from server (BadRequest): error when creating "STDIN": ShopFeature in version "v1" cannot be handled as a ShopFeature: strict decoding error: unknown field "spec.colour"
# (chỉ enabled: true, --dry-run=server -o jsonpath='{.spec}')
# {"enabled":true,"rolloutPercent":0}
\`\`\`

Cả ba lần từ chối đều do apiserver (\`Error from server\`, \`is invalid\`), không phải kubectl: kubectl chỉ gửi kèm yêu cầu kiểm chặt trường lạ. Lần cuối cho thấy \`default: 0\` được điền.

**5. cert-manager bằng Helm**

\`\`\`bash
helm repo add jetstack https://charts.jetstack.io
helm search repo jetstack/cert-manager --versions | head -5
# NAME                 	CHART VERSION	APP VERSION	DESCRIPTION
# jetstack/cert-manager	v1.21.3      	v1.21.3    	A Helm chart for cert-manager
# jetstack/cert-manager	v1.21.2      	v1.21.2    	A Helm chart for cert-manager
# jetstack/cert-manager	v1.21.1      	v1.21.1    	A Helm chart for cert-manager
# jetstack/cert-manager	v1.21.0      	v1.21.0    	A Helm chart for cert-manager
\`\`\`

\`~/drills/s39/cert-manager-values.yaml\`:

\`\`\`yaml
crds:
  enabled: true
nodeSelector:
  node-role.kubernetes.io/control-plane: ""
tolerations:
- key: node-role.kubernetes.io/control-plane
  operator: Exists
  effect: NoSchedule
resources:
  requests: {cpu: 10m, memory: 48Mi}
  limits: {memory: 128Mi}
webhook:
  nodeSelector: {node-role.kubernetes.io/control-plane: ""}
  tolerations: [{key: node-role.kubernetes.io/control-plane, operator: Exists, effect: NoSchedule}]
  resources:
    requests: {cpu: 10m, memory: 24Mi}
    limits: {memory: 64Mi}
cainjector:
  nodeSelector: {node-role.kubernetes.io/control-plane: ""}
  tolerations: [{key: node-role.kubernetes.io/control-plane, operator: Exists, effect: NoSchedule}]
  resources:
    requests: {cpu: 10m, memory: 48Mi}
    limits: {memory: 128Mi}
startupapicheck:
  nodeSelector: {node-role.kubernetes.io/control-plane: ""}
  tolerations: [{key: node-role.kubernetes.io/control-plane, operator: Exists, effect: NoSchedule}]
\`\`\`

\`\`\`bash
free -m | sed -n 2p          # Mem: 2956 1357 78 4 1609 1598
helm install cert-manager jetstack/cert-manager --version v1.21.3 -n cert-manager --create-namespace \\
  -f ~/drills/s39/cert-manager-values.yaml --wait
# NAME: cert-manager … NAMESPACE: cert-manager  STATUS: deployed  REVISION: 1
k -n cert-manager get pod -o wide
# cert-manager-75548d487f-9zrrv             1/1   Running   0   80s   10.244.160.9    cka-cp
# cert-manager-cainjector-8b587f56d-7lqlp   1/1   Running   0   80s   10.244.160.10   cka-cp
# cert-manager-webhook-5bf5c8f6c-59nmt      1/1   Running   0   80s   10.244.160.14   cka-cp
free -m | sed -n 2p          # Mem: 2956 1589 71 5 1389 1366
k top pod -n cert-manager
# cert-manager-75548d487f-9zrrv             10m   22Mi
# cert-manager-cainjector-8b587f56d-7lqlp   3m    22Mi
# cert-manager-webhook-5bf5c8f6c-59nmt      0m    8Mi
\`\`\`

**6. CRD của operator**

\`\`\`bash
k get crd -o name | grep 'cert-manager.io$'
# customresourcedefinition.apiextensions.k8s.io/certificaterequests.cert-manager.io
# customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io
# customresourcedefinition.apiextensions.k8s.io/challenges.acme.cert-manager.io
# customresourcedefinition.apiextensions.k8s.io/clusterissuers.cert-manager.io
# customresourcedefinition.apiextensions.k8s.io/issuers.cert-manager.io
# customresourcedefinition.apiextensions.k8s.io/orders.acme.cert-manager.io
k api-resources --api-group=cert-manager.io
# NAME                  SHORTNAMES   APIVERSION           NAMESPACED   KIND
# certificaterequests   cr,crs       cert-manager.io/v1   true         CertificateRequest
# certificates          cert,certs   cert-manager.io/v1   true         Certificate
# clusterissuers        ciss         cert-manager.io/v1   false        ClusterIssuer
# issuers               iss          cert-manager.io/v1   true         Issuer
echo CERT_MANAGER_CRDS=6 > ~/drills/s39/answers.env
\`\`\`

\`challenges\` và \`orders\` nằm ở group \`acme.cert-manager.io\` (vẫn kết thúc bằng \`.cert-manager.io\`), nên \`--api-group=cert-manager.io\` chỉ thấy bốn.

\`\`\`bash
k get crd certificates.cert-manager.io -o jsonpath='{.metadata.annotations}'
# {"helm.sh/resource-policy":"keep","meta.helm.sh/release-name":"cert-manager","meta.helm.sh/release-namespace":"cert-manager"}
\`\`\`

CRD thuộc release \`cert-manager\` và mang \`helm.sh/resource-policy: keep\`: \`helm uninstall cert-manager\` để CRD (và mọi Certificate) lại. Sau buổi, \`k api-resources --namespaced=true\` ra 67 loại (61 + ShopFeature + 5 của cert-manager), \`--namespaced=false\` ra 56 (thêm ClusterIssuer).

**7. Issuer, Certificate, Secret**

\`~/shop/shop-local-cert.yaml\`:

\`\`\`yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: selfsigned
  namespace: shop
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: shop-local
  namespace: shop
spec:
  secretName: shop-local-cm-tls
  commonName: shop.local
  dnsNames:
  - shop.local
  duration: 2160h       # 90 ngày
  renewBefore: 360h     # gia hạn trước 15 ngày
  privateKey:
    algorithm: ECDSA
    size: 256
  issuerRef:
    name: selfsigned
    kind: Issuer
\`\`\`

\`\`\`bash
k apply -f ~/shop/shop-local-cert.yaml
k get issuer,certificate,certificaterequest
# NAME                                READY   AGE
# issuer.cert-manager.io/selfsigned   True    0s
#
# NAME                                     READY   SECRET              AGE
# certificate.cert-manager.io/shop-local   True    shop-local-cm-tls   0s
#
# NAME                                              APPROVED   DENIED   READY   ISSUER       REQUESTER                                         AGE
# certificaterequest.cert-manager.io/shop-local-1   True                True    selfsigned   system:serviceaccount:cert-manager:cert-manager   0s
k get certificate shop-local -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.message}{"\\n"}{end}'
# Ready=True Certificate is up to date and has not expired
k get secret shop-local-cm-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -subject -issuer -ext subjectAltName -enddate
# subject=CN = shop.local
# issuer=CN = shop.local
# X509v3 Subject Alternative Name:
#     DNS:shop.local
# notAfter=Feb 17 16:32:57 2027 GMT
k get secret shop-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -fingerprint -sha256
openssl x509 -in ~/drills/s29/tls.crt -noout -fingerprint -sha256
# sha256 Fingerprint=F6:4E:43:62:…:29:BF:D2:50      (cả hai dòng giống nhau: shop-tls không đổi)
\`\`\`

\`issuer\` bằng \`subject\`: chứng chỉ tự ký. CertificateRequest mang \`ownerReferences\` trỏ về Certificate \`shop-local\` (\`controller: true\`), như ReplicaSet trỏ về Deployment; Secret thì không có \`ownerReferences\` (mặc định của cert-manager), nên xoá Certificate không kéo Secret theo.

**8. Vòng reconcile**

\`\`\`bash
k get secret shop-local-cm-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -serial
# serial=1F151B2DD4F1A9EBE58E3714FB10CF344871D059
k delete secret shop-local-cm-tls
# secret "shop-local-cm-tls" deleted from shop namespace
# (vòng until … get secret … ; đo: có lại sau 0,41 giây)
k get secret shop-local-cm-tls -o jsonpath='{.data.tls\\.crt}' | base64 -d | openssl x509 -noout -serial
# serial=1484C9A94B5FF11EB23A4D9C79B95923FDE68F99
k describe certificate shop-local | sed -n '/Events/,$p' | grep -E 'Issuing|Requested' | tail -2
#   Normal  Requested  …  cert-manager-certificates-request-manager  Created new CertificateRequest resource "shop-local-5"
#   Normal  Issuing    …  cert-manager-certificates-issuing          The certificate has been successfully issued
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s39/apply.sh\` (tệp chuẩn ở \`files/\`; \`files/solve.sh\` chạy lại được: \`kubectl apply\`, \`helm upgrade --install\`).`,
    exam: {
      patterns: [
        "\"Tạo CRD từ tệp/URL cho trước rồi tạo một custom resource\" — `k apply -f <crd>`, `k get crd | grep <group>`, `k explain <kind>.spec` để biết trường, rồi viết resource đúng `apiVersion: <group>/<version>`.",
        "\"Liệt kê mọi resource không thuộc namespace / mọi CRD của operator X\" — `k api-resources --namespaced=false`, `k get crd | grep <group>`, `k api-resources --api-group=<group>`.",
        "\"Cài operator bằng Helm/manifest rồi tạo resource để nó dựng thứ Y\" — đọc values trước (`helm show values`), nhớ CRD (`crds.enabled`/`installCRDs`), đợi Deployment Available rồi mới tạo resource.",
        "\"Custom resource không Ready, tìm lý do\" — `k describe <kind> <tên>` (Events, `status.conditions`), object con (CertificateRequest), log controller.",
      ],
      timeTargetMin: 6,
      drills: [
        {
          text: "Trong 4 phút: tạo CRD `backups.ops.example.com` (cluster-scoped, kind `Backup`, v1, schema chỉ cần `spec.schedule` kiểu string, bắt buộc), tạo một Backup `nightly` với `schedule: \"0 2 * * *\"`, chứng minh nó cluster-scoped bằng một lệnh; rồi xoá CRD.",
          timeLimitMin: 4,
          solution: "```yaml\napiVersion: apiextensions.k8s.io/v1\nkind: CustomResourceDefinition\nmetadata:\n  name: backups.ops.example.com\nspec:\n  group: ops.example.com\n  scope: Cluster\n  names: {plural: backups, singular: backup, kind: Backup}\n  versions:\n  - name: v1\n    served: true\n    storage: true\n    schema:\n      openAPIV3Schema:\n        type: object\n        properties:\n          spec:\n            type: object\n            required: [schedule]\n            properties:\n              schedule: {type: string}\n```\n```bash\nk apply -f backup-crd.yaml && k wait --for=condition=Established crd/backups.ops.example.com\nprintf 'apiVersion: ops.example.com/v1\\nkind: Backup\\nmetadata: {name: nightly}\\nspec: {schedule: \"0 2 * * *\"}\\n' | k apply -f -\nk api-resources --api-group=ops.example.com      # NAMESPACED false\nk delete crd backups.ops.example.com             # xoá luôn mọi Backup\n```",
        },
        {
          text: "Trong 2 phút: Certificate `web` ở namespace `drill` báo `READY False`. Ba lệnh đầu tiên bạn gõ là gì, theo thứ tự?",
          timeLimitMin: 2,
          solution: "```bash\nk -n drill describe certificate web | sed -n '/Status/,$p'   # conditions + Events\nk -n drill get certificaterequest                            # object con: READY, ISSUER\nk -n drill get issuer; k get clusterissuer                   # issuerRef trỏ đúng tên, đúng kind?\n```\nRồi mới tới `k -n cert-manager logs deploy/cert-manager | grep web`.",
        },
      ],
    },
    tips: [
      "`k explain <kind>.spec --recursive | head -40` in cả cây trường của một custom resource: nhanh hơn tìm tài liệu của operator trên đề.",
      "Tên CRD luôn là `<plural>.<group>`; `apiVersion` của resource là `<group>/<version>`; `kind` viết hoa. Ba chỗ này nhầm là lỗi hay gặp nhất khi viết CRD tay.",
      "Xoá CRD là xoá mọi custom resource của nó trong cả cluster. Trước khi `k delete crd`, `k get <plural> -A`.",
      "Operator cài bằng Helm: đọc `helm show values` tìm `crds`/`installCRDs`, `nodeSelector`, `tolerations` của **từng** thành phần.",
    ],
    outcome: {
      md: `shop có một loại object riêng (ShopFeature) mà apiserver tự kiểm theo schema, và một operator thật dựng chứng chỉ TLS cho \`shop.local\` thay bạn, đặt trên control plane. Trên Mac:

\`\`\`bash
./labs/lab verify cka s39
\`\`\`

Verify đọc CRD \`shopfeatures.shop.example.com\`: group \`shop.example.com\`, names \`ShopFeature\`/\`shopfeatures\`/\`shopfeature\`, \`Namespaced\`, bản \`v1\` served + storage có schema cho \`spec\`, \`Established\`; rồi **tạo thử** bằng \`k create --dry-run=server\` (không lưu gì) ba resource sai (\`rolloutPercent: 150\`, \`enabled: "yes"\`, thiếu \`enabled\`) phải bị từ chối và một resource đúng phải được nhận (schema bỏ ràng buộc: đỏ, đo); \`k explain shopfeature.spec\` có \`enabled\`, \`rolloutPercent\`, \`api-resources --namespaced=true\` có \`shopfeatures\`. Đúng hai ShopFeature ở shop (\`new-checkout\` bật 20%, \`dark-mode\` tắt 0%), CRD và hai resource có trong \`~/shop/*.yaml\`. Release \`cert-manager\` ở namespace \`cert-manager\`, \`cert-manager-v1.21.3\`, \`deployed\`, CRD \`certificates.cert-manager.io\` do chính release cài, ba Deployment Available, mọi Pod trên cka-cp. Issuer \`selfsigned\` loại \`selfSigned\` Ready; Certificate \`shop-local\` \`Ready=True\`, \`secretName: shop-local-cm-tls\` (tên khác: đỏ, đo), \`dnsNames\` có \`shop.local\`, \`issuerRef\` Issuer/selfsigned; Secret \`shop-local-cm-tls\` loại \`kubernetes.io/tls\`, mang annotation \`cert-manager.io/certificate-name: shop-local\`, SAN \`DNS:shop.local\`, khoá khớp chứng chỉ; \`shop-tls\` vẫn đúng \`~/drills/s29/tls.crt\`, không mang annotation cert-manager, Ingress shop vẫn dùng nó. \`CERT_MANAGER_CRDS\` bằng số CRD \`*.cert-manager.io\` đếm lúc verify.`,
      verifyOutput: "lab: kiểm s39\n  (chờ apiserver, shop và cert-manager, nếu đang khởi động: tối đa ~17 phút)\n  ✓ CRD shopfeatures.shop.example.com: Namespaced, v1 served/storage có schema, Established; schema từ chối rolloutPercent 150, enabled \"yes\", thiếu enabled; explain và api-resources thấy nó\n  ✓ Đúng hai ShopFeature ở shop: new-checkout (enabled, 20%), dark-mode (tắt, 0%); CRD và hai resource có trong ~/shop/\n  ✓ Release cert-manager (namespace cert-manager, cert-manager-v1.21.3, deployed, CRD do release cài); ba Deployment Available, Pod trên cka-cp\n  ✓ Issuer selfsigned Ready; Certificate shop-local Ready=True → Secret shop-local-cm-tls (kubernetes.io/tls, SAN DNS:shop.local, khoá khớp); shop-tls của s29 không đổi, Ingress vẫn dùng nó\n  ✓ answers.env: CERT_MANAGER_CRDS bằng số CRD *.cert-manager.io trong cluster\n  → 5/5 đạt",
      projectDelta: "shop có CRD ShopFeature (cờ tính năng, hai resource) và cert-manager chạy trên control plane, cấp chứng chỉ tự ký shop-local-cm-tls cho shop.local. Ingress vẫn dùng shop-tls của s29; đổi sang chứng chỉ do cert-manager quản là một dòng secretName khi cần.",
    },
    review: [
      { q: "CRD và operator khác nhau ở đâu? Sau khi tạo CRD ShopFeature, ai làm gì với một ShopFeature `enabled: true`?", a: "CRD chỉ thêm một loại object vào API: apiserver lưu, kiểm theo schema, phục vụ get/list/watch, RBAC áp được. Không có hành vi nào. Operator là CRD cộng controller chạy vòng reconcile đọc object đó và làm cho thế giới khớp. Với ShopFeature hiện chưa ai đọc, nên `enabled: true` không bật gì; cert-manager thì có controller, nên Certificate biến thành Secret." },
      { q: "Vòng reconcile giống và khác một method `@Scheduled` trong Spring ở đâu?", a: "Giống: đọc trạng thái mong muốn, đọc trạng thái thật, sửa phần lệch, chạy lại nhiều lần không hỏng (idempotent). Khác: controller được kích bởi watch qua informer (đo: Secret bị xoá có lại sau 0,4 giây), cộng resync định kỳ; `@Scheduled` poll theo chu kỳ. Trong Java viết bằng Kubernetes Java client (`SharedInformerFactory`, `Reconciler.reconcile(Request)` trả `Result`) hay Java Operator SDK (`Reconciler<P>.reconcile` trả `UpdateControl`)." },
      { q: "Schema của CRD làm những gì? Cho ví dụ đo được trên lab.", a: "Kiểm kiểu và giới hạn (`rolloutPercent: 150` → `should be less than or equal to 100`, `enabled: \"yes\"` → `must be of type boolean`), bắt trường bắt buộc (`spec.enabled: Required value`), điền mặc định (`rolloutPercent: 0`), gọt trường lạ (`kubectl apply` strict báo `unknown field \"spec.colour\"`). Nó cũng là nguồn của `k explain`." },
      { q: "Vì sao cài cert-manager phải bật `crds.enabled=true`, và `helm uninstall cert-manager` có xoá CRD không?", a: "Không có CRD thì Issuer/Certificate là kind lạ (`no matches for kind`). Với `crds.enabled=true` chart cài 6 CRD `*.cert-manager.io` trong release, kèm `helm.sh/resource-policy: keep`, nên uninstall giữ CRD lại: xoá CRD là xoá mọi Certificate trong cluster." },
      { q: "Issuer và ClusterIssuer khác nhau thế nào, và vì sao lab không cho Certificate ghi vào `shop-tls`?", a: "Issuer namespaced, chỉ ký cho Certificate cùng namespace; ClusterIssuer cluster-scoped, dùng từ mọi namespace (`k api-resources --api-group=cert-manager.io`: NAMESPACED false). `secretName: shop-tls` sẽ ghi đè chứng chỉ Ingress đang dùng và từ đó cert-manager quản nó; lab giữ hai Secret riêng để đổi có chủ đích." },
    ],
  },
// ───────────────────────────── s40 ─────────────────────────────
  {
    id: "s40",
    stage: "st7",
    title: "Sự cố chặng 7: release hỏng",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-logs"],
    requires: ["s39"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa release shop từ failed về deployed trong 20 phút bằng history, values và log của Pod mới.",
      "Rollback release về revision chạy được gần nhất và chỉ ra values nào gây lỗi.",
      "Gỡ release kẹt pending-upgrade và pending-install một cách an toàn, theo đúng hành vi Helm đo được.",
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
    foundation: null,
    mindset: `**Release là một chuỗi Secret, mỗi Secret một trạng thái.** Mỗi lần \`install\`/\`upgrade\`/\`rollback\` Helm ghi một Secret \`sh.helm.release.v1.<tên>.v<revision>\` (type \`helm.sh/release.v1\`) trong namespace của release. Trạng thái của revision kể chuyện đã xảy ra:

| Trạng thái | Nghĩa | Đo trên lab (Helm v4.3.2) |
|---|---|---|
| \`deployed\` | revision đang có hiệu lực | upgrade lỗi hay bị ngắt thì revision trước **vẫn \`deployed\`**; nó thành \`superseded\` khi có revision \`deployed\` mới |
| \`superseded\` | từng deployed, đã bị thay | |
| \`failed\` | upgrade chạy xong mà lỗi (\`--wait\` hết giờ, conflict, manifest sai) | upgrade tiếp được ngay; cluster đã nhận manifest mới |
| \`pending-upgrade\` / \`pending-install\` / \`pending-rollback\` | Helm đã ghi "đang làm" rồi chết giữa chừng (kill, mất mạng, Ctrl-C lúc \`--wait\`) | mọi \`upgrade\` bị từ chối: \`another operation (install/upgrade/rollback) is in progress\` |

\`helm list\` chỉ in revision **mới nhất** của mỗi release, nên release \`failed\` hiện \`failed\` dù revision trước vẫn \`deployed\`. Trên Helm 4 \`helm list\` trần đã gồm \`failed\` và \`pending-*\` (\`--failed\`, \`--pending\` để lọc); đề thi dùng Helm 3, nơi \`helm list\` trần không in \`pending-*\` và \`helm list -a\` mới in mọi trạng thái (Helm 4 bỏ \`-a\`: \`unknown shorthand flag: 'a' in -a\`, đo).

**Ba cách gỡ, đo cái giá của từng cách.**

| Tình trạng | Cách | Đo |
|---|---|---|
| \`failed\` | \`helm rollback <tên> <revision tốt>\` | tạo revision mới \`Rollback to N\`, values và manifest của N; Pod lỗi biến mất (rollback shop 6 giây với \`--wait\`) |
| \`failed\` | sửa values rồi \`helm upgrade\` (roll forward) | cũng đúng, nếu values sau khi sửa bằng revision tốt; verify chấm trạng thái, không chấm cách |
| \`pending-upgrade\` | \`helm rollback <tên> <revision tốt>\` | **được** trên Helm 4.3.2 (13 giây, chờ Pod mới Ready); revision kẹt ở lại history với chữ \`pending-upgrade\` mãi, vô hại |
| \`pending-upgrade\` | xoá Secret của revision kẹt (\`k delete secret sh.helm.release.v1.demo.v<N>\`) | release về revision trước, \`deployed\`, **nhưng cluster vẫn mang manifest xấu** (đo: Deployment vẫn image \`6.99.0\`, Pod \`ErrImagePull\`) tới lần \`helm upgrade\` sau; đường tắt nguy hiểm |
| \`pending-install\` | \`helm uninstall <tên>\` | không có gì để quay về (\`helm rollback\` báo \`release has no 0 version\`, \`helm install\` lại báo \`cannot reuse a name that is still in use\`); uninstall gỡ cả Deployment lẫn Secret release |

**Quy trình chẩn đoán release (20 phút).** 1. \`helm list -A\` (cái gì hỏng, trạng thái gì). 2. \`helm status <tên>\` (DESCRIPTION nói lý do: \`resource Deployment/shop/catalog not ready … context deadline exceeded\`). 3. \`helm history <tên>\` (revision nào lỗi, revision tốt gần nhất là số mấy). 4. \`helm get values <tên> --revision <lỗi>\` so với \`--revision <tốt>\`: khác ở khoá nào. 5. Pod mới: \`k get pod\` (cái nào \`CrashLoopBackOff\`), \`k logs <pod> --previous\` (vì sao nó chết), \`k get events --sort-by=.lastTimestamp\`. 6. Sửa (rollback hay roll forward), rồi kiểm lại bằng \`helm history\`, \`k rollout status\`. Không nhảy thẳng tới bước 6: rollback mà không biết khoá nào hỏng thì lần upgrade sau lại hỏng y như vậy.

**RollingUpdate giữ shop sống, nếu chart cho phép.** Gateway có \`maxUnavailable: 0\`, \`maxSurge: 1\`; catalog (2 replica) và order (1 replica) để mặc định 25%, làm tròn xuống thành 0 Pod được thiếu. Nên khi Pod mới không lên (\`MaxRAMPercentage=150\`: JVM từ chối khởi động), Deployment dừng ở một Pod mới hỏng cạnh các Pod cũ vẫn chạy: đo trong lần upgrade lỗi, gateway luôn 2/2 Ready và \`curl\` tới 30180 trả 200 ở cả 81 lần lấy mẫu. podinfo của \`demo\` thì \`maxUnavailable: 1\` với 1 replica: Pod cũ bị xoá ngay, \`demo\` không còn Pod Ready nào suốt lúc kẹt (đo). Đọc \`strategy\` của chart trước khi tin rằng "upgrade lỗi không sao".

**\`--wait\` và \`--rollback-on-failure\`.** \`helm upgrade --wait --timeout 60s\` chờ mọi tài nguyên Ready rồi mới ghi \`deployed\`; hết giờ thì ghi \`failed\` nhưng **không** trả cluster về (Pod lỗi vẫn đó). \`--rollback-on-failure\` (Helm 3: \`--atomic\`) tự rollback khi lỗi: tiện cho CI, nhưng xoá luôn bằng chứng bạn cần để chẩn đoán. Với release \`shop\` (nhận lại từ \`kubectl apply\` ở s37), mọi \`upgrade\`/\`rollback\` kèm \`--force-conflicts\`: ở sự cố này rollback thường cũng qua (đo, vì lần upgrade lỗi đã ép trường \`JAVA_OPTS\` sang Helm), nhưng giữ thói quen.

**Repo là cache trên máy bạn.** \`helm repo add\` chỉ ghi URL; \`helm repo update\` tải \`index.yaml\` về \`~/.cache/helm/repository/<repo>-index.yaml\`. Mất tệp đó thì \`helm search repo\` cảnh báo \`repo is corrupt or missing\` và không thấy gì, \`helm upgrade … podinfo/podinfo\` và \`helm show values\` báo \`no cached repo found. (try 'helm repo update')\` (đo). \`helm rollback\` không cần repo: chart của revision cũ nằm sẵn trong Secret.`,
    refs: [
      { label: "Bài lộ trình CKA: Helm & Kustomize trong curriculum CKA", href: "#/roadmap/cka/cka-w7-5" },
      { label: "Lộ trình CKA Study Guide: Helm và Kustomize — khác nhau ở đâu và gõ lệnh nào", href: "#/roadmap/ckabook/cb-w2-4" },
      { label: "CKA Study Guide, chương 8 — Helm và Kustomize", href: "#/docs/ckabook-08" },
      { label: "helm.sh: helm rollback", href: "https://helm.sh/docs/helm/helm_rollback/" },
      { label: "helm.sh: helm history", href: "https://helm.sh/docs/helm/helm_history/" },
      { label: "helm.sh: helm list (--failed, --pending)", href: "https://helm.sh/docs/helm/helm_list/" },
      { label: "helm.sh: Helm 4 Overview (--rollback-on-failure thay --atomic)", href: "https://helm.sh/docs/overview" },
      { label: "kubernetes.io: Deployment — rolling update, maxUnavailable, maxSurge", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment" },
    ],
    stateIn: "Đầu ra s39. Trên Mac chạy `./labs/lab begin cka s40`: kiểm đầu vào bằng check.sh riêng (CRD, cert-manager, Certificate của s39: sự cố không đụng chúng), xoá answers.env cũ rồi **gây sự cố** (~1,5 phút): \"một đồng nghiệp upgrade hai release rồi bỏ dở\". Bấm giờ 20 phút.",
    stateOut: "Release shop deployed, values bằng revision tốt trước sự cố (như cuối s37: order 2.0, javaOpts mặc định), bốn Deployment Available, không Pod lỗi; release demo deployed với values và image như cuối s37; release demo-canary đã gỡ; repo podinfo đọc được; ~/drills/s40/answers.env (BAD_VALUE).",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s40` (mất ~1,5 phút). Bấm giờ 20 phút. Trên cka-cp: `helm list -A`, `helm list -A --failed`, `helm list -A --pending`. Có mấy release không `deployed`, mỗi cái trạng thái gì? (Đề dùng Helm 3: ở đó lệnh gom mọi trạng thái là `helm list -A -a`.)",
      },
      {
        id: "t2",
        text: "shop: `helm status shop -n shop` (đọc DESCRIPTION), `helm history shop -n shop`. Revision nào `failed`, revision tốt gần nhất trước nó là số mấy (đang `deployed` hay `superseded`)? `helm get values shop -n shop --revision <lỗi>` và `--revision <tốt>`: khác ở khoá nào? Thêm `-a` để thấy giá trị cuối cùng.",
      },
      {
        id: "t3",
        text: "Pod mới: `k -n shop get pod -l 'app in (gateway,gateway-v1,catalog,order)'` (Pod nào mới, trạng thái gì, Pod cũ còn không?), `k -n shop logs <pod mới của gateway> --previous`, `k -n shop get events --sort-by=.lastTimestamp | tail`, `k -n shop rollout history deploy/gateway`. Vì sao shop vẫn trả lời (`curl -s -o /dev/null -w '%{http_code}' http://<IP cka-w1>:30180/api/products`)? Đọc `k -n shop get deploy gateway -o jsonpath='{.spec.strategy}'`. Ghi `BAD_VALUE=<khoá values gây lỗi>` vào `~/drills/s40/answers.env`.",
      },
      {
        id: "t4",
        text: "Sửa shop: `helm rollback shop <revision tốt> -n shop --force-conflicts --wait`. `helm history shop -n shop --max 3`, `k -n shop get deploy`, `k -n shop get pod`: Pod lỗi còn không, ReplicaSet nào đang chạy?",
      },
      {
        id: "t5",
        text: "demo: `helm status demo -n demo`, `helm history demo -n demo`, `k -n demo get deploy,pod`. Thử `helm upgrade demo podinfo/podinfo --version 6.16.0 -n demo --reuse-values`: lỗi gì (có hai lỗi chồng nhau, đọc cái đầu)? `ls ~/.cache/helm/repository/`, `helm search repo podinfo`: thiếu gì? `helm repo update`. Gỡ `pending-upgrade`: `helm rollback demo <revision tốt> -n demo --wait`. `helm history demo -n demo --max 3`: revision kẹt còn đó với trạng thái gì?",
      },
      {
        id: "t6",
        text: "`demo-canary` kẹt `pending-install`: thử `helm rollback demo-canary -n demo` và `helm install demo-canary podinfo/podinfo -n demo` (đọc hai lỗi), rồi `helm uninstall demo-canary -n demo`. `k -n demo get deploy,pod,secret`: còn gì của nó không?",
      },
      {
        id: "t7",
        text: "Kiểm lại toàn cảnh: `helm list -A` (mọi release `deployed`), `helm get values shop -n shop` (USER-SUPPLIED VALUES như revision tốt), `k -n shop get pod`, `k -n demo get pod`. Trên Mac: `./labs/lab verify cka s40` phải 5/5. Ghi thời gian bạn đã dùng.",
      },
    ],
    hints: [
      "`Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress` (đo, demo `pending-upgrade`): một lần helm trước chết giữa chừng. Đừng thử lại upgrade; `helm history` tìm revision `deployed`/`superseded` mới nhất trước revision kẹt, `helm rollback` về đó.",
      "`Error: no cached repo found. (try 'helm repo update'): open /home/ubuntu/.cache/helm/repository/podinfo-index.yaml: no such file or directory` (đo): index của repo trên máy đã mất. `helm repo update` (hay `helm repo update podinfo`). Rollback không cần repo.",
      "`helm status shop` báo `Upgrade \"shop\" failed: resource Deployment/shop/catalog not ready. status: InProgress, message: Updated: 1/2 …` và `context deadline exceeded` (đo): `--wait` hết giờ vì Pod mới không Ready, không phải lỗi của Helm. Lý do nằm trong log của Pod mới.",
      "`double MaxRAMPercentage=150.000000 is outside the allowed range [ 0.000000 ... 100.000000 ]`, `Improperly specified VM option 'MaxRAMPercentage=150'`, `Error: Could not create the Java Virtual Machine.` (đo, `k logs --previous` của Pod gateway mới): JVM không khởi động. Giá trị đến từ biến `JAVA_OPTS`; tìm khoá values sinh ra nó trong `helm get values shop --revision <lỗi>`.",
      "`Error: release has no 0 version` (đo, `helm rollback demo-canary`): release chỉ có revision 1 `pending-install`, không có gì để quay về. `cannot reuse a name that is still in use` khi install lại. Gỡ bằng `helm uninstall`.",
      "`helm list -a` báo `unknown shorthand flag: 'a' in -a`: Helm 4 bỏ cờ này; `helm list` trần đã in `failed` và `pending-*` (đo). Trên đề (Helm 3) thì `helm list -a`.",
      "Rollback xong mà verify vẫn đỏ dòng values: bạn rollback về một revision khác revision tốt (ví dụ một revision `failed`), hay roll forward bằng values tự gõ lại không đúng như cũ. So `helm get values shop -n shop -a` với `--revision <tốt> -a`.",
    ],
    solution: `Quy trình dưới đây là cách tìm ra lỗi, không chỉ lệnh sửa. Output là của máy soạn bài (2026-11-19, Kubernetes 1.36.6, Helm v4.3.2); số revision, tên Pod, thời điểm của bạn sẽ khác (history của bạn có thể có thêm revision \`failed\` từ s37).

**1. Toàn cảnh**

\`\`\`bash
helm list -A
# NAME        	NAMESPACE   	REVISION	UPDATED                	STATUS         	CHART               	APP VERSION
# cert-manager	cert-manager	3       	2026-11-19 23:34:03 …  	deployed       	cert-manager-v1.21.3	v1.21.3
# demo        	demo        	12      	2026-11-19 23:47:06 …  	pending-upgrade	podinfo-6.16.0      	6.16.0
# demo-canary 	demo        	1       	2026-11-19 23:47:10 …  	pending-install	podinfo-6.16.0      	6.16.0
# shop        	shop        	10      	2026-11-19 23:47:15 …  	failed         	shop-0.1.0          	1.0
helm list -A --failed       # chỉ shop
helm list -A --pending      # demo, demo-canary
\`\`\`

Ba release hỏng, ba trạng thái khác nhau, ba cách gỡ khác nhau.

**2. shop: status, history, values**

\`\`\`bash
helm status shop -n shop | sed -n '1,7p'
# NAME: shop
# LAST DEPLOYED: Thu Nov 19 23:47:15 2026
# NAMESPACE: shop
# STATUS: failed
# REVISION: 10
# DESCRIPTION: Upgrade "shop" failed: resource Deployment/shop/catalog not ready. status: InProgress, message: Updated: 1/2
# resource Deployment/shop/gateway not ready. status: InProgress, message: Updated: 1/2
helm history shop -n shop --max 4
# REVISION	UPDATED                 	STATUS  	CHART     	APP VERSION	DESCRIPTION
# 7       	Thu Nov 19 23:39:37 2026	deployed	shop-0.1.0	1.0        	Rollback to 5
# 8       	Thu Nov 19 23:43:21 2026	failed  	shop-0.1.0	1.0        	Upgrade "shop" failed: resource Deployment/shop/catalog not ready. …
# 9       	Thu Nov 19 23:45:30 2026	failed  	shop-0.1.0	1.0        	Upgrade "shop" failed: …
# 10      	Thu Nov 19 23:47:15 2026	failed  	shop-0.1.0	1.0        	Upgrade "shop" failed: …
helm get values shop -n shop --revision 10
# USER-SUPPLIED VALUES:
# javaOpts: -XX:MaxRAMPercentage=150
helm get values shop -n shop --revision 7
# USER-SUPPLIED VALUES:
# null
\`\`\`

Máy soạn bài đã \`begin\` ba lần nên có ba revision \`failed\` (8, 9, 10: \`begin\` chạy lại gây lại đúng lỗi đó). Revision tốt là revision không \`failed\` mới nhất trước chúng: 7, vẫn \`deployed\` (upgrade lỗi không chuyển nó thành \`superseded\`). Revision lỗi ghi đè đúng một khoá: \`javaOpts\`.

**3. Pod mới và log**

\`\`\`bash
k get pod -l 'app in (gateway,gateway-v1,catalog,order)'
# catalog-66f5cf64fb-qfndg     0/1   CrashLoopBackOff   5 (2m2s ago)   4m57s
# catalog-7f7ff485b9-n25bc     1/1   Running            9 (22m ago)    23h
# catalog-7f7ff485b9-nmxhc     1/1   Running            5 (22m ago)    23h
# gateway-6bb658ccc4-42v7b     1/1   Running            5 (23m ago)    23h
# gateway-6bb658ccc4-jth2f     1/1   Running            5 (23m ago)    23h
# gateway-d4d8bc6bf-9g8sz      0/1   CrashLoopBackOff   5 (2m4s ago)   4m57s
# gateway-v1-5f4bd8dc8-wgt78   0/1   CrashLoopBackOff   5 (109s ago)   4m57s
# gateway-v1-d58549bff-sffff   1/1   Running            5 (22m ago)    23h
# order-68975fd87c-xkwdj       0/1   CrashLoopBackOff   5 (105s ago)   4m56s
# order-86498bc69d-b4spl       1/1   Running            2 (22m ago)    44m
k logs gateway-d4d8bc6bf-9g8sz --previous
# double MaxRAMPercentage=150.000000 is outside the allowed range [ 0.000000 ... 100.000000 ]
# Improperly specified VM option 'MaxRAMPercentage=150'
# Error: Could not create the Java Virtual Machine.
# Error: A fatal exception has occurred. Program will exit.
k get events --sort-by=.lastTimestamp | grep BackOff | tail -2
# 16s   Warning   BackOff   pod/gateway-v1-5f4bd8dc8-wgt78   Back-off restarting failed container gateway in pod …
# 4s    Warning   BackOff   pod/order-68975fd87c-xkwdj       Back-off restarting failed container order in pod …
k get deploy gateway -o jsonpath='{.spec.strategy}'
# {"rollingUpdate":{"maxSurge":1,"maxUnavailable":0},"type":"RollingUpdate"}
echo BAD_VALUE=javaOpts > ~/drills/s40/answers.env
\`\`\`

Bốn Deployment mỗi cái có đúng một Pod mới chết, Pod cũ ở lại: \`javaOpts\` đi vào \`JAVA_OPTS\` của cả bốn, nên cả bốn cùng rollout, và không cái nào được phép thiếu Pod.

**4. Rollback shop**

\`\`\`bash
helm rollback shop 7 -n shop --force-conflicts --wait
# Rollback was a success! Happy Helming!
helm history shop -n shop --max 3
# 9       	…	failed  	shop-0.1.0	1.0	Upgrade "shop" failed: …
# 10      	…	failed  	shop-0.1.0	1.0	Upgrade "shop" failed: …
# 11      	…	deployed	shop-0.1.0	1.0	Rollback to 7
k get deploy gateway gateway-v1 catalog order
# gateway      2/2   2   2   4d21h
# gateway-v1   1/1   1   1   23h
# catalog      2/2   2   2   4d21h
# order        1/1   1   1   4d21h
\`\`\`

Rollback áp lại manifest của revision 7: pod template về như cũ, Deployment trở về ReplicaSet cũ (không tạo Pod mới), ReplicaSet lỗi về 0.

**5. demo: pending-upgrade và repo**

\`\`\`bash
helm history demo -n demo --max 3
# 10      	…	pending-upgrade	podinfo-6.16.0	6.16.0	Preparing upgrade
# 11      	…	deployed       	podinfo-6.16.0	6.16.0	Rollback to 9
# 12      	…	pending-upgrade	podinfo-6.16.0	6.16.0	Preparing upgrade
k -n demo get pod
# demo-canary-podinfo-85f6c8d666-jvh7n   0/1   ImagePullBackOff   0   83s
# demo-podinfo-c9f6c987f-…               0/1   ImagePullBackOff   0   …       (Pod cũ đã bị xoá: maxUnavailable 1)
helm upgrade demo podinfo/podinfo --version 6.16.0 -n demo --reuse-values
# Error: no cached repo found. (try 'helm repo update'): open /home/ubuntu/.cache/helm/repository/podinfo-index.yaml: no such file or directory
helm repo update podinfo
# ...Successfully got an update from the "podinfo" chart repository
helm upgrade demo podinfo/podinfo --version 6.16.0 -n demo --reuse-values
# Error: UPGRADE FAILED: another operation (install/upgrade/rollback) is in progress
helm rollback demo 11 -n demo --wait
# Rollback was a success! Happy Helming!
helm history demo -n demo --max 3
# 11      	…	superseded     	podinfo-6.16.0	6.16.0	Rollback to 9
# 12      	…	pending-upgrade	podinfo-6.16.0	6.16.0	Preparing upgrade
# 13      	…	deployed       	podinfo-6.16.0	6.16.0	Rollback to 11
k -n demo get pod -l app.kubernetes.io/name=demo-podinfo
# demo-podinfo-7f7d667448-4gd6m   1/1   Running   0   13s
\`\`\`

Revision 12 vẫn ghi \`pending-upgrade\` trong history: Helm không sửa revision cũ, chỉ thêm revision mới. Revision 10 là dấu của một lần \`begin\` trước.

Đường khác, đo trên cùng lab: xoá Secret \`sh.helm.release.v1.demo.v<N>\` của revision kẹt làm \`helm status\` báo revision trước \`deployed\` ngay, nhưng Deployment vẫn mang \`ghcr.io/stefanprodan/podinfo:6.99.0\` (\`helm get manifest\` nói 6.16.0, cluster nói 6.99.0) cho tới lần \`helm upgrade … --reuse-values\` kế tiếp. Rollback làm cả hai việc trong một lệnh.

**6. demo-canary: pending-install**

\`\`\`bash
helm rollback demo-canary -n demo
# Error: release has no 0 version
helm install demo-canary podinfo/podinfo --version 6.16.0 -n demo
# Error: INSTALLATION FAILED: release name check failed: cannot reuse a name that is still in use
helm uninstall demo-canary -n demo
# release "demo-canary" uninstalled
helm list -n demo
# NAME	NAMESPACE	REVISION	UPDATED	STATUS  	CHART         	APP VERSION
# demo	demo     	13      	…      	deployed	podinfo-6.16.0	6.16.0
\`\`\`

**7. Kiểm**

\`\`\`bash
helm list -A                # cert-manager, demo, shop: cả ba deployed
helm search repo podinfo/podinfo --version 6.16.0
# podinfo/podinfo	6.16.0       	6.16.0     	Podinfo Helm chart for Kubernetes
\`\`\`

Lời giải tự động: \`labs/cka/sessions/s40/apply.sh\` (gây sự cố như \`begin\` rồi \`files/solve.sh\`: tìm revision lỗi và revision tốt trong \`helm history -o json\` theo trạng thái, rollback shop kèm \`--force-conflicts\`, rollback demo, uninstall demo-canary, \`helm repo update\`; chạy lại được). Sự cố ở \`labs/cka/breaks/st7-helm/\`.`,
    exam: {
      patterns: [
        "\"Release X đang lỗi, đưa về bản chạy được trước đó\" — `helm history X -n N`, `helm rollback X <revision> -n N`; kiểm `helm list -n N`.",
        "\"Tìm release đang failed / pending ở mọi namespace\" — Helm 3: `helm list -A -a` hay `helm list -A --failed` / `--pending`.",
        "\"Release cài bằng values nào / revision 3 khác revision 2 ở đâu\" — `helm get values X --revision 3` (thêm `-a` để có cả mặc định), `helm get manifest X --revision 3`.",
        "\"Gỡ release X nhưng giữ history\" — `helm uninstall X -n N --keep-history` (rồi `helm history X` vẫn đọc được).",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Trong 3 phút: cài podinfo 6.15.0 tên `drill` vào namespace `drill`, upgrade lên 6.16.0, rồi đưa về 6.15.0 mà không gõ số phiên bản chart. Chứng minh bằng một lệnh.",
          timeLimitMin: 3,
          solution: "```bash\nhelm install drill podinfo/podinfo --version 6.15.0 -n drill --create-namespace\nhelm upgrade drill podinfo/podinfo --version 6.16.0 -n drill\nhelm rollback drill 1 -n drill          # hay `helm rollback drill -n drill`: về revision trước\nhelm history drill -n drill             # 3 deployed, Rollback to 1, CHART podinfo-6.15.0\nhelm uninstall drill -n drill && k delete ns drill\n```",
        },
        {
          text: "Trong 2 phút: `helm upgrade web …` báo `another operation (install/upgrade/rollback) is in progress`. Bạn gõ gì, theo thứ tự, và vì sao không xoá Secret?",
          timeLimitMin: 2,
          solution: "```bash\nhelm history web -n web          # revision mới nhất pending-upgrade, revision tốt trước nó\nhelm rollback web <tốt> -n web   # áp lại manifest tốt và ghi revision deployed mới\n```\nXoá Secret của revision kẹt chỉ sửa sổ sách của Helm: manifest dở dang vẫn nằm trong cluster tới lần upgrade sau (đo trên lab). Release `pending-install` (chưa từng deployed) thì `helm uninstall`.",
        },
      ],
    },
    tips: [
      "Trước khi rollback, `helm get values <tên> --revision <lỗi>` so với `--revision <tốt>`: biết khoá hỏng thì lần upgrade sau không lặp lại lỗi.",
      "`helm rollback <tên>` không ghi revision là về revision ngay trước. Khi revision trước là một lần `failed` hay `pending`, ghi số rõ ràng.",
      "`helm status` (DESCRIPTION) nói Helm thấy gì; `k logs --previous` của Pod mới nói ứng dụng thấy gì. Lỗi `--wait` hết giờ luôn cần cả hai.",
      "Lỗi `no cached repo found` hay `repo is corrupt or missing`: `helm repo update`, không phải `repo add` lại.",
    ],
    outcome: {
      md: `Ba release hỏng ba kiểu đều về \`deployed\` với đúng cấu hình cũ, và shop không mất request nào trong lúc đó. Trên Mac:

\`\`\`bash
./labs/lab verify cka s40
\`\`\`

Verify đọc \`helm history -o json\` của shop và demo: revision hiện tại \`deployed\`, sau revision hỏng mới nhất của sự cố (\`failed\` với shop, \`pending-upgrade\` với demo), và \`helm get values -a\` của nó **bằng** revision tốt, tức revision \`deployed\`/\`superseded\` mới nhất trước revision hỏng, tìm theo history chứ không ghi cứng số (roll forward bằng values khác, ví dụ \`MaxRAMPercentage=60\`: đỏ, đo; roll forward bằng \`--reset-values\` về đúng values của chart: xanh, đo). Cùng dòng shop, verify chạy lại phần release/nhận lại của s37 (chart \`shop-0.1.0\`, \`order.image.tag\` 2.0, Deployment khớp values, 15 object). Không Pod nào của gateway, gateway-v1, catalog, order (kể cả Pod đang khởi động lại) và không ReplicaSet nào còn replica có \`JAVA_OPTS\` khác \`javaOpts\` của revision tốt, mọi Pod Ready, bốn Deployment Available, \`curl\` từ Mac tới \`<IP cka-w1>:30180/api/products\` trả 200. demo: Deployment và Pod không còn image \`6.99.0\` (chỉ xoá Secret của revision kẹt: đỏ, đo), cộng dòng demo của s37 (\`podinfo-6.16.0\`, \`ui.message\`, Pod trên cka-cp). \`demo-canary\` không còn release, Secret hay Deployment; \`helm search repo podinfo/podinfo --version 6.16.0\` thấy chart. \`BAD_VALUE=javaOpts\`.`,
      verifyOutput: "lab: kiểm s40\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~33 phút)\n  ✓ Release shop deployed sau revision failed của sự cố, values (-a) bằng revision tốt trước đó; chart shop-0.1.0, order 2.0, Deployment khớp values, 15 object của release\n  ✓ Không Pod/ReplicaSet nào của shop còn JAVA_OPTS xấu, mọi Pod Ready; bốn Deployment Available; từ Mac curl <IP cka-w1>:30180/api/products trả 200\n  ✓ Release demo deployed sau revision pending-upgrade, values bằng revision tốt, không còn image 6.99.0; podinfo-6.16.0, ui.message, Pod trên cka-cp\n  ✓ Release demo-canary (pending-install) đã gỡ hẳn; helm search repo thấy podinfo/podinfo 6.16.0\n  ✓ answers.env: BAD_VALUE là khoá values gây lỗi của release shop\n  → 5/5 đạt",
      projectDelta: "Không có gì mới trong shop: đúng như cuối s37. Thứ mới là quy trình: đọc release từ list → status → history → values → log Pod mới trước khi sửa, và biết cách gỡ từng trạng thái kẹt mà không để cluster lệch release. Mốc st7-done chụp ở đây (trước khi nâng cấp cluster ở s42).",
    },
    review: [
      { q: "Upgrade `--wait` của shop hết giờ và release thành `failed`. Revision trước ở trạng thái gì, và cluster đang chạy manifest của revision nào?", a: "Revision trước vẫn `deployed` (đo trên Helm 4.3.2): Helm chỉ chuyển nó thành `superseded` khi có revision `deployed` mới. Cluster thì đã nhận manifest của revision `failed`: Deployment mang pod template mới, Pod mới CrashLoopBackOff, Pod cũ còn chạy nhờ `maxUnavailable: 0`. `--wait` hết giờ không tự trả cluster về; `--rollback-on-failure` (Helm 3: `--atomic`) mới làm." },
      { q: "Ba release kẹt `failed`, `pending-upgrade`, `pending-install`. Gỡ mỗi cái thế nào và vì sao khác nhau?", a: "`failed`: upgrade tiếp hay rollback đều được; lab rollback về revision tốt. `pending-upgrade`: upgrade bị từ chối (`another operation … in progress`), rollback được và áp lại manifest tốt (đo). `pending-install`: không có revision nào để quay về (`release has no 0 version`), install lại bị từ chối (`cannot reuse a name`), nên `helm uninstall`." },
      { q: "Xoá Secret `sh.helm.release.v1.demo.v<N>` của revision kẹt có gỡ được `pending-upgrade` không? Cái giá là gì?", a: "Được về mặt Helm: release về revision trước, `deployed`, upgrade tiếp được. Nhưng manifest dở dang vẫn trong cluster (đo: Deployment vẫn image 6.99.0 trong khi `helm get manifest` nói 6.16.0) tới lần upgrade sau. Rollback vừa gỡ trạng thái vừa áp lại manifest tốt." },
      { q: "Làm sao biết khoá values nào gây lỗi, và vì sao nên biết trước khi rollback?", a: "`helm get values shop --revision <failed>` so với `--revision <tốt>` (USER-SUPPLIED VALUES chỉ có `javaOpts: -XX:MaxRAMPercentage=150`), rồi `k logs --previous` của Pod mới xác nhận (JVM báo `MaxRAMPercentage=150.000000 is outside the allowed range`). Rollback mà không biết thì người upgrade sau dùng lại đúng values đó (`--reuse-values`) và hỏng lại." },
      { q: "Trên Helm 3 của đề, lệnh nào của buổi viết khác?", a: "`helm list -a` (Helm 4 bỏ; `helm list` trần của Helm 3 không in `pending-*`), `--atomic` thay `--rollback-on-failure`. `status`, `history`, `get values --revision`, `rollback`, `uninstall`, `repo update` giống hệt. Helm 3 không cần `--force-conflicts` (không dùng server-side apply)." },
    ],
  },
];
