// Đề mock của chương trình CKA (spec mục 6, 12). Hình dạng: { id, title, durationMin,
//   questions: [{ id, domain, weight, context, text, solution }] } — check-data PR10.
// Id đề và id câu là khoá lưu tiến độ: đặt một lần, không đổi. Script dựng/chấm ở labs/cka/mocks/<id>/
// (setup.sh, score.sh; bảng TABLE của score.sh phải trùng id, domain, weight dưới đây — check-data PR11). `solution`
// của từng câu là cách làm của labs/cka/mocks/<id>/files/solve.sh (cùng lệnh; solve.sh chỉ thêm --dry-run | apply
// để chạy lại được và vòng chờ), mà s52/apply.sh (m1) và s53/apply.sh (m2) chạy và đòi 100/100.

const M1_ALL = "Mọi câu làm trên `cka-cp` (`multipass shell cka-cp`, user ubuntu, `kubectl`/`helm` sẵn), trừ khi câu ghi node khác. Tệp đáp án ghi vào `/opt/m1/` đúng tên câu yêu cầu.";
const M2_ALL = "Mọi câu làm trên `cka-cp` (`multipass shell cka-cp`, user ubuntu, `kubectl`/`kubeadm` sẵn), trừ khi câu ghi node khác. Tệp đáp án ghi vào `/opt/m2/` đúng tên câu yêu cầu. Cluster dùng chung cho cả 16 câu (đề thật mỗi câu một cluster): sự cố ở một câu có thể làm câu khác chưa làm được — đọc lướt hết đề trước.";

export const mocks = [
  {
    id: "m1",
    title: "Mock 1",
    durationMin: 120,
    questions: [
      {
        id: "q1",
        domain: "architecture",
        weight: 6,
        context: "cka-cp, namespace m1-q1",
        text: `${M1_ALL}

Một pipeline CI cần quyền triển khai trong namespace \`m1-q1\`, và chỉ ở đó.

1. Tạo ServiceAccount \`deployer\` trong \`m1-q1\`.
2. Tạo **Role** \`deployer\` trong \`m1-q1\` cho phép \`get\`, \`list\`, \`watch\`, \`create\`, \`update\`, \`patch\` trên \`deployments\` (nhóm \`apps\`) và \`get\`, \`list\` trên \`pods\`. Không cho thêm quyền nào khác.
3. Tạo RoleBinding \`deployer\` gắn Role đó cho ServiceAccount \`deployer\`.`,
        solution: `Thời gian mục tiêu: **5 phút**.

\`kubectl create role\` gán cùng một bộ verb cho mọi \`--resource\`, mà đề đòi hai bộ verb khác nhau: viết YAML hai rule (hay tạo bằng lệnh với deployments rồi \`k edit role\` thêm rule pods).

\`\`\`bash
k -n m1-q1 create sa deployer
k apply -f - <<'EOF'
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata: {name: deployer, namespace: m1-q1}
rules:
- apiGroups: ["apps"]
  resources: ["deployments"]
  verbs: ["get", "list", "watch", "create", "update", "patch"]
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata: {name: deployer, namespace: m1-q1}
roleRef: {apiGroup: rbac.authorization.k8s.io, kind: Role, name: deployer}
subjects:
- {kind: ServiceAccount, name: deployer, namespace: m1-q1}
EOF
# Kiểm bằng chính danh tính của SA, cả chiều "được" lẫn chiều "không được":
k auth can-i create deployments -n m1-q1 --as=system:serviceaccount:m1-q1:deployer   # yes
k auth can-i delete deployments -n m1-q1 --as=system:serviceaccount:m1-q1:deployer   # no
k auth can-i get secrets -n m1-q1 --as=system:serviceaccount:m1-q1:deployer          # no
\`\`\`

Chấm: SA (1), sáu verb trên deployments (1), get/list pods (1), **không thừa quyền** — delete deployments, get secrets, create pods, deployments ở namespace khác đều \`no\` (2, chỉ tính khi đủ quyền cần), RoleBinding trỏ \`kind: Role\` tên \`deployer\` (1). Gắn ClusterRole \`edit\` cho nhanh thì đủ quyền nhưng thừa: mất 3 điểm.`,
      },
      {
        id: "q2",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m1-q2",
        text: `${M1_ALL}

Deployment \`web\` trong \`m1-q2\` cần tự co giãn theo CPU.

1. Đặt \`resources.requests.cpu: 20m\` cho container của \`web\`.
2. Tạo HorizontalPodAutoscaler tên \`web\` cho Deployment \`web\`: tối thiểu 2, tối đa 4 replica, mục tiêu CPU trung bình **50%**.
3. HPA phải đọc được metric CPU (cột TARGETS không còn \`<unknown>\`).`,
        solution: `Thời gian mục tiêu: **4 phút**.

HPA tính phần trăm CPU **so với requests**: container không có \`requests.cpu\` thì HPA báo \`ScalingActive False … missing request for cpu\` và TARGETS là \`<unknown>\` mãi. Đặt requests trước, rồi tạo HPA.

\`\`\`bash
k -n m1-q2 set resources deploy/web --requests=cpu=20m
k -n m1-q2 autoscale deploy web --min=2 --max=4 --cpu=50%     # kubectl 1.37: --cpu thay cho --cpu-percent
k -n m1-q2 get hpa web -w            # ~1 phút sau: TARGETS cpu: 0%/50%, REPLICAS 2
k -n m1-q2 describe hpa web | grep -A3 Conditions
\`\`\`

Chấm: HPA trỏ Deployment web (1), min/max 2/4 (1), đúng một metric cpu Utilization 50 (1), Deployment có requests.cpu 20m và rollout xong (1), HPA \`ScalingActive=True\` có currentMetrics (1). Chỉ \`kubectl autoscale\` mà quên requests: 3/5.`,
      },
      {
        id: "q3",
        domain: "storage",
        weight: 5,
        context: "cka-cp, namespace m1-q3",
        text: `${M1_ALL}

1. Tạo StorageClass \`m1-fast\` dùng cùng provisioner với StorageClass mặc định của cluster, \`reclaimPolicy: Retain\`, \`volumeBindingMode: WaitForFirstConsumer\`. **Không** đặt nó làm lớp mặc định.
2. Trong \`m1-q3\`, tạo PVC \`cache\` 200Mi, \`ReadWriteOnce\`, dùng \`m1-fast\`.
3. Tạo Pod \`cache-writer\` (image \`busybox:1.37\`, chạy \`sleep\` lâu) gắn PVC \`cache\` vào \`/cache\`. PVC phải \`Bound\`.`,
        solution: `Thời gian mục tiêu: **6 phút**.

\`k get sc\` cho thấy lớp mặc định \`local-path\` (provisioner \`rancher.io/local-path\`). Với \`WaitForFirstConsumer\`, PVC đứng \`Pending\` (\`WaitForFirstConsumer\`) tới khi có Pod dùng nó — đó không phải lỗi; Pod được xếp lịch thì provisioner tạo PV trên đúng node đó.

\`\`\`bash
k apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: {name: m1-fast}
provisioner: rancher.io/local-path
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: cache, namespace: m1-q3}
spec:
  storageClassName: m1-fast
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 200Mi}}
---
apiVersion: v1
kind: Pod
metadata: {name: cache-writer, namespace: m1-q3}
spec:
  containers:
  - name: writer
    image: busybox:1.37
    command: ["sh", "-c", "date > /cache/started; while :; do sleep 3600; done"]
    volumeMounts: [{name: cache, mountPath: /cache}]
  volumes:
  - name: cache
    persistentVolumeClaim: {claimName: cache}
EOF
k -n m1-q3 get pvc cache        # Bound sau khi Pod được xếp lịch
\`\`\`

Chấm: provisioner + Retain (1), WaitForFirstConsumer và không mặc định (1), PVC đúng class/mode/200Mi (1), Bound (1), Pod Running gắn PVC ở /cache (1). \`reclaimPolicy\` mặc định là \`Delete\`: quên dòng đó mất 1 điểm.`,
      },
      {
        id: "q4",
        domain: "troubleshooting",
        weight: 8,
        context: "cka-cp, namespace m1-q4",
        text: `${M1_ALL}

1. Pod \`ingest\` trong \`m1-q4\` có hai container. Ghi **mọi dòng log chứa \`ERROR\` của container \`parser\`** (đúng các dòng đó, không thêm gì) vào \`/opt/m1/q4-errors.log\`.
2. Tìm Pod đang dùng nhiều CPU nhất trong namespace \`m1-q4\`. Ghi **tên Pod** (chỉ tên, một dòng) vào \`/opt/m1/q4-top.txt\`.`,
        solution: `Thời gian mục tiêu: **4 phút**.

\`k logs ingest\` không chọn container sẽ báo \`Defaulted container "app"\` và in log của container đầu tiên — mà \`app\` cũng có một dòng ERROR. Tên Pod không nói gì về CPU: \`cpu-burner\` bị giới hạn 40m, Pod ngốn nhất là Pod \`cache-…\`. Đọc số, đừng đọc tên.

\`\`\`bash
k -n m1-q4 logs ingest -c parser | grep ERROR > /opt/m1/q4-errors.log
k -n m1-q4 top pod --sort-by=cpu        # Pod mới cần ~1 phút mới có metrics
k -n m1-q4 top pod --sort-by=cpu --no-headers | head -n1 | awk '{print $1}' > /opt/m1/q4-top.txt
cat /opt/m1/q4-errors.log /opt/m1/q4-top.txt
\`\`\`

Chấm: mỗi tệp 4 điểm, đúng từng dòng; có đủ dòng ERROR mà lẫn dòng khác (\`--all-containers\`, quên \`grep\`) hay ghi \`m1-q4/<pod>\`, cả dòng của \`top\` thay vì chỉ tên: 2.`,
      },
      {
        id: "q5",
        domain: "networking",
        weight: 7,
        context: "cka-cp, namespace m1-q5",
        text: `${M1_ALL}

Trong \`m1-q5\` có Deployment \`api\` (nhãn \`app=api\`, nghe TCP 8080, sau Service \`api\`), \`client\` (\`app=client\`) và \`other\` (\`app=other\`).

Tạo NetworkPolicy \`api-ingress\` trong \`m1-q5\` sao cho Pod của \`api\` **chỉ** nhận kết nối TCP 8080 từ Pod mang nhãn \`app=client\` **trong chính namespace \`m1-q5\`**. Mọi nguồn khác tới \`api\` bị chặn. Không đổi Pod nào khác.`,
        solution: `Thời gian mục tiêu: **6 phút**.

Một phần tử \`from\` chỉ có \`podSelector\` nghĩa là "Pod khớp nhãn **trong namespace của policy**". Thêm \`namespaceSelector: {}\` cùng phần tử đó sẽ mở cho mọi Pod \`app=client\` ở mọi namespace — cluster này có một Pod như vậy ở \`m1-q14\`. Thử cả hai chiều trước khi đi tiếp.

\`\`\`bash
k apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: api-ingress, namespace: m1-q5}
spec:
  podSelector: {matchLabels: {app: api}}
  policyTypes: [Ingress]
  ingress:
  - from:
    - podSelector: {matchLabels: {app: client}}
    ports:
    - {protocol: TCP, port: 8080}
EOF
k -n m1-q5 exec deploy/client -- wget -qO- -T 2 http://api:8080/     # trả trang
k -n m1-q5 exec deploy/other  -- wget -qO- -T 2 http://api:8080/     # timed out
\`\`\`

Chấm: policy chọn \`app=api\`, loại Ingress (2); \`other\` bị chặn (2) và Pod \`app=client\` ở namespace khác bị chặn (1) — hai phần này chỉ tính khi \`client\` vẫn gọi được; \`client\` gọi được (2). \`from: [podSelector: {}]\` (cả namespace): 5/7.`,
      },
      {
        id: "q6",
        domain: "architecture",
        weight: 7,
        context: "cka-cp (etcd static pod)",
        text: `${M1_ALL}

1. Chụp snapshot etcd của cluster ra \`/opt/m1/etcd.db\` (endpoint \`https://127.0.0.1:2379\`; cert ở \`/etc/kubernetes/pki/etcd/\`).
2. **Không restore.** Ghi đúng một lệnh sẽ restore snapshot đó vào thư mục dữ liệu mới \`/var/lib/etcd-m1\` vào tệp \`/opt/m1/q6-restore.sh\`.`,
        solution: `Thời gian mục tiêu: **5 phút**.

Đường dẫn cert đọc từ chính manifest: \`sudo grep -E 'cert-file|key-file|trusted-ca-file' /etc/kubernetes/manifests/etcd.yaml\`. etcd 3.7: \`snapshot save\` vẫn ở \`etcdctl\` (nói chuyện với server), \`snapshot restore\`/\`status\` ở \`etcdutl\` (làm việc trên tệp).

\`\`\`bash
sudo etcdctl --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key \\
  snapshot save /opt/m1/etcd.db
sudo etcdutl snapshot status /opt/m1/etcd.db -w table
echo 'etcdutl snapshot restore /opt/m1/etcd.db --data-dir /var/lib/etcd-m1' > /opt/m1/q6-restore.sh
\`\`\`

Chấm: \`etcdutl snapshot status\` đọc được (3), revision của snapshot không cũ hơn lúc dựng đề — chép \`/opt/backup/etcd.db\` của s43 sang là 3/7 (2), tệp lệnh có \`snapshot restore\`, \`/opt/m1/etcd.db\`, \`--data-dir /var/lib/etcd-m1\` (2). Lỡ chạy restore cũng không sao (chỉ tạo thư mục mới), nhưng **đừng** sửa \`etcd.yaml\`: etcd của lab chạy từ \`/var/lib/etcd-restore\`.`,
      },
      {
        id: "q7",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m1-q7",
        text: `${M1_ALL}

Deployment \`shopfront\` trong \`m1-q7\` vừa được cập nhật lên một bản hỏng. Đội phát triển muốn quay về **bản có biến môi trường \`VERSION=v1\`** (không phải bản liền trước).

1. Tìm số revision của bản \`VERSION=v1\` và ghi số đó (chỉ con số) vào \`/opt/m1/q7-revision.txt\` **trước khi** rollback.
2. Rollback \`shopfront\` về đúng bản đó; mọi Pod chạy \`VERSION=v1\`.`,
        solution: `Thời gian mục tiêu: **5 phút**.

\`rollout undo\` không đối số quay về revision **liền trước** (ở đây là v2, không phải v1). Rollback xong, bản v1 được đánh số revision mới nhất và số cũ biến mất khỏi history — vì vậy đề bắt ghi số trước.

\`\`\`bash
k -n m1-q7 rollout history deploy/shopfront
for r in $(k -n m1-q7 rollout history deploy/shopfront | awk 'NR>2 && $1 ~ /^[0-9]+$/ {print $1}'); do
  echo "rev $r: $(k -n m1-q7 rollout history deploy/shopfront --revision=$r | grep VERSION)"
done
echo <số revision của v1> > /opt/m1/q7-revision.txt
k -n m1-q7 rollout undo deploy/shopfront --to-revision=<số đó>
k -n m1-q7 rollout status deploy/shopfront
\`\`\`

Chấm: template \`VERSION=v1\`, rollout xong, mọi Pod v1 (3); đúng số revision (2). \`rollout undo\` trần: 2/5 (về v2).`,
      },
      {
        id: "q8",
        domain: "troubleshooting",
        weight: 7,
        context: "cka-cp, namespace m1-q8",
        text: `${M1_ALL}

Service \`web\` trong \`m1-q8\` (cổng 80) không trả lời: \`curl http://<ClusterIP của web>\` từ cka-cp bị treo hay bị từ chối. Sửa Deployment \`web\` để Service trả trang của ConfigMap \`web-page\` với đủ 2 replica sẵn sàng.

Ràng buộc: không sửa Service, không sửa ConfigMap, **không xoá** readinessProbe (nó phải kiểm đúng cổng ứng dụng nghe).`,
        solution: `Thời gian mục tiêu: **7 phút**.

Hai lỗi chồng nhau. Lỗi thứ nhất hiện ngay (\`ImagePullBackOff\`: tag \`busybox:1.73\` không có). Sửa xong, Pod Running mà vẫn \`0/1\`: Events \`Readiness probe failed: … connect: connection refused\` vì probe gọi 8081, httpd nghe 8080. Pod chưa Ready thì không có trong EndpointSlice, Service không có đích.

\`\`\`bash
k -n m1-q8 describe pod -l app=web | grep -A5 Events
k -n m1-q8 set image deploy/web httpd=busybox:1.37
k -n m1-q8 get endpointslice -l kubernetes.io/service-name=web     # vẫn rỗng
k -n m1-q8 patch deploy web --type json \\
  -p '[{"op":"replace","path":"/spec/template/spec/containers/0/readinessProbe/httpGet/port","value":8080}]'
k -n m1-q8 rollout status deploy/web
curl -s http://$(k -n m1-q8 get svc web -o jsonpath='{.spec.clusterIP}')/
\`\`\`

Chấm: image \`busybox:1.37\` và 2 replica sẵn sàng (2), readinessProbe httpGet vào 8080 (2), curl Service trả trang (3). Xoá probe cho nhanh: 5/7.`,
      },
      {
        id: "q9",
        domain: "networking",
        weight: 7,
        context: "cka-cp, namespace m1-q9 (Gateway m1-gw có sẵn)",
        text: `${M1_ALL}

Trong \`m1-q9\` có Deployment \`echo\` (nhãn \`app=echo\`, container nghe 8080) và Gateway \`m1-gw\` (GatewayClass \`nginx\` của NGINX Gateway Fabric mà bạn cài ở s30, listener \`http\` cổng 8080, hostname \`echo.m1.lab\`).

1. Tạo Service \`echo\` kiểu ClusterIP, cổng **80**, chuyển tới cổng 8080 của Pod \`echo\`.
2. Tạo HTTPRoute \`echo\` gắn vào listener \`http\` của \`m1-gw\`, host \`echo.m1.lab\`, mọi đường dẫn (\`PathPrefix /\`) tới Service \`echo\` cổng 80.

Kiểm: \`curl -H 'Host: echo.m1.lab' http://<ClusterIP của Service m1-gw-nginx>:8080/\` trả trang của \`echo\`.`,
        solution: `Thời gian mục tiêu: **7 phút**.

NGF tạo data plane riêng cho mỗi Gateway, trong namespace của Gateway (\`m1-gw-nginx\`, Service NodePort cổng 8080). Đây là lý do đề cho Gateway riêng: HTTPRoute ở \`m1-q9\` không gắn được vào \`shop-gw\` của s30 (listener mặc định \`allowedRoutes: Same\`, và data plane của shop bị NetworkPolicy của s31 giới hạn egress). Đọc \`status.parents\` của route: \`Accepted\` (gắn được vào listener), \`ResolvedRefs\` (backend có thật).

\`\`\`bash
k -n m1-q9 expose deploy echo --name=echo --port=80 --target-port=8080
k apply -f - <<'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: {name: echo, namespace: m1-q9}
spec:
  parentRefs: [{name: m1-gw, sectionName: http}]
  hostnames: [echo.m1.lab]
  rules:
  - matches: [{path: {type: PathPrefix, value: /}}]
    backendRefs: [{name: echo, port: 80}]
EOF
k -n m1-q9 get httproute echo -o jsonpath='{range .status.parents[0].conditions[*]}{.type}={.status} {.reason}{"\\n"}{end}'
curl -s -H 'Host: echo.m1.lab' http://$(k -n m1-q9 get svc m1-gw-nginx -o jsonpath='{.spec.clusterIP}'):8080/
\`\`\`

Chấm: Service \`echo\` cổng 80 trả trang (3), route \`Accepted\` + \`ResolvedRefs\` (2), request qua data plane tới echo (2). Service đúng tên mà sai \`targetPort\`: route vẫn Accepted/ResolvedRefs (backend có thật) nhưng không có trang: 2/7.`,
      },
      {
        id: "q10",
        domain: "architecture",
        weight: 6,
        context: "cka-cp, namespace m1-q10",
        text: `${M1_ALL}

Chart Helm cục bộ ở \`/opt/m1/charts/notice\`. Cài release \`notice\` vào namespace \`m1-q10\` (tạo namespace nếu chưa có) với:

- \`replicaCount\` = 2
- \`service.port\` = 8088
- \`message\` = \`maintenance-2200\`

Service \`notice\` cổng 8088 phải trả đúng message đó.`,
        solution: `Thời gian mục tiêu: **5 phút**.

Đọc tên khoá trong chart trước (\`helm show values\`), đừng đoán. Đổi giá trị bằng Helm, không bằng \`kubectl scale/edit\`: Helm 4 dùng server-side apply, trường đã bị \`kubectl\` sửa sẽ làm \`helm upgrade\` sau đó báo \`conflict\` (s46).

\`\`\`bash
helm show values /opt/m1/charts/notice
helm install notice /opt/m1/charts/notice -n m1-q10 --create-namespace \\
  --set replicaCount=2 --set service.port=8088 --set message=maintenance-2200 --wait
helm -n m1-q10 get values notice
curl -s http://$(k -n m1-q10 get svc notice -o jsonpath='{.spec.clusterIP}'):8088/
\`\`\`

Cài nhầm giá trị thì \`helm upgrade notice /opt/m1/charts/notice -n m1-q10 --reuse-values --set …\`, không cần gỡ.

Chấm: release \`deployed\` từ chart notice (1), Deployment 2 replica sẵn sàng (2), Service cổng 8088 (1), curl trả \`maintenance-2200\` (2). Cài với giá trị mặc định: 1/6.`,
      },
      {
        id: "q11",
        domain: "storage",
        weight: 5,
        context: "cka-cp, namespace m1-q11",
        text: `${M1_ALL}

1. PersistentVolume \`m1-old\` (có sẵn) đang \`reclaimPolicy: Delete\`. Đổi sang \`Retain\`.
2. Tạo PersistentVolume \`m1-data\`: 128Mi, \`ReadWriteOnce\`, \`hostPath\` \`/srv/m1-data\`, \`storageClassName: m1-manual\`, \`Retain\`.
3. Tạo PVC \`data\` trong \`m1-q11\`: 100Mi, \`ReadWriteOnce\`, gắn với PV \`m1-data\` (không phải PV khác). PVC phải \`Bound\` ngay, không cần Pod.`,
        solution: `Thời gian mục tiêu: **5 phút**.

Bẫy: PVC không ghi \`storageClassName\` thì admission gán **lớp mặc định** (\`local-path\`, WaitForFirstConsumer) — PVC đứng Pending và không bao giờ khớp PV tĩnh. PV tĩnh chỉ bind với PVC cùng \`storageClassName\`; \`volumeName\` ghim đúng PV.

\`\`\`bash
k patch pv m1-old -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'
k apply -f - <<'EOF'
apiVersion: v1
kind: PersistentVolume
metadata: {name: m1-data}
spec:
  capacity: {storage: 128Mi}
  accessModes: [ReadWriteOnce]
  persistentVolumeReclaimPolicy: Retain
  storageClassName: m1-manual
  hostPath: {path: /srv/m1-data, type: DirectoryOrCreate}
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: data, namespace: m1-q11}
spec:
  storageClassName: m1-manual
  volumeName: m1-data
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 100Mi}}
EOF
k get pv m1-old m1-data; k -n m1-q11 get pvc data
\`\`\`

Chấm: m1-old Retain (1), PV m1-data đủ năm trường (2), PVC đúng class, 100Mi, Bound vào m1-data (2). PVC quên \`storageClassName\`: Pending ở \`local-path\`, 3/5.`,
      },
      {
        id: "q12",
        domain: "troubleshooting",
        weight: 8,
        context: "cka-cp, namespace m1-q12; node cka-w1 (multipass shell cka-w1)",
        text: `Trong \`m1-q12\` có hai Deployment cùng spec: \`dns-probe\` (ghim \`cka-w1\`) và \`dns-probe-w2\` (ghim \`cka-w2\`). Pod của \`dns-probe-w2\` Ready; Pod của \`dns-probe\` không bao giờ Ready vì không phân giải được tên nào. Mọi node đều \`Ready\`.

Tìm nguyên nhân **ở cấp node** trên \`cka-w1\` (vào node bằng \`multipass shell cka-w1\` từ máy Mac) và sửa tận gốc, bền qua lần khởi động lại: sửa đúng tệp cấu hình, không thêm cờ dòng lệnh, không sửa Deployment, không sửa CoreDNS. Sau đó Pod của \`dns-probe\` trên \`cka-w1\` phải Ready.`,
        solution: `Thời gian mục tiêu: **7 phút**.

Cùng spec, khác node, một bên hỏng: lỗi nằm ở node. \`/etc/resolv.conf\` của Pod do **kubelet của node** viết lúc tạo Pod, \`nameserver\` lấy từ \`clusterDNS\` trong \`/var/lib/kubelet/config.yaml\`. Ở \`cka-w1\` nó trỏ một IP không có Service nào, nên mọi truy vấn hết giờ (\`connection timed out; no servers could be reached\`), còn CoreDNS hoàn toàn khoẻ. kubelet chỉ đọc tệp lúc khởi động, và Pod đang chạy giữ resolv.conf cũ: sửa xong phải restart kubelet **và** tạo lại Pod.

\`\`\`bash
k -n m1-q12 get pod -o wide                       # dns-probe 0/1 trên cka-w1, dns-probe-w2 1/1
k -n m1-q12 logs deploy/dns-probe --tail=2        # dns FAIL: kubernetes.default.svc.cluster.local
k -n m1-q12 exec deploy/dns-probe -- cat /etc/resolv.conf      # nameserver 10.96.0.100
k -n m1-q12 exec deploy/dns-probe-w2 -- cat /etc/resolv.conf   # nameserver 10.96.0.10
k -n kube-system get svc kube-dns                 # 10.96.0.10
# trên cka-w1:
sudo grep -A1 clusterDNS /var/lib/kubelet/config.yaml          # - 10.96.0.100
sudo sed -i '/^clusterDNS:/{n;s/^- .*/- 10.96.0.10/;}' /var/lib/kubelet/config.yaml
sudo systemctl restart kubelet && systemctl is-active kubelet
# trên cka-cp:
k get --raw /api/v1/nodes/cka-w1/proxy/configz | grep -o '"clusterDNS":[^]]*]'
k -n m1-q12 rollout restart deploy/dns-probe && k -n m1-q12 rollout status deploy/dns-probe
\`\`\`

Chấm: kubelet đang chạy với \`clusterDNS\` = ClusterIP của kube-dns (đọc \`configz\`) (3), \`config.yaml\` đúng bản kubeadm và không có \`--cluster-dns\` trong \`/etc/default/kubelet\` (2), Pod \`dns-probe\` trên cka-w1 Ready với nameserver kube-dns (3). Sửa tệp mà quên restart kubelet: 2/8; restart mà không tạo lại Pod: 5/8; vá bằng cờ \`--cluster-dns\`: 6/8.`,
      },
      {
        id: "q13",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m1-q13",
        text: `${M1_ALL}

Tạo Pod \`logger\` trong \`m1-q13\` (image \`busybox:1.37\` cho mọi container):

- container chính \`app\`: cứ 2 giây ghi một dòng có ngày giờ vào \`/var/log/app/app.log\`;
- **sidecar native** \`shipper\`: chạy suốt vòng đời Pod, \`tail -F /var/log/app/app.log\` ra stdout;
- hai container dùng chung một volume \`emptyDir\` tên \`logs\` gắn ở \`/var/log/app\`.

\`kubectl logs logger -c shipper\` phải in các dòng mà \`app\` ghi.`,
        solution: `Thời gian mục tiêu: **6 phút**.

Sidecar native (stable từ 1.33) là một phần tử của \`initContainers\` có \`restartPolicy: Always\`: kubelet khởi động nó trước container chính, không chờ nó thoát, và chạy lại nếu nó chết. Đặt \`shipper\` vào \`containers\` cũng "chạy được" nhưng không phải sidecar native (không có thứ tự khởi động, không \`restartPolicy\` riêng).

\`\`\`bash
k apply -f - <<'EOF'
apiVersion: v1
kind: Pod
metadata: {name: logger, namespace: m1-q13}
spec:
  initContainers:
  - name: shipper
    image: busybox:1.37
    restartPolicy: Always
    command: ["sh", "-c", "touch /var/log/app/app.log; tail -F /var/log/app/app.log"]
    volumeMounts: [{name: logs, mountPath: /var/log/app}]
  containers:
  - name: app
    image: busybox:1.37
    command: ["sh", "-c", "while :; do echo \\"$(date) app tick\\" >> /var/log/app/app.log; sleep 2; done"]
    volumeMounts: [{name: logs, mountPath: /var/log/app}]
  volumes:
  - name: logs
    emptyDir: {}
EOF
k -n m1-q13 get pod logger        # READY 2/2: sidecar được đếm
k -n m1-q13 logs logger -c shipper --tail=3
\`\`\`

Chấm: Pod Running/Ready (1), \`shipper\` trong initContainers với \`restartPolicy: Always\` (2), emptyDir chung (1), log của shipper có dòng (1). Sidecar viết như container thường: 3/5.`,
      },
      {
        id: "q14",
        domain: "networking",
        weight: 6,
        context: "cka-cp, namespace kube-system và m1-q14",
        text: `${M1_ALL}

Ứng dụng cũ gọi máy chủ \`legacy.m1.lab\`. Cấu hình **CoreDNS** của cluster để mọi Pod phân giải \`legacy.m1.lab\` ra **ClusterIP của Service \`backend\`** trong \`m1-q14\`.

Mọi tên đang phân giải được (\`*.svc.cluster.local\`, \`db.shop.internal\` của s28, tên ngoài cluster) phải vẫn phân giải được. Kiểm từ Pod \`dns-client\` trong \`m1-q14\`.`,
        solution: `Thời gian mục tiêu: **6 phút**.

Corefile đã có khối \`hosts\` (s28) với \`fallthrough\`: thêm một dòng vào đó là đủ. Cách khác đúng: \`rewrite name legacy.m1.lab backend.m1-q14.svc.cluster.local\` (theo tên, không ghim IP). Plugin \`reload\` nạp Corefile mới sau ~30–60 giây, không cần restart CoreDNS; Corefile sai cú pháp thì CoreDNS giữ bản cũ và ghi lỗi trong log.

\`\`\`bash
k -n m1-q14 get svc backend -o jsonpath='{.spec.clusterIP}'
k -n kube-system edit cm coredns
#    hosts {
#       10.97.21.15 db.shop.internal
#       <ClusterIP của backend> legacy.m1.lab
#       fallthrough
#    }
k -n kube-system logs -l k8s-app=kube-dns --tail=5     # Reloading … Reloading complete
k -n m1-q14 exec deploy/dns-client -- nslookup legacy.m1.lab
k -n m1-q14 exec deploy/dns-client -- nslookup catalog.shop.svc.cluster.local
\`\`\`

Chấm: \`legacy.m1.lab\` ra đúng ClusterIP của backend (3), \`catalog.shop.svc.cluster.local\` và \`db.shop.internal\` vẫn phân giải (2), Corefile có \`m1.lab\` và CoreDNS sẵn sàng (1); hai phần sau chỉ tính khi Corefile đã đổi. Ghi IP của Pod backend thay cho ClusterIP: 3/6.`,
      },
      {
        id: "q15",
        domain: "architecture",
        weight: 6,
        context: "cka-cp; node cka-w2 (chỉ đọc)",
        text: `${M1_ALL}

1. Ghi tên đầy đủ của **mọi CRD do cert-manager cài** (tên kết thúc bằng \`cert-manager.io\`), mỗi dòng một tên, vào \`/opt/m1/q15-crds.txt\`.
2. Dùng \`kubectl\`, lấy tài liệu của trường \`spec.subject\` của custom resource \`Certificate\` (cert-manager) ghi vào \`/opt/m1/q15-subject.txt\`.
3. Ghi endpoint container runtime (CRI) mà kubelet của \`cka-w2\` dùng vào \`/opt/m1/q15-cri.txt\` (một dòng).
4. Ghi tên tệp cấu hình CNI mà \`cka-w2\` dùng (tệp đầu tiên theo thứ tự tên trong \`/etc/cni/net.d/\`) vào \`/opt/m1/q15-cni.txt\`.`,
        solution: `Thời gian mục tiêu: **6 phút**.

CRD của cert-manager có hai nhóm (\`cert-manager.io\` và \`acme.cert-manager.io\`): lọc theo hậu tố, đừng đếm tay. \`kubectl explain\` đọc schema OpenAPI của CRD như với kiểu có sẵn. Runtime endpoint là trường \`containerRuntimeEndpoint\` của cấu hình kubelet — đọc qua API (\`configz\`) hay trên node; CNI: kubelet/containerd lấy tệp đầu tiên theo thứ tự tên trong \`/etc/cni/net.d/\`.

\`\`\`bash
k get crd -o name | grep 'cert-manager\\.io$' | cut -d/ -f2 > /opt/m1/q15-crds.txt
k explain certificates.spec.subject > /opt/m1/q15-subject.txt
k get --raw /api/v1/nodes/cka-w2/proxy/configz | python3 -c \\
  'import json,sys; print(json.load(sys.stdin)["kubeletconfig"]["containerRuntimeEndpoint"])' > /opt/m1/q15-cri.txt
# CNI: trên cka-w2 (multipass shell cka-w2) chạy sudo ls /etc/cni/net.d, hay từ cka-cp:
k debug node/cka-w2 --image=busybox:1.37 --profile=general -- ls /host/etc/cni/net.d   # in tên Pod debug
k logs <pod debug>        # 10-calico.conflist, calico-kubeconfig
echo 10-calico.conflist > /opt/m1/q15-cni.txt
k delete pod <pod debug>
\`\`\`

Chấm: đúng tập CRD, không dòng thừa (2) — dán nguyên \`k get crd | grep cert-manager\` (có cột CREATED AT) là 0; tài liệu có đủ các trường con của subject (2); CRI (1; có hay không có \`unix://\` đều được); CNI (1).`,
      },
      {
        id: "q16",
        domain: "troubleshooting",
        weight: 7,
        context: "cka-cp, namespace m1-q16",
        text: `${M1_ALL}

Deployment \`worker\` trong \`m1-q16\` không có Pod nào chạy.

1. **Trước khi sửa**, ghi \`reason\` của Event Warning gần nhất của Pod \`worker\` (chỉ chuỗi reason) vào \`/opt/m1/q16-reason.txt\`.
2. Sửa để \`worker\` chạy đủ 2 replica: \`requests.cpu\` của container đặt **50m** (giữ nguyên requests memory, limits); container phải nhận biến \`MODE=batch\` từ ConfigMap \`worker-config\` mà nó đang tham chiếu (tạo ConfigMap, không bỏ tham chiếu).`,
        solution: `Thời gian mục tiêu: **6 phút**.

Lỗi lớp ngoài che lỗi lớp trong: Pod \`Pending\` (\`FailedScheduling … Insufficient cpu\`: xin 3 CPU, node có 2) nên chưa ai thấy ConfigMap thiếu. Hạ requests xong, Pod được xếp lịch rồi đứng \`CreateContainerConfigError\` (\`configmap "worker-config" not found\`).

\`\`\`bash
k -n m1-q16 get events --field-selector involvedObject.kind=Pod,type=Warning --sort-by=.lastTimestamp
k -n m1-q16 get events --field-selector involvedObject.kind=Pod,type=Warning --sort-by=.lastTimestamp \\
  -o jsonpath='{.items[-1:].reason}' > /opt/m1/q16-reason.txt          # FailedScheduling
k -n m1-q16 set resources deploy/worker --requests=cpu=50m
k -n m1-q16 get pod                      # CreateContainerConfigError
k -n m1-q16 create configmap worker-config --from-literal=MODE=batch
k -n m1-q16 rollout status deploy/worker
k -n m1-q16 exec deploy/worker -- printenv MODE      # batch
\`\`\`

Chấm: reason (1), requests.cpu 50m (1), ConfigMap \`MODE=batch\` và container vẫn \`envFrom\` nó (2), 2 replica sẵn sàng (2), \`MODE=batch\` trong Pod (1). Bỏ \`envFrom\` để Pod chạy: 4/7.`,
      },
    ],
  },
  {
    id: "m2",
    title: "Mock 2",
    durationMin: 120,
    questions: [
      {
        id: "q1",
        domain: "troubleshooting",
        weight: 8,
        context: "cka-cp, namespace m2-q1 và kube-system (control plane)",
        text: `${M2_ALL}

Deployment \`nightly\` trong \`m2-q1\` vừa được tạo nhưng Pod của nó đứng \`Pending\`, và \`kubectl describe\` không có Event nào. Mọi node đều Ready.

1. Tìm nguyên nhân trong control plane và sửa tận gốc để Pod mới của cluster lại được xếp lịch. Không tạo namespace mới để "lách".
2. Ghi tên cờ dòng lệnh gây lỗi (chỉ tên cờ, dạng \`--tên-cờ\`, không kèm giá trị) vào \`/opt/m2/q1-flag.txt\`.`,
        solution: `Thời gian mục tiêu: **8 phút**.

Pod \`Pending\` **không có Event** nghĩa là chưa ai thử xếp lịch nó: không có \`FailedScheduling\` thì scheduler không làm việc (có \`FailedScheduling\` thì scheduler làm việc mà không node nào hợp). \`k -n kube-system get pod\` cho thấy \`kube-scheduler-cka-cp\` **Running và Ready** — bẫy của câu: Pod khoẻ không có nghĩa thành phần làm việc. Log nói thẳng lý do:

\`\`\`bash
k -n m2-q1 get pod; k -n m2-q1 describe pod -l app=nightly | tail -3      # Events: <none>
k -n kube-system get pod kube-scheduler-cka-cp                             # 1/1 Running
k -n kube-system logs kube-scheduler-cka-cp --tail=5
# leaderelection.go:… "Error initially creating lease lock" err="namespaces \\"kube-sytem\\" not found" lock="kube-sytem/kube-scheduler"
k -n kube-system get lease kube-scheduler        # RENEW cũ: không ai giữ lease
sudo grep -n leader-elect /etc/kubernetes/manifests/kube-scheduler.yaml
#   - --leader-elect=true
#   - --leader-elect-resource-namespace=kube-sytem      ← namespace gõ sai
echo -- --leader-elect-resource-namespace > /opt/m2/q1-flag.txt   # hay: printf '%s\\n' --leader-elect-resource-namespace
sudo cp /etc/kubernetes/manifests/kube-scheduler.yaml ~/kube-scheduler.yaml.bak   # sao lưu NGOÀI thư mục manifests
sudo sed -i '/--leader-elect-resource-namespace=/d' /etc/kubernetes/manifests/kube-scheduler.yaml
# kubelet thấy tệp đổi (~20 giây), tạo lại Pod tĩnh; scheduler giành lease kube-system/kube-scheduler rồi mới xếp lịch.
k -n kube-system get lease kube-scheduler -w     # HOLDER cka-cp_…, RENEW mới
k -n m2-q1 get pod -o wide                       # Running trên một worker
\`\`\`

Scheduler (như controller-manager) chạy leader election: chỉ bản giữ lease mới làm việc, các bản khác chờ — để HA có ba scheduler mà không xếp lịch đôi. Không giành được lease thì nó chờ mãi, healthz vẫn ok. Sửa giá trị thành \`kube-system\` cũng đúng; **tạo namespace \`kube-sytem\`** thì scheduler chạy lại nhưng manifest vẫn sai — 0 cho phần manifest và phần xếp lịch.

Chấm: tên cờ (1), manifest như bản kubeadm (hay chỉ thêm \`--leader-elect-resource-namespace=kube-system\`) (3), Pod \`nightly\` được xếp lịch và Ready (2), Pod scheduler Ready và giữ lease \`kube-system/kube-scheduler\` (2). Câu này đứng đầu đề vì mọi Pod **mới** của các câu khác (rollout, PVC chờ Pod, Job) đều cần scheduler.`,
      },
      {
        id: "q2",
        domain: "architecture",
        weight: 6,
        context: "cka-cp (đối tượng cluster-scoped, thư mục /opt/m2)",
        text: `${M2_ALL}

Một kiểm toán viên cần đọc Pod của mọi namespace bằng chứng chỉ riêng, không qua ServiceAccount.

1. Tạo khoá riêng \`/opt/m2/auditor.key\` và CertificateSigningRequest \`m2-auditor\` (signer \`kubernetes.io/kube-apiserver-client\`) cho user \`m2-auditor\` thuộc nhóm \`m2-audit\`. Duyệt nó, lưu cert vào \`/opt/m2/auditor.crt\`.
2. Tạo kubeconfig \`/opt/m2/auditor.kubeconfig\` (context \`m2-auditor\` là context hiện tại, trỏ apiserver của cluster) dùng ngay được: \`kubectl --kubeconfig /opt/m2/auditor.kubeconfig get pods -A\`.
3. Tạo ClusterRole \`m2-pod-reader\` (\`get\`, \`list\`, \`watch\` trên \`pods\`) và ClusterRoleBinding \`m2-auditor\` gắn nó cho **nhóm** \`m2-audit\`. Không thêm quyền nào khác.`,
        solution: `Thời gian mục tiêu: **8 phút**.

CN của cert là tên user, mỗi O là một nhóm. Gắn quyền cho **nhóm** (\`--group\`) để người thứ hai của đội kiểm toán chỉ cần một cert mới, không cần binding mới. Không đặt \`expirationSeconds\` ngắn: cert hết hạn thì kubeconfig chết theo.

\`\`\`bash
cd /opt/m2
openssl genrsa -out auditor.key 2048
openssl req -new -key auditor.key -subj "/CN=m2-auditor/O=m2-audit" -out auditor.csr
k apply -f - <<EOF
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata: {name: m2-auditor}
spec:
  request: $(base64 -w0 < auditor.csr)
  signerName: kubernetes.io/kube-apiserver-client
  usages: [client auth]
EOF
k certificate approve m2-auditor
k get csr m2-auditor -o jsonpath='{.status.certificate}' | base64 -d > auditor.crt
openssl x509 -in auditor.crt -noout -subject -issuer       # CN = m2-auditor, O = m2-audit; issuer CN = kubernetes
KC=/opt/m2/auditor.kubeconfig
k config set-cluster cka --server=$(k config view --minify -o jsonpath='{.clusters[0].cluster.server}') \\
  --certificate-authority=/etc/kubernetes/pki/ca.crt --embed-certs --kubeconfig=$KC
k config set-credentials m2-auditor --client-certificate=auditor.crt --client-key=auditor.key --embed-certs --kubeconfig=$KC
k config set-context m2-auditor --cluster=cka --user=m2-auditor --kubeconfig=$KC
k config use-context m2-auditor --kubeconfig=$KC
k create clusterrole m2-pod-reader --verb=get,list,watch --resource=pods
k create clusterrolebinding m2-auditor --clusterrole=m2-pod-reader --group=m2-audit
k --kubeconfig=$KC auth whoami                    # m2-auditor, Groups [m2-audit system:authenticated]
k --kubeconfig=$KC get pods -A | head -3
k --kubeconfig=$KC auth can-i get secrets -A      # no
\`\`\`

Chấm: CSR Approved có cert (1), cert CN/O đúng do CA cluster ký (1), kubeconfig \`whoami\` ra \`m2-auditor\` trong nhóm \`m2-audit\` (1), list được pods \`-A\` (1), không thừa quyền: delete pods, get secrets, list nodes, create deployments đều \`no\` (1, chỉ tính khi list được), ClusterRoleBinding trỏ ClusterRole \`m2-pod-reader\` cho Group \`m2-audit\` (1). Gắn cho \`--user=m2-auditor\` thì vẫn chạy nhưng mất điểm binding: 5/6.`,
      },
      {
        id: "q3",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m2-q3",
        text: `${M2_ALL}

Namespace \`m2-q3\` của một đội cần hạn mức.

1. Tạo ResourceQuota \`team-quota\`: \`pods: 4\`, \`requests.cpu: 200m\`, \`requests.memory: 256Mi\`, \`limits.memory: 512Mi\`.
2. Tạo LimitRange \`team-defaults\` (type \`Container\`): \`defaultRequest\` cpu \`25m\`, memory \`32Mi\`; \`default\` (limit) memory \`64Mi\`.
3. Pod của Deployment \`batch\` (có sẵn, không khai resources) phải chạy lại và nhận các mặc định đó — **không** thêm \`resources\` vào template của \`batch\`. 2 Pod Ready.
4. Ghi lượng \`requests.cpu\` mà quota đang tính là đã dùng (cột Used, ví dụ \`75m\`) vào \`/opt/m2/q3-used.txt\`.`,
        solution: `Thời gian mục tiêu: **6 phút**.

Quota có \`requests.cpu\`/\`limits.memory\` thì mọi Pod **mới** phải khai các trường đó, không thì bị từ chối lúc tạo (\`FailedCreate … must specify limits.memory\` ở Event của ReplicaSet — Deployment chỉ đứng yên). LimitRange điền mặc định **lúc admission**, nên phải có LimitRange trước khi tạo lại Pod; Pod đang chạy không bị đụng tới, vì vậy phải \`rollout restart\`.

\`\`\`bash
k -n m2-q3 create quota team-quota --hard=pods=4,requests.cpu=200m,requests.memory=256Mi,limits.memory=512Mi
k apply -f - <<'EOF'
apiVersion: v1
kind: LimitRange
metadata: {name: team-defaults, namespace: m2-q3}
spec:
  limits:
  - type: Container
    defaultRequest: {cpu: 25m, memory: 32Mi}
    default: {memory: 64Mi}
EOF
k -n m2-q3 rollout restart deploy/batch
k -n m2-q3 rollout status deploy/batch
k -n m2-q3 get pod -l app=batch -o jsonpath='{.items[*].spec.containers[0].resources}'
k -n m2-q3 describe quota team-quota          # requests.cpu  50m  200m
echo 50m > /opt/m2/q3-used.txt
\`\`\`

Chấm: quota đúng bốn giá trị (1), LimitRange đúng ba mặc định (1), 2 Pod \`batch\` Ready mang đúng mặc định và template không có \`resources\` (2), Used đúng (1). \`rollout restart\` trước khi có LimitRange: Pod mới bị quota từ chối, rollout kẹt — đọc \`k -n m2-q3 get events\`.`,
      },
      {
        id: "q4",
        domain: "storage",
        weight: 5,
        context: "cka-cp, namespace m2-q4 (StorageClass là cluster-scoped)",
        text: `${M2_ALL}

1. Tạo StorageClass \`m2-standard\`: provisioner \`rancher.io/local-path\`, \`reclaimPolicy: Delete\`, \`volumeBindingMode: WaitForFirstConsumer\`.
2. Đặt \`m2-standard\` làm StorageClass mặc định **duy nhất** của cluster.
3. Trong \`m2-q4\`, tạo PVC \`logs\` (64Mi, \`ReadWriteOnce\`) **không ghi** \`storageClassName\`, để Pod \`log-writer\` có sẵn chạy được.`,
        solution: `Thời gian mục tiêu: **5 phút**.

Lớp mặc định là annotation \`storageclass.kubernetes.io/is-default-class: "true"\`. Hai lớp cùng mặc định thì admission chọn lớp tạo gần nhất — đề đòi "duy nhất" nên phải tắt cờ trên \`local-path\`. Thứ tự quan trọng: PVC không ghi class được admission **điền class mặc định lúc tạo**, và \`storageClassName\` của PVC không đổi được sau đó — tạo PVC trước khi đổi mặc định thì nó mang \`local-path\` mãi, phải xoá tạo lại.

\`\`\`bash
k get sc                                         # local-path (default)
k apply -f - <<'EOF'
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: {name: m2-standard}
provisioner: rancher.io/local-path
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
EOF
k patch sc local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"false"}}}'
k patch sc m2-standard -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
k get sc                                         # chỉ m2-standard (default)
k apply -f - <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: logs, namespace: m2-q4}
spec:
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 64Mi}}
EOF
k -n m2-q4 get pvc logs                          # STORAGECLASS m2-standard, Bound khi log-writer được xếp lịch
\`\`\`

Chấm: \`m2-standard\` đúng provisioner/reclaim/binding mode (1), là mặc định (1), không còn lớp mặc định nào khác (1), PVC \`logs\` mang \`m2-standard\`, 64Mi, RWO, Bound (1), \`log-writer\` Running (1). Sau đề, lớp mặc định của lab là \`m2-standard\` (cùng provisioner, không ảnh hưởng shop); \`mock … m2 start\` lần sau đưa về \`local-path\`.`,
      },
      {
        id: "q5",
        domain: "networking",
        weight: 7,
        context: "cka-cp, namespace m2-q5 và m2-q5-db",
        text: `${M2_ALL}

Pod \`app=fetcher\` trong \`m2-q5\` chỉ được phép gọi ra kho dữ liệu.

Tạo NetworkPolicy \`fetcher-egress\` trong \`m2-q5\` sao cho Pod \`app=fetcher\`:

- **được** gửi tới Pod \`app=store\` trong namespace \`m2-q5-db\`, cổng TCP 8080;
- **được** phân giải DNS qua DNS của cluster (UDP và TCP 53);
- **không** gửi được tới đâu khác (kể cả Pod \`app=cache\` trong \`m2-q5-db\`).

Pod khác trong \`m2-q5\` không bị ảnh hưởng. Không tạo policy trong \`m2-q5-db\`.`,
        solution: `Thời gian mục tiêu: **7 phút**.

Policy chọn Pod và có \`policyTypes: [Egress]\` thì mọi egress của Pod đó bị chặn trừ những gì liệt kê. Hai bẫy: (1) \`namespaceSelector\` và \`podSelector\` **cùng một phần tử** \`to\` là "Pod store ở namespace m2-q5-db"; tách thành hai phần tử là "mọi Pod ở m2-q5-db **hoặc** Pod store ở chính m2-q5" — cache lọt qua; (2) quên DNS thì gọi theo tên chết mà gọi theo IP vẫn được — triệu chứng giống "Service hỏng".

\`\`\`bash
k get ns m2-q5-db --show-labels                   # kubernetes.io/metadata.name=m2-q5-db (nhãn tự có)
k -n kube-system get pod -l k8s-app=kube-dns
k apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata: {name: fetcher-egress, namespace: m2-q5}
spec:
  podSelector: {matchLabels: {app: fetcher}}
  policyTypes: [Egress]
  egress:
  - to:
    - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: m2-q5-db}}
      podSelector: {matchLabels: {app: store}}
    ports: [{protocol: TCP, port: 8080}]
  - to:
    - namespaceSelector: {matchLabels: {kubernetes.io/metadata.name: kube-system}}
      podSelector: {matchLabels: {k8s-app: kube-dns}}
    ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]
EOF
k -n m2-q5 exec deploy/fetcher -- wget -qO- -T 3 http://store.m2-q5-db:8080/    # trang store
k -n m2-q5 exec deploy/fetcher -- wget -qO- -T 3 http://cache.m2-q5-db:8080/    # timeout
k -n m2-q5 exec deploy/auditor -- wget -qO- -T 3 http://cache.m2-q5-db:8080/    # trang cache (Pod khác không bị chặn)
\`\`\`

Chấm: policy chọn \`app=fetcher\`, Egress (1); fetcher tới store theo ClusterIP (2) và theo tên — DNS mở (1); fetcher **không** tới cache (2, chỉ tính khi tới được store); Pod \`auditor\` vẫn tới cache (1). Các phép thử chỉ tính khi policy egress đã có. Mở cả namespace \`m2-q5-db\`: 5/7; quên DNS: 6/7.`,
      },
      {
        id: "q6",
        domain: "architecture",
        weight: 7,
        context: "cka-cp (etcd static pod — chỉ đọc; thư mục /var/lib/etcd-m2-check)",
        text: `${M2_ALL}

Bạn cần kiểm thử bản sao lưu etcd mà không đụng etcd đang chạy.

1. Ghi output của \`etcdctl member list\` (bảng hay mặc định) vào \`/opt/m2/q6-members.txt\`.
2. Bản sao lưu đêm qua nằm ở \`/opt/m2/etcd-backup.db\`. Ghi **revision** của nó (chỉ con số) vào \`/opt/m2/q6-revision.txt\`.
3. Khôi phục bản đó vào thư mục mới \`/var/lib/etcd-m2-check\` để kiểm thử. **Không** sửa \`/etc/kubernetes/manifests/etcd.yaml\`, không dừng hay đổi data-dir của etcd đang chạy.`,
        solution: `Thời gian mục tiêu: **6 phút**.

\`etcdctl\` nói chuyện với server (cần endpoint và cert, đọc từ \`etcd.yaml\`); \`etcdutl\` làm việc trên **tệp**: \`snapshot status\` đọc revision, \`snapshot restore\` dựng một data-dir mới (\`member/snap/db\`, \`member/wal\`) — không khởi động etcd nào, không đụng etcd đang chạy. Restore thử vào thư mục riêng là cách kiểm một bản sao lưu có dùng được không trước ngày cần nó.

\`\`\`bash
sudo grep -E 'cert-file|key-file|trusted-ca-file|data-dir' /etc/kubernetes/manifests/etcd.yaml
P=/etc/kubernetes/pki/etcd
sudo etcdctl --endpoints=https://127.0.0.1:2379 --cacert=$P/ca.crt --cert=$P/server.crt --key=$P/server.key \\
  member list -w table > /opt/m2/q6-members.txt
sudo etcdutl snapshot status /opt/m2/etcd-backup.db -w table      # HASH | REVISION | TOTAL KEYS | …
echo <REVISION> > /opt/m2/q6-revision.txt
sudo etcdutl snapshot restore /opt/m2/etcd-backup.db --data-dir /var/lib/etcd-m2-check
sudo ls /var/lib/etcd-m2-check/member             # snap  wal
sudo etcdutl snapshot status /var/lib/etcd-m2-check/member/snap/db -w table   # cùng revision
\`\`\`

Chấm: tệp member list có ID (hex), tên và peer URL của member (2); revision đúng của \`etcd-backup.db\` (2) — đọc revision của etcd đang chạy (\`endpoint status\`) là sai, nó đã đi tiếp; thư mục khôi phục có \`member/snap/db\` cùng revision với bản sao lưu và \`member/wal\` (2); etcd đang chạy vẫn \`--data-dir=/var/lib/etcd-restore\` và healthy (1, chỉ tính khi đã khôi phục). Chụp snapshot mới rồi khôi phục bản đó: 5/7.`,
      },
      {
        id: "q7",
        domain: "troubleshooting",
        weight: 8,
        context: "cka-cp, namespace m2-q7",
        text: `${M2_ALL}

Deployment \`importer\` trong \`m2-q7\` không bao giờ sẵn sàng, Pod của nó restart liên tục.

1. **Trước khi sửa**, ghi **exit code** lần kết thúc gần nhất của container \`loader\` (chỉ con số) vào \`/opt/m2/q7-exitcode.txt\`.
2. **Trước khi sửa**, ghi dòng log **cuối cùng** của lần chạy trước của \`loader\` vào \`/opt/m2/q7-last.log\`.
3. Sửa: \`limits.memory\` của container \`loader\` đặt **64Mi**, giữ nguyên requests của nó và mọi thứ của container \`proxy\`. \`importer\` phải Available, Service \`importer\` trả trang.`,
        solution: `Thời gian mục tiêu: **7 phút**.

Pod hai container, \`RESTARTS\` tăng, \`describe\` cho thấy \`loader\`: \`Last State: Terminated, Reason: OOMKilled, Exit Code: 137\`. Exit code 137 = 128 + 9: tiến trình bị \`SIGKILL\` — ở đây do kernel giết khi cgroup của container vượt \`limits.memory\`. Đề hỏi exit code chứ không hỏi reason vì reason **có lúc là \`Error\`** dù đúng là OOM (containerd nhận sự kiện "tiến trình thoát" trước sự kiện OOM: đo 2/6 lần trên lab); 137 cộng limits 16Mi cộng log kernel trên node (\`journalctl -k | grep -i "out of memory"\`) mới là bằng chứng chắc. Log hiện tại của container đang chờ restart thường rỗng hay chỉ có phần đầu; \`--previous\` là log của lần chạy vừa chết — dòng cuối là bước nó đang làm khi bị giết.

\`\`\`bash
k -n m2-q7 get pod -l app=importer
k -n m2-q7 describe pod -l app=importer | grep -A6 'loader:' | grep -E 'State|Reason|Exit|Limits'
k -n m2-q7 get pod -l app=importer -o jsonpath='{.items[0].status.containerStatuses[?(@.name=="loader")].lastState.terminated.exitCode}' > /opt/m2/q7-exitcode.txt   # 137
k -n m2-q7 logs deploy/importer -c loader --previous | tail -n1 > /opt/m2/q7-last.log   # importer: loading chunk …-20mb
k -n m2-q7 set resources deploy/importer -c loader --limits=memory=64Mi    # -c: chỉ container loader
k -n m2-q7 rollout status deploy/importer
k -n m2-q7 get pod -l app=importer                 # 2/2 Running, RESTARTS 0
k -n m2-q7 run t --rm -i --image=busybox:1.37 --restart=Never -- wget -qO- http://importer
\`\`\`

\`kubectl set resources\` không có \`-c\` sửa **mọi** container — \`proxy\` cũng nhận 64Mi: mất 2 điểm. Một container OOM không làm cả Pod chết, nhưng Pod chỉ Ready khi mọi container Ready.

Chấm: exit code \`137\` (2), đúng dòng log cuối của lần chạy trước (1), \`loader\` limits 64Mi, requests và \`proxy\` giữ nguyên (2), Available với Pod mới Ready, không bị OOM kill lần nào (2, chỉ khi resources đúng), Service trả trang (1).`,
      },
      {
        id: "q8",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m2-q8",
        text: `${M2_ALL}

Tạo CronJob \`rotate\` trong \`m2-q8\`:

- lịch \`*/30 * * * *\`, \`concurrencyPolicy: Forbid\`, giữ tối đa 2 Job thành công và 1 Job lỗi;
- Job: \`backoffLimit: 1\`, \`activeDeadlineSeconds: 60\`;
- container \`rotate\` (image \`busybox:1.37\`) chạy \`echo rotate $TARGET\`, với biến \`TARGET\` lấy từ key \`target\` của ConfigMap \`rotate-config\` có sẵn;
- CronJob ở trạng thái **tạm dừng** (\`suspend: true\`).

Rồi chạy thử ngay bằng Job \`rotate-manual\` tạo **từ** CronJob đó. Job phải Complete.`,
        solution: `Thời gian mục tiêu: **5 phút**.

\`kubectl create cronjob\` không có cờ cho history limit, deadline hay env từ ConfigMap: tạo khung bằng lệnh rồi sửa YAML. \`backoffLimit\`/\`activeDeadlineSeconds\` nằm ở \`jobTemplate.spec\` (của Job), \`concurrencyPolicy\`/\`suspend\`/history ở \`spec\` của CronJob. \`suspend\` chỉ chặn lịch: \`create job --from\` vẫn chạy được.

\`\`\`bash
k -n m2-q8 create cronjob rotate --image=busybox:1.37 --schedule='*/30 * * * *' $do -- sh -c 'echo rotate $TARGET' > rotate.yaml
# sửa rotate.yaml thành:
apiVersion: batch/v1
kind: CronJob
metadata: {name: rotate, namespace: m2-q8}
spec:
  schedule: "*/30 * * * *"
  suspend: true
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 1
      activeDeadlineSeconds: 60
      template:
        spec:
          restartPolicy: Never
          containers:
          - name: rotate
            image: busybox:1.37
            command: ["sh", "-c", "echo rotate $TARGET"]
            env:
            - name: TARGET
              valueFrom: {configMapKeyRef: {name: rotate-config, key: target}}
k apply -f rotate.yaml
k -n m2-q8 create job rotate-manual --from=cronjob/rotate
k -n m2-q8 wait job rotate-manual --for=condition=Complete
k -n m2-q8 logs job/rotate-manual                  # rotate bucket-…
\`\`\`

Chấm: lịch, \`Forbid\`, \`suspend: true\` (1); history 2/1, \`backoffLimit\` 1, \`activeDeadlineSeconds\` 60 (1); env \`TARGET\` từ \`rotate-config\`/\`target\` (1); Job \`rotate-manual\` tạo từ CronJob (annotation \`cronjob.kubernetes.io/instantiate: manual\`) và Complete (1); log có \`rotate <target>\` (1). Viết Job riêng cùng tên thay cho \`--from\`: 4/5.`,
      },
      {
        id: "q9",
        domain: "networking",
        weight: 7,
        context: "cka-cp, namespace m2-q9 (Gateway m2-gw có sẵn)",
        text: `${M2_ALL}

Namespace \`m2-q9\` có Gateway \`m2-gw\` (GatewayClass \`nginx\`, listener \`http\` cổng 8080, host \`app.m2.lab\`) và hai Service \`web-v1\`, \`web-v2\` (cổng 80).

Tạo HTTPRoute \`web\` gắn listener \`http\` của \`m2-gw\` cho host \`app.m2.lab\`:

1. request có header \`X-Canary: always\` → \`web-v2\`;
2. request tới đường dẫn \`/old\` → trả **redirect 301** về đường dẫn \`/\`;
3. mọi request khác → \`web-v1\`.

Kiểm qua data plane của Gateway (Service \`m2-gw-nginx\`, cổng 8080).`,
        solution: `Thời gian mục tiêu: **7 phút**.

Một HTTPRoute nhiều \`rules\`; mỗi rule có \`matches\` (path, header, method…) và \`backendRefs\` hay \`filters\`. Rule có header match cụ thể hơn rule không match nên thắng, bất kể thứ tự viết. Redirect là \`filter\` \`RequestRedirect\` — rule đó không có backend.

\`\`\`bash
k -n m2-q9 get gateway m2-gw; k -n m2-q9 get svc
k apply -f - <<'EOF'
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata: {name: web, namespace: m2-q9}
spec:
  parentRefs: [{name: m2-gw, sectionName: http}]
  hostnames: [app.m2.lab]
  rules:
  - matches: [{path: {type: PathPrefix, value: /old}}]
    filters:
    - type: RequestRedirect
      requestRedirect: {path: {type: ReplaceFullPath, replaceFullPath: /}, statusCode: 301}
  - matches: [{headers: [{name: X-Canary, value: always}]}]
    backendRefs: [{name: web-v2, port: 80}]
  - backendRefs: [{name: web-v1, port: 80}]
EOF
k -n m2-q9 get httproute web -o jsonpath='{.status.parents[0].conditions[*].type}'   # Accepted ResolvedRefs
GW=$(k -n m2-q9 get svc m2-gw-nginx -o jsonpath='{.spec.clusterIP}')
curl -s -H 'Host: app.m2.lab' http://$GW:8080/                        # web-v1-…
curl -s -H 'Host: app.m2.lab' -H 'X-Canary: always' http://$GW:8080/  # web-v2-…
curl -sI -H 'Host: app.m2.lab' http://$GW:8080/old | head -3          # 301, Location: http://app.m2.lab:8080/
\`\`\`

Chấm: route Accepted + ResolvedRefs (1), request thường → v1 (2), header → v2 và request thường không lọt sang v2 (2), \`/old\` → 301 về \`/\` (2). Data plane nạp route sau vài giây: kiểm bằng curl, không chỉ bằng \`status\`.`,
      },
      {
        id: "q10",
        domain: "architecture",
        weight: 6,
        context: "cka-cp, namespace m2-q10, thư mục /opt/m2/kustomize",
        text: `${M2_ALL}

\`/opt/m2/kustomize/base\` có Deployment \`api\`, Service \`api\` và \`configMapGenerator\` \`api-config\` (\`MODE=dev\`).

Tạo overlay \`/opt/m2/kustomize/overlays/prod/kustomization.yaml\` dùng base đó, rồi áp bằng \`kubectl apply -k\`:

- namespace \`m2-q10\`, \`namePrefix: prod-\`;
- nhãn \`env: prod\` trên mọi đối tượng **và trong selector**;
- \`api\` chạy 2 replica;
- \`MODE\` của ConfigMap \`api-config\` thành \`prod\` (gộp vào generator của base, không viết ConfigMap tay).

Không sửa thư mục \`base\`.`,
        solution: `Thời gian mục tiêu: **7 phút**.

Kustomize đổi tên (\`prod-api\`, \`prod-api-config-<hash>\`) **và sửa mọi chỗ tham chiếu** tới tên đó (\`envFrom.configMapRef\` của Deployment) — vì vậy không viết ConfigMap tay. Hash đổi khi nội dung đổi, nên đổi \`MODE\` là Deployment rollout lại. \`labels\` với \`includeSelectors: true\` (hay \`commonLabels\` cũ) gắn nhãn cả vào selector của Deployment và Service.

\`\`\`bash
mkdir -p /opt/m2/kustomize/overlays/prod
cat > /opt/m2/kustomize/overlays/prod/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: m2-q10
namePrefix: prod-
resources:
- ../../base
labels:
- pairs: {env: prod}
  includeSelectors: true
replicas:
- name: api
  count: 2
configMapGenerator:
- name: api-config
  behavior: merge
  literals:
  - MODE=prod
EOF
k kustomize /opt/m2/kustomize/overlays/prod | less     # xem trước: prod-api, prod-api-config-<hash>, env: prod
k apply -k /opt/m2/kustomize/overlays/prod
k -n m2-q10 rollout status deploy/prod-api
k -n m2-q10 exec deploy/prod-api -- printenv MODE        # prod
\`\`\`

Chấm: overlay build được và base không đổi (1); \`prod-api\` 2 replica sẵn sàng, Pod mang \`env=prod\` (2); Service \`prod-api\` chọn \`env=prod\` và có 2 endpoint (1); Pod dùng \`prod-api-config-<hash>\` và \`MODE=prod\` (2). \`behavior: merge\` thiếu thì kustomize báo trùng tên generator.`,
      },
      {
        id: "q11",
        domain: "troubleshooting",
        weight: 7,
        context: "cka-cp, namespace m2-q11",
        text: `${M2_ALL}

Pod của Deployment \`frontend\` trong \`m2-q11\` gọi \`http://orders\` (cổng 80) thì lỗi, dù Pod \`orders\` đang Running và Ready.

Sửa **Service** \`orders\` để \`frontend\` nhận được trang của \`orders\`. Không sửa Deployment \`orders\` (nhãn, cổng, replica giữ nguyên).`,
        solution: `Thời gian mục tiêu: **5 phút**.

Service không trả lời mà Pod khoẻ: xem **EndpointSlice** trước. Rỗng → selector không khớp nhãn Pod; có địa chỉ mà vẫn lỗi → \`targetPort\`. Ở đây cả hai: selector \`app: order\` (Pod là \`app: orders\`) và \`targetPort: http\` trong khi cổng của container tên \`api\` (9090). \`targetPort\` dạng tên được tra trong \`ports[].name\` của **container** — tên không có thì endpoint không có cổng.

\`\`\`bash
k -n m2-q11 get endpointslice -l kubernetes.io/service-name=orders    # ENDPOINTS <unset>
k -n m2-q11 get svc orders -o yaml | grep -A3 -E 'selector|ports'
k -n m2-q11 get pod --show-labels                                     # app=orders,tier=backend
k -n m2-q11 get deploy orders -o jsonpath='{.spec.template.spec.containers[0].ports}'   # name api, 9090
k -n m2-q11 patch svc orders --type merge \\
  -p '{"spec":{"selector":{"app":"orders","tier":"backend"},"ports":[{"name":"http","port":80,"targetPort":"api"}]}}'
k -n m2-q11 get endpointslice -l kubernetes.io/service-name=orders    # <IP Pod>:9090
k -n m2-q11 exec deploy/frontend -- wget -qO- http://orders           # orders-…
\`\`\`

Chấm: endpoint đúng các Pod \`orders\` (2), cổng 9090 (1), \`frontend\` nhận trang (3), Deployment \`orders\` không bị sửa (1, chỉ khi đã nhận trang). Đổi nhãn Pod cho khớp Service thì chạy được nhưng sai đề: mất điểm cuối.`,
      },
      {
        id: "q12",
        domain: "storage",
        weight: 5,
        context: "cka-cp, namespace m2-q12 (PV là cluster-scoped)",
        text: `${M2_ALL}

PV \`m2-archive\` (\`Retain\`, lớp \`m2-archive\`) chứa báo cáo tháng trước; PVC cũ của nó đã bị xoá. Pod \`reporter\` trong \`m2-q12\` đang chờ PVC \`archive\`.

Tạo PVC \`archive\` (lớp \`m2-archive\`, 64Mi, \`ReadWriteOnce\`) gắn đúng vào PV \`m2-archive\`, sao cho \`reporter\` chạy và đọc được báo cáo cũ ở \`/data/report.txt\`. **Không** xoá hay tạo lại PV.`,
        solution: `Thời gian mục tiêu: **6 phút**.

PVC bị xoá, PV \`Retain\` chuyển sang \`Released\`: dữ liệu còn nguyên trên đĩa, nhưng \`spec.claimRef\` vẫn trỏ PVC cũ (uid cũ), nên PVC mới cùng lớp, cùng cỡ vẫn \`Pending\` mãi. Gỡ \`claimRef\` thì PV về \`Available\` và gắn được — đó là cách dùng lại dữ liệu của PV Retain.

\`\`\`bash
k get pv m2-archive                     # STATUS Released, CLAIM m2-q12/archive-2026-10
k get pv m2-archive -o jsonpath='{.spec.claimRef}'
k patch pv m2-archive --type json -p '[{"op":"remove","path":"/spec/claimRef"}]'
k get pv m2-archive                     # Available
k apply -f - <<'EOF'
apiVersion: v1
kind: PersistentVolumeClaim
metadata: {name: archive, namespace: m2-q12}
spec:
  storageClassName: m2-archive
  volumeName: m2-archive
  accessModes: [ReadWriteOnce]
  resources: {requests: {storage: 64Mi}}
EOF
k -n m2-q12 get pvc archive; k -n m2-q12 get pod reporter -o wide     # Bound; Running trên cka-w2 (nodeAffinity của PV)
k -n m2-q12 logs reporter                                             # report 2026-10 …
\`\`\`

Chấm: PVC \`archive\` Bound vào \`m2-archive\` (2), PV vẫn là PV cũ (cùng uid) và \`Retain\` (1, chỉ khi Bound), \`reporter\` Running (1), đọc đúng báo cáo cũ (1). Xoá rồi tạo lại PV cùng hostPath thì dữ liệu vẫn còn nhưng trái đề: 4/5.`,
      },
      {
        id: "q13",
        domain: "workloads",
        weight: 5,
        context: "cka-cp, namespace m2-q13 (PriorityClass là cluster-scoped)",
        text: `${M2_ALL}

1. Tạo PriorityClass \`m2-high\`: \`value: 50000\`, \`preemptionPolicy: Never\`, không phải mặc định của cluster, có \`description\`.
2. Cho Pod của Deployment \`ledger\` trong \`m2-q13\` dùng class này (Pod đang chạy phải được thay bằng Pod mang priority mới).
3. Ghi tên mọi PriorityClass có \`value\` ≥ 1000000000 (mỗi dòng một tên, sắp theo tên) vào \`/opt/m2/q13-system.txt\`.`,
        solution: `Thời gian mục tiêu: **4 phút**.

Priority quyết định thứ tự trong hàng chờ của scheduler và (với \`PreemptLowerPriority\`, mặc định) quyền đuổi Pod thấp hơn khi thiếu chỗ. \`preemptionPolicy: Never\` giữ phần đầu, bỏ phần sau: Pod được xếp trước nhưng không bao giờ đuổi ai — hợp với batch không được làm chết dịch vụ. Priority được ghi vào Pod **lúc admission** (\`spec.priority\`), nên đổi template là Pod mới mang giá trị mới.

\`\`\`bash
k get priorityclass                                     # system-cluster-critical, system-node-critical, shop-critical
k create priorityclass m2-high --value=50000 --preemption-policy=Never --description="batch quan trọng, không đuổi Pod khác"
k -n m2-q13 patch deploy ledger -p '{"spec":{"template":{"spec":{"priorityClassName":"m2-high"}}}}'
k -n m2-q13 rollout status deploy/ledger
k -n m2-q13 get pod -l app=ledger -o jsonpath='{.items[*].spec.priority}'    # 50000
k get priorityclass --sort-by=.metadata.name -o jsonpath='{range .items[?(@.value>=1000000000)]}{.metadata.name}{"\\n"}{end}' > /opt/m2/q13-system.txt
\`\`\`

Chấm: \`m2-high\` đúng value, \`Never\`, không \`globalDefault\` (1); template dùng \`m2-high\` (1); Pod \`ledger\` Ready với \`priority\` 50000 (2); đúng hai class hệ thống (1).`,
      },
      {
        id: "q14",
        domain: "networking",
        weight: 6,
        context: "cka-cp, namespace m2-q14",
        text: `${M2_ALL}

StatefulSet \`kv\` trong \`m2-q14\` (2 Pod, cổng 8080) khai \`serviceName: kv\` nhưng Service đó chưa có.

1. Tạo Service headless \`kv\` (cổng 8080) để từ Pod trong cluster, tên \`kv-0.kv.m2-q14.svc.cluster.local\` phân giải ra IP của Pod \`kv-0\`.
2. Tạo Service \`kv-primary\` kiểu NodePort, \`nodePort: 30362\`, cổng 8080, chỉ tới Pod \`kv-0\` (không bao giờ tới \`kv-1\`).`,
        solution: `Thời gian mục tiêu: **6 phút**.

Service headless (\`clusterIP: None\`) không có IP ảo; DNS trả thẳng IP các Pod, và với Pod của StatefulSet (hostname \`kv-0\`, subdomain \`kv\` do controller đặt sẵn) thêm bản ghi riêng \`kv-0.kv.<ns>.svc\` — tạo Service sau Pod cũng được, không cần tạo lại Pod. Để chọn đúng một Pod, dùng nhãn controller tự gắn: \`statefulset.kubernetes.io/pod-name\`.

\`\`\`bash
k -n m2-q14 get pod --show-labels          # statefulset.kubernetes.io/pod-name=kv-0 …
k apply -f - <<'EOF'
apiVersion: v1
kind: Service
metadata: {name: kv, namespace: m2-q14}
spec:
  clusterIP: None
  selector: {app: kv}
  ports: [{name: http, port: 8080, targetPort: 8080}]
---
apiVersion: v1
kind: Service
metadata: {name: kv-primary, namespace: m2-q14}
spec:
  type: NodePort
  selector: {statefulset.kubernetes.io/pod-name: kv-0}
  ports: [{name: http, port: 8080, targetPort: 8080, nodePort: 30362}]
EOF
k -n m2-q14 exec deploy/probe -- nslookup kv-0.kv.m2-q14.svc.cluster.local     # IP của kv-0
for i in 1 2 3 4; do curl -s http://<IP cka-w1>:30362/; done                    # kv-0 … (cả bốn lần)
\`\`\`

Chấm: \`kv\` headless chọn \`app=kv\` (1), \`kv-0.kv…\` ra đúng IP \`kv-0\` (2), \`kv-primary\` NodePort 30362 cổng 8080 (1), sáu request tới NodePort đều về \`kv-0\` (2). \`kv-primary\` chọn \`app=kv\` thì một nửa request về \`kv-1\`: 4/6.`,
      },
      {
        id: "q15",
        domain: "architecture",
        weight: 6,
        context: "cka-cp (kubeadm; không chạy join)",
        text: `${M2_ALL}

Sắp thêm một worker mới vào cluster.

1. Tạo một bootstrap token **mới**, TTL **2 giờ**, description \`m2-q15\`. Ghi lệnh \`kubeadm join\` đầy đủ dùng token đó (endpoint apiserver, \`--token\`, \`--discovery-token-ca-cert-hash\`) vào \`/opt/m2/q15-join.sh\`. **Không** chạy lệnh đó.
2. Hai token cũ có description \`m2-stale\` đã bị lộ: xoá chúng.`,
        solution: `Thời gian mục tiêu: **4 phút**.

Token bootstrap là Secret \`bootstrap-token-<id>\` trong \`kube-system\`; \`kubeadm token\` đọc/ghi chúng. \`--print-join-command\` in sẵn endpoint, token và hash của CA (SHA-256 khoá công khai của \`/etc/kubernetes/pki/ca.crt\` — node mới dùng nó để tin apiserver trước khi có CA). TTL mặc định 24 giờ: đề đòi 2 giờ thì phải ghi.

\`\`\`bash
sudo kubeadm token list
sudo kubeadm token create --ttl 2h --description m2-q15 --print-join-command > /opt/m2/q15-join.sh
cat /opt/m2/q15-join.sh     # kubeadm join 192.168.252.35:6443 --token <id>.<secret> --discovery-token-ca-cert-hash sha256:…
for t in $(sudo kubeadm token list | awk '/m2-stale/ {print $1}'); do sudo kubeadm token delete $t; done
sudo kubeadm token list     # chỉ còn token m2-q15
# Tự tính lại hash để đối chiếu:
openssl x509 -pubkey -noout -in /etc/kubernetes/pki/ca.crt | openssl pkey -pubin -outform der | openssl dgst -sha256
\`\`\`

Chấm: \`kubeadm join <IP cka-cp>:6443\` (1); token trong lệnh còn sống, description \`m2-q15\`, hết hạn trong 2 giờ kể từ lúc dựng đề (2; chấm sau 2 giờ thì token đã tự hết hạn — chỉ đòi đúng dạng); hash đúng CA (2); không còn token \`m2-stale\` (1, chỉ khi lệnh có token). Dùng TTL mặc định 24h: 4/6.`,
      },
      {
        id: "q16",
        domain: "troubleshooting",
        weight: 7,
        context: "cka-cp, namespace m2-q16; node cka-w2 (multipass shell cka-w2)",
        text: `${M2_ALL}

Pod của Deployment \`toolbox\` trong \`m2-q16\` (ghim \`cka-w2\`) không chạy.

1. **Trước khi sửa**, ghi lý do Pod đang chờ (waiting reason của container, chỉ chuỗi reason) vào \`/opt/m2/q16-reason.txt\`.
2. Image \`m2.lab/tools:1.0\` không nằm trên registry nào; bản xuất của nó là \`/opt/m2-images/tools.tar\` trên \`cka-w2\`. Nạp image vào container runtime của \`cka-w2\` để Pod chạy. **Không** đổi image, \`imagePullPolicy\` hay node của Deployment.`,
        solution: `Thời gian mục tiêu: **5 phút**.

\`imagePullPolicy: Never\` nghĩa là kubelet chỉ dùng image đã có trên node, không bao giờ kéo: thiếu thì \`ErrImageNeverPull\` (khác \`ErrImagePull\`/\`ImagePullBackOff\` là kéo mà hỏng). kubelet nói chuyện với containerd qua CRI trong **namespace \`k8s.io\`** của containerd; \`ctr\` mặc định dùng namespace \`default\` — nạp vào đó thì \`ctr images ls\` thấy mà kubelet không thấy. \`crictl images\` nhìn đúng như kubelet.

\`\`\`bash
k -n m2-q16 get pod -o wide                                            # ErrImageNeverPull trên cka-w2
k -n m2-q16 get pod -l app=toolbox -o jsonpath='{.items[0].status.containerStatuses[0].state.waiting.reason}' > /opt/m2/q16-reason.txt
# trên cka-w2 (multipass shell cka-w2):
sudo ctr -n k8s.io images import /opt/m2-images/tools.tar
sudo crictl images | grep m2.lab                                       # m2.lab/tools  1.0
# lại trên cka-cp: tạo lại Pod cho kubelet thử ngay (không đổi gì của template)
k -n m2-q16 rollout restart deploy/toolbox
k -n m2-q16 rollout status deploy/toolbox
\`\`\`

Chấm: reason \`ErrImageNeverPull\` (2); Pod Ready trên \`cka-w2\` với image \`m2.lab/tools:1.0\` (3); Deployment Available, image/\`imagePullPolicy\`/nodeSelector như cũ (2). Đổi image sang \`busybox:1.37\` cho nhanh: 2/7.`,
      },
    ],
  },
];
