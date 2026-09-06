// Lộ trình đọc Kubernetes in Action — Phần 2 (Tuần 6–9).
//
// Xem đầu roadmap-kia-part1.js cho quy ước chung của lộ trình này.
// Tuần 6–9 phủ chương 11–18: mạng (Service, Ingress, Gateway API) rồi các
// controller workload (ReplicaSet, Deployment, StatefulSet, DaemonSet, Job).

export const k8sbookWeeksPart2 = [
  {
    id: "kb-w6",
    week: "Tuần 6",
    title: "Service & Ingress — cho ứng dụng một địa chỉ ổn định",
    goal: "Giải thích được một request đi từ client bên ngoài tới đúng container qua những chặng nào, và tự dựng được cả chuỗi đó.",
    practice: "Phơi Kiada bằng ClusterIP rồi NodePort rồi Ingress, mỗi bước kiểm chứng bằng `curl`; thêm readiness probe và quan sát pod bị gỡ khỏi endpoint khi probe trượt.",
    resources: [
      { label: "KIA 11 — Expose pod bằng Service", href: "#/docs/k8sbook-11" },
      { label: "KIA 12 — Sử dụng Ingress để định tuyến lưu lượng đến Service", href: "#/docs/k8sbook-12" },
      { label: "Ôn lại: CKAD tuần 6", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Service", href: "https://kubernetes.io/docs/concepts/services-networking/service/" },
    ],
    items: [
      {
        id: "kb-w6-1",
        text: "Service tìm pod bằng cách nào, và ClusterIP thực ra là cái gì",
        lesson: `**Mục tiêu.** Nói được vì sao ClusterIP không ping được nhưng vẫn nhận kết nối, và selector của service liên hệ với label của pod ra sao.

**Đọc.** [§11.1 Expose pod thông qua service](#/docs/k8sbook-11) — cả §11.1.1, §11.1.2 và §11.1.3.

**Bẫy.** Tìm "máy" nào đang giữ ClusterIP. Không có máy nào cả: ClusterIP là **địa chỉ ảo** do \`kube-proxy\` hiện thực bằng luật iptables/IPVS trên từng node. Nó không trả lời ICMP, nên \`ping\` một ClusterIP thất bại là chuyện bình thường — dùng \`curl\` hoặc \`nc\` để kiểm tra. Bẫy thứ hai: selector của service gõ lệch một ký tự so với label của pod — service vẫn được tạo, chỉ đơn giản là không có endpoint nào.

**Tự kiểm tra.** Service tồn tại nhưng \`curl\` bị treo. Lệnh nào cho bạn biết ngay là selector không khớp pod nào?`,
      },
      {
        id: "kb-w6-2",
        text: "Phơi ra ngoài cụm, và endpoint thực sự được quản lý thế nào",
        lesson: `**Mục tiêu.** Chọn đúng giữa NodePort và LoadBalancer, và đọc được EndpointSlice để biết service đang trỏ vào đâu.

**Đọc.** [§11.2 Expose service ra bên ngoài](#/docs/k8sbook-11) — §11.2.3 (external traffic policy) giải thích vì sao IP client đôi khi bị mất. Rồi [§11.3 Quản lý các endpoint của service](#/docs/k8sbook-11), gồm §11.3.2 (EndpointSlice) và §11.3.3 (quản lý endpoint thủ công).

**Bẫy.** Ngạc nhiên vì ứng dụng thấy IP nguồn là IP của node chứ không phải của client. Với \`externalTrafficPolicy: Cluster\` (mặc định), traffic có thể bị chuyển tiếp thêm một chặng giữa các node và bị SNAT — mất IP thật. Đổi sang \`Local\` giữ được IP nguồn nhưng đánh đổi bằng cân bằng tải kém đều. Bẫy thứ hai: quên rằng \`type: LoadBalancer\` trên cụm local (kind, Minikube) sẽ nằm \`Pending\` mãi vì không có cloud provider cấp IP.

**Tự kiểm tra.** Vì sao Kubernetes thay Endpoints bằng EndpointSlice, và điều đó quan trọng ở cụm bao nhiêu pod trở lên?`,
      },
      {
        id: "kb-w6-3",
        text: "DNS, headless service, định tuyến tới endpoint ở gần, và readiness probe",
        lesson: `**Mục tiêu.** Gọi được service bằng tên DNS đúng dạng, biết khi nào cần headless service, và dùng readiness probe để pod tự rút khỏi luồng traffic.

**Đọc.** [§11.4 Tìm hiểu các bản ghi DNS cho Service object](#/docs/k8sbook-11) — §11.4.2 (headless service) là mục nền cho chương 16. Rồi [§11.5 Cấu hình service để định tuyến traffic tới các endpoint ở gần](#/docs/k8sbook-11) và [§11.6 Quản lý việc đưa pod vào các endpoint của service](#/docs/k8sbook-11), đọc kỹ §11.6.3.

**Bẫy.** Lẫn readiness với liveness. **Liveness trượt → container bị giết và khởi động lại. Readiness trượt → pod bị gỡ khỏi endpoint nhưng vẫn sống.** Dùng nhầm liveness cho việc "chưa sẵn sàng nhận request" là cách chắc chắn nhất để biến một phụ thuộc chậm thành một vòng lặp restart toàn hệ thống. Bẫy thứ hai: readiness probe kiểm tra quá hời hợt (\`/\` trả 200 ngay khi HTTP server lên) nên pod nhận traffic trước khi kết nối database sẵn sàng.

**Tự kiểm tra.** Từ pod ở namespace \`dev\`, tên DNS đầy đủ của service \`kiada\` ở namespace \`prod\` là gì? Headless service trả về bản ghi khác service thường ở chỗ nào?`,
      },
      {
        id: "kb-w6-4",
        text: "Ingress: một điểm vào HTTP cho nhiều service",
        lesson: `**Mục tiêu.** Định tuyến theo host và path tới nhiều service, cấu hình TLS, và biết IngressClass dùng để làm gì.

**Đọc.** [§12.1 Giới thiệu về Ingress](#/docs/k8sbook-12) — §12.1.2 phân biệt Ingress object với ingress controller. Rồi [§12.2 Tạo và sử dụng các Ingress object](#/docs/k8sbook-12), [§12.3 Cấu hình TLS cho một Ingress](#/docs/k8sbook-12) và [§12.5 Sử dụng nhiều ingress controller](#/docs/k8sbook-12). §12.4 và §12.6 lướt để biết có gì.

**Bẫy.** Tạo Ingress object trên cụm chưa cài controller nào rồi chờ nó hoạt động. **Ingress object chỉ là bản khai báo ý định**; không có controller đọc nó thì trường \`ADDRESS\` trống mãi và không có gì xảy ra — không lỗi, không cảnh báo. Bẫy thứ hai: hai controller cùng cài trên một cụm và cùng nhận một Ingress vì bạn quên khai \`ingressClassName\` (§12.5.2).

**Tự kiểm tra.** Theo §12.3, TLS passthrough khác terminating TLS tại Ingress ở chỗ nào, và cái nào cho phép Ingress định tuyến theo path?`,
      },
    ],
  },
  {
    id: "kb-w7",
    week: "Tuần 7",
    title: "Gateway API & ReplicaSet",
    goal: "Dùng được lớp định tuyến thế hệ mới thay cho annotation của Ingress, và hiểu vòng lặp đối chiếu — cơ chế đứng sau mọi controller trong Kubernetes.",
    practice: "Cài Istio làm Gateway API provider, phơi Kiada bằng HTTPRoute, chia 90/10 traffic giữa hai phiên bản; rồi tạo ReplicaSet, xoá tay một pod và đo xem bao lâu thì pod thay thế xuất hiện.",
    resources: [
      { label: "KIA 13 — Định tuyến lưu lượng bằng Gateway API", href: "#/docs/k8sbook-13" },
      { label: "KIA 14 — Mở rộng quy mô và duy trì pod với ReplicaSet", href: "#/docs/k8sbook-14" },
      { label: "Ôn lại: CKA tuần 6", href: "#/roadmap/cka" },
      { label: "gateway-api.sigs.k8s.io — Introduction", href: "https://gateway-api.sigs.k8s.io/" },
    ],
    items: [
      {
        id: "kb-w7-1",
        text: "Gateway API khác Ingress ở đâu, và dựng một Gateway",
        lesson: `**Mục tiêu.** Nói được vì sao Gateway API tách vai trò quản trị viên hạ tầng khỏi vai trò chủ ứng dụng, và triển khai được một Gateway chạy được.

**Đọc.** [§13.1 Giới thiệu Gateway API](#/docs/k8sbook-13) — §13.1.1 (so sánh với Ingress) và §13.1.3 (triển khai Istio làm provider). Rồi [§13.2 Triển khai một Gateway](#/docs/k8sbook-13), gồm §13.2.1 (GatewayClass) và §13.2.3 (đọc status).

**Bẫy.** Nghĩ Gateway API chỉ là "Ingress viết lại cho đẹp". Điểm khác cốt lõi là **tách vai trò**: GatewayClass và Gateway thuộc về người vận hành hạ tầng, còn HTTPRoute thuộc về đội ứng dụng — và ranh giới đó được chính API cưỡng chế, thay vì phải nhồi mọi thứ vào annotation của một object Ingress duy nhất. Bẫy thứ hai: quên rằng Gateway API cần **CRD được cài riêng** cộng với một implementation; thiếu một trong hai thì object tạo ra nhưng không ai xử lý.

**Tự kiểm tra.** Theo §13.2.3, bạn đọc trường nào trong status của Gateway để biết listener đã sẵn sàng và địa chỉ nào đang lắng nghe?`,
      },
      {
        id: "kb-w7-2",
        text: "HTTPRoute: định tuyến, chia tách và biến đổi lưu lượng",
        lesson: `**Mục tiêu.** Viết HTTPRoute khớp theo path/header, chia traffic theo tỉ lệ, và dùng filter để sửa request trên đường đi.

**Đọc.** [§13.3 Public các HTTP service bằng HTTPRoute](#/docs/k8sbook-13) — §13.3.2 (chia traffic giữa nhiều backend) và §13.3.4 (filter) là hai mục có giá trị thực dụng nhất. Rồi [§13.4 Cấu hình gateway cho TLS](#/docs/k8sbook-13).

**Bẫy.** Dùng tỉ lệ \`weight\` mà quên rằng nó chia theo **kết nối/luồng request, không theo người dùng**. Một client giữ kết nối lâu có thể ở nguyên một phía suốt phiên; canary theo tỉ lệ không đồng nghĩa với "10% người dùng thấy phiên bản mới". Nếu cần dính theo người dùng thì phải khớp theo header (§13.3.3), không phải theo weight.

**Tự kiểm tra.** Bạn muốn mọi request có header \`x-beta: true\` đi vào phiên bản mới, phần còn lại giữ nguyên. Viết bằng match hay bằng weight, và vì sao?`,
      },
      {
        id: "kb-w7-3",
        text: "Service không phải HTTP, dùng gateway xuyên namespace, và ranh giới với service mesh",
        lesson: `**Mục tiêu.** Phơi được TCP/UDP/gRPC qua gateway, chia sẻ một gateway cho nhiều đội, và biết điểm dừng giữa ingress gateway và service mesh.

**Đọc.** [§13.5 Public các kiểu service khác](#/docs/k8sbook-13) (TCPRoute, UDPRoute, GRPCRoute), [§13.6 Sử dụng các resource của Gateway API xuyên namespace](#/docs/k8sbook-13) và [§13.7 Từ ingress gateway tới service mesh](#/docs/k8sbook-13).

**Bẫy.** Tạo HTTPRoute ở namespace của đội mình trỏ vào một Gateway ở namespace khác rồi tưởng là xong. Gateway phải **cho phép** namespace đó gắn route vào (\`allowedRoutes\`), và route trỏ sang service ở namespace khác còn cần **ReferenceGrant** — thiếu thì route bị từ chối lặng lẽ và bạn chỉ thấy nó trong status.

**Tự kiểm tra.** Theo §13.6, hai cơ chế nào phải cùng có mặt để một route ở namespace A dùng được gateway ở namespace B và trỏ tới service ở namespace C?`,
      },
      {
        id: "kb-w7-4",
        text: "ReplicaSet và vòng lặp đối chiếu — cơ chế thật của mọi controller",
        lesson: `**Mục tiêu.** Giải thích được pod "tự mọc lại" bằng vòng lặp đối chiếu, và biết quyền sở hữu object quyết định điều gì khi xoá.

**Đọc.** [§14.1 Giới thiệu ReplicaSet](#/docs/k8sbook-14) — §14.1.3 (quyền sở hữu pod) rất quan trọng. Rồi [§14.2 Cập nhật một ReplicaSet](#/docs/k8sbook-14), [§14.3 Tìm hiểu hoạt động của ReplicaSet controller](#/docs/k8sbook-14) và [§14.4 Xóa một ReplicaSet](#/docs/k8sbook-14).

**Bẫy.** Sửa Pod template của ReplicaSet rồi chờ pod cũ được thay. ReplicaSet **không tự thay pod đang chạy** khi template đổi (§14.2.2) — template mới chỉ áp cho pod được tạo sau đó. Việc thay thế có kiểm soát là của Deployment, và đó chính là lý do chương 15 tồn tại. Bẫy thứ hai: xoá ReplicaSet mà quên \`--cascade=orphan\` khi bạn thực sự muốn giữ pod lại (§14.4.2).

**Tự kiểm tra.** Bạn đổi label của một pod đang thuộc ReplicaSet sao cho nó không còn khớp selector. Có bao nhiêu pod tồn tại sau đó, và \`ownerReferences\` của pod cũ ra sao?`,
      },
    ],
  },
  {
    id: "kb-w8",
    week: "Tuần 8",
    title: "Deployment & StatefulSet",
    goal: "Cập nhật ứng dụng không gián đoạn và quay lui được khi hỏng; nói được vì sao ứng dụng có trạng thái cần một controller khác hẳn.",
    practice: "Rollout Kiada v2 bằng RollingUpdate, cố tình đẩy một image lỗi rồi rollback; sau đó dựng StatefulSet 3 bản sao có PVC riêng, xoá pod giữa và kiểm chứng nó quay lại đúng tên và đúng volume cũ.",
    resources: [
      { label: "KIA 15 — Tự động hóa việc cập nhật ứng dụng với Deployment", href: "#/docs/k8sbook-15" },
      { label: "KIA 16 — Xử lý ứng dụng stateful với StatefulSet", href: "#/docs/k8sbook-16" },
      { label: "Ôn lại: CKAD tuần 3", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Deployments", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
    ],
    items: [
      {
        id: "kb-w8-1",
        text: "Deployment, rollout và rollback",
        lesson: `**Mục tiêu.** Điều khiển được tốc độ rollout, dừng nó giữa chừng, và quay lui về phiên bản trước bằng một lệnh.

**Đọc.** [§15.1 Giới thiệu Deployment](#/docs/k8sbook-15) rồi [§15.2 Cập nhật một Deployment](#/docs/k8sbook-15) — làm hết §15.2.1 tới §15.2.6, đặc biệt §15.2.3 (\`maxSurge\`/\`maxUnavailable\`), §15.2.4 (tạm dừng) và §15.2.5 (rollout lên phiên bản lỗi).

**Bẫy.** Tin rằng rollout thành công nghĩa là ứng dụng khỏe. Kubernetes chỉ biết pod **Ready**; nếu readiness probe hời hợt, một phiên bản hỏng vẫn đi hết vòng rollout và thay sạch pod cũ. Probe tốt (tuần 3 và tuần 6) chính là thứ biến \`maxUnavailable\` thành một cái phanh thật. Bẫy thứ hai: \`kubectl rollout undo\` chỉ quay lui được trong phạm vi \`revisionHistoryLimit\` — đặt nó quá thấp là tự cắt đường lui.

**Tự kiểm tra.** Với \`maxSurge: 1\` và \`maxUnavailable: 0\` trên Deployment 3 bản sao, tối đa có bao nhiêu pod tồn tại cùng lúc trong lúc rollout, và tối thiểu bao nhiêu pod phục vụ được?`,
      },
      {
        id: "kb-w8-2",
        text: "Canary, A/B, Blue/Green và traffic shadowing",
        lesson: `**Mục tiêu.** Chọn được chiến lược triển khai phù hợp với rủi ro của thay đổi, và biết chiến lược nào Deployment tự làm được, chiến lược nào cần lớp định tuyến.

**Đọc.** [§15.3 Hiện thực các chiến lược triển khai khác](#/docs/k8sbook-15) — §15.3.1 (canary), §15.3.2 (A/B), §15.3.3 (blue/green) và §15.3.4 (traffic shadowing).

**Bẫy.** Nghĩ Deployment có sẵn "chế độ canary". Nó chỉ có **Recreate và RollingUpdate**; canary, A/B và blue/green được **dựng bằng tay** từ nhiều Deployment cộng với label/selector của service — hoặc từ HTTPRoute của Gateway API bạn vừa học ở tuần 7. Bẫy thứ hai: traffic shadowing gửi bản sao request tới phiên bản mới; nếu phiên bản đó ghi vào cùng database thật, bạn vừa nhân đôi mọi thao tác ghi.

**Tự kiểm tra.** Blue/Green đổi traffic bằng cách nào ở mức Kubernetes thuần, và vì sao cách đó tốn gấp đôi tài nguyên trong thời gian chuyển?`,
      },
      {
        id: "kb-w8-3",
        text: "StatefulSet: danh tính ổn định, volume riêng, và headless Service",
        lesson: `**Mục tiêu.** Nói được ba thứ StatefulSet đảm bảo mà Deployment không đảm bảo, và giải thích vai trò của headless Service trong đó.

**Đọc.** [§16.1 Giới thiệu StatefulSet](#/docs/k8sbook-16) — §16.1.2 (so sánh với Deployment) và §16.1.5 (vai trò của headless Service). Rồi [§16.2 Tìm hiểu hành vi của StatefulSet](#/docs/k8sbook-16), đọc kỹ §16.2.2 (lỗi node) và §16.2.4 (chính sách giữ lại PVC).

**Bẫy.** Chờ StatefulSet tự thay pod khi node chết như Deployment vẫn làm. Vì StatefulSet phải đảm bảo **không bao giờ có hai pod cùng danh tính**, nó **không tạo pod thay thế** khi node mất liên lạc mà chưa xác nhận pod cũ đã chết — pod nằm \`Terminating\` vô hạn cho tới khi có can thiệp. Đây là hành vi cố ý, không phải lỗi. Bẫy thứ hai: scale xuống rồi tưởng đã dọn sạch — PVC mặc định **được giữ lại**, và hoá đơn lưu trữ vẫn chạy.

**Tự kiểm tra.** Pod \`db-1\` bị xoá. Pod thay thế tên gì, gắn PVC nào, và tên DNS của nó là gì?`,
      },
      {
        id: "kb-w8-4",
        text: "Cập nhật StatefulSet, và khi nào nên nhường việc cho Operator",
        lesson: `**Mục tiêu.** Rollout an toàn cho ứng dụng có trạng thái bằng partition, và nhận ra ranh giới nơi Operator làm tốt hơn bạn.

**Đọc.** [§16.3 Cập nhật một StatefulSet](#/docs/k8sbook-16) — §16.3.2 (RollingUpdate với partition) là kỹ thuật canary cho StatefulSet; §16.3.3 (OnDelete). Rồi [§16.4 Quản lý ứng dụng stateful bằng Kubernetes Operator](#/docs/k8sbook-16), làm theo ví dụ MongoDB operator.

**Bẫy.** Tự viết StatefulSet cho một database phân tán rồi phát hiện phần khó không nằm ở Kubernetes. Bầu chọn leader, tham gia/rời cụm, backup, nâng cấp có thứ tự — **Operator sinh ra để làm đúng những việc đó**. Bẫy thứ hai: quên rằng StatefulSet cập nhật **theo thứ tự giảm dần** (ordinal cao trước), nên partition đặt ở đâu quyết định pod nào được thử nghiệm trước.

**Tự kiểm tra.** Với StatefulSet 5 bản sao và \`partition: 3\`, những pod nào nhận template mới khi bạn đổi image?`,
      },
    ],
  },
  {
    id: "kb-w9",
    week: "Tuần 9",
    title: "DaemonSet, Job & CronJob — nốt hai loại workload còn lại",
    goal: "Chạy được tác nhân trên mọi node và các khối công việc hữu hạn, khép lại bức tranh đầy đủ về controller workload của Kubernetes.",
    practice: "Dựng DaemonSet thu log chỉ chạy trên node có label nhất định; viết Job xử lý work queue với `completions`/`parallelism`, rồi bọc nó trong CronJob chạy mỗi 5 phút và quan sát cơ chế xoá Job cũ.",
    resources: [
      { label: "KIA 17 — Triển khai workload trên từng node với DaemonSet", href: "#/docs/k8sbook-17" },
      { label: "KIA 18 — Xử lý batch với Job và CronJob", href: "#/docs/k8sbook-18" },
      { label: "Ôn lại: CKAD tuần 3", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Jobs", href: "https://kubernetes.io/docs/concepts/workloads/controllers/job/" },
    ],
    items: [
      {
        id: "kb-w9-1",
        text: "DaemonSet: một pod trên mỗi node (hoặc một tập con node)",
        lesson: `**Mục tiêu.** Nói được DaemonSet khác ReplicaSet ở chỗ nào về mặt lập lịch, và giới hạn nó xuống một tập con node.

**Đọc.** [§17.1 Giới thiệu DaemonSet](#/docs/k8sbook-17) — §17.1.3 (triển khai lên một tập con node bằng node selector) và §17.1.4 (cập nhật DaemonSet).

**Bẫy.** Đặt \`replicas\` cho DaemonSet. Không có trường đó: **số bản sao bằng số node khớp selector**, và nó tự tăng khi node mới gia nhập cụm. Bẫy thứ hai: DaemonSet không xuất hiện trên node control plane vì node đó có **taint**; muốn chạy ở đó phải khai toleration — đúng cơ chế mà các add-on mạng và giám sát vẫn dùng.

**Tự kiểm tra.** Bạn thêm một node mới vào cụm lúc 3 giờ sáng. Ai tạo pod của DaemonSet trên node đó, và scheduler đóng vai trò gì?`,
      },
      {
        id: "kb-w9-2",
        text: "Đặc quyền của pod tác nhân node, và cách gọi daemon cục bộ",
        lesson: `**Mục tiêu.** Cấp đúng (và chỉ đúng) quyền mà một tác nhân node cần, và chọn được cách để pod khác gọi tới daemon trên chính node của nó.

**Đọc.** [§17.2 Các tính năng đặc biệt trong pod chạy node agent và daemon](#/docs/k8sbook-17) — §17.2.1 (quyền truy cập kernel), §17.2.3 (dùng namespace mạng của node) và §17.2.4 (đánh dấu pod là quan trọng). Rồi [§17.3 Giao tiếp với daemon Pod cục bộ](#/docs/k8sbook-17), so ba cách ở §17.3.1–17.3.3.

**Bẫy.** Bật \`privileged: true\` cho tiện. Container đặc quyền gần như **vô hiệu hoá toàn bộ ranh giới container**; đa số nhu cầu thật chỉ cần một vài capability cụ thể hoặc \`hostPID\`/\`hostNetwork\` riêng lẻ. Đây cũng là thứ Pod Security Admission chặn đầu tiên khi bạn học CKS. Bẫy thứ hai: dùng Service thường để gọi daemon cục bộ — traffic có thể bị chuyển sang node khác; cần \`internalTrafficPolicy: Local\` (§17.3.3, nối tiếp §11.5.1).

**Tự kiểm tra.** Theo §17.2.4, priority class giúp gì cho pod tác nhân node khi node hết tài nguyên?`,
      },
      {
        id: "kb-w9-3",
        text: "Job: chạy tới khi hoàn thành, chạy song song, và xử lý lỗi",
        lesson: `**Mục tiêu.** Chọn đúng \`completions\`/\`parallelism\` cho một khối công việc, và cấu hình hành vi khi pod của Job thất bại.

**Đọc.** [§18.1 Chạy tác vụ với Job resource](#/docs/k8sbook-18) — §18.1.3 (xử lý lỗi), §18.1.5 (work queue) và §18.1.7 (sidecar trong Job pod) là ba mục quan trọng nhất.

**Bẫy.** Dùng \`restartPolicy: Always\` trong Job pod. Job **không chấp nhận** giá trị đó — pod của Job phải là \`OnFailure\` hoặc \`Never\`, vì một tác vụ hữu hạn cần được phép **kết thúc**. Bẫy thứ hai: \`backoffLimit\` mặc định khiến một tác vụ lỗi vĩnh viễn vẫn bị thử lại nhiều lần với độ trễ tăng dần, còn Job thì nằm đó không báo hỏng ngay. Bẫy thứ ba: sidecar không bao giờ thoát sẽ giữ Job không bao giờ hoàn thành — đó chính là lý do có native sidecar (§5.5.4).

**Tự kiểm tra.** Job có \`completions: 10\`, \`parallelism: 3\`. Tối đa bao nhiêu pod chạy cùng lúc, và Job kết thúc khi nào?`,
      },
      {
        id: "kb-w9-4",
        text: "CronJob: lịch, đồng thời, hạn chót và dọn dẹp",
        lesson: `**Mục tiêu.** Lập lịch một Job định kỳ và kiểm soát được chuyện gì xảy ra khi lần chạy trước chưa xong hoặc cụm vừa ngừng một lúc.

**Đọc.** [§18.2 Lập lịch Job với CronJob](#/docs/k8sbook-18) — §18.2.5 (hạn chót bắt đầu), §18.2.6 (xử lý đồng thời) và §18.2.4 (tự động xoá Job đã kết thúc).

**Bẫy.** Để \`concurrencyPolicy\` mặc định (\`Allow\`) cho một tác vụ chạy lâu hơn chu kỳ lịch. Các lần chạy **chồng lên nhau**, tranh nhau cùng dữ liệu, và tải tăng dần cho tới khi cụm ngộp — dùng \`Forbid\` hoặc \`Replace\` khi tác vụ không an toàn để chạy song song. Bẫy thứ hai: cụm ngừng qua giờ chạy rồi khi tỉnh dậy khởi động một loạt Job bù; \`startingDeadlineSeconds\` (§18.2.5) là thứ chặn chuyện đó. Bẫy thứ ba: quên \`ttlSecondsAfterFinished\` nên Job và pod đã xong tích tụ hàng nghìn object.

**Tự kiểm tra.** CronJob chạy mỗi 5 phút, mỗi lần mất 8 phút. Với từng giá trị \`Allow\`, \`Forbid\`, \`Replace\`, sau 30 phút bạn có bao nhiêu Job đang chạy?`,
      },
    ],
  },
];
