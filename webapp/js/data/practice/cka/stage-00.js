// Chặng 0 — Môi trường và kỹ năng nền (ngoài domain đề thi: domain null).
// Năm buổi đã phát hành; script lab ở labs/cka/sessions/s01…s05 (đã chạy thật trên VM Multipass).
// outcome.verifyOutput chép từ output thật của `./labs/lab verify cka sNN` (IP và PID trên máy bạn sẽ khác).

export const sessions = [
  // ───────────────────────────── s01 ─────────────────────────────
  {
    id: "s01",
    stage: "st0",
    title: "Multipass, ba VM và ssh giữa các node",
    durationMin: 60,
    domain: null,
    competencies: [],
    requires: [],
    status: "published",
    pieces: ["vms"],
    goals: [
      "Bật được ba VM cka-cp, cka-w1, cka-w2 bằng `./labs/lab up cka` và vào từng máy bằng `multipass shell`.",
      "Từ cka-cp ssh sang hai worker bằng tên máy, không cần mật khẩu.",
      "Biết lúc nào cần `sudo -i` và đang đứng ở node nào trước khi gõ lệnh.",
    ],
    skills: [
      { skill: "lx-multipass-shell", level: "Gõ được không tra" },
      { skill: "lx-sudo-i", level: "Gõ được không tra" },
      { skill: "lx-ssh-keygen", level: "Gõ được không tra" },
      { skill: "lx-authorized-keys", level: "Biết đường dẫn và quyền đúng" },
      { skill: "net-etc-hosts", level: "Sửa được trong 1 phút" },
      { skill: "net-getent-hosts", level: "Gõ được không tra" },
      { skill: "net-ssh-node", level: "Thành phản xạ" },
    ],
    uses: [],
    foundation: {
      area: "linux",
      md: `**ssh bằng khoá, trong 5 phút.** ssh có hai cặp khoá khác nhau, hay bị lẫn:

| Khoá | Nằm ở đâu | Dùng để |
|---|---|---|
| Khoá **host** của máy đích | \`/etc/ssh/ssh_host_*_key\` trên máy đích; dấu vân tay được máy nguồn nhớ trong \`~/.ssh/known_hosts\` | Máy nguồn chắc mình đang nói chuyện đúng máy (lần đầu ssh hỏi \`yes/no\` chính là câu này) |
| Khoá **user** của bạn | \`~/.ssh/id_ed25519\` (bí mật) và \`~/.ssh/id_ed25519.pub\` (công khai) trên máy nguồn | Máy đích nhận bạn là ai: nó so khoá công khai với từng dòng trong \`~/.ssh/authorized_keys\` của user đích |

Quyền: \`700\` cho \`~/.ssh\`, \`600\` cho \`authorized_keys\` và khoá bí mật là giá trị an toàn nên dùng. \`sshd\` (\`StrictModes yes\`) từ chối khoá khi home, \`~/.ssh\` hoặc \`authorized_keys\` **cho người khác ghi** hoặc **sai chủ**, và ghi lý do vào journal: \`Authentication refused: bad ownership or modes for file …\`. Trên VM này đăng nhập bằng mật khẩu đã tắt, nên phía bạn chỉ thấy \`Permission denied (publickey)\`. (\`755\`/\`644\` vẫn được chấp nhận; Ubuntu còn cho phép nhóm ghi khi nhóm là nhóm riêng của user.) Còn khoá bí mật mở quá rộng thì chính **ssh client** từ chối dùng: \`WARNING: UNPROTECTED PRIVATE KEY FILE!\`.

VM Multipass **không có mật khẩu** cho user \`ubuntu\` và tắt đăng nhập bằng mật khẩu, nên \`ssh-copy-id\` không chạy được. Bạn phải tự chép khoá công khai sang — ở đây qua máy Mac, vì Mac vào được mọi VM bằng \`multipass exec\`.

**Phân giải tên.** \`getent hosts <tên>\` hỏi đúng thứ tự mà mọi chương trình (ssh, curl, Java) dùng: \`/etc/hosts\` trước, rồi DNS (theo \`/etc/nsswitch.conf\`). \`ping\` cũng đi qua nsswitch (nhưng còn đòi máy kia trả lời ICMP). \`nslookup\`/\`dig\` thì **không** đi qua nsswitch mà hỏi thẳng máy chủ DNS ghi trong \`/etc/resolv.conf\`. Trên Ubuntu đó là stub \`systemd-resolved\` (\`127.0.0.53\`), vốn tự trả lời từ \`/etc/hosts\` (\`ReadEtcHosts=yes\` mặc định) — nên trên VM lab \`nslookup cka-w1\` vẫn ra đúng IP, nhưng ở máy mà resolv.conf trỏ thẳng một DNS khác thì có thể không. Kiểm tên bằng \`getent hosts\`, đúng đường mà ssh, curl, Java dùng.

**Bẫy riêng của VM cloud:** đọc dòng đầu \`/etc/hosts\` trên VM — cloud-init ghi rằng tệp được **sinh lại mỗi lần khởi động** (\`manage_etc_hosts: True\`). Sửa \`/etc/hosts\` có tác dụng ngay nhưng mất sau reboot; muốn bền phải sửa cả mẫu \`/etc/cloud/templates/hosts.debian.tmpl\`.

**Bài tập nền (10 phút, trên cka-cp):**
1. \`cat /etc/nsswitch.conf | grep hosts\` — đọc thứ tự \`files dns\`.
2. \`getent hosts cka-w1; echo $?\` — chưa khai thì in rỗng, mã thoát 2.
3. \`ls -la ~/.ssh\` — đã có \`authorized_keys\` chứa khoá của Multipass; bạn sẽ **thêm** dòng mới, không ghi đè.
4. \`whoami; sudo -i; whoami; exit\` — để ý dấu nhắc đổi từ \`$\` sang \`#\`.

Đọc thêm: phần Linux & command line trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `Trong phòng thi, mỗi câu bắt đầu bằng một dòng kiểu \`ssh cka-w1\`: bạn được giao **đúng một node**, làm xong phải \`exit\` về máy gốc. Ba VM của bạn mô phỏng đúng điều đó: cka-cp là chỗ đứng chính, hai worker là nơi bạn "nhảy" sang khi câu hỏi nói về kubelet hay containerd của node đó.

Với người làm Java, hãy coi mỗi VM như một **máy chủ ứng dụng riêng** chứ không phải một container: nó có hostname, IP, user, ổ đĩa và systemd riêng. Kubernetes sau này chỉ là thêm một lớp điều phối lên ba máy chủ ấy — mọi lỗi "node" trong đề thi đều là lỗi Linux trên một máy như thế này.

Hai câu luôn tự hỏi trước khi gõ: **Mình đang ở máy nào?** (đọc dấu nhắc \`ubuntu@cka-cp\`) và **mình đang là ai?** (\`$\` hay \`#\`). Phần lớn lỗi "lệnh không chạy" ở chặng sau là gõ đúng lệnh trên sai node hoặc thiếu quyền root.

Cuối cùng, tập để ý **ai sở hữu tệp bạn sửa**: \`/etc/hosts\` ở đây bị cloud-init ghi đè, giống như sau này sửa trực tiếp một Pod của Deployment sẽ bị controller đè lại. Sửa ở nguồn, không sửa ở bản sinh ra.`,
    refs: [
      { label: "Kiến thức nền tảng — Linux, quyền tệp, biến môi trường", href: "#/docs/prerequisites" },
      { label: "Bài lộ trình CKA: Node components (kubelet chạy trên từng node)", href: "#/roadmap/cka/cka-w1-2" },
      { label: "Multipass: multipass shell / exec / transfer", href: "https://canonical.com/multipass/docs/multipass-cli-commands" },
      { label: "Ubuntu: OpenSSH server — khoá và authorized_keys", href: "https://documentation.ubuntu.com/server/how-to/security/openssh-server/" },
      { label: "cloud-init: manage_etc_hosts", href: "https://cloudinit.readthedocs.io/en/latest/reference/modules.html#update-etc-hosts" },
    ],
    stateIn: `Máy Mac đã cài Multipass và Docker, bạn đứng ở **gốc repo** trong terminal. Có thể chưa có VM \`cka-*\` nào: \`./labs/lab up cka\` tạo ba VM Ubuntu 24.04 trống (lần đầu mất vài phút), các lần sau chỉ khởi động lại. Đây là buổi đầu nên \`./labs/lab begin cka s01\` chỉ kiểm ba VM đang chạy.`,
    stateOut: "Ba VM Running, phân giải được tên nhau qua /etc/hosts; cka-cp ssh sang cka-w1, cka-w2 không hỏi mật khẩu.",
    tasks: [
      { id: "t1", text: "Trên Mac: `./labs/lab up cka` rồi `./labs/lab status cka`; chép ba IP ra giấy nháp." },
      { id: "t2", text: "Vào từng máy bằng `multipass shell cka-cp` (và `cka-w1`, `cka-w2`), đọc `hostname`, `ip -br addr`, dòng đầu của `/etc/hosts`; `exit` để ra." },
      { id: "t3", text: "Trên **cả ba** VM: thêm ba dòng `<IP> <tên>` vào `/etc/hosts` **và** vào `/etc/cloud/templates/hosts.debian.tmpl` (bằng `sudo vim`); kiểm bằng `getent hosts cka-w1`." },
      { id: "t4", text: "Trên cka-cp: `ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519` (user `ubuntu`, không phải root)." },
      { id: "t5", text: "Từ Mac, chép khoá công khai của cka-cp vào cuối `~/.ssh/authorized_keys` của user `ubuntu` trên `cka-w1` và `cka-w2` (xem gợi ý 2)." },
      { id: "t6", text: "Trên cka-cp: `ssh cka-w1`, trả lời `yes` câu hỏi khoá host, `hostname`, `exit`; làm lại với `cka-w2`. Rồi thử `ssh -o BatchMode=yes cka-w1 hostname` phải chạy không hỏi gì." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s01` phải đạt 11/11." },
    ],
    hints: [
      "Dòng hosts dạng `192.168.x.y cka-w1`. Không xoá dòng `127.0.1.1 <tên máy>` sẵn có; chỉ thêm ba dòng mới ở cuối. Lấy IP thật từ `./labs/lab status cka`, IP trên máy bạn khác ví dụ.",
      "Không có mật khẩu nên không dùng được `ssh-copy-id`. Nối hai lệnh exec qua pipe trên Mac: `multipass exec cka-cp -- cat /home/ubuntu/.ssh/id_ed25519.pub | multipass exec cka-w1 -- bash -c 'cat >> ~/.ssh/authorized_keys'`. Dùng `>>` (nối thêm), không phải `>` (ghi đè sẽ xoá khoá của Multipass và bạn mất `multipass shell`).",
      "`ssh -o BatchMode=yes` cấm mọi câu hỏi tương tác: nếu chưa từng trả lời `yes` cho khoá host thì nó báo `Host key verification failed`. Ssh tay một lần, hoặc `ssh-keyscan cka-w1 >> ~/.ssh/known_hosts`.",
      "`Permission denied (publickey)`: xem lý do trên worker bằng `sudo journalctl -u ssh -n 20` — `bad ownership or modes` nghĩa là thư mục home, `~/.ssh` hay `authorized_keys` cho người khác ghi hoặc sai chủ (đưa về `700`/`600`, chủ `ubuntu`). Không có dòng đó thì thường là khoá chưa được chép vào đúng `authorized_keys` của user `ubuntu`. Cẩn thận: `multipass shell`/`exec` cũng đăng nhập bằng khoá trong chính tệp này — làm hỏng quyền là mất luôn đường vào VM.",
    ],
    solution: `**1. Khai tên ba máy** — làm giống hệt trên cả ba VM. Ví dụ với IP lấy từ \`./labs/lab status cka\`:

\`\`\`bash
multipass shell cka-cp
sudo vim /etc/hosts                          # G để xuống cuối, o để mở dòng mới, gõ:
# 192.168.252.11 cka-cp
# 192.168.252.12 cka-w1
# 192.168.252.13 cka-w2
sudo vim /etc/cloud/templates/hosts.debian.tmpl   # thêm đúng ba dòng đó ở cuối mẫu
getent hosts cka-w1 cka-w2                   # mỗi tên một dòng, đúng IP
exit
\`\`\`

Vì sao cả mẫu: cloud-init dựng lại \`/etc/hosts\` từ \`hosts.debian.tmpl\` ở mỗi lần boot. Chỉ sửa \`/etc/hosts\` thì hôm nay chạy, mai bật VM lại thì mất — đúng kiểu lỗi "hôm qua còn được" khó tìm nhất.

**2. Cặp khoá trên cka-cp** (là user \`ubuntu\`, vì bạn sẽ ssh bằng user này):

\`\`\`bash
multipass shell cka-cp
ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519
exit
\`\`\`

\`-N ''\` là passphrase rỗng — chấp nhận được cho lab, không dùng cho máy thật.

**3. Phát khoá công khai** — từ Mac, vì Mac là thứ duy nhất đang vào được mọi VM:

\`\`\`bash
for w in cka-w1 cka-w2; do
  multipass exec cka-cp -- cat /home/ubuntu/.ssh/id_ed25519.pub \\
    | multipass exec $w -- bash -c 'cat >> ~/.ssh/authorized_keys'
done
\`\`\`

**4. Lần ssh đầu tiên** trên cka-cp: \`ssh cka-w1\` → \`yes\` → \`hostname\` in \`cka-w1\` → \`exit\`. Lần đầu ssh ghi khoá host của worker vào \`~/.ssh/known_hosts\`; từ đó \`ssh -o BatchMode=yes cka-w1 hostname\` chạy không hỏi gì — đó là điều \`verify\` kiểm.

**5. Kiểm:** \`./labs/lab verify cka s01\` trên Mac.

Lời giải chuẩn tự động nằm ở \`labs/cka/sessions/s01/apply.sh\` (làm đúng các bước trên, chạy lại nhiều lần được).`,
    exam: {
      patterns: [
        "Mỗi câu mở đầu bằng `ssh <node>`; làm xong phải `exit` về máy gốc trước câu sau — quên `exit` là làm câu sau trên sai node.",
        "Câu sửa kubelet, containerd hay static pod luôn cần `sudo -i` trên node được giao; câu kubectl thì không.",
        "Câu join worker hay sửa node NotReady giả định bạn tự ssh được giữa các node bằng tên.",
      ],
      timeTargetMin: 1,
      drills: [
        {
          text: "Từ cka-cp: vào cka-w2, trở thành root, in hostname và tên user hiện tại trên một dòng, rồi quay về cka-cp. Giới hạn 1 phút.",
          timeLimitMin: 1,
          solution: "```bash\nssh cka-w2\nsudo -i\necho \"$(hostname) $(whoami)\"   # cka-w2 root\nexit   # thoát root\nexit   # thoát ssh, dấu nhắc lại là ubuntu@cka-cp\n```\nHai lần `exit`: một cho `sudo -i`, một cho ssh. Luôn nhìn dấu nhắc trước khi sang câu sau.",
        },
      ],
    },
    tips: [
      "Đặt `ubuntu@cka-cp` làm \"nhà\": mọi việc bắt đầu và kết thúc ở đó. Nhìn dấu nhắc trước khi gõ.",
      "Dùng `>>` khi thêm khoá vào `authorized_keys`; `>` ghi đè sẽ xoá khoá Multipass và khoá bạn khỏi `multipass shell`.",
      "`getent hosts` là cách kiểm phân giải tên đúng nhất. `nslookup`/`dig` bỏ qua nsswitch; trên Ubuntu chúng chỉ thấy `/etc/hosts` nhờ stub `systemd-resolved` — đừng dựa vào điều đó (trong Pod, `/etc/resolv.conf` trỏ CoreDNS và câu trả lời có thể khác).",
      "Khi một tệp có dòng chú thích kiểu \"tệp này được sinh tự động\", tìm nguồn sinh ra nó trước khi sửa.",
    ],
    outcome: {
      md: `Ba VM đang chạy, mỗi máy biết tên hai máy kia, và từ \`cka-cp\` bạn ssh sang hai worker không cần mật khẩu — đúng tư thế phòng thi. Trên Mac chạy:

\`\`\`bash
./labs/lab verify cka s01
\`\`\`

Kết quả phải là 11/11 (IP trên máy bạn khác ví dụ dưới).`,
      verifyOutput: "lab: kiểm s01\n  ✓ cka-cp đang Running\n  ✓ cka-w1 đang Running\n  ✓ cka-w2 đang Running\n  ✓ cka-cp: getent hosts cka-w1 → 192.168.252.24\n  ✓ cka-cp: getent hosts cka-w2 → 192.168.252.25\n  ✓ cka-w1: getent hosts cka-cp → 192.168.252.23\n  ✓ cka-w1: getent hosts cka-w2 → 192.168.252.25\n  ✓ cka-w2: getent hosts cka-cp → 192.168.252.23\n  ✓ cka-w2: getent hosts cka-w1 → 192.168.252.24\n  ✓ cka-cp: ssh -o BatchMode=yes cka-w1 hostname\n  ✓ cka-cp: ssh -o BatchMode=yes cka-w2 hostname\n  → 11/11 đạt",
      projectDelta: "Có **ba VM** `cka-cp`, `cka-w1`, `cka-w2` — ba node tương lai của cluster kubeadm chạy hệ thống shop.",
    },
    review: [
      { q: "Vì sao `ssh-copy-id` không dùng được với VM Multipass, và bạn đã chép khoá bằng cách nào?", a: "User `ubuntu` không có mật khẩu và sshd tắt đăng nhập bằng mật khẩu. Chép qua Mac: `multipass exec cka-cp -- cat …/id_ed25519.pub | multipass exec cka-w1 -- bash -c 'cat >> ~/.ssh/authorized_keys'`." },
      { q: "Sửa `/etc/hosts` trên VM xong, reboot thì mất. Vì sao, sửa ở đâu?", a: "cloud-init có `manage_etc_hosts: true`, dựng lại `/etc/hosts` mỗi lần boot từ `/etc/cloud/templates/hosts.debian.tmpl`. Sửa cả mẫu đó." },
      { q: "`ssh -o BatchMode=yes cka-w1` báo `Host key verification failed`. Thiếu gì?", a: "Khoá host của cka-w1 chưa có trong `~/.ssh/known_hosts` của cka-cp. Ssh tay một lần trả lời `yes`, hoặc `ssh-keyscan cka-w1 >> ~/.ssh/known_hosts`." },
      { q: "Quyền nên dùng cho `~/.ssh` và `authorized_keys` là gì, và sshd từ chối khoá khi nào?", a: "`700` cho thư mục, `600` cho tệp, chủ là user đích. sshd (StrictModes) từ chối khi home, `~/.ssh` hay `authorized_keys` cho người khác ghi hoặc sai chủ, và ghi `Authentication refused: bad ownership or modes …` vào journal (`journalctl -u ssh`). Khoá bí mật mở quá rộng thì ssh client từ chối dùng." },
    ],
  },

  // ───────────────────────────── s02 ─────────────────────────────
  {
    id: "s02",
    stage: "st0",
    title: "vim, tmux và bash tốc độ phòng thi",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s01"],
    status: "published",
    pieces: [],
    goals: [
      "Có ~/.vimrc, ~/.tmux.conf và ~/.bashrc (alias k, $do, $now) dựng lại được trong dưới 2 phút như đầu giờ thi.",
      "Sửa một tệp YAML hỏng thụt lề bằng vim: nhảy dòng lỗi, thụt cả khối, thay thế hàng loạt.",
      "Chia tmux hai pane: một pane sửa manifest, một pane chạy kubectl.",
    ],
    skills: [
      { skill: "vim-vimrc-yaml", level: "Gõ được không tra" },
      { skill: "vim-move-jump", level: "Thành phản xạ" },
      { skill: "vim-delete-yank", level: "Thành phản xạ" },
      { skill: "vim-visual-indent", level: "Dưới 10 giây một khối" },
      { skill: "vim-substitute", level: "Gõ được không tra" },
      { skill: "lx-tmux-panes", level: "Gõ được không tra" },
      { skill: "k-alias-k", level: "Gõ được không tra" },
      { skill: "k-exam-vars", level: "Gõ được không tra" },
    ],
    uses: ["lx-multipass-shell", "net-ssh-node"],
    foundation: {
      area: "vim",
      md: `**vim có chế độ, và YAML ghét tab.** Ba chế độ cần nhớ: *Normal* (di chuyển, xoá, chép — mặc định, về bằng \`Esc\`), *Insert* (\`i\`, \`a\`, \`o\` để gõ chữ), *Visual* (\`V\` chọn theo dòng). Mọi lệnh dưới đây gõ ở Normal.

YAML dùng **thụt lề bằng dấu cách** để biểu diễn cấu trúc; một ký tự tab là lỗi parse ngay (\`found character '\\t' that cannot start any token\`). Vì thế dòng quan trọng nhất của \`~/.vimrc\` là:

\`\`\`vim
set expandtab tabstop=2 shiftwidth=2
\`\`\`

\`expandtab\` biến phím Tab thành dấu cách, \`tabstop=2\` là độ rộng hiển thị một tab, \`shiftwidth=2\` là số cột mà \`>\`/\`<\` dịch một khối — đúng 2 cột của manifest Kubernetes.

| Việc | Phím |
|---|---|
| Đầu / cuối tệp, tới dòng 42 | \`gg\`, \`G\`, \`42G\` hoặc \`:42\` |
| Tìm, tìm tiếp | \`/resources\` Enter, \`n\` |
| Xoá dòng, 5 dòng, tới hết tệp, hoàn tác | \`dd\`, \`5dd\`, \`dG\`, \`u\` (làm lại: \`Ctrl-r\`) |
| Chép dòng, dán dưới | \`yy\`, \`p\` |
| Thụt cả khối 1 bậc | \`V\` rồi \`j\`… chọn, \`>\` (ngược lại \`<\`); hoặc \`:27,32>\` |
| Thay hàng loạt | \`:%s/cũ/mới/g\`, có hỏi từng chỗ thêm \`c\` |
| Nhìn thấy tab | \`:set list\` (tab hiện \`^I\`), đổi hết tab sang dấu cách: \`:retab\` |
| Dán khối từ trình duyệt không bị "bậc thang" | \`:set paste\`, \`o\`, dán, \`Esc\`, \`:set nopaste\` |

vim 9 trên Ubuntu 24.04 thường tự nhận ra thao tác dán (bracketed paste) nên ít khi vỡ thụt lề; nhưng terminal phòng thi hay một phiên ssh lồng có thể không, khi đó \`:set paste\` cứu bạn.

**tmux** giữ nhiều cửa sổ terminal trong một phiên: \`tmux new -s exam\`; phím tiền tố \`Ctrl-b\` rồi \`%\` (chia dọc), \`"\` (chia ngang), \`o\` (sang pane kia), \`z\` (phóng to/thu nhỏ pane), \`d\` (tách ra, quay lại bằng \`tmux a -t exam\`).

**bash:** \`alias\` thay một từ bằng lệnh khác; \`export\` đặt biến môi trường. Viết vào \`~/.bashrc\` để mọi shell mới đều có, rồi \`source ~/.bashrc\` cho shell đang mở.

**Bài tập nền (10 phút):** mở \`vimtutor\` trên cka-cp, làm bài 1–2. Rồi \`vim /tmp/x.yaml\`, gõ một khối YAML ba bậc, thử \`V\`+\`>\` và \`u\` tới khi tay quen. Đọc thêm phần vim trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `Trong phòng thi bạn **không viết YAML từ đầu**: bạn sinh khung bằng \`kubectl … --dry-run=client -o yaml\`, chép đoạn mẫu từ kubernetes.io, rồi sửa bằng vim. Vì thế tốc độ ở đây không phải gõ nhanh mà là **sửa nhanh**: nhảy đúng dòng, thụt cả khối, thay cả loạt.

Với người làm Java, hãy coi vim như phím tắt của IDE nhưng không có IDE: \`>\` là "Indent block", \`:%s\` là "Replace all", \`:42\` là "Go to line". Bộ \`~/.vimrc\` 1 dòng giống \`.editorconfig\` của project — đặt một lần, không bao giờ cãi nhau với tab nữa.

Cách đọc lỗi YAML giống đọc stacktrace: parser báo **dòng và cột nơi nó bỏ cuộc**, chỗ sai thật thường nằm **ngay trên** dòng đó (một khối thụt sai làm dòng sau trở nên vô nghĩa). Nhảy tới dòng được báo, nhìn lên vài dòng.

Ba biến \`k\`, \`$do\`, \`$now\` là "macro" phòng thi: \`k run x --image=y $do > x.yaml\` thay cho câu lệnh dài, \`k delete pod x $now\` không phải đợi 30 giây. Môi trường thi hiện nay đã đặt sẵn \`alias k=kubectl\` và autocomplete, nhưng hai biến còn lại thì bạn tự gõ — tập ở đây cho thành phản xạ 20 giây đầu giờ.`,
    refs: [
      { label: "Kiến thức nền tảng — Phần 2: vim và Phần 4: YAML", href: "#/docs/prerequisites" },
      { label: "Thực hành nhanh: lệnh kubectl (alias k, $do)", href: "#/commands" },
      { label: "kubernetes.io: kubectl Quick Reference (alias, autocomplete)", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
      { label: "tmux Getting Started", href: "https://github.com/tmux/tmux/wiki/Getting-Started" },
      { label: "Linux Foundation: môi trường thi CKA (alias k có sẵn)", href: "https://docs.linuxfoundation.org/tc-docs/certification/tips-cka-and-ckad" },
    ],
    stateIn: `Đầu ra s01: ba VM Running, phân giải được tên nhau, \`cka-cp\` ssh sang hai worker không mật khẩu. Trên Mac chạy \`./labs/lab begin cka s02\`: lệnh kiểm đầu vào bằng verify của s01 rồi đặt tệp bài tập \`~/drills/s02/broken.yaml\` trên cka-cp (đã có thì giữ nguyên; muốn làm lại thì xoá tệp rồi chạy \`begin\` lần nữa).`,
    stateOut: "Trên cka-cp có .vimrc, .tmux.conf, .bashrc chuẩn phòng thi; ~/drills/s02/broken.yaml đã được sửa thành YAML hợp lệ.",
    tasks: [
      { id: "t1", text: "Trên cka-cp (user `ubuntu`): viết `~/.vimrc` có `set expandtab tabstop=2 shiftwidth=2` (thêm `autoindent`, `number` nếu thích). Bấm giờ: dưới 30 giây." },
      { id: "t2", text: "Thêm vào cuối `~/.bashrc`: `alias k=kubectl`, `export do=\"--dry-run=client -o yaml\"`, `export now=\"--force --grace-period=0\"`; `source ~/.bashrc`; `echo $do` phải in đúng chuỗi." },
      { id: "t3", text: "Viết `~/.tmux.conf` (`set -g mouse on`, `set -g history-limit 10000`), mở `tmux new -s exam`, chia dọc bằng `Ctrl-b %`, chuyển pane bằng `Ctrl-b o`, phóng to bằng `Ctrl-b z`." },
      { id: "t4", text: "Pane phải chạy `python3 -c 'import sys,yaml; yaml.safe_load(open(sys.argv[1]))' ~/drills/s02/broken.yaml` để đọc dòng lỗi; pane trái mở tệp bằng `vim`." },
      { id: "t5", text: "Làm bộ năm bài vim tính giờ (bảng trong Cách xử lý): thay `catlog`, sửa dòng có tab, thụt khối `resources`, xoá khối `status`, dán khối `readinessProbe`. Sau mỗi bài chạy lại lệnh python ở pane phải." },
      { id: "t6", text: "Bài 5 là khối `readinessProbe` năm dòng (in sẵn trong Cách xử lý, đã thụt 10 dấu cách): chép từ trang này, dán ngay dưới dòng `image: shop/catalog:1.0` mà thụt lề không vỡ. Lưu bằng `:wq` và chạy lại lệnh python ở pane phải: không in gì là parse được." },
      { id: "t7", text: "Trên Mac: `./labs/lab verify cka s02` phải đạt 8/8." },
    ],
    hints: [
      "Lỗi đầu tiên python báo `found character '\\t'… line 9`: gõ `:9`, rồi `:set list` để thấy `^I`. Với `expandtab` đã bật, `:retab` đổi mọi tab trong tệp thành dấu cách.",
      "Sau khi hết tab, python báo `expected <block end>, but found '?'` ở dòng `resources:`. Khối `resources` đang lùi 2 cột so với `ports`, `env`. Đứng ở dòng `resources:`, `V`, `5j` chọn tới `memory: 768Mi`, rồi `>` một lần.",
      "Khối `status:` cuối tệp là thứ `kubectl get -o yaml` sinh ra, không thuộc manifest bạn viết: `/^status` Enter rồi `dG`.",
      "Tệp parse được vẫn có thể sai nghĩa: `verify` so cả nội dung với bản chuẩn. Ba chỗ `catlog` đều phải thành `catalog` — `:%s/catlog/catalog/g` sửa một lần cả ba.",
      "Dán bị bậc thang (mỗi dòng thụt thêm): `u` để hoàn tác, `:set paste`, dán lại, `:set nopaste`.",
    ],
    solution: `**Dotfile** (gõ tay, không chép — đầu giờ thi bạn cũng phải gõ tay):

\`\`\`bash
cat > ~/.vimrc <<'EOF'
set expandtab tabstop=2 shiftwidth=2 softtabstop=2
set autoindent
set number
EOF

cat >> ~/.bashrc <<'EOF'
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
EOF
source ~/.bashrc

cat > ~/.tmux.conf <<'EOF'
set -g mouse on
set -g history-limit 10000
EOF
\`\`\`

Để ý \`cat >> ~/.bashrc\` (nối thêm) và \`<<'EOF'\` có nháy đơn: không có nháy thì bash thay \`$...\` ngay lúc viết.

**Bộ năm bài vim tính giờ** — mở \`vim ~/drills/s02/broken.yaml\`, bấm đồng hồ cho từng bài:

| # | Bài | Phím | Mục tiêu |
|---|---|---|---|
| 1 | Thay hàng loạt \`catlog\` → \`catalog\` (3 chỗ) | \`:%s/catlog/catalog/g\` | < 10 giây |
| 2 | Nhảy tới dòng lỗi tab và sửa | \`:9\`, \`:set list\`, \`:retab\`, \`:set nolist\` | < 15 giây |
| 3 | Thụt cả khối \`resources\` (6 dòng) thêm 1 bậc | \`/^ *resources\` Enter, \`V5j>\` (hoặc \`:27,32>\`) | < 10 giây |
| 4 | Xoá khối \`status:\` ở cuối | \`/^status\` Enter, \`dG\` | < 10 giây |
| 5 | Dán \`readinessProbe\` dưới dòng \`image:\` không vỡ thụt lề | \`/image:\` Enter, \`:set paste\`, \`o\`, dán, \`Esc\`, \`:set nopaste\` | < 20 giây |

Khối dán ở bài 5 (đã thụt sẵn 10 dấu cách):

\`\`\`yaml
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            periodSeconds: 5
\`\`\`

Lưu \`:wq\`, rồi ở pane kia: \`python3 -c 'import sys,yaml; yaml.safe_load(open(sys.argv[1]))' ~/drills/s02/broken.yaml\` không in gì là parse được.

Vì sao thứ tự này: sửa tab trước (lỗi parse chặn mọi thứ), rồi thụt khối (lỗi parse thứ hai), sau đó mới tới các lỗi "parse được nhưng sai nghĩa" (nhãn \`catlog\` làm selector không khớp Pod; khối \`status\` không thuộc manifest). Trong phòng thi, \`kubectl apply\` cũng báo theo đúng thứ tự đó: lỗi cú pháp trước, lỗi nghĩa sau.

Làm lại bộ năm bài từ đầu: \`rm ~/drills/s02/broken.yaml\` rồi \`./labs/lab begin cka s02\`. Tập tới khi tổng dưới 1 phút.

**tmux hai pane:** \`tmux new -s exam\` → \`Ctrl-b %\` → pane trái \`vim …\`, pane phải chạy lệnh kiểm; \`Ctrl-b o\` qua lại, \`Ctrl-b z\` phóng to khi cần nhìn cả tệp. Từ chặng 2 pane phải sẽ là \`k apply -f\` và \`k get -w\`.`,
    exam: {
      patterns: [
        "Gần như mọi câu tạo tài nguyên: sinh khung bằng `k create … $do > x.yaml`, sửa bằng vim rồi `k apply -f` — thụt sai một khối là mất câu.",
        "Câu sửa static pod: mở `/etc/kubernetes/manifests/kube-apiserver.yaml` bằng vim trên control plane; một tab hay một khối lệch làm apiserver không lên.",
        "Câu \"sửa Deployment đang chạy\": `k edit` mở vim; lưu tệp hỏng thì kubectl trả lại tệp kèm lỗi ở đầu — phải đọc và sửa tiếp, không thoát bằng `:q!`.",
        "Xoá Pod nhanh bằng `$now` để không mất 30 giây chờ graceful shutdown.",
      ],
      timeTargetMin: 2,
      drills: [
        {
          text: "Đầu giờ thi: trong một shell mới trên cka-cp, đặt `$do`, `$now` và vimrc YAML, kiểm `echo $do`. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\necho 'set expandtab tabstop=2 shiftwidth=2' >> ~/.vimrc\necho 'export do=\"--dry-run=client -o yaml\"' >> ~/.bashrc\necho 'export now=\"--force --grace-period=0\"' >> ~/.bashrc\nsource ~/.bashrc\necho $do\n```\n`alias k=kubectl` đã có sẵn trong môi trường thi; ở lab bạn đã thêm nó vào `~/.bashrc`.",
        },
        {
          text: "Tệp `~/drills/s02/broken.yaml` (làm lại từ đầu): sửa cho tới khi `./labs/lab verify cka s02` đạt. Giới hạn 3 phút.",
          timeLimitMin: 3,
          solution: "`:%s/catlog/catalog/g` → `:retab` → `/^ *resources` + `V5j>` → `/^status` + `dG` → `/image:` + `:set paste` + `o` + dán khối probe + `Esc` + `:set nopaste` → `:wq`.",
        },
      ],
    },
    tips: [
      "Gõ `:set paste` *trước* khi vào Insert mode rồi mới dán; dán xong `:set nopaste` để autoindent hoạt động lại.",
      "`u` không sợ: hoàn tác từng bước, `Ctrl-r` làm lại. Sửa hỏng thì `u` chứ đừng `:q!` rồi làm lại cả tệp.",
      "Biết số dòng khối cần thụt? `:27,32>` nhanh hơn chọn Visual. `:set number` (có trong vimrc) để đọc số dòng.",
      "`export do=…` không có dấu cách quanh `=`. Viết `export do = \"…\"` thì bash báo lỗi `not a valid identifier` cho dấu `=` và `$do` thành rỗng — lệnh `k run … $do` sau đó tạo thật tài nguyên thay vì in YAML.",
    ],
    outcome: {
      md: `Trên cka-cp có ba dotfile phòng thi và tệp \`~/drills/s02/broken.yaml\` đã thành manifest Deployment hợp lệ, **khớp nội dung** với bản chuẩn \`labs/cka/sessions/s02/files/expected.yaml\` (so sau khi chuẩn hoá, nên khác chú thích hay kiểu nháy không sao). Trên Mac:

\`\`\`bash
./labs/lab verify cka s02
\`\`\``,
      verifyOutput: "lab: kiểm s02\n  ✓ ~/.vimrc có expandtab\n  ✓ ~/.vimrc có tabstop=2\n  ✓ ~/.vimrc có shiftwidth=2\n  ✓ ~/.bashrc có alias k=kubectl\n  ✓ ~/.bashrc có export do=\n  ✓ ~/.bashrc có export now=\n  ✓ broken.yaml parse được bằng python3 yaml\n  ✓ broken.yaml khớp bản chuẩn sau khi chuẩn hoá\n  → 8/8 đạt",
      projectDelta: "Chưa đổi gì trong hệ thống shop; bạn có bộ công cụ gõ dùng suốt chương trình, và bản manifest Deployment đầu tiên của `catalog` (sẽ apply thật ở chặng 2).",
    },
    review: [
      { q: "Ba tuỳ chọn vim nào bắt buộc cho YAML, mỗi cái làm gì?", a: "`expandtab` (Tab thành dấu cách), `tabstop=2` (độ rộng một tab), `shiftwidth=2` (số cột `>`/`<` dịch một khối)." },
      { q: "Thụt cả khối 6 dòng thêm một bậc trong vim bằng cách nào?", a: "Đứng ở dòng đầu, `V5j>`; hoặc biết số dòng thì `:27,32>`." },
      { q: "`$do` và `$now` chứa gì, dùng ở đâu?", a: "`--dry-run=client -o yaml` (sinh YAML không tạo tài nguyên: `k run x --image=y $do > x.yaml`) và `--force --grace-period=0` (xoá Pod ngay: `k delete pod x $now`)." },
      { q: "Dán khối YAML vào vim bị thụt thành bậc thang. Sửa thế nào?", a: "`u` hoàn tác, `:set paste`, dán lại, `Esc`, `:set nopaste`." },
    ],
  },

  // ───────────────────────────── s03 ─────────────────────────────
  {
    id: "s03",
    stage: "st0",
    title: "Linux quản trị: systemd, journalctl, tiến trình, quyền, gói",
    durationMin: 75,
    domain: null,
    competencies: [],
    requires: ["s02"],
    status: "published",
    pieces: [],
    goals: [
      "Viết một unit systemd, bật nó lên cùng máy và đọc log của nó bằng journalctl.",
      "Tạo user dịch vụ, đặt đúng chủ và quyền cho thư mục của nó.",
      "Cài một gói và giữ nguyên phiên bản bằng apt-mark hold — đúng cách sẽ làm với kubelet sau này.",
    ],
    skills: [
      { skill: "lx-systemctl-unit", level: "Gõ được không tra" },
      { skill: "lx-unit-file", level: "Viết được không tra" },
      { skill: "lx-journalctl-unit", level: "Gõ được không tra" },
      { skill: "lx-ps-proc", level: "Gõ được không tra" },
      { skill: "lx-useradd", level: "Gõ được không tra" },
      { skill: "lx-chown-chmod", level: "Gõ được không tra" },
      { skill: "lx-apt-hold", level: "Gõ được không tra" },
    ],
    uses: ["lx-sudo-i", "vim-move-jump", "vim-delete-yank"],
    foundation: {
      area: "linux",
      md: `**systemd quản lý dịch vụ bằng tệp unit.** Một unit dịch vụ là tệp \`/etc/systemd/system/<tên>.service\` gồm ba phần:

\`\`\`ini
[Unit]                 # mô tả, phụ thuộc thứ tự (After=)
Description=…
[Service]              # chạy cái gì, bằng ai, chết thì sao
User=shop
ExecStart=/đường/dẫn/tuyệt/đối
Restart=on-failure
[Install]              # "enable" nghĩa là gắn vào target nào lúc boot
WantedBy=multi-user.target
\`\`\`

\`After=\` chỉ xếp **thứ tự** khởi động, không kéo unit kia lên: muốn thật sự chờ mạng phải viết cặp \`Wants=network-online.target\` + \`After=network-online.target\`. Dịch vụ heartbeat không cần mạng nên bỏ cả hai.

Bốn động từ khác nhau, hay bị lẫn: \`start\` (chạy ngay), \`enable\` (tự chạy khi boot — tạo symlink vào \`multi-user.target.wants\`), \`enable --now\` (cả hai), \`daemon-reload\` (đọc lại tệp unit sau khi bạn sửa — quên bước này thì systemd vẫn chạy bản cũ). Hỏi trạng thái: \`systemctl status\`, \`is-active\`, \`is-enabled\`, \`systemctl cat <unit>\` (in tệp unit cùng mọi drop-in).

**journal:** systemd gom stdout/stderr của mọi dịch vụ vào journal. \`journalctl -u <unit>\` lọc theo unit, \`-f\` theo dõi, \`-n 50\` 50 dòng cuối, \`--since "10 min ago"\`, \`-p err\` chỉ lỗi, \`--no-pager\` khi dùng trong script. Ứng dụng chỉ việc in ra stdout — không cần tự ghi tệp log.

**Quyền:** \`chmod 750\` = chủ \`rwx\` (7), nhóm \`r-x\` (5), người khác không gì (0). Với thư mục, \`x\` là quyền *đi vào*. \`chown -R shop:shop\` đổi chủ và nhóm. \`stat -c '%U:%G %a' /opt/shop\` in đúng thứ cần kiểm.

**Tiến trình:** \`ps -ef --forest\` (cây cha–con), \`pgrep -a <tên>\`, \`systemctl status\` in luôn cây cgroup của dịch vụ. \`kill -TERM\` xin dừng lịch sự (ứng dụng được dọn dẹp), \`kill -KILL\` giết ngay.

**Gói:** \`apt-get install -y <gói>\`, \`apt-mark hold <gói>\` (khoá phiên bản: \`apt upgrade\` sẽ bỏ qua), \`apt-mark showhold\`, \`apt-mark unhold\`.

**Bài tập nền (10 phút, \`sudo -i\` trên cka-cp):**
1. \`systemctl status ssh\` — đọc dòng \`Loaded:\` (tệp unit ở đâu, enabled chưa), \`Active:\`, và cây \`CGroup:\`.
2. \`systemctl cat ssh\` rồi \`journalctl -u ssh -n 20 --no-pager\` — thấy các lần bạn ssh ở s01.
3. \`ps -ef --forest | grep -B2 -A2 sshd\` — sshd con nào là phiên ssh của bạn?
4. \`ls -ld /home/ubuntu /root\` — đọc hai bộ quyền, giải thích vì sao \`ubuntu\` không \`ls /root\` được.

Đọc thêm: quyền tệp và process trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `**kubelet là một unit systemd.** Đó là lý do buổi này có mặt: khi node \`NotReady\` trong đề thi, việc đầu tiên là \`systemctl status kubelet\` và \`journalctl -u kubelet\`; lỗi hay gặp nhất là tệp cấu hình sai đường dẫn, quên \`daemon-reload\`, dịch vụ chưa \`enable\` nên reboot là mất. Tất cả bạn tập hôm nay trên một dịch vụ nhỏ không có gì để hỏng.

Với người làm Java: nếu bạn từng chạy \`java -jar app.jar\` bằng systemd trên VM, unit \`shop-heartbeat\` chính là thứ đó — \`User=\` thay cho chạy bằng root, \`Restart=on-failure\` thay cho script "watchdog", stdout vào journal thay cho \`logback\` ghi tệp. Sau này Pod của Kubernetes làm đúng những việc này ở quy mô cluster: \`restartPolicy\` là \`Restart=\`, \`securityContext.runAsUser\` là \`User=\`, \`kubectl logs\` là \`journalctl -u\`.

Hai thói quen cần hình thành: **sửa tệp → \`daemon-reload\` → restart → đọc status**, và **đọc journal trước khi đoán**. Journal gần như luôn ghi đúng câu lỗi.

\`apt-mark hold\` là chuẩn bị cho chặng 8: kubeadm, kubelet, kubectl được hold để \`apt upgrade\` không vô tình nâng cluster; lúc nâng thật bạn \`unhold\`, cài đúng bản, rồi \`hold\` lại.`,
    refs: [
      { label: "Kiến thức nền tảng — quyền tệp, process", href: "#/docs/prerequisites" },
      { label: "Bài lộ trình CKA: Node components — kubelet chạy dưới systemd", href: "#/roadmap/cka/cka-w1-2" },
      { label: "Thực hành nhanh: systemctl / journalctl cho kubelet", href: "#/commands" },
      { label: "systemd.service — tài liệu tham chiếu", href: "https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html" },
      { label: "journalctl — tài liệu tham chiếu", href: "https://www.freedesktop.org/software/systemd/man/latest/journalctl.html" },
    ],
    stateIn: `Đầu ra s02: trên cka-cp có dotfile phòng thi (vimrc YAML, alias \`k\`, \`$do\`, \`$now\`) và tệp bài tập YAML đã sửa; ba VM vẫn ssh qua lại được. Buổi này không cần tệp bài tập: \`./labs/lab begin cka s03\` chỉ kiểm đầu vào bằng verify của s02. Làm mọi việc trên cka-cp, phần lớn bằng \`sudo -i\`.`,
    stateOut: "Trên cka-cp có user shop, /opt/shop thuộc shop:shop mode 750, unit shop-heartbeat enabled + active và jq được hold.",
    tasks: [
      { id: "t1", text: "`sudo -i` trên cka-cp. Tạo user dịch vụ: `useradd -m -s /bin/bash shop`; `id shop`." },
      { id: "t2", text: "Tạo `/opt/shop` thuộc `shop:shop`, mode `750`; kiểm bằng `stat -c '%U:%G %a' /opt/shop`; thử `sudo -u ubuntu ls /opt/shop` phải bị từ chối." },
      { id: "t3", text: "Viết `/opt/shop/heartbeat.sh` (vòng lặp `echo` một dòng rồi `sleep 10`), chủ `shop`, mode `750`." },
      { id: "t4", text: "Viết `/etc/systemd/system/shop-heartbeat.service` chạy script đó bằng `User=shop`, `Restart=on-failure`, `WantedBy=multi-user.target`; `systemctl daemon-reload` rồi `systemctl enable --now shop-heartbeat`." },
      { id: "t5", text: "Đọc `systemctl status shop-heartbeat` và `journalctl -u shop-heartbeat -f` (Ctrl-c để thoát) — phải thấy một dòng mỗi 10 giây." },
      { id: "t6", text: "Tìm PID bằng `pgrep -a heartbeat`, `kill -KILL <pid>`, đợi 5 giây, `systemctl status` — dịch vụ tự lên lại với PID mới. Đọc journal xem systemd ghi gì." },
      { id: "t7", text: "`apt-get install -y jq`, `apt-mark hold jq`, `apt-mark showhold`. Rồi trên Mac: `./labs/lab verify cka s03` phải đạt 6/6." },
    ],
    hints: [
      "Script phải có dòng đầu `#!/bin/bash` và quyền thực thi; `ExecStart=` cần **đường dẫn tuyệt đối**. Lỗi `status=203/EXEC` trong `systemctl status` nghĩa là systemd không chạy được tệp đó (sai đường dẫn, thiếu shebang hoặc thiếu quyền `x`).",
      "User `shop` phải vào được `/opt/shop` để chạy script: thư mục `750` chủ `shop` là đủ. `status=200/CHDIR` hay `Permission denied` trong journal là dấu hiệu sai chủ/quyền.",
      "Viết vòng lặp thẳng trong `ExecStart=` thì `$` bị systemd hiểu là biến của nó (phải viết `$$`). Đặt vòng lặp trong một tệp script cho khỏi bẫy này.",
      "Sửa tệp unit xong mà `status` vẫn hiện cấu hình cũ, kèm cảnh báo `changed on disk`: thiếu `systemctl daemon-reload`.",
      "`kill -TERM` dừng sạch nên `Restart=on-failure` *không* khởi động lại; `kill -KILL` bị coi là chết bất thường nên được khởi động lại. Nếu bạn đã TERM và dịch vụ nằm im, chỉ cần `systemctl start shop-heartbeat`.",
    ],
    solution: `Làm bằng root (\`sudo -i\`) trên cka-cp.

**1. User và thư mục**

\`\`\`bash
useradd -m -s /bin/bash shop
install -d -o shop -g shop -m 750 /opt/shop     # = mkdir + chown + chmod
stat -c '%U:%G %a' /opt/shop                     # shop:shop 750
\`\`\`

**2. Script** — \`vim /opt/shop/heartbeat.sh\`:

\`\`\`bash
#!/bin/bash
# Ghi một dòng ra stdout mỗi 10 giây; systemd đưa stdout vào journal.
while true; do
  echo "shop heartbeat từ $(hostname) lúc $(date '+%H:%M:%S')"
  sleep 10
done
\`\`\`

\`\`\`bash
chown shop:shop /opt/shop/heartbeat.sh && chmod 750 /opt/shop/heartbeat.sh
\`\`\`

**3. Unit** — \`vim /etc/systemd/system/shop-heartbeat.service\`:

\`\`\`ini
[Unit]
Description=shop heartbeat (ghi một dòng log mỗi 10 giây)

[Service]
User=shop
Group=shop
WorkingDirectory=/opt/shop
ExecStart=/opt/shop/heartbeat.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
\`\`\`

\`\`\`bash
systemctl daemon-reload
systemctl enable --now shop-heartbeat
systemctl is-enabled shop-heartbeat; systemctl is-active shop-heartbeat   # enabled / active
journalctl -u shop-heartbeat -n 5 --no-pager
\`\`\`

\`enable\` tạo symlink \`/etc/systemd/system/multi-user.target.wants/shop-heartbeat.service\` — đó là toàn bộ ý nghĩa của "bật cùng máy". \`--now\` chạy luôn.

**4. Thử tự khởi động lại**

\`\`\`bash
pgrep -a heartbeat            # PID của bash chạy script
kill -KILL <pid>; sleep 6
systemctl status shop-heartbeat --no-pager | head -5     # Active: active (running), PID mới
journalctl -u shop-heartbeat -n 5 --no-pager            # "Main process exited, code=killed, status=9/KILL" … "Scheduled restart job"
\`\`\`

**5. Gói được giữ phiên bản**

\`\`\`bash
apt-get install -y jq
apt-mark hold jq
apt-mark showhold             # jq
\`\`\`

\`verify\` kiểm journal bằng \`_SYSTEMD_UNIT=shop-heartbeat.service\` — tức là chỉ đếm dòng **do chính tiến trình của bạn in ra**, không đếm các dòng "Started…" của systemd. Lời giải tự động: \`labs/cka/sessions/s03/apply.sh\`.`,
    exam: {
      patterns: [
        "Node `NotReady`: `ssh <node>`, `sudo -i`, `systemctl status kubelet`, `journalctl -u kubelet -n 50` — đọc câu lỗi rồi sửa tệp cấu hình hay drop-in, `daemon-reload`, `restart`.",
        "kubelet \"không lên sau reboot\": dịch vụ chưa `enable`.",
        "Câu nâng cấp cluster: `apt-mark unhold kubeadm` → cài đúng bản → `apt-mark hold kubeadm`; tương tự cho kubelet và kubectl.",
        "Câu đọc log của thứ chạy dưới systemd trên node — kubelet và containerd (`journalctl -u kubelet`, `journalctl -u containerd`). Control plane của cluster kubeadm thì chạy dạng static pod, log đọc bằng `kubectl logs` hoặc `crictl logs`.",
      ],
      timeTargetMin: 4,
      drills: [
        {
          text: "Trên cka-cp: dịch vụ `shop-heartbeat` vừa bị ai đó `systemctl disable --now`. Đưa nó về `enabled` và `active`, rồi chỉ ra dòng log mới nhất của nó. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\nsudo systemctl enable --now shop-heartbeat\nsystemctl is-enabled shop-heartbeat && systemctl is-active shop-heartbeat\nsudo journalctl -u shop-heartbeat -n 1 --no-pager\n```",
        },
        {
          text: "Đổi chu kỳ heartbeat từ 10 sang 5 giây sao cho thay đổi có hiệu lực ngay, rồi chứng minh bằng journal. Giới hạn 3 phút.",
          timeLimitMin: 3,
          solution: "Sửa `sleep 10` → `sleep 5` trong `/opt/shop/heartbeat.sh`, rồi `sudo systemctl restart shop-heartbeat` (script đọc lại khi tiến trình mới chạy; không cần `daemon-reload` vì tệp unit không đổi). `journalctl -u shop-heartbeat -f` thấy dòng cách 5 giây. Nhớ đổi lại 10 nếu muốn giữ đúng bài.",
        },
      ],
    },
    tips: [
      "Thứ tự bất di bất dịch sau khi sửa tệp unit: `daemon-reload` → `restart` → `status`.",
      "`systemctl status` cắt dòng; thêm `--no-pager -l` để đọc trọn câu lỗi.",
      "`journalctl -u kubelet -f` ở một pane tmux, sửa tệp ở pane kia — thấy kết quả ngay sau mỗi lần restart.",
      "`install -d -o U -g G -m 750 DIR` làm mkdir + chown + chmod trong một lệnh.",
      "`pgrep heartbeat` so tên tiến trình; `pgrep -f heartbeat.sh` so cả dòng lệnh nên khớp luôn cả shell đang gõ lệnh có chữ đó — `kill $(pgrep -f …)` có thể giết chính bạn.",
    ],
    outcome: {
      md: `Trên cka-cp: user \`shop\`, thư mục \`/opt/shop\` chỉ chủ và nhóm \`shop\` vào được, dịch vụ \`shop-heartbeat\` chạy bằng user đó, tự khởi động cùng máy, ghi log vào journal mỗi 10 giây, và \`jq\` bị giữ phiên bản. Trên Mac:

\`\`\`bash
./labs/lab verify cka s03
\`\`\``,
      verifyOutput: "lab: kiểm s03\n  ✓ id shop\n  ✓ /opt/shop thuộc shop:shop, mode 750\n  ✓ shop-heartbeat enabled\n  ✓ shop-heartbeat active\n  ✓ journal của shop-heartbeat có ít nhất 2 dòng\n  ✓ apt-mark showhold có jq\n  → 6/6 đạt",
      projectDelta: "Chưa có service shop thật; `shop-heartbeat` là bản tập của cách kubelet và containerd được vận hành trên mọi node, và `apt-mark hold` là động tác bạn sẽ dùng với kubeadm/kubelet/kubectl từ chặng 1.",
    },
    review: [
      { q: "`start`, `enable`, `enable --now`, `daemon-reload` khác nhau thế nào?", a: "`start` chạy ngay; `enable` tự chạy khi boot (symlink vào target); `enable --now` cả hai; `daemon-reload` đọc lại tệp unit sau khi sửa." },
      { q: "Lệnh nào đọc 50 dòng log cuối của kubelet, không phân trang?", a: "`journalctl -u kubelet -n 50 --no-pager`." },
      { q: "Vì sao `kill -TERM` làm `shop-heartbeat` nằm im còn `kill -KILL` thì nó tự lên lại?", a: "Với `Restart=on-failure`, chết bằng SIGTERM được coi là dừng sạch nên không khởi động lại; SIGKILL là chết bất thường nên systemd khởi động lại." },
      { q: "`chmod 750` trên một thư mục nghĩa là gì?", a: "Chủ đọc/ghi/vào; nhóm đọc và vào; người khác không làm gì được." },
      { q: "Vì sao kubelet, kubeadm, kubectl được `apt-mark hold`?", a: "Để `apt upgrade` không tự nâng phiên bản cluster; nâng chủ động bằng unhold → cài đúng bản → hold." },
    ],
  },

  // ───────────────────────────── s04 ─────────────────────────────
  {
    id: "s04",
    stage: "st0",
    title: "Linux network: ip, route, DNS, iptables, network namespace",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s03"],
    status: "published",
    pieces: [],
    goals: [
      "Đọc được IP, bảng route, DNS server và cổng đang nghe của một node trong vòng 2 phút.",
      "Tự nối hai network namespace bằng một cặp veth và ping qua lại — mô hình thu nhỏ của mạng Pod.",
      "Thêm, đọc và xoá một rule iptables trong chain riêng mà không làm hỏng mạng của máy.",
    ],
    skills: [
      { skill: "net-ip-addr", level: "Gõ được không tra" },
      { skill: "net-ip-route", level: "Đọc được bảng route" },
      { skill: "net-resolv", level: "Gõ được không tra" },
      { skill: "net-ss-listen", level: "Gõ được không tra" },
      { skill: "net-curl-nc", level: "Gõ được không tra" },
      { skill: "net-iptables-read", level: "Đọc hiểu được" },
      { skill: "net-netns-veth", level: "Làm được theo trí nhớ" },
    ],
    uses: ["lx-sudo-i", "lx-ps-proc", "net-getent-hosts"],
    foundation: {
      area: "network",
      md: `**Năm câu hỏi về mạng của một node, năm lệnh:**

| Câu hỏi | Lệnh | Đọc gì |
|---|---|---|
| Card nào, IP gì? | \`ip -br addr\` | tên card (\`enp0s1\`), trạng thái, IP/độ dài prefix |
| Gói đi ra ngoài qua đâu? | \`ip route\`, \`ip route get 1.1.1.1\` | dòng \`default via <gateway> dev <card>\` |
| Hỏi DNS ai? | \`resolvectl status\` hoặc \`resolvectl dns\` | \`/etc/resolv.conf\` chỉ ghi \`127.0.0.53\` — đó là **stub** của systemd-resolved trên chính máy; máy chủ DNS thật (DHCP cấp) nằm ở \`DNS Servers:\` của card; \`Current DNS Server:\` là cái stub đang dùng lúc này |
| Ai đang nghe cổng nào? | \`sudo ss -tlnp\` | \`t\` TCP, \`l\` đang nghe, \`n\` số, \`p\` tiến trình (cần root) |
| Tới được dịch vụ kia không? | \`nc -zv -w2 host port\`, \`curl -sv http://host:port/\` | \`succeeded\` / \`refused\` / timeout |

**Refused hay timeout — khác nhau quan trọng.** \`Connection refused\` = gói tới nơi, không ai nghe cổng đó (hoặc bị \`REJECT\`). Timeout = gói biến mất trên đường (route sai, hoặc bị \`DROP\`). Người làm Java đã gặp cả hai: \`ConnectException: Connection refused\` và \`SocketTimeoutException: connect timed out\`.

**iptables** là các bảng (\`filter\`, \`nat\`…) chứa các **chain**; gói đi qua chain có sẵn (\`INPUT\`, \`OUTPUT\`, \`FORWARD\`…) và có thể **nhảy** (\`-j\`) sang chain do người dùng tạo. kube-proxy làm đúng như vậy: chain \`KUBE-SERVICES\` nhảy sang hàng nghìn chain con. Đọc: \`iptables -L <chain> -n -v --line-numbers\` hoặc \`iptables -S <chain>\` (dạng lệnh, dễ grep). Ubuntu 24.04 dùng \`iptables-nft\`: cú pháp \`iptables\` như cũ, bên dưới là nftables.

**network namespace** là một bản sao riêng của ngăn xếp mạng: card, IP, bảng route, iptables riêng. **veth** là một cặp card ảo nối với nhau như một sợi dây: gói vào đầu này ra đầu kia. Đặt hai đầu vào hai namespace là có hai "máy" nối trực tiếp.

**Bài tập nền (10 phút, trên cka-cp):**
1. \`ip -br addr; ip route; ip route get 1.1.1.1\` — gateway và card ra là gì?
2. \`cat /etc/resolv.conf; resolvectl dns\` — vì sao hai lệnh cho hai địa chỉ khác nhau?
3. \`sudo ss -tlnp\` — cổng 22 có **hai** tiến trình (\`sshd\` và \`systemd\`). Vì sao? (Ubuntu 24.04 dùng \`ssh.socket\`: systemd giữ socket và trao cho sshd.)
4. \`nc -zv -w2 127.0.0.1 22; nc -zv -w2 127.0.0.1 23\` — một \`succeeded\`, một \`refused\`. Dùng \`127.0.0.1\` thay vì \`localhost\`: \`localhost\` có thể ra \`::1\` (IPv6), mà rule \`iptables\` chỉ áp cho IPv4 (IPv6 là \`ip6tables\`).

Đọc thêm: mô hình OSI, TCP/IP, socket trong [Lập trình mạng](#/docs/sysprog-11) và phần networking cơ bản trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `**Pod là một network namespace.** Khi kubelet tạo Pod, runtime tạo một netns mới; plugin CNI tạo một cặp veth, đặt một đầu vào netns của Pod (thành \`eth0\` của Pod) và để đầu kia ở node, rồi gán IP và route. Hôm nay bạn làm đúng việc của CNI bằng tay, với hai "Pod" \`shop-a\` và \`shop-b\`. Đến chặng 5, khi \`ip netns\` hay \`ip link\` trên worker hiện hàng loạt \`cali…\`/\`veth…\`, bạn sẽ biết chúng là gì.

**Service là iptables.** kube-proxy (chế độ iptables) không chạy proxy nào cả: nó viết rule DNAT trong các chain riêng và móc chúng vào \`PREROUTING\`/\`OUTPUT\`. Bạn tạo chain \`SHOP-DEMO\` và móc vào \`INPUT\` là cùng một cấu trúc ở cỡ nhỏ. Một chain không được nhảy tới thì không có tác dụng gì — câu hỏi đầu tiên khi rule "không ăn".

**Chẩn đoán từ dưới lên.** Khi một service Java "không gọi được service kia", câu hỏi theo thứ tự: tên phân giải ra IP nào (\`getent hosts\`)? Có route tới IP đó không (\`ip route get\`)? Đầu kia có ai nghe cổng không (\`ss -tlnp\`)? Có rule nào chặn (\`iptables -S\`)? Refused hay timeout? Thứ tự này là xương sống của mọi câu troubleshooting networking trong đề.

**Cẩn thận với iptables trên máy đang ssh vào:** một rule \`DROP\` quá rộng trên \`INPUT\` là tự khoá mình ngoài cửa. Luôn giới hạn rule theo cổng (\`--dport 9999\`), làm trong chain riêng, và nhớ rule hôm nay **mất khi reboot** (không lưu).`,
    refs: [
      { label: "Lập trình mạng — OSI, TCP/IP, socket (lĩnh vực Lập trình hệ thống)", href: "#/docs/sysprog-11" },
      { label: "Kiến thức nền tảng — networking cơ bản", href: "#/docs/prerequisites" },
      { label: "Bài lộ trình CKA: Node components — kube-proxy viết rule iptables", href: "#/roadmap/cka/cka-w1-2" },
      { label: "Thực hành nhanh: ss -tlnp và lệnh mạng trên node", href: "#/commands" },
      { label: "kubernetes.io: Cluster Networking (mô hình mạng Pod)", href: "https://kubernetes.io/docs/concepts/cluster-administration/networking/" },
      { label: "man ip-netns", href: "https://man7.org/linux/man-pages/man8/ip-netns.8.html" },
    ],
    stateIn: `Đầu ra s03 trên cka-cp: user \`shop\`, dịch vụ \`shop-heartbeat\` đang chạy, \`jq\` được hold; mạng của ba VM ở nguyên trạng thái mặc định của Multipass (chưa netns, chưa rule iptables nào do bạn thêm). \`./labs/lab begin cka s04\` kiểm đầu vào bằng verify của s03. Làm trên cka-cp; netns và iptables cần \`sudo\`.`,
    stateOut: "Trên cka-cp có namespace shop-a, shop-b nối veth ping được nhau, chain SHOP-DEMO có một rule, và ~/drills/s04/answers.env ghi đúng gateway, DNS, tiến trình nghe cổng 22.",
    tasks: [
      { id: "t1", text: "Đọc mạng của cka-cp và ghi vào `~/drills/s04/answers.env` (user `ubuntu`) ba dòng: `DEFAULT_GW=<gateway mặc định>`, `DNS_SERVER=<máy chủ DNS cấu hình cho card mạng, địa chỉ IPv4, không phải 127.0.0.53>`, `SSH_PORT_PID_NAME=<pid>/sshd` (tiến trình sshd đang nghe cổng 22)." },
      { id: "t2", text: "Thử kết nối: `nc -zv -w2 127.0.0.1 22` (succeeded), `nc -zv -w2 127.0.0.1 9999` (refused), `curl -sI https://pkgs.k8s.io | head -1` (ra Internet được)." },
      { id: "t3", text: "Tạo hai namespace `shop-a`, `shop-b`; một cặp veth `veth-a`/`veth-b`; đưa `veth-a` vào `shop-a`, `veth-b` vào `shop-b`." },
      { id: "t4", text: "Gán `10.200.0.1/24` cho `veth-a`, `10.200.0.2/24` cho `veth-b`, bật cả hai card (và `lo`) rồi ping hai chiều. So `ip route` trong namespace với bảng route của node." },
      { id: "t5", text: "Mở cổng thử: ở pane tmux thứ hai chạy `nc -lk 9999`; ở pane đầu `nc -zv -w2 127.0.0.1 9999` phải succeeded." },
      { id: "t6", text: "Tạo chain `SHOP-DEMO`, thêm hai rule: `-p tcp --dport 9999 -j DROP` và `-p tcp --dport 9998 -j DROP`; móc chain vào `INPUT`; đọc bằng `iptables -L SHOP-DEMO -n -v --line-numbers`; `nc -zv -w2 127.0.0.1 9999` giờ phải **timeout**. Rồi xoá rule số 2 theo số dòng." },
      { id: "t7", text: "Dừng `nc -lk` (Ctrl-c). Trên Mac: `./labs/lab verify cka s04` phải đạt 9/9." },
    ],
    hints: [
      "Gateway: `ip route show default` — từ thứ ba. DNS của card: `resolvectl dns enp0s1` (hoặc khối `Link … DNS Servers:` trong `resolvectl status`) — lấy địa chỉ IPv4. `Current DNS Server` có thể là địa chỉ IPv6 `fe80::…`: stub đã chuyển sang server đó (xem Cách xử lý).",
      "Cổng 22 có hai tiến trình trong `sudo ss -tlnp`: `systemd` (pid 1, giữ socket của `ssh.socket`) và `sshd`. Đáp án là của `sshd`, dạng `pid/tên` như cột của `netstat -p`, ví dụ `1013/sshd` (PID khác trên máy bạn).",
      "Lệnh trong namespace: `ip netns exec shop-a <lệnh>` hoặc viết tắt `ip -n shop-a <lệnh ip>`. Card mới tạo luôn ở trạng thái DOWN: `ip -n shop-a link set veth-a up`.",
      "Ping không qua: kiểm từng đầu `ip -n shop-a -br addr` (có IP? UP?) và đầu kia. Hai IP phải cùng mạng `/24` thì kernel mới tự có route `10.200.0.0/24 dev veth-a`.",
      "Xoá theo số dòng: `iptables -L SHOP-DEMO -n --line-numbers` rồi `iptables -D SHOP-DEMO 2`. `verify` đếm số rule trong `iptables -S SHOP-DEMO`: phải đúng một.",
    ],
    solution: `**1. Đọc mạng của node** (user \`ubuntu\`):

\`\`\`bash
ip -br addr                         # enp0s1 UP 192.168.x.y/24
ip route show default               # default via 192.168.x.1 dev enp0s1 …
cat /etc/resolv.conf                # nameserver 127.0.0.53  ← stub cục bộ, không phải đáp án
resolvectl dns enp0s1               # Link 2 (enp0s1): 192.168.x.1 fe80::…
sudo ss -tlnp 'sport = :22'         # users:(("sshd",pid=1013,…),("systemd",pid=1,…))

mkdir -p ~/drills/s04
cat > ~/drills/s04/answers.env <<'EOF'
DEFAULT_GW=192.168.252.1
DNS_SERVER=192.168.252.1
SSH_PORT_PID_NAME=1013/sshd
EOF
\`\`\`

Thay bằng giá trị trên máy bạn (PID của sshd đổi sau mỗi lần khởi động). Trên Multipass, DHCP của Mac thường cấp cùng một địa chỉ cho gateway và DNS — đó là sự trùng hợp của môi trường, không phải quy luật.

Thử xem máy chủ đó có trả lời thật không: \`dig +short @192.168.252.1 pkgs.k8s.io\`. Trên máy soạn bài này nó trả \`connection refused\` — Mac không phục vụ DNS ở địa chỉ IPv4 đó — và \`journalctl -u systemd-resolved\` cho thấy stub đã chuyển sang server IPv6 \`fe80::…\` (chính là \`Current DNS Server\`): \`dig +short @fe80::…%enp0s1 pkgs.k8s.io\` trả lời bình thường. Máy bạn có thể khác. Đây đúng là cách chẩn đoán DNS: hỏi thẳng từng server bằng \`dig @server\`, đừng tin cấu hình. Đáp án \`DNS_SERVER\` của bài vẫn là địa chỉ IPv4 cấu hình cho card.

**2. Hai "Pod" nối bằng veth** (\`sudo -i\`):

\`\`\`bash
ip netns add shop-a
ip netns add shop-b
ip link add veth-a type veth peer name veth-b    # một sợi dây, hai đầu
ip link set veth-a netns shop-a
ip link set veth-b netns shop-b
ip -n shop-a addr add 10.200.0.1/24 dev veth-a
ip -n shop-b addr add 10.200.0.2/24 dev veth-b
ip -n shop-a link set lo up;  ip -n shop-a link set veth-a up
ip -n shop-b link set lo up;  ip -n shop-b link set veth-b up
ip netns exec shop-a ping -c2 10.200.0.2
ip netns exec shop-b ping -c2 10.200.0.1
ip -n shop-a route        # chỉ có 10.200.0.0/24 dev veth-a — không có default
ip netns exec shop-a ping -c1 -W1 1.1.1.1   # Network is unreachable: "Pod" chưa có đường ra ngoài
\`\`\`

Dòng cuối là bài học: thiếu route mặc định thì không ra được ngoài. CNI thật thêm route mặc định trỏ về node và bật forwarding/NAT trên node — chặng 5 bạn sẽ đọc chúng trên worker.

**3. iptables trong chain riêng** (\`sudo -i\`; pane khác đang chạy \`nc -lk 9999\`):

\`\`\`bash
nc -zv -w2 127.0.0.1 9999                        # succeeded
iptables -N SHOP-DEMO
iptables -A SHOP-DEMO -p tcp --dport 9999 -j DROP
iptables -A SHOP-DEMO -p tcp --dport 9998 -j DROP
iptables -I INPUT -j SHOP-DEMO                   # móc vào INPUT; không móc thì chain vô dụng
iptables -L SHOP-DEMO -n -v --line-numbers       # "Chain SHOP-DEMO (1 references)": một chỗ nhảy tới
nc -zv -w2 127.0.0.1 9999                        # timed out — DROP nuốt gói, không trả lời
iptables -D SHOP-DEMO 2                          # xoá rule thứ 2 (cổng 9998)
iptables -S SHOP-DEMO                            # -N SHOP-DEMO / -A SHOP-DEMO -p tcp … --dport 9999 -j DROP
\`\`\`

Đổi \`DROP\` thành \`REJECT\` (thử với \`iptables -R SHOP-DEMO 1 -p tcp --dport 9999 -j REJECT\`) thì \`nc\` báo \`refused\` ngay: refused/timeout cho bạn biết đầu kia *từ chối* hay gói *biến mất*. Nhớ đổi lại \`DROP\` nếu muốn giữ đúng bài (verify chỉ đếm số rule).

Mọi thứ ở mục 2 và 3 **mất khi reboot** — đúng như Pod mất netns khi bị xoá. Lời giải tự động: \`labs/cka/sessions/s04/apply.sh\` (đáp án do script tự đọc trên máy).`,
    exam: {
      patterns: [
        "Câu Service/NetworkPolicy \"không gọi được\": vào Pod hay node, kiểm `nslookup`/`getent`, rồi `nc -zv`/`curl` tới ClusterIP và Pod IP — đọc refused hay timeout để biết hỏng ở tầng nào.",
        "Câu control plane: apiserver có nghe 6443 không (`ss -tlnp | grep 6443`), etcd có nghe 2379 không — trước khi đổ lỗi cho kubectl.",
        "Câu node: tìm IP node, card và route để điền đúng `--apiserver-advertise-address` hay địa chỉ trong `kubeadm join`.",
        "Đọc rule kube-proxy: `iptables -t nat -S | grep <tên service>` để chứng minh Service có endpoint.",
      ],
      timeTargetMin: 3,
      drills: [
        {
          text: "Trên cka-w1 (ssh từ cka-cp): ghi ra tên card mạng chính, IP của nó, gateway mặc định và DNS server thật. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\nssh cka-w1\nip -br addr | grep -v '^lo'\nip route show default\nresolvectl dns\nexit\n```\nGateway là từ thứ ba của dòng `default via …`; DNS của card là IPv4 trong `resolvectl dns`, không phải `127.0.0.53` của `/etc/resolv.conf`.",
        },
        {
          text: "Trên cka-cp: chứng minh tiến trình nào đang nghe cổng 22 và cho biết nó do unit systemd nào quản lý. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\nsudo ss -tlnp 'sport = :22'          # sshd pid=… và systemd pid=1\nps -o pid,cmd -p <pid sshd>\nsystemctl status <pid sshd> --no-pager | head -3   # ssh.service; socket do ssh.socket giữ\n```\n`systemctl status <PID>` trả về unit sở hữu tiến trình đó.",
        },
      ],
    },
    tips: [
      "`ip -br` (brief) cho mỗi card một dòng — nhanh hơn đọc `ip addr` đầy đủ.",
      "Đáp án DNS không bao giờ là `127.0.0.53`: đó là stub cục bộ. Ở trong Pod thì ngược lại, `/etc/resolv.conf` trỏ thẳng ClusterIP của CoreDNS.",
      "`ss -tlnp` cần `sudo` mới hiện cột tiến trình của người khác.",
      "Thử iptables luôn trong chain riêng, giới hạn theo cổng; đừng bao giờ `iptables -P INPUT DROP` trên máy đang ssh vào.",
    ],
    outcome: {
      md: `Trên cka-cp: hai namespace \`shop-a\`/\`shop-b\` nối bằng veth, ping được nhau; chain \`SHOP-DEMO\` còn đúng một rule; \`~/drills/s04/answers.env\` khớp gateway, DNS và tiến trình nghe cổng 22 mà script tự đọc trên máy. Trên Mac:

\`\`\`bash
./labs/lab verify cka s04
\`\`\`

Lưu ý: namespace và rule iptables không bền — sau khi tắt/bật VM, \`verify s04\` sẽ hỏng ở các dòng đó; buổi s05 chỉ kiểm phần bền (\`answers.env\`).`,
      verifyOutput: "lab: kiểm s04\n  ✓ ip netns có shop-a\n  ✓ ip netns có shop-b\n  ✓ shop-a ping được 10.200.0.2\n  ✓ shop-b ping được 10.200.0.1\n  ✓ chain SHOP-DEMO tồn tại\n  ✓ SHOP-DEMO có đúng một rule\n  ✓ answers.env: DEFAULT_GW=192.168.252.1\n  ✓ answers.env: DNS_SERVER=192.168.252.1\n  ✓ answers.env: SSH_PORT_PID_NAME=1013/sshd\n  → 9/9 đạt",
      projectDelta: "Chưa đổi gì trong shop; bạn đã dựng bằng tay mô hình thu nhỏ của mạng Pod (netns + veth) và của Service (chain iptables được nhảy tới) — hai thứ sẽ đọc lại trên cluster ở chặng 5.",
    },
    review: [
      { q: "Vì sao `/etc/resolv.conf` ghi `127.0.0.53` mà đáp án DNS_SERVER lại khác? Lệnh nào cho máy chủ DNS thật?", a: "`127.0.0.53` là stub của systemd-resolved trên chính máy; nó chuyển tiếp tới các máy chủ DNS ghi trong `resolvectl dns` (hoặc `resolvectl status`)." },
      { q: "Refused và timeout khác nhau thế nào khi chẩn đoán?", a: "Refused: gói tới nơi nhưng không ai nghe cổng (hoặc bị REJECT). Timeout: gói mất trên đường (route sai hoặc bị DROP)." },
      { q: "Bốn lệnh tối thiểu nối hai netns bằng veth là gì (trước khi gán IP)?", a: "`ip netns add shop-a`, `ip netns add shop-b`, `ip link add veth-a type veth peer name veth-b`, rồi `ip link set veth-a netns shop-a` và `ip link set veth-b netns shop-b`." },
      { q: "Tạo chain `SHOP-DEMO` có rule mà gói vẫn không bị chặn. Thiếu gì?", a: "Không có rule nào nhảy tới chain: cần `iptables -I INPUT -j SHOP-DEMO` (giống kube-proxy móc KUBE-SERVICES vào PREROUTING/OUTPUT)." },
      { q: "Pod liên quan gì tới network namespace và veth?", a: "Mỗi Pod có một netns riêng; CNI tạo cặp veth, một đầu thành `eth0` trong Pod, đầu kia ở node, rồi gán IP và route." },
    ],
  },

  // ───────────────────────────── s05 ─────────────────────────────
  {
    id: "s05",
    stage: "st0",
    title: "Container thuần: containerd, crictl và image shop",
    durationMin: 90,
    domain: null,
    competencies: [],
    requires: ["s04"],
    status: "published",
    pieces: ["images"],
    goals: [
      "Cài containerd và cri-tools từ repo pkgs.k8s.io, cấu hình crictl nói chuyện với containerd.",
      "Nạp image shop vào containerd của node không cần registry và chạy catalog bằng ctr với mạng host.",
      "Chỉ ra container chỉ là một tiến trình: tìm PID, namespace và cgroup của nó, nối với cách JVM đọc giới hạn bộ nhớ.",
    ],
    skills: [
      { skill: "lx-apt-repo", level: "Biết đường dẫn, sửa được" },
      { skill: "k-crictl-config", level: "Viết được không tra" },
      { skill: "k-crictl-ps", level: "Gõ được không tra" },
      { skill: "k-crictl-images", level: "Gõ được không tra" },
      { skill: "lx-ctr-images", level: "Gõ được không tra" },
      { skill: "lx-ctr-run", level: "Làm được có tra" },
      { skill: "lx-proc-ns-cgroup", level: "Giải thích được" },
    ],
    uses: ["lx-systemctl-unit", "lx-journalctl-unit", "lx-apt-hold", "net-curl-nc", "net-ss-listen"],
    foundation: {
      area: "linux",
      md: `**Ba công cụ, một runtime.** Trên node Kubernetes không có Docker. Thứ chạy container là **containerd** (một unit systemd), và bạn nói chuyện với nó bằng hai CLI khác nhau:

| Công cụ | Nói chuyện qua | Dùng khi |
|---|---|---|
| \`ctr\` | API riêng của containerd | Việc cấp thấp: nạp image từ tệp tar, chạy thử một container, xem namespace của containerd |
| \`crictl\` | **CRI** — đúng giao diện mà kubelet dùng | Gỡ lỗi node trong đề thi: \`crictl ps\`, \`crictl logs\`, \`crictl images\`, \`crictl pods\` |
| \`kubectl\` | API server | Mọi thứ còn lại — nhưng khi apiserver chết, chỉ còn \`crictl\` |

containerd chia dữ liệu theo **namespace của containerd** (không liên quan namespace Kubernetes hay Linux): kubelet dùng namespace \`k8s.io\`. Nạp image vào namespace khác (\`ctr images import\` không có \`-n k8s.io\` sẽ vào \`default\`) thì kubelet không thấy.

\`crictl\` cần biết socket của runtime: \`/etc/crictl.yaml\` với \`runtime-endpoint: unix:///run/containerd/containerd.sock\`. Thiếu tệp này nó đoán và in cảnh báo dài.

**Tên image đầy đủ.** \`shop/catalog:1.0\` thật ra là \`docker.io/shop/catalog:1.0\` — Docker, containerd và kubelet đều tự thêm \`docker.io/\` vào tên ngắn. \`ctr\` thì không tự thêm khi chạy: bạn phải gõ tên đầy đủ.

**Container = tiến trình + namespace + cgroup.** Không có "máy ảo nhỏ" nào cả:
- **Namespace Linux** (\`pid\`, \`net\`, \`mnt\`, \`uts\`, \`ipc\`…) quyết định tiến trình *nhìn thấy* gì. \`lsns -p <pid>\` liệt kê; \`--net-host\` nghĩa là *không* tạo namespace mạng riêng, dùng chung mạng node (như s04 nhưng ngược lại).
- **cgroup** quyết định tiến trình *được dùng* bao nhiêu: \`/proc/<pid>/cgroup\` chỉ ra nhóm, \`/sys/fs/cgroup/<nhóm>/memory.max\` là trần bộ nhớ.

**Repo apt bên thứ ba** theo kiểu hiện đại: khoá ký vào \`/etc/apt/keyrings/<tên>.gpg\`, một dòng \`deb [signed-by=…] <url> /\` trong \`/etc/apt/sources.list.d/<tên>.list\`, rồi \`apt-get update\`. Repo pkgs.k8s.io tách theo **minor** (\`…/core:/stable:/v1.36/deb/\`): muốn nâng minor phải đổi URL — điều bạn sẽ làm ở buổi nâng cấp.

**Bài tập nền (10 phút, sau khi cài xong ở nhiệm vụ 2):**
1. \`systemctl status containerd\` và \`journalctl -u containerd -n 20 --no-pager\`.
2. \`sudo ctr namespaces ls\` trước và sau khi nạp image.
3. \`sudo crictl info | jq -c '[.status.conditions[] | {type, status}]'\` in nguyên văn \`[{"type":"RuntimeReady","status":true},{"type":"NetworkReady","status":false},{"type":"ContainerdHasNoDeprecationWarnings","status":true}]\` — runtime sẵn sàng nhưng mạng thì chưa (chưa có CNI: lý do node \`NotReady\` ở chặng 1). Rồi \`sudo crictl info | jq '.config.cni.confDir, .config.containerd.runtimes.runc.options.SystemdCgroup'\` in hai dòng \`"/etc/cni/net.d"\` và \`false\`: thư mục CNI và cgroup driver mà chặng 1 sẽ sửa (\`jq\` đã cài ở s03).
4. \`ps -o pid,user,cmd -C containerd\` — containerd cũng chỉ là một tiến trình chạy bằng root.

Đọc thêm: phần Container & Docker trong [Kiến thức nền tảng](#/docs/prerequisites).`,
    },
    mindset: `Với người làm Java, đây là buổi gỡ "phép màu" của container. Khi bạn chạy \`shop/catalog:1.0\`, trên node chỉ có **một tiến trình \`java\`** — \`ps\` thấy nó, \`kill\` giết được nó, nó chạy bằng uid 10001 như \`USER\` trong Dockerfile. Thứ làm nó "là container" là ba lớp mà kernel gắn vào: namespace (nhìn thấy gì), cgroup (được dùng bao nhiêu), và rootfs từ image (tệp nào).

**JVM đọc cgroup — nếu nhìn thấy nó.** Image shop chạy \`java -XX:MaxRAMPercentage=75\`. JDK 10 (và 8u191) bắt đầu đọc giới hạn cgroup v1; đọc \`memory.max\` của cgroup v2 — chế độ mặc định trên Ubuntu 24.04 — cần JDK 15+, 11.0.16+ hoặc 8u372+ (image shop dùng JDK 25). Khi đọc được, JVM lấy 75% trần làm heap tối đa. Nhưng nó chỉ đọc được khi cây cgroup được gắn vào trong container. Hôm nay bạn sẽ đo bằng tay (containerd/ctr 2.2.1 trên cka-cp): spec mặc định của \`ctr run\` gắn \`/sys\` (sysfs, chỉ đọc) nhưng **không** gắn cgroup và không tạo cgroup namespace, nên trong container \`/sys/fs/cgroup\` rỗng. Với \`--memory-limit 512 MiB\`, kernel vẫn áp giới hạn mà JVM vẫn tính heap theo 3 GB RAM của VM (≈2,2 GB) — đúng kiểu lỗi kinh điển "heap to hơn limit, bị OOM giết". Gắn \`/sys/fs/cgroup\` vào thì heap co về 384 MiB. Container của Pod do containerd tạo qua CRI thì được gắn cgroup sẵn (bạn sẽ kiểm lại bên trong Pod ở chặng 3), nên ở chặng 3, \`resources.limits.memory\` vừa là trần của kernel vừa là thứ JVM dùng để tính heap; \`OOMKilled\` là kernel thực thi trần đó. Bài [Tomcat Thread Pool: pool size bao nhiêu là đủ?](#/docs/java-07) có phần container-aware JVM và CFS throttling (giới hạn CPU) — đọc sau buổi này sẽ thấy rất cụ thể.

**Vì sao crictl quan trọng hơn ctr.** Từ chặng 1, mọi container trên node do kubelet tạo qua CRI; \`crictl ps\` là "\`docker ps\` của node". Hôm nay bạn sẽ thấy \`crictl ps\` **không** hiện container \`catalog\` chạy bằng \`ctr\` — vì nó không phải Pod do CRI tạo. Phân biệt được hai lớp này giúp bạn khỏi bối rối khi apiserver chết và \`kubectl\` không trả lời: bạn vẫn \`crictl ps -a\` và \`crictl logs\` được.

**Không registry.** Image build trên Mac, \`docker save\` thành tar, chuyển vào VM, \`ctr -n k8s.io images import\`. \`./labs/lab images cka\` làm đúng chuỗi đó cho cả sáu image. Kubelet sau này dùng thẳng image có sẵn trong \`k8s.io\` (với \`imagePullPolicy: IfNotPresent\`).`,
    refs: [
      { label: "Kiến thức nền tảng — Phần 3: Container & Docker", href: "#/docs/prerequisites" },
      { label: "Java 07 — container-aware JVM, MaxRAMPercentage, CFS throttling", href: "#/docs/java-07" },
      { label: "Bài lộ trình CKA: Node components — container runtime (containerd)", href: "#/roadmap/cka/cka-w1-2" },
      { label: "Bài lộ trình CKA: Cài containerd, kubeadm, kubelet, kubectl", href: "#/roadmap/cka/cka-w2-1" },
      { label: "Thực hành nhanh: crictl ps, crictl images", href: "#/commands" },
      { label: "kubernetes.io: Debugging Kubernetes nodes with crictl", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/" },
      { label: "kubernetes.io: Container Runtimes — containerd", href: "https://kubernetes.io/docs/setup/production-environment/container-runtimes/#containerd" },
    ],
    stateIn: `Đầu ra s04 ở phần **bền**: ba VM ssh qua lại được, dotfile phòng thi, \`shop-heartbeat\` chạy, \`jq\` hold, \`~/drills/s04/answers.env\` có đủ ba khoá. Namespace \`shop-a\`/\`shop-b\` và chain \`SHOP-DEMO\` mất nếu VM đã tắt — không sao, \`./labs/lab begin cka s05\` dùng \`check.sh\` riêng chỉ kiểm phần bền. Trên Mac, Docker đã có sáu image \`shop/*:1.0|2.0\` (arm64); trong VM chưa có containerd.`,
    stateOut: "containerd active trên cka-cp, crictl chạy được, image shop/catalog:1.0 có trong namespace k8s.io và trả UP ở /actuator/health.",
    tasks: [
      { id: "t1", text: "Trên cka-cp (`sudo -i`): thêm repo pkgs.k8s.io bản `v1.36` — khoá vào `/etc/apt/keyrings/kubernetes-apt-keyring.gpg`, dòng `deb` vào `/etc/apt/sources.list.d/kubernetes.list`; `apt-get update`." },
      { id: "t2", text: "`apt-get install -y containerd cri-tools`; `systemctl is-active containerd`; `apt-cache policy cri-tools` phải thấy bản đến từ pkgs.k8s.io." },
      { id: "t3", text: "Viết `/etc/crictl.yaml` (runtime-endpoint và image-endpoint trỏ `unix:///run/containerd/containerd.sock`); `crictl info` chạy không cảnh báo; `crictl ps` và `crictl images` rỗng." },
      { id: "t4", text: "Trên **Mac**: `./labs/lab images cka` (nạp sáu image; hai worker bị bỏ qua vì chưa có containerd — đúng như mong đợi). Trên cka-cp: `ctr -n k8s.io images ls -q`, `crictl images`, và `ctr images ls -q` (namespace `default`, rỗng)." },
      { id: "t5", text: "Chạy catalog: `ctr -n k8s.io run -d --net-host --memory-limit 805306368 docker.io/shop/catalog:1.0 catalog`; chờ rồi `curl -s localhost:8080/actuator/health` phải ra `UP`; `ss -tlnp | grep 8080`." },
      { id: "t6", text: "Soi tiến trình: `ctr -n k8s.io task ls` lấy PID; `ps -o pid,user,cmd -p <pid>`; `lsns -p <pid>`; `cat /proc/<pid>/cgroup`; đọc `memory.max` của cgroup đó. Rồi `crictl ps` — vì sao không thấy catalog?" },
      { id: "t7", text: "Đo `MaxHeapSize` của JVM ba lần: không giới hạn, `--memory-limit 536870912`, và có giới hạn kèm gắn `/sys/fs/cgroup` (Cách xử lý mục 7). Giải thích vì sao lần 2 giống lần 1. Rồi trên Mac: `./labs/lab verify cka s05` phải đạt 5/5." },
    ],
    hints: [
      "Khoá: `curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.36/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg`. Dòng repo kết thúc bằng ` /` (dấu cách rồi gạch chéo) — repo này không có tên bản phân phối.",
      "Gói `containerd` lấy từ kho Ubuntu, `cri-tools` từ pkgs.k8s.io; repo Kubernetes không phát hành containerd.",
      "`ctr run` cần tên image **đầy đủ** `docker.io/shop/catalog:1.0` và một id container (`catalog`). `ctr: image \"shop/catalog:1.0\": not found` nghĩa là bạn quên `docker.io/` hoặc quên `-n k8s.io`.",
      "Spring Boot cần vài giây để lên: `curl` báo `Connection refused` lúc đầu là bình thường (chưa ai nghe 8080). Xem log bằng cách chạy không `-d` ở một pane tmux, hoặc đợi rồi thử lại.",
      "Container `catalog` đã tồn tại (chạy lại lệnh `run` báo `already exists`): `ctr -n k8s.io task kill -s SIGKILL catalog; ctr -n k8s.io task rm catalog; ctr -n k8s.io container rm catalog` rồi chạy lại.",
    ],
    solution: `Làm bằng root (\`sudo -i\`) trên cka-cp, trừ bước nạp image chạy trên Mac.

**1. Repo pkgs.k8s.io đúng minor**

\`\`\`bash
install -d -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.36/deb/Release.key \\
  | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.36/deb/ /' \\
  > /etc/apt/sources.list.d/kubernetes.list
apt-get update
\`\`\`

Đây là đúng hai dòng trên trang *Installing kubeadm*. \`signed-by\` gắn khoá vào **riêng** repo này (không tin khoá đó cho mọi repo khác).

**2. containerd và cri-tools**

\`\`\`bash
apt-get install -y containerd cri-tools
systemctl is-active containerd            # active
apt-cache policy cri-tools | head -3      # Installed: 1.36.0-1.1 … pkgs.k8s.io/core:/stable:/v1.36
\`\`\`

\`containerd\` đến từ kho Ubuntu (bản 2.x trên 24.04), \`cri-tools\` (lệnh \`crictl\`) từ pkgs.k8s.io.

**3. crictl nói chuyện với containerd** — \`vim /etc/crictl.yaml\`:

\`\`\`yaml
runtime-endpoint: unix:///run/containerd/containerd.sock
image-endpoint: unix:///run/containerd/containerd.sock
timeout: 10
\`\`\`

\`\`\`bash
crictl info >/dev/null && echo ok
crictl ps; crictl images                   # rỗng: chưa có gì
\`\`\`

**4. Nạp image** — trên **Mac**, ở gốc repo:

\`\`\`bash
./labs/lab images cka
\`\`\`

Lệnh này \`docker save\` sáu image thành một tệp tar, chuyển vào từng VM đang chạy có containerd (hai worker bị bỏ qua — chưa có containerd, đúng ý), rồi \`ctr -n k8s.io images import\`. Quay lại cka-cp:

\`\`\`bash
ctr -n k8s.io images ls -q | grep shop     # docker.io/shop/catalog:1.0 … (tên đầy đủ)
crictl images | grep shop                  # cùng image, nhìn qua CRI
ctr images ls -q | wc -l                   # 0 — namespace "default" không có gì
\`\`\`

**5. Chạy catalog bằng ctr, mạng host**

\`\`\`bash
ctr -n k8s.io run -d --net-host --memory-limit 805306368 docker.io/shop/catalog:1.0 catalog
sleep 15; curl -s localhost:8080/actuator/health    # {"groups":["liveness","readiness"],"status":"UP"}
ss -tlnp | grep 8080                                # users:(("java",pid=…))
\`\`\`

\`805306368\` = 768 MiB. \`--net-host\` nên cổng 8080 của Java mở thẳng trên node — chưa có Service, chưa có Pod IP.

**6. Container chỉ là một tiến trình**

\`\`\`bash
ctr -n k8s.io task ls                      # catalog  <PID>  RUNNING
P=<PID>
ps -o pid,ppid,user,cmd -p $P              # 10001  java -XX:MaxRAMPercentage=75 -jar /app/app.jar
lsns -p $P                                 # mnt, uts, ipc, pid riêng; net dùng chung với /sbin/init (--net-host)
cat /proc/$P/cgroup                        # 0::/k8s.io/catalog
cat /sys/fs/cgroup/k8s.io/catalog/memory.max       # 805306368
cat /sys/fs/cgroup/k8s.io/catalog/memory.current   # đang dùng bao nhiêu byte
crictl ps -a                               # rỗng!
\`\`\`

Tiến trình là \`java\` chứ không phải \`sh\`: ENTRYPOINT của image là \`sh -c "exec java …"\`, \`exec\` thay shell bằng java — nhờ vậy java nhận thẳng SIGTERM khi bị dừng (điều kiện của graceful shutdown ở chặng 2). \`crictl ps\` rỗng vì container này không do CRI tạo, không thuộc Pod nào.

**7. JVM có thấy giới hạn bộ nhớ không?** Chạy ba lần một JVM ngắn, so \`MaxHeapSize\`:

\`\`\`bash
IMG=docker.io/shop/catalog:1.0
J='java -XX:MaxRAMPercentage=75 -XX:+PrintFlagsFinal -version'
ctr -n k8s.io run --rm $IMG j1 $J 2>/dev/null | grep ' MaxHeapSize '
#   = 2325741568   (≈ 75% RAM của VM 3 GB: không giới hạn)
ctr -n k8s.io run --rm --memory-limit 536870912 $IMG j2 $J 2>/dev/null | grep ' MaxHeapSize '
#   = 2325741568   (!) có giới hạn 512 MiB mà JVM vẫn tính theo RAM của máy
ctr -n k8s.io run --rm --memory-limit 536870912 \\
  --mount type=bind,src=/sys/fs/cgroup,dst=/sys/fs/cgroup,options=rbind:ro $IMG j3 $J 2>/dev/null | grep ' MaxHeapSize '
#   = 402653184    (384 MiB = 75% của 512 MiB)
\`\`\`

Lần 2 là bài học quan trọng nhất buổi: kernel **vẫn áp** trần 512 MiB (\`memory.max\` của cgroup), nhưng spec mặc định của \`ctr run\` (containerd 2.2.1: kiểm bằng \`ctr oci spec | jq '.mounts[].destination'\`) chỉ gắn \`/sys\` dạng sysfs chỉ đọc, không gắn cgroup — trong container \`grep -c cgroup /proc/self/mountinfo\` ra \`0\`, \`/sys/fs/cgroup\` rỗng — nên JVM không đọc được trần, cho heap tới 2,2 GB — heap lớn dần là bị kernel giết (OOM). Lần 3 gắn cây cgroup vào thì JVM đọc được \`memory.max\` và tự co heap. Container của Pod do containerd tạo qua CRI thì có cgroup namespace riêng và \`/sys/fs/cgroup\` được gắn sẵn, nên trong Pod JVM thấy đúng limit (chặng 3 bạn sẽ chạy lại phép đo này bên trong Pod) — đây chính là cơ chế đứng sau \`resources.limits.memory\` và \`OOMKilled\` ở chặng 3.

Lời giải tự động: \`labs/cka/sessions/s05/apply.sh\` (bước 1–3 ở \`files/install-containerd.sh\`, bước 5 ở \`files/run-catalog.sh\`).`,
    exam: {
      patterns: [
        "Control plane chết, `kubectl` không trả lời: `ssh` vào control plane, `crictl ps -a | grep kube-apiserver`, `crictl logs <id>` để đọc vì sao static pod không lên.",
        "Câu đọc log container trên một node cụ thể, hoặc liệt kê image đang có trên node: `crictl logs`, `crictl images`.",
        "Câu chuẩn bị node: cài container runtime và cri-tools từ đúng repo, cấu hình `/etc/crictl.yaml`.",
        "Pod `OOMKilled`, `CrashLoopBackOff` vì bộ nhớ: hiểu limit là trần cgroup và JVM co heap theo trần đó.",
      ],
      timeTargetMin: 3,
      drills: [
        {
          text: "Trên cka-cp: liệt kê image trong namespace `k8s.io` bằng hai công cụ khác nhau và giải thích vì sao `ctr images ls` (không có `-n`) rỗng. Giới hạn 2 phút.",
          timeLimitMin: 2,
          solution: "```bash\nsudo ctr -n k8s.io images ls -q | grep shop\nsudo crictl images | grep shop\nsudo ctr images ls -q          # namespace default — rỗng\n```\n`ctr` mặc định dùng namespace `default`; kubelet và crictl dùng `k8s.io`.",
        },
        {
          text: "Container `catalog` đang chạy bằng ctr: cho biết PID trên node, user chạy tiến trình và trần bộ nhớ cgroup của nó. Giới hạn 3 phút.",
          timeLimitMin: 3,
          solution: "```bash\nsudo ctr -n k8s.io task ls                 # cột PID\nps -o pid,user,cmd -p <pid>               # uid 10001 (USER trong Dockerfile)\ncat /proc/<pid>/cgroup                    # 0::/k8s.io/catalog\ncat /sys/fs/cgroup/k8s.io/catalog/memory.max   # 805306368\n```",
        },
      ],
    },
    tips: [
      "Đầu giờ thi, trên node nào cũng thử `crictl ps` một lần: nếu nó cảnh báo endpoint, `/etc/crictl.yaml` chưa có — viết nhanh hai dòng.",
      "`crictl` là lệnh của node (cần `sudo`), không phải của cluster: nó chỉ thấy container trên **node đang đứng**.",
      "`ctr` không tự thêm `docker.io/`; `crictl` và kubelet thì có. Lỗi \"not found\" với ctr gần như luôn là tên image ngắn.",
      "Sau reboot, task do `ctr run` tạo không tự chạy lại (không có ai giám sát nó — khác với Pod có kubelet). Container vẫn còn, task thì mất.",
    ],
    outcome: {
      md: `Trên cka-cp: containerd chạy dưới systemd, \`crictl\` nói chuyện được với nó, sáu image shop có trong namespace \`k8s.io\`, và \`catalog\` 1.0 chạy bằng \`ctr\` trên mạng của node, trả \`UP\`. Trên Mac:

\`\`\`bash
./labs/lab verify cka s05
\`\`\`

Container \`catalog\` chạy bằng \`ctr\` không bền qua reboot (verify sẽ hỏng dòng cuối nếu VM đã tắt) — bình thường, chặng 1 xoá nó trước khi dựng cluster.`,
      verifyOutput: "lab: kiểm s05\n  ✓ containerd active\n  ✓ /etc/crictl.yaml trỏ tới containerd.sock\n  ✓ crictl info chạy được\n  ✓ ctr -n k8s.io images ls có shop/catalog:1.0\n  ✓ curl localhost:8080/actuator/health trả UP\n  → 5/5 đạt",
      projectDelta: "Mảnh **Image shop** đã có: sáu image `shop/gateway|catalog|order:1.0|2.0` nằm trong containerd của `cka-cp`, và `catalog` đã chạy thật lần đầu trên node — chưa có Kubernetes. Chặng 0 xong: mốc `st0-done`.",
    },
    review: [
      { q: "`ctr`, `crictl`, `kubectl` khác nhau thế nào, cái nào dùng khi apiserver chết?", a: "`ctr` dùng API riêng của containerd (cấp thấp), `crictl` dùng CRI như kubelet, `kubectl` gọi apiserver. Apiserver chết thì `crictl ps -a`, `crictl logs` trên node." },
      { q: "Vì sao image nạp bằng `ctr images import` (không `-n`) không dùng được cho kubelet?", a: "Nó vào namespace containerd `default`; kubelet chỉ dùng namespace `k8s.io`. Phải `ctr -n k8s.io images import`." },
      { q: "`/etc/crictl.yaml` chứa gì?", a: "`runtime-endpoint: unix:///run/containerd/containerd.sock` (và `image-endpoint` cùng socket), tuỳ chọn `timeout`." },
      { q: "JVM `-XX:MaxRAMPercentage=75` trong container giới hạn 512 MiB: heap tối đa bao nhiêu? Khi nào JVM lại tính sai?", a: "384 MiB (75% của `memory.max`) khi JVM đọc được cgroup — như trong Pod. Với `ctr run` trần, `/sys/fs/cgroup` không được gắn vào container nên JVM tính theo RAM của máy (≈2,2 GB) dù kernel vẫn áp trần 512 MiB." },
      { q: "Vì sao `crictl ps` không thấy container `catalog` chạy bằng `ctr run`?", a: "crictl chỉ liệt kê container được tạo qua CRI (thuộc một Pod sandbox); container tạo thẳng bằng ctr không có metadata CRI." },
    ],
  },
];
