// Chặng 1 — Dựng cluster bằng kubeadm.
// Bốn buổi đã phát hành; script lab ở labs/cka/sessions/s06…s09 và labs/cka/breaks/st1-node-notready
// (đã chạy thật trên VM Multipass: kubeadm/kubelet/kubectl 1.36.6, containerd 2.2.1, Calico v3.33.0).
// outcome.verifyOutput chép từ output thật của `./labs/lab verify cka sNN` (IP, ngày chứng chỉ trên máy bạn sẽ khác).

export const sessions = [
  // ───────────────────────────── s06 ─────────────────────────────
  {
    id: "s06",
    stage: "st1",
    title: "Chuẩn bị node: swap, kernel, containerd, kubeadm/kubelet/kubectl",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-infra"],
    requires: ["s05"],
    status: "published",
    pieces: [],
    goals: [
      "Chuẩn bị đủ ba node theo trang Installing kubeadm: tắt swap bền, nạp overlay và br_netfilter, bật ba sysctl mạng.",
      "Cấu hình containerd dùng SystemdCgroup và giải thích vì sao cgroup driver phải khớp với kubelet.",
      "Cài kubeadm, kubelet, kubectl đúng minor cài đặt và hold cả ba gói.",
    ],
    skills: [
      { skill: "lx-swapoff", level: "Gõ được không tra" },
      { skill: "lx-modules-load", level: "Viết được không tra" },
      { skill: "net-sysctl-k8s", level: "Viết được không tra" },
      { skill: "k-containerd-systemdcgroup", level: "Sửa được trong 2 phút" },
      { skill: "k-install-kubeadm", level: "Làm được có tra docs" },
      { skill: "lx-daemon-reload", level: "Gõ được không tra" },
      { skill: "lx-journalctl-filter", level: "Gõ được không tra" },
      { skill: "k-docs-install-kubeadm", level: "Tìm được trong 30 giây" },
    ],
    uses: ["lx-apt-repo", "lx-apt-hold", "lx-systemctl-unit", "net-ssh-node", "lx-tmux-panes"],
    foundation: {
      area: "linux",
      md: `Buổi này đụng tới ba thứ của Linux mà s03 mới lướt qua: unit systemd có **drop-in**, cách lọc journal, và **module kernel** cùng **sysctl**.

**1. Một unit = tệp gốc + các drop-in.** Gói \`kubelet\` cài unit gốc ở \`/usr/lib/systemd/system/kubelet.service\` (chỉ có \`ExecStart=/usr/bin/kubelet\`, không có đối số nào). Gói \`kubeadm\` thêm một drop-in \`/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf\`, xoá \`ExecStart\` cũ (dòng \`ExecStart=\` rỗng) rồi viết lại kèm bốn biến đối số. Đây là đường dẫn quan sát được trên VM lab (Ubuntu 24.04, gói pkgs.k8s.io); nhiều tài liệu cũ ghi \`/etc/systemd/system/kubelet.service.d/\` — đừng nhớ đường dẫn, hãy hỏi systemd:

| Lệnh | Cho biết |
|---|---|
| \`systemctl cat kubelet\` | Unit gốc **và mọi drop-in**, theo đúng thứ tự áp dụng, kèm đường dẫn từng tệp |
| \`systemctl show kubelet -p FragmentPath,DropInPaths\` | Chỉ đường dẫn |
| \`systemctl status kubelet\` | Dòng \`Loaded:\` (đường dẫn unit, \`enabled\`/\`disabled\`), dòng \`Drop-In:\`, \`Active:\` và vài dòng log cuối |
| \`systemctl daemon-reload\` | Đọc lại tệp unit sau khi bạn sửa unit/drop-in (sửa tệp môi trường như \`/etc/default/kubelet\` thì chỉ cần restart) |

Sửa unit của gói: **không sửa tệp trong \`/usr/lib\`** (bản nâng cấp gói sẽ ghi đè), tạo drop-in của mình bằng \`systemctl edit <unit>\` (nó nằm ở \`/etc/systemd/system/<unit>.d/override.conf\`).

**2. Lọc journal như người trực ca.** \`journalctl -u kubelet\` thì quá dài; các bộ lọc hay dùng:

\`\`\`bash
journalctl -u containerd -n 30 --no-pager          # 30 dòng cuối
journalctl -u kubelet --since "10 min ago" --no-pager
journalctl -u containerd -p err --no-pager         # chỉ mức err trở lên (err, crit, alert, emerg)
journalctl -u kubelet -b                           # từ lần khởi động hiện tại
journalctl -u kubelet -f                           # theo dõi trực tiếp (Ctrl-c để thoát)
\`\`\`

**3. Module kernel.** Một phần tính năng của kernel nằm trong module nạp khi cần. \`lsmod\` (hay \`/proc/modules\`) liệt kê module đang nạp; \`modprobe <tên>\` nạp ngay — mất khi reboot; muốn bền thì ghi tên module, mỗi dòng một tên, vào một tệp trong \`/etc/modules-load.d/\` (systemd-modules-load đọc lúc khởi động). Hai module của buổi này:
- \`overlay\`: hệ thống tệp overlayfs, thứ containerd dùng để xếp các lớp image thành rootfs của container. Trên VM lab nó thường đã nạp sẵn (\`lsmod\` thấy), nhưng chưa được khai bền.
- \`br_netfilter\`: cho gói đi qua **Linux bridge** cũng đi qua iptables. Chưa nạp module này thì thư mục \`/proc/sys/net/bridge/\` không tồn tại, nên hai sysctl \`bridge-nf-call-*\` cũng không có.

**4. sysctl.** Tham số kernel lúc chạy, nằm dưới \`/proc/sys/\` (\`net.ipv4.ip_forward\` ↔ \`/proc/sys/net/ipv4/ip_forward\`). \`sysctl -w k=v\` đặt ngay (mất khi reboot); muốn bền thì ghi vào \`/etc/sysctl.d/<tên>.conf\` rồi \`sysctl --system\` để áp mọi tệp ngay. \`ip_forward = 1\` cho phép node chuyển tiếp gói giữa các card — không có nó, gói từ Pod không ra khỏi node.

**Bài tập nền (10 phút, trên cka-cp — node duy nhất đã có containerd từ s05 — trước khi làm nhiệm vụ):**
1. \`systemctl cat containerd | head -20\` — tìm dòng đầu (đường dẫn tệp unit) và \`ExecStart\`.
2. \`journalctl -u containerd -p warning --no-pager | tail -5\` rồi đổi \`warning\` thành \`err\`.
3. Drop-in và \`daemon-reload\` — tạo một drop-in thử rồi gỡ:
   \`\`\`bash
   sudo mkdir -p /etc/systemd/system/containerd.service.d
   printf '[Service]\\nEnvironment=LAB_NOTE=s06\\n' | sudo tee /etc/systemd/system/containerd.service.d/lab.conf
   systemctl show containerd -p Environment     # Environment=   (systemd chưa đọc tệp mới)
   sudo systemctl daemon-reload
   systemctl show containerd -p Environment     # Environment=LAB_NOTE=s06
   sudo rm /etc/systemd/system/containerd.service.d/lab.conf && sudo systemctl daemon-reload
   \`\`\`
   systemd chỉ đọc lại tệp unit khi \`daemon-reload\`; biến mới chỉ tới tiến trình containerd ở lần restart sau.
4. \`lsmod | grep -E 'overlay|br_netfilter'\`; \`ls /proc/sys/net/bridge 2>&1\` — vì sao báo không có?
5. \`sysctl net.ipv4.ip_forward\` và \`cat /proc/sys/net/ipv4/ip_forward\` — hai cách đọc cùng một giá trị.

Đọc thêm: phần Linux trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `**Chuẩn bị node giống chuẩn bị máy chủ cho một ứng dụng Java đòi hỏi khắt khe.** Bạn từng cài JDK đúng bản, đặt \`ulimit\`, tắt THP cho một database… trước khi deploy. kubelet cũng có danh sách đòi hỏi như vậy, và \`kubeadm init\`/\`join\` sẽ chạy **preflight** kiểm chúng trước khi làm gì. Trên VM lab (kubeadm 1.36.6) preflight phân biệt rõ hai mức: swap đang bật chỉ là \`[WARNING Swap]\`, còn \`net.ipv4.ip_forward\` khác 1 là \`[ERROR FileContent--proc-sys-net-ipv4-ip_forward]\` và dừng hẳn. Đọc output preflight như đọc log khởi động của Spring: \`WARNING\` để biết, \`ERROR\` phải sửa.

**Vì sao tắt swap.** Mặc định kubelet từ chối khởi động khi node có swap (\`failSwapOn: true\`, theo trang *Installing kubeadm*). Lý do gần gũi với người làm Java: scheduler xếp Pod theo \`requests\` bộ nhớ và kernel giết tiến trình vượt \`limits\` — có swap thì "bộ nhớ" của một container không còn là một con số rõ ràng, và một JVM bị đẩy heap ra swap sẽ chạy GC chậm hàng trăm lần thay vì chết gọn. Kubernetes mới đây hỗ trợ swap có kiểm soát (\`swapBehavior\`), nhưng cluster kubeadm mặc định — và đề thi — vẫn đi đường tắt swap.

**cgroup driver: kubelet và containerd phải cùng một người quản lý cgroup.** Ubuntu 24.04 dùng systemd làm init và cgroup v2; systemd muốn là **người duy nhất** quản lý cây cgroup. Trang *Container Runtimes* khuyên dùng driver \`systemd\` cho cả hai; kubeadm ghi sẵn \`cgroupDriver: systemd\` vào cấu hình kubelet. Phần của bạn là containerd: gói Ubuntu **không có** \`/etc/containerd/config.toml\`, và \`containerd config default\` (containerd 2.2.1) in \`SystemdCgroup = false\`. Lưu ý một điểm mới: feature gate \`KubeletCgroupDriverFromCRI\` đã GA từ 1.34 (luôn bật, theo trang *Feature Gates*), và trang *Container Runtimes* ghi rằng khi runtime hỗ trợ RPC \`RuntimeConfig\` (containerd 2.x có, 1.x thì không), kubelet **hỏi thẳng containerd** cgroup driver và bỏ qua \`cgroupDriver\` trong cấu hình của nó. Nghĩa là trên cluster này, \`SystemdCgroup\` trong containerd chính là thứ quyết định — để \`false\` thì cả node chạy bằng cgroupfs.

**Ba gói, ba vai.** \`kubeadm\` (công cụ dựng cluster, chạy một lần), \`kubelet\` (dịch vụ chạy mãi trên mọi node), \`kubectl\` (client). \`apt-mark hold\` cả ba vì nâng cấp Kubernetes phải đi theo quy trình (kubeadm trước, kubelet sau, từng node một — chặng 8), không được để \`apt upgrade\` tự kéo lên. Ngay sau khi cài, trên VM lab \`systemctl status kubelet\` cho \`enabled\` nhưng \`inactive (dead)\` và journal trống: gói bật unit nhưng không khởi động. Trang *Installing kubeadm* nói kubelet "khởi động lại vài giây một lần" — đó là sau khi bạn \`systemctl start\` nó mà chưa có \`/var/lib/kubelet/config.yaml\` (kubeadm sẽ viết tệp này ở buổi sau). Cả hai trạng thái đều bình thường ở bước này.`,
    refs: [
      { label: "Bài lộ trình CKA: Cài containerd, kubeadm, kubelet, kubectl", href: "#/roadmap/cka/cka-w2-1" },
      { label: "Bài lộ trình CKA: Node components — kubelet, container runtime", href: "#/roadmap/cka/cka-w1-2" },
      { label: "CKA Study Guide, chương 2 — Tóm lược về Kubernetes (kiến trúc)", href: "#/docs/ckabook-02" },
      { label: "CKA Study Guide, chương 4 — Cài đặt và nâng cấp cluster", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Installing kubeadm (bản v1.36)", href: "https://v1-36.docs.kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/" },
      { label: "kubernetes.io: Container Runtimes — ip_forward, cgroup drivers, containerd", href: "https://kubernetes.io/docs/setup/production-environment/container-runtimes/" },
      { label: "man systemd.unit — drop-in, thứ tự áp dụng", href: "https://man7.org/linux/man-pages/man5/systemd.unit.5.html" },
    ],
    stateIn: `Chặng 0 đã xong (mốc \`st0-done\`): ba VM ssh qua lại được bằng tên; trên **cka-cp** đã có repo pkgs.k8s.io v1.36, containerd (chưa có \`config.toml\`), \`crictl\` và sáu image shop; container \`catalog\` của s05 (chạy bằng \`ctr\`) có thể còn chạy hoặc chỉ còn bản ghi nếu VM đã tắt. Hai worker chưa có containerd. Trên Mac chạy \`./labs/lab begin cka s06\`: lệnh kiểm phần bền của chặng 0 rồi **đặt bài** — mỗi node có thêm một swapfile \`/swap.img\` 512 MiB đang bật và khai trong \`/etc/fstab\`, như một máy chủ Ubuntu cài thông thường (VM Multipass mặc định không có swap).`,
    stateOut: "Cả ba node: swap tắt (cả fstab), overlay và br_netfilter nạp và khai bền, ba sysctl mạng bằng 1, containerd SystemdCgroup = true, kubeadm/kubelet/kubectl bản 1.36 đang hold; container catalog của s05 đã dọn, worker có image shop.",
    tasks: [
      { id: "t1", text: "Trên cka-cp (`sudo -i`): dọn container `catalog` của s05 — `ctr -n k8s.io task kill -s SIGKILL catalog`, `task rm`, `container rm` (bỏ qua lỗi nếu task không còn). Cổng 8080 và 768 MiB RAM được trả lại cho control plane." },
      { id: "t2", text: "Trên **mỗi** node: `swapon --show` thấy `/swap.img`; `swapoff -a`; chú thích dòng swap trong `/etc/fstab` (vim hoặc `sed`); `swapon --show` phải rỗng." },
      { id: "t3", text: "Trên mỗi node: viết `/etc/modules-load.d/k8s.conf` (hai dòng `overlay`, `br_netfilter`), `modprobe` cả hai; viết `/etc/sysctl.d/k8s.conf` với `net.bridge.bridge-nf-call-iptables`, `net.bridge.bridge-nf-call-ip6tables`, `net.ipv4.ip_forward` bằng 1; `sysctl --system`." },
      { id: "t4", text: "Trên hai worker: thêm repo pkgs.k8s.io v1.36 (như s05), `apt-get install -y containerd`. Trên mỗi node: `containerd config default > /etc/containerd/config.toml`, đổi `SystemdCgroup = false` thành `true`, `systemctl restart containerd`; viết `/etc/crictl.yaml` trên hai worker." },
      { id: "t5", text: "Trên mỗi node: `apt-get install -y kubelet kubeadm kubectl cri-tools`; `apt-mark hold kubelet kubeadm kubectl`; `crictl info | grep SystemdCgroup` phải ra `true` (containerd đang dùng cấu hình mới); đọc `systemctl status kubelet` và `systemctl cat kubelet` (drop-in nằm ở đâu?)." },
      { id: "t6", text: "Trên Mac: `./labs/lab images cka` — lần này hai worker đã có containerd nên cũng nhận sáu image shop." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s06` phải đạt 39/39." },
    ],
    hints: [
      "Làm một node trước cho chắc tay, rồi dùng tmux chia ba pane (`ssh cka-w1`, `ssh cka-w2`) gõ lại — hoặc ghi các bước vào một script rồi `scp` sang worker. Trong phòng thi, chuẩn bị node thường chỉ một node, nên tập gõ tay ít nhất một lần.",
      "Chú thích fstab bằng một lệnh: `sed -Ei '/^[^#].*[[:space:]]swap[[:space:]]/ s/^/#/' /etc/fstab` — `[[:space:]]` khớp cả dấu cách lẫn TAB (bộ cài Ubuntu ghi fstab bằng TAB, nên mẫu `/ swap /` với dấu cách không khớp gì). Kiểm bằng `grep swap /etc/fstab` — dòng còn lại phải bắt đầu bằng `#`. Chỉ `swapoff -a` mà quên fstab thì reboot là swap quay lại.",
      "`sysctl: cannot stat /proc/sys/net/bridge/bridge-nf-call-iptables` nghĩa là `br_netfilter` chưa nạp: `modprobe br_netfilter` trước, rồi `sysctl --system`.",
      "Trong `config.toml` của containerd 2.x, `SystemdCgroup` nằm dưới `[plugins.'io.containerd.cri.v1.runtime'.containerd.runtimes.runc.options]` (containerd 1.x có tên bảng khác — xem trang Container Runtimes). Trong vim: `:%s/SystemdCgroup = false/SystemdCgroup = true/` rồi `:wq`. Kiểm: `grep -n SystemdCgroup /etc/containerd/config.toml`.",
      "Trên VM lab, gói `kubeadm` 1.36 không kéo theo `cri-tools`: thiếu nó thì worker không có `crictl` — cài thêm `cri-tools`. `apt-mark showhold` phải in đủ ba tên.",
    ],
    solution: `Làm bằng root (\`sudo -i\`). Ba node làm giống hệt nhau, trừ bước 1 (chỉ cka-cp) và việc cài containerd (cka-cp đã có từ s05).

**1. Dọn container của s05** (cka-cp):

\`\`\`bash
ctr -n k8s.io task kill -s SIGKILL catalog; ctr -n k8s.io task rm -f catalog
ctr -n k8s.io container rm catalog
ctr -n k8s.io containers ls -q          # không còn catalog
\`\`\`

Container chạy bằng \`ctr\` không có ai giám sát; nếu VM đã tắt từ s05 thì task không còn, \`task kill\` báo lỗi — bỏ qua, chỉ cần \`container rm\`.

**2. Tắt swap, cả lúc chạy lẫn lúc khởi động**

\`\`\`bash
swapon --show                           # /swap.img file 512M …
swapoff -a
sed -Ei '/^[^#].*[[:space:]]swap[[:space:]]/ s/^/#/' /etc/fstab   # dòng /swap.img<TAB>none<TAB>swap…
cat -A /etc/fstab | grep swap           # #/swap.img^Inone^Iswap^Isw^I0^I0$  (^I là TAB)
swapon --show                           # rỗng
\`\`\`

**3. Module và sysctl, khai bền rồi áp ngay**

\`\`\`bash
cat > /etc/modules-load.d/k8s.conf <<EOF
overlay
br_netfilter
EOF
modprobe overlay; modprobe br_netfilter

cat > /etc/sysctl.d/k8s.conf <<EOF
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sysctl --system
sysctl net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.ipv4.ip_forward
\`\`\`

Vì sao ba sysctl mà preflight chỉ đòi một: trang *Container Runtimes* hiện tại chỉ còn yêu cầu \`net.ipv4.ip_forward = 1\`, và trên VM lab \`kubeadm init phase preflight\` chỉ báo ERROR cho đúng sysctl đó. \`br_netfilter\` cùng hai sysctl \`bridge-nf-call-*\` có trong các bản hướng dẫn cũ và hầu hết bài lab: chúng cần khi gói giữa các Pod đi qua một Linux bridge (plugin CNI kiểu bridge) mà vẫn phải qua iptables của kube-proxy. Calico của lab này định tuyến bằng veth chứ không dùng bridge, nên thiếu chúng cluster vẫn chạy — nhưng chúng vô hại, và đề thi có thể yêu cầu đúng ba dòng này.

**4. containerd với SystemdCgroup** (hai worker cài trước; repo pkgs.k8s.io thêm như s05 vì sẽ cần cho bước 5):

\`\`\`bash
apt-get update && apt-get install -y containerd          # chỉ worker
mkdir -p /etc/containerd
containerd config default > /etc/containerd/config.toml
sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
grep -n SystemdCgroup /etc/containerd/config.toml        # … SystemdCgroup = true
systemctl restart containerd && systemctl is-active containerd
\`\`\`

Trên worker viết thêm \`/etc/crictl.yaml\` giống s05. \`config default\` in **toàn bộ** cấu hình mặc định (config version 3 với containerd 2.x); bạn chỉ đổi một dòng, phần còn lại giữ nguyên để lần sau còn so được với bản gốc.

**5. Ba gói Kubernetes, đúng minor, hold**

\`\`\`bash
apt-get install -y kubelet kubeadm kubectl cri-tools
apt-mark hold kubelet kubeadm kubectl
apt-mark showhold                       # kubeadm kubectl kubelet
crictl info | grep SystemdCgroup        # "SystemdCgroup": true — cấu hình containerd ĐANG dùng, không chỉ tệp
kubeadm version -o short                # v1.36.x
systemctl status kubelet --no-pager     # enabled, inactive (dead)
systemctl cat kubelet                   # unit gốc + Drop-In 10-kubeadm.conf
\`\`\`

Repo \`…/core:/stable:/v1.36/deb/\` chỉ có bản 1.36.x, nên \`apt-get install\` không cần ghi số bản — đó là cách pkgs.k8s.io "ghim minor". Muốn đúng một bản vá cụ thể thì \`apt-get install kubelet=1.36.6-1.1 …\`.

Đọc \`systemctl cat kubelet\`: \`ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS\`, với \`KUBELET_KUBEADM_ARGS\` lấy từ \`/var/lib/kubelet/kubeadm-flags.env\` (kubeadm viết) và \`KUBELET_EXTRA_ARGS\` từ \`/etc/default/kubelet\` (hiện là \`KUBELET_EXTRA_ARGS=\` rỗng). Nhớ hai tệp này: buổi s09 sẽ cần.

**6. Image cho worker** — trên Mac: \`./labs/lab images cka\`.

**7. Kiểm** — \`./labs/lab verify cka s06\`. Lời giải tự động: \`labs/cka/sessions/s06/apply.sh\` (bước 2–5 ở \`files/prepare-node.sh\`).`,
    exam: {
      patterns: [
        "Câu chuẩn bị một node mới để join: cài container runtime, bật `ip_forward`, cài kubeadm/kubelet đúng phiên bản — thường kèm câu join ngay sau.",
        "Câu kiểm tra/khắc phục preflight: `kubeadm join` dừng ở `[ERROR …]` (ip_forward, swap, cổng đã bị chiếm) — đọc đúng dòng ERROR rồi sửa trên node.",
        "Câu cgroup driver: kubelet không lên, journal báo lệch cgroup driver — sửa `SystemdCgroup` trong `/etc/containerd/config.toml` rồi restart containerd và kubelet.",
        "Câu cài một gói/công cụ đúng phiên bản và giữ không cho nâng (`apt-mark hold`).",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trên cka-w2: chứng minh trong 2 phút rằng node sẵn sàng cho kubeadm — swap tắt, ba sysctl bằng 1, containerd dùng systemd cgroup, ba gói đang hold. Chỉ đọc, không sửa.",
          timeLimitMin: 2,
          solution: "```bash\nssh cka-w2\nswapon --show; grep swap /etc/fstab\nsysctl net.bridge.bridge-nf-call-iptables net.bridge.bridge-nf-call-ip6tables net.ipv4.ip_forward\ngrep SystemdCgroup /etc/containerd/config.toml\napt-mark showhold\nexit\n```\n`grep swap /etc/fstab` chỉ được ra dòng bắt đầu bằng `#`; `apt-mark showhold` phải có đủ ba tên.",
        },
        {
          text: "Trên cka-w1 có người đã đặt `SystemdCgroup = false` và `net.ipv4.ip_forward = 0` (giả định). Sửa cả hai cho bền qua reboot. Giới hạn 4 phút.",
          timeLimitMin: 4,
          solution: "```bash\nssh cka-w1\nsudo -i\nsed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml\nsystemctl restart containerd\nsystemd-analyze cat-config sysctl.d | grep -n -e '^# /' -e ip_forward   # thứ tự áp và tệp nào đặt 0\nsed -i 's/^net.ipv4.ip_forward *= *0/net.ipv4.ip_forward = 1/' <tệp tìm được>\nsysctl --system | grep ip_forward\nsystemctl restart kubelet   # nếu node đã join\n```\nCác tệp được áp theo thứ tự tên và tệp áp sau thắng; trên Ubuntu `/etc/sysctl.conf` được áp qua `/etc/sysctl.d/99-sysctl.conf`, tức là **sau** `k8s.conf`. Thêm một dòng mới vào `k8s.conf` (hay ghi đè nó bằng `>`, làm mất hai dòng bridge) không thắng được số 0 nằm ở tệp áp sau: phải sửa đúng tệp đặt 0.",
        },
      ],
    },
    tips: [
      "Bookmark trang *Installing kubeadm* và *Container Runtimes* trước giờ thi; hai khối lệnh `modules-load.d` và `sysctl.d` chép thẳng từ docs nhanh hơn gõ.",
      "Mọi thay đổi \"cho bền\" đều có hai nửa: áp ngay (`swapoff`, `modprobe`, `sysctl --system`) và khai cho lần khởi động sau (`fstab`, `modules-load.d`, `sysctl.d`). Kiểm cả hai.",
      "`systemctl cat <unit>` trước khi sửa bất cứ thứ gì của kubelet: nó cho thấy đối số thật đến từ tệp nào.",
      "Sửa `config.toml` của containerd xong phải `systemctl restart containerd` — containerd chỉ đọc cấu hình lúc khởi động.",
    ],
    outcome: {
      md: `Ba node đã sẵn sàng cho \`kubeadm\`: swap tắt bền, module và sysctl bền, containerd dùng systemd cgroup, ba gói Kubernetes bản 1.36 đang hold, worker có image shop. Trên Mac:

\`\`\`bash
./labs/lab verify cka s06
\`\`\`

Kết quả phải là 39/39: 12 dòng mỗi node (trong đó sysctl được kiểm hai lần — giá trị đang áp và giá trị khai bền trong \`sysctl.d\`; SystemdCgroup cũng hai lần — trong \`config.toml\` và trong cấu hình containerd **đang dùng**, đọc qua \`crictl info\`), một dòng về container catalog, hai dòng về image trên worker.`,
      verifyOutput: "lab: kiểm s06\n  ✓ cka-cp: swapon --show rỗng\n  ✓ cka-cp: /etc/fstab không còn dòng swap đang bật\n  ✓ cka-cp: module overlay đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-cp: module br_netfilter đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-cp: ba sysctl mạng bằng 1\n  ✓ cka-cp: ba sysctl khai bền bằng 1 (sysctl.d, áp lúc khởi động)\n  ✓ cka-cp: containerd active\n  ✓ cka-cp: /etc/containerd/config.toml có SystemdCgroup = true\n  ✓ cka-cp: containerd đang chạy với SystemdCgroup = true (crictl info)\n  ✓ cka-cp: kubeadm bản 1.36 và đang hold\n  ✓ cka-cp: kubelet bản 1.36 và đang hold\n  ✓ cka-cp: kubectl bản 1.36 và đang hold\n  ✓ cka-w1: swapon --show rỗng\n  ✓ cka-w1: /etc/fstab không còn dòng swap đang bật\n  ✓ cka-w1: module overlay đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-w1: module br_netfilter đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-w1: ba sysctl mạng bằng 1\n  ✓ cka-w1: ba sysctl khai bền bằng 1 (sysctl.d, áp lúc khởi động)\n  ✓ cka-w1: containerd active\n  ✓ cka-w1: /etc/containerd/config.toml có SystemdCgroup = true\n  ✓ cka-w1: containerd đang chạy với SystemdCgroup = true (crictl info)\n  ✓ cka-w1: kubeadm bản 1.36 và đang hold\n  ✓ cka-w1: kubelet bản 1.36 và đang hold\n  ✓ cka-w1: kubectl bản 1.36 và đang hold\n  ✓ cka-w2: swapon --show rỗng\n  ✓ cka-w2: /etc/fstab không còn dòng swap đang bật\n  ✓ cka-w2: module overlay đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-w2: module br_netfilter đã nạp và có trong /etc/modules-load.d/\n  ✓ cka-w2: ba sysctl mạng bằng 1\n  ✓ cka-w2: ba sysctl khai bền bằng 1 (sysctl.d, áp lúc khởi động)\n  ✓ cka-w2: containerd active\n  ✓ cka-w2: /etc/containerd/config.toml có SystemdCgroup = true\n  ✓ cka-w2: containerd đang chạy với SystemdCgroup = true (crictl info)\n  ✓ cka-w2: kubeadm bản 1.36 và đang hold\n  ✓ cka-w2: kubelet bản 1.36 và đang hold\n  ✓ cka-w2: kubectl bản 1.36 và đang hold\n  ✓ cka-cp: không còn container catalog (ctr) của s05\n  ✓ cka-w1: có image shop/catalog:1.0 trong k8s.io\n  ✓ cka-w2: có image shop/catalog:1.0 trong k8s.io\n  → 39/39 đạt",
      projectDelta: "Chưa có cluster, nhưng cả ba node đã là \"node Kubernetes chưa join\": runtime và kubelet sẵn sàng, image shop có trên mọi node — điều kiện để chặng 2 chạy shop trên bất kỳ worker nào.",
    },
    review: [
      { q: "Ba thứ phải làm \"cho bền\" khi chuẩn bị node, mỗi thứ áp ngay bằng lệnh gì và khai bền ở tệp nào?", a: "Swap: `swapoff -a` + chú thích dòng swap trong `/etc/fstab`. Module: `modprobe overlay br_netfilter` + `/etc/modules-load.d/k8s.conf`. Sysctl: `sysctl --system` sau khi ghi `/etc/sysctl.d/k8s.conf`." },
      { q: "Trên kubeadm 1.36 của lab, preflight phản ứng thế nào với swap bật và với `ip_forward = 0`?", a: "Swap bật: `[WARNING Swap]`, vẫn đi tiếp. `ip_forward` khác 1: `[ERROR FileContent--proc-sys-net-ipv4-ip_forward]`, dừng hẳn. (Còn kubelet mặc định `failSwapOn: true` thì từ chối chạy khi có swap.)" },
      { q: "Đổi cgroup driver của containerd ở đâu, và vì sao trên cluster này nó quyết định driver của kubelet?", a: "`SystemdCgroup = true` dưới `[plugins.'io.containerd.cri.v1.runtime'.containerd.runtimes.runc.options]` trong `/etc/containerd/config.toml`, rồi restart containerd. Với `KubeletCgroupDriverFromCRI` (GA từ 1.34) và containerd 2.x hỗ trợ RPC `RuntimeConfig`, kubelet hỏi driver từ containerd và bỏ qua `cgroupDriver` trong cấu hình của nó." },
      { q: "Vì sao phải `apt-mark hold kubelet kubeadm kubectl`?", a: "Để `apt upgrade` không tự nâng Kubernetes. Nâng cấp phải theo quy trình kubeadm: control plane trước, kubelet từng node sau, có drain." },
      { q: "Unit kubelet lấy đối số từ những tệp nào?", a: "Drop-in `/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf` (trên VM lab) định nghĩa `ExecStart` với các biến; `/var/lib/kubelet/kubeadm-flags.env` (KUBELET_KUBEADM_ARGS, kubeadm viết) và `/etc/default/kubelet` (KUBELET_EXTRA_ARGS); tệp cấu hình `/var/lib/kubelet/config.yaml` qua `--config`. Xem tất cả bằng `systemctl cat kubelet`." },
    ],
  },

  // ───────────────────────────── s07 ─────────────────────────────
  {
    id: "s07",
    stage: "st1",
    title: "kubeadm init, cài CNI, join hai worker",
    durationMin: 90,
    domain: "architecture",
    competencies: ["ar-kubeadm"],
    requires: ["s06"],
    status: "published",
    pieces: ["cluster"],
    goals: [
      "Chạy kubeadm init với pod CIDR không chồng mạng node và dùng được kubectl bằng user ubuntu.",
      "Cài Calico và thấy node control plane chuyển sang Ready.",
      "Tự tạo lại lệnh join khi token đã hết hạn và join hai worker.",
    ],
    skills: [
      { skill: "k-kubeadm-init", level: "Làm được có tra docs" },
      { skill: "k-kubeconfig-admin", level: "Gõ được không tra" },
      { skill: "k-calico-install", level: "Làm được có tra docs" },
      { skill: "k-kubeadm-token", level: "Gõ được không tra" },
      { skill: "k-join-worker", level: "Dưới 5 phút một node" },
      { skill: "k-get-nodes-wide", level: "Gõ được không tra" },
      { skill: "net-cidr-plan", level: "Giải thích được" },
    ],
    uses: ["lx-sudo-i", "net-ssh-node", "net-ip-addr", "k-alias-k", "lx-journalctl-filter"],
    foundation: null,
    mindset: `**\`kubeadm init\` là một chuỗi phase có tên, không phải phép màu.** Đọc output của nó như đọc log khởi động Spring Boot: mỗi dòng \`[tên-phase]\` là một việc cụ thể, và khi hỏng thì dòng \`error execution phase <tên>\` cho biết hỏng ở bước nào. Trên VM lab (kubeadm 1.36.6) thứ tự quan sát được là: \`[preflight]\` (kiểm node, kéo image) → \`[certs]\` (tạo CA và toàn bộ chứng chỉ trong \`/etc/kubernetes/pki\`) → \`[kubeconfig]\` (\`admin.conf\`, \`super-admin.conf\`, \`kubelet.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`) → \`[etcd]\`, \`[control-plane]\` (viết **static pod manifest** vào \`/etc/kubernetes/manifests\`) → \`[kubelet-start]\` (viết \`/var/lib/kubelet/config.yaml\`, \`kubeadm-flags.env\`, khởi động kubelet) → \`[wait-control-plane]\` → … → \`[bootstrap-token]\` → \`[addons]\` (CoreDNS, kube-proxy). Điểm mấu chốt: kubeadm **không chạy** apiserver, etcd… — nó chỉ viết tệp manifest rồi bật kubelet; kubelet đọc thư mục manifests và tự chạy chúng. Buổi s08 sẽ mổ xẻ điều này.

**Ba dải địa chỉ không được chồng nhau.** IP node (mạng Multipass, trên máy soạn bài là \`192.168.252.0/24\`), **pod CIDR** (IP cấp cho Pod) và **service CIDR** (ClusterIP ảo, mặc định của kubeadm \`10.96.0.0/12\` — thấy ngay trong chứng chỉ apiserver: SAN \`10.96.0.1\`). Dải mặc định của Calico là \`192.168.0.0/16\` — **chứa** mạng node của lab. Dùng nó thì route tới Pod và route tới node đè nhau. Vì vậy bạn chọn \`--pod-network-cidr=10.244.0.0/16\`. Theo tài liệu của Calico, với cluster kubeadm và pod CIDR khác \`192.168.0.0/16\` thì không cần sửa manifest: Calico tự lấy CIDR từ cấu hình đang chạy. Bạn sẽ **kiểm** điều đó thay vì tin (IPPool \`default-ipv4-ippool\`).

**Vì sao node \`NotReady\` cho tới khi có CNI.** Sau init, \`kubectl get nodes\` cho \`cka-cp NotReady\` và hai Pod CoreDNS \`Pending\`. Journal của kubelet nói thẳng lý do: \`"Container runtime network not ready" … NetworkPluginNotReady message:Network plugin returns error: cni plugin not initialized\` — \`/etc/cni/net.d\` còn trống, containerd chưa biết cấp mạng cho Pod thế nào (đúng dòng \`NetworkReady false\` bạn đọc bằng \`crictl info\` ở s05). Static pod của control plane vẫn chạy vì chúng dùng \`hostNetwork\`. Cài Calico (một DaemonSet chạy trên mọi node, ghi cấu hình CNI vào \`/etc/cni/net.d\` và binary vào \`/opt/cni/bin\`) là node chuyển Ready.

**Join = "xin vào nhóm" bằng mã mời có hạn.** Lệnh join có hai phần bảo mật theo hai chiều: \`--token\` (bootstrap token, để control plane tin worker; mặc định sống 24 giờ) và \`--discovery-token-ca-cert-hash sha256:…\` (để worker tin đúng control plane — hash khoá công khai của CA). Dòng join in ở cuối \`kubeadm init\` thường đã hết hạn khi bạn cần lại; đừng lục lại log, hãy tạo mới: \`kubeadm token create --print-join-command\`. Với dân Java: giống một pre-signed URL có hạn kèm việc ghim chứng chỉ (certificate pinning) phía client.`,
    refs: [
      { label: "Bài lộ trình CKA: kubeadm init — các flag quan trọng", href: "#/roadmap/cka/cka-w2-2" },
      { label: "Bài lộ trình CKA: Cài CNI — vì sao node NotReady khi thiếu CNI", href: "#/roadmap/cka/cka-w2-3" },
      { label: "Bài lộ trình CKA: kubeadm join và token create --print-join-command", href: "#/roadmap/cka/cka-w2-4" },
      { label: "Bài lộ trình CKA: Kubeconfig — clusters, users, contexts", href: "#/roadmap/cka/cka-w2-6" },
      { label: "CKA Study Guide, chương 4 — Cài đặt và nâng cấp cluster", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Creating a cluster with kubeadm", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/" },
      { label: "kubernetes.io: kubeadm token", href: "https://kubernetes.io/docs/reference/setup-tools/kubeadm/kubeadm-token/" },
      { label: "Calico v3.33: cài bằng manifest trên cluster tự quản", href: "https://docs.tigera.io/calico/3.33/getting-started/kubernetes/self-managed-onprem/onpremises" },
    ],
    stateIn: `Đầu ra s06 trên cả ba node: swap tắt, module và sysctl bền, containerd chạy với \`SystemdCgroup = true\`, kubeadm/kubelet/kubectl 1.36 đang hold, kubelet \`enabled\` nhưng chưa chạy được (chưa có cấu hình). Chưa có cluster: \`kubectl get nodes\` trên cka-cp báo \`The connection to the server localhost:8080 was refused\` — kubectl không có kubeconfig nên thử địa chỉ mặc định. \`./labs/lab begin cka s07\` kiểm đầu vào bằng verify của s06. Mỗi máy có IP riêng: lấy IP của cka-cp bằng \`ip -br addr\` hoặc \`./labs/lab status cka\`.`,
    stateOut: "Cluster 3 node Ready ở minor cài đặt, Calico Running trên cả ba node, Pod ở hai worker ping được nhau.",
    tasks: [
      { id: "t1", text: "Trên cka-cp (`sudo -i`): `kubeadm init --apiserver-advertise-address=<IP cka-cp> --pod-network-cidr=10.244.0.0/16`. Đọc lại output theo từng phase `[…]`; chép riêng dòng `kubeadm join …` cuối cùng ra giấy nháp." },
      { id: "t2", text: "Thoát root, với user `ubuntu`: chép `/etc/kubernetes/admin.conf` vào `~/.kube/config` và `chown` (ba lệnh trong output của init). `kubectl get nodes` → `cka-cp NotReady`; `kubectl -n kube-system get pods` → CoreDNS `Pending`. Tìm lý do trong `journalctl -u kubelet`." },
      { id: "t3", text: "Tải manifest Calico **v3.33.0** (`curl -O https://raw.githubusercontent.com/projectcalico/calico/v3.33.0/manifests/calico.yaml`), `kubectl apply -f calico.yaml`, theo dõi `kubectl -n kube-system get pods -w` tới khi `calico-node` và CoreDNS Running; `cka-cp` thành `Ready`." },
      { id: "t4", text: "Kiểm Calico lấy đúng pod CIDR: `kubectl get ippools.crd.projectcalico.org default-ipv4-ippool -o jsonpath='{.spec.cidr}'` phải ra `10.244.0.0/16`." },
      { id: "t5", text: "Coi như dòng join ở t1 đã hết hạn: trên cka-cp `kubeadm token create --print-join-command`; `kubeadm token list`." },
      { id: "t6", text: "`ssh cka-w1`, `sudo` dán lệnh join; làm lại với `cka-w2`. Trên cka-cp: `kubectl get nodes -o wide` tới khi ba node Ready, cột VERSION là v1.36.x; `kubectl get pods -A -o wide` thấy một `calico-node` trên mỗi node." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s07` phải đạt 8/8 (lệnh tự tạo hai Pod busybox trên hai worker trong một namespace tạm, ping giữa chúng rồi xoá namespace)." },
    ],
    hints: [
      "`--apiserver-advertise-address` là IP của **card mạng chính** của cka-cp (`ip -br addr`, dòng `enp0s1`), không phải `127.0.0.1` hay IP `10.x` của Calico. Bỏ trống thì kubeadm tự chọn card có route mặc định — trên VM một card thì cũng ra đúng, nhưng ghi rõ là thói quen tốt.",
      "kubectl chỉ in `localhost:8080 was refused`: chưa có `~/.kube/config` cho user hiện tại (hoặc đang chạy bằng root mà chưa `export KUBECONFIG=/etc/kubernetes/admin.conf`).",
      "Calico `Init:0/…` vài phút là bình thường lần đầu: ba image `quay.io/calico/*` được kéo trên từng node. Xem tiến độ: `kubectl -n kube-system describe pod <calico-node-…>` phần Events.",
      "Lệnh join phải chạy bằng **root trên worker**. Lỗi `[ERROR FileAvailable--etc-kubernetes-kubelet.conf]` nghĩa là worker đã join (hoặc join dở): muốn làm lại thì `kubeadm reset -f` trên worker đó trước.",
      "Worker join xong mà `NotReady` một lúc: đợi `calico-node` trên worker đó chạy xong (kéo image). `kubectl get pods -A -o wide --field-selector spec.nodeName=cka-w1`.",
    ],
    solution: `**1. init** (cka-cp, \`sudo -i\`; IP lấy từ \`ip -br addr\`, máy bạn khác ví dụ):

\`\`\`bash
kubeadm init --apiserver-advertise-address=192.168.252.29 --pod-network-cidr=10.244.0.0/16
\`\`\`

Các dòng đáng đọc (output thật trên máy soạn bài):

\`\`\`text
remote version is much newer: v1.37.2; falling back to: stable-1.36
[init] Using Kubernetes version: v1.36.6
[certs] apiserver serving cert is signed for DNS names [cka-cp kubernetes kubernetes.default kubernetes.default.svc kubernetes.default.svc.cluster.local] and IPs [10.96.0.1 192.168.252.29]
[kubeconfig] Writing "admin.conf" kubeconfig file
[kubeconfig] Writing "super-admin.conf" kubeconfig file
[etcd] Creating static Pod manifest for local etcd in "/etc/kubernetes/manifests"
[control-plane] Creating static Pod manifest for "kube-apiserver"
[kubelet-start] Writing kubelet configuration to file "/var/lib/kubelet/config.yaml"
\`\`\`

Không ghi \`--kubernetes-version\` thì kubeadm hỏi Internet bản mới nhất, thấy 1.37 lớn hơn chính nó nên lùi về \`stable-1.36\` — tức bản vá mới nhất của 1.36. \`10.96.0.1\` là ClusterIP đầu tiên của service CIDR mặc định \`10.96.0.0/12\` (Service \`kubernetes\` trỏ về apiserver).

**2. kubeconfig cho user ubuntu** — đúng ba dòng output in ra:

\`\`\`bash
exit                                     # về user ubuntu
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
kubectl get nodes                        # cka-cp   NotReady   control-plane …
kubectl -n kube-system get pods          # coredns-… Pending; etcd, kube-apiserver… Running
sudo journalctl -u kubelet --since "5 min ago" --no-pager | grep -m1 "network not ready"
\`\`\`

\`admin.conf\` là kubeconfig của nhóm quản trị \`kubeadm:cluster-admins\`; \`super-admin.conf\` (từ 1.29) là chìa khoá dự phòng bỏ qua RBAC — để yên trên control plane, không chép đi đâu.

**3. Calico từ manifest, phiên bản ghim**

\`\`\`bash
curl -fsSLO https://raw.githubusercontent.com/projectcalico/calico/v3.33.0/manifests/calico.yaml
kubectl apply -f calico.yaml
kubectl -n kube-system get pods -w       # Ctrl-c khi calico-node, calico-kube-controllers, coredns Running
kubectl get nodes                        # cka-cp Ready
kubectl get ippools.crd.projectcalico.org default-ipv4-ippool -o jsonpath='{.spec.cidr}{"\\n"}'   # 10.244.0.0/16
sudo ls /etc/cni/net.d/                  # 10-calico.conflist  calico-kubeconfig  (thư mục chỉ root đọc được)
ls /opt/cni/bin/                         # calico, calico-ipam (Calico chép vào) cạnh bridge, host-local… của gói kubernetes-cni
\`\`\`

Vì sao v3.33.0: tài liệu của Calico ghi bản này được kiểm thử với Kubernetes 1.35, 1.36, 1.37 — vừa với cluster 1.36 hôm nay và bản 1.37 sau buổi nâng cấp. Luôn ghim phiên bản trong URL; \`master\` hay "latest" thì mỗi lần cài ra một thứ khác.

**4. Lệnh join mới** (cka-cp):

\`\`\`bash
sudo kubeadm token create --print-join-command
# kubeadm join 192.168.252.29:6443 --token <6 ký tự>.<16 ký tự> --discovery-token-ca-cert-hash sha256:<64 ký tự hex>
sudo kubeadm token list                  # token vừa tạo: TTL 23h (mặc định 24 giờ); token của init có DESCRIPTION riêng
\`\`\`

Token và hash trên máy bạn khác hoàn toàn. Hash chỉ đổi khi CA đổi; token thì tạo mới tuỳ ý.

**5. Join hai worker**

\`\`\`bash
ssh cka-w1
sudo kubeadm join 192.168.252.29:6443 --token … --discovery-token-ca-cert-hash sha256:…
# [kubelet-start] Waiting for the kubelet to perform the TLS Bootstrap
# This node has joined the cluster:
exit
# lặp lại với cka-w2, rồi trên cka-cp:
kubectl get nodes -o wide                # ba node Ready, VERSION v1.36.x, INTERNAL-IP là IP Multipass
kubectl -n kube-system get pods -o wide -l k8s-app=calico-node   # mỗi node một Pod
\`\`\`

Worker **không** cần \`admin.conf\`: kubelet của nó dùng \`/etc/kubernetes/kubelet.conf\` mà join vừa tạo. Bạn vẫn làm việc bằng kubectl trên cka-cp.

**6. Kiểm** — \`./labs/lab verify cka s07\`. Lời giải tự động: \`labs/cka/sessions/s07/apply.sh\` (init + Calico ở \`files/init-cp.sh\`, phép thử ping ở \`files/pod-ping.sh\`).`,
    exam: {
      patterns: [
        "Join một worker vào cluster có sẵn: tạo lệnh join trên control plane bằng `kubeadm token create --print-join-command`, ssh sang node, chạy bằng root, kiểm `Ready`.",
        "Dựng control plane bằng kubeadm với yêu cầu cụ thể (pod CIDR, advertise address, phiên bản) — đọc kỹ đề và đưa đúng flag.",
        "Cài một CNI theo URL/manifest cho sẵn rồi chứng minh node Ready và Pod được cấp IP đúng dải.",
        "Câu \"kubectl không chạy\": thiếu/sai kubeconfig (`localhost:8080 refused`) — sửa `~/.kube/config` hoặc `KUBECONFIG`.",
      ],
      timeTargetMin: 10,
      drills: [
        {
          text: "Trên cka-cp: in ra một lệnh join dùng được cho worker mới, kèm thời hạn của token vừa tạo. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\nsudo kubeadm token create --print-join-command\nsudo kubeadm token list   # cột TTL / EXPIRES\n```\nMuốn token sống ngắn hơn: `--ttl 1h`. Lệnh join phải chạy bằng root trên chính worker.",
        },
        {
          text: "Cho biết pod CIDR mà Calico đang cấp, dải IP Pod của từng node (block mà Calico giao cho node) và IP của một Pod CoreDNS. Giới hạn 4 phút.",
          timeLimitMin: 4,
          solution: "```bash\nkubectl get ippools.crd.projectcalico.org -o custom-columns=NAME:.metadata.name,CIDR:.spec.cidr\nkubectl get blockaffinities.crd.projectcalico.org -o custom-columns=NODE:.spec.node,CIDR:.spec.cidr\nkubectl -n kube-system get pods -l k8s-app=kube-dns -o wide\n```\nCalico chia pod CIDR thành block /26 và giao cho từng node; IP của Pod CoreDNS phải nằm trong block của node chứa nó. Calico IPAM không dùng `node.spec.podCIDR` mà controller-manager gán: trên máy soạn bài cka-cp có `podCIDR` `10.244.0.0/24`, nhưng block Calico của nó là `10.244.160.0/26` và hai Pod CoreDNS có IP `10.244.160.1`, `10.244.160.3`.",
        },
      ],
    },
    tips: [
      "Chép dòng join vào giấy nháp ngay khi init xong, nhưng tập thói quen tạo mới bằng `--print-join-command`: nhanh hơn lục log và không bao giờ hết hạn.",
      "Đọc lỗi kubeadm từ dòng `error execution phase <tên>`: tên phase cho biết hỏng ở đâu (preflight, wait-control-plane, kubelet-start…).",
      "Sau init, `kubectl get nodes` ra `NotReady` là **đúng** cho tới khi có CNI — đừng sửa kubelet.",
      "Chọn pod CIDR trước khi init: đổi sau là dựng lại cluster. Ba dải (node, Pod, Service) không được chồng nhau.",
    ],
    outcome: {
      md: `Cluster 3 node đã chạy: control plane trên \`cka-cp\`, hai worker đã join, Calico cấp IP \`10.244.x.y\` cho Pod và nối mạng Pod giữa các node. Trên Mac:

\`\`\`bash
./labs/lab verify cka s07
\`\`\`

Dòng cuối do verify tự làm: tạo namespace tạm, đặt một Pod busybox lên \`cka-w1\` và một lên \`cka-w2\`, ping từ Pod này sang IP của Pod kia (qua đường hầm IPIP của Calico), rồi xoá namespace.`,
      verifyOutput: "lab: kiểm s07\n  ✓ kubectl chạy được bằng user ubuntu trên cka-cp\n  ✓ node cka-cp Ready, kubelet v1.36\n  ✓ node cka-w1 Ready, kubelet v1.36\n  ✓ node cka-w2 Ready, kubelet v1.36\n  ✓ calico-node Running và Ready trên cka-cp\n  ✓ calico-node Running và Ready trên cka-w1\n  ✓ calico-node Running và Ready trên cka-w2\n  ✓ Pod trên cka-w1 ping được Pod trên cka-w2\n  → 8/8 đạt",
      projectDelta: "Mảnh **Cluster kubeadm** đã có: ba node Ready, mạng Pod chạy giữa các node. Từ chặng 2, shop sẽ chạy thành Deployment trên hai worker thay vì container `ctr` trên control plane.",
    },
    review: [
      { q: "Vì sao không dùng pod CIDR mặc định 192.168.0.0/16 của Calico trên lab này?", a: "Mạng node của Multipass (vd. 192.168.252.0/24) nằm trong dải đó: route tới Pod và tới node sẽ chồng nhau. Dùng 10.244.0.0/16, không chồng mạng node lẫn service CIDR 10.96.0.0/12." },
      { q: "Ngay sau `kubeadm init`, node `NotReady` và CoreDNS `Pending`. Vì sao, và kubelet ghi gì?", a: "Chưa có CNI: `/etc/cni/net.d` trống. Journal kubelet: `Container runtime network not ready … cni plugin not initialized`. Control plane vẫn chạy vì dùng hostNetwork. Cài Calico là hết." },
      { q: "Lệnh join cũ hết hạn. Tạo lại thế nào, hai thành phần bảo mật của nó là gì?", a: "`kubeadm token create --print-join-command`. `--token` để control plane tin worker (bootstrap token, mặc định 24h); `--discovery-token-ca-cert-hash` để worker xác thực đúng CA của control plane." },
      { q: "kubeadm init có tự chạy kube-apiserver không?", a: "Không. Nó viết static pod manifest vào `/etc/kubernetes/manifests` rồi khởi động kubelet; kubelet đọc thư mục đó và chạy etcd, apiserver, controller-manager, scheduler." },
      { q: "`kubectl get nodes` báo `localhost:8080 was refused`. Nghĩa là gì?", a: "kubectl không tìm thấy kubeconfig (không có `~/.kube/config`, không có `KUBECONFIG`) nên thử địa chỉ mặc định localhost:8080. Chép `admin.conf` vào `~/.kube/config` và chown." },
    ],
  },

  // ───────────────────────────── s08 ─────────────────────────────
  {
    id: "s08",
    stage: "st1",
    title: "Giải phẫu cluster: static pod, PKI, kubeconfig, CRI/CNI/CSI",
    durationMin: 75,
    domain: "architecture",
    competencies: ["ar-ext"],
    requires: ["s07"],
    status: "published",
    pieces: [],
    goals: [
      "Tìm ra trong 5 phút các giá trị cấu hình cốt lõi: data-dir etcd, advertise address, pod CIDR, service CIDR, cgroup driver, ngày hết hạn chứng chỉ apiserver.",
      "Tạo một static pod trên worker và giải thích vì sao kubectl delete không xoá được nó.",
      "Nói được CRI, CNI, CSI mỗi cái nối kubelet với thành phần nào trên chính cluster lab.",
    ],
    skills: [
      { skill: "k-static-pod-dir", level: "Biết đường dẫn không tra" },
      { skill: "k-static-pod-yaml", level: "Viết được không tra" },
      { skill: "k-pki-dir", level: "Biết đường dẫn không tra" },
      { skill: "k-kubeconfig-files", level: "Biết tệp nào của ai" },
      { skill: "k-kubelet-config", level: "Đọc hiểu được" },
      { skill: "k-ext-interfaces", level: "Giải thích được" },
      { skill: "k-certs-check-expiration", level: "Gõ được không tra" },
      { skill: "k-kubectl-completion", level: "Gõ được không tra" },
    ],
    uses: ["k-crictl-ps", "k-crictl-config", "net-ssh-node", "vim-visual-indent", "net-cidr-plan"],
    foundation: null,
    mindset: `**Bản đồ một node kubeadm — bốn chỗ cần thuộc:**

| Đường dẫn | Chứa gì | Ai đọc |
|---|---|---|
| \`/etc/kubernetes/manifests/\` | Static pod manifest: \`etcd.yaml\`, \`kube-apiserver.yaml\`, \`kube-controller-manager.yaml\`, \`kube-scheduler.yaml\` (chỉ có trên control plane; worker có thư mục nhưng trống) | kubelet (\`staticPodPath\`) |
| \`/etc/kubernetes/pki/\` | CA của cluster (\`ca.crt/.key\`), chứng chỉ apiserver, \`front-proxy-*\`, \`sa.key/.pub\`, thư mục \`etcd/\` với CA riêng của etcd | apiserver, etcd, controller-manager |
| \`/etc/kubernetes/*.conf\` | Kubeconfig: \`admin.conf\`, \`super-admin.conf\`, \`controller-manager.conf\`, \`scheduler.conf\`, \`kubelet.conf\` (worker chỉ có \`kubelet.conf\`) | kubectl, từng thành phần |
| \`/var/lib/kubelet/config.yaml\` | KubeletConfiguration: \`cgroupDriver\`, \`staticPodPath\`, \`clusterDNS\`, \`clusterDomain\`… | kubelet (\`--config\`) |

**Static pod: như một tệp cấu hình mà tiến trình giám sát tự nạp lại.** Bạn đã quen \`spring.devtools\` hay Tomcat tự deploy lại khi có WAR mới trong \`webapps/\`. kubelet làm đúng như vậy với \`/etc/kubernetes/manifests\`: nó **quét** thư mục, thấy tệp mới thì chạy Pod, tệp đổi thì chạy lại, tệp mất thì dừng — không hỏi apiserver. Để apiserver *thấy* những Pod đó, kubelet tạo một **mirror pod** mang tên \`<tên>-<node>\` (vì thế static pod \`web-static\` trên cka-w1 hiện là \`web-static-cka-w1\`). Mirror pod chỉ là cái bóng: \`kubectl delete pod web-static-cka-w1\` xoá cái bóng, kubelet tạo lại ngay. Muốn xoá thật: xoá (hoặc dời) tệp manifest trên node. Đây cũng là cách control plane kubeadm tồn tại: apiserver là một static pod, nên nó chạy được **trước khi** có apiserver — vấn đề con gà quả trứng được giải bằng một thư mục.

**Kubeconfig = cấu hình kết nối kiểu \`application.yml\` có kèm chứng chỉ client.** Mỗi tệp \`.conf\` gồm \`clusters\` (địa chỉ apiserver + CA để tin nó), \`users\` (chứng chỉ client nhúng base64 — chính là danh tính), \`contexts\` (ghép hai cái trên). Danh tính nằm trong chứng chỉ: \`CN\` là tên user, \`O\` là nhóm. Trên lab, \`admin.conf\` mang \`O=kubeadm:cluster-admins\` (được bind quyền cluster-admin qua RBAC), còn \`super-admin.conf\` mang \`O=system:masters\` (vượt RBAC — chìa khoá dự phòng, không dùng hằng ngày).

**CRI, CNI, CSI: ba ổ cắm của kubelet.** Kubernetes không tự chạy container, không tự nối mạng, không tự gắn ổ đĩa — nó định nghĩa giao diện và cắm plugin vào:
- **CRI** (gRPC qua socket): kubelet → **containerd**. Trên lab, \`/var/lib/kubelet/config.yaml\` ghi \`containerRuntimeEndpoint: unix:///var/run/containerd/containerd.sock\` (\`/var/run\` là liên kết tới \`/run\`, nên đây chính là socket trong \`/etc/crictl.yaml\`). \`crictl\` nói cùng giao diện.
- **CNI** (binary + tệp cấu hình): containerd → **Calico**, đọc \`/etc/cni/net.d/10-calico.conflist\`, chạy binary trong \`/opt/cni/bin/\` mỗi khi tạo/xoá sandbox của Pod.
- **CSI** (gRPC): kubelet → driver storage. Cluster lab **chưa có** driver CSI nào (\`kubectl get csidrivers\` rỗng) — chặng 4 sẽ thêm. Với dân Java: giống JDBC — một giao diện chuẩn, driver của từng hãng cắm vào.`,
    refs: [
      { label: "Bài lộ trình CKA: Static Pods — /etc/kubernetes/manifests", href: "#/roadmap/cka/cka-w1-3" },
      { label: "Bài lộ trình CKA: Certificates & kubeconfig — /etc/kubernetes/pki, *.conf", href: "#/roadmap/cka/cka-w1-5" },
      { label: "Bài lộ trình CKA: Control plane components", href: "#/roadmap/cka/cka-w1-1" },
      { label: "Bài lộ trình CKA: Kubeconfig — cấu trúc file, contexts", href: "#/roadmap/cka/cka-w2-6" },
      { label: "CKA Study Guide, chương 2 — Tóm lược về Kubernetes", href: "#/docs/ckabook-02" },
      { label: "CKA Study Guide, chương 4 — Cài đặt và nâng cấp cluster (CRI/CNI/CSI)", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Create static Pods", href: "https://kubernetes.io/docs/tasks/configure-pod-container/static-pod/" },
      { label: "kubernetes.io: PKI certificates and requirements", href: "https://kubernetes.io/docs/setup/best-practices/certificates/" },
      { label: "kubernetes.io: Certificate Management with kubeadm", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-certs/" },
      { label: "kubernetes.io: kubectl Quick Reference — bash completion", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
    ],
    stateIn: `Đầu ra s07: ba node \`Ready\` ở bản 1.36, Calico chạy trên cả ba, kubectl dùng được bằng user \`ubuntu\` trên cka-cp. \`./labs/lab begin cka s08\` kiểm đầu vào bằng verify của s07 (có phép thử ping giữa hai Pod, mất khoảng một phút). Đáp án của bạn phụ thuộc máy: IP của cka-cp và ngày chứng chỉ khác máy soạn bài.`,
    stateOut: "Có ~/drills/s08/answers.env đúng giá trị của cluster, static pod web-static-cka-w1 Running, kubectl completion bật cho cả alias k.",
    tasks: [
      { id: "t1", text: "Trên cka-cp: `ls /etc/kubernetes /etc/kubernetes/manifests /etc/kubernetes/pki /etc/kubernetes/pki/etcd`; `sudo crictl ps` — khớp từng container control plane với một tệp manifest." },
      { id: "t2", text: "Tìm sáu giá trị và ghi vào `~/drills/s08/answers.env` (user `ubuntu`, mỗi dòng `KEY=giá-trị`): `ETCD_DATA_DIR`, `APISERVER_ADVERTISE_ADDRESS`, `POD_CIDR`, `SERVICE_CIDR`, `KUBELET_CGROUP_DRIVER`, `APISERVER_CERT_EXPIRY` (dạng `YYYY-MM-DD`). Mỗi giá trị ghi chú bạn lấy từ tệp nào." },
      { id: "t3", text: "Đọc danh tính trong kubeconfig: giải mã `client-certificate-data` của `~/.kube/config` và xem `Subject` bằng `openssl x509`. So với `super-admin.conf`." },
      { id: "t4", text: "Trên cka-w1: viết `/etc/kubernetes/manifests/web-static.yaml` — Pod `web-static`, image `nginx:1.29-alpine`, cổng 80. Trên cka-cp: `kubectl get pods -o wide` thấy `web-static-cka-w1` Running." },
      { id: "t5", text: "Thử xoá: `kubectl delete pod web-static-cka-w1`, rồi `kubectl get pods` ngay — chuyện gì xảy ra? Trên cka-w1 `sudo crictl ps --name web`. (Giữ lại tệp manifest: verify cần Pod này.)" },
      { id: "t6", text: "Chỉ ra CRI, CNI, CSI trên cluster: socket CRI kubelet dùng, tệp cấu hình CNI trong `/etc/cni/net.d`, và `kubectl get csidrivers`." },
      { id: "t7", text: "Trên cka-cp: thêm vào `~/.bashrc` hai dòng `source <(kubectl completion bash)` và `complete -o default -F __start_kubectl k`; mở shell mới, gõ `k get po<Tab>`. Trên Mac: `./labs/lab verify cka s08` phải đạt 10/10." },
    ],
    hints: [
      "Bốn giá trị đầu nằm trong manifest static pod: `sudo grep -E 'data-dir|advertise-address|service-cluster-ip-range|cluster-cidr' /etc/kubernetes/manifests/*.yaml`. Pod CIDR là `--cluster-cidr` của **controller-manager** (không phải của apiserver).",
      "Cách thứ hai cho pod/service CIDR: `kubectl -n kube-system get cm kubeadm-config -o yaml` (khối `networking:` có `podSubnet`, `serviceSubnet`).",
      "cgroup driver: `sudo grep cgroupDriver /var/lib/kubelet/config.yaml`. Đối chiếu với journal: `sudo journalctl -u kubelet | grep -m1 'cgroup driver setting received from the CRI'`.",
      "Ngày hết hạn: `sudo kubeadm certs check-expiration` (cột EXPIRES) hoặc `sudo openssl x509 -noout -enddate -in /etc/kubernetes/pki/apiserver.crt`. Đổi sang `YYYY-MM-DD`: `date -u -d \"<chuỗi notAfter>\" +%F`.",
      "Static pod không hiện: `ssh cka-w1`, `sudo journalctl -u kubelet --since '2 min ago' | grep -i web-static` — YAML sai cú pháp thì kubelet ghi lỗi ở đây; kiểm `staticPodPath` trong `/var/lib/kubelet/config.yaml` của chính worker đó.",
    ],
    solution: `**1. Bốn giá trị từ manifest static pod** (cka-cp):

\`\`\`bash
cd /etc/kubernetes/manifests
sudo grep -h -- '--data-dir' etcd.yaml                              # - --data-dir=/var/lib/etcd
sudo grep -h -- '--advertise-address' kube-apiserver.yaml           # - --advertise-address=192.168.252.29
sudo grep -h -- '--service-cluster-ip-range' kube-apiserver.yaml    # - --service-cluster-ip-range=10.96.0.0/12
sudo grep -h -- '--cluster-cidr' kube-controller-manager.yaml       # - --cluster-cidr=10.244.0.0/16
\`\`\`

Pod CIDR là việc của controller-manager (nó cấp \`podCIDR\` cho từng node khi \`--allocate-node-cidrs=true\`); service CIDR thì apiserver cần để cấp ClusterIP.

**2. cgroup driver và ngày hết hạn chứng chỉ**

\`\`\`bash
sudo grep cgroupDriver /var/lib/kubelet/config.yaml        # cgroupDriver: systemd
sudo journalctl -u kubelet | grep -m1 'received from the CRI'
# "Using cgroup driver setting received from the CRI runtime" cgroupDriver="systemd"
sudo kubeadm certs check-expiration | grep -E 'CERTIFICATE|^apiserver '
sudo openssl x509 -noout -enddate -in /etc/kubernetes/pki/apiserver.crt   # notAfter=… GMT
date -u -d "$(sudo openssl x509 -noout -enddate -in /etc/kubernetes/pki/apiserver.crt | cut -d= -f2)" +%F
\`\`\`

Dòng journal là bằng chứng của điều s06 đã nói: kubelet 1.36 hỏi containerd và dùng driver nó trả về; \`config.yaml\` ghi \`systemd\` và containerd cũng \`systemd\` — khớp. Chứng chỉ do kubeadm ký sống 1 năm; CA sống 10 năm (\`check-expiration\` có bảng thứ hai cho CA).

\`\`\`bash
mkdir -p ~/drills/s08
cat > ~/drills/s08/answers.env <<'EOF'
ETCD_DATA_DIR=/var/lib/etcd
APISERVER_ADVERTISE_ADDRESS=192.168.252.29
POD_CIDR=10.244.0.0/16
SERVICE_CIDR=10.96.0.0/12
KUBELET_CGROUP_DRIVER=systemd
APISERVER_CERT_EXPIRY=2027-11-13
EOF
\`\`\`

Thay IP và ngày bằng giá trị trên máy bạn.

**3. Danh tính trong kubeconfig**

\`\`\`bash
kubectl config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d \\
  | openssl x509 -noout -subject
# subject=O = kubeadm:cluster-admins, CN = kubernetes-admin
sudo grep client-certificate-data /etc/kubernetes/super-admin.conf | awk '{print $2}' | base64 -d \\
  | openssl x509 -noout -subject
# subject=O = system:masters, CN = kubernetes-super-admin
\`\`\`

**4. Static pod trên cka-w1**

\`\`\`bash
ssh cka-w1
sudo vim /etc/kubernetes/manifests/web-static.yaml
\`\`\`

\`\`\`yaml
apiVersion: v1
kind: Pod
metadata:
  name: web-static
  labels:
    app: web-static
spec:
  containers:
  - name: web
    image: nginx:1.29-alpine
    ports:
    - containerPort: 80
\`\`\`

Không có namespace thì Pod vào \`default\`. Lưu là xong — không \`kubectl apply\`, không restart kubelet. Nhanh hơn nữa trong phòng thi: trên cka-cp \`k run web-static --image=nginx:1.29-alpine --port=80 $do > web-static.yaml\` rồi \`scp\` sang worker.

\`\`\`bash
exit
kubectl get pods -o wide                       # web-static-cka-w1  1/1 Running … cka-w1
kubectl delete pod web-static-cka-w1; sleep 3; kubectl get pods
# web-static-cka-w1   0/1   Pending   0   3s      ← một mirror pod MỚI (AGE 3s), trạng thái cập nhật sau vài giây
ssh cka-w1 sudo crictl pods --name web-static  # cùng POD ID như trước khi xoá, ATTEMPT 0 — container không bị đụng
ssh cka-w1 "sudo journalctl -u kubelet --since '-2 min' | grep -i mirror"
# … "Creating a mirror pod for static pod" pod="default/web-static-cka-w1"
\`\`\`

\`kubectl delete\` chỉ xoá mirror pod; container thật do kubelet giữ theo tệp manifest. Muốn dừng: \`sudo mv /etc/kubernetes/manifests/web-static.yaml /tmp/\` trên cka-w1.

**5. Ba giao diện**

\`\`\`bash
sudo cat /var/lib/kubelet/kubeadm-flags.env        # KUBELET_KUBEADM_ARGS=""  (kubeadm 1.36 để trống trên lab)
sudo grep containerRuntimeEndpoint /var/lib/kubelet/config.yaml   # unix:///var/run/containerd/containerd.sock
sudo ls /etc/cni/net.d/; ls /opt/cni/bin/ | head         # 10-calico.conflist; calico, calico-ipam, …
kubectl get csidrivers                              # No resources found
\`\`\`

**6. Completion cho k**

\`\`\`bash
echo 'source <(kubectl completion bash)' >> ~/.bashrc
echo 'complete -o default -F __start_kubectl k' >> ~/.bashrc
exec bash; complete -p k        # complete -o default -F __start_kubectl k
\`\`\`

Hai dòng này có nguyên văn trong *kubectl Quick Reference* trên kubernetes.io. Gói \`bash-completion\` đã có sẵn trên Ubuntu 24.04 và \`~/.bashrc\` mặc định đã nạp nó.

Lời giải tự động: \`labs/cka/sessions/s08/apply.sh\` (giá trị đọc bằng \`files/facts.sh\`, đúng cách verify dùng để chấm).`,
    exam: {
      patterns: [
        "Tạo một static pod trên một node cụ thể (ssh vào node, viết manifest vào `staticPodPath`) — kiểm bằng mirror pod `<tên>-<node>`.",
        "Tìm thông tin cluster để điền vào tệp đáp án: data-dir của etcd, đường dẫn chứng chỉ, service CIDR, ngày hết hạn chứng chỉ.",
        "Câu chứng chỉ: `kubeadm certs check-expiration`, gia hạn một chứng chỉ (`kubeadm certs renew`) — chặng 8 sẽ làm.",
        "Câu control plane hỏng: sửa một flag sai trong `/etc/kubernetes/manifests/kube-apiserver.yaml`, chờ kubelet tự chạy lại.",
      ],
      timeTargetMin: 5,
      drills: [
        {
          text: "Tạo static pod `probe` (image `busybox:1.37`, lệnh `sleep 3600`) trên cka-w2 rồi chứng minh nó Running. Giới hạn 4 phút. Làm xong thì xoá nó đi (verify của buổi không cần).",
          timeLimitMin: 4,
          solution: "```bash\nk run probe --image=busybox:1.37 $do --command -- sleep 3600 > probe.yaml\nscp probe.yaml cka-w2:/tmp/\nssh cka-w2 sudo mv /tmp/probe.yaml /etc/kubernetes/manifests/\nk get pod probe-cka-w2 -w\n# dọn:\nssh cka-w2 sudo rm /etc/kubernetes/manifests/probe.yaml\n```\n`staticPodPath` lấy từ `/var/lib/kubelet/config.yaml` của chính node đó — đề có thể đổi đường dẫn.",
        },
        {
          text: "Trong 2 phút: cho biết thư mục dữ liệu của etcd và địa chỉ (host:port) mà apiserver dùng để gọi etcd.",
          timeLimitMin: 2,
          solution: "```bash\nsudo grep -E -- '--data-dir' /etc/kubernetes/manifests/etcd.yaml\nsudo grep -E -- '--etcd-servers' /etc/kubernetes/manifests/kube-apiserver.yaml   # https://127.0.0.1:2379\n```",
        },
      ],
    },
    tips: [
      "Không nhớ một flag nằm ở đâu? `sudo grep -r <từ-khoá> /etc/kubernetes/manifests/` trước, rồi mới tra docs.",
      "Static pod: xoá mirror pod vô ích; xoá hoặc dời tệp manifest trên node mới dừng được Pod.",
      "Đừng để tệp sao lưu (vd. `kube-apiserver.yaml.bak`) trong `/etc/kubernetes/manifests`: kubelet đọc mọi tệp trong thư mục, sao lưu ra chỗ khác.",
      "Bật completion cho `k` ngay đầu giờ thi: `k get po <Tab>` gợi tên Pod, đỡ gõ sai tên dài.",
    ],
    outcome: {
      md: `Bạn đã đọc được cluster từ bên trong: sáu giá trị cốt lõi trong \`~/drills/s08/answers.env\`, một static pod chạy trên \`cka-w1\`, và shell trên cka-cp có completion cho \`k\`. Trên Mac:

\`\`\`bash
./labs/lab verify cka s08
\`\`\`

Verify tự đọc sáu giá trị trên cluster bằng chính lệnh trong Cách xử lý rồi so với tệp của bạn (giá trị dưới đây là của máy soạn bài).`,
      verifyOutput: "lab: kiểm s08\n  ✓ answers.env: ETCD_DATA_DIR=/var/lib/etcd\n  ✓ answers.env: APISERVER_ADVERTISE_ADDRESS=192.168.252.29\n  ✓ answers.env: POD_CIDR=10.244.0.0/16\n  ✓ answers.env: SERVICE_CIDR=10.96.0.0/12\n  ✓ answers.env: KUBELET_CGROUP_DRIVER=systemd\n  ✓ answers.env: APISERVER_CERT_EXPIRY=2027-11-13\n  ✓ Pod web-static-cka-w1 Running\n  ✓ ~/.bashrc có source <(kubectl completion bash)\n  ✓ ~/.bashrc có complete -F __start_kubectl k\n  ✓ shell tương tác: complete -p k dùng __start_kubectl\n  → 10/10 đạt",
      projectDelta: "Cluster của shop giờ có \"bản đồ\": bạn biết control plane nằm ở tệp nào, ai có quyền gì qua kubeconfig, và kubelet nối với containerd/Calico ra sao — nền cho buổi sự cố s09 và cho mọi câu troubleshooting control plane sau này.",
    },
    review: [
      { q: "kubelet biết chạy static pod từ thư mục nào, và đọc điều đó ở đâu?", a: "`staticPodPath` trong `/var/lib/kubelet/config.yaml`; với kubeadm là `/etc/kubernetes/manifests`." },
      { q: "`kubectl delete pod web-static-cka-w1` rồi Pod lại hiện ra. Vì sao, xoá thật thế nào?", a: "Đó là mirror pod; kubelet trên cka-w1 giữ Pod theo tệp manifest và tạo lại bóng của nó. Xoá/dời `/etc/kubernetes/manifests/web-static.yaml` trên cka-w1." },
      { q: "Pod CIDR và service CIDR của cluster kubeadm đọc ở đâu?", a: "Pod CIDR: `--cluster-cidr` trong manifest kube-controller-manager (hoặc `podSubnet` trong ConfigMap kubeadm-config). Service CIDR: `--service-cluster-ip-range` trong manifest kube-apiserver (hoặc `serviceSubnet`)." },
      { q: "`admin.conf` và `super-admin.conf` khác nhau thế nào?", a: "`admin.conf`: chứng chỉ `O=kubeadm:cluster-admins`, có quyền cluster-admin qua RBAC. `super-admin.conf`: `O=system:masters`, vượt mọi RBAC — chìa khoá dự phòng, không dùng hằng ngày." },
      { q: "CRI, CNI, CSI trên cluster lab nối kubelet/runtime với gì?", a: "CRI: kubelet → containerd qua `containerRuntimeEndpoint` trong `/var/lib/kubelet/config.yaml` (`unix:///var/run/containerd/containerd.sock`). CNI: containerd → Calico (`/etc/cni/net.d/10-calico.conflist`, binary ở `/opt/cni/bin`). CSI: chưa có driver nào (`kubectl get csidrivers` rỗng)." },
    ],
  },

  // ───────────────────────────── s09 ─────────────────────────────
  {
    id: "s09",
    stage: "st1",
    title: "Sự cố chặng 1: node NotReady",
    durationMin: 75,
    domain: "troubleshooting",
    competencies: ["ts-nodes"],
    requires: ["s08"],
    status: "published",
    pieces: [],
    goals: [
      "Đưa hai worker NotReady về Ready trong 20 phút mà không biết trước lỗi gì.",
      "Đi đúng quy trình: node conditions → systemctl status kubelet → journalctl → tệp cấu hình, không đoán mò.",
      "Biết kubelet lấy đối số từ những tệp nào và tệp nào thắng.",
    ],
    skills: [
      { skill: "k-node-conditions", level: "Đọc hiểu được" },
      { skill: "k-kubelet-status", level: "Thành phản xạ" },
      { skill: "k-kubelet-journal", level: "Thành phản xạ" },
      { skill: "k-kubelet-dropin", level: "Biết đường dẫn không tra" },
      { skill: "k-node-notready-flow", level: "Dưới 10 phút" },
      { skill: "lx-systemctl-cat", level: "Gõ được không tra" },
    ],
    uses: ["k-get-nodes-wide", "lx-daemon-reload", "lx-systemctl-unit", "k-kubelet-config", "net-ssh-node"],
    foundation: {
      area: "linux",
      md: `**Đọc log kubelet cho nhanh.** kubelet ghi rất nhiều; một phút có thể vài trăm dòng \`I…\` (info). Ba kỹ năng giúp bạn tìm đúng dòng:

**1. Biết định dạng một dòng.** Log kubelet theo định dạng klog: \`<mức><MMDD> <giờ> <pid> <tệp nguồn:dòng>] "<thông điệp>" khoá=giá-trị…\`. Chữ cái đầu là mức: \`I\` info, \`W\` warning, \`E\` error, \`F\` fatal. journald thêm phía trước thời điểm, tên máy và \`kubelet[<pid>]:\`. Ví dụ thật trên lab:

\`\`\`text
Nov 13 21:57:56 cka-cp kubelet[8673]: I1113 21:57:56.457970    8673 server.go:1448] "Using cgroup driver setting received from the CRI runtime" cgroupDriver="systemd"
\`\`\`

**2. Lọc theo thời gian và theo mức.** Mức của journald (\`-p err\`) không khớp với chữ cái của klog — kubelet ghi mọi thứ ra stderr, nên lọc bằng \`grep\` trên chữ cái đầu của phần klog:

\`\`\`bash
journalctl -u kubelet --since "5 min ago" --no-pager | tail -30
journalctl -u kubelet -b --no-pager | grep -E ': [EF][0-9]{4} ' | tail -20   # chỉ E và F
journalctl -u kubelet -n 50 --no-pager -o cat                              # bỏ tiền tố journald
\`\`\`

**3. Nhận ra ba hình dạng của một kubelet hỏng.**

| \`systemctl status kubelet\` | Nghĩa là | Tìm tiếp ở đâu |
|---|---|---|
| \`active (running)\` nhưng node vẫn NotReady | kubelet chạy mà không báo được về apiserver, hoặc runtime/mạng hỏng | Dòng \`E…\` trong journal: chứng chỉ, kết nối apiserver, CNI |
| \`activating (auto-restart)\`, \`status=1/FAILURE\` | Tiến trình chết ngay khi khởi động, systemd khởi động lại sau \`RestartSec=10\` | Vài dòng **cuối cùng trước mỗi lần thoát**: \`journalctl -u kubelet -n 20\`; thường là lỗi đọc cấu hình hoặc flag sai |
| \`inactive (dead)\`, có thể kèm \`disabled\` | Không ai khởi động nó | \`systemctl is-enabled kubelet\`; journal có dòng \`Stopped kubelet…\` cho biết lúc nào |

**Bài tập nền (5 phút, làm trên cka-cp trước khi \`begin\`):** \`journalctl -u kubelet -n 5 --no-pager\`, chỉ ra mức, tệp nguồn và thông điệp của từng dòng; rồi \`systemctl show kubelet -p NRestarts,ActiveEnterTimestamp\` — số lần systemd đã khởi động lại kubelet.

Đọc thêm: quy trình đầy đủ ở [CKA Study Guide, chương 22](#/docs/ckabook-22).`,
    },
    mindset: `**Node NotReady = "lâu rồi không nghe tin từ kubelet".** Node không tự báo mình hỏng: kubelet trên node định kỳ gửi trạng thái (heartbeat qua Lease và status của Node). Khi heartbeat ngừng quá thời gian ân hạn, controller trong control plane đặt điều kiện \`Ready\` thành \`Unknown\` và \`kubectl get nodes\` hiện \`NotReady\`; \`kubectl describe node\` ghi \`Kubelet stopped posting node status\`. Với người làm Java: giống một instance trong service registry bị đánh dấu DOWN vì hết hạn heartbeat — registry không biết instance chết vì sao, chỉ biết nó im lặng. Vì vậy **câu trả lời không bao giờ nằm ở kubectl**: phải \`ssh\` vào node.

**Quy trình, không đoán.** Bốn bước, mỗi bước thu hẹp vùng nghi ngờ:
1. **Node nào, từ lúc nào?** \`kubectl get nodes\`, \`kubectl describe node <node>\` (Conditions, Events).
2. **kubelet có chạy không?** \`ssh <node>\`, \`systemctl status kubelet\` — một trong ba hình dạng ở phần Nền tảng.
3. **Vì sao?** \`journalctl -u kubelet\` — dòng lỗi cuối trước khi thoát.
4. **Cấu hình nào gây ra?** \`systemctl cat kubelet\` để thấy **mọi** nơi đối số đến từ: drop-in \`10-kubeadm.conf\`, \`/var/lib/kubelet/kubeadm-flags.env\`, \`/etc/default/kubelet\`, \`/var/lib/kubelet/config.yaml\`.

**Tệp nào thắng?** \`ExecStart\` của drop-in nối bốn biến theo thứ tự \`$KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS\`. Một flag xuất hiện hai lần thì **lần sau cùng** có hiệu lực — trên lab, một \`--config=…\` đặt trong \`KUBELET_EXTRA_ARGS\` (tệp \`/etc/default/kubelet\`) đè \`--config=/var/lib/kubelet/config.yaml\` của drop-in (bạn sẽ thấy trong journal đường dẫn kubelet thật sự cố đọc). Đó là lý do chú thích trong \`10-kubeadm.conf\` gọi \`/etc/default/kubelet\` là chỗ ghi đè "as a last resort": mạnh nhất, nên cũng nguy hiểm nhất.

**Đừng sửa thứ chưa chứng minh là hỏng.** Hai worker hôm nay hỏng theo hai cách khác nhau; sửa theo thói quen ("restart kubelet là xong") sẽ chữa được một node và bỏ sót node kia. Ghi lại triệu chứng của từng node trước khi gõ lệnh sửa.`,
    refs: [
      { label: "Bài lộ trình CKA: Node NotReady — systemctl status kubelet → journalctl", href: "#/roadmap/cka/cka-w8-1" },
      { label: "Bài lộ trình CKA: Node components — kubelet", href: "#/roadmap/cka/cka-w1-2" },
      { label: "CKA Study Guide, chương 22 — Xử lý sự cố cluster (node NotReady)", href: "#/docs/ckabook-22" },
      { label: "CKA Study Guide, chương 4 — Cài đặt cluster (kubelet, kubeadm)", href: "#/docs/ckabook-04" },
      { label: "kubernetes.io: Troubleshooting Clusters", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
      { label: "kubernetes.io: Configuring each kubelet in your cluster using kubeadm (drop-in, kubeadm-flags.env, /etc/default/kubelet)", href: "https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/kubelet-integration/" },
      { label: "kubernetes.io: Node status — conditions, heartbeats", href: "https://kubernetes.io/docs/reference/node/node-status/" },
    ],
    stateIn: `Đầu ra s08: ba node \`Ready\`, Calico chạy, static pod \`web-static-cka-w1\` Running. Trên Mac chạy \`./labs/lab begin cka s09\`: lệnh kiểm đầu vào bằng verify của s08 rồi **gây sự cố** trên hai worker mà không nói đã làm gì. Bấm giờ 20 phút từ lúc lệnh in xong. Trong vòng khoảng một phút, \`kubectl get nodes\` trên cka-cp sẽ thấy hai worker \`NotReady\`. Đừng đọc \`labs/cka/breaks/\` trước khi làm xong.`,
    stateOut: "Ba node Ready, kubelet active và enabled trên cả hai worker, Deployment thử chạy được trên cả hai.",
    tasks: [
      { id: "t1", text: "Trên cka-cp: `kubectl get nodes`, `kubectl describe node cka-w1` và `cka-w2` — ghi lại Conditions, thời điểm và thông điệp. Ghi ra giấy: node nào, triệu chứng gì." },
      { id: "t2", text: "`ssh cka-w1`: `systemctl status kubelet` — kubelet ở hình dạng nào (running / auto-restart / dead)? Làm lại với `cka-w2`. Hai node có giống nhau không?" },
      { id: "t3", text: "Với node có kubelet khởi động lại liên tục: `journalctl -u kubelet -n 30 --no-pager` — tìm dòng lỗi cuối trước khi thoát; nó nhắc tới tệp nào?" },
      { id: "t4", text: "`systemctl cat kubelet` trên node đó, rồi xem từng tệp môi trường mà drop-in nạp. Tìm đối số không có trong cài đặt chuẩn và sửa tận gốc. Khởi động lại kubelet, theo dõi journal." },
      { id: "t5", text: "Với node còn lại: tìm vì sao kubelet không chạy và vì sao nó sẽ không tự chạy lại sau reboot. Sửa cả hai." },
      { id: "t6", text: "Trên cka-cp: `kubectl get nodes -w` tới khi ba node `Ready`. Ghi thời gian bạn đã dùng." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s09` phải đạt 8/8 (verify tạo một Deployment 2 replica buộc nằm trên hai node khác nhau, trong namespace tạm, rồi xoá)." },
    ],
    hints: [
      "`describe node` của cả hai worker đều nói `Kubelet stopped posting node status` — kubectl chỉ cho biết **triệu chứng**, giống nhau cho mọi nguyên nhân. Phân biệt hai node bằng `systemctl status kubelet`.",
      "`activating (auto-restart)` và journal lặp lại cùng một lỗi mỗi khoảng 10 giây: đọc dòng có `failed to load kubelet config file` (hoặc dòng `E`/`F` cuối cùng) — nó in đúng đường dẫn kubelet đang cố đọc. So với đường dẫn trong `10-kubeadm.conf`.",
      "Không tìm thấy chỗ đường dẫn sai trong drop-in? Nhìn dòng `EnvironmentFile=` của nó: có hai tệp môi trường. Tệp nào không phải do kubeadm sinh ra?",
      "`inactive (dead)`: xem cả dòng `Loaded:` — `disabled` nghĩa là reboot xong nó vẫn sẽ không chạy. Một lệnh sửa cả hai: `systemctl enable --now kubelet`.",
      "Sửa xong mà node vẫn NotReady thêm vài chục giây là bình thường: kubelet cần đăng ký lại và Calico trên node đó phải sẵn sàng. `kubectl get nodes -w`.",
    ],
    solution: `Quy trình dưới đây là cách tìm ra lỗi, không chỉ lệnh sửa. Output là của máy soạn bài.

**Bước 1 — Node nào, triệu chứng gì** (cka-cp):

\`\`\`bash
kubectl get nodes
# cka-w1   NotReady   <none>   …
# cka-w2   NotReady   <none>   …
kubectl describe node cka-w1 | sed -n '/Conditions:/,/Addresses:/p'
# Ready   Unknown   …   NodeStatusUnknown   Kubelet stopped posting node status.
\`\`\`

Cả hai node cùng một triệu chứng — từ đây phải lên node.

**Bước 2 — kubelet trên từng node**

\`\`\`bash
ssh cka-w1 systemctl status kubelet --no-pager | head -6
# Active: activating (auto-restart) (Result: exit-code) … status=1/FAILURE
ssh cka-w2 systemctl status kubelet --no-pager | head -6
# Loaded: … kubelet.service; disabled; …
# Active: inactive (dead)
\`\`\`

Hai hình dạng khác nhau = hai lỗi khác nhau.

**Bước 3 — cka-w1: vì sao kubelet chết?**

\`\`\`bash
ssh cka-w1
sudo journalctl -u kubelet -n 20 --no-pager
# Nov 13 23:43:34 cka-w1 systemd[1]: Started kubelet.service - kubelet: The Kubernetes Node Agent.
# Nov 13 23:43:34 cka-w1 kubelet[8777]: E1113 23:43:34.781752    8777 run.go:72] "command failed" err="failed to load kubelet config file, path: /var/lib/kubelet/kubelet-config.yaml, error: … open /var/lib/kubelet/kubelet-config.yaml: no such file or directory"
# Nov 13 23:43:34 cka-w1 systemd[1]: kubelet.service: Main process exited, code=exited, status=1/FAILURE
# Nov 13 23:43:44 cka-w1 systemd[1]: kubelet.service: Scheduled restart job, restart counter is at 6.
\`\`\`

kubelet cố đọc \`/var/lib/kubelet/kubelet-config.yaml\` — một tệp không tồn tại. Tệp chuẩn là \`/var/lib/kubelet/config.yaml\`.

**Bước 4 — cka-w1: đường dẫn sai đến từ đâu?**

\`\`\`bash
systemctl cat kubelet
# … Environment="KUBELET_CONFIG_ARGS=--config=/var/lib/kubelet/config.yaml"
# … EnvironmentFile=-/var/lib/kubelet/kubeadm-flags.env
# … EnvironmentFile=-/etc/default/kubelet
# … ExecStart=/usr/bin/kubelet $KUBELET_KUBECONFIG_ARGS $KUBELET_CONFIG_ARGS $KUBELET_KUBEADM_ARGS $KUBELET_EXTRA_ARGS
sudo cat /var/lib/kubelet/kubeadm-flags.env      # KUBELET_KUBEADM_ARGS=""  (kubeadm 1.36 để trống trên lab)
cat /etc/default/kubelet
# KUBELET_EXTRA_ARGS=--config=/var/lib/kubelet/kubelet-config.yaml   ← thủ phạm
\`\`\`

\`KUBELET_EXTRA_ARGS\` đứng cuối \`ExecStart\`, nên \`--config\` của nó đè \`--config\` chuẩn. Sửa tận gốc — trả tệp về như lúc cài gói:

\`\`\`bash
echo 'KUBELET_EXTRA_ARGS=' | sudo tee /etc/default/kubelet
sudo systemctl restart kubelet           # tệp môi trường đọc lại khi restart; không phải tệp unit nên không cần daemon-reload
systemctl is-active kubelet              # active
exit
\`\`\`

Không "sửa" bằng cách tạo tệp \`kubelet-config.yaml\`: node sẽ chạy nhưng cấu hình bị rẽ nhánh, lần nâng cấp kubeadm sau (chỉ cập nhật \`config.yaml\`) sẽ không áp vào.

**Bước 5 — cka-w2: dừng và tắt**

\`\`\`bash
ssh cka-w2
systemctl is-enabled kubelet             # disabled
sudo journalctl -u kubelet -n 3 --no-pager
# … Stopped kubelet.service - kubelet: The Kubernetes Node Agent.
sudo systemctl enable --now kubelet
systemctl is-active kubelet; systemctl is-enabled kubelet   # active / enabled
exit
\`\`\`

Chỉ \`start\` thì node lên lại hôm nay và chết sau lần reboot tới — loại lỗi tái phát khó chịu nhất. Không có dòng lỗi nào trong journal: không ai *làm hỏng* kubelet, người ta *tắt* nó.

**Bước 6 — xác nhận**

\`\`\`bash
kubectl get nodes -w                     # ba node Ready
\`\`\`

Rồi \`./labs/lab verify cka s09\`. Lời giải tự động \`labs/cka/sessions/s09/apply.sh\` chạy chính kịch bản gây lỗi rồi áp đúng hai cách sửa này, để selftest chứng minh cách sửa khớp lỗi.`,
    exam: {
      patterns: [
        "\"Node X đang NotReady, hãy sửa\" — ssh vào node, kubelet là nghi phạm số một: dừng/tắt, flag sai, đường dẫn cấu hình sai, chứng chỉ client sai, sai `containerRuntimeEndpoint`.",
        "Sửa xong phải bền: đề có thể kiểm sau khi reboot — `enable` lẫn `start`, sửa tệp chứ không chạy tay tiến trình.",
        "Biến thể control plane: kubelet chạy nhưng static pod apiserver không lên — chuyển sang `crictl ps -a` / `crictl logs` (chặng 8–9).",
      ],
      timeTargetMin: 8,
      drills: [
        {
          text: "Trên một worker, kubelet ở trạng thái `activating (auto-restart)`. Trong 3 phút, cho biết đường dẫn tệp cấu hình mà kubelet đang cố đọc và mọi tệp có thể đã cung cấp đường dẫn đó.",
          timeLimitMin: 3,
          solution: "```bash\nsudo journalctl -u kubelet -n 20 --no-pager | grep -i 'config file'\nsystemctl cat kubelet | grep -E 'Environment|ExecStart'\nsudo cat /var/lib/kubelet/kubeadm-flags.env /etc/default/kubelet\n```\nBa chỗ: `Environment=KUBELET_CONFIG_ARGS` trong drop-in, `kubeadm-flags.env`, `/etc/default/kubelet` — flag đứng sau thắng. (Thêm cả drop-in do người dùng tạo trong `/etc/systemd/system/kubelet.service.d/` nếu có: `systemctl cat` liệt kê hết.)",
        },
        {
          text: "Dừng kubelet của cka-w2 (`sudo systemctl stop kubelet`), đo xem bao lâu sau `kubectl get nodes` hiện NotReady, rồi khôi phục. Giới hạn 4 phút.",
          timeLimitMin: 4,
          solution: "```bash\nssh cka-w2 sudo systemctl stop kubelet; date\nkubectl get nodes -w            # ghi thời điểm cka-w2 thành NotReady\nssh cka-w2 sudo systemctl start kubelet\n```\nKhoảng chờ là thời gian ân hạn của node-lifecycle controller (`--node-monitor-grace-period` của kube-controller-manager). Container đang chạy trên node **không** bị dừng khi kubelet dừng — chỉ không còn ai báo cáo và quản lý chúng.",
        },
      ],
    },
    tips: [
      "Thứ tự cố định: `kubectl get nodes` → `ssh` → `systemctl status kubelet` → `journalctl -u kubelet` → `systemctl cat kubelet`. Đừng nhảy cóc sang sửa.",
      "`systemctl enable --now` = enable + start trong một lệnh; dùng nó mỗi khi sửa một dịch vụ bị tắt.",
      "Sửa unit/drop-in thì `systemctl daemon-reload` rồi restart; sửa tệp môi trường (`/etc/default/kubelet`, `kubeadm-flags.env`) hay `config.yaml` thì chỉ cần restart.",
      "Khi một lỗi lặp lại mỗi 10 giây trong journal, chỉ cần đọc **một** lần lặp đầy đủ: `journalctl -u kubelet -n 30`.",
    ],
    outcome: {
      md: `Hai worker đã về \`Ready\`, kubelet chạy và được bật lại cho các lần khởi động sau. Trên Mac:

\`\`\`bash
./labs/lab verify cka s09
\`\`\`

Dòng cuối do verify tự làm: tạo một Deployment 2 replica với anti-affinity bắt buộc theo hostname trong namespace tạm, chờ cả hai replica sẵn sàng trên đúng hai worker, rồi xoá namespace. Chặng 1 xong: mốc \`st1-done\`.`,
      verifyOutput: "lab: kiểm s09\n  ✓ node cka-cp Ready\n  ✓ node cka-w1 Ready\n  ✓ node cka-w2 Ready\n  ✓ cka-w1: kubelet active\n  ✓ cka-w1: kubelet enabled\n  ✓ cka-w2: kubelet active\n  ✓ cka-w2: kubelet enabled\n  ✓ Deployment thử 2 replica chạy trên hai worker\n  → 8/8 đạt",
      projectDelta: "Cluster của shop đã qua sự cố đầu tiên và có quy trình chẩn đoán node để dùng lại. Chặng 1 xong (mốc `st1-done`): chặng 2 bắt đầu đưa gateway, catalog, order lên thành Deployment.",
    },
    review: [
      { q: "Bốn bước chẩn đoán một node NotReady là gì?", a: "`kubectl get nodes` / `describe node` → ssh vào node, `systemctl status kubelet` → `journalctl -u kubelet` → `systemctl cat kubelet` và các tệp nó nạp (`10-kubeadm.conf`, `kubeadm-flags.env`, `/etc/default/kubelet`, `config.yaml`)." },
      { q: "kubelet nhận `--config` ở cả drop-in và `/etc/default/kubelet`. Cái nào thắng, vì sao?", a: "Cái trong `/etc/default/kubelet` (`KUBELET_EXTRA_ARGS`), vì biến đó đứng cuối `ExecStart` và với flag lặp lại thì lần sau cùng có hiệu lực." },
      { q: "Vì sao sửa kubelet bị tắt phải dùng `enable --now` chứ không chỉ `start`?", a: "`start` chỉ chạy bây giờ; unit vẫn `disabled` nên sau reboot kubelet không chạy và node lại NotReady." },
      { q: "`describe node` ghi `Kubelet stopped posting node status`. Câu này cho biết gì và không cho biết gì?", a: "Cho biết control plane không còn nhận heartbeat từ kubelet. Không cho biết vì sao (dừng, crash, mạng, chứng chỉ…) — phải lên node xem." },
    ],
  },
];
