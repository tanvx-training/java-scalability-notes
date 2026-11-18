// Chặng 5 — Networking.
// s26–s28 đã phát hành (đợt 3); s29–s32 là buổi khung (check-data PR7), nội dung đầy đủ ở các task sau.

export const sessions = [
// ───────────────────────────── s26 ─────────────────────────────
  {
    id: "s26",
    stage: "st5",
    title: "Mạng Pod tới Pod và CNI soi từ trên node",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-pod-conn"],
    requires: ["s25"],
    status: "published",
    pieces: [],
    goals: [
      "Lần một gói tin từ Pod gateway trên cka-w1 tới Pod catalog trên cka-w2: veth, route, tunnel của Calico.",
      "Vào network namespace của một container bằng nsenter và bắt gói bằng tcpdump trên node.",
      "Chỉ ra kubelet gọi plugin CNI từ đâu và cấu hình CNI nằm ở tệp nào.",
    ],
    skills: [
      { skill: "net-pod-network-model", level: "Giải thích được" },
      { skill: "k-calico-status", level: "Gõ được không tra" },
      { skill: "net-node-pod-routes", level: "Đọc hiểu được" },
      { skill: "net-tcpdump", level: "Gõ được có tra" },
      { skill: "lx-nsenter", level: "Làm được có tra" },
      { skill: "k-cni-paths", level: "Biết đường dẫn không tra" },
      { skill: "k-tmp-pod", level: "Thành phản xạ" },
    ],
    uses: ["net-netns-veth", "net-ip-route", "k-crictl-ps", "k-get-wide", "k-ext-interfaces"],
    foundation: {
      area: "network",
      md: `Buổi này là bài lab network namespace của s04, chỉ khác người dựng: ở s04 bạn tự gõ \`ip netns add\`, \`ip link add … type veth\`; ở đây plugin CNI của Calico làm đúng những lệnh đó cho mỗi Pod. Ôn nhanh ba ý (bài đầy đủ: [s04 — Linux network](#/practice/cka/s04)):

**1. Network namespace là một bản sao riêng của ngăn xếp mạng.** Mỗi namespace có interface, bảng route, rule iptables, bảng conntrack của riêng nó. Mọi container trong một Pod dùng chung một network namespace (do container \`pause\` giữ), nên chúng gọi nhau qua \`localhost\` và cùng một IP. Trên node, namespace của Pod hiện ra trong \`ip netns list\` dưới tên \`cni-<uuid>\` (containerd tạo ở \`/var/run/netns/\`).

**2. veth là một sợi cáp hai đầu.** Gói đi vào đầu này thì ra ở đầu kia. Một đầu nằm trong namespace của Pod (tên \`eth0\`), đầu kia nằm ở namespace gốc của node (Calico đặt tên \`cali<11 ký tự hex>\`). \`ip addr\` trong Pod in \`eth0@if9\`: số 9 là **ifindex của đầu kia** trên node, và \`ip -o link\` trên node in \`9: cali599a3c2b8b4@if3\` (3 là ifindex của \`eth0\` bên trong). Hai con số đó là cách nhanh nhất để ghép Pod với interface trên node.

**3. Không có bridge.** Ở s04 hai namespace nối nhau qua một bridge hay một cặp veth trực tiếp. Calico không dùng bridge: mỗi Pod chỉ có một route \`/32\` trên node trỏ vào đúng veth của nó, và kernel của node định tuyến (layer 3) giữa các Pod. Trong Pod, route mặc định trỏ tới \`169.254.1.1\`, một địa chỉ không ai mang: đầu \`cali*\` trả lời ARP cho mọi địa chỉ (proxy ARP, MAC \`ee:ee:ee:ee:ee:ee\`), nên mọi gói ra khỏi Pod đều rơi vào node.

| Lệnh | Ở đâu | Cho biết |
|---|---|---|
| \`ip -o link \\| grep cali\` | node | đầu veth của từng Pod trên node đó |
| \`ip route\` | node | route \`/32\` tới từng Pod cục bộ, route \`/26\` qua \`tunl0\` tới Pod của node khác |
| \`ip -o route get <IP Pod>\` | node | gói tới IP đó đi ra interface nào |
| \`nsenter -t <PID> -n ip addr\` | node, root | chạy \`ip\` trong network namespace của tiến trình PID (công cụ của node, không cần công cụ trong image) |`,
    },
    mindset: `**Mô hình mạng của Kubernetes chỉ có ba luật**, Kubernetes không tự làm luật nào, plugin CNI phải làm: mỗi Pod một IP riêng; Pod gọi Pod ở bất kỳ node nào **không qua NAT** (IP nguồn mà Pod đích thấy là IP thật của Pod nguồn); agent trên node (kubelet) gọi được mọi Pod trên node đó. Cách thực hiện là chuyện của từng CNI: Calico (lab này) định tuyến layer 3 và bọc gói giữa các node, Flannel dùng bridge + VXLAN, Cilium dùng eBPF.

**Một gói từ gateway (cka-w1) tới catalog (cka-w2)**, đúng các địa chỉ đo trên lab:

\`\`\`text
Pod gateway 10.244.95.180 (cka-w1)                            Pod catalog 10.244.62.157 (cka-w2)
  eth0 ── route default via 169.254.1.1                         eth0 (eth0@if9)
   │ veth                                                         ▲ veth
  cali… (cka-w1)                                                cali599a3c2b8b4 (ifindex 9 trên cka-w2)
   │ route 10.244.62.128/26 via 192.168.252.37 dev tunl0          │ route 10.244.62.157 dev cali599a3c2b8b4
  tunl0: bọc IP-in-IP (proto 4)                                 tunl0: bóc lớp ngoài
   │ enp0s1 192.168.252.36 ───── gói ngoài 192.168.252.36 → .37 ──▶ enp0s1 192.168.252.37
\`\`\`

Gói bên trong giữ nguyên \`10.244.95.180 → 10.244.62.157\`: không NAT, đúng luật thứ hai. Gói bên ngoài là IP thường giữa hai node, nên mạng Multipass (vốn không biết gì về \`10.244.0.0/16\`) vẫn chuyển được.

**Calico trên lab: IPIP, mỗi node một khối /26.** IPPool \`default-ipv4-ippool\` (\`10.244.0.0/16\`, \`ipipMode: Always\`, \`vxlanMode: Never\`, \`blockSize: 26\`) là chế độ mặc định của manifest \`calico.yaml\` v3.33.0. Calico IPAM cắt pool thành khối 64 địa chỉ và gán khối cho node (\`k get blockaffinities.crd.projectcalico.org\`): cka-w2 giữ \`10.244.62.128/26\`, cka-w1 \`10.244.95.128/26\`, cka-cp \`10.244.160.0/26\`. Felix, agent chạy trong Pod \`calico-node\` của mỗi node, đọc khối của mọi node từ API và tự viết route: \`/32\` cho từng Pod cục bộ, \`blackhole\` cho phần còn trống của khối mình, \`/26\` qua \`tunl0\` tới khối của node khác (\`k get felixconfiguration default -o yaml\`: \`programClusterRoutes: EnabledIPIPOnly\`; mọi route đó mang \`proto 80\`). BIRD (BGP, \`calico_backend: bird\` trong ConfigMap \`calico-config\`) vẫn chạy cạnh Felix, dùng khi cluster trao đổi route với router thật. Interface tunnel tuỳ chế độ: IPIP là \`tunl0\` (MTU 1480 = 1500 − 20 byte header IP ngoài), VXLAN là \`vxlan.calico\` (MTU 1450), không bọc (\`Never\`/\`Never\`, chỉ dùng được khi mạng giữa các node chịu định tuyến dải Pod) thì không có tunnel. \`tcpdump\` trên \`tunl0\` thấy gói **bên trong** (IP Pod), trên \`enp0s1\` thấy gói **bên ngoài** \`IP 192.168.252.36 > 192.168.252.37: IP 10.244.95.183.36458 > 10.244.62.139.5432\`.

**Ai gọi CNI, khi nào.** kubelet không nói chuyện với CNI. kubelet gọi containerd qua CRI (\`RunPodSandbox\`); containerd tạo network namespace rồi đọc tệp cấu hình **đầu tiên theo thứ tự tên** trong \`/etc/cni/net.d/\` (ở lab: \`10-calico.conflist\`, chỉ root đọc được) và chạy lần lượt các plugin trong danh sách \`plugins\` của nó: binary cùng tên ở \`/opt/cni/bin/\` (\`calico\`, rồi \`portmap\`), truyền tham số qua biến môi trường (\`CNI_COMMAND=ADD\`, \`CNI_NETNS\`, \`CNI_IFNAME=eth0\`) và cấu hình JSON qua stdin. Plugin \`calico\` gọi \`calico-ipam\` lấy một IP trong khối của node, tạo cặp veth, đặt route, ghi WorkloadEndpoint. Thiếu tệp trong \`/etc/cni/net.d\` (Calico chưa cài, s07) là node \`NotReady\` với \`NetworkPluginNotReady\`, Pod đứng \`ContainerCreating\`. \`/opt/cni/bin\` còn nhiều plugin khác (\`bridge\`, \`host-local\`, \`flannel\`…) từ gói \`kubernetes-cni\`: có binary không có nghĩa là đang dùng, chỉ tệp trong \`net.d\` mới quyết định.

**Vì sao cần nsenter.** Image của shop (Temurin JRE) không có \`ip\`, \`ss\` hay \`tcpdump\`, và image distroless thậm chí không có shell. \`nsenter -t <PID> -n\` chạy công cụ **của node** trong network namespace của container: thấy đúng \`eth0\`, route, socket của Pod mà không phải cài gì vào image. PID lấy từ \`crictl inspect\` (trường \`.info.pid\`). Đây cũng là cách debug "Pod không ra được Internet" hay "Pod nghe cổng nào" (\`nsenter -t $PID -n ss -ltn\`) khi \`k exec\` không có công cụ.`,
    refs: [
      { label: "Bài thực hành s04 — Linux network: ip, route, DNS, iptables, network namespace", href: "#/practice/cka/s04" },
      { label: "Bài lộ trình CKA: CNI — config ở /etc/cni/net.d/, binary ở /opt/cni/bin/", href: "#/roadmap/cka/cka-w6-3" },
      { label: "Bài lộ trình CKA: Cài CNI — vì sao node NotReady khi thiếu CNI", href: "#/roadmap/cka/cka-w2-3" },
      { label: "kubernetes.io: Cluster Networking (mô hình mạng)", href: "https://kubernetes.io/docs/concepts/cluster-administration/networking/" },
      { label: "kubernetes.io: Network Plugins (CNI, kubelet và container runtime)", href: "https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/" },
      { label: "Calico: Overlay networking (IPIP, VXLAN)", href: "https://docs.tigera.io/calico/latest/networking/configuring/vxlan-ipip" },
      { label: "CNI spec (biến CNI_COMMAND, cấu hình .conflist)", href: "https://www.cni.dev/docs/spec/" },
    ],
    stateIn: "Đầu ra s25: shop chạy đủ với PostgreSQL (gateway 2 replica, catalog theo HPA 2–3, order, postgres-0 trên cka-w2). Calico v3.33.0 cài bằng manifest, pod CIDR 10.244.0.0/16, kube-proxy chế độ iptables. `./labs/lab begin cka s26` kiểm đầu vào bằng verify của s25, tạo ~/drills/s26 và xoá answers.env cũ.",
    stateOut: "Không đổi cluster; ~/drills/s26/answers.env ghi IP và node của một Pod catalog, interface cali* của nó trên node, interface tunnel của Calico và tệp cấu hình CNI.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s26`. `k get pod -o wide -l 'app in (gateway,catalog)'`: chọn một Pod `gateway` trên cka-w1 và một Pod `catalog` trên cka-w2 (không có thì lấy hai Pod khác node bất kỳ). Ghi `CATALOG_POD_IP=<IP>` và `CATALOG_NODE=<node>` của Pod catalog vào `~/drills/s26/answers.env`. Xem Calico: `k -n kube-system get pod -l k8s-app=calico-node -o wide`, `k get ippools.crd.projectcalico.org -o yaml` (chế độ `ipipMode`/`vxlanMode`?), `k get blockaffinities.crd.projectcalico.org` (khối nào của node nào?)." },
      { id: "t2", text: "Trên node chứa catalog (`ssh cka-w2` từ cka-cp): `ip route`. Route nào tới IP Pod catalog, route nào tới khối của node kia, đi qua interface nào? `ip -o route get <CATALOG_POD_IP>`, `ip -d link show tunl0`. Ghi `HOST_VETH=<interface cali* tới Pod catalog>` và `TUNNEL_IFACE=<interface tunnel của chế độ bạn đọc ở t1>`." },
      { id: "t3", text: "Vào network namespace của container catalog: `sudo crictl pods --name <pod>` → `sudo crictl ps --pod <id pod>` → `PID=$(sudo crictl inspect <id container> | jq .info.pid)` → `sudo nsenter -t $PID -n ip addr show eth0` và `sudo nsenter -t $PID -n ip route`. Số sau `eth0@if` khớp interface nào trên node? Route mặc định trỏ đâu? `k exec` vào Pod catalog rồi gõ `ip addr` được không, vì sao?" },
      { id: "t4", text: "Bắt gói: một cửa sổ trên cka-w2 `sudo tcpdump -ni tunl0 host <CATALOG_POD_IP> and tcp port 8080`, cửa sổ thứ hai `sudo tcpdump -ni enp0s1 ip proto 4 -c 5`. Từ cka-cp gọi thẳng IP Pod từ một Pod tạm ghim cka-w1: `k run tmp --image=busybox:1.37 --rm -it --restart=Never --overrides='{\"spec\":{\"nodeName\":\"cka-w1\"}}' -- wget -qO- http://<CATALOG_POD_IP>:8080/products`. Hai cửa sổ thấy IP nào? Gọi `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/api/products` vài lần: gói từ gateway có đi qua tunnel không (tuỳ gateway chọn Pod catalog nào)?" },
      { id: "t5", text: "CNI: `sudo ls -l /etc/cni/net.d/`, `sudo cat /etc/cni/net.d/10-calico.conflist`, `ls /opt/cni/bin/`. Plugin nào chạy, theo thứ tự nào, IPAM nào? Ghi `CNI_CONF=<tên tệp cấu hình mà containerd dùng>`. Trên Mac: `./labs/lab verify cka s26` phải đạt 4/4." },
      { id: "t6", text: "Tình huống hỏng (chỉ đọc, không gây thật): giả sử một node mới chưa có tệp trong `/etc/cni/net.d`. Node ở trạng thái gì, Pod xếp lên đó ở trạng thái gì, Event gì? So với điều bạn đã thấy ở s07 trước khi cài Calico. Rồi trả lời: Pod tạm ở t4 thấy IP nguồn nào của Pod gateway/tmp, có bị NAT không?" },
    ],
    hints: [
      "`ip route` trên node có ba loại dòng của Calico: `<IP Pod> dev cali…` (Pod trên node này), `<khối>/26 via <IP node khác> dev tunl0 onlink` (Pod của node khác), `blackhole <khối của mình>/26` (địa chỉ chưa cấp trong khối của node: gói tới đó bị bỏ thay vì đi ra route mặc định).",
      "Tên `cali*` không ngẫu nhiên: Calico lấy 11 ký tự đầu của SHA-1 của `<namespace>.<tên Pod>`. Không cần nhớ công thức, `ip -o route get <IP>` trả thẳng tên.",
      "`crictl` cần root: `sudo crictl …`. `crictl ps` không có cột IP; `crictl pods --name <tên Pod> -q` lấy id sandbox, `crictl ps --pod <id> -q` lấy id container. Không có `jq` thì `sudo crictl inspect -o go-template --template '{{.info.pid}}' <id>`.",
      "`tcpdump` trên `tunl0` không thấy gì: Pod tạm có thể đã được xếp cùng node với catalog (khi đó gói đi thẳng giữa hai veth, không qua tunnel). Ghim nó vào node kia bằng `--overrides` với `nodeName`.",
      "`/etc/cni/net.d` chỉ root đọc được (`-rw-------`): `ls` không `sudo` báo `Permission denied`, không phải thư mục rỗng.",
      "`ssh cka-w2` không có sudo không mật khẩu? Trên lab user `ubuntu` có; nếu bạn dùng `multipass shell cka-w2` từ Mac cũng được.",
    ],
    solution: `Output là của máy soạn bài; tên Pod, IP và interface sẽ khác. Context đã ở namespace shop.

**1. Chọn Pod, xem Calico**

\`\`\`bash
k get pod -o wide -l 'app in (gateway,catalog)'
# catalog-6977c4d66f-bnmd7   1/1   Running   …   10.244.62.157   cka-w2   …
# catalog-6977c4d66f-zdnbh   1/1   Running   …   10.244.95.176   cka-w1   …
# gateway-55f6b8dc58-vg9jf   1/1   Running   …   10.244.62.155   cka-w2   …
# gateway-55f6b8dc58-x8jsd   1/1   Running   …   10.244.95.180   cka-w1   …
k -n kube-system get pod -l k8s-app=calico-node -o wide
# calico-node-4vf9l   1/1   Running   …   192.168.252.35   cka-cp   …
# calico-node-bhzlq   1/1   Running   …   192.168.252.36   cka-w1   …
# calico-node-qn2dk   1/1   Running   …   192.168.252.37   cka-w2   …
k get ippools.crd.projectcalico.org -o custom-columns=NAME:.metadata.name,CIDR:.spec.cidr,IPIP:.spec.ipipMode,VXLAN:.spec.vxlanMode,BLOCK:.spec.blockSize
# NAME                  CIDR            IPIP     VXLAN   BLOCK
# default-ipv4-ippool   10.244.0.0/16   Always   Never   26
printf 'CATALOG_POD_IP=10.244.62.157\\nCATALOG_NODE=cka-w2\\n' >> ~/drills/s26/answers.env
\`\`\`

Pod \`calico-node\` dùng \`hostNetwork\` nên IP của nó là IP node. IPIP luôn bật, VXLAN tắt: tunnel là \`tunl0\`.

**2. Route trên cka-w2**

\`\`\`bash
ssh cka-w2
ip route
# default via 192.168.252.1 dev enp0s1 proto dhcp src 192.168.252.37 metric 100
# blackhole 10.244.62.128/26 proto 80
# 10.244.62.139 dev cali7fb549e73c3 scope link metric 1024
# 10.244.62.155 dev cali880ab40f09f scope link metric 1024
# 10.244.62.157 dev cali599a3c2b8b4 scope link metric 1024
# 10.244.95.128/26 via 192.168.252.36 dev tunl0 proto 80 onlink mtu 1480
# 10.244.160.0/26 via 192.168.252.35 dev tunl0 proto 80 onlink mtu 1480
# …
ip -o route get 10.244.62.157
# 10.244.62.157 dev cali599a3c2b8b4 src 192.168.252.37 uid 1000 \\    cache
ip -d link show tunl0 | head -2
# 3: tunl0@NONE: <NOARP,UP,LOWER_UP> mtu 1480 qdisc noqueue state UNKNOWN mode DEFAULT group default qlen 1000
#     link/ipip 0.0.0.0 brd 0.0.0.0 promiscuity 0  allmulti 0 minmtu 0 maxmtu 0
echo HOST_VETH=cali599a3c2b8b4 >> ~/drills/s26/answers.env     # trên cka-cp
echo TUNNEL_IFACE=tunl0 >> ~/drills/s26/answers.env
\`\`\`

Pod của cka-w1 (\`10.244.95.128/26\`) đi qua \`tunl0\` tới \`192.168.252.36\`; \`proto 80\` đánh dấu route do Felix của Calico viết.

**3. nsenter vào Pod catalog**

\`\`\`bash
sudo crictl pods --name catalog-6977c4d66f-bnmd7 -q
# 68ba0e57b739…
sudo crictl ps --pod 68ba0e57b739 --name catalog -q
# f888b7ab5f5b…
PID=$(sudo crictl inspect f888b7ab5f5b | jq .info.pid); echo $PID
# 3894
sudo nsenter -t $PID -n ip addr show eth0
# 3: eth0@if9: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1480 qdisc noqueue state UP group default qlen 1000
#     link/ether d6:59:3f:85:9a:13 brd ff:ff:ff:ff:ff:ff link-netnsid 0
#     inet 10.244.62.157/32 scope global eth0
sudo nsenter -t $PID -n ip route
# default via 169.254.1.1 dev eth0
# 169.254.1.1 dev eth0 scope link
ip -o link | grep '^9:'
# 9: cali599a3c2b8b4@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1480 … link/ether ee:ee:ee:ee:ee:ee … link-netns cni-76c91d38-5724-6ba9-9be1-45d9508f986a
\`\`\`

\`eth0@if9\` ↔ ifindex 9 trên node là \`cali599a3c2b8b4\`, và nó trỏ ngược \`@if3\` (ifindex của \`eth0\` trong Pod). IP \`/32\`: Pod không có "mạng con" nào, mọi thứ đi qua \`169.254.1.1\`. \`k exec deploy/catalog -- ip addr\` báo \`exec: "ip": executable file not found in $PATH\`: image Temurin JRE không có \`iproute2\`.

**4. tcpdump trên tunnel**

\`\`\`bash
# cửa sổ 1, cka-w2
sudo tcpdump -ni tunl0 host 10.244.62.157 and tcp port 8080
# cửa sổ 2, cka-cp
k run tmp --image=busybox:1.37 --rm -it --restart=Never --overrides='{"spec":{"nodeName":"cka-w1"}}' -- wget -qO- http://10.244.62.157:8080/products
# cửa sổ 1 in:
# 10:31:24.984905 IP 10.244.95.167.54918 > 10.244.62.157.8080: Flags [S], seq 2974899462, win 64800, options [mss 1440,sackOK,TS val 1952290339 ecr 0,nop,wscale 7], length 0
# 10:31:24.985265 IP 10.244.62.157.8080 > 10.244.95.167.54918: Flags [S.], seq 1427824051, ack 2974899463, …
# 10:31:24.988291 IP 10.244.95.167.54918 > 10.244.62.157.8080: Flags [P.], seq 1:90, ack 1, win 507, … length 89: HTTP: GET /products HTTP/1.1
# 10:31:25.277864 IP 10.244.62.157.8080 > 10.244.95.167.54918: Flags [P.], seq 1:279, ack 90, … length 278: HTTP: HTTP/1.1 200
sudo tcpdump -ni enp0s1 ip proto 4 -c 2
# 10:29:40.697577 IP 192.168.252.36 > 192.168.252.37: IP 10.244.95.183.36458 > 10.244.62.139.5432: Flags [P.], … length 5
\`\`\`

Trên \`tunl0\` là gói đã bóc: IP nguồn \`10.244.95.167\` là IP thật của Pod tạm trên cka-w1, không NAT. MSS 1440 = MTU 1480 − 40 byte header IP và TCP. Trên \`enp0s1\` là gói còn bọc (hai lớp IP); dòng bắt được ở đây là catalog/order trên cka-w1 nói chuyện với postgres-0 (cổng 5432) qua cùng tunnel.

**5. CNI**

\`\`\`bash
sudo ls -l /etc/cni/net.d/
# -rw------- 1 root root  575 Nov 18 10:26 10-calico.conflist
# -rw------- 1 root root 2796 Nov 18 10:26 calico-kubeconfig
sudo cat /etc/cni/net.d/10-calico.conflist | grep -E '"(type|name|nodename)"'
#   "name": "k8s-pod-network",
#       "type": "calico",
#       "nodename": "cka-w2",
#           "type": "calico-ipam"
#       "type": "k8s"
#       "type": "portmap",
ls /opt/cni/bin/
# LICENSE README.md bandwidth bridge calico calico-ipam dhcp dummy firewall flannel host-device host-local ipvlan loopback macvlan portmap ptp sbr static tap tuning vlan vrf
echo CNI_CONF=10-calico.conflist >> ~/drills/s26/answers.env
cat ~/drills/s26/answers.env
# CATALOG_POD_IP=10.244.62.157
# CATALOG_NODE=cka-w2
# TUNNEL_IFACE=tunl0
# HOST_VETH=cali599a3c2b8b4
# CNI_CONF=10-calico.conflist
\`\`\`

\`calico-kubeconfig\` không phải cấu hình CNI (không đuôi \`.conf\`/\`.conflist\`/\`.json\`): plugin \`calico\` đọc nó để gọi API ghi WorkloadEndpoint. Hai plugin chạy theo thứ tự: \`calico\` (IP, veth, route; IPAM \`calico-ipam\`) rồi \`portmap\` (cho \`hostPort\`).

**6. Tình huống hỏng**: node không có cấu hình CNI thì kubelet báo \`NetworkReady=false reason:NetworkPluginNotReady message:Network plugin returns error: cni plugin not initialized\`, node \`NotReady\` (có taint \`node.kubernetes.io/not-ready\`), Pod đã xếp lên đứng \`ContainerCreating\` với Event \`FailedCreatePodSandBox\`. Đúng như cluster của s07 trước khi \`kubectl apply -f calico.yaml\`.

Lời giải tự động: \`labs/cka/sessions/s26/apply.sh\` (chọn Pod catalog trên cka-w2, làm các bước trên bằng \`multipass exec\`, ghi answers.env; chạy lại được).`,
    exam: {
      patterns: [
        "\"Plugin CNI của cluster là gì, cấu hình ở đâu\" — `ls /etc/cni/net.d/` trên một node (cần root); tên tệp và trường `type` đầu tiên cho câu trả lời. Binary ở `/opt/cni/bin/`.",
        "\"Pod CIDR của cluster\" — `k cluster-info dump | grep -m1 cluster-cidr`, hay `k -n kube-system get cm kubeadm-config -o yaml | grep podSubnet`; với Calico thêm `k get ippools.crd.projectcalico.org -o yaml`.",
        "\"Node X NotReady, sửa\" có `NetworkPluginNotReady` trong `k describe node`: CNI chưa cài trên node đó (Pod `calico-node` của node đó lỗi, hoặc thiếu tệp trong `/etc/cni/net.d`).",
        "\"Ghi IP của Pod Y vào tệp\" — `k get pod Y -o jsonpath='{.status.podIP}' > /tmp/ip`.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 3 phút: ghi tên tệp cấu hình CNI mà node `cka-w1` dùng vào `/tmp/cni.txt` trên cka-cp, và tên plugin đầu tiên trong tệp đó vào `/tmp/cni-plugin.txt`.",
          timeLimitMin: 3,
          solution: "```bash\nssh cka-w1 'sudo ls /etc/cni/net.d' | grep -E '\\.(conflist|conf)$' | sort | head -n1 > /tmp/cni.txt\nssh cka-w1 \"sudo cat /etc/cni/net.d/$(cat /tmp/cni.txt)\" | grep -m1 '\"type\"' | cut -d'\"' -f4 > /tmp/cni-plugin.txt\ncat /tmp/cni.txt /tmp/cni-plugin.txt\n# 10-calico.conflist\n# calico\n```",
        },
        {
          text: "Trong 4 phút: Pod `order` không có công cụ mạng nào. Liệt kê các cổng TCP đang nghe trong network namespace của nó từ node.",
          timeLimitMin: 4,
          solution: "```bash\nk get pod -l app=order -o wide          # node nào\nssh <node>\nC=$(sudo crictl ps --name order -q | head -n1)\nPID=$(sudo crictl inspect $C | jq .info.pid)\nsudo nsenter -t $PID -n ss -ltn\n# LISTEN 0 100 *:8080 *:*\n```",
        },
      ],
    },
    tips: [
      "`k get pod -o wide` là lệnh đầu tiên của mọi câu mạng: IP Pod và node trong một dòng.",
      "Ghép Pod với veth trên node: số sau `eth0@if` trong Pod là ifindex trên node (`ip -o link | grep '^<số>:'`), hay `ip -o route get <IP Pod>` trên node.",
      "Pod tạm ghim node: `--overrides='{\"spec\":{\"nodeName\":\"cka-w1\"}}'` bỏ qua scheduler, nhanh hơn viết nodeSelector.",
      "`tcpdump -ni any host <IP>` khi chưa biết gói đi interface nào; `-c 5` để tự dừng, `-l` để in ngay khi chạy nền.",
    ],
    outcome: {
      md: `Bạn đã lần được một gói từ Pod này sang Pod kia qua veth, route và tunnel IPIP của Calico, vào network namespace bằng \`nsenter\`, và biết containerd lấy cấu hình CNI ở đâu. Trên Mac:

\`\`\`bash
./labs/lab verify cka s26
\`\`\`

Verify so từng đáp án với giá trị đọc **lúc chấm**: \`CATALOG_POD_IP\`/\`CATALOG_NODE\` phải là IP và node của một Pod catalog đang chạy (Pod nào cũng được; sau khi VM khởi động lại hay HPA đổi Pod thì đọc lại và sửa answers.env), \`HOST_VETH\` phải là interface mà \`ip route get\` trên chính node đó trả cho IP này, \`TUNNEL_IFACE\` theo chế độ của IPPool, \`CNI_CONF\` là tệp đầu tiên trong \`/etc/cni/net.d\` của node; shop phải còn nguyên như cuối s25.`,
      verifyOutput: "lab: kiểm s26\n  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~9 phút)\n  ✓ answers.env: CATALOG_POD_IP và CATALOG_NODE là IP và node của một Pod catalog đang chạy\n  ✓ answers.env: HOST_VETH là interface cali* mà node đó dùng để tới CATALOG_POD_IP (ip route get)\n  ✓ answers.env: TUNNEL_IFACE đúng chế độ encapsulation của IPPool Calico và có trên node\n  ✓ answers.env: CNI_CONF là tệp cấu hình CNI trong /etc/cni/net.d; shop không đổi (ba Deployment và postgres Available)\n  → 4/4 đạt",
      projectDelta: "Không đổi gì trên cluster: bạn đã nhìn thấy tầng mạng mà mọi Service, Ingress và NetworkPolicy của chặng 5 chạy trên đó. Buổi sau đặt tên cổng cho Service và mở gateway ra máy Mac.",
    },
    review: [
      { q: "Pod A trên cka-w1 gọi Pod B trên cka-w2. Pod B thấy IP nguồn nào, và gói đi qua những interface nào?", a: "IP thật của Pod A (không NAT). Gói: `eth0` của A → `cali*` của A trên cka-w1 → route `/26` của cka-w2 qua `tunl0` (bọc IP-in-IP, IP ngoài là IP hai node) → `enp0s1` → `tunl0` của cka-w2 bóc lớp ngoài → route `/32` → `cali*` của B → `eth0` của B." },
      { q: "`tcpdump -ni enp0s1 host 10.244.62.157` không bắt được gì dù có traffic tới Pod đó từ node khác. Vì sao?", a: "Trên `enp0s1` gói còn bọc: header ngoài là IP hai node, IP Pod nằm ở header trong. Lọc `ip proto 4` trên `enp0s1`, hoặc lọc IP Pod trên `tunl0` (gói đã bóc) hay trên `cali*` của Pod." },
      { q: "Trong `/opt/cni/bin` có `flannel` và `bridge`. Cluster có đang dùng Flannel không?", a: "Không. Binary đến từ gói `kubernetes-cni`; containerd chỉ chạy plugin ghi trong tệp cấu hình đầu tiên (theo tên) ở `/etc/cni/net.d`, ở đây `10-calico.conflist` với `calico` và `portmap`." },
      { q: "Image distroless không có shell. Làm sao xem IP và cổng đang nghe của container?", a: "Trên node: `crictl inspect <id> | jq .info.pid` rồi `nsenter -t $PID -n ip addr` / `ss -ltn`: công cụ của node chạy trong network namespace của container. Hoặc `k debug` với container tạm (chặng sau)." },
      { q: "Đổi IPPool sang VXLAN thì `TUNNEL_IFACE` và MTU đổi thế nào?", a: "Interface tunnel thành `vxlan.calico`, MTU Pod 1450 (VXLAN thêm 50 byte: IP, UDP, header VXLAN và Ethernet trong) thay cho 1480 của IPIP. Gói ngoài là UDP cổng 4789 thay vì IP protocol 4." },
    ],
  },
// ───────────────────────────── s27 ─────────────────────────────
  {
    id: "s27",
    stage: "st5",
    title: "Service ClusterIP, NodePort, LoadBalancer, Endpoints, kube-proxy",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-svc"],
    requires: ["s26"],
    status: "published",
    pieces: ["services"],
    goals: [
      "Viết lại Service của shop cho đúng port/targetPort, mở gateway ra ngoài bằng NodePort và gọi từ máy Mac.",
      "Đọc Endpoints/EndpointSlice để biết Service đang trỏ tới Pod nào.",
      "Tìm rule iptables mà kube-proxy sinh cho một Service và giải thích LoadBalancer làm gì khi không có cloud.",
    ],
    skills: [
      { skill: "k-svc-clusterip-yaml", level: "Viết được không tra" },
      { skill: "k-svc-nodeport-yaml", level: "Viết được không tra" },
      { skill: "k-get-endpoints", level: "Gõ được không tra" },
      { skill: "k-wget-svc", level: "Thành phản xạ" },
      { skill: "k-svc-loadbalancer", level: "Giải thích được" },
      { skill: "net-iptables-kube-proxy", level: "Đọc hiểu được" },
      { skill: "k-kube-proxy-mode", level: "Gõ được có tra" },
      { skill: "k-create-svc-dry", level: "Gõ được không tra" },
    ],
    uses: ["k-expose", "k-labels-selectors", "net-iptables-read", "net-curl-nc", "k-tmp-pod"],
    foundation: null,
    mindset: `**Service là một lời hứa, không phải một tiến trình.** \`k get svc catalog\` cho một ClusterIP (\`10.x.y.z\`), nhưng không có máy nào giữ IP đó, không có cổng nào lắng nghe trên nó. Ba thứ cùng giữ lời hứa:

| Thành phần | Làm gì |
|---|---|
| Service (API) | ghi \`selector\`, \`port\` (cổng của ClusterIP), \`targetPort\` (cổng trên Pod, số hay **tên**) |
| EndpointSlice controller (trong kube-controller-manager) | tìm Pod khớp \`selector\`, dịch \`targetPort\` ra số cổng **của từng Pod**, ghi địa chỉ kèm điều kiện \`ready\`/\`serving\`/\`terminating\` vào EndpointSlice \`<service>-xxxxx\` |
| kube-proxy (DaemonSet, mỗi node một Pod) | đọc Service + EndpointSlice, viết rule iptables trên **chính node đó**: gói tới ClusterIP:port bị DNAT sang một IP Pod:cổng |

Vì thế lỗi Service luôn rơi vào một trong ba tầng: selector không khớp (EndpointSlice rỗng, s11), \`targetPort\` sai (EndpointSlice có địa chỉ, nhưng cổng trên Pod không có ai nghe: \`Connection refused\`), hoặc Pod chưa Ready (địa chỉ có nhưng \`ready: false\`, kube-proxy bỏ qua).

**targetPort theo tên.** \`targetPort: http\` nghĩa là "cổng mà container đặt tên \`http\`". EndpointSlice controller đọc tên đó trong spec của **từng Pod** và ghi số thật vào slice. Lợi: đổi cổng của ứng dụng (8080 → 9090) chỉ sửa Deployment, Service giữ nguyên; trong lúc rolling update, Pod cũ và Pod mới có thể nghe hai cổng khác nhau và Service vẫn đúng cho cả hai. Bẫy: Pod **không** có cổng tên đó thì bị loại khỏi slice, không báo lỗi. Đổi Service sang \`targetPort: http\` trước khi Pod có tên cổng là làm Service mất hết endpoint: luôn thêm tên cổng vào Deployment, chờ rollout, rồi mới sửa Service.

**Ba kiểu Service chồng lên nhau.**

| Kiểu | Thêm gì so với kiểu trước | Ở lab |
|---|---|---|
| \`ClusterIP\` | IP ảo trong Service CIDR \`10.96.0.0/12\`, chỉ trong cluster | \`catalog\`, \`order\`, \`gateway\` |
| \`NodePort\` | cổng \`30000–32767\` mở trên **mọi** node (cả cka-cp), gói tới \`<IP node>:<nodePort>\` được DNAT như ClusterIP | \`gateway-nodeport\` 30180, gọi từ máy Mac |
| \`LoadBalancer\` | nhờ một controller ngoài (cloud-controller-manager, MetalLB…) cấp IP ngoài và trỏ load balancer vào NodePort | không có controller nào: \`EXTERNAL-IP <pending>\` mãi |

**Rule iptables của kube-proxy.** Ở chế độ iptables (mặc định trên Linux khi \`mode: ""\`), mỗi Service có ba lớp chuỗi trong bảng \`nat\`:

\`\`\`text
KUBE-SERVICES      -d <ClusterIP>/32 --dport 8080          -j KUBE-SVC-<hash>     (một dòng mỗi cổng Service)
KUBE-NODEPORTS     --dport 30180                           -j KUBE-EXT-<hash>     (NodePort)
KUBE-SVC-<hash>    -m statistic --mode random --probability 0.5  -j KUBE-SEP-<hash1>
                                                           -j KUBE-SEP-<hash2>    (dòng cuối nhận phần còn lại)
KUBE-SEP-<hash1>   -j DNAT --to-destination 10.244.x.y:8080
\`\`\`

\`<hash>\` tính từ \`namespace/service:tên-cổng\` và giao thức: đổi tên cổng từ rỗng sang \`http\` là đổi luôn tên chuỗi (vì thế \`KUBE_SVC_CHAIN\` phải đọc **sau** khi sửa Service). Chọn Pod là ngẫu nhiên theo xác suất, cho **mỗi kết nối mới** (conntrack giữ kết nối cũ đi đúng Pod cũ), không theo tải, không round-robin. Không có tiến trình nào ở giữa: gói đi thẳng từ Pod nguồn tới Pod đích sau DNAT ngay trên node nguồn.

**Spring Cloud LoadBalancer làm việc đó ở phía client.** Trong Spring Cloud (Eureka, Consul…), \`@LoadBalanced RestTemplate\`/\`WebClient\` tự giữ danh sách instance và tự chọn một (round-robin hay random) cho mỗi request. Trên Kubernetes với Service ClusterIP, ứng dụng chỉ thấy **một** địa chỉ \`http://catalog:8080\`; việc chọn Pod nằm ở kernel của node, theo từng kết nối TCP. Hệ quả cho JVM: HTTP client giữ kết nối (keep-alive, pool của Apache HttpClient/Reactor Netty) thì **mọi request đi trên kết nối đó tới cùng một Pod**; HPA thêm Pod catalog thứ ba, kết nối cũ không chuyển sang nó cho tới khi pool đóng kết nối. Muốn cân bằng theo request (gRPC, HTTP/2 một kết nối dài) thì cần client-side LB thật (Spring Cloud Kubernetes đọc EndpointSlice, hoặc headless Service + resolver của gRPC) hay service mesh, không phải kube-proxy.`,
    refs: [
      { label: "Bài lộ trình CKA: kube-proxy làm gì — iptables/ipvs mode", href: "#/roadmap/cka/cka-w6-1" },
      { label: "CKA Study Guide, chương 17 — Service", href: "#/docs/ckabook-17" },
      { label: "Bài thực hành s11 — Deployment, Service và selector", href: "#/practice/cka/s11" },
      { label: "kubernetes.io: Service (port, targetPort theo tên, các kiểu Service)", href: "https://kubernetes.io/docs/concepts/services-networking/service/" },
      { label: "kubernetes.io: EndpointSlices (điều kiện ready, serving, terminating)", href: "https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/" },
      { label: "kubernetes.io: Virtual IPs and Service Proxies (kube-proxy, chế độ iptables)", href: "https://kubernetes.io/docs/reference/networking/virtual-ips/" },
      { label: "Spring Cloud Commons: Spring Cloud LoadBalancer", href: "https://docs.spring.io/spring-cloud-commons/reference/spring-cloud-commons/loadbalancer.html" },
    ],
    stateIn: "Đầu ra s26 (cluster như cuối s25): ba Service gateway, catalog, order do `kubectl expose` tạo ở s11, cổng 8080 → targetPort 8080, không tên cổng, không có trong ~/shop/; kube-proxy chế độ iptables. `./labs/lab begin cka s27` kiểm đầu vào bằng verify của s26, tạo ~/drills/s27 và xoá answers.env cũ.",
    stateOut: "Ba Service ClusterIP gateway, catalog, order trong ~/shop/services.yaml, cổng 8080 tên http, targetPort http; Deployment khai containerPort 8080 tên http; Service gateway-nodeport (NodePort 30180) trong ~/shop/gateway-nodeport.yaml gọi được từ máy Mac qua IP node; ~/drills/s27/answers.env.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s27`. Đọc Service hiện tại: `k get svc -o wide`, `k get svc catalog -o yaml | sed -n '/^spec:/,/^status:/p'` (cổng có tên không, targetPort là số hay tên?), `k get endpointslice -l kubernetes.io/service-name=catalog -o yaml | grep -A4 -E '^(endpoints|ports):'`. Trên cka-cp: `sudo iptables-save -t nat | grep 'shop/catalog'`: ghi lại tên chuỗi `KUBE-SVC-…` hiện tại (chưa phải đáp án)." },
      { id: "t2", text: "Đặt tên cổng trong Pod **trước**: trong container của `~/shop/gateway.yaml`, `~/shop/catalog.yaml`, `~/shop/order.yaml` thay `ports` bằng `- name: http`, `containerPort: 8080`, `protocol: TCP`. `k apply -f` ba tệp, `k rollout status` từng Deployment. Vì sao không sửa Service trước?" },
      { id: "t3", text: "`~/shop/services.yaml`: sinh khung `k create svc clusterip gateway --tcp=8080:8080 $do` (rồi catalog, order) gộp vào một tệp, ngăn bằng `---`. Sửa: `namespace: shop`, cổng `name: http`, `targetPort: http`, bỏ `creationTimestamp` và `status`. `k apply -f ~/shop/services.yaml`: ba Service `configured` (không tạo mới, ClusterIP giữ nguyên). `k get endpointslice`: cột PORTS và số địa chỉ có đúng không? `k get endpointslice -l kubernetes.io/service-name=catalog -o jsonpath='{.items[0].ports}'`." },
      { id: "t4", text: "NodePort: `~/shop/gateway-nodeport.yaml` (`k create svc nodeport gateway-nodeport --tcp=8080:8080 --node-port=30180 $do`, đổi selector thành `app: gateway`, cổng `name: http`, `targetPort: http`). Apply. Trên **Mac**: IP của cka-w1 (`multipass list` hay `k get node cka-w1 -o wide`, cột INTERNAL-IP), `curl http://<IP>:30180/api/products`. Gọi bằng IP của cka-cp và cka-w2 có được không, dù Pod gateway không chạy ở đó?" },
      { id: "t5", text: "iptables: `sudo iptables-save -t nat | grep 'shop/catalog'` lần nữa. Tên chuỗi `KUBE-SVC-…` có đổi không, vì sao? Lần theo `KUBE-SERVICES` → `KUBE-SVC-…` → `KUBE-SEP-…` → `DNAT`; `sudo iptables-save -t nat | grep 30180`. Ghi `KUBE_SVC_CHAIN=<chuỗi KUBE-SVC hiện tại của shop/catalog:http>`. Chế độ kube-proxy: `k -n kube-system get cm kube-proxy -o yaml | grep -E '^ *mode:'` (rỗng là gì?), `curl -s localhost:10249/proxyMode` trên node, `k -n kube-system logs ds/kube-proxy | grep Proxier`. Ghi `PROXY_MODE=<chế độ>`." },
      { id: "t6", text: "LoadBalancer nháp: `k expose deploy gateway --name=gateway-lb --type=LoadBalancer --port=8080 --target-port=http`, `k get svc gateway-lb`. Cột EXTERNAL-IP và PORT(S) ghi gì? Ghi `LB_EXTERNAL_IP_STATE=<giá trị cột EXTERNAL-IP>` (bọc nháy đơn vì có dấu `<`). `k delete svc gateway-lb`." },
      { id: "t7", text: "Tình huống hỏng: `k expose deploy catalog --name=catalog-bad --port=8080 --target-port=9090`. `k get endpointslice -l kubernetes.io/service-name=catalog-bad`: có địa chỉ không, cổng nào? Pod tạm: `k run tmp --image=busybox:1.37 --rm -it --restart=Never -- wget -qO- -T 3 http://catalog-bad:8080/products`: lỗi gì? So với Service selector sai ở s11 (EndpointSlice rỗng). `k delete svc catalog-bad`. Trên Mac: `./labs/lab verify cka s27` phải đạt 8/8." },
    ],
    hints: [
      "Sửa Service sang `targetPort: http` khi Pod chưa có cổng tên `http`: EndpointSlice controller không dịch được tên, Pod bị loại khỏi slice, Service mất hết địa chỉ. Gateway trả lỗi ngay. Thứ tự đúng: tên cổng trong Deployment, chờ rollout, rồi mới Service.",
      "`k create svc clusterip catalog --tcp=8080:8080` sinh cổng tên `8080-8080` và selector `app: catalog`. Nhớ đổi tên cổng; selector đúng sẵn vì Service trùng tên Deployment.",
      "`--node-port` phải nằm trong `30000–32767` (`--service-node-port-range` của apiserver). Trùng cổng của Service khác thì apply báo `provided port is already allocated`.",
      "curl từ Mac treo hay `Connection refused`: thử từ chính node trước (`curl -s localhost:30180/api/products` trên cka-w1). Được trên node mà không được từ Mac là chuyện mạng Multipass; không được cả trên node là Service/EndpointSlice.",
      "`iptables-save` cần root. Dòng `# Warning: iptables-legacy tables present, use iptables-legacy-save to see them` nghĩa là node có bảng của cả hai backend iptables (nft và legacy); rule của kube-proxy nằm ở bảng mà `iptables-save` in ra, bỏ qua cảnh báo được.",
      "`mode: \"\"` trong ConfigMap `kube-proxy` không phải lỗi: rỗng là mặc định của nền tảng, trên Linux là `iptables`. Muốn chắc thì hỏi chính kube-proxy: cổng metrics `127.0.0.1:10249/proxyMode` trên node.",
      "`LB_EXTERNAL_IP_STATE=<pending>` không bọc nháy thì `source answers.env` hiểu `<` là chuyển hướng: viết `LB_EXTERNAL_IP_STATE='<pending>'` (verify chấp nhận cả hai cách).",
    ],
    solution: `Output là của máy soạn bài; IP, tên chuỗi và tên Pod sẽ khác. Context đã ở namespace shop, \`do='--dry-run=client -o yaml'\`.

**1. Service hiện tại**

\`\`\`bash
k get svc -o wide
# catalog    ClusterIP   10.101.94.107    <none>   8080/TCP   3d8h   app=catalog
# gateway    ClusterIP   10.105.152.32    <none>   8080/TCP   3d8h   app=gateway
# order      ClusterIP   10.108.134.164   <none>   8080/TCP   3d8h   app=order
# postgres   ClusterIP   None             <none>   5432/TCP   2d9h   app=postgres
k get endpointslice
# catalog-jkwjt    IPv4   8080   10.244.62.157,10.244.95.176   3d8h
# gateway-bfrns    IPv4   8080   10.244.62.155,10.244.95.180   3d8h
# order-v65n5      IPv4   8080   10.244.62.147                 3d8h
sudo iptables-save -t nat | grep 'shop/catalog'      # trên cka-cp
# -A KUBE-SERVICES -d 10.101.94.107/32 -p tcp -m comment --comment "shop/catalog cluster IP" -m tcp --dport 8080 -j KUBE-SVC-OWLUSNPMDHU62CCK
# -A KUBE-SVC-OWLUSNPMDHU62CCK -m comment --comment "shop/catalog -> 10.244.62.157:8080" -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-B7IJILS7NPHYPRQ3
# -A KUBE-SVC-OWLUSNPMDHU62CCK -m comment --comment "shop/catalog -> 10.244.95.176:8080" -j KUBE-SEP-2YACMSHYDBS4VFEM
# …
\`\`\`

Cổng không tên (comment chỉ ghi \`shop/catalog\`), \`targetPort: 8080\` là số.

**2. Tên cổng trong ba Deployment** (\`~/shop/gateway.yaml\`, \`catalog.yaml\`, \`order.yaml\`, trong container cùng tên)

\`\`\`yaml
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway.yaml -f ~/shop/catalog.yaml -f ~/shop/order.yaml
for d in catalog order gateway; do k rollout status deploy/$d; done
\`\`\`

Đổi \`ports\` là đổi Pod template: mỗi Deployment rolling update một lần. Service cũ (\`targetPort: 8080\` số) vẫn đúng trong lúc đó.

**3. ~/shop/services.yaml**

\`\`\`bash
k -n shop create svc clusterip catalog --tcp=8080:8080 $do
# apiVersion: v1
# kind: Service
# metadata:
#   labels:
#     app: catalog
#   name: catalog
#   namespace: shop
# spec:
#   ports:
#   - name: 8080-8080
#     port: 8080
#     protocol: TCP
#     targetPort: 8080
#   selector:
#     app: catalog
#   type: ClusterIP
# status:
#   loadBalancer: {}
for d in gateway catalog order; do echo ---; k -n shop create svc clusterip $d --tcp=8080:8080 $do; done > ~/shop/services.yaml
vim ~/shop/services.yaml
\`\`\`

Từ khung đó, sửa thành ba Service (\`~/shop/services.yaml\`):

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: gateway
  namespace: shop
  labels:
    app: gateway
spec:
  type: ClusterIP
  selector:
    app: gateway
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: catalog
  namespace: shop
  labels:
    app: catalog
spec:
  type: ClusterIP
  selector:
    app: catalog
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
---
apiVersion: v1
kind: Service
metadata:
  name: order
  namespace: shop
  labels:
    app: order
spec:
  type: ClusterIP
  selector:
    app: order
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
\`\`\`

\`\`\`bash
k apply -f ~/shop/services.yaml
# service/gateway configured
# service/catalog configured
# service/order configured
k get endpointslice -l kubernetes.io/service-name=catalog -o jsonpath='{.items[0].ports}'; echo
# [{"name":"http","port":8080,"protocol":"TCP"}]
\`\`\`

Slice giữ tên (\`catalog-jkwjt\`), cổng có tên \`http\`, số 8080 là số mà controller dịch từ \`containerPort\` tên \`http\` của từng Pod.

**4. NodePort 30180** (\`~/shop/gateway-nodeport.yaml\`)

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: gateway-nodeport
  namespace: shop
  labels:
    app: gateway
spec:
  type: NodePort
  selector:
    app: gateway
  ports:
  - name: http
    port: 8080
    targetPort: http
    nodePort: 30180
    protocol: TCP
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway-nodeport.yaml
k get svc gateway-nodeport
# gateway-nodeport   NodePort   10.111.169.21   <none>   8080:30180/TCP   0s
k get node cka-w1 -o wide | awk '{print $1, $6}'
# NAME INTERNAL-IP
# cka-w1 192.168.252.36
\`\`\`

Trên Mac:

\`\`\`bash
curl -s http://192.168.252.36:30180/api/products; echo
# [{"id":1,"name":"Bàn phím cơ","price":49.90},{"id":2,"name":"Chuột không dây","price":19.90},{"id":3,"name":"Màn hình 27 inch","price":229.00}]
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.252.35:30180/api/products    # cka-cp
# 200
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.252.37:30180/api/products    # cka-w2
# 200
\`\`\`

Cả hai Pod gateway lúc đó đều ở cka-w1, vậy mà IP cka-cp và cka-w2 vẫn trả 200: kube-proxy trên mọi node mở cổng 30180.

**5. iptables và chế độ kube-proxy**

\`\`\`bash
sudo iptables-save -t nat | grep 'shop/catalog'
# -A KUBE-SEP-XSLDX5LZP5D6YRJC -p tcp -m comment --comment "shop/catalog:http" -m tcp -j DNAT --to-destination 10.244.95.136:8080
# -A KUBE-SEP-YEWDKZ2QLYGDHEHC -p tcp -m comment --comment "shop/catalog:http" -m tcp -j DNAT --to-destination 10.244.62.158:8080
# -A KUBE-SERVICES -d 10.101.94.107/32 -p tcp -m comment --comment "shop/catalog:http cluster IP" -m tcp --dport 8080 -j KUBE-SVC-ITBI3OHKD3FRXPDK
# -A KUBE-SVC-ITBI3OHKD3FRXPDK ! -s 10.244.0.0/16 -d 10.101.94.107/32 -p tcp -m comment --comment "shop/catalog:http cluster IP" -m tcp --dport 8080 -j KUBE-MARK-MASQ
# -A KUBE-SVC-ITBI3OHKD3FRXPDK -m comment --comment "shop/catalog:http -> 10.244.62.158:8080" -m statistic --mode random --probability 0.50000000000 -j KUBE-SEP-YEWDKZ2QLYGDHEHC
# -A KUBE-SVC-ITBI3OHKD3FRXPDK -m comment --comment "shop/catalog:http -> 10.244.95.136:8080" -j KUBE-SEP-XSLDX5LZP5D6YRJC
sudo iptables-save -t nat | grep 30180
# -A KUBE-NODEPORTS -p tcp -m comment --comment "shop/gateway-nodeport:http" -m tcp --dport 30180 -j KUBE-EXT-DNGBDWSWJ73WPUKF
echo KUBE_SVC_CHAIN=KUBE-SVC-ITBI3OHKD3FRXPDK >> ~/drills/s27/answers.env
k -n kube-system get cm kube-proxy -o yaml | grep -E '^ *mode:'
#     mode: ""
curl -s localhost:10249/proxyMode; echo
# iptables
k -n kube-system logs ds/kube-proxy | grep Proxier | head -1
# I1118 03:26:24.984789       1 server_linux.go:137] "Using iptables Proxier"
echo PROXY_MODE=iptables >> ~/drills/s27/answers.env
\`\`\`

Tên chuỗi đổi từ \`KUBE-SVC-OWLUSNPMDHU62CCK\` sang \`KUBE-SVC-ITBI3OHKD3FRXPDK\` vì tên cổng là một phần của chuỗi băm. Pod catalog cũng đổi (rollout ở bước 2) nên hai \`KUBE-SEP\` mới. Dòng \`! -s 10.244.0.0/16 … KUBE-MARK-MASQ\`: gói tới ClusterIP từ ngoài dải Pod (ví dụ từ chính node) được SNAT để Pod trả lời quay về đúng đường.

**6. LoadBalancer không có cloud**

\`\`\`bash
k expose deploy gateway --name=gateway-lb --type=LoadBalancer --port=8080 --target-port=http
k get svc gateway-lb
# NAME         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
# gateway-lb   LoadBalancer   10.102.138.46   <pending>     8080:32285/TCP   4s
echo "LB_EXTERNAL_IP_STATE='<pending>'" >> ~/drills/s27/answers.env
k delete svc gateway-lb
\`\`\`

**7. targetPort sai số**

\`\`\`bash
k expose deploy catalog --name=catalog-bad --port=8080 --target-port=9090
k get endpointslice -l kubernetes.io/service-name=catalog-bad
# NAME                ADDRESSTYPE   PORTS   ENDPOINTS                     AGE
# catalog-bad-vjtd5   IPv4          9090    10.244.62.158,10.244.95.136   1s
k run tmp --image=busybox:1.37 --rm -it --restart=Never -- wget -qO- -T 3 http://catalog-bad:8080/products
# wget: can't connect to remote host (10.102.47.137): Connection refused
k run tmp --image=busybox:1.37 --rm -it --restart=Never -- wget -qO- -T 3 http://catalog:8080/products | head -c 40; echo
# [{"id":1,"name":"Bàn phím cơ","price"
k delete svc catalog-bad
\`\`\`

EndpointSlice có đủ hai Pod (selector đúng, Pod Ready) nhưng cổng 9090: kube-proxy DNAT tới \`10.244.x.y:9090\`, không ai nghe, kernel của Pod trả RST, wget báo \`Connection refused\`. Ở s11, selector sai cho slice rỗng: khi đó gói tới ClusterIP bị kube-proxy từ chối ngay (rule \`REJECT\` cho Service không có endpoint). Hai lỗi trông giống nhau từ phía client, khác nhau ở \`k get endpointslice\`.

Lời giải tự động: \`labs/cka/sessions/s27/apply.sh\` (thêm cổng bằng PyYAML, chép \`files/services.yaml\`, \`files/gateway-nodeport.yaml\` vào \`~/shop/\`, làm các bước còn lại, rồi gọi NodePort bằng curl từ chính máy Mac).`,
    exam: {
      patterns: [
        "\"Expose Deployment X trên cổng 80, targetPort 8080, kiểu NodePort cổng 30080\" — `k expose deploy X --type=NodePort --port=80 --target-port=8080 $do > svc.yaml`, thêm `nodePort: 30080` vào yaml (expose không có cờ nodePort), apply.",
        "\"Service Y không có endpoint, sửa\" — `k get endpointslice -l kubernetes.io/service-name=Y`; rỗng → so `k get svc Y -o jsonpath='{.spec.selector}'` với `k get pod --show-labels`; có địa chỉ mà gọi bị từ chối → `targetPort` sai so với `containerPort`.",
        "\"kube-proxy đang chạy chế độ nào\" — `k -n kube-system get cm kube-proxy -o yaml | grep mode`; rỗng thì `curl localhost:10249/proxyMode` trên node hay đọc log `Using iptables Proxier`.",
        "\"Tìm rule iptables của Service Z\" — `sudo iptables-save -t nat | grep '<ns>/Z'`: dòng `KUBE-SERVICES` (ClusterIP), `KUBE-SVC-…` (chọn ngẫu nhiên), `KUBE-SEP-…` (DNAT tới từng Pod).",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 4 phút: Deployment `web` (nginx, cổng container tên `www`=80) ở namespace default. Tạo Service `web` kiểu NodePort cổng 8080 → targetPort `www`, nodePort 30999, rồi gọi `curl <IP node>:30999` từ cka-cp.",
          timeLimitMin: 4,
          solution: "```bash\nk -n default create svc nodeport web --tcp=8080:80 --node-port=30999 $do > web-svc.yaml\n# sửa: ports[0].name: www, targetPort: www (selector app: web có sẵn)\nk apply -f web-svc.yaml\nk -n default get endpointslice -l kubernetes.io/service-name=web\ncurl -s $(k get node cka-w1 -o jsonpath='{.status.addresses[0].address}'):30999 | head -4\n```",
        },
        {
          text: "Trong 3 phút: ghi vào `/tmp/sep.txt` mọi địa chỉ đích (IP:cổng) mà kube-proxy DNAT tới cho Service `shop/order`.",
          timeLimitMin: 3,
          solution: "```bash\nsudo iptables-save -t nat | grep 'shop/order:http' | grep -o 'to-destination [0-9.:]*' | cut -d' ' -f2 > /tmp/sep.txt\ncat /tmp/sep.txt\n# 10.244.62.168:8080\n```\nĐối chiếu: `k -n shop get endpointslice -l kubernetes.io/service-name=order`.",
        },
      ],
    },
    tips: [
      "`k get endpointslice -l kubernetes.io/service-name=<svc>` thay cho `k get endpoints` (Endpoints vẫn chạy nhưng đã bị đánh dấu deprecated từ 1.33 và chỉ giữ tối đa 1000 địa chỉ).",
      "Đặt tên cổng (`http`, `metrics`, `grpc`) ngay từ Deployment: Service, NetworkPolicy, ServiceMonitor đều tham chiếu được bằng tên, đổi số cổng chỉ sửa một chỗ.",
      "`k get svc` không hiện tên cổng; `k get svc X -o jsonpath='{.spec.ports}'` thì có.",
      "Kiểm Service theo thứ tự: selector → EndpointSlice có địa chỉ ready → cổng trong slice khớp cổng ứng dụng nghe → gọi từ Pod tạm → mới tới NodePort từ ngoài.",
    ],
    outcome: {
      md: `Service của shop có cổng tên \`http\`, YAML nằm trong \`~/shop/\`, và gateway gọi được từ máy Mac qua NodePort. Trên Mac:

\`\`\`bash
./labs/lab verify cka s27
\`\`\`

Verify kiểm ba Service (một cổng 8080 tên \`http\`, \`targetPort\` là tên một cổng 8080 có thật trong Pod, YAML trong \`~/shop/\` khớp cluster), cổng tên \`http\` trong ba Deployment và trong tệp của chúng, EndpointSlice (cổng \`http\`, số địa chỉ ready bằng replicas), Service \`gateway-nodeport\` (30180), rồi **chạy \`curl\` từ chính máy Mac** tới \`InternalIP\` của cka-w1 (đọc từ API, không ghi cứng) cổng 30180, tối đa 6 lần, mỗi lần 5 giây. \`KUBE_SVC_CHAIN\` được so với chuỗi đọc bằng \`iptables-save\` lúc chấm, \`PROXY_MODE\` với điều kube-proxy tự báo; Service nháp phải đã xoá.`,
      verifyOutput: "lab: kiểm s27\n  (chờ apiserver, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~10 phút)\n  ✓ Service gateway, catalog, order: ClusterIP, một cổng 8080 tên http, targetPort là tên cổng 8080 có trong Pod; YAML của chúng trong ~/shop/ khớp\n  ✓ Deployment gateway, catalog, order khai containerPort 8080 tên http và rollout xong; ~/shop/ khớp\n  ✓ EndpointSlice của ba Service: cổng http/8080, số địa chỉ ready (bỏ terminating) bằng replicas\n  ✓ Service gateway-nodeport: NodePort 30180, port 8080 → cổng 8080 của gateway, selector app=gateway\n  ✓ Từ máy Mac: curl http://<IP cka-w1>:30180/api/products trả 200 với 3 sản phẩm\n  ✓ answers.env: KUBE_SVC_CHAIN là chuỗi KUBE-SVC-… hiện hành của shop/catalog:http\n  ✓ answers.env: PROXY_MODE=iptables (kube-proxy trên node báo: iptables)\n  ✓ Service nháp (LoadBalancer, catalog-bad) đã xoá; answers.env: LB_EXTERNAL_IP_STATE=<pending>\n  → 8/8 đạt",
      projectDelta: "Mảnh \"Service\" của project: ba Service ClusterIP khai bằng YAML với cổng tên http, gateway mở ra máy Mac ở cổng 30180. Ingress (s29) và Gateway API (s30) sẽ đứng trước chính các Service này.",
    },
    review: [
      { q: "EndpointSlice của Service có đủ địa chỉ Pod nhưng gọi Service bị `Connection refused`. Nghi gì đầu tiên?", a: "`targetPort` (hay cổng mà tên của nó trỏ tới) không phải cổng ứng dụng đang nghe. Selector đúng (nên có địa chỉ), kube-proxy DNAT đúng địa chỉ, nhưng tới cổng không ai nghe. So cột PORTS của slice với `containerPort` và cổng thật (`nsenter … ss -ltn`, s26)." },
      { q: "Vì sao đổi tên cổng Service từ rỗng sang `http` làm đổi tên chuỗi `KUBE-SVC-…`?", a: "Tên chuỗi là băm của `namespace/service:tên-cổng` và giao thức. Đổi tên cổng là một \"cổng Service\" khác với kube-proxy: chuỗi mới được tạo, chuỗi cũ bị xoá. Đáp án phải đọc sau khi sửa." },
      { q: "NodePort 30180 gọi được qua IP của cka-cp dù không có Pod gateway nào ở đó. Vì sao, và `externalTrafficPolicy: Local` đổi gì?", a: "kube-proxy trên mọi node viết rule `KUBE-NODEPORTS` cho cổng đó; gói vào node nào cũng được DNAT (và SNAT) tới một Pod gateway ở node khác. Với `Local`, node chỉ chuyển tới Pod trên chính nó (giữ IP nguồn của client), node không có Pod thì gói bị bỏ." },
      { q: "Service LoadBalancer trên cluster kubeadm của lab đứng `<pending>` mãi. Nó có dùng được không?", a: "Không có controller nào (cloud-controller-manager, MetalLB, kube-vip) cấp IP ngoài, nên `status.loadBalancer` rỗng. Nhưng LoadBalancer bao gồm cả NodePort và ClusterIP: cột PORT(S) `8080:32285/TCP` cho thấy NodePort vẫn được cấp và dùng được." },
      { q: "catalog scale từ 2 lên 3 Pod, nhưng gateway vẫn chỉ gọi hai Pod cũ. Vì sao, và khác gì Spring Cloud LoadBalancer?", a: "kube-proxy chọn Pod theo **kết nối** (iptables random + conntrack). HTTP client của gateway giữ kết nối keep-alive tới hai Pod cũ; Pod mới chỉ nhận kết nối mới. Spring Cloud LoadBalancer chọn instance theo **request** ở phía client từ danh sách instance; trên Kubernetes cần Spring Cloud Kubernetes (đọc EndpointSlice) hay headless Service để làm được như vậy." },
    ],
  },
// ───────────────────────────── s28 ─────────────────────────────
  {
    id: "s28",
    stage: "st5",
    title: "CoreDNS",
    durationMin: 75,
    domain: "networking",
    competencies: ["nw-dns"],
    requires: ["s27"],
    status: "published",
    pieces: [],
    goals: [
      "Phân giải tên Service ở ba dạng (ngắn, có namespace, FQDN) từ trong Pod và giải thích search domain.",
      "Đọc Corefile và thêm một bản ghi hosts tĩnh cho shop qua ConfigMap coredns.",
      "Hỏi thẳng CoreDNS bằng dig từ node để tách lỗi DNS khỏi lỗi Service.",
    ],
    skills: [
      { skill: "k-nslookup-svc", level: "Thành phản xạ" },
      { skill: "net-dig", level: "Gõ được không tra" },
      { skill: "k-coredns-corefile", level: "Đọc hiểu, sửa được" },
      { skill: "k-svc-fqdn", level: "Giải thích được" },
      { skill: "k-pod-dns-policy", level: "Viết được có tra" },
      { skill: "k-coredns-restart", level: "Gõ được không tra" },
    ],
    uses: ["net-resolv", "k-tmp-pod", "k-sts-dns", "k-kubelet-config"],
    foundation: null,
    mindset: `**Ai trả lời câu hỏi DNS của một Pod.** kubelet viết \`/etc/resolv.conf\` cho mỗi Pod (với \`dnsPolicy: ClusterFirst\`, mặc định) từ hai giá trị trong \`/var/lib/kubelet/config.yaml\`: \`clusterDNS\` (ClusterIP của Service \`kube-dns\`) và \`clusterDomain\` (\`cluster.local\`). Gói DNS tới ClusterIP đó đi qua kube-proxy (s27) tới một trong hai Pod \`coredns\` ở \`kube-system\`. Tên Service vẫn là \`kube-dns\` (di sản từ thời kube-dns), nhãn Pod là \`k8s-app=kube-dns\`, nhưng Deployment và ConfigMap tên \`coredns\`.

**search và ndots.** resolv.conf của Pod trong shop:

\`\`\`text
search shop.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
\`\`\`

Quy tắc của resolver (glibc và musl giống nhau ở điểm này): tên có **ít hơn** \`ndots\` dấu chấm thì thử ghép lần lượt từng search domain **trước**, rồi mới hỏi tên như đã gõ. \`catalog\` (0 dấu chấm) → \`catalog.shop.svc.cluster.local\` trúng ngay câu đầu. \`catalog.shop\` → \`catalog.shop.shop.svc.cluster.local\` (NXDOMAIN), rồi \`catalog.shop.svc.cluster.local\` (trúng). Tên kết thúc bằng dấu chấm (\`catalog.shop.svc.cluster.local.\`) là tên tuyệt đối, không ghép gì.

**Công cụ nào thật sự dùng resolver đó.** \`getent hosts\`, \`curl\`, JVM (\`InetAddress\`) đi qua resolver của libc nên áp đúng quy tắc trên. \`nslookup\` và \`dig\` tự gửi câu hỏi: \`dig\` không ghép search (trừ \`+search\`), còn \`nslookup\` của busybox hỏi nguyên tên có dấu chấm trước. Ở lab điều này lộ ra rất rõ: namespace tên \`shop\` trùng với gTLD \`.shop\` có thật, và \`catalog.shop\` tình cờ là một tên miền đã có người đăng ký trên Internet. busybox hỏi nguyên tên \`catalog.shop\` trước nên nhận IP công cộng của tên miền đó (giá trị là thứ DNS công cộng trả hôm đó, đổi theo thời gian; tên chưa ai đăng ký như \`gateway.shop\` thì không ra gì, vì gTLD mới không được phép có bản ghi wildcard), trong khi \`getent hosts catalog.shop\` trong Pod order ra đúng ClusterIP \`10.101.94.107\`. Muốn biết ứng dụng thấy gì, hỏi bằng resolver của ứng dụng; muốn chắc chắn trong đề thi, gõ FQDN.

**ndots:5 và độ trễ của JVM.** Gọi ra ngoài cluster, ví dụ \`api.stripe.com\` (2 dấu chấm < 5): resolver hỏi \`api.stripe.com.shop.svc.cluster.local\`, \`api.stripe.com.svc.cluster.local\`, \`api.stripe.com.cluster.local\` (ba NXDOMAIN), rồi mới tới tên thật; mỗi lần hỏi cả A lẫn AAAA. Tám câu hỏi cho một tên. JVM tra tên qua \`InetAddress\` (gọi \`getaddrinfo\` của hệ điều hành), và giữ kết quả trong cache của chính nó: \`networkaddress.cache.ttl\` (không có SecurityManager thì mặc định **30 giây**) cho tên tra được, \`networkaddress.cache.negative.ttl\` (mặc định **10 giây**) cho tên tra hỏng. Hết 30 giây là lại tám câu hỏi; HikariCP mở kết nối mới, WebClient gọi dịch vụ ngoài đều trả độ trễ đó. Ba cách giảm: viết FQDN có dấu chấm cuối cho tên ngoài (\`api.stripe.com.\`); đặt \`dnsConfig.options: [{name: ndots, value: "2"}]\` cho Pod gọi ra ngoài nhiều; tăng \`networkaddress.cache.ttl\` (đặt trong \`$JAVA_HOME/conf/security/java.security\` hay \`-Dsun.net.inetaddr.ttl=…\`). Đừng đặt TTL vô hạn (\`-1\`): IP Pod sau headless Service (\`postgres-0.postgres\`, s24) đổi mỗi lần Pod tạo lại, cache vĩnh viễn là ứng dụng nối mãi vào IP chết.

**Corefile.** ConfigMap \`coredns\` (do kubeadm tạo) chứa một server block \`.:53\` với chuỗi plugin. Thứ tự chạy plugin do bản build của CoreDNS quyết định, **không** do thứ tự dòng trong Corefile: \`hosts\` luôn chạy trước \`kubernetes\`, \`kubernetes\` trước \`forward\`.

| Plugin | Làm gì |
|---|---|
| \`errors\`, \`health\`, \`ready\`, \`prometheus :9153\` | log lỗi, \`/health\` cho liveness, \`/ready\` cho readiness, metrics |
| \`kubernetes cluster.local in-addr.arpa ip6.arpa\` | trả lời tên Service/Pod từ API (watch Service, EndpointSlice) |
| \`forward . /etc/resolv.conf\` | tên còn lại gửi lên DNS của node (resolv.conf **của Pod coredns**, tức của node) |
| \`cache 30 { disable success cluster.local; disable denial cluster.local }\` | cache câu trả lời tối đa 30 giây, **trừ** \`cluster.local\` (Corefile của kubeadm 1.36): tên Service luôn hỏi \`kubernetes\`, vốn đã giữ sẵn dữ liệu từ watch |
| \`loop\`, \`reload\`, \`loadbalance\` | phát hiện vòng lặp forward, tự đọc lại Corefile khi ConfigMap đổi, xáo thứ tự bản ghi A |

**hosts và fallthrough.** Plugin \`hosts\` trả lời từ một danh sách tĩnh dạng \`/etc/hosts\`. Không ghi vùng thì nó nhận mọi tên của server block (\`.\`): tên không có trong danh sách thì trả NXDOMAIN ngay, **cả \`catalog.shop.svc.cluster.local\`**, vì \`hosts\` chạy trước \`kubernetes\`. \`fallthrough\` bảo nó chuyển tên không có trong danh sách sang plugin kế tiếp. Thiếu một dòng đó là cả cluster mất DNS.

**Vì sao cần Service postgres-rw.** \`db.shop.internal\` cần một IP ổn định để ghi tĩnh. Service headless \`postgres\` không có ClusterIP (\`None\`), và IP của \`postgres-0\` đổi mỗi lần Pod tạo lại. Service ClusterIP thường \`postgres-rw\` (cùng selector \`app: postgres\`) có IP ảo sống cùng Service, nên ghi vào Corefile được.

**dnsPolicy.** \`ClusterFirst\` (mặc định): như trên. \`Default\`: Pod nhận resolv.conf **của node** (kubelet đọc tệp \`resolvConf\` trong config, trên Ubuntu là \`/run/systemd/resolve/resolv.conf\`), nên tên Service không phân giải được: tên này dễ nhầm, "Default" không phải là mặc định. \`ClusterFirstWithHostNet\`: cho Pod \`hostNetwork: true\` vẫn dùng CoreDNS. \`None\`: kubelet bỏ hết, chỉ dùng \`dnsConfig\` bạn viết (\`nameservers\`, \`searches\`, \`options\`); \`dnsConfig\` cũng dùng được với các policy khác để thêm vào.`,
    refs: [
      { label: "Bài lộ trình CKA: CoreDNS — Pod ở kube-system, ConfigMap coredns, debug khi DNS hỏng", href: "#/roadmap/cka/cka-w6-2" },
      { label: "CKA Study Guide, chương 17 — Service (DNS của Service)", href: "#/docs/ckabook-17" },
      { label: "kubernetes.io: DNS for Services and Pods (dnsPolicy, dnsConfig)", href: "https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/" },
      { label: "kubernetes.io: Debugging DNS Resolution", href: "https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/" },
      { label: "kubernetes.io: Customizing DNS Service (Corefile)", href: "https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/" },
      { label: "CoreDNS: plugin hosts (fallthrough)", href: "https://coredns.io/plugins/hosts/" },
      { label: "Oracle: Networking properties (networkaddress.cache.ttl)", href: "https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/net/doc-files/net-properties.html" },
    ],
    stateIn: "Đầu ra s27: Service gateway, catalog, order cổng http, gateway-nodeport 30180; Service postgres headless (không ClusterIP); CoreDNS 2 Pod trên cka-cp với Corefile mặc định của kubeadm. `./labs/lab begin cka s28` kiểm đầu vào bằng verify của s27, tạo ~/drills/s28 và xoá answers.env cũ.",
    stateOut: "Service postgres-rw (ClusterIP thường, selector app: postgres, cổng 5432) trong ~/shop/postgres-rw.yaml; Corefile trong ConfigMap coredns có khối hosts `db.shop.internal` → ClusterIP của postgres-rw với fallthrough; Pod của shop phân giải được tên này; ~/drills/s28/answers.env.",
    tasks: [
      { id: "t1", text: "`./labs/lab begin cka s28`. Pod tạm: `k run tmp --image=busybox:1.37 --rm -it --restart=Never -- sh`, trong đó `cat /etc/resolv.conf`, rồi `nslookup catalog`, `nslookup catalog.shop`, `nslookup catalog.shop.svc.cluster.local`. Dạng thứ hai ra IP gì, vì sao? Làm lại ba tên bằng resolver của hệ thống trong một Pod ứng dụng: `k exec deploy/order -- getent hosts catalog.shop`. Ghi `NDOTS=<giá trị ndots>` vào `~/drills/s28/answers.env`." },
      { id: "t2", text: "Hỏi thẳng CoreDNS từ node: `k -n kube-system get svc kube-dns` (ClusterIP?), `grep -A1 clusterDNS /var/lib/kubelet/config.yaml`, rồi trên cka-cp `dig @<ClusterIP> catalog.shop.svc.cluster.local +short` và `dig @<ClusterIP> catalog.shop +short`. Vì sao dig không ghép search domain? Ghi `KUBE_DNS_IP=<ClusterIP của kube-dns>`." },
      { id: "t3", text: "Đọc Corefile: `k -n kube-system get cm coredns -o jsonpath='{.data.Corefile}'`. Plugin nào trả lời tên `*.cluster.local`, tên ngoài cluster đi đâu, cache có áp cho `cluster.local` không? `k -n kube-system get pod -l k8s-app=kube-dns -o wide`." },
      { id: "t4", text: "Service ClusterIP cho postgres: `~/shop/postgres-rw.yaml` (Service `postgres-rw`, `type: ClusterIP`, selector `app: postgres`, cổng `postgres` 5432 → 5432). Apply, `k get svc postgres postgres-rw`, `k get endpointslice -l kubernetes.io/service-name=postgres-rw`. Vì sao không dùng được Service `postgres` cho bản ghi tĩnh?" },
      { id: "t5", text: "Bản ghi tĩnh: `k -n kube-system edit cm coredns`, thêm vào server block `.:53` (trước dòng `kubernetes`) khối `hosts { <ClusterIP postgres-rw> db.shop.internal` / `fallthrough }`. Lưu rồi **chờ plugin `reload`** (tới khoảng một phút rưỡi): `k -n kube-system logs -l k8s-app=kube-dns --tail=3` in `Reloading complete` khi Corefile mới đã được nạp. Kiểm từ Pod order: `k exec deploy/order -- getent hosts db.shop.internal` và `k exec deploy/order -- getent hosts catalog.shop.svc.cluster.local` (tên Service vẫn phải phân giải). Trong đề thi phản xạ là `k -n kube-system rollout restart deploy/coredns` + `rollout status`; trên lab đọc hint về nó trước khi gõ." },
      { id: "t6", text: "dnsPolicy: `~/drills/s28/dnspolicy-lab.yaml` — Pod `dnspolicy-lab` (busybox:1.37, `sleep 3600`) với `dnsPolicy: None` và `dnsConfig` (nameserver = ClusterIP kube-dns, searches `shop.svc.cluster.local`, `svc.cluster.local`, option `ndots: \"2\"`). `k exec dnspolicy-lab -- cat /etc/resolv.conf`, `k exec dnspolicy-lab -- nslookup catalog`. Xoá Pod." },
      { id: "t7", text: "Tình huống hỏng: `k run dns-default --image=busybox:1.37 --restart=Never --overrides='{\"spec\":{\"dnsPolicy\":\"Default\"}}' -- sleep 3600`. `k exec dns-default -- cat /etc/resolv.conf`, `k exec dns-default -- nslookup catalog.shop.svc.cluster.local`: vì sao hỏng? Xoá Pod. Trên Mac: `./labs/lab verify cka s28` phải đạt 5/5." },
    ],
    hints: [
      "`nslookup` của busybox không phải resolver mà ứng dụng dùng: nó tự gửi câu hỏi và với tên có dấu chấm thì hỏi nguyên tên trước. `catalog.shop` tình cờ là một tên miền đã đăng ký dưới gTLD `.shop` có thật, nên câu hỏi nguyên tên đó có câu trả lời công cộng (IP đổi theo ngày; `gateway.shop` chưa ai đăng ký thì không ra gì). Đó chính là lý do thứ tự search domain và `ndots` quan trọng, và lý do nên gõ FQDN. JVM, `getent`, `curl` đi qua libc và áp search domain theo `ndots`: `catalog.shop` ra đúng ClusterIP.",
      "dig không đọc `search` (mặc định `+nosearch`), luôn hỏi đúng tên bạn gõ. Muốn dig ghép search như Pod: `dig +search …` nhưng trên node thì `search` là của node, không phải của Pod.",
      "Sửa ConfigMap mà tra vẫn chưa ra: kubelet đồng bộ ConfigMap vào volume của Pod coredns sau tối đa khoảng một phút, rồi plugin `reload` mới đọc lại (kiểm 30 giây một lần). `rollout restart` nhanh và chắc hơn trong phòng thi.",
      "`rollout restart deploy/coredns` tạo hai Pod mới, và anti-affinity ưu tiên của Deployment kubeadm đẩy chúng sang worker (hai Pod cũ ở cka-cp chỉ vì worker join sau `kubeadm init`). Worker chưa có image `registry.k8s.io/coredns/coredns` nên phải kéo về; kéo không được thì Pod mới `ImagePullBackOff`, rollout dừng giữa chừng với một Pod cũ phục vụ, verify báo đúng tên Pod. Gỡ: `k -n kube-system rollout undo deploy/coredns` (về ReplicaSet cũ, Pod ở cka-cp có sẵn image), rồi chờ `reload`. (`begin cka s28` đã bật `net.ipv4.tcp_mtu_probing=1` trên ba node: đường mạng của máy lab có MTU nhỏ hơn 1500 làm containerd kéo image từ registry.k8s.io treo ở bước TLS.)",
      "Sau khi sửa Corefile mà mọi tên đều NXDOMAIN: khối `hosts` thiếu `fallthrough`. Pod coredns vẫn Running và Ready: chỉ câu trả lời sai.",
      "Corefile sai cú pháp (thiếu `}`): Pod coredns mới `CrashLoopBackOff`, log `Error during parsing`. Pod cũ vẫn phục vụ nếu bạn dùng `rollout restart` (rolling update chờ Pod mới Ready); đừng xoá hết Pod coredns bằng tay.",
      "`--overrides` với `dnsPolicy` cần `--restart=Never` và JSON đúng dạng `{\"spec\":{…}}`; dễ hơn là `$do > pod.yaml`, sửa, apply.",
    ],
    solution: `Output là của máy soạn bài; IP sẽ khác. Context đã ở namespace shop.

**1. resolv.conf và ba dạng tên**

\`\`\`bash
k run tmp --image=busybox:1.37 --rm -it --restart=Never -- sh
/ # cat /etc/resolv.conf
search shop.svc.cluster.local svc.cluster.local cluster.local
nameserver 10.96.0.10
options ndots:5
/ # nslookup catalog | tail -3
Name:	catalog.shop.svc.cluster.local
Address: 10.101.94.107
/ # nslookup catalog.shop | tail -4
Name:	catalog.shop
Address: 216.150.1.65
Name:	catalog.shop
Address: 216.150.16.1
/ # nslookup catalog.shop.svc.cluster.local | tail -2
Name:	catalog.shop.svc.cluster.local
Address: 10.101.94.107
/ # exit
k exec deploy/order -- getent hosts catalog
# 10.101.94.107   catalog.shop.svc.cluster.local
k exec deploy/order -- getent hosts catalog.shop
# 10.101.94.107   catalog.shop.svc.cluster.local
k exec deploy/order -- getent hosts catalog.shop.svc.cluster.local
# 10.101.94.107   catalog.shop.svc.cluster.local
echo NDOTS=5 >> ~/drills/s28/answers.env
\`\`\`

\`catalog.shop\` qua busybox ra hai IP công cộng: busybox hỏi nguyên tên có dấu chấm trước, và \`catalog.shop\` là một tên miền công cộng đã có người đăng ký dưới gTLD \`.shop\` (IP là thứ DNS công cộng trả lúc đo, sẽ khác ở máy bạn; \`nslookup gateway.shop\` thì NXDOMAIN vì tên đó chưa ai đăng ký). \`getent\` (glibc của image Temurin) áp search theo \`ndots:5\`: \`catalog.shop.shop.svc.cluster.local\` (NXDOMAIN) rồi \`catalog.shop.svc.cluster.local\` (trúng). Ứng dụng Java thấy đúng điều \`getent\` thấy.

**2. dig thẳng CoreDNS từ node**

\`\`\`bash
k -n kube-system get svc kube-dns
# kube-dns   ClusterIP   10.96.0.10   <none>   53/UDP,53/TCP,9153/TCP   4d9h
sudo grep -A1 clusterDNS /var/lib/kubelet/config.yaml
# clusterDNS:
# - 10.96.0.10
dig @10.96.0.10 catalog.shop.svc.cluster.local +short
# 10.101.94.107
dig @10.96.0.10 kubernetes.default.svc.cluster.local +short
# 10.96.0.1
echo KUBE_DNS_IP=10.96.0.10 >> ~/drills/s28/answers.env
\`\`\`

Node gọi được ClusterIP vì kube-proxy cũng viết rule trong chuỗi \`OUTPUT\` của node. dig không đọc \`search\`, nên chỉ FQDN mới ra.

**3. Corefile**

\`\`\`bash
k -n kube-system get cm coredns -o jsonpath='{.data.Corefile}'
\`\`\`

\`\`\`text
.:53 {
    errors
    health {
       lameduck 5s
    }
    ready
    kubernetes cluster.local in-addr.arpa ip6.arpa {
       pods insecure
       fallthrough in-addr.arpa ip6.arpa
       ttl 30
    }
    prometheus :9153
    forward . /etc/resolv.conf {
       max_concurrent 1000
    }
    cache 30 {
       disable success cluster.local
       disable denial cluster.local
    }
    loop
    reload
    loadbalance
}
\`\`\`

\`kubernetes\` trả lời \`cluster.local\` (và tra ngược \`in-addr.arpa\`), tên khác \`forward\` lên resolv.conf của Pod coredns (DNS của node); cache 30 giây chỉ áp cho tên ngoài.

**4. Service postgres-rw** (\`~/shop/postgres-rw.yaml\`)

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres-rw
  namespace: shop
  labels:
    app: postgres
spec:
  type: ClusterIP
  selector:
    app: postgres
  ports:
  - name: postgres
    port: 5432
    targetPort: 5432
\`\`\`

\`\`\`bash
k apply -f ~/shop/postgres-rw.yaml
k get svc postgres postgres-rw
# NAME          TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
# postgres      ClusterIP   None             <none>        5432/TCP   2d10h
# postgres-rw   ClusterIP   10.101.112.159   <none>        5432/TCP   5s
k get endpointslice -l kubernetes.io/service-name=postgres-rw
# NAME                ADDRESSTYPE   PORTS   ENDPOINTS       AGE
# postgres-rw-n92zx   IPv4          5432    10.244.62.130   5s
\`\`\`

Cùng selector, cùng Pod: \`postgres\` (headless) cho tên riêng \`postgres-0.postgres…\` mà JDBC dùng, \`postgres-rw\` cho một IP ảo ổn định để ghi vào Corefile.

**5. Khối hosts trong Corefile**

\`\`\`bash
k -n kube-system edit cm coredns
\`\`\`

Thêm vào server block \`.:53\`, trước dòng \`kubernetes\` (vị trí chỉ để dễ đọc; thứ tự chạy do CoreDNS quyết định):

\`\`\`text
    hosts {
       10.101.112.159 db.shop.internal
       fallthrough
    }
\`\`\`

\`\`\`bash
k -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | sed -n '/hosts/,/}/p'
#     hosts {
#        10.101.112.159 db.shop.internal
#        fallthrough
#     }
# chờ plugin reload (đo: khoảng 40 giây tới một phút rưỡi):
k -n kube-system logs -l k8s-app=kube-dns --tail=3 | grep -i reload
# [INFO] Reloading
# [INFO] plugin/reload: Running configuration SHA512 = c36214a5…
# [INFO] Reloading complete
k exec deploy/order -- getent hosts db.shop.internal
# 10.101.112.159  db.shop.internal
k exec deploy/order -- getent hosts catalog.shop.svc.cluster.local
# 10.101.94.107   catalog.shop.svc.cluster.local
\`\`\`

**6. dnsPolicy: None + dnsConfig** (\`~/drills/s28/dnspolicy-lab.yaml\`)

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: dnspolicy-lab
  namespace: shop
spec:
  dnsPolicy: None
  dnsConfig:
    nameservers:
    - 10.96.0.10
    searches:
    - shop.svc.cluster.local
    - svc.cluster.local
    options:
    - name: ndots
      value: "2"
  containers:
  - name: sh
    image: busybox:1.37
    command: ["sleep", "3600"]
    resources:
      requests:
        cpu: 10m
        memory: 16Mi
      limits:
        memory: 32Mi
\`\`\`

\`\`\`bash
k apply -f ~/drills/s28/dnspolicy-lab.yaml
k exec dnspolicy-lab -- cat /etc/resolv.conf
# search shop.svc.cluster.local svc.cluster.local
# nameserver 10.96.0.10
# options ndots:2
k exec dnspolicy-lab -- nslookup catalog | grep -A1 ^Name
# Name:	catalog.shop.svc.cluster.local
# Address: 10.101.94.107
k delete pod dnspolicy-lab --now
\`\`\`

**7. Tình huống hỏng: dnsPolicy: Default**

\`\`\`bash
k run dns-default --image=busybox:1.37 --restart=Never --overrides='{"spec":{"dnsPolicy":"Default"}}' -- sleep 3600
k exec dns-default -- cat /etc/resolv.conf
# nameserver 192.168.252.1
# nameserver fe80::603e:5fff:fe01:267%2
k exec dns-default -- nslookup catalog.shop.svc.cluster.local
# Server:		192.168.252.1
# Address:	192.168.252.1:53
#
# ** server can't find catalog.shop.svc.cluster.local: NXDOMAIN
# command terminated with exit code 1
k delete pod dns-default --now
\`\`\`

Không có \`search\`, nameserver là DNS của mạng Multipass (\`192.168.252.1\`, lấy từ \`/run/systemd/resolve/resolv.conf\` của node): máy đó không biết \`cluster.local\`, trả NXDOMAIN. Sửa: bỏ \`dnsPolicy\` (về \`ClusterFirst\`). Trước khi xoá Pod nháp, chạy lại verify sẽ đỏ dòng Pod nháp: verify đòi cả hai đã xoá.

Lời giải tự động: \`labs/cka/sessions/s28/apply.sh\` (sửa Corefile bằng Python trên JSON của ConfigMap thay cho \`k edit\`, rồi làm các bước còn lại; chạy lại được: khối \`hosts\` cũ có \`db.shop.internal\` được thay, không nhân đôi).`,
    exam: {
      patterns: [
        "\"Từ Pod X, phân giải Service Y ở namespace Z và ghi kết quả vào tệp\" — `k exec X -- nslookup Y.Z.svc.cluster.local > /tmp/out` (dùng FQDN để khỏi phụ thuộc search domain và cách nslookup xử lý).",
        "\"Thêm bản ghi tĩnh / forward một miền cho CoreDNS\" — `k -n kube-system edit cm coredns`: khối `hosts { IP tên; fallthrough }` hay server block mới `example.local:53 { forward . 10.0.0.53 }`, rồi `k -n kube-system rollout restart deploy/coredns`.",
        "\"Pod không phân giải được tên Service\" — `k exec <pod> -- cat /etc/resolv.conf` (dnsPolicy?), `k -n kube-system get pod -l k8s-app=kube-dns`, `k get endpointslice -n kube-system -l kubernetes.io/service-name=kube-dns`, `dig @<ClusterIP kube-dns> <FQDN>` từ node.",
        "\"Pod dùng nameserver riêng 8.8.8.8\" — `dnsPolicy: None` + `dnsConfig.nameservers`; thiếu `dnsConfig` với `None` thì Pod bị từ chối.",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trong 3 phút: ghi FQDN của Service `order` và ClusterIP mà CoreDNS trả cho nó vào `/tmp/dns.txt`, chỉ dùng `dig` trên cka-cp.",
          timeLimitMin: 3,
          solution: "```bash\nDNS=$(k -n kube-system get svc kube-dns -o jsonpath='{.spec.clusterIP}')\necho \"order.shop.svc.cluster.local $(dig @$DNS order.shop.svc.cluster.local +short)\" > /tmp/dns.txt\ncat /tmp/dns.txt\n# order.shop.svc.cluster.local 10.108.134.164\n```",
        },
        {
          text: "Trong 4 phút: Pod `dns-test` (busybox:1.37, `sleep 3600`) chỉ dùng nameserver `10.96.0.10`, search `shop.svc.cluster.local`, `ndots: 1`. Kiểm `nslookup catalog` trong Pod.",
          timeLimitMin: 4,
          solution: "```yaml\napiVersion: v1\nkind: Pod\nmetadata:\n  name: dns-test\nspec:\n  dnsPolicy: None\n  dnsConfig:\n    nameservers: [10.96.0.10]\n    searches: [shop.svc.cluster.local]\n    options:\n    - name: ndots\n      value: \"1\"\n  containers:\n  - name: sh\n    image: busybox:1.37\n    command: [sleep, \"3600\"]\n```\n`k exec dns-test -- cat /etc/resolv.conf` phải đúng ba dòng đó. Dọn: `k delete pod dns-test --now`.",
        },
      ],
    },
    tips: [
      "Trong đề, dùng FQDN `<svc>.<ns>.svc.cluster.local` khi được hỏi \"phân giải Service\": không phụ thuộc namespace của Pod tạm, search domain hay cách công cụ xử lý ndots.",
      "`dig @<IP> <tên> +short` từ node tách được ba lỗi: CoreDNS không trả lời (timeout), Service không tồn tại (rỗng), Pod gọi sai (dig đúng mà Pod sai: xem resolv.conf của Pod).",
      "Nhãn của Pod CoreDNS là `k8s-app=kube-dns`, Service là `kube-dns`, nhưng Deployment và ConfigMap là `coredns`.",
      "Sửa ConfigMap coredns xong luôn chạy lại một câu tra tên Service bình thường, không chỉ tên mới thêm.",
    ],
    outcome: {
      md: `Bạn đã đọc được đường đi của một câu hỏi DNS (resolv.conf → Service kube-dns → CoreDNS → plugin), thêm một bản ghi tĩnh mà không làm hỏng các tên khác, và thấy \`dnsPolicy\` đổi resolv.conf ra sao. Trên Mac:

\`\`\`bash
./labs/lab verify cka s28
\`\`\`

Verify đọc Corefile từ ConfigMap \`coredns\` (khối \`hosts\` có \`db.shop.internal\` đúng ClusterIP của \`postgres-rw\` và \`fallthrough\`), Service \`postgres-rw\` và EndpointSlice của nó (đúng IP \`postgres-0\`), rồi tra \`db.shop.internal\` **và** \`catalog.shop.svc.cluster.local\` bằng \`getent\` trong \`postgres-0\` (tên mới đúng, tên cũ vẫn đúng); \`NDOTS\` so với resolv.conf của chính Pod đó, \`KUBE_DNS_IP\` với Service \`kube-dns\`; Pod nháp phải đã xoá. ConfigMap bền nên sau khi VM khởi động lại verify vẫn đạt (đo: \`down\` + \`up\`).`,
      verifyOutput: "lab: kiểm s28\n  (chờ apiserver, CoreDNS, postgres-0 và ba Deployment, nếu đang khởi động: tối đa ~10 phút)\n  ✓ CoreDNS Available; Corefile có khối hosts: db.shop.internal → ClusterIP của postgres-rw, và fallthrough\n  ✓ Service postgres-rw: ClusterIP thường, cổng 5432, endpoint ready duy nhất là postgres-0; YAML trong ~/shop/\n  ✓ Từ postgres-0: db.shop.internal ra IP của postgres-rw, catalog.shop.svc.cluster.local vẫn ra ClusterIP của catalog; shop Available\n  ✓ answers.env: NDOTS khớp /etc/resolv.conf của Pod shop; Pod nháp dnspolicy-lab, dns-default đã xoá\n  ✓ answers.env: KUBE_DNS_IP là ClusterIP của Service kube-dns\n  → 5/5 đạt",
      projectDelta: "CoreDNS của cluster có bản ghi `db.shop.internal` cho database; shop biết đọc và sửa DNS của chính nó. Buổi sau đưa shop ra ngoài bằng Ingress dưới tên shop.local.",
    },
    review: [
      { q: "Pod ở namespace `shop` gọi `http://order.default:8080`. Resolver hỏi những tên nào, theo thứ tự nào?", a: "`order.default` có 1 dấu chấm < ndots 5 nên ghép search trước: `order.default.shop.svc.cluster.local` (NXDOMAIN), `order.default.svc.cluster.local` (trúng nếu Service `order` có ở `default`). Hết search mà chưa trúng mới hỏi `order.default.` như tên tuyệt đối." },
      { q: "Thêm khối `hosts { 10.101.112.159 db.shop.internal }` (không fallthrough) vào Corefile. Điều gì hỏng?", a: "`hosts` chạy trước `kubernetes` và nhận mọi tên của server block `.`: tên không có trong danh sách bị trả NXDOMAIN, kể cả `catalog.shop.svc.cluster.local`. Cả cluster mất DNS dù Pod coredns vẫn Ready." },
      { q: "Vì sao bản ghi tĩnh phải trỏ ClusterIP của `postgres-rw` chứ không phải IP của `postgres-0`?", a: "IP của `postgres-0` đổi mỗi lần Pod tạo lại (s24) hay VM khởi động lại (s26); Service headless `postgres` không có ClusterIP. ClusterIP của Service thường sống cùng Service, kube-proxy dẫn tới Pod hiện tại." },
      { q: "Pod `dnsPolicy: Default` không phân giải được `catalog.shop.svc.cluster.local`. Vì sao tên gây nhầm?", a: "`Default` nghĩa là \"dùng DNS của node\": kubelet chép resolv.conf của node (`resolvConf`, trên Ubuntu `/run/systemd/resolve/resolv.conf`) vào Pod, nameserver là DNS của mạng Multipass, không biết `cluster.local`. Mặc định thật của Pod là `ClusterFirst`." },
      { q: "Ứng dụng Spring Boot gọi `api.partner.com` chậm thêm vài chục mili giây mỗi 30 giây. Liên quan gì tới ndots và JVM?", a: "Tên 2 dấu chấm < ndots 5: mỗi lần tra là ba câu NXDOMAIN qua search domain (A và AAAA) trước câu thật. JVM giữ kết quả 30 giây (`networkaddress.cache.ttl`), hết hạn là tra lại. Sửa: gọi `api.partner.com.` (dấu chấm cuối), đặt `ndots: 2` qua `dnsConfig`, hay tăng TTL của JVM có chừng mực." },
    ],
  },
  {
    id: "s29",
    stage: "st5",
    title: "Ingress controller và Ingress",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-ingress"],
    requires: ["s28"],
    status: "skeleton",
    pieces: ["ingress"],
    goals: [
      "Cài ingress-nginx kiểu NodePort và đưa shop ra ngoài dưới tên shop.local với hai path.",
      "Bật TLS cho Ingress bằng Secret tls tự ký và gọi được https từ máy Mac.",
      "Giải thích ingressClassName và pathType Prefix/Exact bằng chính hai path của shop.",
    ],
    skills: [
      { skill: "k-ingress-nginx-install", level: "Làm được có tra" },
      { skill: "k-create-ingress", level: "Gõ được không tra" },
      { skill: "k-ingress-yaml", level: "Viết được có tra" },
      { skill: "k-ingressclass", level: "Gõ được không tra" },
      { skill: "k-tls-secret", level: "Gõ được không tra" },
      { skill: "net-curl-host", level: "Gõ được không tra" },
      { skill: "k-ingress-pathtype", level: "Giải thích được" },
    ],
    uses: ["k-svc-nodeport-yaml", "k-get-endpoints", "k-exam-vars", "net-etc-hosts"],
    stateIn: "Đầu ra s28.",
    stateOut: "ingress-nginx chạy; Ingress shop phục vụ http và https cho shop.local/api và shop.local/orders từ máy Mac.",
  },
  {
    id: "s30",
    stage: "st5",
    title: "Gateway API",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-gateway"],
    requires: ["s29"],
    status: "skeleton",
    pieces: ["gateway-api"],
    goals: [
      "Cài CRD Gateway API và một implementation, tạo Gateway shop-gw và HTTPRoute tương đương Ingress của s29.",
      "Chia lưu lượng gateway 90/10 giữa bản 1.0 và 2.0 bằng weight trong HTTPRoute.",
      "Đọc điều kiện Accepted/Programmed để biết Gateway hay Route đang hỏng.",
    ],
    skills: [
      { skill: "k-gateway-install", level: "Làm được có tra" },
      { skill: "k-gateway-httproute", level: "Viết được có tra" },
      { skill: "k-gatewayclass", level: "Giải thích được" },
      { skill: "k-httproute-weights", level: "Viết được có tra" },
      { skill: "k-gateway-status", level: "Gõ được không tra" },
      { skill: "k-docs-gateway", level: "Tìm được trong 30 giây" },
    ],
    uses: ["k-ingress-yaml", "net-curl-host", "k-set-image", "k-svc-clusterip-yaml"],
    stateIn: "Đầu ra s29.",
    stateOut: "Gateway shop-gw Programmed; HTTPRoute shop chia 90/10 giữa gateway 1.0 và 2.0, gọi được từ máy Mac.",
  },
  {
    id: "s31",
    stage: "st5",
    title: "NetworkPolicy",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-netpol"],
    requires: ["s30"],
    status: "skeleton",
    pieces: ["netpol"],
    goals: [
      "Đặt default-deny cho namespace shop rồi mở đúng các luồng gateway → catalog/order, order → catalog, hai service → postgres.",
      "Mở egress DNS để Pod vẫn phân giải tên sau khi chặn.",
      "Chứng minh mỗi luồng bị chặn hay được mở bằng nc từ đúng Pod nguồn.",
    ],
    skills: [
      { skill: "k-netpol-default-deny", level: "Viết được không tra" },
      { skill: "k-netpol-allow", level: "Viết được có tra" },
      { skill: "k-netpol-dns-egress", level: "Viết được không tra" },
      { skill: "k-get-netpol", level: "Gõ được không tra" },
      { skill: "k-netpol-semantics", level: "Giải thích được" },
      { skill: "k-netpol-ns-selector", level: "Viết được có tra" },
    ],
    uses: ["net-curl-nc", "k-labels-selectors", "k-svc-fqdn", "k-calico-status", "net-tcpdump"],
    stateIn: "Đầu ra s30: mọi Pod trong cluster gọi nhau tự do.",
    stateOut: "Namespace shop mặc định chặn; chỉ các luồng cần thiết và DNS được mở; ingress controller vẫn tới được gateway.",
  },
  {
    id: "s32",
    stage: "st5",
    title: "Sự cố chặng 5: Service không tới được Pod",
    durationMin: 90,
    domain: "troubleshooting",
    competencies: ["ts-net"],
    requires: ["s31"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Đưa shop gọi được lại từ máy Mac trong 25 phút khi lỗi nằm ở nhiều tầng mạng cùng lúc.",
      "Kiểm Service theo thứ tự: endpoints → selector/nhãn → targetPort → Pod Ready → NetworkPolicy.",
      "Dùng Pod netshoot để thử từng chặng từ trong cluster.",
    ],
    skills: [
      { skill: "k-svc-no-endpoints-flow", level: "Dưới 5 phút" },
      { skill: "k-selector-mismatch", level: "Nhận ra trong 1 phút" },
      { skill: "k-svc-ports-jsonpath", level: "Gõ được có tra" },
      { skill: "k-netshoot", level: "Gõ được không tra" },
      { skill: "k-endpointslice", level: "Gõ được có tra" },
    ],
    uses: ["k-get-endpoints", "k-get-netpol", "net-dig", "k-ingressclass", "k-wget-svc"],
    stateIn: "Đầu ra s31 cộng `./labs/lab break`: shop.local trả 503, vài luồng nội bộ hỏng.",
    stateOut: "shop.local và HTTPRoute phục vụ bình thường, mọi luồng nội bộ đúng như cuối s31.",
  },
];
