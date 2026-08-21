// Playbook — quy trình nhiều bước phải thuộc lòng cho kỳ thi thực hành.
// Mỗi playbook: các bước theo đúng thứ tự thao tác trong phòng thi, kèm lệnh chạy được và cách verify.
export const playbooks = [
  // ========== CKA ==========
  {
    id: "pb-etcd-backup",
    title: "Backup etcd bằng snapshot",
    cert: "CKA",
    icon: "📸",
    timeTargetMin: 3,
    intro: "Câu \"quốc dân\" của CKA. Mọi cert flag đều nằm sẵn trong `/etc/kubernetes/manifests/etcd.yaml` — đọc từ đó, đừng gõ theo trí nhớ.",
    steps: [
      {
        text: "Tìm endpoint + đường dẫn cert trong manifest etcd (hoặc `ps aux | grep etcd`).",
        code: {
          lang: "bash",
          text: `grep -E "listen-client-urls|cert-file|key-file|trusted-ca-file" \\
  /etc/kubernetes/manifests/etcd.yaml`,
        },
        verify: "Thấy 3 đường dẫn dưới `/etc/kubernetes/pki/etcd/` và endpoint `https://127.0.0.1:2379`.",
      },
      {
        text: "Chạy `snapshot save` với ĐẦY ĐỦ 4 flag TLS, lưu đúng đường dẫn đề yêu cầu.",
        code: {
          lang: "bash",
          text: `ETCDCTL_API=3 etcdctl snapshot save /opt/backup/etcd.db \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key`,
        },
        verify: "Lệnh in ra `Snapshot saved at /opt/backup/etcd.db`.",
      },
      {
        text: "Kiểm tra snapshot hợp lệ (bản etcdctl mới dùng `etcdutl snapshot status`).",
        code: {
          lang: "bash",
          text: `ETCDCTL_API=3 etcdctl snapshot status /opt/backup/etcd.db --write-out=table
# bản mới: etcdutl snapshot status /opt/backup/etcd.db --write-out=table`,
        },
        verify: "Bảng hiện hash, revision, total keys, size — không báo lỗi.",
      },
      {
        text: "Xác nhận file tồn tại đúng vị trí đề bài chấm điểm.",
        code: { lang: "bash", text: `ls -lh /opt/backup/etcd.db` },
        verify: "File có kích thước > 0, đúng path đề yêu cầu từng ký tự.",
      },
    ],
    pitfall: "⚠️ Thiếu cert flags → treo rồi `context deadline exceeded`. Backup phải chạy TRÊN node có etcd (control plane) và lưu đúng path đề cho — sai path là mất trọn điểm dù snapshot đúng.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"etcd backup\" (trang Operating etcd clusters for Kubernetes).",
    lesson: { track: "cka", item: "cka-w3-1", label: "Bài học: Tuần 3 — etcd backup" },
  },
  {
    id: "pb-etcd-restore",
    title: "Restore etcd từ snapshot",
    cert: "CKA",
    icon: "💾",
    timeTargetMin: 5,
    intro: "Restore ra data-dir MỚI rồi trỏ static pod etcd sang đó — không bao giờ ghi đè lên `/var/lib/etcd` đang chạy.",
    steps: [
      {
        text: "Restore snapshot ra thư mục dữ liệu MỚI (restore không cần cert flags).",
        code: {
          lang: "bash",
          text: `ETCDCTL_API=3 etcdctl snapshot restore /opt/backup/etcd.db \\
  --data-dir=/var/lib/etcd-restore
# bản mới: etcdutl snapshot restore /opt/backup/etcd.db --data-dir=/var/lib/etcd-restore`,
        },
        verify: "Tồn tại `/var/lib/etcd-restore/member` — kiểm tra bằng `ls /var/lib/etcd-restore`.",
      },
      {
        text: "Sao lưu manifest RA NGOÀI thư mục manifests trước khi sửa.",
        code: { lang: "bash", text: `cp /etc/kubernetes/manifests/etcd.yaml /root/etcd-bak.yaml` },
      },
      {
        text: "Sửa `etcd.yaml`: đổi `hostPath.path` của volume `etcd-data` sang data-dir mới.",
        code: {
          lang: "bash",
          text: `vim /etc/kubernetes/manifests/etcd.yaml
# volumes:
# - hostPath:
#     path: /var/lib/etcd-restore    # <- đổi từ /var/lib/etcd
#   name: etcd-data`,
        },
        verify: "Chỉ sửa hostPath của volume; `--data-dir` trong command trỏ mountPath trong container nên giữ nguyên.",
      },
      {
        text: "Chờ kubelet restart etcd + apiserver (30–60s), theo dõi container lên lại.",
        code: { lang: "bash", text: `watch crictl ps    # chờ etcd rồi kube-apiserver ở trạng thái Running` },
        verify: "`crictl ps` thấy etcd và kube-apiserver Running với thời gian tạo mới.",
      },
      {
        text: "Verify cluster đọc được dữ liệu đã restore.",
        code: { lang: "bash", text: `kubectl get nodes && kubectl get pods -A` },
        verify: "kubectl trả lời bình thường, resource cũ (trước thời điểm snapshot) xuất hiện lại.",
      },
    ],
    pitfall: "⚠️ Đừng sửa `--data-dir` trong command của container — chỉ đổi `hostPath.path` của volume `etcd-data`. Và đừng để file backup manifest NẰM TRONG `/etc/kubernetes/manifests/` — kubelet sẽ chạy cả hai bản.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"etcd restore\" (Operating etcd clusters for Kubernetes → Restoring an etcd cluster).",
    lesson: { track: "cka", item: "cka-w3-2", label: "Bài học: Tuần 3 — etcd restore" },
  },
  {
    id: "pb-upgrade-controlplane",
    title: "Upgrade control plane với kubeadm",
    cert: "CKA",
    icon: "⬆️",
    timeTargetMin: 8,
    intro: "Trình tự bất di bất dịch: kubeadm trước → `upgrade apply` → drain → kubelet/kubectl → uncordon. Control plane luôn upgrade TRƯỚC worker, mỗi lần chỉ 1 minor version.",
    steps: [
      {
        text: "Xem version khả dụng và lệnh gợi ý.",
        code: { lang: "bash", text: `kubeadm upgrade plan` },
        verify: "Thấy target version (vd `v1.31.1`) trong bảng output.",
      },
      {
        text: "Upgrade gói kubeadm (unhold → install → hold lại).",
        code: {
          lang: "bash",
          text: `apt-mark unhold kubeadm
apt-get update && apt-get install -y kubeadm=1.31.1-1.1
apt-mark hold kubeadm`,
        },
        verify: "`kubeadm version` in ra version mới.",
      },
      {
        text: "Apply upgrade cho control plane (chỉ node control plane đầu tiên dùng `apply`).",
        code: { lang: "bash", text: `kubeadm upgrade apply v1.31.1` },
        verify: "Cuối output có dòng `SUCCESS! Your cluster was upgraded to \"v1.31.1\"`.",
      },
      {
        text: "Drain node control plane trước khi động vào kubelet.",
        code: { lang: "bash", text: `kubectl drain controlplane --ignore-daemonsets` },
        verify: "`kubectl get nodes` → STATUS `Ready,SchedulingDisabled`.",
      },
      {
        text: "Upgrade kubelet + kubectl rồi restart kubelet.",
        code: {
          lang: "bash",
          text: `apt-mark unhold kubelet kubectl
apt-get install -y kubelet=1.31.1-1.1 kubectl=1.31.1-1.1
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet`,
        },
        verify: "`systemctl status kubelet` → active (running).",
      },
      {
        text: "Uncordon và xác nhận version mới.",
        code: { lang: "bash", text: `kubectl uncordon controlplane
kubectl get nodes` },
        verify: "Node `Ready`, cột VERSION là v1.31.1 — version chỉ đổi SAU khi kubelet đã restart.",
      },
    ],
    pitfall: "⚠️ Control plane dùng `upgrade apply`, worker dùng `upgrade node` — nhầm lệnh là hỏng cả bài. Quên `apt-mark hold` lại sau khi cài cũng bị trừ điểm ở môi trường thật.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"kubeadm upgrade\" (Upgrading kubeadm clusters) — copy lệnh theo đúng thứ tự trong trang.",
    lesson: { track: "cka", item: "cka-w3-4", label: "Bài học: Tuần 3 — Cluster upgrade" },
  },
  {
    id: "pb-upgrade-worker",
    title: "Upgrade worker node",
    cert: "CKA",
    icon: "🔧",
    timeTargetMin: 5,
    intro: "Drain từ máy chính → SSH vào worker làm việc → `exit` → uncordon từ máy chính. Worker dùng `kubeadm upgrade node`, KHÔNG phải `apply`.",
    steps: [
      {
        text: "Từ máy chính (student node): drain worker.",
        code: { lang: "bash", text: `kubectl drain node01 --ignore-daemonsets --force` },
        verify: "`kubectl get nodes` → node01 `Ready,SchedulingDisabled`.",
      },
      {
        text: "SSH vào worker, upgrade gói kubeadm.",
        code: {
          lang: "bash",
          text: `ssh node01
apt-mark unhold kubeadm
apt-get update && apt-get install -y kubeadm=1.31.1-1.1
apt-mark hold kubeadm`,
        },
        verify: "`kubeadm version` trên node01 in ra version mới.",
      },
      {
        text: "Cập nhật cấu hình kubelet cho version mới — worker dùng `upgrade node`.",
        code: { lang: "bash", text: `kubeadm upgrade node` },
        verify: "Output kết thúc bằng thông báo upgrade tasks hoàn tất, không lỗi.",
      },
      {
        text: "Upgrade kubelet (và kubectl nếu có) rồi restart.",
        code: {
          lang: "bash",
          text: `apt-mark unhold kubelet kubectl
apt-get install -y kubelet=1.31.1-1.1 kubectl=1.31.1-1.1
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet`,
        },
        verify: "`systemctl status kubelet` → active (running).",
      },
      {
        text: "THOÁT khỏi worker về máy chính rồi uncordon.",
        code: { lang: "bash", text: `exit                       # rời node01 — bắt buộc!
kubectl uncordon node01
kubectl get nodes` },
        verify: "node01 `Ready` với VERSION mới, không còn `SchedulingDisabled`.",
      },
    ],
    pitfall: "⚠️ Quên `exit` sau SSH — lệnh kubectl tiếp theo chạy trên worker (thường không có kubeconfig) và bạn debug nhầm máy. Và nhớ: worker KHÔNG chạy `kubeadm upgrade apply`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"upgrade worker node\" (Upgrading kubeadm clusters → Upgrade worker nodes).",
    lesson: { track: "cka", item: "cka-w3-4", label: "Bài học: Tuần 3 — Cluster upgrade" },
  },
  {
    id: "pb-join-worker",
    title: "Join worker node mới vào cluster",
    cert: "CKA",
    icon: "🔗",
    timeTargetMin: 4,
    intro: "Đừng ghép token + hash thủ công — `kubeadm token create --print-join-command` in sẵn nguyên lệnh join, chỉ việc copy.",
    steps: [
      {
        text: "Trên control plane: sinh token mới kèm lệnh join hoàn chỉnh.",
        code: { lang: "bash", text: `kubeadm token create --print-join-command` },
        verify: "In ra `kubeadm join <ip>:6443 --token ... --discovery-token-ca-cert-hash sha256:...` — copy nguyên dòng.",
      },
      {
        text: "SSH vào node mới, chạy lệnh join vừa copy (bằng root/sudo).",
        code: {
          lang: "bash",
          text: `ssh node02
kubeadm join 172.30.1.2:6443 --token abcdef.0123456789abcdef \\
  --discovery-token-ca-cert-hash sha256:<hash>`,
        },
        verify: "Output có dòng `This node has joined the cluster`.",
      },
      {
        text: "Nếu join lỗi vì kubelet: kiểm tra service đã enable/start chưa.",
        code: { lang: "bash", text: `systemctl enable --now kubelet
systemctl status kubelet` },
        verify: "kubelet active (running); nếu node từng join trước đó, chạy `kubeadm reset` rồi join lại.",
      },
      {
        text: "Thoát về máy chính, xác nhận node xuất hiện và chuyển Ready.",
        code: { lang: "bash", text: `exit
kubectl get nodes -o wide` },
        verify: "node02 xuất hiện; `NotReady` vài chục giây đầu là bình thường — chờ CNI daemonset chạy trên node là chuyển `Ready`.",
      },
    ],
    pitfall: "⚠️ Node mới join sẽ `NotReady` cho tới khi pod CNI rollout xong — đừng vội debug. Bẫy còn lại là quên `exit`: lệnh join chạy trên node mới, còn verify phải chạy từ máy chính.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"kubeadm join\" (Creating a cluster with kubeadm → Joining your nodes).",
    lesson: { track: "cka", item: "cka-w2-4", label: "Bài học: Tuần 2 — kubeadm join" },
  },
  {
    id: "pb-new-user-csr",
    title: "Tạo user mới: key → CSR → approve → RBAC",
    cert: "CKA",
    icon: "👤",
    timeTargetMin: 5,
    intro: "Chuỗi 5 mắt xích: key + CSR file → CertificateSigningRequest object → approve → lấy cert → Role/RoleBinding. Field `request` phải là base64 MỘT dòng.",
    steps: [
      {
        text: "Sinh private key và file CSR với CN = tên user.",
        code: {
          lang: "bash",
          text: `openssl genrsa -out dev.key 2048
openssl req -new -key dev.key -subj "/CN=dev-user" -out dev.csr`,
        },
        verify: "Có 2 file `dev.key`, `dev.csr` — `openssl req -in dev.csr -noout -subject` hiện đúng CN.",
      },
      {
        text: "Tạo CertificateSigningRequest — base64 hóa CSR thành 1 dòng bằng `tr -d`.",
        code: {
          lang: "bash",
          text: `cat <<EOF | kubectl apply -f -
apiVersion: certificates.k8s.io/v1
kind: CertificateSigningRequest
metadata:
  name: dev-user
spec:
  request: $(cat dev.csr | base64 | tr -d '\\n')
  signerName: kubernetes.io/kube-apiserver-client
  expirationSeconds: 86400
  usages: ["client auth"]
EOF`,
        },
        verify: "`kubectl get csr dev-user` → CONDITION `Pending`.",
      },
      {
        text: "Approve CSR và trích certificate đã ký ra file.",
        code: {
          lang: "bash",
          text: `kubectl certificate approve dev-user
kubectl get csr dev-user -o jsonpath='{.status.certificate}' | base64 -d > dev.crt`,
        },
        verify: "`kubectl get csr` → `Approved,Issued`; file `dev.crt` không rỗng.",
      },
      {
        text: "Cấp quyền bằng Role + RoleBinding theo đúng verbs/resources đề yêu cầu.",
        code: {
          lang: "bash",
          text: `kubectl create role dev-role --verb=get,list --resource=pods
kubectl create rolebinding dev-rb --role=dev-role --user=dev-user`,
        },
        verify: "`kubectl auth can-i list pods --as=dev-user` → `yes`.",
      },
      {
        text: "(Nếu đề yêu cầu) thêm user vào kubeconfig và test bằng context mới.",
        code: {
          lang: "bash",
          text: `kubectl config set-credentials dev-user --client-key=dev.key --client-certificate=dev.crt --embed-certs
kubectl config set-context dev-ctx --cluster=kubernetes --user=dev-user
kubectl --context=dev-ctx get pods`,
        },
        verify: "Lệnh với `--context=dev-ctx` liệt kê được pods — chứng minh cert hoạt động thật.",
      },
    ],
    pitfall: "⚠️ `request` phải base64 1 dòng (`base64 | tr -d '\\n'`) và `signerName` phải là `kubernetes.io/kube-apiserver-client` — sai signer thì approve xong vẫn không có cert. `auth can-i --as` chỉ test RBAC, không test cert.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"CertificateSigningRequest\" (Certificate Signing Requests → Normal user).",
    lesson: { track: "cka", item: "cka-w7-2", label: "Bài học: Tuần 7 — Tạo user bằng certificate" },
  },
  {
    id: "pb-node-maintenance",
    title: "Bảo trì node: drain → làm việc → uncordon",
    cert: "CKA",
    icon: "🚧",
    timeTargetMin: 3,
    intro: "`drain` = cordon + đuổi pod. Pod thuộc controller được tạo lại ở node khác; pod \"mồ côi\" bị MẤT vĩnh viễn nếu dùng `--force`.",
    steps: [
      {
        text: "Drain node (tự cordon trước khi đuổi pod).",
        code: {
          lang: "bash",
          text: `kubectl drain node01 --ignore-daemonsets
# nếu bị chặn bởi pod không thuộc controller: thêm --force
# nếu bị chặn bởi emptyDir: thêm --delete-emptydir-data`,
        },
        verify: "`kubectl get nodes` → node01 `Ready,SchedulingDisabled`; `kubectl get pods -A -o wide` không còn pod thường trên node01.",
      },
      {
        text: "Thực hiện việc bảo trì đề yêu cầu (upgrade kubelet, reboot, sửa config...).",
        verify: "Xong việc trên node — nếu có SSH, nhớ `exit` về máy chính.",
      },
      {
        text: "Mở lại schedule cho node.",
        code: { lang: "bash", text: `kubectl uncordon node01` },
        verify: "`kubectl get nodes` → node01 chỉ còn `Ready`.",
      },
      {
        text: "Xác nhận workload — pod cũ KHÔNG tự quay lại node, chỉ pod mới mới được schedule vào.",
        code: { lang: "bash", text: `kubectl get pods -A -o wide | grep node01` },
        verify: "DaemonSet pods có mặt lại; pod Deployment chỉ quay lại khi có scale/rollout mới — đó là hành vi đúng.",
      },
    ],
    pitfall: "⚠️ `--force` đuổi cả pod không thuộc controller và pod đó MẤT luôn — chỉ dùng khi đề cho phép. Sau uncordon đừng hoảng vì pod không quay lại node: scheduler không tự rebalance.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"drain node\" (Safely Drain a Node).",
    lesson: { track: "cka", item: "cka-w4-6", label: "Bài học: Tuần 4 — cordon/drain/uncordon" },
  },
  {
    id: "pb-node-notready",
    title: "Debug node NotReady",
    cert: "CKA",
    icon: "🩺",
    timeTargetMin: 5,
    intro: "99% node NotReady trong đề = kubelet chết hoặc cấu hình kubelet sai. Quy trình: ssh → `systemctl` → `journalctl` → sửa → restart → `exit`.",
    steps: [
      {
        text: "Xác định node lỗi và đọc conditions.",
        code: { lang: "bash", text: `kubectl get nodes
kubectl describe node node01    # xem Conditions + LastHeartbeatTime` },
        verify: "Ghi nhận node NotReady và thông điệp lỗi (vd `Kubelet stopped posting node status`).",
      },
      {
        text: "SSH vào node, kiểm tra kubelet.",
        code: { lang: "bash", text: `ssh node01
systemctl status kubelet` },
        verify: "Trạng thái: `inactive` (bị dừng), `failed` (crash) hay `active` (tìm nguyên nhân khác: CNI, runtime).",
      },
      {
        text: "Nếu chỉ bị dừng — bật lại là xong.",
        code: { lang: "bash", text: `systemctl enable --now kubelet` },
        verify: "`systemctl status kubelet` → active (running).",
      },
      {
        text: "Nếu failed/crash liên tục — đọc log tìm nguyên nhân thật.",
        code: {
          lang: "bash",
          text: `journalctl -u kubelet | tail -50
# "failed to load Kubelet config file"  -> sai path /var/lib/kubelet/config.yaml
# lỗi cert                              -> kiểm tra /etc/kubernetes/kubelet.conf
# "no CNI configuration"                -> thiếu file trong /etc/cni/net.d/
# runtime lỗi                           -> systemctl status containerd`,
        },
        verify: "Chỉ ra được đúng dòng lỗi trước khi sửa — đừng đoán mò.",
      },
      {
        text: "Sửa file cấu hình sai (thường là typo path/cert trong config kubelet) rồi restart.",
        code: { lang: "bash", text: `systemctl daemon-reload && systemctl restart kubelet` },
        verify: "`systemctl status kubelet` active và không văng lỗi mới trong `journalctl -u kubelet -f`.",
      },
      {
        text: "Thoát về máy chính và xác nhận node Ready.",
        code: { lang: "bash", text: `exit
kubectl get nodes` },
        verify: "node01 chuyển `Ready` (có thể mất ~30s).",
      },
    ],
    pitfall: "⚠️ Sửa config xong mà quên `systemctl restart kubelet` thì không có gì thay đổi. Và quên `exit` sau ssh — cứ ngồi gõ kubectl trên worker rồi thắc mắc vì sao không chạy.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"troubleshoot kubelet\" (Troubleshooting Clusters).",
    lesson: { track: "cka", item: "cka-w8-1", label: "Bài học: Tuần 8 — Node NotReady" },
  },
  {
    id: "pb-apiserver-down",
    title: "Debug apiserver không lên sau khi sửa manifest",
    cert: "CKA",
    icon: "🚑",
    timeTargetMin: 6,
    intro: "kubectl timeout/refused = apiserver chết → kubectl vô dụng, phải dùng `crictl` và log file trên control plane. Luôn sao lưu manifest TRƯỚC khi sửa.",
    steps: [
      {
        text: "Xác nhận triệu chứng rồi lên control plane xem container apiserver.",
        code: {
          lang: "bash",
          text: `kubectl get nodes    # treo / connection refused?
ssh controlplane
crictl ps -a | grep kube-apiserver`,
        },
        verify: "Container `Exited` hoặc không xuất hiện — apiserver thực sự chết.",
      },
      {
        text: "Đọc lỗi: container Exited thì `crictl logs`; không có container nào thì manifest sai cú pháp → đọc log kubelet.",
        code: {
          lang: "bash",
          text: `crictl logs <container-id> 2>&1 | tail -20
# không có container để logs:
ls /var/log/pods/ | grep apiserver && cat /var/log/pods/kube-system_kube-apiserver-*/kube-apiserver/*.log | tail -20
journalctl -u kubelet | grep -i apiserver | tail -20`,
        },
        verify: "Tìm ra dòng lỗi cụ thể: flag sai tên, sai path cert, sai etcd endpoint, YAML lỗi indent...",
      },
      {
        text: "Sao lưu manifest hiện tại RA NGOÀI thư mục manifests rồi mới sửa.",
        code: {
          lang: "bash",
          text: `cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml
vim /etc/kubernetes/manifests/kube-apiserver.yaml`,
        },
        verify: "Chỉ sửa đúng chỗ lỗi vừa tìm thấy — đừng \"tiện tay\" đổi thêm flag khác.",
      },
      {
        text: "Chờ kubelet nhận thấy manifest đổi và restart static pod (30–60s).",
        code: { lang: "bash", text: `watch crictl ps    # chờ kube-apiserver Running ổn định` },
        verify: "Container apiserver Running và KHÔNG restart lại sau vài chục giây.",
      },
      {
        text: "Verify bằng kubectl rồi thoát khỏi control plane.",
        code: { lang: "bash", text: `kubectl get pods -n kube-system
exit` },
        verify: "kubectl trả lời bình thường; các pod kube-system Running.",
      },
    ],
    pitfall: "⚠️ Manifest sai CÚ PHÁP YAML thì kubelet không tạo nổi container — `crictl logs` không có gì để đọc, phải xem `journalctl -u kubelet`. Và tuyệt đối không để file backup trong `/etc/kubernetes/manifests/`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"troubleshoot cluster\" + kiểm tra flag chuẩn trong trang \"kube-apiserver\" (Reference).",
    lesson: { track: "cka", item: "cka-w8-2", label: "Bài học: Tuần 8 — Control plane hỏng" },
  },

  // ========== CKS ==========
  {
    id: "pb-encryption-at-rest",
    title: "Bật encryption at rest cho Secrets",
    cert: "CKS",
    icon: "🔐",
    timeTargetMin: 8,
    intro: "3 mảnh ghép: file EncryptionConfiguration → flag + volume mount trên apiserver → re-encrypt secret cũ. Provider ĐẦU TIÊN trong danh sách là provider dùng để mã hóa khi ghi.",
    steps: [
      {
        text: "Sinh key 32 byte và tạo file EncryptionConfiguration (aescbc đứng TRƯỚC, identity đứng SAU).",
        code: {
          lang: "bash",
          text: `head -c 32 /dev/urandom | base64    # copy kết quả vào <key>
mkdir -p /etc/kubernetes/etcd
cat <<EOF > /etc/kubernetes/etcd/enc.yaml
apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources: ["secrets"]
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: <key>
  - identity: {}
EOF`,
        },
        verify: "`identity: {}` nằm CUỐI — nhờ nó apiserver vẫn đọc được secret cũ chưa mã hóa.",
      },
      {
        text: "Sao lưu manifest apiserver ra ngoài rồi thêm flag encryption.",
        code: {
          lang: "bash",
          text: `cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml
vim /etc/kubernetes/manifests/kube-apiserver.yaml
# thêm vào command:
#   - --encryption-provider-config=/etc/kubernetes/etcd/enc.yaml`,
        },
      },
      {
        text: "Mount thư mục chứa enc.yaml vào container apiserver — thiếu bước này apiserver KHÔNG lên.",
        code: {
          lang: "bash",
          text: `# trong cùng file kube-apiserver.yaml:
#   volumeMounts:
#   - name: enc
#     mountPath: /etc/kubernetes/etcd
#     readOnly: true
# volumes:
# - name: enc
#   hostPath:
#     path: /etc/kubernetes/etcd
#     type: DirectoryOrCreate`,
        },
        verify: "mountPath trùng với đường dẫn trong flag `--encryption-provider-config`.",
      },
      {
        text: "Chờ apiserver restart (30–60s).",
        code: { lang: "bash", text: `watch crictl ps    # chờ kube-apiserver Running` },
        verify: "`kubectl get pods -n kube-system` hoạt động lại.",
      },
      {
        text: "Verify: tạo secret mới và đọc thẳng từ etcd — phải thấy prefix mã hóa.",
        code: {
          lang: "bash",
          text: `kubectl create secret generic s1 --from-literal=k=v -n default
ETCDCTL_API=3 etcdctl get /registry/secrets/default/s1 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key | hexdump -C | head`,
        },
        verify: "Thấy chuỗi `k8s:enc:aescbc:v1:key1` thay vì plaintext.",
      },
      {
        text: "Re-encrypt toàn bộ secret cũ (đang còn plaintext trong etcd).",
        code: { lang: "bash", text: `kubectl get secrets -A -o json | kubectl replace -f -` },
        verify: "Đọc lại 1 secret cũ bằng etcdctl → giờ cũng có prefix `k8s:enc:aescbc:v1:`.",
      },
    ],
    pitfall: "⚠️ Hai bẫy chết người: quên mount thư mục chứa `enc.yaml` (apiserver không lên vì \"no such file\") và đặt `identity: {}` LÊN ĐẦU (secret mới vẫn được ghi plaintext dù mọi thứ \"chạy\").",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"encrypt data at rest\" (Encrypting Confidential Data at Rest).",
    lesson: { track: "cks", item: "cks-w4-3", label: "Bài học: Tuần 4 — Encryption at Rest" },
  },
  {
    id: "pb-audit-logging",
    title: "Bật audit logging trên apiserver",
    cert: "CKS",
    icon: "📜",
    timeTargetMin: 8,
    intro: "Policy file + 4 flags + 2 cặp mount (thư mục policy và thư mục log). Rule khớp ĐẦU TIÊN được áp dụng — thứ tự rule quyết định tất cả.",
    steps: [
      {
        text: "Tạo audit policy theo yêu cầu đề (ví dụ: RequestResponse cho secrets, còn lại Metadata).",
        code: {
          lang: "bash",
          text: `mkdir -p /etc/kubernetes/audit /var/log/kubernetes/audit
cat <<EOF > /etc/kubernetes/audit/policy.yaml
apiVersion: audit.k8s.io/v1
kind: Policy
omitStages: ["RequestReceived"]
rules:
- level: RequestResponse
  resources:
  - group: ""
    resources: ["secrets"]
- level: Metadata
EOF`,
        },
        verify: "Nhớ 4 level: `None` < `Metadata` < `Request` < `RequestResponse`.",
      },
      {
        text: "Sao lưu manifest apiserver trước khi sửa.",
        code: { lang: "bash", text: `cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml` },
      },
      {
        text: "Thêm các flag audit vào command của apiserver.",
        code: {
          lang: "bash",
          text: `vim /etc/kubernetes/manifests/kube-apiserver.yaml
#   - --audit-policy-file=/etc/kubernetes/audit/policy.yaml
#   - --audit-log-path=/var/log/kubernetes/audit/audit.log
#   - --audit-log-maxage=30
#   - --audit-log-maxbackup=5
#   - --audit-log-maxsize=100`,
        },
      },
      {
        text: "Mount CẢ HAI thư mục: policy (readOnly) và log (ghi được).",
        code: {
          lang: "bash",
          text: `# volumeMounts:
# - name: audit-policy
#   mountPath: /etc/kubernetes/audit
#   readOnly: true
# - name: audit-log
#   mountPath: /var/log/kubernetes/audit
# volumes:
# - name: audit-policy
#   hostPath: {path: /etc/kubernetes/audit, type: DirectoryOrCreate}
# - name: audit-log
#   hostPath: {path: /var/log/kubernetes/audit, type: DirectoryOrCreate}`,
        },
        verify: "Volume log KHÔNG có `readOnly: true` — apiserver phải ghi được vào đó.",
      },
      {
        text: "Chờ apiserver restart.",
        code: { lang: "bash", text: `watch crictl ps` },
        verify: "kube-apiserver Running ổn định; nếu không lên → `journalctl -u kubelet | tail` tìm lỗi mount/flag.",
      },
      {
        text: "Trigger một sự kiện rồi đọc audit log.",
        code: {
          lang: "bash",
          text: `kubectl get secrets -A > /dev/null
grep '"resource":"secrets"' /var/log/kubernetes/audit/audit.log | tail -1 | jq .`,
        },
        verify: "Thấy event JSON với level `RequestResponse` cho secrets — đúng như policy.",
      },
    ],
    pitfall: "⚠️ Quên mount MỘT trong hai thư mục là apiserver không lên. Và rule đặt sai thứ tự (Metadata chung chung đứng trước rule secrets) khiến rule secrets không bao giờ được khớp.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"audit\" (Auditing) — copy mẫu policy và flags từ trang này.",
    lesson: { track: "cks", item: "cks-w7-2", label: "Bài học: Tuần 7 — Audit Logging" },
  },
  {
    id: "pb-falco-rule",
    title: "Sửa Falco rule: đổi output → trigger → đọc log",
    cert: "CKS",
    icon: "🦅",
    timeTargetMin: 6,
    intro: "Không sửa `falco_rules.yaml` gốc — copy rule sang `falco_rules.local.yaml` (file override) và chỉ đổi dòng `output`. Tên rule phải GIỮ NGUYÊN thì override mới ăn.",
    steps: [
      {
        text: "Tìm rule đề nhắc tới trong file rules mặc định.",
        code: { lang: "bash", text: `grep -A 10 "rule: Terminal shell in container" /etc/falco/falco_rules.yaml` },
        verify: "Thấy đủ các khối `condition`, `output`, `priority` của rule.",
      },
      {
        text: "Copy NGUYÊN rule sang `falco_rules.local.yaml`, chỉ sửa dòng `output` theo format đề yêu cầu.",
        code: {
          lang: "bash",
          text: `vim /etc/falco/falco_rules.local.yaml
# - rule: Terminal shell in container      # giữ nguyên tên
#   desc: A shell was spawned in a container
#   condition: >
#     spawned_process and container
#     and shell_procs and proc.tty != 0
#   output: "%evt.time,%user.name,%container.id"   # <- chỉ đổi dòng này
#   priority: WARNING`,
        },
        verify: "Các field hay dùng: `%evt.time %user.name %user.uid %proc.name %container.id %container.name %k8s.pod.name %k8s.ns.name`.",
      },
      {
        text: "Kiểm tra cú pháp rồi restart Falco để nạp rule mới.",
        code: {
          lang: "bash",
          text: `falco -V /etc/falco/falco_rules.local.yaml    # validate rule file
systemctl restart falco`,
        },
        verify: "`systemctl status falco` → active (running); rule lỗi cú pháp sẽ làm service fail ngay.",
      },
      {
        text: "Trigger rule: mở shell trong một container bất kỳ.",
        code: { lang: "bash", text: `kubectl exec -it <pod> -- sh -c "echo trigger && sleep 1"` },
        verify: "Hành vi \"spawn shell trong container\" khớp condition của rule.",
      },
      {
        text: "Đọc alert và xác nhận đúng format output mới.",
        code: { lang: "bash", text: `journalctl -u falco --since "2 min ago" | grep -i shell | tail -5` },
        verify: "Dòng alert có đúng thứ tự field như đề yêu cầu (vd `time,user,container_id`).",
      },
    ],
    pitfall: "⚠️ Sửa thẳng `falco_rules.yaml` = sai chỗ, và đổi tên rule trong file local = tạo rule MỚI thay vì override rule cũ. Sau khi sửa mà quên `systemctl restart falco` thì output vẫn là format cũ.",
    docsHint: "Trong phòng thi: được phép mở falco.org/docs → mục Rules và Supported Fields.",
    lesson: { track: "cks", item: "cks-w7-1", label: "Bài học: Tuần 7 — Falco rules" },
  },
  {
    id: "pb-kube-bench-fix",
    title: "Fix một kube-bench finding",
    cert: "CKS",
    icon: "🛡️",
    timeTargetMin: 5,
    intro: "kube-bench tự chấm cluster theo CIS Benchmark. Chiến thuật thi: đọc phần `Remediation` của finding và làm ĐÚNG THEO TỪNG CHỮ, không sáng tạo.",
    steps: [
      {
        text: "Chạy kube-bench trên đúng loại node đề chỉ định.",
        code: {
          lang: "bash",
          text: `kube-bench run --targets master    # control plane
# worker: kube-bench run --targets node`,
        },
        verify: "Output liệt kê từng check với PASS/FAIL/WARN.",
      },
      {
        text: "Lọc finding FAIL và đọc kỹ phần Remediation của check đề nhắc tới.",
        code: { lang: "bash", text: `kube-bench run --targets master | grep -B1 -A5 FAIL` },
        verify: "Xác định được: sửa file nào, flag/giá trị gì, quyền file bao nhiêu.",
      },
      {
        text: "Sao lưu file sắp sửa (manifest thì backup ra NGOÀI thư mục manifests).",
        code: { lang: "bash", text: `cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-bak.yaml` },
      },
      {
        text: "Áp remediation — 3 dạng phổ biến: flag apiserver, config kubelet, quyền file.",
        code: {
          lang: "bash",
          text: `# Dạng 1 — flag apiserver (sửa manifest):
#   - --profiling=false
# Dạng 2 — kubelet (sửa /var/lib/kubelet/config.yaml):
#   authentication.anonymous.enabled: false
# Dạng 3 — quyền file:
chmod 600 /var/lib/kubelet/config.yaml
chown root:root /etc/kubernetes/manifests/kube-apiserver.yaml`,
        },
        verify: "Chỉ đổi đúng giá trị Remediation nêu — mỗi thứ thừa là một rủi ro làm hỏng cluster.",
      },
      {
        text: "Restart thành phần liên quan: kubelet thì restart service, static pod thì chờ tự lên.",
        code: {
          lang: "bash",
          text: `systemctl daemon-reload && systemctl restart kubelet    # nếu sửa kubelet
watch crictl ps                                          # nếu sửa manifest static pod`,
        },
        verify: "`kubectl get nodes` vẫn Ready — cluster không bị mình làm gãy.",
      },
      {
        text: "Chạy lại ĐÚNG check đó để xác nhận chuyển PASS.",
        code: { lang: "bash", text: `kube-bench run --check 1.2.20` },
        verify: "Check đề yêu cầu hiển thị `[PASS]`.",
      },
    ],
    pitfall: "⚠️ Sửa kubelet config xong quên restart kubelet → kube-bench vẫn FAIL. Sửa manifest apiserver thì phải CHỜ static pod lên lại (30–60s) rồi mới verify, không thì tưởng nhầm là fix sai.",
    docsHint: "Trong phòng thi: được mở github.com/aquasecurity/kube-bench docs; phần Remediation nằm ngay trong output kube-bench.",
    lesson: { track: "cks", item: "cks-w1-2", label: "Bài học: Tuần 1 — kube-bench" },
  },
  {
    id: "pb-gvisor-runtimeclass",
    title: "RuntimeClass gVisor và chạy pod sandbox",
    cert: "CKS",
    icon: "📦",
    timeTargetMin: 5,
    intro: "gVisor (`runsc`) chắn syscall trước khi tới kernel host — dùng cho workload không tin cậy. Trong thi, handler `runsc` thường đã cấu hình sẵn trong containerd, việc của bạn là RuntimeClass + `runtimeClassName`.",
    steps: [
      {
        text: "Kiểm tra handler runsc đã có trong containerd trên node đích.",
        code: { lang: "bash", text: `grep -A2 runsc /etc/containerd/config.toml` },
        verify: "Thấy block runtime `runsc` — nếu không có, pod sandbox sẽ không bao giờ chạy trên node này.",
      },
      {
        text: "Tạo RuntimeClass trỏ tới handler `runsc`.",
        code: {
          lang: "bash",
          text: `cat <<EOF | kubectl apply -f -
apiVersion: node.k8s.io/v1
kind: RuntimeClass
metadata:
  name: gvisor
handler: runsc
EOF`,
        },
        verify: "`kubectl get runtimeclass` liệt kê `gvisor` với HANDLER `runsc`.",
      },
      {
        text: "Tạo pod dùng sandbox qua `runtimeClassName` (nằm trong `spec`, ngang hàng `containers`).",
        code: {
          lang: "bash",
          text: `cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Pod
metadata:
  name: sandboxed
spec:
  runtimeClassName: gvisor
  containers:
  - name: app
    image: nginx
EOF`,
        },
        verify: "`kubectl get pod sandboxed` → Running (Pending kéo dài = node không có runsc).",
      },
      {
        text: "Verify pod thực sự chạy trong gVisor: kernel nhìn thấy là kernel giả lập.",
        code: {
          lang: "bash",
          text: `kubectl exec sandboxed -- dmesg | head -3    # thấy "gVisor"
kubectl exec sandboxed -- uname -r           # khác kernel host`,
        },
        verify: "`dmesg` in banner `Starting gVisor...` — bằng chứng đanh thép nhất.",
      },
    ],
    pitfall: "⚠️ Với Deployment, `runtimeClassName` phải nằm trong `spec.template.spec` chứ không phải `spec`. Pod Pending với event `RuntimeHandler \"runsc\" not supported` = schedule nhầm node chưa cài gVisor.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"RuntimeClass\" (Containers → Runtime Class).",
    lesson: { track: "cks", item: "cks-w5-3", label: "Bài học: Tuần 5 — gVisor / RuntimeClass" },
  },

  // ========== CKAD ==========
  {
    id: "pb-rollback-deployment",
    title: "Rollback Deployment hỏng",
    cert: "CKAD",
    icon: "⏪",
    timeTargetMin: 3,
    intro: "Deploy version mới bị `ImagePullBackOff`/`CrashLoopBackOff`? Đừng sửa tay — `rollout undo` đưa về revision trước trong một lệnh.",
    steps: [
      {
        text: "Quan sát triệu chứng: rollout kẹt, pod mới lỗi.",
        code: {
          lang: "bash",
          text: `kubectl rollout status deploy/web    # treo ở "waiting for rollout"
kubectl get pods -l app=web          # pod mới ImagePullBackOff / CrashLoopBackOff`,
        },
        verify: "Xác định pod lỗi thuộc ReplicaSet MỚI (`kubectl describe pod` xem image sai).",
      },
      {
        text: "Xem lịch sử revision, soi kỹ revision nghi vấn.",
        code: {
          lang: "bash",
          text: `kubectl rollout history deploy/web
kubectl rollout history deploy/web --revision=2    # xem image của revision cụ thể`,
        },
        verify: "Biết chắc revision nào tốt (image đúng) trước khi undo.",
      },
      {
        text: "Rollback về revision trước (hoặc chỉ định revision tốt).",
        code: {
          lang: "bash",
          text: `kubectl rollout undo deploy/web
# hoặc: kubectl rollout undo deploy/web --to-revision=1`,
        },
        verify: "`kubectl rollout status deploy/web` → `successfully rolled out`.",
      },
      {
        text: "Verify image đã về bản tốt và pod Running đủ replica.",
        code: {
          lang: "bash",
          text: `kubectl get deploy web -o jsonpath='{.spec.template.spec.containers[0].image}'
kubectl get pods -l app=web`,
        },
        verify: "Image là bản cũ hoạt động được; mọi pod `Running` và `READY`.",
      },
    ],
    pitfall: "⚠️ `undo` tạo ra revision MỚI (số tiếp tục tăng) — đừng bối rối khi history đổi số. Muốn biết revision nào chứa image gì, bắt buộc xem từng cái bằng `--revision=N`.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"rolling back deployment\" (Deployments → Rolling Back).",
    lesson: { track: "ckad", item: "w3-3", label: "Bài học: Tuần 3 — Rollbacks" },
  },
  {
    id: "pb-svc-no-endpoints",
    title: "Debug Service không có endpoints",
    cert: "CKAD",
    icon: "🔌",
    timeTargetMin: 4,
    intro: "Service không nhận traffic → nhìn `endpoints` đầu tiên. Endpoints rỗng chỉ có 2 nguyên nhân: selector không khớp label pod, hoặc pod chưa Ready.",
    steps: [
      {
        text: "Kiểm tra endpoints của Service.",
        code: { lang: "bash", text: `kubectl get endpoints web-svc` },
        verify: "`<none>`/rỗng = có vấn đề; có danh sách IP = Service ổn, lỗi ở chỗ khác (port, DNS, NetworkPolicy).",
      },
      {
        text: "So selector của Service với label thực tế của pod.",
        code: {
          lang: "bash",
          text: `kubectl describe svc web-svc | grep -i selector
kubectl get pods --show-labels`,
        },
        verify: "Từng cặp key=value trong selector phải khớp label pod — sai 1 ký tự là endpoints rỗng.",
      },
      {
        text: "Nếu selector khớp mà vẫn rỗng: pod chưa Ready (readiness probe fail).",
        code: {
          lang: "bash",
          text: `kubectl get pods    # cột READY 0/1?
kubectl describe pod <pod> | grep -A5 -i readiness`,
        },
        verify: "Pod `Running` nhưng `READY 0/1` vẫn bị loại khỏi endpoints — đó là thiết kế, không phải bug.",
      },
      {
        text: "Sửa nguyên nhân: đổi selector Service (hoặc label pod), kiểm tra luôn `targetPort` khớp `containerPort`.",
        code: {
          lang: "bash",
          text: `kubectl edit svc web-svc     # sửa spec.selector / spec.ports.targetPort
# hoặc sửa label pod: kubectl label pod <pod> app=web --overwrite`,
        },
        verify: "`kubectl get endpoints web-svc` giờ liệt kê IP:port của các pod.",
      },
      {
        text: "Test end-to-end từ một pod tạm.",
        code: {
          lang: "bash",
          text: `kubectl run tmp --image=busybox --rm -it --restart=Never -- wget -qO- --timeout=2 http://web-svc`,
        },
        verify: "Nhận được response từ app — Service đã thông.",
      },
    ],
    pitfall: "⚠️ Đừng chỉ chăm chăm vào selector: pod `Running` mà readiness probe fail cũng cho endpoints rỗng. Và nhớ `port` là cổng của Service, `targetPort` phải bằng `containerPort` của pod.",
    docsHint: "Trong phòng thi: kubernetes.io/docs → search \"debug service\" (Debug Services).",
    lesson: { track: "ckad", item: "w6-1", label: "Bài học: Tuần 6 — Services" },
  },
];
