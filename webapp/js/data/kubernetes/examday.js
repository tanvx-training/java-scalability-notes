// Thẻ "Trước giờ thi" — one-pager cho từng chứng chỉ.
// Tổng hợp từ mục Chiến lược thi của 3 study guide trong repo.

export const examDay = [
  {
    cert: "CKAD",
    icon: "🎯",
    passScore: "66%",
    duration: "2 giờ · ~15–20 bài",
    setup: {
      title: "30 giây đầu giờ",
      code: {
        lang: "bash",
        text: `alias k=kubectl                        # thường có sẵn — kiểm tra lại
export do="--dry-run=client -o yaml"   # k run pod --image=nginx $do > pod.yaml
export now="--force --grace-period=0"  # k delete pod x $now
printf 'set tabstop=2\\nset expandtab\\nset shiftwidth=2\\n' > ~/.vimrc`,
      },
    },
    timePlan: [
      "Lượt 1 (80'): làm hết câu dễ + trung bình, ~6 phút/câu",
      "Lượt 2 (30'): quay lại câu đã flag",
      "10' cuối: verify lại các câu điểm cao",
    ],
    mustKnow: [
      "Imperative + `$do` cho Pod / Deployment / Service / ConfigMap / Secret — mỗi thứ dưới 1 phút",
      "Multi-container: init container & native sidecar (`restartPolicy: Always`)",
      "3 loại probe (httpGet / exec / tcpSocket) và tham số",
      "NetworkPolicy default-deny + allow theo label (+ egress DNS 53)",
      "Rollout: `status` / `undo` / `history`; Job & CronJob các field đếm",
      "Debug: `describe` → events → `logs --previous` → `exec`",
    ],
    fatalTraps: [
      "Quên chạy lệnh chuyển context đầu mỗi câu → 0 điểm câu đó",
      "Quên `-n <namespace>`",
      "Viết YAML tay thay vì generate bằng `$do`",
      "Sa lầy 15 phút vào câu 4% điểm — flag rồi đi tiếp",
      "Sửa tài nguyên có sẵn bằng cách xóa đi tạo lại khi đề không cho phép",
    ],
    docsAllowed: "kubernetes.io/docs · helm.sh/docs",
  },
  {
    cert: "CKA",
    icon: "🛠️",
    passScore: "66%",
    duration: "2 giờ · ~15–20 bài",
    setup: {
      title: "30 giây đầu giờ (như CKAD) + nguyên tắc SSH",
      code: {
        lang: "bash",
        text: `alias k=kubectl
export do="--dry-run=client -o yaml"
# Câu yêu cầu ssh: làm xong PHẢI gõ 'exit' để về máy chính
ssh node01   # ... làm bài ...
exit         # ← quên là các câu sau chạy sai máy`,
      },
    },
    timePlan: [
      "Câu etcd backup/restore & upgrade: điểm cao, quy trình dài — làm khi còn tỉnh táo",
      "Sau khi sửa control plane: chờ 30–60s static pod khởi động lại rồi mới verify",
      "Câu troubleshooting: đi theo cây `get nodes` → khoanh vùng → systemctl/journalctl/crictl",
    ],
    mustKnow: [
      "etcd backup + restore thuộc lòng đủ cert flags (< 5 phút)",
      "kubeadm upgrade: control plane trước → worker sau, kèm drain/uncordon",
      "Tạo user: key → CSR → approve → kubeconfig → Role/RoleBinding (< 5 phút)",
      "Node NotReady: `systemctl status kubelet` → `journalctl -u kubelet` (< 5 phút)",
      "Static pods ở `/etc/kubernetes/manifests/` — apiserver chết thì dùng `crictl logs`",
      "Taint/toleration, cordon/drain, StorageClass dynamic provisioning, Gateway API",
    ],
    fatalTraps: [
      "Quên `exit` sau khi ssh vào node — làm bài trên sai máy",
      "Restore etcd ghi đè lên data-dir cũ thay vì trỏ sang thư mục mới",
      "Sửa sai manifest static pod rồi không có backup để khôi phục",
      "90% câu \"cluster hỏng\" chỉ là: kubelet stopped / manifest sai / thiếu CNI — đừng nghĩ phức tạp",
    ],
    docsAllowed: "kubernetes.io/docs",
  },
  {
    cert: "CKS",
    icon: "🔐",
    passScore: "67%",
    duration: "2 giờ · ~15–20 bài (thời gian gắt hơn CKA)",
    setup: {
      title: "Trước khi đụng vào control plane",
      code: {
        lang: "bash",
        text: `# LUÔN backup manifest trước khi sửa flag apiserver:
cp /etc/kubernetes/manifests/kube-apiserver.yaml /root/apiserver-backup.yaml
# Sửa 1 flag → chờ apiserver lên rồi mới sửa tiếp:
watch crictl ps
# Apiserver không lên → đọc log:
crictl logs <id>   # hoặc /var/log/pods/`,
      },
    },
    timePlan: [
      "Làm trước các câu \"điểm cho không\": Trivy scan, NetworkPolicy, RBAC, SecurityContext",
      "Câu dài/tool lạ (ImagePolicyWebhook, OPA) nếu bí → flag, quay lại sau",
      "Câu Falco / audit policy: copy mẫu từ docs rồi sửa, đừng viết tay từ đầu",
    ],
    mustKnow: [
      "Encryption at rest: EncryptionConfiguration + re-encrypt secrets cũ (< 8 phút)",
      "Audit policy 4 level + flags + mount volume vào apiserver (< 8 phút)",
      "Falco: sửa rule output format + xem trigger qua journalctl (< 6 phút)",
      "kube-bench: đọc remediation và fix (< 5 phút/finding)",
      "PSA: label namespace `enforce=restricted` và sửa pod cho pass",
      "AppArmor + seccomp gắn qua securityContext; RuntimeClass gVisor",
    ],
    fatalTraps: [
      "Sửa nhiều flag apiserver cùng lúc — chết không biết flag nào gây ra",
      "Audit logging: viết policy nhưng quên mount volume policy/log vào static pod",
      "Bật encryption nhưng quên re-encrypt secret cũ (đề thường yêu cầu)",
      "Mở docs của tool ngoài danh sách được phép — vi phạm quy chế",
    ],
    docsAllowed: "kubernetes.io/docs · falco.org/docs · trivy & tool docs trong danh sách cho phép",
  },
];
