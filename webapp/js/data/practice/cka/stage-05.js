// Chặng 5 — Networking.
// Buổi khung: đủ trường cấu trúc (check-data PR7); nội dung đầy đủ ở đợt sau.

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

**Calico trên lab: IPIP, mỗi node một khối /26.** IPPool \`default-ipv4-ippool\` (\`10.244.0.0/16\`, \`ipipMode: Always\`, \`vxlanMode: Never\`, \`blockSize: 26\`) là chế độ mặc định của manifest \`calico.yaml\` v3.33.0. Calico IPAM cắt pool thành khối 64 địa chỉ và gán khối cho node (\`k get blockaffinities.crd.projectcalico.org\`): cka-w2 giữ \`10.244.62.128/26\`, cka-w1 \`10.244.95.128/26\`, cka-cp \`10.244.160.0/26\`. Mỗi node biết khối của node khác nhờ BIRD (BGP, \`calico_backend: bird\` trong ConfigMap \`calico-config\`) chạy trong Pod \`calico-node\`; Felix (cũng trong \`calico-node\`) viết route \`/32\` cho Pod cục bộ và route \`blackhole\` cho phần còn trống của khối mình. Interface tunnel tuỳ chế độ: IPIP là \`tunl0\` (MTU 1480 = 1500 − 20 byte header IP ngoài), VXLAN là \`vxlan.calico\` (MTU 1450), không bọc (\`Never\`/\`Never\`, chỉ dùng được khi mạng giữa các node chịu định tuyến dải Pod) thì không có tunnel. \`tcpdump\` trên \`tunl0\` thấy gói **bên trong** (IP Pod), trên \`enp0s1\` thấy gói **bên ngoài** \`IP 192.168.252.36 > 192.168.252.37: IP 10.244.95.183.36458 > 10.244.62.139.5432\`.

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

Pod của cka-w1 (\`10.244.95.128/26\`) đi qua \`tunl0\` tới \`192.168.252.36\`; \`proto 80\` là route do BIRD học qua BGP.

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

\`eth0@if9\` ↔ ifindex 9 trên node là \`cali599a3c2b8b4\`, và nó trỏ ngược \`@if3\` (ifindex của \`eth0\` trong Pod). IP \`/32\`: Pod không có "mạng con" nào, mọi thứ đi qua \`169.254.1.1\`. \`k exec … -- ip addr\` báo \`executable file not found\`: image Temurin JRE không có \`iproute2\`.

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
  {
    id: "s27",
    stage: "st5",
    title: "Service ClusterIP, NodePort, LoadBalancer, Endpoints, kube-proxy",
    durationMin: 90,
    domain: "networking",
    competencies: ["nw-svc"],
    requires: ["s26"],
    status: "skeleton",
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
    stateIn: "Đầu ra s26.",
    stateOut: "Ba Service ClusterIP đúng port; Service gateway-nodeport gọi được từ máy Mac qua IP node.",
  },
  {
    id: "s28",
    stage: "st5",
    title: "CoreDNS",
    durationMin: 75,
    domain: "networking",
    competencies: ["nw-dns"],
    requires: ["s27"],
    status: "skeleton",
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
    stateIn: "Đầu ra s27.",
    stateOut: "CoreDNS có thêm mục hosts db.shop.internal trỏ về Service postgres; Pod của shop phân giải được tên này.",
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
