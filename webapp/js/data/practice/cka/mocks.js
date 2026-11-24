// Đề mock của chương trình CKA (spec mục 6, 12). Hình dạng: { id, title, durationMin,
//   questions: [{ id, domain, weight, context, text, solution }] } — check-data PR10.
// Id đề và id câu là khoá lưu tiến độ: đặt một lần, không đổi. Script dựng/chấm ở labs/cka/mocks/<id>/
// (setup.sh, score.sh; bảng TABLE của score.sh phải trùng id, domain, weight dưới đây — check-data PR11). `solution`
// của từng câu là cách làm của labs/cka/mocks/<id>/files/solve.sh (cùng lệnh; solve.sh chỉ thêm --dry-run | apply
// để chạy lại được và vòng chờ), mà s52/apply.sh chạy và đòi 100/100.

const M1_ALL = "Mọi câu làm trên `cka-cp` (`multipass shell cka-cp`, user ubuntu, `kubectl`/`helm` sẵn), trừ khi câu ghi node khác. Tệp đáp án ghi vào `/opt/m1/` đúng tên câu yêu cầu.";

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
];
