// Danh mục kỹ năng của chương trình CKA. Mỗi kỹ năng được HỌC ở đúng một buổi
// (session.skills) và có thể được DÙNG LẠI ở các buổi sau (session.uses) —
// check-data PR5. Nhóm theo buổi học để dễ soát; thứ tự trong mảng không có ý
// nghĩa gì khác.
//
// kind: command | yaml | procedure | concept | docs | path
// area: kubernetes (k-) | vim (vim-) | linux (lx-) | network (net-)
// ref:  mục tương ứng trong Thực hành nhanh (data/kubernetes/commands.js,
//       commands-admin.js, snippets.js, playbooks.js) — chỉ khai khi có thật.

const cmd = (id) => ({ type: "command", id });
const yaml = (id) => ({ type: "snippet", id });
const pb = (id) => ({ type: "playbook", id });

export const skills = [
  // ── s01 Multipass, ba VM và ssh ──
  { id: "lx-multipass-shell", kind: "command", area: "linux", label: "multipass shell cka-cp; multipass exec cka-w1 -- hostname" },
  { id: "lx-sudo-i", kind: "command", area: "linux", label: "sudo -i — làm việc bằng root trên node như đề yêu cầu" },
  { id: "lx-ssh-keygen", kind: "command", area: "linux", label: "ssh-keygen -t ed25519 -N '' -f ~/.ssh/id_ed25519" },
  { id: "lx-authorized-keys", kind: "path", area: "linux", label: "~/.ssh/authorized_keys (tệp 600, thư mục ~/.ssh 700)" },
  { id: "net-etc-hosts", kind: "path", area: "network", label: "/etc/hosts — khai cka-cp, cka-w1, cka-w2" },
  { id: "net-getent-hosts", kind: "command", area: "network", label: "getent hosts cka-w1" },
  { id: "net-ssh-node", kind: "command", area: "network", label: "ssh cka-w1 — nhảy giữa các node như trong phòng thi" },

  // ── s02 vim, tmux và bash ──
  { id: "vim-vimrc-yaml", kind: "path", area: "vim", label: "~/.vimrc: set expandtab tabstop=2 shiftwidth=2", ref: cmd("c004") },
  { id: "vim-move-jump", kind: "command", area: "vim", label: "gg, G, :42, /pattern, n, % — nhảy tới dòng lỗi" },
  { id: "vim-delete-yank", kind: "command", area: "vim", label: "dd, 5dd, d}, yy, p, u, Ctrl-r" },
  { id: "vim-visual-indent", kind: "command", area: "vim", label: "V chọn dòng rồi > hoặc < — thụt lề cả khối YAML" },
  { id: "vim-substitute", kind: "command", area: "vim", label: ":%s/v1/v2/g và :10,20s/cũ/mới/gc" },
  { id: "lx-tmux-panes", kind: "command", area: "linux", label: `tmux: Ctrl-b % và Ctrl-b " chia pane, Ctrl-b o chuyển pane` },
  { id: "k-alias-k", kind: "command", area: "kubernetes", label: "alias k=kubectl", ref: cmd("c001") },
  { id: "k-exam-vars", kind: "command", area: "kubernetes", label: `export do="--dry-run=client -o yaml"; export now="--force --grace-period=0"`, ref: cmd("c002") },

  // ── s03 Linux quản trị ──
  { id: "lx-systemctl-unit", kind: "command", area: "linux", label: "systemctl status | start | stop | enable --now | is-enabled <unit>" },
  { id: "lx-unit-file", kind: "path", area: "linux", label: "/etc/systemd/system/<tên>.service — [Unit], [Service], [Install]" },
  { id: "lx-journalctl-unit", kind: "command", area: "linux", label: "journalctl -u <unit> -f; journalctl -u <unit> -n 50 --no-pager" },
  { id: "lx-ps-proc", kind: "command", area: "linux", label: "ps -ef --forest; pgrep -a java; kill -TERM <pid>" },
  { id: "lx-useradd", kind: "command", area: "linux", label: "useradd -m -s /bin/bash shop; id shop" },
  { id: "lx-chown-chmod", kind: "command", area: "linux", label: "chown -R shop:shop /opt/shop; chmod 750 /opt/shop" },
  { id: "lx-apt-hold", kind: "command", area: "linux", label: "apt-get install -y jq; apt-mark hold jq; apt-mark showhold" },

  // ── s04 Linux network ──
  { id: "net-ip-addr", kind: "command", area: "network", label: "ip -br addr; ip link show" },
  { id: "net-ip-route", kind: "command", area: "network", label: "ip route; ip route get 1.1.1.1 — tìm default gateway và card ra" },
  { id: "net-resolv", kind: "command", area: "network", label: "resolvectl status; cat /etc/resolv.conf" },
  { id: "net-ss-listen", kind: "command", area: "network", label: "ss -tlnp — tiến trình nào đang nghe cổng nào", ref: cmd("ca023") },
  { id: "net-curl-nc", kind: "command", area: "network", label: "curl -sv http://host:port/path; nc -zv -w2 host port" },
  { id: "net-iptables-read", kind: "command", area: "network", label: "iptables -L -n -v --line-numbers; iptables-save | grep <chain>" },
  { id: "net-netns-veth", kind: "command", area: "network", label: "ip netns add shop-a; ip link add veth-a type veth peer name veth-b" },

  // ── s05 Container thuần ──
  { id: "lx-apt-repo", kind: "path", area: "linux", label: "/etc/apt/sources.list.d/kubernetes.list và /etc/apt/keyrings/kubernetes-apt-keyring.gpg (pkgs.k8s.io)" },
  { id: "k-crictl-config", kind: "path", area: "kubernetes", label: "/etc/crictl.yaml: runtime-endpoint: unix:///run/containerd/containerd.sock" },
  { id: "k-crictl-ps", kind: "command", area: "kubernetes", label: "crictl ps -a", ref: cmd("ca019") },
  { id: "k-crictl-images", kind: "command", area: "kubernetes", label: "crictl images", ref: cmd("ca022") },
  { id: "lx-ctr-images", kind: "command", area: "linux", label: "ctr -n k8s.io images import shop.tar; ctr -n k8s.io images ls" },
  { id: "lx-ctr-run", kind: "command", area: "linux", label: "ctr -n k8s.io run -d --net-host shop/catalog:1.0 catalog" },
  { id: "lx-proc-ns-cgroup", kind: "concept", area: "linux", label: "Container = tiến trình + namespace + cgroup: lsns -p <pid>, /proc/<pid>/cgroup" },

  // ── s06 Chuẩn bị node ──
  { id: "lx-swapoff", kind: "command", area: "linux", label: "swapoff -a và comment dòng swap trong /etc/fstab" },
  { id: "lx-modules-load", kind: "path", area: "linux", label: "modprobe overlay br_netfilter; /etc/modules-load.d/k8s.conf" },
  { id: "net-sysctl-k8s", kind: "path", area: "network", label: "/etc/sysctl.d/k8s.conf: net.ipv4.ip_forward = 1, net.bridge.bridge-nf-call-iptables = 1; sysctl --system" },
  { id: "k-containerd-systemdcgroup", kind: "path", area: "kubernetes", label: "/etc/containerd/config.toml: SystemdCgroup = true (từ containerd config default)" },
  { id: "k-install-kubeadm", kind: "procedure", area: "kubernetes", label: "Cài kubeadm, kubelet, kubectl đúng minor từ pkgs.k8s.io rồi apt-mark hold" },
  { id: "lx-daemon-reload", kind: "command", area: "linux", label: "systemctl daemon-reload && systemctl restart kubelet", ref: cmd("ca016") },
  { id: "lx-journalctl-filter", kind: "command", area: "linux", label: `journalctl -u containerd -p err --since "10 min ago" --no-pager` },
  { id: "k-docs-install-kubeadm", kind: "docs", area: "kubernetes", label: "kubernetes.io: Installing kubeadm" },

  // ── s07 kubeadm init, CNI, join ──
  { id: "k-kubeadm-init", kind: "command", area: "kubernetes", label: "kubeadm init --pod-network-cidr=<CIDR> --apiserver-advertise-address=<IP cka-cp>", ref: cmd("ca001") },
  { id: "k-kubeconfig-admin", kind: "path", area: "kubernetes", label: "/etc/kubernetes/admin.conf → ~/.kube/config (chown theo user)" },
  { id: "k-calico-install", kind: "procedure", area: "kubernetes", label: "Cài Calico bằng tigera-operator và custom-resources.yaml khớp pod CIDR" },
  { id: "k-kubeadm-token", kind: "command", area: "kubernetes", label: "kubeadm token create --print-join-command", ref: cmd("ca002") },
  { id: "k-join-worker", kind: "procedure", area: "kubernetes", label: "Join worker: chuẩn bị node → kubeadm join … → kiểm Ready", ref: pb("pb-join-worker") },
  { id: "k-get-nodes-wide", kind: "command", area: "kubernetes", label: "k get nodes -o wide", ref: cmd("ca014") },
  { id: "net-cidr-plan", kind: "concept", area: "network", label: "Ba dải địa chỉ: IP node, pod CIDR, service CIDR — không được chồng nhau" },

  // ── s08 Giải phẫu cluster ──
  { id: "k-static-pod-dir", kind: "path", area: "kubernetes", label: "/etc/kubernetes/manifests — kubelet tự chạy mọi manifest ở đây (staticPodPath)" },
  { id: "k-static-pod-yaml", kind: "yaml", area: "kubernetes", label: "Static Pod manifest", ref: yaml("sn-static-pod") },
  { id: "k-pki-dir", kind: "path", area: "kubernetes", label: "/etc/kubernetes/pki — ca.crt, apiserver.crt, front-proxy, etcd/" },
  { id: "k-kubeconfig-files", kind: "path", area: "kubernetes", label: "/etc/kubernetes/{admin,super-admin,controller-manager,scheduler,kubelet}.conf" },
  { id: "k-kubelet-config", kind: "path", area: "kubernetes", label: "/var/lib/kubelet/config.yaml — cgroupDriver, staticPodPath, clusterDNS" },
  { id: "k-ext-interfaces", kind: "concept", area: "kubernetes", label: "CRI, CNI, CSI: kubelet nói chuyện với runtime, mạng và storage qua giao diện nào" },
  { id: "k-certs-check-expiration", kind: "command", area: "kubernetes", label: "kubeadm certs check-expiration" },
  { id: "k-kubectl-completion", kind: "command", area: "kubernetes", label: "source <(kubectl completion bash); complete -o default -F __start_kubectl k" },

  // ── s09 Sự cố chặng 1: node NotReady ──
  { id: "k-node-conditions", kind: "command", area: "kubernetes", label: "k describe node cka-w1 — đọc Conditions, Taints, Events" },
  { id: "k-kubelet-status", kind: "command", area: "kubernetes", label: "systemctl status kubelet", ref: cmd("ca015") },
  { id: "k-kubelet-journal", kind: "command", area: "kubernetes", label: `journalctl -u kubelet --since "15 min ago" --no-pager | tail -50`, ref: cmd("ca018") },
  { id: "k-kubelet-dropin", kind: "path", area: "kubernetes", label: "/usr/lib/systemd/system/kubelet.service.d/10-kubeadm.conf và /etc/default/kubelet (KUBELET_EXTRA_ARGS)" },
  { id: "k-node-notready-flow", kind: "procedure", area: "kubernetes", label: "Debug node NotReady: node → kubelet → runtime → tệp cấu hình", ref: pb("pb-node-notready") },
  { id: "lx-systemctl-cat", kind: "command", area: "linux", label: "systemctl cat kubelet — xem unit cùng mọi drop-in" },

  // ── s10 Pod đầu tiên ──
  { id: "k-run-pod", kind: "command", area: "kubernetes", label: "k run catalog --image=shop/catalog:1.0 --port=8080", ref: cmd("c010") },
  { id: "k-run-dry-yaml", kind: "command", area: "kubernetes", label: "k run … $do > pod.yaml rồi sửa bằng vim", ref: cmd("c014") },
  { id: "k-logs", kind: "command", area: "kubernetes", label: "k logs <pod> -f", ref: cmd("c017") },
  { id: "k-exec", kind: "command", area: "kubernetes", label: "k exec -it <pod> -- sh", ref: cmd("c015") },
  { id: "k-port-forward", kind: "command", area: "kubernetes", label: "k port-forward pod/<pod> 8080:8080", ref: cmd("c019") },
  { id: "k-describe-pod", kind: "command", area: "kubernetes", label: "k describe pod <pod> — đọc Events ở cuối", ref: cmd("c077") },
  { id: "k-get-wide", kind: "command", area: "kubernetes", label: "k get pod -o wide — Pod chạy ở node nào, IP gì", ref: cmd("c085") },
  { id: "k-delete-now", kind: "command", area: "kubernetes", label: "k delete pod <pod> $now", ref: cmd("c020") },

  // ── s11 Deployment, ReplicaSet, Service tối thiểu ──
  { id: "k-create-deploy", kind: "command", area: "kubernetes", label: "k create deploy catalog --image=shop/catalog:1.0 --replicas=2 $do > catalog.yaml", ref: cmd("c022") },
  { id: "k-scale", kind: "command", area: "kubernetes", label: "k scale deploy catalog --replicas=3", ref: cmd("c023") },
  { id: "k-expose", kind: "command", area: "kubernetes", label: "k expose deploy catalog --port=80 --target-port=8080", ref: cmd("c054") },
  { id: "k-deploy-rs-pod", kind: "concept", area: "kubernetes", label: "Deployment → ReplicaSet → Pod: ownerReferences và pod-template-hash" },
  { id: "k-labels-selectors", kind: "command", area: "kubernetes", label: "k get pods -l app=catalog --show-labels", ref: cmd("c090") },
  { id: "vim-paste-mode", kind: "command", area: "vim", label: ":set paste trước khi dán YAML từ kubernetes.io, :set nopaste sau đó" },
  { id: "vim-macro", kind: "command", area: "vim", label: "qa … q rồi 3@a — lặp một chỉnh sửa trên nhiều manifest" },
  { id: "k-docs-kubectl-ref", kind: "docs", area: "kubernetes", label: "kubernetes.io: kubectl Quick Reference" },

  // ── s12 ConfigMap và Secret ──
  { id: "k-cm-literal", kind: "command", area: "kubernetes", label: "k create cm catalog-config --from-literal=KEY=val", ref: cmd("c036") },
  { id: "k-cm-file", kind: "command", area: "kubernetes", label: "k create cm catalog-config --from-file=application.yaml", ref: cmd("c037") },
  { id: "k-secret-generic", kind: "command", area: "kubernetes", label: "k create secret generic db-cred --from-literal=password=…", ref: cmd("c039") },
  { id: "k-cm-envfrom-volume", kind: "yaml", area: "kubernetes", label: "Pod dùng ConfigMap qua envFrom và volume", ref: yaml("sn-pod-use-configmap") },
  { id: "k-secret-env-volume", kind: "yaml", area: "kubernetes", label: "Pod dùng Secret qua env và volume", ref: yaml("sn-secret-pod") },
  { id: "lx-base64", kind: "command", area: "linux", label: "echo -n 's3cret' | base64; echo 'czNjcmV0' | base64 -d", ref: cmd("c043") },
  { id: "k-secret-jsonpath", kind: "command", area: "kubernetes", label: "k get secret db-cred -o jsonpath='{.data.password}' | base64 -d", ref: cmd("c044") },
  { id: "vim-visual-block", kind: "command", area: "vim", label: "Ctrl-v chọn cột rồi I# Esc — comment nhiều dòng một lúc" },

  // ── s13 Probe, vòng đời Pod, graceful shutdown ──
  { id: "k-probes-yaml", kind: "yaml", area: "kubernetes", label: "livenessProbe, readinessProbe, startupProbe", ref: yaml("sn-pod-probes") },
  { id: "k-actuator-probes", kind: "concept", area: "kubernetes", label: "/actuator/health/liveness và /readiness của Spring Boot ↔ livenessProbe, readinessProbe" },
  { id: "k-pod-lifecycle", kind: "concept", area: "kubernetes", label: "Pha Pod, restartPolicy và trạng thái container Waiting / Running / Terminated" },
  { id: "k-graceful-shutdown", kind: "concept", area: "kubernetes", label: "SIGTERM → preStop → terminationGracePeriodSeconds; server.shutdown=graceful" },
  { id: "k-explain", kind: "command", area: "kubernetes", label: "k explain <đường dẫn trường> --recursive", ref: cmd("c083") },
  { id: "k-init-container", kind: "yaml", area: "kubernetes", label: "Pod với init container chờ phụ thuộc", ref: yaml("sn-pod-init") },

  // ── s14 Rolling update và rollback ──
  { id: "k-set-image", kind: "command", area: "kubernetes", label: "k set image deploy/gateway gateway=shop/gateway:2.0", ref: cmd("c025") },
  { id: "k-rollout-status", kind: "command", area: "kubernetes", label: "k rollout status deploy/gateway", ref: cmd("c026") },
  { id: "k-rollout-history", kind: "command", area: "kubernetes", label: "k rollout history deploy/gateway", ref: cmd("c027") },
  { id: "k-rollout-undo", kind: "command", area: "kubernetes", label: "k rollout undo deploy/gateway --to-revision=1", ref: cmd("c029") },
  { id: "k-rolling-update-yaml", kind: "yaml", area: "kubernetes", label: "strategy RollingUpdate: maxSurge, maxUnavailable", ref: yaml("sn-deploy-rollingupdate") },
  { id: "k-change-cause", kind: "command", area: "kubernetes", label: `k annotate deploy/gateway kubernetes.io/change-cause="lên 2.0"` },
  { id: "k-rollout-restart", kind: "command", area: "kubernetes", label: "k rollout restart deploy/catalog", ref: cmd("c030") },
  { id: "k-rollback-flow", kind: "procedure", area: "kubernetes", label: "Rollback Deployment hỏng", ref: pb("pb-rollback-deployment") },

  // ── s15 DaemonSet, Job, CronJob ──
  { id: "k-daemonset-yaml", kind: "yaml", area: "kubernetes", label: "DaemonSet — một Pod mỗi node", ref: yaml("sn-daemonset") },
  { id: "k-create-job", kind: "command", area: "kubernetes", label: `k create job seed --image=busybox -- sh -c "…"`, ref: cmd("c031") },
  { id: "k-job-yaml", kind: "yaml", area: "kubernetes", label: "Job: completions, parallelism, backoffLimit", ref: yaml("sn-job") },
  { id: "k-create-cronjob", kind: "command", area: "kubernetes", label: `k create cronjob report --image=busybox --schedule="*/5 * * * *" -- …`, ref: cmd("c033") },
  { id: "k-cronjob-yaml", kind: "yaml", area: "kubernetes", label: "CronJob: schedule, concurrencyPolicy, history limits", ref: yaml("sn-cronjob") },
  { id: "k-job-from-cronjob", kind: "command", area: "kubernetes", label: "k create job report-now --from=cronjob/report", ref: cmd("c032") },

  // ── s16 Sự cố chặng 2: Pod không chạy ──
  { id: "k-logs-previous", kind: "command", area: "kubernetes", label: "k logs <pod> --previous", ref: cmd("c079") },
  { id: "k-events-sorted", kind: "command", area: "kubernetes", label: "k get events --sort-by=.metadata.creationTimestamp -n shop", ref: cmd("c078") },
  { id: "k-pod-failure-reasons", kind: "concept", area: "kubernetes", label: "ImagePullBackOff, ErrImageNeverPull, CrashLoopBackOff, CreateContainerConfigError — đọc lý do ở đâu" },
  { id: "k-get-pod-yaml", kind: "command", area: "kubernetes", label: "k get pod <pod> -o yaml", ref: cmd("c086") },
  { id: "k-replace-force", kind: "command", area: "kubernetes", label: "k replace -f pod.yaml --force", ref: cmd("c084") },
  { id: "vim-show-whitespace", kind: "command", area: "vim", label: ":set list — thấy tab lẫn trong YAML (^I)" },
  { id: "k-debug-container", kind: "command", area: "kubernetes", label: "k debug -it <pod> --image=busybox --target=<container>", ref: cmd("ca025") },

  // ── s17 Requests, limits, QoS, JVM ──
  { id: "k-set-resources", kind: "command", area: "kubernetes", label: "k set resources deploy/catalog --requests=cpu=250m,memory=384Mi --limits=memory=512Mi" },
  { id: "k-resources-yaml", kind: "yaml", area: "kubernetes", label: "resources.requests và resources.limits trong Pod spec", ref: yaml("sn-pod-full") },
  { id: "k-qos-classes", kind: "concept", area: "kubernetes", label: "QoS Guaranteed / Burstable / BestEffort và thứ tự bị evict" },
  { id: "k-oomkilled", kind: "command", area: "kubernetes", label: "k get pod <pod> -o jsonpath='{.status.containerStatuses[0].lastState.terminated.reason}'" },
  { id: "k-jvm-container", kind: "concept", area: "kubernetes", label: "JVM trong container: -XX:MaxRAMPercentage, ActiveProcessorCount; heap + non-heap phải dưới memory limit" },
  { id: "k-node-allocated", kind: "command", area: "kubernetes", label: "k describe node cka-w1 | grep -A 8 'Allocated resources'" },

  // ── s18 Namespace, LimitRange, ResourceQuota ──
  { id: "k-create-ns", kind: "command", area: "kubernetes", label: "k create ns shop", ref: cmd("c008") },
  { id: "k-set-context-ns", kind: "command", area: "kubernetes", label: "k config set-context --current --namespace=shop", ref: cmd("c007") },
  { id: "k-create-quota", kind: "command", area: "kubernetes", label: "k create quota shop-quota --hard=pods=20,requests.cpu=2,limits.memory=4Gi -n shop", ref: cmd("c045") },
  { id: "k-quota-yaml", kind: "yaml", area: "kubernetes", label: "ResourceQuota cho namespace", ref: yaml("sn-resourcequota") },
  { id: "k-limitrange-yaml", kind: "yaml", area: "kubernetes", label: "LimitRange: default, defaultRequest, max", ref: yaml("sn-limitrange") },
  { id: "k-describe-quota", kind: "command", area: "kubernetes", label: "k describe quota,limitrange -n shop" },

  // ── s19 nodeSelector, affinity, taint, toleration ──
  { id: "k-label-node", kind: "command", area: "kubernetes", label: "k label node cka-w2 disktype=ssd", ref: cmd("ca013") },
  { id: "k-nodeselector-toleration", kind: "yaml", area: "kubernetes", label: "Pod với nodeSelector và toleration", ref: yaml("sn-pod-nodeselector-toleration") },
  { id: "k-node-affinity", kind: "yaml", area: "kubernetes", label: "nodeAffinity required và preferred", ref: yaml("sn-node-affinity") },
  { id: "k-taint-node", kind: "command", area: "kubernetes", label: "k taint node cka-w2 dedicated=db:NoSchedule (thêm - ở cuối để gỡ)", ref: cmd("ca012") },
  { id: "k-pod-antiaffinity", kind: "yaml", area: "kubernetes", label: "podAntiAffinity — trải replica theo kubernetes.io/hostname", ref: yaml("sn-pod-antiaffinity") },
  { id: "k-nodename", kind: "yaml", area: "kubernetes", label: "spec.nodeName — gán thẳng node, bỏ qua scheduler", ref: yaml("sn-pod-nodename") },
  { id: "k-priorityclass", kind: "yaml", area: "kubernetes", label: "PriorityClass và Pod dùng priorityClassName", ref: yaml("sn-priorityclass") },

  // ── s20 metrics-server, top, HPA ──
  { id: "k-metrics-server-install", kind: "procedure", area: "kubernetes", label: "Cài metrics-server (components.yaml) và thêm --kubelet-insecure-tls cho lab" },
  { id: "k-top-node", kind: "command", area: "kubernetes", label: "k top node", ref: cmd("c081") },
  { id: "k-top-pod", kind: "command", area: "kubernetes", label: "k top pod --sort-by=memory", ref: cmd("c080") },
  { id: "k-autoscale", kind: "command", area: "kubernetes", label: "k autoscale deploy catalog --min=2 --max=5 --cpu-percent=60", ref: cmd("c024") },
  { id: "k-hpa-v2-yaml", kind: "yaml", area: "kubernetes", label: "HPA autoscaling/v2: metrics cpu averageUtilization, behavior.scaleDown" },
  { id: "k-hpa-targets", kind: "concept", area: "kubernetes", label: "TARGETS <unknown>/60%: thiếu requests hoặc thiếu metrics-server" },

  // ── s21 Sự cố chặng 3: Pod Pending ──
  { id: "k-pending-reasons", kind: "concept", area: "kubernetes", label: "Pod Pending: Insufficient cpu/memory, taint không được tolerate, nodeSelector/affinity không khớp, PVC chưa bind" },
  { id: "k-failedscheduling-events", kind: "command", area: "kubernetes", label: "k get events -A --field-selector reason=FailedScheduling" },
  { id: "k-top-containers", kind: "command", area: "kubernetes", label: "k top pod --containers -A", ref: cmd("ca028") },
  { id: "k-events-all", kind: "command", area: "kubernetes", label: "k get events -A --sort-by=.metadata.creationTimestamp", ref: cmd("ca026") },
  { id: "k-custom-columns", kind: "command", area: "kubernetes", label: "k get pods -o custom-columns='NAME:.metadata.name,CPU:.spec.containers[0].resources.requests.cpu'", ref: cmd("c089") },

  // ── s22 Volume, PV, PVC ──
  { id: "k-emptydir", kind: "yaml", area: "kubernetes", label: "emptyDir chia sẻ giữa hai container", ref: yaml("sn-emptydir-share") },
  { id: "k-pv-pvc-yaml", kind: "yaml", area: "kubernetes", label: "PV hostPath và PVC khớp nhau", ref: yaml("sn-pv-pvc") },
  { id: "k-pod-mount-pvc", kind: "yaml", area: "kubernetes", label: "Pod mount PVC", ref: yaml("sn-pod-mount-pvc") },
  { id: "k-get-pv-pvc", kind: "command", area: "kubernetes", label: "k get pv,pvc", ref: cmd("c063") },
  { id: "k-describe-pvc", kind: "command", area: "kubernetes", label: "k describe pvc <pvc>", ref: cmd("c064") },
  { id: "k-access-modes", kind: "concept", area: "kubernetes", label: "Access mode RWO, ROX, RWX, RWOP và volumeMode" },
  { id: "k-volume-types", kind: "concept", area: "kubernetes", label: "emptyDir, hostPath, configMap/secret, persistentVolumeClaim: sống bao lâu, nằm ở đâu" },

  // ── s23 StorageClass, dynamic provisioning ──
  { id: "k-storageclass-yaml", kind: "yaml", area: "kubernetes", label: "StorageClass với WaitForFirstConsumer", ref: yaml("sn-storageclass") },
  { id: "k-get-sc", kind: "command", area: "kubernetes", label: "k get storageclass", ref: cmd("c066") },
  { id: "k-local-path-provisioner", kind: "procedure", area: "kubernetes", label: "Cài local-path-provisioner làm provisioner động cho lab" },
  { id: "k-default-sc", kind: "command", area: "kubernetes", label: `k patch storageclass local-path -p '{"metadata":{"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'` },
  { id: "k-reclaim-policy", kind: "command", area: "kubernetes", label: `k patch pv <pv> -p '{"spec":{"persistentVolumeReclaimPolicy":"Retain"}}'` },
  { id: "k-pv-sort", kind: "command", area: "kubernetes", label: "k get pv --sort-by=.spec.capacity.storage", ref: cmd("c065") },
  { id: "k-binding-mode", kind: "concept", area: "kubernetes", label: "volumeBindingMode Immediate và WaitForFirstConsumer" },

  // ── s24 StatefulSet cho PostgreSQL ──
  { id: "k-statefulset-yaml", kind: "yaml", area: "kubernetes", label: "StatefulSet với serviceName và volumeClaimTemplates" },
  { id: "k-headless-svc", kind: "yaml", area: "kubernetes", label: "Headless Service (clusterIP: None)", ref: yaml("sn-svc-headless") },
  { id: "k-sts-dns", kind: "concept", area: "kubernetes", label: "postgres-0.postgres.shop.svc.cluster.local — danh tính ổn định của Pod StatefulSet" },
  { id: "k-sts-ordering", kind: "concept", area: "kubernetes", label: "Thứ tự tạo/xoá Pod StatefulSet; PVC vẫn còn sau khi xoá StatefulSet" },
  { id: "k-exec-psql", kind: "command", area: "kubernetes", label: "k exec -it postgres-0 -n shop -- psql -U shop -c 'select count(*) from product'" },

  // ── s25 Sự cố chặng 4: PVC Pending, dữ liệu biến mất ──
  { id: "k-pvc-pending-reasons", kind: "concept", area: "kubernetes", label: "PVC Pending: không có StorageClass mặc định, sai storageClassName, access mode hoặc dung lượng không khớp, chờ consumer" },
  { id: "k-pv-release", kind: "command", area: "kubernetes", label: `k patch pv <pv> --type=json -p '[{"op":"remove","path":"/spec/claimRef"}]' — dùng lại PV Released` },
  { id: "lx-df-du", kind: "command", area: "linux", label: "df -h; du -sh /opt/local-path-provisioner/*" },
  { id: "k-pvc-protection", kind: "concept", area: "kubernetes", label: "Finalizer kubernetes.io/pvc-protection: vì sao PVC đứng Terminating" },
  { id: "k-logs-all-containers", kind: "command", area: "kubernetes", label: "k logs deploy/order --all-containers --since=10m" },

  // ── s26 Mạng Pod tới Pod, CNI ──
  { id: "net-pod-network-model", kind: "concept", area: "network", label: "Mô hình mạng Kubernetes: mỗi Pod một IP, Pod gọi Pod không qua NAT" },
  { id: "k-calico-status", kind: "command", area: "kubernetes", label: "k get tigerastatus; k get pods -n calico-system -o wide" },
  { id: "net-node-pod-routes", kind: "command", area: "network", label: "ip route | grep -E 'vxlan|tunl|cali' — route tới pod CIDR của node khác" },
  { id: "net-tcpdump", kind: "command", area: "network", label: "tcpdump -ni any host <IP Pod> and port 8080" },
  { id: "lx-nsenter", kind: "command", area: "linux", label: "PID=$(crictl inspect <id> | jq .info.pid); nsenter -t $PID -n ip addr" },
  { id: "k-cni-paths", kind: "path", area: "kubernetes", label: "/etc/cni/net.d/ và /opt/cni/bin/ — kubelet tìm plugin CNI ở đâu" },
  { id: "k-tmp-pod", kind: "command", area: "kubernetes", label: "k run tmp --image=busybox --rm -it --restart=Never -- sh", ref: cmd("c013") },

  // ── s27 Service, Endpoints, kube-proxy ──
  { id: "k-svc-clusterip-yaml", kind: "yaml", area: "kubernetes", label: "Service ClusterIP", ref: yaml("sn-svc-clusterip") },
  { id: "k-svc-nodeport-yaml", kind: "yaml", area: "kubernetes", label: "Service NodePort: port, targetPort, nodePort", ref: yaml("sn-svc-nodeport") },
  { id: "k-get-endpoints", kind: "command", area: "kubernetes", label: "k get endpoints catalog", ref: cmd("c058") },
  { id: "k-wget-svc", kind: "command", area: "kubernetes", label: "k run tmp --image=busybox --rm -it --restart=Never -- wget -qO- http://catalog:80", ref: cmd("c059") },
  { id: "k-svc-loadbalancer", kind: "concept", area: "kubernetes", label: "Service LoadBalancer: EXTERNAL-IP <pending> khi không có cloud hoặc MetalLB" },
  { id: "net-iptables-kube-proxy", kind: "command", area: "network", label: "iptables -t nat -L KUBE-SERVICES -n | grep catalog" },
  { id: "k-kube-proxy-mode", kind: "command", area: "kubernetes", label: "k -n kube-system get cm kube-proxy -o yaml | grep mode" },
  { id: "k-create-svc-dry", kind: "command", area: "kubernetes", label: "k create svc clusterip catalog --tcp=80:8080 $do > svc.yaml", ref: cmd("c057") },

  // ── s28 CoreDNS ──
  { id: "k-nslookup-svc", kind: "command", area: "kubernetes", label: "k run tmp --image=busybox --rm -it --restart=Never -- nslookup catalog.shop", ref: cmd("c060") },
  { id: "net-dig", kind: "command", area: "network", label: "dig @10.96.0.10 catalog.shop.svc.cluster.local +short" },
  { id: "k-coredns-corefile", kind: "yaml", area: "kubernetes", label: "ConfigMap coredns (Corefile)", ref: yaml("sn-coredns-corefile") },
  { id: "k-svc-fqdn", kind: "concept", area: "kubernetes", label: "<service>.<namespace>.svc.cluster.local và search domain trong /etc/resolv.conf của Pod" },
  { id: "k-pod-dns-policy", kind: "yaml", area: "kubernetes", label: "dnsPolicy và dnsConfig của Pod" },
  { id: "k-coredns-restart", kind: "command", area: "kubernetes", label: "k -n kube-system rollout restart deploy/coredns" },

  // ── s29 Ingress ──
  { id: "k-ingress-nginx-install", kind: "procedure", area: "kubernetes", label: "Cài ingress-nginx controller kiểu NodePort trên cluster kubeadm" },
  { id: "k-create-ingress", kind: "command", area: "kubernetes", label: `k create ingress shop --rule="shop.local/api*=gateway:80" $do > ing.yaml`, ref: cmd("c061") },
  { id: "k-ingress-yaml", kind: "yaml", area: "kubernetes", label: "Ingress hai path và TLS", ref: yaml("sn-ingress") },
  { id: "k-ingressclass", kind: "command", area: "kubernetes", label: "k get ingressclass; spec.ingressClassName" },
  { id: "k-tls-secret", kind: "command", area: "kubernetes", label: "k create secret tls shop-tls --cert=tls.crt --key=tls.key", ref: cmd("c042") },
  { id: "net-curl-host", kind: "command", area: "network", label: "curl -H 'Host: shop.local' http://<IP node>:<nodePort>/api/products" },
  { id: "k-ingress-pathtype", kind: "concept", area: "kubernetes", label: "pathType Prefix, Exact, ImplementationSpecific" },

  // ── s30 Gateway API ──
  { id: "k-gateway-install", kind: "procedure", area: "kubernetes", label: "Cài CRD Gateway API (standard channel) và một implementation (vd NGINX Gateway Fabric)" },
  { id: "k-gateway-httproute", kind: "yaml", area: "kubernetes", label: "Gateway và HTTPRoute", ref: yaml("sn-gateway-httproute") },
  { id: "k-gatewayclass", kind: "concept", area: "kubernetes", label: "GatewayClass → Gateway → HTTPRoute: ai sở hữu tầng nào" },
  { id: "k-httproute-weights", kind: "yaml", area: "kubernetes", label: "HTTPRoute backendRefs có weight — chia lưu lượng gateway v1/v2" },
  { id: "k-gateway-status", kind: "command", area: "kubernetes", label: "k describe gateway shop-gw — đọc điều kiện Accepted, Programmed" },
  { id: "k-docs-gateway", kind: "docs", area: "kubernetes", label: "kubernetes.io: Gateway API (Concepts › Services, Load Balancing, and Networking)" },

  // ── s31 NetworkPolicy ──
  { id: "k-netpol-default-deny", kind: "yaml", area: "kubernetes", label: "NetworkPolicy default-deny toàn namespace", ref: yaml("sn-netpol-default-deny") },
  { id: "k-netpol-allow", kind: "yaml", area: "kubernetes", label: "NetworkPolicy cho phép gateway → catalog theo port", ref: yaml("sn-netpol-frontend-backend") },
  { id: "k-netpol-dns-egress", kind: "yaml", area: "kubernetes", label: "NetworkPolicy egress cho DNS (UDP/TCP 53)", ref: yaml("sn-netpol-dns-egress") },
  { id: "k-get-netpol", kind: "command", area: "kubernetes", label: "k get netpol -n shop", ref: cmd("c062") },
  { id: "k-netpol-semantics", kind: "concept", area: "kubernetes", label: "NetworkPolicy cộng dồn; trong from[] cùng một phần tử là AND, khác phần tử là OR" },
  { id: "k-netpol-ns-selector", kind: "yaml", area: "kubernetes", label: "namespaceSelector với nhãn kubernetes.io/metadata.name" },

  // ── s32 Sự cố chặng 5: Service không tới được Pod ──
  { id: "k-svc-no-endpoints-flow", kind: "procedure", area: "kubernetes", label: "Debug Service không có endpoints", ref: pb("pb-svc-no-endpoints") },
  { id: "k-selector-mismatch", kind: "concept", area: "kubernetes", label: "Ba nguyên nhân Service rỗng: selector lệch nhãn, targetPort lệch containerPort, Pod chưa Ready" },
  { id: "k-svc-ports-jsonpath", kind: "command", area: "kubernetes", label: "k get svc catalog -o jsonpath='{.spec.ports}'; k get pod -l app=catalog -o jsonpath='{..containerPort}'" },
  { id: "k-netshoot", kind: "command", area: "kubernetes", label: "k run tmp --rm -it --image=nicolaka/netshoot -- bash" },
  { id: "k-endpointslice", kind: "command", area: "kubernetes", label: "k get endpointslices -l kubernetes.io/service-name=catalog" },

  // ── s33 PKI, openssl, CSR ──
  { id: "lx-openssl-req", kind: "command", area: "linux", label: "openssl genrsa -out dev.key 2048; openssl req -new -key dev.key -subj '/CN=dev/O=shop-dev' -out dev.csr" },
  { id: "lx-openssl-x509", kind: "command", area: "linux", label: "openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -text — Subject, SAN, Not After" },
  { id: "net-tls-chain", kind: "concept", area: "network", label: "Chuỗi chứng chỉ: CA ký cert, SAN; CN → user, O → group trong Kubernetes" },
  { id: "k-csr-yaml", kind: "yaml", area: "kubernetes", label: "CertificateSigningRequest cho user mới", ref: yaml("sn-csr") },
  { id: "k-get-csr", kind: "command", area: "kubernetes", label: "k get csr", ref: cmd("ca029") },
  { id: "k-certificate-approve", kind: "command", area: "kubernetes", label: "k certificate approve dev", ref: cmd("ca030") },
  { id: "k-new-user-flow", kind: "procedure", area: "kubernetes", label: "Tạo user mới: key → CSR → approve → RBAC", ref: pb("pb-new-user-csr") },

  // ── s34 kubeconfig ──
  { id: "k-config-contexts", kind: "command", area: "kubernetes", label: "k config get-contexts", ref: cmd("c005") },
  { id: "k-use-context", kind: "command", area: "kubernetes", label: "k config use-context dev@shop", ref: cmd("c006") },
  { id: "k-config-set-credentials", kind: "command", area: "kubernetes", label: "k config set-credentials dev --client-certificate=dev.crt --client-key=dev.key --embed-certs" },
  { id: "k-config-set-context", kind: "command", area: "kubernetes", label: "k config set-context dev@shop --cluster=kubernetes --user=dev --namespace=shop" },
  { id: "k-kubeconfig-flag", kind: "command", area: "kubernetes", label: "k --kubeconfig=/home/ubuntu/dev.kubeconfig get pods" },
  { id: "k-kubeconfig-structure", kind: "concept", area: "kubernetes", label: "kubeconfig = clusters + users + contexts; current-context chọn bộ ba nào" },
  { id: "k-config-view-minify", kind: "command", area: "kubernetes", label: "k config view --minify --raw" },

  // ── s35 RBAC và ServiceAccount ──
  { id: "k-create-role", kind: "command", area: "kubernetes", label: "k create role pod-reader --verb=get,list,watch --resource=pods -n shop", ref: cmd("c048") },
  { id: "k-create-rolebinding", kind: "command", area: "kubernetes", label: "k create rolebinding dev-read --role=pod-reader --group=shop-dev -n shop", ref: cmd("c049") },
  { id: "k-create-clusterrole", kind: "command", area: "kubernetes", label: "k create clusterrole node-reader --verb=get,list --resource=nodes", ref: cmd("c050") },
  { id: "k-create-clusterrolebinding", kind: "command", area: "kubernetes", label: "k create clusterrolebinding ops-nodes --clusterrole=node-reader --group=shop-ops", ref: cmd("c051") },
  { id: "k-auth-can-i", kind: "command", area: "kubernetes", label: "k auth can-i create deploy --as=dev -n shop", ref: cmd("c052") },
  { id: "k-auth-can-i-list", kind: "command", area: "kubernetes", label: "k auth can-i --list -n shop", ref: cmd("c053") },
  { id: "k-create-sa", kind: "command", area: "kubernetes", label: "k create sa order -n shop", ref: cmd("c046") },
  { id: "k-create-token", kind: "command", area: "kubernetes", label: "k create token order -n shop", ref: cmd("c047") },

  // ── s36 Sự cố chặng 6: Forbidden, kubeconfig hỏng ──
  { id: "k-forbidden-read", kind: "concept", area: "kubernetes", label: "Đọc lỗi Forbidden: user, verb, resource, API group, namespace" },
  { id: "k-auth-whoami", kind: "command", area: "kubernetes", label: "k auth whoami" },
  { id: "k-describe-rbac", kind: "command", area: "kubernetes", label: "k describe rolebinding,role -n shop" },
  { id: "k-kubeconfig-server", kind: "command", area: "kubernetes", label: "k config view --minify -o jsonpath='{.clusters[0].cluster.server}'" },
  { id: "k-api-resources", kind: "command", area: "kubernetes", label: "k api-resources -o wide — tra API group và verb", ref: cmd("c082") },

  // ── s37 Helm ──
  { id: "k-helm-repo", kind: "command", area: "kubernetes", label: "helm repo add <tên> <url>", ref: cmd("c067") },
  { id: "k-helm-search", kind: "command", area: "kubernetes", label: "helm search repo <chart> --versions", ref: cmd("c069") },
  { id: "k-helm-install", kind: "command", area: "kubernetes", label: "helm install <release> <chart> -n <ns> --create-namespace", ref: cmd("c070") },
  { id: "k-helm-set", kind: "command", area: "kubernetes", label: "helm install … --set replicaCount=3 / -f values-prod.yaml", ref: cmd("c071") },
  { id: "k-helm-list", kind: "command", area: "kubernetes", label: "helm list -A", ref: cmd("c072") },
  { id: "k-helm-upgrade", kind: "command", area: "kubernetes", label: "helm upgrade <release> <chart> --version <v>", ref: cmd("c073") },
  { id: "k-helm-template", kind: "command", area: "kubernetes", label: "helm template <release> <chart>", ref: cmd("c076") },
  { id: "k-helm-create", kind: "command", area: "kubernetes", label: "helm create shop; sửa values.yaml và templates/" },

  // ── s38 Kustomize ──
  { id: "k-kustomization-yaml", kind: "yaml", area: "kubernetes", label: "kustomization.yaml: base và overlay", ref: yaml("sn-kustomization") },
  { id: "k-kustomize-build", kind: "command", area: "kubernetes", label: "k kustomize overlays/prod", ref: cmd("c034") },
  { id: "k-apply-k", kind: "command", area: "kubernetes", label: "k apply -k overlays/prod", ref: cmd("c035") },
  { id: "k-kustomize-patches", kind: "yaml", area: "kubernetes", label: "patches trong kustomization.yaml (strategic merge và JSON 6902)" },
  { id: "k-kustomize-images", kind: "yaml", area: "kubernetes", label: "images: newTag cho từng overlay" },
  { id: "k-kustomize-generators", kind: "yaml", area: "kubernetes", label: "configMapGenerator / secretGenerator và hậu tố hash" },

  // ── s39 CRD và operator ──
  { id: "k-crd-yaml", kind: "yaml", area: "kubernetes", label: "CustomResourceDefinition apiextensions.k8s.io/v1: group, names, versions, schema" },
  { id: "k-api-resources-ns", kind: "command", area: "kubernetes", label: "k api-resources --namespaced=true", ref: cmd("ca031") },
  { id: "k-explain-cr", kind: "command", area: "kubernetes", label: "k get crd; k explain <kind>.spec" },
  { id: "k-operator-pattern", kind: "concept", area: "kubernetes", label: "Operator = CRD + controller chạy vòng reconcile" },
  { id: "k-install-operator", kind: "procedure", area: "kubernetes", label: "Cài operator (vd CloudNativePG) bằng manifest hoặc Helm rồi tạo custom resource" },

  // ── s40 Sự cố chặng 7: release hỏng ──
  { id: "k-helm-rollback", kind: "command", area: "kubernetes", label: "helm rollback <release> <revision>", ref: cmd("c074") },
  { id: "k-helm-history", kind: "command", area: "kubernetes", label: "helm history shop -n shop" },
  { id: "k-helm-get-values", kind: "command", area: "kubernetes", label: "helm get values shop -n shop --all; helm get manifest shop -n shop" },
  { id: "k-helm-uninstall", kind: "command", area: "kubernetes", label: "helm uninstall <release>", ref: cmd("c075") },
  { id: "k-helm-repo-update", kind: "command", area: "kubernetes", label: "helm repo update", ref: cmd("c068") },
  { id: "k-helm-status", kind: "command", area: "kubernetes", label: "helm status shop -n shop — trạng thái failed / pending-upgrade" },

  // ── s41 Bảo trì node ──
  { id: "k-cordon", kind: "command", area: "kubernetes", label: "k cordon cka-w1", ref: cmd("ca011") },
  { id: "k-drain", kind: "command", area: "kubernetes", label: "k drain cka-w1 --ignore-daemonsets --delete-emptydir-data", ref: cmd("ca010") },
  { id: "k-uncordon", kind: "command", area: "kubernetes", label: "k uncordon cka-w1" },
  { id: "k-pdb-yaml", kind: "yaml", area: "kubernetes", label: "PodDisruptionBudget minAvailable / maxUnavailable" },
  { id: "k-create-pdb", kind: "command", area: "kubernetes", label: "k create pdb catalog-pdb --selector=app=catalog --min-available=1" },
  { id: "k-node-maintenance-flow", kind: "procedure", area: "kubernetes", label: "Bảo trì node: drain → làm việc → uncordon", ref: pb("pb-node-maintenance") },

  // ── s42 Nâng cấp cluster ──
  { id: "k-upgrade-plan", kind: "command", area: "kubernetes", label: "kubeadm upgrade plan", ref: cmd("ca003") },
  { id: "k-upgrade-apply", kind: "command", area: "kubernetes", label: "kubeadm upgrade apply v1.37.x", ref: cmd("ca004") },
  { id: "k-upgrade-node", kind: "command", area: "kubernetes", label: "kubeadm upgrade node", ref: cmd("ca005") },
  { id: "k-upgrade-cp-flow", kind: "procedure", area: "kubernetes", label: "Upgrade control plane với kubeadm", ref: pb("pb-upgrade-controlplane") },
  { id: "k-upgrade-worker-flow", kind: "procedure", area: "kubernetes", label: "Upgrade worker node", ref: pb("pb-upgrade-worker") },
  { id: "lx-apt-unhold", kind: "command", area: "linux", label: "apt-mark unhold kubeadm && apt-get install -y kubeadm='1.37.*' && apt-mark hold kubeadm" },
  { id: "k-version-skew", kind: "concept", area: "kubernetes", label: "Version skew policy: kubelet không mới hơn apiserver, nâng từng minor một" },
  { id: "k-docs-upgrade", kind: "docs", area: "kubernetes", label: "kubernetes.io: Upgrading kubeadm clusters" },

  // ── s43 Backup và restore etcd ──
  { id: "k-etcd-snapshot-save", kind: "command", area: "kubernetes", label: "etcdctl snapshot save /opt/backup/etcd.db --endpoints … --cacert … --cert … --key …", ref: cmd("ca007") },
  { id: "k-etcd-snapshot-status", kind: "command", area: "kubernetes", label: "etcdctl snapshot status /opt/backup/etcd.db -w table (etcd mới: etcdutl)", ref: cmd("ca008") },
  { id: "k-etcd-restore", kind: "command", area: "kubernetes", label: "etcdutl snapshot restore /opt/backup/etcd.db --data-dir=/var/lib/etcd-restore", ref: cmd("ca009") },
  { id: "k-etcd-backup-flow", kind: "procedure", area: "kubernetes", label: "Backup etcd bằng snapshot", ref: pb("pb-etcd-backup") },
  { id: "k-etcd-restore-flow", kind: "procedure", area: "kubernetes", label: "Restore etcd từ snapshot", ref: pb("pb-etcd-restore") },
  { id: "k-etcd-manifest", kind: "path", area: "kubernetes", label: "/etc/kubernetes/manifests/etcd.yaml — --data-dir và hostPath /var/lib/etcd" },
  { id: "k-etcd-certs", kind: "path", area: "kubernetes", label: "/etc/kubernetes/pki/etcd/{ca.crt,server.crt,server.key} — cho --cacert, --cert, --key" },
  { id: "k-docs-etcd", kind: "docs", area: "kubernetes", label: "kubernetes.io: Operating etcd clusters for Kubernetes" },

  // ── s44 Gia hạn chứng chỉ, control plane HA ──
  { id: "k-certs-renew", kind: "command", area: "kubernetes", label: "kubeadm certs renew all (rồi khởi động lại static pod control plane)" },
  { id: "k-restart-static-pod", kind: "procedure", area: "kubernetes", label: "Khởi động lại static pod: chuyển manifest ra khỏi /etc/kubernetes/manifests rồi đưa lại" },
  { id: "k-ha-topology", kind: "concept", area: "kubernetes", label: "HA control plane: stacked etcd và external etcd, số node lẻ, quorum, load balancer trước apiserver" },
  { id: "k-cp-endpoint", kind: "command", area: "kubernetes", label: "kubeadm init --control-plane-endpoint=<LB>:6443 --upload-certs; kubeadm join … --control-plane" },
  { id: "k-etcd-member-list", kind: "command", area: "kubernetes", label: "etcdctl member list -w table" },
  { id: "k-kubelet-cert-rotation", kind: "concept", area: "kubernetes", label: "Kubelet tự xoay chứng chỉ client: rotateCertificates, /var/lib/kubelet/pki/kubelet-client-current.pem" },
  { id: "k-docs-ha", kind: "docs", area: "kubernetes", label: "kubernetes.io: Creating Highly Available Clusters with kubeadm" },

  // ── s45 Sự cố chặng 8: sau nâng cấp, sau restore ──
  { id: "k-version-check", kind: "command", area: "kubernetes", label: "k get nodes; kubeadm version; kubelet --version; k version" },
  { id: "k-etcd-health", kind: "command", area: "kubernetes", label: "etcdctl endpoint health --cluster" },
  { id: "k-crictl-logs", kind: "command", area: "kubernetes", label: "crictl logs <container-id>", ref: cmd("ca020") },
  { id: "k-post-restore-check", kind: "procedure", area: "kubernetes", label: "Kiểm sau restore etcd: static pod etcd đúng data-dir, apiserver lên, đối tượng khớp lúc chụp snapshot" },

  // ── s46 Chẩn đoán theo tầng, tầng ứng dụng ──
  { id: "k-diagnosis-layers", kind: "procedure", area: "kubernetes", label: "Chẩn đoán theo tầng: ứng dụng → Pod → Service/DNS → node → control plane" },
  { id: "k-jsonpath", kind: "command", area: "kubernetes", label: "k get pods -o jsonpath='{.items[*].metadata.name}'", ref: cmd("c087") },
  { id: "k-sort-by", kind: "command", area: "kubernetes", label: "k get pods --sort-by=.metadata.creationTimestamp", ref: cmd("c088") },
  { id: "k-field-selector", kind: "command", area: "kubernetes", label: "k get pods -A --field-selector=status.phase!=Running" },
  { id: "k-logs-selector", kind: "command", area: "kubernetes", label: "k logs -l app=order --tail=50 --prefix" },

  // ── s47 Sự cố Service, DNS, NetworkPolicy ──
  { id: "k-coredns-logs", kind: "command", area: "kubernetes", label: "k -n kube-system logs -l k8s-app=kube-dns" },
  { id: "k-netpol-debug-flow", kind: "procedure", area: "kubernetes", label: "Pod bị chặn: liệt kê NetworkPolicy chọn Pod nguồn và đích, kiểm cả ingress, egress và DNS" },
  { id: "k-pod-resolv", kind: "command", area: "kubernetes", label: "k exec <pod> -- cat /etc/resolv.conf" },
  { id: "k-kube-proxy-logs", kind: "command", area: "kubernetes", label: "k -n kube-system logs ds/kube-proxy" },

  // ── s48 Sự cố node, kubelet, container runtime ──
  { id: "k-debug-node", kind: "command", area: "kubernetes", label: "k debug node/cka-w1 -it --image=busybox", ref: cmd("ca024") },
  { id: "k-containerd-journal", kind: "command", area: "kubernetes", label: `journalctl -u containerd --since "10 min ago" --no-pager` },
  { id: "k-crictl-inspect", kind: "command", area: "kubernetes", label: "crictl inspect <container-id>", ref: cmd("ca021") },
  { id: "k-kubelet-misconfig", kind: "concept", area: "kubernetes", label: "Lỗi cấu hình kubelet hay gặp: sai cgroupDriver, sai đường dẫn CA/kubeconfig, staticPodPath, containerRuntimeEndpoint" },
  { id: "k-node-pressure", kind: "concept", area: "kubernetes", label: "DiskPressure / MemoryPressure và eviction của kubelet" },

  // ── s49 Sự cố control plane ──
  { id: "k-apiserver-down-flow", kind: "procedure", area: "kubernetes", label: "Debug apiserver không lên sau khi sửa manifest", ref: pb("pb-apiserver-down") },
  { id: "k-pod-log-files", kind: "path", area: "kubernetes", label: "/var/log/pods/ và /var/log/containers/ — log static pod khi kubectl không chạy" },
  { id: "k-apiserver-livez", kind: "command", area: "kubernetes", label: "curl -k https://localhost:6443/livez?verbose" },
  { id: "k-cp-symptoms", kind: "concept", area: "kubernetes", label: "Triệu chứng theo thành phần: apiserver (kubectl không kết nối), scheduler (Pod Pending không event), controller-manager (Deployment không sinh ReplicaSet)" },
  { id: "k-manifest-backup", kind: "procedure", area: "kubernetes", label: "Sao lưu manifest trước khi sửa: cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/" },

  // ── s50 Sự cố etcd, chứng chỉ, kubeconfig ──
  { id: "k-cert-expired", kind: "concept", area: "kubernetes", label: "x509: certificate has expired or is not yet valid — đối chiếu Not After với giờ hệ thống" },
  { id: "k-etcd-endpoint-status", kind: "command", area: "kubernetes", label: "etcdctl endpoint status -w table" },
  { id: "k-kubeconfig-cert-enddate", kind: "command", area: "kubernetes", label: "k config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d | openssl x509 -noout -enddate" },
  { id: "k-apiserver-etcd-flags", kind: "path", area: "kubernetes", label: "kube-apiserver.yaml: --etcd-servers, --etcd-cafile, --etcd-certfile, --etcd-keyfile" },

  // ── s51 Tổng hợp bấm giờ ──
  { id: "k-metrics-raw", kind: "command", area: "kubernetes", label: "k get --raw /apis/metrics.k8s.io/v1beta1/nodes" },
  { id: "k-answer-to-file", kind: "command", area: "kubernetes", label: "k top pod -A --sort-by=cpu --no-headers | head -1 | awk '{print $2}' > /opt/answers/top-pod.txt" },
  { id: "k-exam-triage", kind: "procedure", area: "kubernetes", label: "Phân bổ thời gian: câu nặng điểm làm trước, đánh dấu câu kẹt quá 1,5 lần thời gian mục tiêu" },
  { id: "k-events-watch", kind: "command", area: "kubernetes", label: "k get events -A -w" },
];
