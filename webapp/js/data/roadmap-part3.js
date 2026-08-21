// Roadmap Part 3 — Tuần 6 đến Tuần 10 (Services & Networking, Storage/Helm/Kustomize, Luyện thi, Thi thật)
// Lưu ý: id và text của từng item KHÔNG được thay đổi — tiến độ học của người dùng lưu theo các id này.

export const weeksPart3 = [
  {
    id: "w6",
    week: "Tuần 6",
    title: "Services & Networking",
    goal: "Kết nối ứng dụng.",
    practice: "Expose deployment bằng cả 3 loại service; viết NetworkPolicy chỉ cho frontend gọi backend.",
    resources: [
      { label: "Lab 19 — Expose ClusterIP/NodePort + test busybox", href: "#/labs/lab19" },
      { label: "Lab 20 — Ingress định tuyến 2 paths", href: "#/labs/lab20" },
      { label: "Lab 21 — NetworkPolicy default-deny + allow", href: "#/labs/lab21" },
      { label: "Lab 22 — Debug Service endpoints", href: "#/labs/lab22" },
      { label: "Cheat Sheet — mục Services, Ingress, NetworkPolicy", href: "#/docs/cheat-sheet" },
      { label: "Kubernetes Docs — Services & Networking", href: "https://kubernetes.io/docs/concepts/services-networking/" },
    ],
    items: [
      {
        id: "w6-1",
        text: "Services: ClusterIP, NodePort, LoadBalancer, headless; port vs targetPort vs nodePort",
        lesson: `Pod trong Kubernetes "sinh tử" liên tục: mỗi lần bị xóa rồi tạo lại, Pod nhận một IP hoàn toàn mới. Nếu frontend gọi thẳng IP của Pod backend thì chỉ vài phút sau kết nối sẽ đứt. **Service** sinh ra để giải quyết đúng vấn đề này — hãy hình dung nó như **số tổng đài cố định** của một công ty: nhân viên (Pod) đổi máy nhánh liên tục, nhưng khách chỉ cần nhớ một số duy nhất, tổng đài tự nối máy đến người đang trực.

Bốn loại Service cần nắm:

- **ClusterIP** (mặc định): cấp một IP ảo chỉ truy cập được **bên trong** cluster — dùng cho giao tiếp nội bộ giữa các thành phần.
- **NodePort**: mở một port trong dải **30000–32767** trên **mọi node**; truy cập từ bên ngoài qua \`<NodeIP>:<nodePort>\`.
- **LoadBalancer**: nhờ cloud provider cấp load balancer với IP public (bên dưới vẫn bao gồm NodePort + ClusterIP).
- **Headless** (\`clusterIP: None\`): không có IP ảo — DNS trả thẳng IP của từng Pod, dùng cho StatefulSet, database.

Bộ ba port dễ nhầm nhất trong đề thi:

- \`port\` — port của **Service** (người gọi dùng port này).
- \`targetPort\` — port mà **container** thực sự lắng nghe.
- \`nodePort\` — port mở trên **node** (chỉ tồn tại với NodePort/LoadBalancer).

\`\`\`bash
# ClusterIP: service port 80 chuyển tiếp vào container port 8080
k expose deploy web --port=80 --target-port=8080

# NodePort: thêm --type, để Kubernetes tự chọn nodePort
k expose deploy web --name=web-np --port=80 --target-port=8080 --type=NodePort

# LoadBalancer (trên cloud)
k expose deploy web --name=web-lb --port=80 --type=LoadBalancer

# Generate YAML để sửa nodePort cụ thể (vd 30080)
k expose deploy web --port=80 --type=NodePort $do > svc.yaml

# Verify: xem type, CLUSTER-IP, PORT(S)
k get svc
\`\`\`

⚠️ **Lỗi thường gặp:** nhầm \`port\` với \`targetPort\` — container nghe 8080 mà khai \`targetPort: 80\` thì Service "chết lặng" (connection refused) dù mọi thứ đều Running. Chỉ định \`nodePort\` ngoài dải 30000–32767 sẽ bị API server từ chối ngay khi apply.`,
      },
      {
        id: "w6-2",
        text: "DNS trong cluster: `<service>.<namespace>.svc.cluster.local`",
        lesson: `Nhớ IP của từng Service cũng khổ chẳng kém nhớ IP của Pod. May mắn là Kubernetes có sẵn một **"danh bạ điện thoại nội bộ"**: CoreDNS chạy trong namespace \`kube-system\` tự động tạo bản ghi DNS cho mọi Service. Ứng dụng chỉ cần gọi nhau **bằng tên**, không bao giờ cần biết IP.

Tên đầy đủ (FQDN) của một Service có dạng: \`<service>.<namespace>.svc.cluster.local\`. Nhưng thực tế bạn hiếm khi phải gõ hết, vì Pod được cấu hình sẵn search domain:

- **Cùng namespace**: chỉ cần tên service — \`http://web-svc\`
- **Khác namespace**: thêm namespace — \`http://web-svc.prod\`
- **FQDN đầy đủ**: \`http://web-svc.prod.svc.cluster.local\` — dùng khi muốn chắc chắn 100%

Với **headless Service**, DNS còn trả về IP của từng Pod riêng lẻ thay vì một IP ảo — đó là lý do StatefulSet dùng nó để các Pod gọi đích danh nhau.

Cách kiểm tra DNS nhanh nhất là chạy một Pod tạm:

\`\`\`bash
# Tạo pod tạm, tự xóa khi thoát
k run tmp --image=busybox --rm -it --restart=Never -- sh

# Bên trong pod:
nslookup web-svc                          # cùng namespace
nslookup web-svc.prod                     # khác namespace
nslookup web-svc.prod.svc.cluster.local  # FQDN đầy đủ
wget -qO- http://web-svc:80              # gọi thử HTTP
cat /etc/resolv.conf                      # xem search domains được cấu hình sẵn
\`\`\`

⚠️ **Lỗi thường gặp:** gọi service ở namespace khác nhưng chỉ dùng tên ngắn (\`web-svc\` thay vì \`web-svc.prod\`) → DNS trả "not found" dù service vẫn sống. Khi có NetworkPolicy default-deny egress mà quên mở port 53 (UDP + TCP), DNS chết → mọi kết nối theo tên đều fail dù kết nối bằng IP vẫn chạy.`,
      },
      {
        id: "w6-3",
        text: "Endpoints — cách Service tìm Pod qua selector",
        lesson: `Nếu Service là "số tổng đài" thì **Endpoints** chính là **danh sách máy nhánh đang có người trực**. Service tự nó không chứa IP nào cả — nó chỉ có \`selector\`. Control plane liên tục quét các Pod có label khớp selector, gom địa chỉ \`IP:port\` của những Pod **Ready** vào một object Endpoints cùng tên với Service. Traffic đến Service sẽ được phân phối cho các địa chỉ trong danh sách này.

Chuỗi mắt xích phải khớp hoàn hảo: **label của Pod** ↔ **selector của Service**, và **targetPort** ↔ **port container nghe**. Đứt bất kỳ mắt xích nào, Service thành "tổng đài không ai trực".

Một chi tiết quan trọng: Pod đang \`Running\` nhưng **readinessProbe fail** sẽ bị **loại khỏi Endpoints** — đây là cơ chế để app tạm ngưng nhận traffic mà không bị restart. (Kubernetes hiện đại dùng thêm EndpointSlice để scale tốt hơn, nhưng lệnh debug kinh điển vẫn là \`k get endpoints\`.)

Quy trình debug Service — thuộc lòng cho kỳ thi:

\`\`\`bash
# 1. Endpoints có IP không? RỖNG = có vấn đề!
k get endpoints web-svc

# 2. Selector của service là gì?
k describe svc web-svc | grep -i selector

# 3. So với label thực tế của pod
k get pods --show-labels
k get pods -l app=web            # có pod nào khớp không?

# 4. Pod có Ready không? (readiness fail = bị loại khỏi endpoints)
k describe pod <pod-name> | grep -A5 Conditions

# 5. Sửa nhanh nếu selector sai
k edit svc web-svc
\`\`\`

⚠️ **Lỗi thường gặp:** endpoints rỗng do selector không khớp label — chỉ một ký tự lệch (\`app: web\` vs \`app: webapp\`) là đủ chết; đây là câu debug ưa thích của đề thi. Bẫy thứ hai: Pod Running nhưng readiness probe fail → endpoints vẫn rỗng, đừng chỉ nhìn \`k get pod\` thấy Running mà bỏ qua cột READY.`,
      },
      {
        id: "w6-4",
        text: "Ingress: rules, pathType (Prefix/Exact), TLS, ingressClassName",
        lesson: `Nếu mỗi Service kiểu NodePort/LoadBalancer là một "cửa riêng" thì **Ingress** là **quầy lễ tân duy nhất** của tòa nhà: mọi khách HTTP/HTTPS đi vào một cửa, lễ tân nhìn **tên miền (host)** và **đường dẫn (path)** rồi dẫn khách đến đúng phòng (Service). Nhờ vậy một IP có thể phục vụ \`myapp.com/app\` → \`web-svc\` và \`myapp.com/api\` → \`api-svc\`.

Điều quan trọng cần hiểu: Ingress chỉ là **bản khai quy tắc định tuyến**. Phải có một **Ingress Controller** (nginx, traefik...) đang chạy để thực thi, và bạn chọn controller qua \`ingressClassName\`.

Các field cốt lõi:

- \`rules\`: mỗi rule gồm \`host\` (tùy chọn) + danh sách \`http.paths\`.
- \`pathType\`: **Prefix** khớp path đó và mọi thứ bên dưới (\`/app\`, \`/app/login\`...); **Exact** chỉ khớp đúng chuỗi path.
- \`backend.service\`: tên Service + \`port.number\` cần trỏ tới.
- \`tls\`: danh sách \`hosts\` + \`secretName\` trỏ đến Secret loại tls (tạo bằng \`k create secret tls\`).

Cách nhanh nhất trong phòng thi là generate bằng lệnh:

\`\`\`bash
# Dấu * sau path sinh ra pathType: Prefix (không có * → Exact)
k create ingress myingress \\
  --rule="myapp.com/app*=web-svc:80" \\
  --rule="myapp.com/api*=api-svc:8080" \\
  $do > ing.yaml

# Sửa ing.yaml nếu cần thêm ingressClassName / tls, rồi:
k apply -f ing.yaml

# Verify: cột ADDRESS phải có giá trị sau ít phút
k get ingress
k describe ingress myingress
\`\`\`

⚠️ **Lỗi thường gặp:** dùng \`pathType: Exact\` khiến \`/app/login\` trả 404 dù \`/app\` chạy ngon — đề yêu cầu route "mọi thứ dưới /app" thì phải là Prefix. Quên \`ingressClassName\` (hoặc gõ sai tên class) → không controller nào nhận Ingress, ADDRESS trống mãi và traffic không bao giờ tới.`,
      },
      {
        id: "w6-5",
        text: "NetworkPolicies: ingress/egress, podSelector, namespaceSelector, ipBlock; default deny",
        lesson: `Mặc định, Kubernetes là một "bữa tiệc mở": **mọi Pod nói chuyện được với mọi Pod**, kể cả khác namespace. **NetworkPolicy** biến bữa tiệc thành sự kiện có **danh sách khách mời ở cửa**: một khi có policy "chọn" một Pod, chỉ những luồng traffic được liệt kê rõ mới đi qua — tất cả phần còn lại bị chặn. Đây là mô hình **whitelist**.

Cấu trúc một policy:

- \`podSelector\`: policy áp cho Pod nào (\`{}\` = **mọi** Pod trong namespace).
- \`policyTypes\`: khóa chiều nào — \`Ingress\` (vào), \`Egress\` (ra), hoặc cả hai.
- \`ingress.from\` / \`egress.to\`: nguồn/đích được phép, gồm 3 loại — \`podSelector\` (Pod cùng namespace theo label), \`namespaceSelector\` (mọi Pod trong namespace có label), \`ipBlock\` (dải CIDR).
- \`ports\`: giới hạn protocol + port.

**Default deny** là bài kinh điển: \`podSelector: {}\` + \`policyTypes\` đủ hai chiều, không khai rule nào:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: dev
spec:
  podSelector: {}                # áp cho MỌI pod trong namespace
  policyTypes: ["Ingress", "Egress"]
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-backend
  namespace: dev
spec:
  podSelector:
    matchLabels:
      app: backend               # policy áp cho pod backend
  policyTypes: ["Ingress"]
  ingress:
  - from:
    - podSelector:               # CHỈ pod có label này được gọi vào
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8080
\`\`\`

⚠️ **Lỗi thường gặp:** (1) Default-deny egress mà **quên mở DNS port 53** (cả UDP lẫn TCP) → mọi kết nối theo tên service đều fail một cách bí ẩn. (2) Bẫy dấu \`-\`: \`- namespaceSelector\` và \`- podSelector\` là hai item riêng → nghĩa là **OR**; bỏ dấu \`-\` thứ hai để gộp chung một item → thành **AND** (pod có label X *trong* namespace có label Y). Một dấu gạch đổi hẳn ngữ nghĩa policy.`,
      },
      {
        id: "w6-6",
        text: "Test kết nối: `kubectl run tmp --rm -it --image=busybox -- wget -qO- <svc>`",
        lesson: `Lắp xong tổng đài thì phải **nhấc máy gọi thử** — tạo Service, Ingress hay NetworkPolicy xong mà không test là chưa xong việc. Trong phòng thi, cách test chuẩn là bắn một **Pod tạm** dùng image \`busybox\`, chạy lệnh kiểm tra, rồi để nó tự hủy.

Bộ cờ cần thuộc lòng: \`--rm\` (tự xóa Pod khi thoát), \`-it\` (tương tác), \`--restart=Never\` (chạy một lần duy nhất, không tự khởi động lại). Lưu ý busybox **có \`wget\` nhưng không có \`curl\`** — \`wget -qO-\` nghĩa là "im lặng, in kết quả ra màn hình". Với port không phải HTTP (database chẳng hạn), dùng \`nc -zv\` để kiểm tra TCP thuần.

\`\`\`bash
# Test HTTP tới service (cùng namespace)
k run tmp --image=busybox --rm -it --restart=Never \\
  -- wget -qO- -T 2 http://web-svc:80

# Test service ở namespace khác — phải thêm namespace vào tên
k run tmp --image=busybox --rm -it --restart=Never \\
  -- wget -qO- -T 2 http://web-svc.prod:80

# Test DNS resolve
k run tmp --image=busybox --rm -it --restart=Never -- nslookup web-svc

# Test TCP port thuần (vd database 5432)
k run tmp --image=busybox --rm -it --restart=Never \\
  -- nc -zv -w 2 db-svc 5432

# Khi test NetworkPolicy: pod tạm phải mang ĐÚNG label được cho phép
k run tmp --image=busybox --labels="app=frontend" --rm -it --restart=Never \\
  -- wget -qO- -T 2 http://backend-svc:8080
\`\`\`

Cờ \`-T 2\` (wget) và \`-w 2\` (nc) đặt timeout 2 giây — cực hữu ích khi test NetworkPolicy: bị chặn thì fail ngay thay vì treo cả phút.

⚠️ **Lỗi thường gặp:** quên \`--rm\` và \`--restart=Never\` → Pod rác nằm lại ở trạng thái Completed/Error, vừa mất điểm gọn gàng vừa gây nhiễu khi debug. Test NetworkPolicy bằng pod tạm **không gắn label** được whitelist → kết luận nhầm là policy hỏng, trong khi thực ra policy đang hoạt động đúng.`,
      },
    ],
  },
  {
    id: "w7",
    week: "Tuần 7",
    title: "Storage, Helm, Kustomize & Image Build",
    goal: "Hoàn thiện các mảnh còn lại của curriculum.",
    practice: "Tạo PVC gắn vào Pod; cài nginx bằng Helm; tạo overlay dev/prod bằng Kustomize.",
    resources: [
      { label: "Lab 05 — PV & PVC", href: "#/labs/lab05" },
      { label: "Lab 08 — Helm install/upgrade --set", href: "#/labs/lab08" },
      { label: "Lab 09 — Kustomize overlay dev/prod", href: "#/labs/lab09" },
      { label: "Cheat Sheet — Volumes, Helm, Kustomize, Images", href: "#/docs/cheat-sheet" },
      { label: "Kubernetes Docs — Storage", href: "https://kubernetes.io/docs/concepts/storage/" },
    ],
    items: [
      {
        id: "w7-1",
        text: "Volumes: emptyDir, hostPath, configMap, secret",
        lesson: `Filesystem của container giống **phòng khách sạn được dọn sạch mỗi lần đổi khách**: container restart là mọi file ghi thêm biến mất. **Volume** là "tủ đồ gắn ngoài" — khai báo ở cấp Pod (\`spec.volumes\`) rồi từng container gắn vào qua \`volumeMounts\`. CKAD cần 4 loại:

- **emptyDir**: thư mục rỗng sinh ra cùng Pod, **sống chết cùng Pod**. Là "bàn làm việc chung" cho các container trong cùng Pod — pattern sidecar chia sẻ log kinh điển dùng chính nó.
- **hostPath**: mượn một thư mục **của node** đang chạy Pod. Dữ liệu nằm lại trên node — chỉ phù hợp lab/single-node.
- **configMap** / **secret**: mount config thành **file chỉ đọc** trong container — mỗi key thành một file, value là nội dung file.

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: vol-demo
spec:
  volumes:
  - name: cache
    emptyDir: {}                 # mất khi Pod bị xóa
  - name: config-vol
    configMap:
      name: mycm                 # mỗi key của CM thành 1 file
  containers:
  - name: app
    image: busybox
    command: ["sh", "-c", "date >> /cache/log.txt; sleep 3600"]
    volumeMounts:
    - name: cache
      mountPath: /cache
    - name: config-vol
      mountPath: /etc/config     # đọc: cat /etc/config/<key>
\`\`\`

Tạo nhanh và verify:

- \`k explain pod.spec.volumes\` khi quên cú pháp một loại volume.
- \`k exec vol-demo -- ls /etc/config\` để xem key đã thành file chưa.

⚠️ **Lỗi thường gặp:** nhầm vòng đời emptyDir — nó **sống sót khi container restart** nhưng **mất khi Pod bị xóa/tạo lại**; đừng dùng cho dữ liệu cần giữ lâu dài. Với hostPath: Pod bị schedule sang node khác là "mất" sạch dữ liệu vì thư mục nằm trên node cũ — nguồn của những bug "lúc có lúc không" rất khó lần.`,
      },
      {
        id: "w7-2",
        text: "PV & PVC: accessModes, storageClassName, binding",
        lesson: `Khi dữ liệu cần sống lâu hơn cả Pod lẫn node, ta cần storage thật sự — và Kubernetes tách nó làm hai nửa. **PersistentVolume (PV)** là **"kho chứa"** admin xây sẵn (kích thước, vị trí, chế độ truy cập). **PersistentVolumeClaim (PVC)** là **"phiếu yêu cầu kho"** dev điền: "tôi cần 500Mi, chế độ ReadWriteOnce". Kubernetes đóng vai thủ kho, ghép phiếu với kho trống phù hợp — quá trình đó gọi là **binding**, và mỗi PV chỉ bind với đúng một PVC.

Điều kiện ghép thành công — cả ba phải thỏa:

- **accessModes** tương thích: \`ReadWriteOnce\` (RWO — một node đọc/ghi), \`ReadOnlyMany\` (ROX), \`ReadWriteMany\` (RWX — nhiều node cùng ghi).
- **storageClassName** khớp nhau (hoặc cả hai cùng bỏ trống).
- **capacity** của PV ≥ \`storage\` mà PVC yêu cầu.

Với **StorageClass** + dynamic provisioning (trên cloud), bạn chỉ cần nộp phiếu — "kho" được tự động xây theo yêu cầu, không cần admin tạo PV tay.

\`\`\`yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: mypv
spec:
  capacity:
    storage: 1Gi
  accessModes: ["ReadWriteOnce"]
  storageClassName: manual
  hostPath:
    path: /mnt/data
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mypvc
spec:
  accessModes: ["ReadWriteOnce"]   # phải tương thích PV
  storageClassName: manual         # phải khớp PV
  resources:
    requests:
      storage: 500Mi               # <= capacity của PV
\`\`\`

Sau khi apply, verify bằng \`k get pv,pvc\` — cả hai phải ở trạng thái \`Bound\`. Gắn vào Pod qua \`volumes.persistentVolumeClaim.claimName: mypvc\`.

⚠️ **Lỗi thường gặp:** PVC kẹt ở \`Pending\` mãi — 90% do accessModes hoặc storageClassName không khớp bất kỳ PV nào (hoặc request lớn hơn capacity); luôn \`k describe pvc\` đọc Events. Bẫy hiểu nhầm: RWO nghĩa là **một node** mount đọc/ghi — nhiều Pod trên *cùng* node vẫn dùng chung được, không phải "một pod" như nhiều người tưởng.`,
      },
      {
        id: "w7-3",
        text: "Helm: install/upgrade/rollback/uninstall, repo, `--set`, values.yaml, `helm template`",
        lesson: `Cài một app thực tế lên Kubernetes có thể cần cả chục file YAML. **Helm** giống **App Store cho Kubernetes**: thay vì tự viết từng manifest, bạn cài một **chart** (gói đóng sẵn tất cả YAML dạng template) và chỉ tùy chỉnh vài thông số. Ba khái niệm cốt lõi:

- **Chart**: gói cài đặt (như file cài app).
- **Release**: một bản chart **đã cài** vào cluster, có tên riêng — cùng một chart cài được nhiều release.
- **values.yaml**: bộ "tùy chọn cấu hình" mặc định của chart; ghi đè bằng \`--set key=value\` hoặc \`-f myvalues.yaml\`.

Vòng đời đầy đủ mà đề thi hay hỏi:

\`\`\`bash
# Thêm repo và cập nhật danh mục
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo nginx --versions      # tìm chart + liệt kê version

# Cài: TÊN RELEASE đứng trước, TÊN CHART đứng sau
helm install myweb bitnami/nginx --set replicaCount=2

helm list -A                           # release đang có (mọi namespace)
helm get values myweb                  # values đang áp dụng

# Nâng cấp / đổi cấu hình
helm upgrade myweb bitnami/nginx --set replicaCount=5

# Lịch sử & rollback
helm history myweb
helm rollback myweb 1                  # quay về revision 1

# Render YAML ra xem trước, KHÔNG cài gì cả
helm template myweb bitnami/nginx > preview.yaml

helm uninstall myweb                   # gỡ sạch release
\`\`\`

Mẹo phòng thi: \`helm show values bitnami/nginx\` để xem chart hỗ trợ tùy chọn gì trước khi \`--set\`; tài liệu helm.sh/docs được phép mở trong giờ thi.

⚠️ **Lỗi thường gặp:** đảo thứ tự \`helm install <release> <chart>\` — tên release luôn đứng trước, quen tay gõ ngược là lệnh fail hoặc cài sai tên. Quên \`helm repo update\` nên không thấy version chart mới mà đề yêu cầu. Và nhớ: \`helm template\` chỉ **render ra màn hình** — chưa có gì được cài vào cluster cả.`,
      },
      {
        id: "w7-4",
        text: "Kustomize: kustomization.yaml, bases/overlays, `kubectl apply -k`",
        lesson: `Bạn có một bộ YAML chạy tốt, nhưng dev cần 1 replica còn prod cần 5 replica và image tag khác. Copy cả thư mục ra sửa? Sớm muộn hai bản sẽ lệch nhau. **Kustomize** giải bài toán này theo kiểu **công thức gốc + bản gia giảm**: **base** là công thức chuẩn, mỗi **overlay** (dev, prod...) chỉ khai **phần khác biệt** — không đụng vào base, không lặp lại YAML. Kustomize được tích hợp sẵn trong kubectl, không cần cài thêm gì.

Mỗi thư mục có một file \`kustomization.yaml\`. Base liệt kê \`resources\` (các manifest gốc). Overlay trỏ về base rồi chồng thêm biến đổi:

\`\`\`yaml
# overlays/prod/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- ../../base            # kế thừa toàn bộ base
namespace: prod         # ép mọi resource vào namespace prod
namePrefix: prod-       # web -> prod-web
replicas:
- name: myapp           # đổi số replica của deployment myapp
  count: 5
images:
- name: nginx           # đổi tag image, KHÔNG sửa base
  newTag: "1.26"
patches:
- path: patch.yaml      # patch chi tiết hơn nếu cần
\`\`\`

Hai lệnh cần nhớ: \`k kustomize overlays/prod\` **render ra màn hình để xem trước** (luôn làm bước này!), và \`k apply -k overlays/prod\` để apply. Chú ý \`-k\` nhận **thư mục** chứa kustomization.yaml, không nhận file. Gỡ bằng \`k delete -k overlays/prod\`.

Cấu trúc thư mục chuẩn: \`base/\` (deployment.yaml, service.yaml, kustomization.yaml) và \`overlays/dev/\`, \`overlays/prod/\` — mỗi overlay một kustomization.yaml riêng.

⚠️ **Lỗi thường gặp:** gõ quen tay \`k apply -f overlays/prod\` (chữ **f**) — kubectl sẽ apply thô các file trong thư mục, bỏ qua toàn bộ logic kustomize, kết quả sai mà không báo lỗi rõ ràng; phải là \`-k\`. Bẫy thứ hai: đường dẫn \`resources\` trong overlay tính **tương đối từ chính file kustomization.yaml** — sai một cấp \`../\` là "file not found".`,
      },
      {
        id: "w7-5",
        text: "Build container image bằng Docker/Podman; export image (`docker save`)",
        lesson: `Container image giống **hộp cơm đóng gói sẵn**: app + runtime + thư viện + cấu hình, tất cả nén trong một gói — mở ra ở máy nào cũng chạy y hệt. Công thức đóng gói là **Dockerfile** với các lệnh cốt lõi: \`FROM\` (image nền), \`COPY\` (đưa file vào), \`EXPOSE\` (khai báo port), \`CMD\` (lệnh chạy mặc định — ứng với \`args\` trong Kubernetes), \`ENTRYPOINT\` (ứng với \`command\`).

Trong đề CKAD, dạng bài quen thuộc là: build image từ Dockerfile cho sẵn, gắn tag theo yêu cầu, rồi **export image ra file tar** bằng \`docker save\`. **Podman** dùng cú pháp y hệt Docker — đề cho lệnh nào thì thay chữ đầu là xong.

\`\`\`bash
# Dockerfile tối giản
cat <<EOF > Dockerfile
FROM nginx:1.25
COPY index.html /usr/share/nginx/html/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Build với tag
docker build -t myapp:v1 .

# Gắn thêm tag registry để push
docker tag myapp:v1 registry.io/myapp:v1
docker push registry.io/myapp:v1

# Export image ra file tar — DẠNG BÀI HAY RA THI
docker save myapp:v1 -o myapp.tar

# Nhập lại image từ tar
docker load -i myapp.tar

# Chạy thử local: map port máy 8080 -> container 80
docker run -d -p 8080:80 --name web myapp:v1

# Podman: y hệt
podman build -t myapp:v1 .
podman save myapp:v1 -o myapp.tar
\`\`\`

Verify sau khi build: \`docker images | grep myapp\` xem tag đã đúng chưa; sau khi save: \`ls -lh myapp.tar\` xác nhận file tồn tại.

⚠️ **Lỗi thường gặp:** nhầm \`docker save\` (xuất **image**, giữ đủ layer và metadata) với \`docker export\` (xuất **filesystem của container** đang chạy, mất metadata) — đề hỏi image thì bắt buộc dùng \`save\`. Quên \`-o\` khi save làm tar tràn ra stdout; và push lên registry riêng mà quên tag kèm tên registry (\`registry.io/...\`) thì Docker mặc định đẩy lên Docker Hub — fail ngay.`,
      },
      {
        id: "w7-6",
        text: "CRD & Operators (mức nhận biết: `kubectl get crd`, tạo custom resource)",
        lesson: `Kubernetes như một cơ quan hành chính chỉ nhận các **biểu mẫu có sẵn**: Pod, Deployment, Service... **CustomResourceDefinition (CRD)** là thủ tục **đăng ký một loại biểu mẫu mới** — sau khi CRD được cài, cluster hiểu thêm một loại resource (vd \`Backup\`, \`Certificate\`, \`PrometheusRule\`) và bạn thao tác với nó bằng kubectl **y như resource thường**: get, describe, apply, delete.

**Operator** = CRD + một controller: controller liên tục đọc các custom resource (CR) và tự động "vận hành" phần việc phía sau (cài database, xin certificate, backup định kỳ...). Bạn khai *mong muốn* trong CR, Operator lo phần còn lại.

Với CKAD chỉ cần **mức nhận biết**: liệt kê CRD, tra schema, và tạo một CR từ CRD có sẵn — không cần tự viết CRD hay Operator.

\`\`\`bash
# CRD nào đang có trên cluster?
k get crd

# Xem chi tiết một CRD (group, version, tên số nhiều/viết tắt)
k describe crd backups.example.com

# apiVersion + KIND chính xác để viết CR — tra ở đây
k api-resources | grep backup

# Tra schema của custom resource y như resource thường
k explain backup.spec

# Tạo một custom resource từ CRD có sẵn
cat <<EOF | k apply -f -
apiVersion: example.com/v1        # <group>/<version> lấy từ CRD
kind: Backup
metadata:
  name: daily-backup
spec:
  schedule: "0 3 * * *"
EOF

# Dùng như resource bình thường
k get backup
k describe backup daily-backup
\`\`\`

Ghi nhớ: apiVersion của chính CRD là \`apiextensions.k8s.io/v1\`, còn apiVersion của **CR** là \`<group>/<version>\` do CRD định nghĩa.

⚠️ **Lỗi thường gặp:** viết sai \`apiVersion\` của CR (đoán mò thay vì tra \`k api-resources\`) → lỗi "no matches for kind". Bẫy thứ hai: bản thân CRD là **cluster-scoped**, nhưng CR sinh ra từ nó thường là **namespaced** — quên \`-n <ns>\` khi get là tưởng nhầm CR "biến mất".`,
      },
    ],
  },
  {
    id: "w8",
    week: "Tuần 8–9",
    title: "Luyện thi cường độ cao",
    goal: "Tốc độ + độ chính xác.",
    practice: "Chỉ tiêu: mỗi câu cơ bản (pod, deployment, service, configmap) hoàn thành dưới 2 phút.",
    resources: [
      { label: "Tra cứu kubectl — toàn bộ imperative commands", href: "#/commands" },
      { label: "Quiz — kiểm tra kiến thức theo chủ đề", href: "#/quiz" },
      { label: "Flashcards — ôn nhanh lệnh và khái niệm", href: "#/flashcards" },
      { label: "Mock Exam — bấm giờ như thi thật", href: "#/exam" },
      { label: "Killercoda — lab CKAD miễn phí", href: "https://killercoda.com/killer-shell-ckad" },
    ],
    items: [
      {
        id: "w8-1",
        text: "Học thuộc imperative commands (xem trang Tra cứu kubectl)",
        lesson: `Imperative commands là vũ khí tốc độ số một trong phòng thi: sinh YAML trong 5 giây thay vì gõ tay 5 phút. Chiến lược: mỗi ngày **drill 10 phút** — mở terminal trống, gõ lại từ trí nhớ bộ lệnh lõi, đối chiếu với trang Tra cứu kubectl và Flashcards. Quy tắc vàng: cái gì tạo được bằng lệnh thì **không viết YAML tay**; cái gì không có lệnh (NetworkPolicy, PV/PVC, probes) thì generate resource gần nhất bằng \`$do\` rồi sửa.

\`\`\`bash
# Bộ lệnh phải "chảy ra từ đầu ngón tay"
k run p1 --image=nginx $do > p.yaml
k create deploy d1 --image=nginx --replicas=3 $do
k expose deploy d1 --port=80 --target-port=8080
k create cm cm1 --from-literal=k=v
k create secret generic s1 --from-literal=k=v
k create job j1 --image=busybox -- echo hi
k create cronjob c1 --image=busybox --schedule="*/5 * * * *" -- date
k create ingress i1 --rule="host/path*=svc:80" $do
k create role r1 --verb=get,list --resource=pods
k create rolebinding rb1 --role=r1 --serviceaccount=ns:sa
\`\`\`

⚠️ **Lỗi thường gặp:** quên \`$do\` nên lệnh tạo **thật** resource trong khi bạn chỉ muốn lấy YAML; quên dấu \`--\` trước command của container (\`k run x --image=busybox -- sleep 3600\`) khiến kubectl hiểu nhầm là cờ của chính nó.`,
      },
      {
        id: "w8-2",
        text: "Luyện `kubectl explain` và tra cứu nhanh kubernetes.io/docs",
        lesson: `\`kubectl explain\` là **từ điển field ngay trong terminal** — khi chỉ quên tên hay cấp của một field, tra nó nhanh hơn mở docs rất nhiều. Đi từng cấp theo đường dẫn field, thêm \`--recursive\` để xem cả cây con. Với docs (được phép mở trong giờ thi): luyện **tìm chứ không đọc** — gõ keyword chuẩn vào ô search ("networkpolicy", "persistent volume", "liveness"), vào trang đầu tiên phù hợp, Ctrl+F tìm block YAML mẫu, copy nguyên block về sửa.

\`\`\`bash
# Quên field probe nằm đâu?
k explain pod.spec.containers.livenessProbe

# Xem toàn bộ subfield của strategy
k explain deploy.spec.strategy --recursive

# apiVersion đúng của một resource
k explain ingress | head -3

# Tên viết tắt + apiVersion mọi resource
k api-resources | grep -i network
\`\`\`

Mỗi ngày tự đố 5 field ngẫu nhiên (fsGroup ở cấp nào? capabilities ở đâu?) và trả lời chỉ bằng \`k explain\`.

⚠️ **Lỗi thường gặp:** sa đà "đọc hiểu" trang docs mất 5 phút trong khi chỉ cần copy YAML mẫu 30 giây; gõ sai đường dẫn field rồi bỏ cuộc — cứ đi từ cấp cao xuống (\`pod.spec\` → \`pod.spec.containers\` → ...) là luôn tới nơi.`,
      },
      {
        id: "w8-3",
        text: "Làm lab trên Killercoda: killercoda.com/killer-shell-ckad",
        lesson: `Killercoda cho bạn **cluster thật chạy trong trình duyệt, miễn phí**, môi trường rất giống phòng thi — không cần cài gì. Chiến lược luyện: (1) làm theo **chủ đề yếu trước** (xem lại kết quả Quiz để biết mình yếu đâu); (2) **bấm giờ từng scenario** — mục tiêu là tốc độ, không chỉ đúng; (3) scenario nào loay hoay gấp đôi thời gian chuẩn → ghi vào sổ lỗi, làm lại sau 2 ngày; (4) mỗi scenario đều bắt đầu bằng nghi thức setup để thành phản xạ:

\`\`\`bash
# Nghi thức 15 giây đầu MỌI scenario (và cả ngày thi thật)
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
echo 'set tabstop=2 expandtab shiftwidth=2' >> ~/.vimrc

# Kiểm tra mình đang ở đâu trước khi làm bất cứ gì
k config get-contexts
k get ns
\`\`\`

⚠️ **Lỗi thường gặp:** bấm xem solution quá sớm — hãy tự bí ít nhất 5 phút, chính lúc "bí" là lúc não ghi nhớ sâu nhất; và làm lab kiểu "đọc truyện" (nhìn solution gật gù mà không gõ lại) thì không bao giờ thành muscle memory.`,
      },
      {
        id: "w8-4",
        text: "Giải mock exam, mỗi lần bấm giờ 2 tiếng nghiêm túc",
        lesson: `Mock exam chỉ có giá trị khi **mô phỏng đúng điều kiện thật**: 2 tiếng liên tục, không pause, không xem lời giải giữa chừng, chỉ được mở kubernetes.io/docs và helm.sh/docs. Quy trình chuẩn: 30 giây đầu setup môi trường; **lượt 1** (80 phút) làm hết câu dễ và trung bình, câu nào bí quá 6-7 phút → flag lại, đi tiếp; **lượt 2** (30 phút) quay lại câu flag; **10 phút cuối** verify các câu điểm cao. Trước mỗi câu: đọc kỹ yêu cầu **context + namespace** rồi mới gõ.

\`\`\`bash
# 30 giây đầu giờ — thuộc lòng như phản xạ
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
printf 'set tabstop=2 expandtab shiftwidth=2\n' > ~/.vimrc

# Mỗi câu LUÔN bắt đầu bằng lệnh chuyển context đề cho
k config use-context <context-cua-cau-hoi>
k config set-context --current --namespace=<ns-cua-cau-hoi>
\`\`\`

⚠️ **Lỗi thường gặp:** sa lầy 15 phút vào một câu 4% điểm — flag và đi tiếp là kỹ năng, không phải thất bại; quên chạy lệnh chuyển context đầu câu → làm đúng hết nhưng ở **sai cluster**, mất trắng điểm câu đó.`,
      },
      {
        id: "w8-5",
        text: "Sau mỗi mock: review kỹ câu sai, làm lại đến khi thuần thục",
        lesson: `Điểm mock không quan trọng bằng **những gì bạn làm sau đó** — review chính là lúc học thật. Quy trình 3 bước sau mỗi mock: (1) ghi từng câu sai/chậm vào **sổ lỗi**, kèm nguyên nhân *cụ thể* — sai namespace? quên verify? không nhớ field? đọc thiếu đề?; (2) làm lại **ngay** từng câu sai mà không nhìn lời giải; (3) sau 2 ngày làm lại lần nữa — chỉ tính "thuần thục" khi xong dưới 2 phút *và* verify pass. Lỗi nào lặp 2 lần → tạo flashcard riêng cho nó.

\`\`\`bash
# Nghi thức verify sau MỖI câu — thiếu bước này là nguồn lỗi số 1
k get pod                          # Running? READY 1/1?
k describe pod <name> | tail -20   # đọc Events nếu nghi ngờ
k get endpoints <svc>              # service câu hỏi có endpoints chưa?
k logs <pod> --previous            # pod crash: xem log lần chết trước
k get deploy,rs,svc,cm -n <ns>     # đúng namespace đề yêu cầu chưa?
\`\`\`

⚠️ **Lỗi thường gặp:** đọc lời giải, gật gù "à hiểu rồi" rồi bỏ qua — không gõ lại bằng tay thì tuần sau sai y hệt; và review mà không **phân loại nguyên nhân** thì không biết cần sửa kiến thức hay sửa thói quen làm bài.`,
      },
      {
        id: "w8-6",
        text: "Luyện vim: sửa YAML, copy/paste block, undo",
        lesson: `Trong phòng thi bạn **sống trong vim** — mỗi giây lóng ngóng là một giây mất đi. Bộ kỹ năng tối thiểu: \`i\` (sửa), \`Esc\` rồi \`:wq\` (lưu thoát), \`dd\` (xóa dòng), \`yy\` + \`p\` (copy/paste dòng), thêm số để nhân lệnh (\`5dd\` xóa 5 dòng), \`V\` chọn cả block rồi \`d\`/\`y\`/\`>\` (xóa/copy/thụt lề — chỉnh indent YAML cực nhanh), \`u\` (undo — cứu tinh), \`Ctrl+r\` (redo), \`/text\` (tìm), \`gg\`/\`G\` (đầu/cuối file), \`:%s/cu/moi/g\` (thay thế toàn file).

\`\`\`bash
# Bắt buộc trước khi mở file YAML đầu tiên — tab thật sẽ giết YAML
printf 'set tabstop=2 expandtab shiftwidth=2\n' > ~/.vimrc

# Bài tập hàng ngày (10 phút):
# 1. k create deploy d1 --image=nginx --replicas=3 $do > d.yaml
# 2. vim d.yaml: dùng V + y + p nhân đôi block container,
#    sửa tên bằng /nginx rồi i, thụt lề bằng V + >
# 3. Cố tình phá indent rồi sửa lại, u / Ctrl+r vài lần cho quen
# 4. k apply -f d.yaml --dry-run=server  # YAML còn hợp lệ không?
\`\`\`

Khi dán YAML từ docs vào vim, chạy \`:set paste\` trước — tắt auto-indent để block dán vào không bị xô lệch (xong nhớ \`:set nopaste\`).

⚠️ **Lỗi thường gặp:** dán YAML từ docs mà quên \`:set paste\` → auto-indent phá nát cấu trúc, mất vài phút dọn dẹp; dùng **tab thật** trong YAML (thiếu \`.vimrc\` ở trên) → \`k apply\` báo lỗi parse dù mắt thường nhìn file "trông vẫn ổn".`,
      },
    ],
  },
  {
    id: "w10",
    week: "Tuần 10",
    title: "Killer.sh & thi thật",
    goal: "Tổng duyệt và thi.",
    practice: "Đăng nhập sớm 30 phút trước giờ thi. Chúc bạn thi đậu! 🎉",
    resources: [
      { label: "killer.sh — simulator chính thức", href: "https://killer.sh" },
      { label: "Cheat Sheet — ôn lượt cuối", href: "#/docs/cheat-sheet" },
      { label: "Study Guide — checklist trước thi", href: "#/docs/study-guide" },
      { label: "Mock Exam — tổng duyệt lần cuối", href: "#/exam" },
    ],
    items: [
      {
        id: "w10-1",
        text: "Làm killer.sh simulator (2 session tặng kèm khi đăng ký thi — khó hơn đề thật)",
        lesson: `Mua voucher thi là bạn được tặng **2 session killer.sh** — simulator chính thức, giao diện PSI giống hệt phòng thi. Mỗi session mở trong **36 giờ**, môi trường có thể reset không giới hạn trong thời gian đó. Quan trọng nhất cần biết trước: killer.sh **khó hơn đề thật** rõ rệt — điểm thấp là *bình thường*, đừng hoảng loạn rồi mất tinh thần.

Chiến lược dùng 2 session: **session 1** làm khoảng 1 tuần trước thi — chạy nghiêm túc 2 tiếng như thi thật, sau đó dùng 34 giờ còn lại đọc **solution từng câu** (lời giải của killer.sh cực kỳ chi tiết, đáng giá hơn cả điểm số) và làm lại câu sai trên chính môi trường đó. **Session 2** để 2-3 ngày trước thi — đề giống session 1, lần này mục tiêu là tốc độ và điểm cao hơn hẳn.

\`\`\`bash
# Vào môi trường killer.sh, làm đúng nghi thức như thi thật
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
k config get-contexts        # làm quen với nhiều cluster/context
\`\`\`

⚠️ **Lỗi thường gặp:** đốt cả 2 session sát nhau hoặc quá sớm — mất cơ hội "tổng duyệt" gần ngày thi; và chỉ chăm chăm nhìn điểm mà bỏ qua phần solutions — giá trị thật của killer.sh nằm ở lời giải, không phải con số.`,
      },
      {
        id: "w10-2",
        text: "Review toàn bộ cheat sheet",
        lesson: `Lượt ôn cuối không phải để "đọc lại" mà để **kiểm tra khả năng tái hiện**: che phần lệnh, tự gõ lại từ trí nhớ, rồi đối chiếu — sai chỗ nào, chỗ đó chính là lỗ hổng cần vá trong 1-2 ngày còn lại. Ưu tiên các phần dễ quên nhất: **bảng probes** (liveness fail → restart; readiness fail → loại khỏi endpoints), **bảng apiVersion** (Ingress/NetworkPolicy là \`networking.k8s.io/v1\`, Job/CronJob là \`batch/v1\`), **bảng chẩn đoán lỗi Pod**, cặp OR/AND của NetworkPolicy, và mục "Bộ Nhớ Nhanh" cuối cheat sheet.

\`\`\`bash
# Bài self-test: gõ lại chuỗi này từ trí nhớ, KHÔNG nhìn tài liệu
k run p1 --image=nginx $do > p.yaml
k create deploy d1 --image=nginx --replicas=3 $do
k expose deploy d1 --port=80 --target-port=8080
k create cm cm1 --from-literal=k=v
k create ingress i1 --rule="site.com/app*=svc:80" $do
k explain pod.spec.containers.securityContext
k get endpoints d1        # phản xạ debug service
\`\`\`

Với mỗi mục trong cheat sheet, tự hỏi hai câu: *"lệnh imperative là gì?"* và *"field nào mình hay quên?"* — trả lời trôi chảy thì lướt qua, ấp úng thì dừng lại luyện.

⚠️ **Lỗi thường gặp:** đọc lướt như ôn môn lý thuyết — mắt thấy quen nhưng tay không gõ được khi vào phòng thi; và cố nhồi *mọi thứ* trong đêm cuối thay vì tập trung đúng vài phần còn yếu.`,
      },
      {
        id: "w10-3",
        text: "Kiểm tra hệ thống thi: webcam, internet, phòng yên tĩnh, bàn trống, giấy tờ",
        lesson: `Thi CKAD là thi online qua **PSI Bridge** với proctor giám sát qua webcam — trượt vì lý do hậu cần là điều lãng phí nhất có thể. Làm trước **1-2 ngày**: chạy system check của PSI (link trong email xác nhận), cài PSI Secure Browser, kiểm tra webcam quay rõ mặt và đọc được giấy tờ tùy thân. Yêu cầu phòng thi: **bàn trống hoàn toàn** (không giấy note, không sách), không người ra vào, đủ sáng, không tai nghe; **chỉ một màn hình** duy nhất; nước uống phải đựng trong chai/cốc **không nhãn**. Giấy tờ: hộ chiếu hoặc ID có **tên trùng khớp tên đăng ký thi**. Ngày thi: đăng nhập sớm **30 phút** — thủ tục check-in (quay webcam khắp phòng, kiểm tra bàn, xác minh giấy tờ) tốn thời gian hơn bạn tưởng.

\`\`\`bash
# Kiểm tra nhanh trước ngày thi (macOS/Linux)
ping -c 5 8.8.8.8                # mạng ổn định không? (mất gói = rủi ro)
# Đo tốc độ mạng: mở fast.com — khuyến nghị ổn định > 5 Mbps
# Webcam + mic: thử gọi video bất kỳ, xoay webcam quét phòng thử
# Đóng mọi app chạy nền trước giờ thi (đặc biệt app chat/notification)
\`\`\`

⚠️ **Lỗi thường gặp:** quên rút màn hình phụ → bị proctor bắt xử lý ngay giữa lúc check-in, mất thời gian và bình tĩnh; tên trên giấy tờ không khớp tên đăng ký (thiếu tên đệm, sai thứ tự) → có thể bị **từ chối thi** — kiểm tra ngay hôm nay, đừng đợi ngày thi.`,
      },
      {
        id: "w10-4",
        text: "Nghỉ ngơi đầy đủ trước ngày thi",
        lesson: `Nghe có vẻ "cho có" nhưng đây là chỉ dẫn kỹ thuật thật sự: kỳ thi 2 tiếng thực hành liên tục đòi hỏi **sự tỉnh táo hơn là kiến thức mới**. Ngày trước thi: **không học chủ đề mới** — não cần thời gian sắp xếp lại những gì đã nạp suốt 10 tuần; chỉ ôn nhẹ 30-60 phút cheat sheet vào buổi sáng, buổi chiều nghỉ hẳn, vận động nhẹ, chuẩn bị sẵn phòng thi và giấy tờ. Ngủ đủ **7-8 tiếng**. Sáng ngày thi: ăn nhẹ, uống vừa đủ nước (2 tiếng không được rời bàn tùy ý), và làm 15 phút **warmup** cho nóng tay — như vận động viên khởi động, không phải để học thêm:

\`\`\`bash
# Warmup 15 phút sáng ngày thi — chỉ để lấy nhịp, không học mới
alias k=kubectl
export do="--dry-run=client -o yaml"
k run warmup --image=nginx $do > /tmp/p.yaml
vim /tmp/p.yaml        # sửa vài field, dd, yy, p, u cho tay quen
k create deploy w1 --image=nginx --replicas=2 $do
k expose deploy w1 --port=80 $do
# Dừng ở đây. Bạn đã sẵn sàng.
\`\`\`

Vào phòng thi với tâm thế: 10 tuần luyện tập đã đưa mọi lệnh vào đầu ngón tay, điểm đậu là 66% — bạn **không cần hoàn hảo**, chỉ cần đều tay và đọc kỹ đề.

⚠️ **Lỗi thường gặp:** thức đến 1-2 giờ sáng "học nốt" → làm bài trong sương mù, tốc độ giảm 30% — thứ quyết định đậu/trượt của kỳ thi tốc độ; và mở một chủ đề *hoàn toàn mới* ngay trước giờ thi → chỉ thêm hoang mang, không thêm điểm.`,
      },
    ],
  },
];
