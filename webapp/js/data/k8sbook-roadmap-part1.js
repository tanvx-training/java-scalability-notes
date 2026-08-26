// Lộ trình đọc Kubernetes in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes in Action", ấn bản 2 (MEAP V15) —
// Marko Lukša, Manning. Thư mục nguồn: k8s-ebook/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (kb-w<N> / kb-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Một số mục trong bản dịch còn giữ nguyên tiêu đề tiếng Anh (§5.4, §5.5, §6.3,
// §8.3). Ở những chỗ đó, nhãn liên kết trích đúng tiêu đề sách thật sự có, và
// phần diễn giải tiếng Việt nằm trong câu văn — không bịa tiêu đề tiếng Việt.

export const k8sbookWeeksPart1 = [
  {
    id: "kb-w1",
    week: "Tuần 1",
    title: "Container — nền móng bên dưới Kubernetes",
    goal: "Giải thích được container là gì ở mức cơ chế kernel, và tự đóng gói được ứng dụng mẫu của sách thành image chạy được.",
    practice: "Build image Kiada theo chương 2, chạy nó bằng Docker, rồi dùng `docker exec` vào trong container và so `ps aux`, `ls /proc` với máy thật để thấy ranh giới namespace.",
    resources: [
      { label: "KIA 00 — Mở đầu: về cuốn sách", href: "#/docs/k8sbook-00" },
      { label: "KIA 02 — Tìm hiểu về container", href: "#/docs/k8sbook-02" },
      { label: "Ôn lại: CKAD tuần 1", href: "#/roadmap/ckad" },
      { label: "docs.docker.com — Get started", href: "https://docs.docker.com/get-started/" },
    ],
    items: [
      {
        id: "kb-w1-1",
        text: "Container khác máy ảo ở đâu, và vì sao khác biệt đó quan trọng",
        lesson: `**Mục tiêu.** Nói được vì sao khởi động một container nhanh hơn một máy ảo hàng chục lần, và điều đó đánh đổi lấy cái gì về mặt cách ly.

**Đọc.** [§2.1 Giới thiệu về container](#/docs/k8sbook-02) — đọc kỹ phần so sánh container với máy ảo. Chưa cần đọc §2.2 và §2.3 ở mục này.

**Bẫy.** Nghĩ container là "máy ảo nhẹ". Container **không có kernel riêng** — mọi container trên một máy dùng chung kernel của host. Đó vừa là lý do nó nhẹ, vừa là lý do ranh giới bảo mật của nó yếu hơn máy ảo, và là lý do bạn không chạy được container Linux trên kernel Windows mà không có một máy ảo ở giữa.

**Tự kiểm tra.** Nếu hai container trên cùng một node dùng chung kernel, điều gì ngăn tiến trình trong container A nhìn thấy tiến trình của container B?`,
      },
      {
        id: "kb-w1-2",
        text: "Đóng gói và chạy ứng dụng mẫu Kiada bằng Docker",
        lesson: `**Mục tiêu.** Tự build được image từ Dockerfile của sách, chạy nó, và giải thích được mỗi dòng trong Dockerfile đó làm gì.

**Đọc.** [§2.2 Triển khai Kiada — Ứng dụng mẫu của Kubernetes in Action](#/docs/k8sbook-02) — làm theo từng lệnh, đừng chỉ đọc. Kiada sẽ theo bạn suốt cả cuốn sách, nên bỏ công ở đây là đầu tư cho 15 chương sau.

**Bẫy.** Build được image trên máy mình rồi cho rằng cụm cũng chạy được nó. Cụm kéo image từ **registry**, không phải từ ổ đĩa của bạn — image chỉ nằm ở local là node sẽ báo \`ImagePullBackOff\`. Ghi nhớ điều này ngay từ tuần 1, vì tuần 2 bạn sẽ gặp đúng lỗi đó.

**Tự kiểm tra.** \`docker history\` liệt kê layer nào ứng với chỉ thị nào trong Dockerfile của bạn, và vì sao xoá một tệp ở chỉ thị sau không làm image nhỏ đi?`,
      },
      {
        id: "kb-w1-3",
        text: "Namespace và cgroups — cơ chế thật đứng sau chữ \"container\"",
        lesson: `**Mục tiêu.** Chỉ ra được namespace nào chịu trách nhiệm cho việc gì, và phân biệt được vai trò của namespace với vai trò của cgroups.

**Đọc.** [§2.3 Tìm hiểu sâu về container](#/docs/k8sbook-02) — đây là mục quan trọng nhất của chương. Đọc chậm phần liệt kê các loại namespace và phần cgroups.

**Bẫy.** Gộp namespace và cgroups làm một. Chúng giải quyết hai bài toán khác nhau: **namespace quyết định tiến trình *nhìn thấy* gì** (PID, mount, network, user…), còn **cgroups quyết định nó *dùng được bao nhiêu*** (CPU, bộ nhớ). Một container thiếu giới hạn cgroups vẫn được cách ly tầm nhìn nhưng có thể ăn hết RAM của node — đó chính là lý do Kubernetes có \`resources.limits\`.

**Tự kiểm tra.** Nếu bạn chạy container với \`--pid=host\`, namespace nào bị bỏ và hậu quả quan sát được là gì?`,
      },
    ],
  },
  {
    id: "kb-w2",
    week: "Tuần 2",
    title: "Cụm đầu tiên & mô hình đối tượng API",
    goal: "Có một cụm chạy được để học, gõ được kubectl không cần tra cứu từng lệnh, và đọc được YAML của bất kỳ đối tượng nào theo đúng bốn phần của nó.",
    practice: "Dựng cụm bằng kind hoặc Minikube, triển khai Kiada bằng `kubectl create deployment`, scale lên 3 bản sao, rồi mở `kubectl get node <tên> -o yaml` và tự chỉ ra đâu là type metadata, object metadata, spec, status. Chạy `kubectl get events` sau mỗi lần thay đổi.",
    resources: [
      { label: "KIA 03 — Triển khai ứng dụng đầu tiên của bạn", href: "#/docs/k8sbook-03" },
      { label: "KIA 04 — Giới thiệu các đối tượng API của Kubernetes", href: "#/docs/k8sbook-04" },
      { label: "Ôn lại: CKAD tuần 2", href: "#/roadmap/ckad" },
      { label: "kind.sigs.k8s.io — Quick start", href: "https://kind.sigs.k8s.io/docs/user/quick-start/" },
    ],
    items: [
      {
        id: "kb-w2-1",
        text: "Dựng cụm Kubernetes để học: kind, minikube hay cloud",
        lesson: `**Mục tiêu.** Chọn được một cách dựng cụm phù hợp với máy của bạn và nói được nó khác các cách còn lại ở đâu, thay vì làm theo hướng dẫn đầu tiên tìm được trên mạng.

**Đọc.** [§3.1 Triển khai một cụm Kubernetes](#/docs/k8sbook-03) — đọc §3.1.1 (Docker Desktop), §3.1.2 (Minikube) và §3.1.3 (kind), rồi chọn một cách và làm theo tới khi \`kubectl get nodes\` trả về kết quả. §3.1.4 và §3.1.5 (GKE, EKS) chỉ cần lướt để biết cụm được quản lý là gì.

**Bẫy.** Bắt đầu bằng cách dựng cụm đa nút từ con số không. Chính tác giả khuyên đừng làm vậy cho tới khi bạn hiểu Kubernetes sâu hơn (§3.1.6) — cài đặt và quản trị một cụm khó hơn nhiều so với việc dùng nó. Một khác biệt đáng nhớ khi chọn công cụ: *kind* chạy **mỗi nút trong một container**, nên nó tạo được cụm đa nút ngay trên một máy; Minikube thì dựng cụm một nút.

**Tự kiểm tra.** Theo mô tả của sách, vì sao *kind* tạo được cụm nhiều nút trên một máy tính duy nhất, còn Minikube thì chỉ cho bạn một nút?`,
      },
      {
        id: "kb-w2-2",
        text: "kubectl và chạy ứng dụng đầu tiên trên cụm",
        lesson: `**Mục tiêu.** Triển khai được Kiada lên cụm bằng lệnh mệnh lệnh, phơi nó ra ngoài bằng Service, scale lên 3 bản sao, và giải thích được ba đối tượng vừa sinh ra liên hệ với nhau thế nào.

**Đọc.** [§3.2 Tương tác với Kubernetes](#/docs/k8sbook-03) rồi [§3.3 Chạy ứng dụng đầu tiên trên Kubernetes](#/docs/k8sbook-03) — làm theo từng lệnh. Riêng §3.3.4 hãy đọc kỹ hai lần: nó là bản đồ khái niệm cho cả phần còn lại của sách. Có thể lướt §3.2.4 (web dashboard).

**Bẫy.** Tưởng container là đối tượng cấp cao nhất — sách cho bạn gõ thử \`kubectl get containers\` và nhận lỗi \`the server doesn't have a resource type "containers"\`. Đơn vị triển khai nhỏ nhất là **pod**, không phải container. Bẫy thứ hai: \`kubectl scale\` trông như lệnh mệnh lệnh nhưng thực chất chỉ **sửa đối tượng Deployment** — bạn khai số bản sao mong muốn, Kubernetes tự tính việc phải làm.

**Tự kiểm tra.** Pod có địa chỉ IP riêng rồi, vậy vì sao sách vẫn khuyên phơi cả một pod duy nhất qua Service thay vì cho client nối thẳng vào IP của pod?`,
      },
      {
        id: "kb-w2-3",
        text: "Giải phẫu một đối tượng API: group/version/kind, spec vs status",
        lesson: `**Mục tiêu.** Nhìn một manifest lạ dài vài trăm dòng và chỉ ngay được bốn phần của nó, biết phần nào bạn viết và phần nào hệ thống viết.

**Đọc.** [§4.1 Làm quen với Kubernetes API](#/docs/k8sbook-04) — §4.1.1 phân biệt "tài nguyên" với "đối tượng", §4.1.2 mô tả bốn phần: type metadata, object metadata, spec, status. Đọc kỹ khung "Hiểu về phần Spec và Status".

**Bẫy.** Sửa \`status\` để "chữa" một đối tượng. Bạn **viết \`spec\`** (trạng thái mong muốn) và **đọc \`status\`** (trạng thái thực tế) — chiều ngược lại thuộc về bộ điều khiển. Bẫy kèm theo: không phải đối tượng nào cũng có spec và status; đối tượng Event chỉ chứa dữ liệu tĩnh nên không có hai phần đó, đúng như §4.3.2 chỉ ra.

**Tự kiểm tra.** Nếu bạn là người ghi \`spec\` và đọc \`status\`, thì theo sách, thành phần nào của Kubernetes làm việc ngược lại — đọc \`spec\` và ghi \`status\`?`,
      },
      {
        id: "kb-w2-4",
        text: "Đọc thuộc tính chi tiết và theo dõi cụm qua đối tượng Event",
        lesson: `**Mục tiêu.** Tự tra được ý nghĩa của một trường lạ mà không cần Google, và dùng Event làm công cụ chẩn đoán đầu tiên khi có gì đó không chạy.

**Đọc.** [§4.2 Khảo sát các thuộc tính chi tiết của đối tượng](#/docs/k8sbook-04) — tập trung vào \`kubectl explain\` (§4.2.2) và trường \`conditions\` (§4.2.3). Sau đó [§4.3 Theo dõi các sự kiện của cụm qua đối tượng Event](#/docs/k8sbook-04) đọc trọn vẹn, kể cả Bảng 4.1.

**Bẫy.** Đi tìm event bên trong YAML của đối tượng. Event là **đối tượng độc lập**, không nằm trong manifest của đối tượng mà nó nói về. Nguy hiểm hơn: mỗi Event **tự bị xoá sau khoảng một giờ** để giảm tải cho etcd — "không thấy event nào" không có nghĩa là chưa từng có sự cố, mà rất có thể bạn đến muộn.

**Tự kiểm tra.** \`kubectl describe\` và \`kubectl get events\` khác nhau ở phạm vi sự kiện hiển thị thế nào, và bạn dùng tuỳ chọn nào để chỉ liệt kê sự kiện loại \`Warning\`?`,
      },
    ],
  },
  {
    id: "kb-w3",
    week: "Tuần 3",
    title: "Pod — đơn vị triển khai nhỏ nhất",
    goal: "Tự viết được manifest pod từ đầu, làm chủ bộ công cụ chẩn đoán pod đang chạy, và quyết định đúng khi nào gộp container vào một pod.",
    practice: "Viết `pod.kiada.yaml` bằng tay, apply, rồi lần lượt dùng `kubectl logs`, `exec`, `cp`, `port-forward` trên chính pod đó. Tiếp theo tạo pod hai container (Node.js + Envoy), thêm hai init container, và quan sát thứ tự khởi động qua `kubectl get pods -w`.",
    resources: [
      { label: "KIA 05 — Chạy các workload trong Pod", href: "#/docs/k8sbook-05" },
      { label: "Nhắc lại namespace: KIA 02 §2.3", href: "#/docs/k8sbook-02" },
      { label: "Ôn lại: CKAD tuần 3", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Pods", href: "https://kubernetes.io/docs/concepts/workloads/pods/" },
    ],
    items: [
      {
        id: "kb-w3-1",
        text: "Vì sao cần pod, cách gom container, và viết manifest YAML đầu tiên",
        lesson: `**Mục tiêu.** Trả lời được câu "cái này nên là một pod hay hai pod?" bằng lập luận, và viết được manifest pod tối giản không cần chép mẫu.

**Đọc.** [§5.1 Tìm hiểu về pod](#/docs/k8sbook-05) — đọc kỹ §5.1.2, nhất là danh sách năm câu hỏi ở cuối mục. Sau đó [§5.2 Tạo pod từ tệp YAML hoặc JSON](#/docs/k8sbook-05) và tự gõ lại Đoạn mã 5.1, đừng copy.

**Bẫy.** Nhét web server và cơ sở dữ liệu vào chung một pod vì "chúng thuộc cùng một ứng dụng". Pod không chỉ là đơn vị triển khai mà còn là **đơn vị mở rộng**: Kubernetes nhân bản cả pod, không nhân bản từng container bên trong. Gộp chúng lại nghĩa là bạn không còn scale front-end độc lập với back-end được nữa, và cả hai bị buộc chạy trên cùng một node.

**Tự kiểm tra.** Áp năm câu hỏi ở cuối §5.1.2 vào cặp máy chủ web + cơ sở dữ liệu — câu nào cho câu trả lời "không", và vì sao chỉ một câu "không" là đủ để tách pod?`,
      },
      {
        id: "kb-w3-2",
        text: "Làm việc với pod đang chạy: logs, exec, cp, port-forward",
        lesson: `**Mục tiêu.** Chẩn đoán được một pod đang chạy mà không cần SSH vào node, và biết mỗi lệnh trong bộ bốn này phù hợp với tình huống nào.

**Đọc.** [§5.3 Tương tác với ứng dụng và pod](#/docs/k8sbook-05) — §5.3.1 (port-forward), §5.3.2 (logs), §5.3.3 (cp), §5.3.4 (exec). Đọc kỹ Hình 5.9 về đường đi của gói tin khi port-forward. §5.3.5 (\`attach\`) có thể để sau.

**Bẫy.** Kết luận "pod hỏng" khi \`kubectl port-forward\` không kết nối được. Đường truyền của port-forward dài bất thường — curl → proxy → API server → Kubelet → container qua loopback — nên **một mắt xích bất kỳ hỏng là bạn mất kết nối dù pod vẫn khoẻ**. Cụ thể hơn: nếu ứng dụng chỉ lắng nghe trên \`eth0\` của pod chứ không bind vào loopback, Kubelet không tới được nó. Ghi thêm: \`kubectl cp\` cần có \`tar\` sẵn trong container.

**Tự kiểm tra.** Vì sao khai báo \`ports\` trong manifest pod là việc nên làm nhưng không bắt buộc — bỏ trống nó có chặn client kết nối tới cổng đó không?`,
      },
      {
        id: "kb-w3-3",
        text: "Nhiều container trong một pod và container khởi tạo",
        lesson: `**Mục tiêu.** Thêm được một sidecar vào pod có sẵn mà không đụng vào mã nguồn ứng dụng, và biết dùng init container để bắt buộc một việc phải xong trước khi ứng dụng chạy.

**Đọc.** [§5.4 Running multiple containers in a pod](#/docs/k8sbook-05) — bản dịch giữ nguyên tiêu đề tiếng Anh của mục này; nội dung là dựng pod hai container Node.js + Envoy để có HTTPS mà không sửa \`app.js\`. Rồi [§5.5 Running additional containers at pod startup](#/docs/k8sbook-05), cũng còn tiêu đề tiếng Anh — đây là mục về init container.

**Bẫy.** Trông chờ container này khởi động xong rồi container kia mới chạy. Sách nói rõ: các container của pod **khởi chạy song song**, và Kubernetes chưa có cơ chế trực tiếp để khai báo phụ thuộc giữa chúng. Init container chính là cách vòng qua điều đó — chúng chạy **tuần tự từng cái một** và tất cả phải kết thúc thành công trước khi container thường được phép khởi động.

**Tự kiểm tra.** Bạn muốn hoãn ứng dụng cho tới khi một dịch vụ ngoài sẵn sàng. Theo §5.5.1, bạn đặt việc chờ đó ở đâu, và vì sao không đặt trong chính container ứng dụng?`,
      },
      {
        id: "kb-w3-4",
        text: "Xoá pod và các đối tượng khác — ba cách và khác biệt của chúng",
        lesson: `**Mục tiêu.** Dọn sạch cụm sau mỗi buổi thực hành mà không để sót đối tượng, và hiểu vì sao có thứ xoá mãi không chết.

**Đọc.** [§5.6 Xóa pod và các đối tượng khác](#/docs/k8sbook-05) — đọc trọn bốn mục con: xoá theo tên (§5.6.1), xoá theo tệp manifest (§5.6.2), \`--all\` (§5.6.3) và từ khoá \`all\` (§5.6.4).

**Bẫy.** Chạy \`kubectl delete po --all\`, thấy báo đã xoá, rồi \`kubectl get pods\` lại hiện pod mới với \`AGE\` vài giây. Đó không phải pod cũ sống lại: **bộ điều khiển của Deployment tạo pod thay thế** để giữ đúng số bản sao mong muốn. Muốn dứt điểm thì scale Deployment về 0 hoặc xoá hẳn Deployment. Bẫy thứ hai: \`kubectl delete all --all\` **không** đụng tới mọi loại đối tượng — Event là ví dụ sách nêu ra.

**Tự kiểm tra.** \`kubectl delete -f pod.kiada.yaml\` và \`kubectl delete po kiada\` cho cùng kết quả ở đây; nhưng khi tệp manifest mô tả cả một ứng dụng nhiều đối tượng thì cách nào tiện hơn và vì sao?`,
      },
    ],
  },
  {
    id: "kb-w4",
    week: "Tuần 4",
    title: "Vòng đời Pod & giữ ứng dụng sống",
    goal: "Đọc được trạng thái pod tới mức chi tiết từng container, cấu hình liveness probe không gây hại, và làm cho ứng dụng tắt êm thay vì bị kill.",
    practice: "Tạo pod `kiada-ssl`, gọi endpoint `/quitquitquit` của Envoy vài lần liên tiếp và ghi lại thời gian chờ giữa các lần khởi động lại. Sau đó thêm liveness probe, thêm pre-stop hook, đo lại thời gian `kubectl delete pod` mất bao lâu trước và sau khi ứng dụng xử lý `SIGTERM`.",
    resources: [
      { label: "KIA 06 — Quản lý vòng đời của Pod", href: "#/docs/k8sbook-06" },
      { label: "Nhắc lại init container: KIA 05 §5.5", href: "#/docs/k8sbook-05" },
      { label: "Ôn lại: CKAD tuần 4", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Configure Liveness Probes", href: "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/" },
    ],
    items: [
      {
        id: "kb-w4-1",
        text: "Đọc trạng thái pod: phase, condition, trạng thái từng container",
        lesson: `**Mục tiêu.** Từ đầu ra của \`kubectl describe pod\`, chỉ ra được chính xác pod đang kẹt ở đâu, thay vì chỉ đọc được chữ trong cột \`STATUS\`.

**Đọc.** [§6.1 Tìm hiểu trạng thái của pod](#/docs/k8sbook-06) — Bảng 6.1 (năm pha), Bảng 6.2 (bốn loại condition) và Bảng 6.3 (bốn trạng thái container). Đọc kèm Hình 6.2 để thấy condition nào chỉ bật một lần, condition nào bật tắt suốt vòng đời.

**Bẫy.** Coi cột \`STATUS\` của \`kubectl get pods\` là pha của pod. Sách nói rõ điều đó **chỉ đúng với pod đang khoẻ mạnh**; với pod có vấn đề, cột này hiển thị chính vấn đề đó chứ không phải pha. Bẫy đi kèm: pha \`Running\` chỉ có nghĩa là **ít nhất một** container đang chạy — nó không hứa hẹn gì về việc pod đã sẵn sàng phục vụ.

**Tự kiểm tra.** Một pod đang ở pha \`Running\` — muốn biết nó đã sẵn sàng nhận request hay chưa, bạn xem condition nào, và condition đó khác \`ContainersReady\` ở chỗ nào?`,
      },
      {
        id: "kb-w4-2",
        text: "Restart policy và liveness probe — giữ container sống đúng cách",
        lesson: `**Mục tiêu.** Viết được một liveness probe không tự bắn vào chân mình, và đọc được \`CrashLoopBackOff\` như một con số thời gian chứ không phải một lời nguyền.

**Đọc.** [§6.2 Giữ cho các container luôn hoạt động ổn định](#/docs/k8sbook-06) — Bảng 6.4 (ba chính sách khởi động lại), phần exponential back-off, ba kiểu đầu dò ở §6.2.2, và §6.2.7 về cách viết handler cho tốt.

**Bẫy.** Nghĩ \`restartPolicy\` đặt được cho từng container. Nó nằm **ở cấp pod và áp cho mọi container** trong pod — chính sách sách gọi là "một điểm đáng ngạc nhiên". Bẫy nặng hơn ở §6.2.7: cho endpoint \`/healthz\` của front-end kiểm tra luôn cả back-end. Back-end sập thì front-end bị khởi động lại vô ích, probe vẫn hỏng sau mỗi lần restart, và một sự cố đơn lẻ lan thành lỗi dây chuyền.

**Tự kiểm tra.** Container của bạn vừa dừng lần thứ tư liên tiếp. Theo dãy thời gian trễ trong §6.2.1, bạn phải chờ bao lâu, trần tối đa là bao nhiêu, và điều kiện nào đưa con số đó về 0?`,
      },
      {
        id: "kb-w4-3",
        text: "Lifecycle hook và trình tự tắt pod êm",
        lesson: `**Mục tiêu.** Làm cho pod tắt trong vài giây thay vì bị \`KILL\` sau 30 giây, và biết chỗ nào nên dùng hook, chỗ nào phải sửa ứng dụng.

**Đọc.** [§6.3 Executing actions at container start-up and shutdown](#/docs/k8sbook-06) — bản dịch còn giữ tiêu đề tiếng Anh; đây là mục về post-start hook và pre-stop hook. Đọc kỹ khung "Tại sao ứng dụng của tôi không nhận được tín hiệu TERM" ở §6.3.2. Sau đó [§6.4 Hiểu về vòng đời của pod](#/docs/k8sbook-06), tập trung vào §6.4.3.

**Bẫy.** Dùng pre-stop hook để gửi \`TERM\` cho ứng dụng vì "nó không bao giờ nhận được tín hiệu". Sách chỉ ra nguyên nhân thật thường nằm trong Dockerfile: dạng *shell* của \`ENTRYPOINT\`/\`CMD\` khiến shell thành tiến trình gốc, nhận \`TERM\` rồi **không chuyển tiếp** cho tiến trình con. Cách sửa đúng là chuyển sang dạng *exec*. Bẫy thứ hai, có cảnh báo riêng trong sách: post-start hook kiểu HTTP GET trỏ vào chính container của nó sẽ đẩy container vào vòng lặp khởi động lại vô tận.

**Tự kiểm tra.** Bạn chạy \`kubectl delete po --grace-period 0\`. Theo §6.4.3, điều gì xảy ra với pre-stop hook của pod, và vì sao đó là chuyện đáng lo nếu hook đó đang làm việc dọn dẹp quan trọng?`,
      },
    ],
  },
  {
    id: "kb-w5",
    week: "Tuần 5",
    title: "Lưu trữ — từ emptyDir tới PersistentVolume",
    goal: "Chọn đúng loại volume cho từng nhu cầu, và viết được manifest ứng dụng không dính chặt vào một cụm cụ thể.",
    practice: "Thêm emptyDir vào pod quiz cho MongoDB, giết container và kiểm chứng dữ liệu còn; rồi xoá pod và kiểm chứng dữ liệu mất. Tiếp theo chuyển sang PVC không khai `storageClassName` để cụm tự cấp phát động, và so hai manifest xem chỗ nào biến mất.",
    resources: [
      { label: "KIA 07 — Gắn kết các volume lưu trữ vào Pod", href: "#/docs/k8sbook-07" },
      { label: "KIA 08 — Lưu trữ dữ liệu trong PersistentVolume", href: "#/docs/k8sbook-08" },
      { label: "Ôn lại: CKAD tuần 5", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Persistent Volumes", href: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/" },
    ],
    items: [
      {
        id: "kb-w5-1",
        text: "Volume là gì và emptyDir chia sẻ dữ liệu giữa các container",
        lesson: `**Mục tiêu.** Nói chính xác dữ liệu trong emptyDir sống qua sự kiện nào và chết ở sự kiện nào, và dùng nó để hai container trong một pod trao đổi tệp.

**Đọc.** [§7.1 Giới thiệu về volume](#/docs/k8sbook-07) — đặc biệt §7.1.2 về vòng đời của volume. Rồi [§7.2 Sử dụng volume emptyDir](#/docs/k8sbook-07) trọn vẹn: bảo toàn qua restart (§7.2.1), nạp dữ liệu bằng init container (§7.2.2), chia sẻ giữa container (§7.2.3).

**Bẫy.** Gọi emptyDir là "lưu trữ bền vững". Volume được định nghĩa **ở cấp pod** và vòng đời của nó gắn với **pod**, không phải container: dữ liệu sống qua các lần khởi động lại container, nhưng xoá pod là mất sạch. Bẫy tinh vi hơn, sách có hẳn một gợi ý cảnh báo: mount volume để giữ dữ liệu qua restart có thể **làm hỏng khả năng tự phục hồi** — cache hỏng được giữ lại sẽ đẩy container vào vòng lặp crash vô tận.

**Tự kiểm tra.** Trong pod quiz, vì sao init container ghi được tệp vào một volume mà container \`mongo\` sau đó đọc ra, dù hai container có mount namespace riêng?`,
      },
      {
        id: "kb-w5-2",
        text: "Gắn bộ lưu trữ ngoài và đọc file trên node worker bằng hostPath",
        lesson: `**Mục tiêu.** Biết vì sao một manifest pod trỏ thẳng vào đĩa của nhà cung cấp đám mây là ngõ cụt, và nhận ra hostPath là loại volume cần dè chừng nhất.

**Đọc.** [§7.3 Sử dụng bộ lưu trữ ngoài trong pod](#/docs/k8sbook-07) — nếu không có cụm cloud thì đọc §7.3.2 và §7.3.3 là đủ, §7.3.3 mới là phần quan trọng. Sau đó [§7.4 Truy cập các file trên hệ thống tệp của node worker](#/docs/k8sbook-07), đọc kỹ ví dụ pod \`node-explorer\`.

**Bẫy.** Nghĩ volume ngoài được gắn vào *pod*. Thí nghiệm trong §7.3.3 cho thấy thông báo lỗi \`RESOURCE_IN_USE_BY_ANOTHER_RESOURCE\` nói đĩa đang bị **một node khác** chiếm giữ, không phải bị pod kia chiếm — pod thứ hai kẹt mãi ở \`ContainerCreating\` chỉ vì nó được xếp lên node khác. Về hostPath: sách gọi đây là một trong những loại volume nguy hiểm nhất, vì mount \`/var/run/docker.sock\` là đủ để chạy lệnh bất kỳ trên node với quyền root.

**Tự kiểm tra.** Vì sao hostPath không phải chỗ để đặt dữ liệu cơ sở dữ liệu, trừ khi bạn ép được pod luôn chạy trên đúng một node?`,
      },
      {
        id: "kb-w5-3",
        text: "PV và PVC — tách pod khỏi công nghệ lưu trữ bên dưới",
        lesson: `**Mục tiêu.** Viết được manifest ứng dụng mang sang cụm khác chạy được ngay, và phân biệt rạch ròi việc của quản trị viên cụm với việc của bạn.

**Đọc.** [§8.1 Tách biệt pod khỏi công nghệ lưu trữ bên dưới](#/docs/k8sbook-08) — đọc kỹ §8.1.2 về lợi ích. Rồi [§8.2 Tạo PersistentVolume và PersistentVolumeClaim](#/docs/k8sbook-08): làm §8.2.1 với vai quản trị viên, §8.2.2 với vai lập trình viên, và đọc §8.2.5 về vòng đời.

**Bẫy.** Đưa định nghĩa PersistentVolume vào manifest ứng dụng của mình. Sách nói thẳng: là lập trình viên, bạn **chỉ nên viết PersistentVolumeClaim** — PV chứa chi tiết hạ tầng và thuộc về quản trị viên cụm. Bẫy cú pháp đi kèm: nếu muốn claim bám vào một PV đã cấp phát sẵn, bạn phải đặt \`storageClassName: ""\` — chuỗi rỗng tường minh, chứ không phải bỏ trống trường đó.

**Tự kiểm tra.** Cụm có hai PV đang \`Available\` cùng thoả dung lượng và access mode. Nếu PVC của bạn không khai \`volumeName\`, Kubernetes chọn cái nào, và điều đó dẫn tới hậu quả gì trong bài thực hành của sách?`,
      },
      {
        id: "kb-w5-4",
        text: "Cấp phát động qua StorageClass và PV cục bộ trên node",
        lesson: `**Mục tiêu.** Tạo được persistent volume mà không cần nhờ quản trị viên, và biết khi nào phải quay lại cách thủ công.

**Đọc.** [§8.3 Dynamic provisioning of persistent volumes](#/docs/k8sbook-08) — bản dịch giữ nguyên tiêu đề tiếng Anh; đây là mục về cấp phát động và đối tượng StorageClass. Đọc §8.3.1 và §8.3.2, rồi §8.3.6 về vòng đời. Sau đó [§8.4 Các persistent volume cục bộ trên node (Node-local)](#/docs/k8sbook-08).

**Bẫy.** Lẫn hai cách viết \`storageClassName\`. **Bỏ trống trường** nghĩa là dùng storage class mặc định và cấp phát động; **đặt bằng \`""\`** thì ngược lại, tắt cấp phát động và bắt hệ thống tìm một PV có sẵn. Hai cách viết trông gần giống nhau nhưng cho kết quả trái ngược. Với PV cục bộ, chi tiết dễ bỏ sót là \`volumeBindingMode: WaitForFirstConsumer\`: nó hoãn việc liên kết claim cho tới khi pod được lập lịch, vì volume chỉ truy cập được từ đúng node gắn nó.

**Tự kiểm tra.** PV cục bộ và volume hostPath cùng trỏ vào đĩa của node. Khi pod bị xoá rồi tạo lại, cái nào bảo đảm pod vẫn thấy đúng dữ liệu cũ, và cơ chế nào của Kubernetes bảo đảm điều đó?`,
      },
    ],
  },
];
