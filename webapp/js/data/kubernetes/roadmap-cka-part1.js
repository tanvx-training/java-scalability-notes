// Nội dung bài học chi tiết cho roadmap CKA — Phần 1 (Tuần 1–3).
// Mỗi item có `lesson` (markdown) hiển thị trong accordion.
// GIỮ NGUYÊN id và text — tiến độ người dùng lưu theo các id này.

export const ckaWeeksPart1 = [
  {
    id: "cka-w1",
    week: "Tuần 1",
    title: "Kiến trúc cluster chuyên sâu",
    goal: "Hiểu control plane từ bên trong — nền tảng cho mọi bài troubleshooting.",
    practice: "Vào node control plane, `ls /etc/kubernetes/manifests/`, đọc manifest kube-apiserver, xem process bằng `ps aux | grep kube`.",
    resources: [
      { label: "CKA Study Guide — lộ trình đầy đủ", href: "#/docs/cka-study-guide" },
      { label: "CKA Cheat Sheet §1 — Kiến trúc & vị trí file", href: "#/docs/cka-cheat-sheet" },
      { label: "Tra cứu lệnh kubectl", href: "#/commands" },
      { label: "K8s docs: Kubernetes Components", href: "https://kubernetes.io/docs/concepts/overview/components/" },
      { label: "Killercoda — CKA scenarios", href: "https://killercoda.com/killer-shell-cka" },
    ],
    items: [
      {
        id: "cka-w1-1",
        text: "Control plane components: kube-apiserver, etcd, kube-scheduler, kube-controller-manager",
        lesson: `Hãy hình dung control plane như **ban điều hành một tòa nhà văn phòng**. **kube-apiserver** là *quầy lễ tân duy nhất* — mọi giấy tờ, từ lệnh \`kubectl\` của bạn đến báo cáo của kubelet, đều phải nộp qua đây; không ai được "đi cửa sau". **etcd** là *sổ cái* của tòa nhà — ghi lại toàn bộ trạng thái cluster; và chỉ duy nhất lễ tân (apiserver) được phép mở sổ. **kube-scheduler** là *người xếp chỗ ngồi* — thấy Pod mới chưa có bàn (chưa có \`nodeName\`) thì chọn node phù hợp rồi ghi tên vào, không tự tay chạy container. **kube-controller-manager** là *đội giám sát* — chạy hàng chục control loop, liên tục so sánh trạng thái mong muốn với thực tế và tự sửa lệch (Pod của Deployment bị xóa thì mọc lại là nhờ đội này).

Điểm CKA khác CKAD: bạn phải biết chúng chạy **ở đâu và dưới dạng gì**. Với cluster cài bằng kubeadm, cả 4 thành phần chạy dưới dạng **static pod** — manifest nằm trong \`/etc/kubernetes/manifests/\` trên node control plane. Sửa file ở đó = kubelet tự restart thành phần tương ứng. Port mặc định phải thuộc: apiserver **6443**, etcd **2379** (client) / **2380** (peer), scheduler 10259, controller-manager 10257.

\`\`\`bash
# SSH vào node control plane rồi quan sát:
ssh controlplane
ls /etc/kubernetes/manifests/
# → etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml

k get pods -n kube-system -o wide      # 4 thành phần hiện dưới dạng pod <tên>-<node>
ps aux | grep kube-apiserver           # xem flags thật sự đang chạy
crictl ps | grep -E 'etcd|apiserver'   # xem ở mức container runtime
\`\`\`

⚠️ **Lỗi thường gặp:** tưởng apiserver/scheduler là service systemd — trên cluster kubeadm chỉ có **kubelet và containerd** là systemd service, phần còn lại là static pod; và sau khi sửa manifest thì không chờ 30–60 giây cho kubelet restart pod đã vội kết luận "sửa không ăn".`,
      },
      {
        id: "cka-w1-2",
        text: "Node components: kubelet, kube-proxy, container runtime (containerd)",
        lesson: `Nếu control plane là ban điều hành thì mỗi node là **một tầng của tòa nhà**, và **kubelet** là *quản lý tầng*: theo dõi apiserver xem tầng mình được giao Pod nào, bảo container runtime chạy container, rồi báo cáo trạng thái ngược lại. Quan trọng nhất với CKA: **kubelet KHÔNG phải là pod** — nó là **systemd service** chạy thẳng trên node, nên khi kubelet chết bạn phải dùng đồ nghề Linux: \`systemctl\`, \`journalctl\`. Đây là lý do node NotReady là bài "ssh vào node" kinh điển.

**containerd** là container runtime — thứ thực sự chạy container, cũng là systemd service. Khi apiserver chết và \`kubectl\` tê liệt, bạn nói chuyện trực tiếp với containerd bằng \`crictl\` (cú pháp gần giống docker). Còn **kube-proxy** lo phần mạng của Service — chạy dưới dạng **DaemonSet** (một pod trên mỗi node), ghi rule iptables/ipvs để traffic tới ClusterIP được chuyển đúng Pod.

File cấu hình phải thuộc lòng: \`/var/lib/kubelet/config.yaml\` (config kubelet) và \`/etc/kubernetes/kubelet.conf\` (kubeconfig để kubelet nói chuyện với apiserver).

\`\`\`bash
ssh node01
systemctl status kubelet             # active (running)? failed?
journalctl -u kubelet -f             # đọc log kubelet trực tiếp
systemctl status containerd          # runtime có sống không
crictl ps                            # container đang chạy trên node này
crictl ps -a                         # kể cả container đã chết

# kube-proxy là DaemonSet — kiểm tra từ máy chính:
k get ds -n kube-system kube-proxy
exit                                 # LUÔN exit về máy chính sau khi xong
\`\`\`

⚠️ **Lỗi thường gặp:** đi tìm pod tên "kubelet" trong \`kube-system\` (không tồn tại — nó là systemd service); và sửa \`/var/lib/kubelet/config.yaml\` xong quên \`systemctl daemon-reload && systemctl restart kubelet\` nên config mới không có hiệu lực.`,
      },
      {
        id: "cka-w1-3",
        text: "Static Pods: `/etc/kubernetes/manifests/`, kubelet tự quản lý",
        lesson: `Bình thường, muốn "tuyển" một Pod phải nộp hồ sơ qua HR (apiserver) để lưu vào sổ cái etcd. **Static pod** là ngoại lệ: *nhân viên do quản lý tòa nhà (kubelet) tự thuê, không qua HR*. Kubelet trên mỗi node theo dõi một thư mục — mặc định \`/etc/kubernetes/manifests/\` — thấy file YAML nào trong đó là tự chạy pod tương ứng, không cần hỏi ai. Chính vì cơ chế này mà control plane mới khởi động được: lúc cluster chưa tồn tại thì lấy đâu ra apiserver để "xin phép" chạy... apiserver?

Ba tính chất phải nắm: (1) đường dẫn thư mục do \`staticPodPath\` trong \`/var/lib/kubelet/config.yaml\` quyết định — đề thi có thể đổi sang chỗ khác; (2) static pod vẫn *hiện* trên \`kubectl get pods\` dưới dạng **mirror pod** chỉ-để-xem, tên có hậu tố tên node (vd \`etcd-controlplane\`), ownerReference là **Node**; (3) muốn sửa/xóa phải **thao tác trên file, trên đúng node đó** — \`kubectl delete\` mirror pod thì kubelet tạo lại ngay.

\`\`\`bash
# Xác nhận thư mục static pod của node:
grep staticPodPath /var/lib/kubelet/config.yaml
# → staticPodPath: /etc/kubernetes/manifests

# Tạo static pod: chỉ cần đặt file YAML vào thư mục
k run static-web --image=nginx $do > /etc/kubernetes/manifests/static-web.yaml
watch crictl ps                          # thấy container xuất hiện

# Xóa: XÓA FILE (kubectl delete sẽ bị tạo lại)
rm /etc/kubernetes/manifests/static-web.yaml
\`\`\`

⚠️ **Lỗi thường gặp:** đề yêu cầu tạo static pod trên \`node01\` nhưng bạn đặt file trên control plane (phải \`ssh node01\` trước); và file YAML lỗi cú pháp thì kubelet chỉ lặng lẽ báo trong \`journalctl -u kubelet\` — pod không xuất hiện mà chẳng có thông báo nào trên kubectl.`,
      },
      {
        id: "cka-w1-4",
        text: "Chuỗi hoạt động: `kubectl apply` → API server → etcd → scheduler → kubelet → runtime",
        lesson: `Theo chân một Pod từ lúc bạn gõ lệnh đến lúc container chạy — giống nộp hồ sơ ở **trung tâm hành chính một cửa**:

- **1. \`kubectl apply\`** gửi REST request tới **apiserver** — quầy lễ tân kiểm tra 3 vòng: authentication (bạn là ai), authorization (RBAC — bạn được phép không), admission (hồ sơ hợp lệ không).
- **2. apiserver ghi vào etcd** — hồ sơ vào sổ cái. Đến đây Pod đã "tồn tại" nhưng chưa chạy ở đâu cả, \`nodeName\` còn trống.
- **3. scheduler** — vốn *watch* apiserver liên tục — thấy Pod chưa có node, chấm điểm các node rồi **ghi \`nodeName\` vào Pod** (thao tác bind, cũng qua apiserver). Hết việc của scheduler.
- **4. kubelet** trên node được chọn — cũng đang *watch* apiserver — thấy có Pod gán cho mình, bèn gọi **containerd** qua CRI để pull image và chạy container.
- **5.** kubelet báo cáo status ngược về apiserver → etcd. \`kubectl get pods\` của bạn hiển thị Running.

Điểm mấu chốt: **không ai "đẩy" lệnh xuống node** — mọi thành phần chủ động *watch* apiserver và tự lấy việc của mình. Hiểu chuỗi này là có ngay cây chẩn đoán: Pod **Pending không có node** → scheduler hỏng hoặc không node nào đủ điều kiện; Pod **có node nhưng không chạy** → kubelet/runtime trên node đó; **kubectl tê liệt** → apiserver hoặc etcd.

\`\`\`bash
k run web --image=nginx
k get pod web -o jsonpath='{.spec.nodeName}'   # node nào được scheduler chọn?

# Xem lại toàn bộ hành trình qua events:
k get events --field-selector involvedObject.name=web \\
  --sort-by=.metadata.creationTimestamp
# → Scheduled → Pulling → Pulled → Created → Started
\`\`\`

⚠️ **Lỗi thường gặp:** Pod Pending mà lại đi debug kubelet — khi \`nodeName\` còn trống thì thủ phạm ở phía scheduler/resource, kubelet chưa nhập cuộc; và quên rằng khi scheduler chết, **static pod vẫn chạy bình thường** vì kubelet không cần scheduler.`,
      },
      {
        id: "cka-w1-5",
        text: "Certificates & kubeconfig: `/etc/kubernetes/pki/`, `/etc/kubernetes/*.conf`",
        lesson: `Cluster kubeadm nói chuyện nội bộ hoàn toàn qua **TLS hai chiều**: mỗi thành phần cầm một "thẻ nhân viên" (client certificate) do **CA của cluster** đóng dấu, và apiserver chỉ tiếp người có thẻ hợp lệ. Toàn bộ thẻ và con dấu nằm trong \`/etc/kubernetes/pki/\`: \`ca.crt\`/\`ca.key\` (con dấu gốc), \`apiserver.crt\` (cert phục vụ port 6443), và thư mục con \`etcd/\` chứa **bộ cert riêng của etcd** (\`etcd/ca.crt\`, \`etcd/server.crt\`, \`etcd/server.key\`) — chính là các file bạn sẽ điền vào lệnh \`etcdctl\` ở Tuần 3.

Bên cạnh đó là các **kubeconfig** trong \`/etc/kubernetes/\`: \`admin.conf\` (quyền admin — thứ bạn copy về \`~/.kube/config\`), \`kubelet.conf\`, \`controller-manager.conf\`, \`scheduler.conf\` — mỗi thành phần một file, chứa sẵn cert + key + địa chỉ apiserver. Từ v1.29, kubeadm sinh thêm \`super-admin.conf\` (nhóm \`system:masters\`, vượt mọi RBAC) — \`admin.conf\` giờ chỉ thuộc nhóm admin thường.

\`\`\`bash
ls /etc/kubernetes/pki/          # ca.crt, apiserver.crt, sa.key...
ls /etc/kubernetes/pki/etcd/     # bộ cert riêng của etcd
ls /etc/kubernetes/*.conf        # admin, kubelet, scheduler, controller-manager

# Kiểm tra hạn certificate (câu hỏi thật trong đề):
kubeadm certs check-expiration

# Soi một cert: hạn dùng + cert cấp cho ai (CN/SAN):
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -text | grep -A2 Validity
openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -text | grep DNS
\`\`\`

Cert do kubeadm cấp có hạn **1 năm** — hết hạn là kubectl báo \`x509: certificate has expired\`; thuốc chữa: \`kubeadm certs renew all\` rồi restart các static pod (di chuyển tạm manifest ra ngoài rồi trả lại, hoặc restart kubelet).

⚠️ **Lỗi thường gặp:** dùng cert của apiserver (\`/etc/kubernetes/pki/apiserver.crt\`) cho lệnh \`etcdctl\` — etcd có **CA và cert riêng** trong thư mục \`etcd/\`; và sửa \`admin.conf\` nhưng quên rằng \`~/.kube/config\` là **bản copy** — hai file không tự đồng bộ.`,
      },
    ],
  },
  {
    id: "cka-w2",
    week: "Tuần 2",
    title: "Cài đặt cluster với kubeadm",
    goal: "Tự dựng được cluster từ con số 0.",
    practice: "Dựng cluster 2 node bằng kubeadm trên VM (Vagrant/Multipass) hoặc lab Killercoda.",
    resources: [
      { label: "CKA Cheat Sheet §2 — kubeadm", href: "#/docs/cka-cheat-sheet" },
      { label: "Điều kiện tiên quyết (Linux, systemctl, SSH)", href: "#/docs/prerequisites" },
      { label: "K8s docs: Installing kubeadm", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/" },
      { label: "K8s docs: Creating a cluster with kubeadm", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/" },
      { label: "Killercoda — CKA scenarios", href: "https://killercoda.com/killer-shell-cka" },
    ],
    items: [
      {
        id: "cka-w2-1",
        text: "Cài containerd, kubeadm, kubelet, kubectl",
        lesson: `Trước khi "xây nhà" phải **chuẩn bị mặt bằng**. Một node muốn gia nhập cluster cần: tắt swap (kubelet từ chối chạy khi swap bật), bật kernel module + sysctl cho networking, cài **containerd** (nền móng), rồi mới cài bộ ba \`kubelet\`, \`kubeadm\`, \`kubectl\` từ repo chính thức \`pkgs.k8s.io\`. Lưu ý repo này chia **theo từng minor version** (vd \`v1.33\`) — muốn cài minor khác phải đổi URL repo, chi tiết bạn sẽ gặp lại ở bài upgrade.

Cái bẫy kỹ thuật lớn nhất nằm ở **cgroup driver**: kubelet mặc định dùng \`systemd\`, nhưng config mặc định của containerd lại để \`SystemdCgroup = false\`. Hai bên "lệch pha" thì container cứ khởi động rồi chết liên tục. Phải sửa \`/etc/containerd/config.toml\` trước khi init.

\`\`\`bash
# 1. Tắt swap vĩnh viễn
swapoff -a && sed -i '/swap/d' /etc/fstab

# 2. Kernel module + sysctl cho pod networking
modprobe overlay && modprobe br_netfilter
cat <<EOF | tee /etc/sysctl.d/k8s.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
sysctl --system

# 3. Cài containerd + bật SystemdCgroup
apt-get update && apt-get install -y containerd
mkdir -p /etc/containerd
containerd config default | tee /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
systemctl restart containerd

# 4. Cài bộ ba từ pkgs.k8s.io (repo đã add sẵn theo minor version)
apt-get install -y kubelet kubeadm kubectl
apt-mark hold kubelet kubeadm kubectl   # khóa version, tránh upgrade ngoài ý muốn
systemctl enable --now kubelet
\`\`\`

Sau bước này kubelet sẽ ở trạng thái *crash-loop chờ đợi* — hoàn toàn bình thường: nó đang chờ \`kubeadm init\` hoặc \`join\` cấp config.

⚠️ **Lỗi thường gặp:** quên \`SystemdCgroup = true\` → mọi pod restart vô hạn sau init; và quên \`apt-mark hold\` → một lần \`apt upgrade\` vô tình kéo lệch version cả bộ ba.`,
      },
      {
        id: "cka-w2-2",
        text: "`kubeadm init` — bootstrap control plane; các flag quan trọng",
        lesson: `\`kubeadm init\` là **lễ khởi công** của cluster. Trong vài phút, nó lần lượt: chạy *preflight checks* (swap, port, cgroup...), sinh toàn bộ **certificates** vào \`/etc/kubernetes/pki/\`, viết **static pod manifests** cho apiserver/etcd/scheduler/controller-manager vào \`/etc/kubernetes/manifests/\` (kubelet thấy file là tự kéo control plane dậy), tạo các file kubeconfig, cài addon **CoreDNS + kube-proxy**, và cuối cùng **in ra lệnh \`kubeadm join\`** — hãy lưu lại ngay.

Hai flag quan trọng nhất: **\`--pod-network-cidr\`** — dải IP cấp cho pod, *phải khớp* với CNI bạn định cài (Flannel mặc định \`10.244.0.0/16\`); và **\`--apiserver-advertise-address\`** — IP mà apiserver quảng bá cho node khác kết nối, cần chỉ định rõ khi VM có nhiều card mạng (Vagrant/Multipass rất hay dính bẫy này vì IP mặc định là card NAT). Ngoài ra: \`--kubernetes-version\` chốt version, \`--control-plane-endpoint\` dành cho HA (bài sau).

\`\`\`bash
# Trên node control plane:
kubeadm init --pod-network-cidr=10.244.0.0/16 \\
  --apiserver-advertise-address=192.168.56.10

# Cấu hình kubectl cho user (làm NGAY sau init):
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config

k get nodes
# → controlplane NotReady   ← BÌNH THƯỜNG: chưa cài CNI (bài tiếp theo)
\`\`\`

Nếu init hỏng giữa chừng, \`kubeadm reset\` dọn sạch để làm lại từ đầu.

⚠️ **Lỗi thường gặp:** quên copy \`admin.conf\` rồi hoảng vì \`kubectl\` báo \`connection refused localhost:8080\` — không phải cluster chết, chỉ là chưa có kubeconfig; và chọn \`--pod-network-cidr\` không khớp manifest CNI → pod mạng chạy nhưng cluster network âm thầm lỗi, rất khó lần.`,
      },
      {
        id: "cka-w2-3",
        text: "Cài CNI plugin (Flannel/Calico/Cilium) — vì sao node NotReady khi thiếu CNI",
        lesson: `Kubernetes tự nhận mình **không biết làm mạng** — nó chỉ đặt ra yêu cầu "mọi pod phải nói chuyện được với nhau" rồi giao việc cho **CNI plugin** (Flannel, Calico, Cilium...). Hãy tưởng tượng: các pod là *những ngôi nhà đã xây xong*, còn CNI là *công ty làm đường nội khu* — chưa có đường thì nhà không có địa chỉ, không ai qua lại được.

Cơ chế cụ thể: kubelet khi tạo pod sẽ tìm file config trong \`/etc/cni/net.d/\` và binary trong \`/opt/cni/bin/\` để cấp mạng cho pod. Thiếu config → kubelet báo lên apiserver condition \`NetworkPluginNotReady\` ("container runtime network not ready / cni plugin not initialized") → node bị đánh dấu **NotReady**, pod thường kẹt \`ContainerCreating\`. Riêng **CoreDNS đứng ở Pending** cho đến khi có CNI — đây là "đèn báo" quen thuộc. Cài CNI chỉ là một lệnh \`kubectl apply\` — plugin chạy dưới dạng DaemonSet, tự ghi config vào từng node.

\`\`\`bash
k get nodes                                   # NotReady
k describe node controlplane | grep -i -A3 ready
# → message: ...cni plugin not initialized

ls /etc/cni/net.d/                            # rỗng → chưa có CNI

# Cài Flannel (yêu cầu init với --pod-network-cidr=10.244.0.0/16):
k apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml

watch k get pods -n kube-flannel              # chờ pod flannel Running
k get nodes                                   # → Ready sau ~30 giây
k get pods -n kube-system                     # CoreDNS chuyển Pending → Running
\`\`\`

Trong đề troubleshooting, "node NotReady" có hai thủ phạm quen mặt: **kubelet chết** hoặc **CNI biến mất** — kiểm tra \`systemctl status kubelet\` trước, rồi \`ls /etc/cni/net.d/\`.

⚠️ **Lỗi thường gặp:** thấy CoreDNS Pending liền lao vào debug DNS — thực ra thiếu CNI, DNS vô tội; và cài Flannel trên cluster init với CIDR khác \`10.244.0.0/16\` → phải sửa \`net-conf.json\` trong ConfigMap của Flannel cho khớp.`,
      },
      {
        id: "cka-w2-4",
        text: "`kubeadm join` — thêm worker node; `kubeadm token create --print-join-command`",
        lesson: `Thêm worker vào cluster giống **mời người mới vào nhóm chat kín**: cần một **mã mời** (bootstrap token — có hạn dùng **24 giờ**) và một cách để người mới *xác minh đúng nhóm thật* — đó là \`--discovery-token-ca-cert-hash\`: hash SHA-256 của CA public key, giúp worker chắc chắn apiserver ở đầu dây bên kia đúng là cluster mình định vào, không phải kẻ mạo danh (chống man-in-the-middle). Token để cluster tin worker; hash để worker tin cluster — **tin cậy hai chiều**.

Lệnh join đầy đủ được in ra sau \`kubeadm init\`, nhưng thực tế (và trong đề thi) bạn thường phải thêm node khi token cũ đã hết hạn. Đừng cố ghép tay từng flag — có lệnh in sẵn cả câu: \`kubeadm token create --print-join-command\`. Điều kiện tiên quyết: worker đã cài containerd + kubeadm + kubelet (bài w2-1), và mở được port **6443** tới control plane.

\`\`\`bash
# Trên CONTROL PLANE — in lệnh join hoàn chỉnh (token mới + hash):
kubeadm token create --print-join-command
kubeadm token list                       # xem token còn hạn không

# Trên WORKER (chạy với sudo/root):
kubeadm join 192.168.56.10:6443 --token abcdef.0123456789abcdef \\
  --discovery-token-ca-cert-hash sha256:aa1b2c3d4e5f...
exit                                     # xong việc trên worker → về máy chính

# Verify từ control plane:
k get nodes -o wide                      # node01 xuất hiện, Ready sau khi CNI phủ tới
k label node node01 node-role.kubernetes.io/worker=   # (tùy chọn) cho cột ROLES đẹp
\`\`\`

Muốn gỡ node ra: \`kubeadm reset\` chạy **trên chính node đó**, rồi \`kubectl delete node node01\` từ máy chính.

⚠️ **Lỗi thường gặp:** dùng lại lệnh join cũ với token đã quá 24h → \`could not find a JWS signature\`; và chạy \`kubeadm join\` xong quên \`exit\`, câu sau cứ thế gõ \`kubectl\` trên worker (nơi không có kubeconfig) — mất thời gian oan trong phòng thi.`,
      },
      {
        id: "cka-w2-5",
        text: "HA control plane (nhiều master + load balancer) — mức hiểu",
        lesson: `Một cluster chỉ có một control plane node giống tòa nhà chỉ có **một quầy lễ tân** — lễ tân nghỉ ốm là mọi giao dịch đứng hình (app đang chạy thì vẫn chạy, nhưng không deploy/sửa/scale gì được nữa). **HA control plane** = mở **nhiều quầy lễ tân** (thường 3 node) và đặt một **số tổng đài chung** — load balancer — phía trước: mọi client (kubectl, kubelet các node) chỉ biết địa chỉ tổng đài, quầy nào sống thì tổng đài nối vào quầy đó.

Hai kiến trúc cần phân biệt ở mức hiểu: **stacked etcd** — etcd chạy chung trên từng control plane node (kubeadm mặc định, đơn giản, đủ cho đa số); và **external etcd** — etcd tách thành cụm riêng (cách ly rủi ro, nhưng tốn gấp đôi máy). Với etcd, số node phải **lẻ**: cụm 3 chịu được 1 node chết (quorum = đa số = 2/3); cụm 2 node còn *tệ hơn* 1 node vì mất 1 là mất quorum, cả cụm tê liệt.

Chìa khóa khi dựng bằng kubeadm là flag **\`--control-plane-endpoint\`**: phải là địa chỉ của **load balancer** (DNS càng tốt), tuyệt đối không phải IP của master đầu tiên — vì địa chỉ này được "nướng" vào certificate và mọi kubeconfig, sau này gần như không đổi được.

\`\`\`bash
# Master đầu tiên — endpoint là địa chỉ LB, upload certs để master sau tải về:
kubeadm init --control-plane-endpoint "lb.example.com:6443" \\
  --upload-certs --pod-network-cidr=10.244.0.0/16

# Thêm control plane node (lệnh + certificate-key do init in ra):
kubeadm join lb.example.com:6443 --token abcdef.0123456789abcdef \\
  --discovery-token-ca-cert-hash sha256:aa1b2c... \\
  --control-plane --certificate-key f8a2b1...

k get nodes   # nhiều node mang role control-plane
\`\`\`

⚠️ **Lỗi thường gặp:** init bằng IP master đầu tiên rồi mới tính chuyện HA — muốn thêm master phải làm lại endpoint, rất đau; và dựng 2 control plane node cho "an toàn" — với etcd, **chẵn là dở**, 3 mới là con số HA nhỏ nhất.`,
      },
      {
        id: "cka-w2-6",
        text: "Kubeconfig: cấu trúc file, contexts, users, clusters",
        lesson: `File kubeconfig (mặc định \`~/.kube/config\`) là **sổ danh bạ kèm thẻ ra vào** của bạn. Nó có đúng 3 danh sách: **clusters** — các "tòa nhà" bạn biết (URL apiserver + CA để xác minh đúng tòa nhà thật); **users** — các "thẻ nhân viên" (client cert/key, hoặc token); và **contexts** — từng *tổ hợp* "tôi vào tòa nhà nào, bằng thẻ nào, làm việc ở tầng (namespace) nào". Trường \`current-context\` chỉ định context đang dùng — mọi lệnh \`kubectl\` không có cờ gì thêm đều đi theo nó.

\`\`\`yaml
apiVersion: v1
kind: Config
clusters:                      # danh sách cluster
- name: kubernetes
  cluster:
    server: https://172.30.1.2:6443        # URL apiserver — chú ý PORT!
    certificate-authority-data: LS0t...     # CA (base64)
users:                         # danh sách "thẻ"
- name: kubernetes-admin
  user:
    client-certificate-data: LS0t...
    client-key-data: LS0t...
contexts:                      # tổ hợp (cluster, user, namespace)
- name: kubernetes-admin@kubernetes
  context:
    cluster: kubernetes        # phải KHỚP tên trong clusters
    user: kubernetes-admin     # phải KHỚP tên trong users
    namespace: default
current-context: kubernetes-admin@kubernetes
\`\`\`

Bộ lệnh thao tác hằng ngày: \`k config get-contexts\` (liệt kê, dấu \`*\` là context hiện tại), \`k config use-context <ctx>\` (chuyển), \`k config set-context --current --namespace=dev\` (đổi namespace mặc định — đáng làm đầu mỗi câu thi), \`k config view --raw\` (xem đầy đủ cả cert). Dùng file khác: \`k --kubeconfig=/root/other.conf get nodes\` hoặc biến môi trường \`KUBECONFIG\`.

Đây còn là **đất diễn của đề troubleshooting**: "kubectl không kết nối được" mà cluster vẫn sống → soi kubeconfig trước tiên.

⚠️ **Lỗi thường gặp:** sai port trong \`server:\` (kinh điển: \`6433\` thay vì \`6443\`) → \`connection refused\`; và context trỏ tới tên cluster/user **không tồn tại** trong hai danh sách kia — tên phải khớp từng ký tự.`,
      },
    ],
  },
  {
    id: "cka-w3",
    week: "Tuần 3",
    title: "etcd Backup/Restore & Cluster Upgrade ⭐",
    goal: "Gần như chắc chắn ra thi — học thuộc quy trình như bài văn mẫu.",
    practice: "Backup etcd → tạo vài resource → restore → xác nhận resource biến mất. Upgrade cluster lên 1 minor version.",
    resources: [
      { label: "CKA Cheat Sheet §3–4 — etcd & Upgrade", href: "#/docs/cka-cheat-sheet" },
      { label: "Flashcards — ôn quy trình thuộc lòng", href: "#/flashcards" },
      { label: "K8s docs: Operating etcd clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" },
      { label: "K8s docs: Upgrading kubeadm clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/" },
      { label: "Killercoda — CKA scenarios", href: "https://killercoda.com/killer-shell-cka" },
    ],
    items: [
      {
        id: "cka-w3-1",
        text: "etcd backup: `etcdctl snapshot save` với đầy đủ cert flags",
        lesson: `etcd là **sổ cái duy nhất** của cluster — mất nó là mất sạch mọi Deployment, Service, Secret... Backup etcd = **photocopy nguyên cuốn sổ cái** đem cất két. Đây là câu "quốc dân" của CKA: gần như chắc chắn xuất hiện, điểm cao, và ăn thua ở việc bạn **thuộc lòng 4 cert flag**.

Vì etcd chỉ tiếp khách qua TLS hai chiều (bài w1-5), \`etcdctl\` phải xuất trình đủ bộ: \`--endpoints\` (mặc định \`https://127.0.0.1:2379\` — chạy lệnh ngay trên node control plane), \`--cacert\` (CA của etcd để xác minh server), \`--cert\` + \`--key\` (thẻ của chính bạn). Cả 4 giá trị đều đọc được từ \`/etc/kubernetes/manifests/etcd.yaml\` (bài w3-3). Biến \`ETCDCTL_API=3\` là dây an toàn — etcdctl bản mới mặc định API v3 rồi, nhưng ghi ra không mất gì.

\`\`\`bash
# Trên node control plane (đề sẽ chỉ định đường dẫn file backup):
ETCDCTL_API=3 etcdctl snapshot save /opt/backup/etcd.db \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key

# Verify snapshot vừa tạo:
ETCDCTL_API=3 etcdctl snapshot status /opt/backup/etcd.db --write-out=table
# (etcdctl bản mới tách lệnh này sang: etcdutl snapshot status)
\`\`\`

Luyện đến mức gõ trôi cả khối trên **dưới 2 phút** không nhìn tài liệu. Mẹo nhớ flag: *"CA – Cert – Key, endpoint hai-ba-bảy-chín"*. Lưu ý \`snapshot save\` luôn tạo snapshot **mới nhất tại thời điểm chạy** từ member đang kết nối.

⚠️ **Lỗi thường gặp:** quên cert flags hoặc lấy nhầm cert của **apiserver** thay vì bộ trong \`pki/etcd/\` → lệnh treo rồi \`context deadline exceeded\`; và lưu file sai đường dẫn đề yêu cầu — chấm điểm tự động soi đúng path, sai path là 0 điểm dù backup thành công.`,
      },
      {
        id: "cka-w3-2",
        text: "etcd restore: snapshot restore → trỏ etcd static pod sang data-dir mới",
        lesson: `Restore etcd giống **chép sổ cái backup ra một cuốn sổ MỚI TINH, rồi bảo kế toán từ nay dùng cuốn mới** — tuyệt đối không viết đè lên cuốn đang dùng. Quy trình chuẩn 3 bước, học thuộc như bài văn mẫu:

**Bước 1 — restore ra data-dir mới.** Đây là thao tác **offline**: \`snapshot restore\` chỉ đọc file snapshot và bung ra thư mục — *không cần endpoints hay cert* (khác hẳn backup). **Bước 2 — trỏ etcd sang thư mục mới.** etcd chạy dưới dạng static pod; mở \`/etc/kubernetes/manifests/etcd.yaml\` và đổi \`hostPath.path\` của volume \`etcd-data\` sang data-dir mới. Kubelet thấy file thay đổi sẽ tự restart etcd; apiserver mất etcd cũng tự khởi động lại theo. **Bước 3 — chờ và verify.**

\`\`\`bash
# 1. Restore ra thư mục MỚI (offline — không cần cert):
ETCDCTL_API=3 etcdctl snapshot restore /opt/backup/etcd.db \\
  --data-dir=/var/lib/etcd-restore
# (etcdctl bản mới: etcdutl snapshot restore /opt/backup/etcd.db --data-dir=/var/lib/etcd-restore)

# 2. Trỏ static pod sang data-dir mới:
vim /etc/kubernetes/manifests/etcd.yaml
#  volumes:
#  - hostPath:
#      path: /var/lib/etcd-restore     # ← đổi từ /var/lib/etcd
#      type: DirectoryOrCreate
#    name: etcd-data

# 3. Chờ kubelet restart etcd + apiserver (30–60s):
watch crictl ps                         # etcd rồi apiserver lần lượt sống lại
k get pods -A                           # resource tạo SAU lúc backup đã biến mất
\`\`\`

Mẹo quan trọng: chỉ cần đổi \`hostPath.path\`; flag \`--data-dir\` trong \`command\` của container trỏ tới mountPath **bên trong** container nên thường giữ nguyên.

⚠️ **Lỗi thường gặp:** hì hục sửa \`--data-dir\` trong command mà quên volume \`hostPath\` — etcd vẫn đọc dữ liệu cũ; và mới chờ 10 giây đã kết luận restore hỏng — static pod cần 30–60 giây, cứ \`watch crictl ps\` mà đợi.`,
      },
      {
        id: "cka-w3-3",
        text: "Tìm thông số etcd (endpoints, certs) từ `/etc/kubernetes/manifests/etcd.yaml`",
        lesson: `Đề thi sẽ không bao giờ đưa sẵn cert paths cho bạn — giống kỳ thi **được mang tài liệu nhưng phải biết mở đúng trang**. "Trang" đó là \`/etc/kubernetes/manifests/etcd.yaml\`: manifest static pod của etcd, nơi mọi flag khởi động được viết rõ ràng trong phần \`command\`. Kỹ năng cần luyện: đọc manifest này trong 30 giây và **ánh xạ** flag của *etcd server* sang flag của *etcdctl client* — tên chúng cố tình khác nhau:

- \`--trusted-ca-file\` (server) → \`--cacert\` (etcdctl)
- \`--cert-file\` → \`--cert\`
- \`--key-file\` → \`--key\`
- \`--listen-client-urls\` / \`--advertise-client-urls\` → \`--endpoints\` (thường \`https://127.0.0.1:2379\`)
- \`--data-dir\` → nơi dữ liệu nằm (mặc định \`/var/lib/etcd\`) — cần cho bài restore

\`\`\`bash
# Lọc nhanh các flag cần thiết:
grep -E 'listen-client-urls|advertise-client-urls|cert-file|key-file|trusted-ca-file|data-dir' \\
  /etc/kubernetes/manifests/etcd.yaml

# Cách khác khi không nhớ đường dẫn manifest — soi process đang chạy:
ps aux | grep -v grep | grep etcd

# Hoặc hỏi qua kubectl (khi apiserver còn sống):
k describe pod etcd-controlplane -n kube-system | grep -A15 Command
\`\`\`

Cẩn thận **cặp cert dễ nhầm**: trong \`etcd.yaml\` còn có \`--peer-cert-file\`, \`--peer-key-file\`, \`--peer-trusted-ca-file\` — bộ này dành cho etcd **nói chuyện giữa các member** (port 2380), không phải cho client. etcdctl chỉ dùng bộ *không có chữ peer*. Tương tự, port **2379** là cửa client, **2380** là cửa nội bộ peer — điền nhầm 2380 vào \`--endpoints\` là treo lệnh.

⚠️ **Lỗi thường gặp:** copy nhầm \`peer.crt\`/\`peer-trusted-ca\` vào lệnh etcdctl → TLS handshake fail khó hiểu; và mất thời gian lục docs tìm cert path trong khi mọi đáp án đã nằm sẵn trong \`etcd.yaml\` trên chính node đó.`,
      },
      {
        id: "cka-w3-4",
        text: "Cluster upgrade với kubeadm: control plane trước → worker sau; drain/uncordon",
        lesson: `Upgrade cluster giống **thay động cơ cho phi đội đang bay**: thay **từng chiếc một**, chiếc nào vào xưởng thì hành khách (pod) chuyển sang chiếc khác trước. Ba nguyên tắc vàng: **control plane trước, worker sau**; **mỗi lần chỉ 1 minor version** (1.32 → 1.33, không nhảy cóc); **drain trước khi đụng vào kubelet, uncordon sau khi xong**.

Trình tự trên mỗi node luôn là: upgrade **kubeadm** (công cụ) → \`kubeadm upgrade apply\` (control plane đầu tiên) hoặc \`kubeadm upgrade node\` (mọi node còn lại) → drain → upgrade **kubelet + kubectl** → restart kubelet → uncordon. Từ khi K8s chuyển sang repo \`pkgs.k8s.io\`, mỗi minor version là **một repo riêng** — bước 0 bắt buộc là sửa \`/etc/apt/sources.list.d/kubernetes.list\` sang minor mới rồi \`apt-get update\`, không làm thì \`apt\` không bao giờ thấy version mới.

\`\`\`bash
# ===== CONTROL PLANE =====
# 0. Đổi repo sang minor mới trong /etc/apt/sources.list.d/kubernetes.list
#    (v1.32 → v1.33) rồi: apt-get update

# 1. Upgrade kubeadm, xem plan, apply:
apt-mark unhold kubeadm && apt-get install -y kubeadm=1.33.2-1.1 && apt-mark hold kubeadm
kubeadm upgrade plan                  # liệt kê version đích khả dụng
kubeadm upgrade apply v1.33.2         # chỉ chạy trên control plane ĐẦU TIÊN

# 2. Drain → kubelet/kubectl → uncordon:
k drain controlplane --ignore-daemonsets
apt-mark unhold kubelet kubectl
apt-get install -y kubelet=1.33.2-1.1 kubectl=1.33.2-1.1
apt-mark hold kubelet kubectl
systemctl daemon-reload && systemctl restart kubelet
k uncordon controlplane

# ===== MỖI WORKER =====
k drain node01 --ignore-daemonsets --force     # từ máy chính
ssh node01                                     # rồi trên worker:
#   upgrade kubeadm (như trên) → kubeadm upgrade node   ← KHÔNG phải "apply"!
#   upgrade kubelet → systemctl daemon-reload && systemctl restart kubelet
exit
k uncordon node01
k get nodes                                    # verify cột VERSION
\`\`\`

⚠️ **Lỗi thường gặp:** chạy \`kubeadm upgrade apply\` trên worker (worker chỉ dùng \`upgrade node\` — nhẹ hơn nhiều, chỉ cập nhật config kubelet); và quên \`k uncordon\` sau khi xong — node đứng \`SchedulingDisabled\` mãi mãi, mất điểm oan.`,
      },
      {
        id: "cka-w3-5",
        text: "Quy tắc version skew giữa kubelet và apiserver",
        lesson: `Vì không thể upgrade cả cluster trong một nốt nhạc, Kubernetes cho phép các thành phần **lệch version có kiểm soát** — gọi là *version skew policy*. Cách nhớ: **apiserver là anh cả** — không thành phần nào trong cluster được phép **mới hơn** apiserver. Giống một công ty: nhân viên (kubelet) được phép dùng quy trình cũ vài đời, nhưng không ai được "đi trước" trưởng phòng.

Các quy tắc cụ thể (áp dụng từ K8s 1.28, khi kubelet được nới từ n-2 lên n-3):

- **kubelet**: bằng hoặc **thấp hơn apiserver tối đa 3 minor** — apiserver 1.33 chấp nhận kubelet 1.30 → 1.33; kubelet 1.34 là *vi phạm*.
- **kube-scheduler / kube-controller-manager**: không mới hơn apiserver, thấp hơn tối đa 1 minor.
- **kubectl**: trong khoảng **±1 minor** so với apiserver (1.32/1.33/1.34 đều nói chuyện được với apiserver 1.33).
- **HA nhiều apiserver**: các apiserver lệch nhau tối đa 1 minor.

Chính quy tắc này *giải thích thứ tự upgrade* ở bài trước: phải nâng control plane (apiserver) lên trước thì kubelet mới có "trần" mới để nâng theo — làm ngược lại là kubelet mới hơn apiserver, trạng thái không được hỗ trợ, kubelet có thể từ chối đăng ký node.

\`\`\`bash
k get nodes                  # cột VERSION = version KUBELET từng node
k version                    # so Client Version (kubectl) với Server Version (apiserver)
kubeadm version              # version công cụ kubeadm
kubeadm upgrade plan         # tự kiểm tra và cảnh báo skew trước khi upgrade

# Ví dụ trạng thái HỢP LỆ trong lúc upgrade dở dang:
#   apiserver 1.33  |  kubelet node01 1.32  |  kubelet node02 1.30   ✔ (trong n-3)
#   apiserver 1.32  |  kubelet node01 1.33                            ✘ kubelet MỚI HƠN apiserver
\`\`\`

Trong đề thi, skew hiện ra dưới dạng gián tiếp: câu upgrade chỉ yêu cầu nâng control plane, hoặc hỏi vì sao node version cũ vẫn Ready — bình tĩnh đối chiếu bảng quy tắc.

⚠️ **Lỗi thường gặp:** upgrade kubelet trên worker **trước** khi nâng control plane → kubelet mới hơn apiserver; và tưởng \`k get nodes\` hiển thị version apiserver — cột VERSION là của **kubelet**, muốn xem apiserver phải dùng \`k version\`.`,
      },
    ],
  },
];
