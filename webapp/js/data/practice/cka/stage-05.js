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
    stateIn: "Đầu ra s26 (cluster như cuối s25): ba Service gateway, catalog, order do `kubectl expose` tạo ở s11, cổng 8080 → targetPort 8080, không tên cổng, không có trong ~/shop/; kube-proxy chế độ iptables. `./labs/lab begin cka s27` kiểm đầu vào bằng `check.sh` riêng của s27 (phần bền của cuối s26: shop Available, ~/drills/s26/answers.env đủ và đúng dạng; không đòi Pod catalog đã chọn ở s26 còn chạy), tạo ~/drills/s27 và xoá answers.env cũ.",
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
    status: "published",
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
    foundation: null,
    mindset: `**Ingress là luật, controller là proxy.** Object \`Ingress\` (API \`networking.k8s.io/v1\`) chỉ ghi luật L7: host nào, path nào, tới Service nào, dùng Secret TLS nào. Không có gì trong Kubernetes thực thi các luật đó cho tới khi bạn cài một **Ingress controller**: một Deployment chạy proxy (ở đây là nginx) watch Ingress, Service, EndpointSlice, Secret và tự viết lại \`nginx.conf\`. Cluster kubeadm không có sẵn controller nào, nên bước đầu của buổi là cài nó. ingress-nginx gửi request **thẳng tới IP Pod** đọc từ EndpointSlice (không qua ClusterIP và kube-proxy), nên Service chỉ là nơi để nó tìm Pod.

**ingress-nginx đã dừng bảo trì.** SIG Network thông báo (11/2025) dự án \`kubernetes/ingress-nginx\` chỉ được sửa lỗi "best-effort" tới tháng 3/2026. Các bản cuối là \`controller-v1.15.1\`, \`v1.14.5\`, \`v1.13.9\` (cùng ngày 19/3/2026), repo chuyển sang chỉ đọc (archived) ngày 23/3/2026. Image vẫn kéo được từ \`registry.k8s.io\` nhưng sẽ không còn bản vá bảo mật. Lab dùng nó vì ba lý do: đề CKA vẫn hỏi Ingress (API Ingress không bị bỏ, chỉ controller này dừng), cài bằng một manifest, và rất nhiều cluster đang chạy vẫn dùng nó. Hệ thống mới nên chọn Gateway API (buổi sau, s30) hay một controller Ingress khác còn bảo trì; đừng nhầm với "NGINX Ingress Controller" của F5 (\`nginx/kubernetes-ingress\`), đó là dự án khác.

**IngressClass nối Ingress với controller.** Manifest tạo IngressClass \`nginx\` với \`spec.controller: k8s.io/ingress-nginx\`; controller chỉ nhận Ingress có \`spec.ingressClassName: nginx\` (hay class mặc định, nếu một IngressClass mang annotation \`ingressclass.kubernetes.io/is-default-class: "true"\`; manifest này không đặt). Ingress thiếu class thì không ai nhận: object vẫn tạo được, \`k get ingress\` có cột ADDRESS trống mãi, không Event nào, request trả 404 của controller. Đây là tình huống hỏng của buổi.

**pathType.** \`Prefix\` so theo **phần tử path** tách bởi \`/\`: \`/api\` khớp \`/api\`, \`/api/\`, \`/api/products\`, nhưng không khớp \`/apis\`. \`Exact\` chỉ khớp đúng chuỗi, phân biệt hoa thường: \`/orders\` không khớp \`/orders/1\`. \`ImplementationSpecific\` để controller tự hiểu (ingress-nginx khớp theo chuỗi đầu như \`location\` của nginx, nên \`/api\` khớp cả \`/apis\`; hay regex khi bật \`use-regex\`). Nhiều path cùng khớp thì path dài nhất thắng; cùng độ dài thì \`Exact\` thắng \`Prefix\`. Không path nào khớp thì controller trả 404 của chính nó (default backend), khác 404 dạng JSON của Spring: nhìn body là biết request có tới ứng dụng không.

**TLS ở controller.** Secret kiểu \`kubernetes.io/tls\` (khoá \`tls.crt\`, \`tls.key\`) phải nằm **cùng namespace với Ingress**. Khối \`tls\` của Ingress gắn host với Secret; controller chọn chứng chỉ theo SNI của client. Host không có chứng chỉ khớp (hay Secret hỏng) thì controller trả chứng chỉ mặc định "Kubernetes Ingress Controller Fake Certificate": \`curl -k\` vẫn ra 200 và che mất lỗi, còn \`curl --cacert tls.crt\` chỉ qua khi đúng chứng chỉ của bạn được phục vụ. Chứng chỉ phải có **SAN** \`DNS:shop.local\`: client hiện đại (curl, Java) bỏ qua CN khi so tên. Ingress có \`tls\` thì ingress-nginx mặc định chuyển hướng http sang https (308); muốn http vẫn phục vụ thì annotation \`nginx.ingress.kubernetes.io/ssl-redirect: "false"\`.

**Không có LoadBalancer thì NodePort.** Manifest bản \`baremetal\` để Service \`ingress-nginx-controller\` kiểu NodePort với cổng ngẫu nhiên; lab ghim \`30080\` (http) và \`30443\` (https) để gọi được từ máy Mac (\`30180\` là \`gateway-nodeport\` của s27, Gateway của s30 dùng \`30280\`). Controller đặt trên cka-cp (nodeSelector \`node-role.kubernetes.io/control-plane: ""\` + toleration của taint \`NoSchedule\`) để dành RAM worker cho JVM; NodePort vẫn mở trên mọi node, kube-proxy dẫn về cka-cp. Không có \`--publish-service\`, controller ghi vào ADDRESS của Ingress IP của node đang chạy nó.

**X-Forwarded-* và Spring Boot.** Controller kết thúc TLS rồi gọi Pod bằng http thường, kèm \`X-Forwarded-For\` (IP client), \`X-Forwarded-Proto: https\`, \`X-Forwarded-Host\`, \`X-Forwarded-Port\`, \`X-Real-IP\`. Ứng dụng không đọc các header này thì thấy request là \`http://\` từ IP của Pod controller: \`redirect:\` của Spring MVC, \`redirect_uri\` của OAuth2 login, link tuyệt đối trong HATEOAS đều thành \`http://…\`. Spring Boot xử lý bằng \`server.forward-headers-strategy\`: \`native\` (Tomcat \`RemoteIpValve\` đọc \`X-Forwarded-For\`/\`-Proto\`), \`framework\` (\`ForwardedHeaderFilter\` của Spring, hiểu cả \`Forwarded\` RFC 7239 và \`X-Forwarded-Prefix\`), \`none\`. Mặc định là \`none\`, **trừ** khi Boot nhận ra nó chạy trên một nền cloud được hỗ trợ: trong Pod, biến \`KUBERNETES_SERVICE_HOST\`/\`_PORT\` làm Boot chọn \`native\`. Tomcat chỉ tin header từ proxy nằm trong \`server.tomcat.remoteip.internal-proxies\` (mặc định gồm 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16…), IP Pod controller \`10.244.x.y\` nằm trong đó. Chạy cùng jar ngoài Kubernetes sau một nginx thì phải tự đặt \`server.forward-headers-strategy=native\`.`,
    refs: [
      { label: "Bài lộ trình CKA: Ingress + IngressClass; cài ingress controller", href: "#/roadmap/cka/cka-w6-4" },
      { label: "CKA Study Guide, chương 18 — Ingress", href: "#/docs/ckabook-18" },
      { label: "kubernetes.io: Ingress (pathType, IngressClass, TLS)", href: "https://kubernetes.io/docs/concepts/services-networking/ingress/" },
      { label: "kubernetes.io: Ingress Controllers", href: "https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/" },
      { label: "Kubernetes blog: Ingress NGINX Retirement", href: "https://kubernetes.io/blog/2025/11/11/ingress-nginx-retirement/" },
      { label: "ingress-nginx: Bare-metal considerations (NodePort)", href: "https://kubernetes.github.io/ingress-nginx/deploy/baremetal/" },
      { label: "Spring Boot: Running Behind a Front-end Proxy Server (server.forward-headers-strategy)", href: "https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server" },
    ],
    stateIn: "Đầu ra s28: Service gateway, catalog, order cổng http 8080, gateway-nodeport 30180, postgres-rw và khối hosts db.shop.internal trong CoreDNS; chưa có Ingress controller, chưa có IngressClass. `./labs/lab begin cka s29` kiểm đầu vào bằng verify của s28, tạo ~/drills/s29 và xoá answers.env cũ.",
    stateOut: "ingress-nginx controller-v1.15.1 ở namespace ingress-nginx (controller trên cka-cp, Service NodePort http 30080, https 30443), IngressClass nginx; Secret tls shop-tls (tự ký, SAN shop.local); Ingress shop trong ~/shop/ingress.yaml (shop.local: /api Prefix → gateway:8080, /orders Exact → order:8080, tls, ssl-redirect tắt) gọi được http và https từ máy Mac; shop.local trong /etc/hosts của cka-cp; ~/drills/s29/answers.env.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s29`. Đọc trước: `k get ingressclass` (rỗng?), `k get svc`, `k get endpointslice -l kubernetes.io/service-name=gateway` (địa chỉ nào controller sẽ gọi?). Trên cka-cp đo `free -m`, rồi tải manifest đã ghim: `curl -fsSLo ~/drills/s29/ingress-nginx.yaml https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/baremetal/deploy.yaml`. `grep -nE 'kind:|image:|type: NodePort' ~/drills/s29/ingress-nginx.yaml`: có những object nào, image nào?",
      },
      {
        id: "t2",
        text: "Sửa `~/drills/s29/ingress-nginx.yaml` trước khi apply: Service `ingress-nginx-controller` thêm `nodePort: 30080` cho cổng `http`, `nodePort: 30443` cho cổng `https`; Deployment `ingress-nginx-controller` thêm `node-role.kubernetes.io/control-plane: \"\"` vào `nodeSelector` và một toleration cho taint `node-role.kubernetes.io/control-plane:NoSchedule`. `k apply -f`, `k -n ingress-nginx rollout status deploy/ingress-nginx-controller`, `k -n ingress-nginx get pod,svc -o wide` (Pod ở node nào, cột PORT(S)?), `k get ingressclass nginx -o yaml`. Đo lại `free -m` trên cka-cp.",
      },
      { id: "t3", text: "Chứng chỉ tự ký trong `~/drills/s29`: `openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout tls.key -out tls.crt -subj '/CN=shop.local' -addext 'subjectAltName=DNS:shop.local'`. Kiểm `openssl x509 -in tls.crt -noout -subject -ext subjectAltName`. `k create secret tls shop-tls --cert=tls.crt --key=tls.key`, `k get secret shop-tls` (TYPE?)." },
      {
        id: "t4",
        text: "Ingress `shop`: sinh khung `k create ingress shop --class=nginx --rule='shop.local/api*=gateway:8080,tls=shop-tls' --rule='shop.local/orders=order:8080' --annotation=nginx.ingress.kubernetes.io/ssl-redirect=false $do > ~/shop/ingress.yaml`. Đọc tệp: `*` sinh pathType gì, rule không có `*` sinh gì? Bỏ khối `status`, `k apply -f ~/shop/ingress.yaml`, `k get ingress shop` (ADDRESS là IP nào?), `k describe ingress shop`.",
      },
      {
        id: "t5",
        text: "Tên shop.local: trên cka-cp thêm `<IP cka-cp> shop.local` vào `/etc/hosts` **và** `/etc/cloud/templates/hosts.debian.tmpl` (cloud-init viết lại `/etc/hosts` mỗi lần khởi động, như ở s01), `curl http://shop.local:30080/api/products`. Không sửa hosts mà vẫn gọi được: `curl -H 'Host: shop.local' http://<IP cka-w1>:30080/api/products`. Trên **Mac**: thêm `<IP một node> shop.local` vào `/etc/hosts` của Mac (`sudo vim /etc/hosts`, việc của bạn; verify không dựa vào nó), chép chứng chỉ về `multipass transfer cka-cp:/home/ubuntu/drills/s29/tls.crt /tmp/shop.crt`, rồi `curl --cacert /tmp/shop.crt https://shop.local:30443/api/products` và `curl -k -v https://shop.local:30443/api/products 2>&1 | grep -E 'subject|issuer'`. Không có `/etc/hosts` trên Mac: `curl --resolve shop.local:30443:<IP> --cacert /tmp/shop.crt https://shop.local:30443/api/products`.",
      },
      {
        id: "t6",
        text: "pathType: gọi `/api/products`, `/api`, `/orders`, `/orders/1` qua `http://shop.local:30080` với `curl -s -o /dev/null -w '%{http_code}\\n'`, rồi `curl -s http://shop.local:30080/orders/1 | head -3` (404 này của ai?). Ghi `PATH_EXACT_RESULT=<mã HTTP của /orders/1>` và `PATH_EXACT_FROM=<nginx hay spring: ai trả 404 đó>` vào `~/drills/s29/answers.env`. Đổi tạm `/orders` sang `Prefix` (`k edit ingress shop`) và gọi lại `/orders/1`: mã có đổi không, body có đổi không? Apply lại `~/shop/ingress.yaml`. Thử `k annotate ingress shop nginx.ingress.kubernetes.io/ssl-redirect-` rồi `curl -I http://shop.local:30080/api/products`: mã gì, `Location` trỏ đâu? Apply lại `~/shop/ingress.yaml`.",
      },
      {
        id: "t7",
        text: "Tình huống hỏng: `~/drills/s29/noclass.yaml`, Ingress `shop-noclass` (host `noclass.shop.local`, `/api` Prefix → gateway:8080) **không** có `ingressClassName`. Apply, chờ nửa phút: `k get ingress` (ADDRESS?), `k describe ingress shop-noclass` (Events?), `curl -s -o /dev/null -w '%{http_code}\\n' -H 'Host: noclass.shop.local' http://shop.local:30080/api/products`. Vì sao? Xoá `shop-noclass`. Trên Mac: `./labs/lab verify cka s29` phải đạt 8/8.",
      },
    ],
    hints: [
      "Manifest của ingress-nginx có hai Job `ingress-nginx-admission-create`/`-patch` (image `kube-webhook-certgen`) tạo chứng chỉ cho ValidatingWebhook. Ngay sau `rollout status`, `k apply` Ingress có thể lỗi `failed calling webhook \"validate.nginx.ingress.kubernetes.io\"`: controller chưa nghe ở cổng 8443. Chờ vài giây rồi apply lại.",
      "Pod controller đứng `ImagePullBackOff` với `TLS handshake timeout` từ `cdn.registry.k8s.io`: đường mạng của máy lab có MTU nhỏ. `begin cka s06`/`s28` đã bật `net.ipv4.tcp_mtu_probing=1`; lần kéo đầu đôi khi vẫn hỏng một lần rồi kubelet tự kéo lại (đo: lần hai xong trong 26 giây). Kiểm `cat /proc/sys/net/ipv4/tcp_mtu_probing` trên node, rồi chờ.",
      "`nodePort` nằm trong mỗi phần tử của `spec.ports` của Service (cạnh `port`, `targetPort`), trong dải 30000–32767. Muốn đặt sau khi đã apply: `k -n ingress-nginx edit svc ingress-nginx-controller` cũng được.",
      "Toleration cho control plane: `tolerations: [{key: node-role.kubernetes.io/control-plane, operator: Exists, effect: NoSchedule}]` dưới `spec.template.spec`. Chỉ toleration thì Pod **được phép** lên cka-cp, không **bắt buộc**: cần thêm `nodeSelector`.",
      "`k create ingress`: `--rule='host/path*=svc:port'` (`*` → `Prefix`, không `*` → `Exact`), `,tls=secret` ở một rule sinh khối `tls` cho host đó. Thêm `$do` để xem trước, đừng tạo thẳng rồi sửa.",
      "`curl -k` ra 200 không chứng minh gì về Secret: controller có chứng chỉ giả mặc định. Đọc `issuer`/`subject` bằng `curl -kv`, hay dùng `--cacert`.",
      "Ingress không có ADDRESS: `k get ingressclass` (có class nào, tên gì), `k get ingress -o yaml | grep ingressClassName`, rồi log controller `k -n ingress-nginx logs deploy/ingress-nginx-controller --tail=20`: Ingress thiếu class hiện là `\"Ignoring ingress because of error while validating ingress class\" ingress=\"shop/shop-noclass\" error=\"ingress does not contain a valid IngressClass\"`. `k describe ingress` không có Event nào.",
      "Sau khi VM khởi động lại, `curl http://shop.local:30080` trên cka-cp báo `Could not resolve host`: dòng `shop.local` chỉ ghi vào `/etc/hosts` mà quên tệp mẫu `/etc/cloud/templates/hosts.debian.tmpl` (cloud-init dựng lại `/etc/hosts` từ đó).",
    ],
    solution: `Output là của máy soạn bài; IP và tên Pod sẽ khác. Context đã ở namespace shop. IP: cka-cp \`192.168.252.35\`, cka-w1 \`192.168.252.36\`.

**1–2. Cài ingress-nginx** (trên cka-cp)

\`\`\`bash
free -m | awk '/Mem:/{print $7}'          # 1964 (MB available trước khi cài)
mkdir -p ~/drills/s29 && cd ~/drills/s29
curl -fsSLo ingress-nginx.yaml https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.15.1/deploy/static/provider/baremetal/deploy.yaml
grep -nE 'image:|type: NodePort' ingress-nginx.yaml
vim ingress-nginx.yaml                      # nodePort 30080/30443, nodeSelector + toleration (bên dưới)
k apply -f ingress-nginx.yaml
k -n ingress-nginx rollout status deploy/ingress-nginx-controller
k -n ingress-nginx get pod,svc -o wide
# pod/ingress-nginx-controller-684b947cc6-95bks   1/1   Running   0   114s   10.244.160.39   cka-cp
# service/ingress-nginx-controller   NodePort   10.96.71.134   <none>   80:30080/TCP,443:30443/TCP
k get ingressclass
# NAME    CONTROLLER             PARAMETERS   AGE
# nginx   k8s.io/ingress-nginx   <none>       114s
k -n ingress-nginx top pod                  # 20m   37Mi
free -m | awk '/Mem:/{print $7}'          # 1910
\`\`\`

Phần sửa trong manifest (Service \`ingress-nginx-controller\` và Deployment cùng tên):

\`\`\`yaml
  ports:
  - appProtocol: http
    name: http
    port: 80
    protocol: TCP
    targetPort: http
    nodePort: 30080
  - appProtocol: https
    name: https
    port: 443
    protocol: TCP
    targetPort: https
    nodePort: 30443
# …
      nodeSelector:
        kubernetes.io/os: linux
        node-role.kubernetes.io/control-plane: ''
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
\`\`\`

**3. Chứng chỉ và Secret TLS**

\`\`\`bash
cd ~/drills/s29
openssl req -x509 -newkey rsa:2048 -nodes -days 365 -keyout tls.key -out tls.crt -subj '/CN=shop.local' -addext 'subjectAltName=DNS:shop.local'
openssl x509 -in tls.crt -noout -subject -ext subjectAltName
# subject=CN = shop.local
# X509v3 Subject Alternative Name:
#     DNS:shop.local
k create secret tls shop-tls --cert=tls.crt --key=tls.key
k get secret shop-tls
# NAME       TYPE                DATA   AGE
# shop-tls   kubernetes.io/tls   2      0s
\`\`\`

**4. Ingress shop** (\`~/shop/ingress.yaml\`)

\`\`\`bash
k create ingress shop --class=nginx --rule='shop.local/api*=gateway:8080,tls=shop-tls' --rule='shop.local/orders=order:8080' \\
  --annotation=nginx.ingress.kubernetes.io/ssl-redirect=false $do > ~/shop/ingress.yaml
\`\`\`

Sau khi bỏ \`status\` và xếp lại cho dễ đọc:

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
  namespace: shop
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "false"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - shop.local
    secretName: shop-tls
  rules:
  - host: shop.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: gateway
            port:
              number: 8080
      - path: /orders
        pathType: Exact
        backend:
          service:
            name: order
            port:
              number: 8080
\`\`\`

\`\`\`bash
k apply -f ~/shop/ingress.yaml
k get ingress shop
# NAME   CLASS   HOSTS        ADDRESS          PORTS     AGE
# shop   nginx   shop.local   192.168.252.35   80, 443   31s
\`\`\`

ADDRESS là IP của cka-cp, node chạy controller. \`/orders\` trỏ Service \`order\` (gateway không có \`/orders\`, chỉ có \`/api/orders\`).

**5. Gọi bằng tên shop.local**

\`\`\`bash
echo "192.168.252.35 shop.local" | sudo tee -a /etc/hosts /etc/cloud/templates/hosts.debian.tmpl
curl -s http://shop.local:30080/api/products | head -c 80; echo
curl -s -H 'Host: shop.local' http://192.168.252.36:30080/api/products | head -c 80; echo
\`\`\`

Trên Mac (không sửa \`/etc/hosts\` của Mac thì dùng \`--resolve\`):

\`\`\`bash
multipass transfer cka-cp:/home/ubuntu/drills/s29/tls.crt /tmp/shop.crt
curl --resolve shop.local:30443:192.168.252.36 --cacert /tmp/shop.crt https://shop.local:30443/api/products
curl --resolve shop.local:30080:192.168.252.36 http://shop.local:30080/orders
\`\`\`

**6. pathType**

\`\`\`bash
for p in /api/products /orders /orders/1 /api; do
  printf '%-14s http %s  https %s\\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' http://shop.local:30080$p)" \\
    "$(curl -s --cacert ~/drills/s29/tls.crt -o /dev/null -w '%{http_code}' https://shop.local:30443$p)"
done
# /api/products  http 200  https 200
# /orders        http 200  https 200
# /orders/1      http 404  https 404
# /api           http 404  https 404
echo PATH_EXACT_RESULT=404 >> ~/drills/s29/answers.env
echo PATH_EXACT_FROM=nginx >> ~/drills/s29/answers.env
\`\`\`

\`/orders/1\` không khớp \`/orders\` (Exact) cũng không khớp \`/api\`: controller tự trả trang 404 HTML của nginx, request không tới Pod nào. \`/api\` thì có khớp (Prefix) và tới gateway, 404 là của Spring (không có handler cho \`/api\`). Bỏ annotation \`ssl-redirect\`: \`curl -I http://shop.local:30080/api/products\` trả \`308 Permanent Redirect\`, \`Location: https://shop.local/api/products\` (cổng 443 mặc định, không phải 30443): sau NodePort, chuyển hướng tự động còn đưa client tới sai cổng.

**7. Tình huống hỏng: Ingress không có ingressClassName** (\`~/drills/s29/noclass.yaml\`)

\`\`\`yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop-noclass
  namespace: shop
spec:
  rules:
  - host: noclass.shop.local
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: gateway
            port:
              number: 8080
\`\`\`

\`\`\`bash
k apply -f ~/drills/s29/noclass.yaml
k get ingress shop-noclass
# NAME           CLASS    HOSTS                ADDRESS   PORTS   AGE
# shop-noclass   <none>   noclass.shop.local             80      15s
curl -s -o /dev/null -w '%{http_code}\\n' -H 'Host: noclass.shop.local' http://shop.local:30080/api/products
# 404
k -n ingress-nginx logs deploy/ingress-nginx-controller --since=1m | grep noclass | tail -1
# I1118 07:57:58.042448  7 store.go:439] "Ignoring ingress because of error while validating ingress class" ingress="shop/shop-noclass" error="ingress does not contain a valid IngressClass"
k delete ingress shop-noclass
\`\`\`

Không có IngressClass mặc định, controller chỉ nhận Ingress có \`ingressClassName: nginx\`. Sửa thật thì thêm \`spec.ingressClassName: nginx\` (hay \`k patch ingress shop-noclass --type=merge -p '{"spec":{"ingressClassName":"nginx"}}'\`).

Lời giải tự động: \`labs/cka/sessions/s29/apply.sh\` (sửa manifest bằng \`files/patch-ingress-nginx.py\` thay cho vim, chép \`files/ingress.yaml\`; chạy lại được).`,
    exam: {
      patterns: [
        "\"Tạo Ingress X ở namespace Y: host a.example.com, path /foo tới Service svc cổng 80\" — `k -n Y create ingress X --class=nginx --rule='a.example.com/foo*=svc:80' $do > x.yaml`, sửa nếu cần, apply. Đọc kỹ đề: Prefix hay Exact.",
        "\"Ingress đã tạo nhưng không truy cập được / không có ADDRESS\" — `k get ingressclass`, so `ingressClassName`; `k get endpointslice` của Service đích; log controller.",
        "\"Bật TLS cho Ingress bằng cert/key cho sẵn\" — `k create secret tls <tên> --cert=… --key=…` **cùng namespace** với Ingress, thêm `spec.tls: [{hosts: [...], secretName: <tên>}]`.",
        "\"Cài ingress controller rồi kiểm bằng curl\" — đề thường cho sẵn manifest/Helm; kiểm bằng `curl -H 'Host: …' http://<IP node>:<nodePort>/…`.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 3 phút: Ingress `catalog-direct` (class nginx) cho host `catalog.shop.local`, path `/products` kiểu Prefix → Service `catalog` cổng 8080. Kiểm bằng curl với header Host qua NodePort 30080, rồi xoá.",
          timeLimitMin: 3,
          solution: "```bash\nk create ingress catalog-direct --class=nginx --rule='catalog.shop.local/products*=catalog:8080'\ncurl -s -H 'Host: catalog.shop.local' http://shop.local:30080/products | head -c 60; echo\nk delete ingress catalog-direct\n```",
        },
        {
          text: "Trong 4 phút: tạo chứng chỉ tự ký cho `admin.shop.local`, Secret `admin-tls`, và Ingress `admin` (class nginx, `/api` Prefix → gateway:8080, tls với `admin-tls`). Chứng minh https trả đúng chứng chỉ đó.",
          timeLimitMin: 4,
          solution: "```bash\nopenssl req -x509 -newkey rsa:2048 -nodes -days 30 -keyout a.key -out a.crt -subj '/CN=admin.shop.local' -addext 'subjectAltName=DNS:admin.shop.local'\nk create secret tls admin-tls --cert=a.crt --key=a.key\nk create ingress admin --class=nginx --rule='admin.shop.local/api*=gateway:8080,tls=admin-tls'\ncurl --resolve admin.shop.local:30443:$(getent hosts shop.local | cut -d' ' -f1) --cacert a.crt https://admin.shop.local:30443/api/info\nk delete ingress admin; k delete secret admin-tls\n```\n`--cacert` chỉ qua khi controller phục vụ đúng `a.crt` (không phải chứng chỉ giả mặc định).",
        },
      ],
    },
    tips: [
      "`k create ingress … $do` nhanh hơn chép YAML từ tài liệu: `*` cuối path là Prefix, không có là Exact; `,tls=<secret>` thêm khối tls.",
      "Ingress không có ADDRESS gần như luôn là class: sai tên, thiếu, hay controller chưa chạy.",
      "Secret TLS phải cùng namespace với Ingress; controller không đọc Secret ở namespace khác.",
      "Kiểm https bằng `--cacert` (hay đọc `issuer` với `curl -kv`), không dừng ở `curl -k` ra 200.",
    ],
    outcome: {
      md: `shop có một cửa vào L7 dưới tên shop.local, cả http lẫn https, và bạn đã thấy Ingress thiếu class im lặng thế nào. Trên Mac:

\`\`\`bash
./labs/lab verify cka s29
\`\`\`

Verify tìm controller theo nhãn \`app.kubernetes.io/component=controller\` ở namespace \`ingress-nginx\` (cài bằng manifest hay Helm đều được): Available, Pod chạy trên cka-cp, Service NodePort 30080/30443. Nó so Ingress \`shop\` (class, host, hai path và pathType, backend, tls, ADDRESS) với cluster và với \`~/shop/\`, giải chứng chỉ trong \`shop-tls\` bằng openssl (SAN, khoá khớp, còn hạn), kiểm \`/etc/hosts\` và curl trên cka-cp, rồi **gọi từ chính máy Mac**: http \`/api/products\` và \`/orders\`, https \`/api/products\` với \`--cacert\` là chứng chỉ của \`shop-tls\`, đều qua \`--resolve shop.local:<cổng>:<IP cka-w1>\` (IP đọc từ API) nên không cần \`/etc/hosts\` của Mac. Ingress nháp không class phải đã xoá.`,
      verifyOutput: "lab: kiểm s29\n  (chờ apiserver, CoreDNS, postgres-0, ba Deployment và ingress-nginx, nếu đang khởi động: tối đa ~11 phút)\n  ✓ ingress-nginx: controller Available, chạy trên cka-cp; Service NodePort http 30080, https 30443\n  ✓ IngressClass nginx (controller k8s.io/ingress-nginx)\n  ✓ Ingress shop: class nginx, shop.local, /api Prefix → gateway:8080, /orders Exact → order:8080, tls shop-tls, có ADDRESS; YAML trong ~/shop/\n  ✓ Secret shop-tls: kubernetes.io/tls, SAN DNS:shop.local, khoá khớp chứng chỉ, còn hạn\n  ✓ cka-cp: shop.local trong /etc/hosts trỏ IP một node; curl http://shop.local:30080/api/products trả 200\n  ✓ Từ máy Mac: http://shop.local:30080/api/products (3 sản phẩm) và /orders trả 200 (--resolve tới IP cka-w1)\n  ✓ Từ máy Mac: https://shop.local:30443/api/products trả 200, chứng chỉ là shop-tls (--cacert, không -k)\n  ✓ answers.env: PATH_EXACT_RESULT=404; Ingress nháp không có ingressClassName đã xoá\n  → 8/8 đạt",
      projectDelta: "Mảnh \"Ingress\" của project: shop.local/api tới gateway, shop.local/orders tới order, TLS kết thúc ở ingress-nginx. Buổi sau dựng cùng đường đó bằng Gateway API và chia lưu lượng giữa hai phiên bản gateway.",
    },
    review: [
      { q: "Ingress `shop` có `/api` Prefix và `/orders` Exact. `/api/products`, `/apis`, `/orders/`, `/orders/1` đi đâu?", a: "`/api/products` khớp Prefix `/api` (theo phần tử path) → gateway. `/apis` không khớp (`apis` ≠ `api`), `/orders/` và `/orders/1` không khớp Exact `/orders`: cả ba nhận 404 của controller (default backend), không tới Pod nào." },
      { q: "Ingress tạo thành công nhưng `k get ingress` không có ADDRESS và mọi request trả 404. Nghi gì?", a: "Không controller nào nhận nó: thiếu `ingressClassName` (và không có IngressClass mặc định), sai tên class, hay controller không chạy. `k get ingressclass`, so `spec.controller` với controller đang chạy, xem log controller." },
      { q: "`curl -k https://shop.local:30443/api/products` trả 200. Vì sao chưa đủ để nói TLS đã đúng?", a: "`-k` bỏ qua kiểm chứng chỉ; Secret sai (không có, sai namespace, SAN không khớp) thì ingress-nginx vẫn phục vụ bằng \"Kubernetes Ingress Controller Fake Certificate\". `--cacert tls.crt` (hay đọc `issuer`) mới chứng minh đúng chứng chỉ của bạn được dùng." },
      {
        q: "Sau khi thêm `tls` vào Ingress, `curl http://shop.local:30080/api/products` trả 308. Vì sao, và sửa thế nào ở lab?",
        a: "ingress-nginx mặc định chuyển hướng http sang https cho host có TLS (`ssl-redirect: true`). `Location` là `https://shop.local/...` cổng 443, không phải NodePort 30443. Lab tắt bằng annotation `nginx.ingress.kubernetes.io/ssl-redirect: \"false\"`; sau một LoadBalancer thật ở cổng 443 thì chuyển hướng là điều nên giữ.",
      },
      {
        q: "Ứng dụng Spring Boot sau Ingress TLS tạo link `http://…` trong redirect. Vì sao, và trong Pod thì có xảy ra không?",
        a: "Controller gọi Pod bằng http và báo scheme gốc qua `X-Forwarded-Proto: https`; ứng dụng không đọc header thì nghĩ request là http. Spring Boot đọc khi `server.forward-headers-strategy` là `native` hay `framework`. Trong Pod, Boot nhận ra Kubernetes (`KUBERNETES_SERVICE_HOST`) và mặc định `native`, Tomcat tin proxy trong dải 10.0.0.0/8; ngoài Kubernetes mặc định là `none`, phải tự đặt.",
      },
    ],
  },
  {
    id: "s30",
    stage: "st5",
    title: "Gateway API",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-gateway"],
    requires: ["s29"],
    status: "published",
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
    foundation: null,
    mindset: `**Vì sao có Gateway API.** Ingress (s29) gói mọi thứ vào một object: cổng và chứng chỉ (việc của người vận hành cluster) nằm chung với path và backend (việc của đội ứng dụng), và mọi tính năng ngoài host/path (chia lưu lượng, rewrite, header, timeout) là annotation riêng của từng controller: \`nginx.ingress.kubernetes.io/…\` không có nghĩa gì với Traefik. Gateway API (dự án của SIG Network, CRD cài riêng, không có sẵn trong Kubernetes) tách theo vai trò và đưa các tính năng đó vào spec chung:

| Tài nguyên | Phạm vi | Ai sở hữu | Nói gì |
|---|---|---|---|
| \`GatewayClass\` | cluster | nhà cung cấp hạ tầng | controller nào xử lý (\`spec.controllerName\`), tham số (\`parametersRef\`) |
| \`Gateway\` | namespace | người vận hành cluster | listener: giao thức, cổng, hostname, TLS, Route ở namespace nào được gắn vào (\`allowedRoutes\`, mặc định \`Same\`) |
| \`HTTPRoute\` | namespace | đội ứng dụng | gắn vào Gateway nào (\`parentRefs\`), host, match (path, header, method), filter, \`backendRefs\` có \`weight\` |

So với Ingress: IngressClass ≈ GatewayClass, phần \`tls\`/cổng của controller ≈ Gateway, \`rules\` của Ingress ≈ HTTPRoute. \`PathPrefix\` của HTTPRoute khớp theo phần tử path như \`Prefix\` của Ingress; \`Exact\` giống nhau.

**Kênh và phiên bản.** Mỗi bản Gateway API phát hành hai bộ CRD: \`standard\` (chỉ trường GA và beta, chính là thứ đề thi hỏi: GatewayClass, Gateway, HTTPRoute ở \`v1\` từ bản v1.0) và \`experimental\` (thêm trường, tài nguyên alpha). Mỗi CRD mang annotation \`gateway.networking.k8s.io/bundle-version\` và \`…/channel\`. Implementation hỗ trợ một bản cụ thể: NGINX Gateway Fabric 2.8.1 ghi Gateway API **1.6.3**, Kubernetes 1.32+; bản Gateway API v1.7.0 (29/10/2026) đã có nhưng NGF chưa ghi hỗ trợ, nên lab ghim v1.6.3. CRD rất lớn, nên tài liệu của cả hai dự án cài bằng \`kubectl apply --server-side\`: apply thường (phía client) chép cả object vào annotation \`kubectl.kubernetes.io/last-applied-configuration\`, mà annotation có giới hạn 256 KB. CRD \`httproutes\` của Gateway API v1.6.3 khoảng 240 KB (còn lọt), CRD \`nginxproxies\` của NGF khoảng 350 KB: apply thường bị từ chối (đo: \`metadata.annotations: Too long: may not be more than 262144 bytes\`).

**NGINX Gateway Fabric chạy thế nào.** Control plane là Deployment \`nginx-gateway\` (namespace \`nginx-gateway\`): watch GatewayClass \`nginx\` và mọi thứ gắn vào nó. Mỗi \`Gateway\` được cấp một **data plane riêng**: Deployment và Service \`<gateway>-<class>\` (ở đây \`shop-gw-nginx\`) **trong namespace của Gateway**, nên Pod nginx của shop-gw tính vào ResourceQuota của \`shop\`. Control plane đẩy cấu hình xuống agent trong Pod nginx qua gRPC. Khuôn cho data plane là \`NginxProxy\` mà GatewayClass trỏ tới qua \`parametersRef\`: kiểu Service (bản manifest \`nodeport\` đặt \`NodePort\`), \`nodePorts\` (\`30280\` cho listener cổng 80), nodeSelector/toleration, tài nguyên. Manifest để \`externalTrafficPolicy: Local\`: chỉ node đang chạy Pod data plane trả lời NodePort (các node khác bỏ gói, khác ingress-nginx của s29). Lab đặt cả hai Pod NGF trên cka-cp, nên gọi bằng IP của cka-cp.

**Đọc trạng thái.** Mọi tài nguyên Gateway API báo kết quả bằng \`status.conditions\` theo cùng một mẫu (\`type\`, \`status\`, \`reason\`, \`message\`):

| Tài nguyên | Điều kiện | \`False\` thường do |
|---|---|---|
| GatewayClass | \`Accepted\` | không controller nào nhận \`controllerName\`, \`parametersRef\` hỏng |
| Gateway | \`Accepted\`, \`Programmed\` (và theo từng listener) | cổng/giao thức không hỗ trợ, data plane chưa nhận cấu hình |
| HTTPRoute, theo từng \`status.parents[]\` | \`Accepted\` | \`NotAllowedByListeners\`, \`NoMatchingListenerHostname\`, \`NoMatchingParent\` |
| | \`ResolvedRefs\` | \`BackendNotFound\` (Service không có), \`RefNotPermitted\` (backend ở namespace khác mà thiếu ReferenceGrant), \`InvalidKind\` |

Điều kiện của Route nằm **dưới từng parent**: một HTTPRoute có thể gắn vào nhiều Gateway và mỗi Gateway (controller của nó) báo riêng. Hệ quả hay gặp: \`parentRefs\` trỏ tên Gateway không tồn tại thì **không controller nào viết status**, \`status.parents\` rỗng, không có dòng \`Accepted=False\` nào để đọc: thiếu điều kiện chính là tín hiệu.

**Chia lưu lượng theo weight.** \`backendRefs\` có \`weight\` thì mỗi **request** đi tới backend với xác suất \`weight / tổng weight\`: 90/10 nghĩa là khoảng 10% request tới \`gateway-v1\`, **không phụ thuộc số Pod** (gateway 2 Pod, gateway-v1 1 Pod, vẫn 90/10 chứ không phải 67/33). So với s14: rolling update đổi tỷ lệ theo số Pod mới/cũ và không dừng ở giữa được, Service chia theo kết nối (kube-proxy). Ở đây canary điều khiển bằng con số trong YAML, tăng dần 10 → 50 → 100 rồi xoá backend cũ. 100 request với xác suất 0,1: kỳ vọng 10, độ lệch chuẩn 3; khoảng 3–20 chứa hơn 99% kết quả, nên verify chấm \`V1_HITS\` trong khoảng đó chứ không đòi đúng 10.

**Java và canary.** Hai phiên bản gateway chạy song song nghĩa là cùng một người dùng có thể đi qua 2.0 rồi 1.0 ở hai request liền nhau: ứng dụng phải chịu được điều đó (API tương thích ngược, không giữ phiên trong bộ nhớ JVM; Spring Session lưu ra ngoài nếu cần). Lỗi của bản canary hiện ra theo tỷ lệ request (10% lỗi 5xx) chứ không theo Pod, nên đọc metric theo \`version\` (Micrometer tag) mới thấy.`,
    refs: [
      { label: "Bài lộ trình CKA: Gateway API — GatewayClass, Gateway, HTTPRoute", href: "#/roadmap/cka/cka-w6-5" },
      { label: "CKA Study Guide, chương 19 — Gateway API", href: "#/docs/ckabook-19" },
      { label: "kubernetes.io: Gateway API (Concepts › Services, Load Balancing, and Networking)", href: "https://kubernetes.io/docs/concepts/services-networking/gateway/" },
      { label: "Gateway API: HTTP traffic splitting (weight)", href: "https://gateway-api.sigs.k8s.io/guides/traffic-splitting/" },
      { label: "Gateway API: Versioning (standard và experimental channel)", href: "https://gateway-api.sigs.k8s.io/concepts/versioning/" },
      { label: "NGINX Gateway Fabric: Install with manifests", href: "https://docs.nginx.com/nginx-gateway-fabric/install/manifests/" },
      { label: "Bài thực hành s14 — rollout và rollback", href: "#/practice/cka/s14" },
    ],
    stateIn: "Đầu ra s29: ingress-nginx (NodePort 30080/30443) và Ingress shop phục vụ shop.local từ máy Mac; Service gateway, catalog, order cổng http 8080; chưa có CRD Gateway API. `./labs/lab begin cka s30` kiểm đầu vào bằng verify của s29, tạo ~/drills/s30 và xoá answers.env cũ.",
    stateOut: "CRD Gateway API v1.6.3 (standard); NGINX Gateway Fabric v2.8.1 (control plane ở nginx-gateway và data plane shop-gw-nginx ở shop, cả hai trên cka-cp; NodePort 30280, externalTrafficPolicy Local), GatewayClass nginx; Gateway shop-gw (HTTP :80 shop.local) Programmed trong ~/shop/shop-gw.yaml; Deployment + Service gateway-v1 (1 replica, shop/gateway:1.0) trong ~/shop/gateway-v1.yaml; HTTPRoute shop (/api → gateway 90, gateway-v1 10) trong ~/shop/httproute.yaml; Ingress của s29 vẫn phục vụ; ~/drills/s30/answers.env.",
    tasks: [
      {
        id: "t1",
        text: "`./labs/lab begin cka s30`. Trên cka-cp đo `free -m`. CRD Gateway API kênh standard đã ghim: `kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.3/standard-install.yaml`. `k get crd | grep gateway.networking`, `k api-resources --api-group=gateway.networking.k8s.io`, `k get crd httproutes.gateway.networking.k8s.io -o jsonpath='{.metadata.annotations}'` (bản nào, kênh nào?), `k explain httproute.spec.rules.backendRefs`.",
      },
      {
        id: "t2",
        text: "NGINX Gateway Fabric v2.8.1: CRD của nó `kubectl apply --server-side -f https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.8.1/deploy/crds.yaml`, rồi tải `https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.8.1/deploy/nodeport/deploy.yaml` vào `~/drills/s30/ngf-deploy.yaml`. Sửa trước khi apply: Deployment `nginx-gateway` thêm nodeSelector + toleration của control plane (như s29); NginxProxy `nginx-gateway-proxy-config` thêm `service.nodePorts: [{port: 30280, listenerPort: 80}]`, `deployment.pod` (cùng nodeSelector + toleration) và `deployment.container.resources` (requests 50m/64Mi, limits memory 128Mi: data plane sẽ nằm trong namespace shop có quota). Apply, `k -n nginx-gateway rollout status deploy/nginx-gateway`, `k get gatewayclass`, `k describe gatewayclass nginx` (controllerName, parametersRef, Conditions).",
      },
      {
        id: "t3",
        text: "Gateway: `~/shop/shop-gw.yaml` (Gateway `shop-gw`, `gatewayClassName: nginx`, listener `http`: HTTP, cổng 80, hostname `shop.local`). Apply, `k get gateway shop-gw` (ADDRESS, PROGRAMMED), `k describe gateway shop-gw` (điều kiện của Gateway và của listener, `Attached Routes`). Ai tạo `k get deploy,svc,pod -l gateway.networking.k8s.io/gateway-name=shop-gw -o wide`, ở namespace nào, Pod ở node nào? `k describe quota` có đổi không?",
      },
      {
        id: "t4",
        text: "HTTPRoute tương đương path `/api` của s29 (đọc lại `~/shop/ingress.yaml`): `~/shop/httproute.yaml`, HTTPRoute `shop`, `parentRefs: [{name: shop-gw}]`, `hostnames: [shop.local]`, một rule `PathPrefix /api` → `gateway:8080`. Apply, `k get httproute`, `k get httproute shop -o jsonpath='{.status.parents[0].conditions}'`. Trên **Mac**: `curl --resolve shop.local:30280:<IP cka-cp> http://shop.local:30280/api/products` và `/api/info`. Thử cùng lệnh với IP của cka-w1: vì sao không trả lời?",
      },
      {
        id: "t5",
        text: "Bản 1.0 chạy song song: `cp ~/shop/gateway.yaml ~/shop/gateway-v1.yaml`, đổi tên và nhãn thành `gateway-v1` (metadata, selector, template), `replicas: 1`; đổi image bằng `k set image --local -f ~/shop/gateway-v1.yaml gateway=shop/gateway:1.0 -o yaml` (ghi đè tệp). Thêm Service `gateway-v1` (ClusterIP, cổng `http` 8080 → targetPort `http`, selector `app: gateway-v1`) vào cùng tệp sau `---`. Apply, `k rollout status deploy/gateway-v1`. Đo `free -m` trên hai worker và `k describe quota`. Vì sao nhãn của gateway-v1 không được là `app: gateway`?",
      },
      {
        id: "t6",
        text: "Chia 90/10: trong `~/shop/httproute.yaml` cho rule `/api` hai `backendRefs`: `gateway` cổng 8080 `weight: 90` và `gateway-v1` cổng 8080 `weight: 10`. Apply, kiểm `Accepted`/`ResolvedRefs`. Trên Mac gọi 100 lần: `for i in $(seq 100); do curl -s --noproxy '*' --max-time 5 --resolve shop.local:30280:<IP cka-cp> http://shop.local:30280/api/info; echo; done | grep -c '\"version\":\"1.0\"'`. Ghi `V1_HITS=<số đếm được>` vào `~/drills/s30/answers.env` trên cka-cp. Chạy lại vòng lặp: số có giống lần trước không?",
      },
      {
        id: "t7",
        text: "Tình huống hỏng: `~/drills/s30/route-draft.yaml`, HTTPRoute `shop-draft` (host `shop.local`, `PathPrefix /v2` → Service `gateway-v2` cổng 8080) với `parentRefs: [{name: shop-gateway}]` (sai tên). Apply, `k get httproute shop-draft -o yaml | sed -n '/^status/,$p'`: có điều kiện `Accepted` nào không? Sửa `parentRefs` thành `shop-gw`, apply lại, đọc `k get httproute shop-draft -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}{\"\\n\"}{end}'`. Ghi `ROUTE_BAD_REASON=<reason của ResolvedRefs>`. `curl … http://shop.local:30280/v2/x` trả gì? Xoá `shop-draft`. Trên Mac: `./labs/lab verify cka s30` phải đạt 8/8.",
      },
    ],
    hints: [
      "`kubectl apply -f …/crds.yaml` của NGF (không `--server-side`) báo `The CustomResourceDefinition \"nginxproxies.gateway.nginx.org\" is invalid: metadata.annotations: Too long: may not be more than 262144 bytes` (đo): apply phía client lưu cả object vào annotation `last-applied-configuration`. Dùng `--server-side`.",
      "GatewayClass `nginx` không `Accepted`: control plane chưa chạy (`k -n nginx-gateway get pod`), hay thiếu CRD của NGF (NginxProxy, NginxGateway) nên Pod lỗi lúc khởi động: đọc `k -n nginx-gateway logs deploy/nginx-gateway`.",
      "Pod data plane `shop-gw-nginx-…` không tạo được, `k get rs -l gateway.networking.k8s.io/gateway-name=shop-gw` báo `exceeded quota`: namespace shop có ResourceQuota; NginxProxy phải có `resources` (hay LimitRange điền mặc định). Pod `Pending` với `untolerated taint`: thiếu toleration trong `deployment.pod` của NginxProxy.",
      "`nodePorts` trong NginxProxy là danh sách `{port, listenerPort}`: `listenerPort` phải khớp `port` của một listener trong Gateway (80), không khớp thì NGF bỏ qua và Kubernetes cấp cổng ngẫu nhiên.",
      "`curl` từ Mac tới IP của cka-w1 cổng 30280 treo: Service data plane có `externalTrafficPolicy: Local` (manifest `nodeport` đặt sẵn) nên chỉ node có Pod data plane (cka-cp) nhận gói; các node khác không chuyển tiếp. `k -n shop get svc shop-gw-nginx -o jsonpath='{.spec.externalTrafficPolicy}'`.",
      "`V1_HITS` không phải 10 đúng: mỗi request rơi vào gateway-v1 với xác suất 10%, 100 lần ra 5–15 là bình thường. Ra 0: rule chưa có `gateway-v1`, hay `ResolvedRefs=False` (Service `gateway-v1` sai tên/cổng). Ra khoảng 40: nhãn của gateway-v1 trùng `app: gateway` nên Service `gateway` cũng chọn Pod 1.0 (90% chia cho ba Pod, cộng 10% của gateway-v1).",
      "Route không có `status` gì sau khi apply: không Gateway nào nhận nó. So `parentRefs[].name` (và `namespace`, `sectionName` nếu có) với `k get gateway -A`.",
    ],
    solution: `Output là của máy soạn bài; IP và tên Pod sẽ khác. Context đã ở namespace shop. IP: cka-cp \`192.168.252.35\`, cka-w1 \`192.168.252.36\`.

**1. CRD Gateway API v1.6.3, kênh standard**

\`\`\`bash
free -m | awk '/Mem:/{print $7}'          # 1938 (MB available trên cka-cp trước khi cài)
mkdir -p ~/drills/s30 && cd ~/drills/s30
kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.6.3/standard-install.yaml
k get crd -o 'custom-columns=NAME:.metadata.name,VERSION:.metadata.annotations.gateway\\.networking\\.k8s\\.io/bundle-version,CHANNEL:.metadata.annotations.gateway\\.networking\\.k8s\\.io/channel' | grep -E 'NAME|gateway.networking'
# NAME                                           VERSION   CHANNEL
# backendtlspolicies.gateway.networking.k8s.io   v1.6.3    standard
# gatewayclasses.gateway.networking.k8s.io       v1.6.3    standard
# gateways.gateway.networking.k8s.io             v1.6.3    standard
# grpcroutes.gateway.networking.k8s.io           v1.6.3    standard
# httproutes.gateway.networking.k8s.io           v1.6.3    standard
# listenersets.gateway.networking.k8s.io         v1.6.3    standard
# referencegrants.gateway.networking.k8s.io      v1.6.3    standard
# tcproutes.gateway.networking.k8s.io            v1.6.3    standard
# tlsroutes.gateway.networking.k8s.io            v1.6.3    standard
# udproutes.gateway.networking.k8s.io            v1.6.3    standard
\`\`\`

**2. NGINX Gateway Fabric v2.8.1**

\`\`\`bash
kubectl apply --server-side -f https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.8.1/deploy/crds.yaml
curl -fsSLo ngf-deploy.yaml https://raw.githubusercontent.com/nginx/nginx-gateway-fabric/v2.8.1/deploy/nodeport/deploy.yaml
vim ngf-deploy.yaml                         # các phần bên dưới
k apply -f ngf-deploy.yaml
k -n nginx-gateway rollout status deploy/nginx-gateway
k -n nginx-gateway get pod -o wide
# nginx-gateway-7fb4f695f5-6zmrh       1/1   Running     0   45s   10.244.160.45   cka-cp
# nginx-gateway-cert-generator-f9fgc   0/1   Completed   0   45s   10.244.160.44   cka-cp
k get gatewayclass
# NAME    CONTROLLER                                   ACCEPTED   AGE
# nginx   gateway.nginx.org/nginx-gateway-controller   True       45s
k get gatewayclass nginx -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}{"\\n"}{end}'
# Accepted=True Accepted
# SupportedVersion=True SupportedVersion
# ResolvedRefs=True ResolvedRefs
\`\`\`

Deployment \`nginx-gateway\` (dưới \`spec.template.spec\`, như s29):

\`\`\`yaml
      nodeSelector:
        node-role.kubernetes.io/control-plane: ''
      tolerations:
      - key: node-role.kubernetes.io/control-plane
        operator: Exists
        effect: NoSchedule
\`\`\`

NginxProxy sau khi sửa (khuôn cho data plane của mọi Gateway thuộc class \`nginx\`):

\`\`\`yaml
apiVersion: gateway.nginx.org/v1alpha2
kind: NginxProxy
metadata:
  name: nginx-gateway-proxy-config
  namespace: nginx-gateway
spec:
  kubernetes:
    deployment:
      container:
        image:
          pullPolicy: IfNotPresent
          repository: ghcr.io/nginx/nginx-gateway-fabric/nginx
          tag: 2.8.1
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
          limits:
            memory: 128Mi
      replicas: 1
      pod:
        nodeSelector:
          node-role.kubernetes.io/control-plane: ''
        tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
    service:
      externalTrafficPolicy: Local
      type: NodePort
      nodePorts:
      - port: 30280
        listenerPort: 80
\`\`\`

**3. Gateway shop-gw** (\`~/shop/shop-gw.yaml\`)

\`\`\`yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: shop-gw
  namespace: shop
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    protocol: HTTP
    port: 80
    hostname: shop.local
\`\`\`

\`\`\`bash
k apply -f ~/shop/shop-gw.yaml
k get gateway shop-gw
# NAME      CLASS   ADDRESS        PROGRAMMED   AGE
# shop-gw   nginx   10.111.5.181   True         13m
k get deploy,svc,pod -l gateway.networking.k8s.io/gateway-name=shop-gw -o wide
# deployment.apps/shop-gw-nginx   1/1   1   1   13m   nginx   ghcr.io/nginx/nginx-gateway-fabric/nginx:2.8.1
# service/shop-gw-nginx   NodePort   10.111.5.181   <none>   80:30280/TCP   13m
# pod/shop-gw-nginx-5d5b66d846-hgcws   1/1   Running   0   13m   10.244.160.46   cka-cp
k get gateway shop-gw -o jsonpath='{range .status.listeners[*].conditions[*]}{.type}={.status} {.reason}{"\\n"}{end}'
# Programmed=True Programmed
# Accepted=True Accepted
# ResolvedRefs=True ResolvedRefs
# Conflicted=False NoConflicts
\`\`\`

ADDRESS là ClusterIP của Service data plane. Data plane \`shop-gw-nginx\` do control plane tạo **trong namespace shop**: Pod của nó tính vào quota của shop.

**4–6. gateway-v1 và HTTPRoute chia 90/10**

\`\`\`bash
cp ~/shop/gateway.yaml ~/shop/gateway-v1.yaml
vim ~/shop/gateway-v1.yaml                  # tên, nhãn, selector → gateway-v1; replicas: 1
k set image --local -f ~/shop/gateway-v1.yaml gateway=shop/gateway:1.0 -o yaml > /tmp/v1.yaml && mv /tmp/v1.yaml ~/shop/gateway-v1.yaml
vim ~/shop/gateway-v1.yaml                  # thêm --- và Service gateway-v1
\`\`\`

\`~/shop/gateway-v1.yaml\` (\`set image --local\` in lại tệp với khoá xếp theo bảng chữ cái và thêm \`status: {}\`; bản dưới đã xếp lại cho dễ đọc và bỏ \`status\`):

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  labels:
    app: gateway-v1
  name: gateway-v1
  namespace: shop
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gateway-v1
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    metadata:
      labels:
        app: gateway-v1
    spec:
      priorityClassName: shop-critical
      terminationGracePeriodSeconds: 45
      initContainers:
      - name: wait-catalog
        image: busybox:1.37
        command:
        - sh
        - -c
        - until wget -q -T 2 -O /dev/null http://catalog:8080/actuator/health/readiness; do echo chờ catalog; sleep 2; done
        resources:
          requests:
            cpu: 10m
            memory: 16Mi
          limits:
            memory: 32Mi
      containers:
      - image: shop/gateway:1.0
        name: gateway
        ports:
        - name: http
          containerPort: 8080
          protocol: TCP
        env:
        - name: JAVA_OPTS
          value: -XX:MaxRAMPercentage=50
        envFrom:
        - configMapRef:
            name: shop-config
        volumeMounts:
        - name: app-config
          mountPath: /config
          readOnly: true
        startupProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 5
          failureThreshold: 30
        livenessProbe:
          httpGet:
            path: /actuator/health/liveness
            port: 8080
          periodSeconds: 10
          timeoutSeconds: 3
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /actuator/health/readiness
            port: 8080
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        lifecycle:
          preStop:
            exec:
              command:
              - sleep
              - '10'
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            memory: 384Mi
      volumes:
      - name: app-config
        configMap:
          name: gateway-files
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: gateway-v1
  name: gateway-v1
  namespace: shop
spec:
  type: ClusterIP
  selector:
    app: gateway-v1
  ports:
  - name: http
    port: 8080
    targetPort: http
    protocol: TCP
\`\`\`

\`~/shop/httproute.yaml\` (bản cuối; ở t4 rule chỉ có một backend \`gateway\`):

\`\`\`yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop
  namespace: shop
spec:
  parentRefs:
  - name: shop-gw
  hostnames:
  - shop.local
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: gateway
      port: 8080
      weight: 90
    - name: gateway-v1
      port: 8080
      weight: 10
\`\`\`

\`\`\`bash
k apply -f ~/shop/gateway-v1.yaml && k rollout status deploy/gateway-v1
k apply -f ~/shop/httproute.yaml
k get httproute shop -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}{"\\n"}{end}'
# Accepted=True Accepted
# ResolvedRefs=True ResolvedRefs
\`\`\`

Trên Mac (\`--resolve\` thay cho \`/etc/hosts\`; cka-cp là node chạy data plane):

\`\`\`bash
curl --resolve shop.local:30280:192.168.252.35 http://shop.local:30280/api/products
for i in $(seq 100); do curl -s --noproxy '*' --max-time 5 --resolve shop.local:30280:192.168.252.35 http://shop.local:30280/api/info; echo; done | grep -c '"version":"1.0"'
# 13          (lần sau 9: mỗi request độc lập, xác suất 10%)
curl -s -o /dev/null --max-time 4 -w '%{http_code}\\n' --resolve shop.local:30280:192.168.252.36 http://shop.local:30280/api/products
# 000         (cka-w1 không có Pod data plane, externalTrafficPolicy: Local)
\`\`\`

Trên cka-cp: \`echo V1_HITS=13 >> ~/drills/s30/answers.env\`.

Bộ nhớ (đo): cka-cp available 1938 → 1500 MB sau CRD, NGF và data plane (\`kubectl top\`: \`kube-apiserver\` 693Mi lúc đo, sau khi thêm 24 CRD; Pod \`nginx-gateway\` 27Mi, \`shop-gw-nginx\` 25Mi); gateway-v1 lên cka-w2 (requests 256Mi), cka-w2 available 1067 → 890 MB, cka-w1 989 MB. Thêm Pod catalog thứ ba (HPA max) vẫn xếp được và Ready trên cka-w1 (931 MB còn lại), nên trạng thái cuối giữ gateway-v1 và 90/10.

**7. Tình huống hỏng: parentRefs sai tên, rồi backend sai tên** (\`~/drills/s30/route-draft.yaml\`, bản đã sửa parentRefs)

\`\`\`yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: shop-draft
  namespace: shop
spec:
  parentRefs:
  - name: shop-gw
  hostnames:
  - shop.local
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v2
    backendRefs:
    - name: gateway-v2
      port: 8080
\`\`\`

\`\`\`bash
sed 's/name: shop-gw$/name: shop-gateway/' ~/drills/s30/route-draft.yaml | k apply -f -
k get httproute shop-draft -o yaml | sed -n '/^status/,$p'
#             (không in gì: không Gateway nào nhận Route này, không controller nào viết status)
k apply -f ~/drills/s30/route-draft.yaml
k get httproute shop-draft -o jsonpath='{range .status.parents[*].conditions[*]}{.type}={.status} {.reason}: {.message}{"\\n"}{end}'
# Accepted=True Accepted: The Route is accepted
# ResolvedRefs=False BackendNotFound: spec.rules[0].backendRefs[0].name: Not found: "gateway-v2"
curl -s -o /dev/null -w '%{http_code}\\n' http://shop.local:30280/v2/x
# 500
echo ROUTE_BAD_REASON=BackendNotFound >> ~/drills/s30/answers.env
k delete httproute shop-draft
\`\`\`

Route được nhận (\`Accepted=True\`) nhưng backend không có: NGF vẫn cài rule và trả 500 cho request khớp \`/v2\`, các path khác không ảnh hưởng. Ở bản nháp đầu tiên của bài soạn, host \`draft.shop.local\` cho \`Accepted=False NoMatchingListenerHostname\`: listener chỉ nhận \`shop.local\`.

Lời giải tự động: \`labs/cka/sessions/s30/apply.sh\` (sửa manifest bằng \`files/patch-ngf.py\` thay cho vim, chép các tệp trong \`files/\`, gọi 100 lần từ Mac; chạy lại được, CRD chỉ apply khi chưa đúng bản).`,
    exam: {
      patterns: [
        "\"Tạo HTTPRoute X gắn vào Gateway Y có sẵn: host a.example.com, path /api tới Service svc cổng 8080\" — viết từ trang Gateway API trên kubernetes.io (không có `kubectl create httproute`): `parentRefs`, `hostnames`, `rules[].matches[].path`, `backendRefs`.",
        "\"Chia 80/20 giữa svc-v1 và svc-v2\" — hai phần tử trong `backendRefs` với `weight: 80` và `weight: 20`; kiểm `ResolvedRefs=True`.",
        "\"HTTPRoute không hoạt động, tìm lỗi\" — `k describe httproute`: status rỗng → `parentRefs` sai; `Accepted=False` → listener/hostname/namespace; `ResolvedRefs=False` → backend (tên, cổng, namespace + ReferenceGrant).",
        "\"Chuyển Ingress sang Gateway API\" — host → `hostnames`, `Prefix` → `PathPrefix`, backend `service.name/port.number` → `backendRefs[].name/port`; TLS chuyển sang listener HTTPS của Gateway.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trong 4 phút: HTTPRoute `catalog-direct` gắn vào `shop-gw`, host `shop.local`, path `/products` kiểu PathPrefix → Service `catalog` cổng 8080. Kiểm `Accepted` và gọi thử qua NodePort 30280, rồi xoá.",
          timeLimitMin: 4,
          solution: "```yaml\napiVersion: gateway.networking.k8s.io/v1\nkind: HTTPRoute\nmetadata:\n  name: catalog-direct\nspec:\n  parentRefs:\n  - name: shop-gw\n  hostnames:\n  - shop.local\n  rules:\n  - matches:\n    - path:\n        type: PathPrefix\n        value: /products\n    backendRefs:\n    - name: catalog\n      port: 8080\n```\n```bash\nk apply -f catalog-direct.yaml\nk get httproute catalog-direct -o jsonpath='{.status.parents[0].conditions[*].type}'\ncurl -s http://shop.local:30280/products | head -c 60; echo\nk delete httproute catalog-direct\n```",
        },
        {
          text: "Trong 2 phút: đưa canary của shop lên 50/50, kiểm bằng 20 request, rồi trả về 90/10.",
          timeLimitMin: 2,
          solution: "```bash\nk patch httproute shop --type=json -p '[{\"op\":\"replace\",\"path\":\"/spec/rules/0/backendRefs/0/weight\",\"value\":50},{\"op\":\"replace\",\"path\":\"/spec/rules/0/backendRefs/1/weight\",\"value\":50}]'\nfor i in $(seq 20); do curl -s --max-time 5 http://shop.local:30280/api/info; echo; done | sort | uniq -c\nk apply -f ~/shop/httproute.yaml\n```\nThứ tự `backendRefs` trong cluster là thứ tự trong tệp (gateway trước, gateway-v1 sau). `k apply` tệp gốc trả về 90/10 và giữ `~/shop/` khớp cluster.",
        },
      ],
    },
    tips: [
      "Trang Gateway API của kubernetes.io có ví dụ Gateway và HTTPRoute chép được: tìm \"Gateway API\" trong ô tìm kiếm, mục Concepts › Services, Load Balancing, and Networking.",
      "Đọc điều kiện của Route ở `status.parents[]`, không phải `status.conditions`: mỗi Gateway cha báo riêng.",
      "Không có điều kiện nào trên Route nghĩa là không Gateway nào nhận nó: kiểm `parentRefs` trước.",
      "`weight` là tỷ lệ request, không phải số Pod; `weight: 0` giữ backend trong YAML mà không gửi request nào.",
    ],
    outcome: {
      md: `shop có cửa thứ hai bằng Gateway API, và 10% request tới gateway đi vào bản 1.0 chạy song song. Trên Mac:

\`\`\`bash
./labs/lab verify cka s30
\`\`\`

Verify kiểm ba CRD (\`gatewayclasses\`, \`gateways\`, \`httproutes\`) phục vụ \`v1\`, kênh \`standard\`, bản v1.6.3; control plane NGF trên cka-cp và GatewayClass \`nginx\` \`Accepted\`; Gateway \`shop-gw\` (listener HTTP :80 \`shop.local\`) \`Programmed\` với Service data plane NodePort 30280; Deployment \`gateway-v1\` (1 replica, \`shop/gateway:1.0\`, probe và tài nguyên giống \`gateway\`, nhãn không lọt vào Service \`gateway\`) và Service của nó; HTTPRoute \`shop\` (parent, host, \`PathPrefix /api\`, hai backend 90/10) với \`Accepted\` và \`ResolvedRefs\` từ \`shop-gw\`, YAML trong \`~/shop/\` khớp. Rồi **gọi từ chính máy Mac** cả Gateway (IP node chạy data plane, đọc từ API) lẫn Ingress của s29, đều qua \`--resolve\`. Tỷ lệ chia không bền và không đếm lại được lúc chấm, nên chấm qua \`V1_HITS\` (3–20); \`ROUTE_BAD_REASON\` phải là reason của \`ResolvedRefs\` khi backend sai tên, Route nháp phải đã xoá.`,
      verifyOutput: "lab: kiểm s30\n  (chờ apiserver, CoreDNS, postgres-0, Deployment của shop, ingress-nginx và NGF, nếu đang khởi động: tối đa ~11 phút)\n  ✓ CRD Gateway API v1.6.3 kênh standard: gatewayclasses, gateways, httproutes phục vụ v1\n  ✓ NGINX Gateway Fabric: control plane Available trên cka-cp; GatewayClass nginx Accepted=True\n  ✓ Gateway shop-gw: class nginx, listener HTTP :80 shop.local, Programmed=True; data plane NodePort 30280; YAML trong ~/shop/\n  ✓ gateway-v1: 1 replica shop/gateway:1.0, probe và tài nguyên như gateway, Available; Service gateway-v1 http 8080; ~/shop/\n  ✓ HTTPRoute shop: shop-gw, shop.local, PathPrefix /api → gateway 90 / gateway-v1 10; Accepted, ResolvedRefs; ~/shop/ khớp\n  ✓ Từ máy Mac: shop.local:30280/api/products qua Gateway và :30080 qua Ingress s29 đều trả 200 với 3 sản phẩm\n  ✓ answers.env: V1_HITS (số lần /api/info trả version 1.0 trên 100 request) trong 3–20\n  ✓ answers.env: ROUTE_BAD_REASON là lý do của ResolvedRefs khi backend sai tên; HTTPRoute nháp đã xoá\n  → 8/8 đạt",
      projectDelta: "Mảnh \"Gateway API\" của project: Gateway shop-gw và HTTPRoute shop chạy cạnh Ingress, canary 90/10 giữa gateway 2.0 và 1.0 điều khiển bằng weight. Buổi sau khoá namespace shop bằng NetworkPolicy mà vẫn giữ cả hai cửa vào.",
    },
    review: [
      {
        q: "Ba tài nguyên GatewayClass, Gateway, HTTPRoute: ai sở hữu cái nào, và cái nào tương ứng với phần nào của Ingress?",
        a: "GatewayClass (cluster-scoped, nhà cung cấp hạ tầng) chọn controller, như IngressClass. Gateway (người vận hành) giữ listener: cổng, giao thức, hostname, TLS, namespace nào được gắn Route; ở Ingress đó là Service và cấu hình của controller cộng khối `tls`. HTTPRoute (đội ứng dụng) giữ host, match, backend: phần `rules` của Ingress.",
      },
      {
        q: "HTTPRoute vừa apply không có `status` gì. Khác gì với `Accepted=False`?",
        a: "Không có status nghĩa là không controller nào coi Route là của mình: `parentRefs` trỏ Gateway không tồn tại (sai tên, sai namespace) hay Gateway thuộc class không ai xử lý. `Accepted=False` nghĩa là Gateway có thấy Route nhưng từ chối: hostname không khớp listener (`NoMatchingListenerHostname`), namespace không được phép (`NotAllowedByListeners`).",
      },
      { q: "`backendRefs` 90/10 giữa `gateway` (2 Pod) và `gateway-v1` (1 Pod). Bao nhiêu phần trăm request tới bản 1.0, và khác rolling update ở s14 thế nào?", a: "Khoảng 10%: weight là tỷ lệ request, không phụ thuộc số Pod. Rolling update đổi tỷ lệ theo số Pod mới/cũ trong cùng một Service, không dừng ở giữa có chủ ý, và kube-proxy chia theo kết nối; canary bằng weight dừng ở tỷ lệ bạn chọn và tăng dần được." },
      { q: "Route `Accepted=True` nhưng `ResolvedRefs=False` với reason `BackendNotFound`. Request khớp rule đó nhận gì?", a: "NGF vẫn cài rule nhưng không có upstream: request khớp nhận 500 (đo trên lab với `/v2`). Các rule khác của cùng Route và các Route khác không bị ảnh hưởng. Sửa tên/cổng Service, hay thêm ReferenceGrant nếu backend ở namespace khác (`RefNotPermitted`)." },
      { q: "Gọi NodePort 30280 qua IP của cka-w1 thì treo, qua IP của cka-cp thì chạy. Vì sao Ingress của s29 không bị như vậy?", a: "Service data plane của NGF có `externalTrafficPolicy: Local`: node chỉ nhận gói NodePort khi chính nó có Pod đích (giữ IP nguồn của client), Pod data plane ở cka-cp. Service của ingress-nginx dùng mặc định `Cluster`: node nào cũng DNAT sang Pod ở node khác (và SNAT, mất IP client)." },
    ],
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
