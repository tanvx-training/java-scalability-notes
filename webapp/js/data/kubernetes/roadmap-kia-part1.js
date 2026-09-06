// Lộ trình đọc Kubernetes in Action — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes in Action", ấn bản 2 — Marko Lukša,
// Manning. Thư mục nguồn: sources/kubernetes/kubernetes-in-action/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Nhịp: 9 tuần × 2 chương, 4 mục mỗi tuần — bám đúng thứ tự 18 chương của ấn
// bản 2 (chương 1 giới thiệu và chương 13 Gateway API là nội dung mới; namespace
// /label lên chương 7, ConfigMap/Secret chương 8, volume chương 9, PV chương 10).
//
// Nhãn liên kết trích đúng tiêu đề mục có thật trong bản dịch — bản dịch giữ kèm
// nguyên văn tiếng Anh trong ngoặc, ở đây chỉ lấy phần tiếng Việt.

export const k8sbookWeeksPart1 = [
  {
    id: "kb-w1",
    week: "Tuần 1",
    title: "Kubernetes giải bài toán gì & container là nền móng",
    goal: "Nói được Kubernetes thay bạn làm gì mà không cần nhắc tới một lệnh kubectl nào, và tự đóng gói được ứng dụng mẫu của sách thành image chạy được.",
    practice: "Build image Kiada theo chương 2, chạy nó bằng Docker, rồi dùng `docker exec` vào trong container và so `ps aux`, `ls /proc` với máy thật để thấy ranh giới namespace.",
    resources: [
      { label: "KIA 01 — Giới thiệu Kubernetes", href: "#/docs/k8sbook-01" },
      { label: "KIA 02 — Tìm hiểu container và các ứng dụng được container hóa", href: "#/docs/k8sbook-02" },
      { label: "Ôn lại: CKAD tuần 1", href: "#/roadmap/ckad" },
      { label: "docs.docker.com — Get started", href: "https://docs.docker.com/get-started/" },
    ],
    items: [
      {
        id: "kb-w1-1",
        text: "Kubernetes trừu tượng hoá cái gì, và vì sao điều đó đáng giá",
        lesson: `**Mục tiêu.** Giải thích được "triển khai khai báo" (declarative) khác "triển khai bằng kịch bản" ở đâu, và kể được ba việc Kubernetes làm thay bạn.

**Đọc.** [§1.1 Giới thiệu Kubernetes](#/docs/k8sbook-01) và [§1.2.1–1.2.2 Kubernetes biến đổi một cụm máy tính & lợi ích](#/docs/k8sbook-01). Đây là chương duy nhất không có lệnh nào để gõ — đọc một mạch, đừng ghi chép nhiều.

**Bẫy.** Đọc chương này như quảng cáo rồi bỏ qua. Đúng ý cần nhớ là: bạn khai báo **trạng thái mong muốn**, còn Kubernetes chạy vòng lặp để **đưa hệ thống về** trạng thái đó. Mọi thứ lạ lùng bạn gặp ở 17 chương sau (pod tự mọc lại, rollout tự tiếp diễn, PVC chờ mãi ở Pending) đều là hệ quả của đúng một câu này.

**Tự kiểm tra.** Nếu bạn \`docker rm -f\` một container do Kubernetes quản lý, chuyện gì xảy ra và vì sao? Trả lời bằng khái niệm trạng thái mong muốn, không bằng tên lệnh.`,
      },
      {
        id: "kb-w1-2",
        text: "Kiến trúc cluster, và khi nào KHÔNG nên dùng Kubernetes",
        lesson: `**Mục tiêu.** Vẽ lại từ trí nhớ sơ đồ control plane / worker node và gọi đúng tên bốn thành phần chính, đồng thời nêu được hai tình huống Kubernetes là lựa chọn sai.

**Đọc.** [§1.2.3 Kiến trúc của một Kubernetes cluster](#/docs/k8sbook-01) và [§1.2.4 Kubernetes chạy một ứng dụng như thế nào](#/docs/k8sbook-01), rồi [§1.3 Đưa Kubernetes vào tổ chức của bạn](#/docs/k8sbook-01) — riêng §1.3.4 đọc kỹ.

**Bẫy.** Học thuộc tên thành phần mà không biết cái nào chạy ở đâu. \`kube-apiserver\`, \`etcd\`, scheduler và các controller nằm ở **control plane**; \`kubelet\`, \`kube-proxy\` và container runtime nằm trên **mỗi worker node**. Nhớ sai chỗ này thì cả chương troubleshooting của giáo trình CKA sẽ vô nghĩa — bạn sẽ đi tìm log ở đúng máy sai.

**Tự kiểm tra.** Control plane sập hoàn toàn trong 10 phút. Các pod đang chạy có ngừng phục vụ không, và cái gì thì ngừng hoạt động?`,
      },
      {
        id: "kb-w1-3",
        text: "Container khác máy ảo ở đâu, và Docker/OCI đứng ở đâu trong bức tranh",
        lesson: `**Mục tiêu.** Nói được vì sao khởi động một container nhanh hơn một máy ảo, và điều đó đánh đổi lấy cái gì về mặt cách ly.

**Đọc.** [§2.1 Giới thiệu về container](#/docs/k8sbook-02) — đọc kỹ §2.1.1 (so sánh container với VM) và §2.1.4 (OCI và các lựa chọn thay thế Docker). §2.1.3 làm theo để có Docker chạy được trên máy.

**Bẫy.** Nghĩ container là "máy ảo nhẹ". Container **không có kernel riêng** — mọi container trên một máy dùng chung kernel của host. Đó vừa là lý do nó nhẹ, vừa là lý do ranh giới bảo mật của nó yếu hơn máy ảo, và là lý do bạn không chạy được container Linux trên kernel Windows mà không có một máy ảo ở giữa.

**Tự kiểm tra.** Theo §2.1.1, ranh giới dùng chung kernel gây ra hai bất lợi — một về bảo mật, một về khả năng đem image sang máy khác chạy — và vì sao máy ảo ít dính cả hai?`,
      },
      {
        id: "kb-w1-4",
        text: "Đóng gói Kiada bằng Docker, rồi mổ xem namespace và cgroups làm gì",
        lesson: `**Mục tiêu.** Tự build được image từ Dockerfile của sách, chạy nó, và chỉ ra được namespace nào chịu trách nhiệm cho việc gì, khác cgroups ra sao.

**Đọc.** [§2.2 Triển khai ứng dụng Kubernetes in Action Demo](#/docs/k8sbook-02) — làm theo từng lệnh, đừng chỉ đọc; Kiada sẽ theo bạn suốt cả cuốn sách. Sau đó [§2.3 Tìm hiểu về container](#/docs/k8sbook-02), đọc chậm §2.3.1 (kernel namespace) và §2.3.3 (cgroups).

**Bẫy.** Hai bẫy chồng lên nhau. Một: build được image trên máy mình rồi tưởng cụm cũng chạy được nó — cụm kéo image từ **registry**, image chỉ nằm ở ổ đĩa local thì node báo \`ImagePullBackOff\` (§2.2.4 nói vì sao). Hai: gộp namespace và cgroups làm một — **namespace quyết định tiến trình *nhìn thấy* gì**, còn **cgroups quyết định nó *dùng được bao nhiêu***. Container thiếu giới hạn cgroups vẫn được cách ly tầm nhìn nhưng có thể ăn hết RAM của node; đó chính là lý do Kubernetes có \`resources.limits\`.

**Tự kiểm tra.** Chạy container với \`--pid=host\`: namespace nào bị bỏ, và bạn quan sát được hậu quả gì bằng \`ps aux\` bên trong container?`,
      },
    ],
  },
  {
    id: "kb-w2",
    week: "Tuần 2",
    title: "Cụm đầu tiên & mô hình đối tượng API",
    goal: "Có một cụm chạy được để học, gõ được kubectl không cần tra cứu từng lệnh, và đọc được YAML của bất kỳ đối tượng nào theo đúng bốn phần của nó.",
    practice: "Dựng cụm bằng kind hoặc Minikube, triển khai Kiada, scale lên 3 bản sao, rồi mở `kubectl get node <tên> -o yaml` và tự chỉ ra đâu là type metadata, object metadata, spec, status. Chạy `kubectl get events` sau mỗi lần thay đổi.",
    resources: [
      { label: "KIA 03 — Triển khai ứng dụng đầu tiên trên Kubernetes", href: "#/docs/k8sbook-03" },
      { label: "KIA 04 — Khám phá Kubernetes API và mô hình đối tượng", href: "#/docs/k8sbook-04" },
      { label: "Ôn lại: CKAD tuần 1", href: "#/roadmap/ckad" },
      { label: "kind.sigs.k8s.io — Quick start", href: "https://kind.sigs.k8s.io/docs/user/quick-start/" },
    ],
    items: [
      {
        id: "kb-w2-1",
        text: "Dựng cụm để học: Docker Desktop, Minikube hay kind",
        lesson: `**Mục tiêu.** Chọn được một cách dựng cụm phù hợp với máy của bạn và nói được nó khác các cách còn lại ở đâu, thay vì làm theo hướng dẫn đầu tiên tìm được trên mạng.

**Đọc.** [§3.1 Triển khai một Kubernetes cluster](#/docs/k8sbook-03) — đọc §3.1.1 (Docker Desktop), §3.1.2 (Minikube), §3.1.3 (kind), rồi chọn một cách và làm tới khi \`kubectl get nodes\` trả về kết quả. §3.1.4–3.1.5 (GKE, EKS) chỉ lướt để biết cụm được quản lý là gì; §3.1.6 để dành tới khi học CKA.

**Bẫy.** Chọn cụm một node rồi đọc tiếp mà không biết mình đã mất gì. Minikube và Docker Desktop mặc định **một node** — mọi bài về lập lịch, DaemonSet, và hành vi khi node hỏng sẽ không quan sát được. kind tạo cụm nhiều node dễ hơn cả; nếu định theo tới chương 14–17 thì chọn kind ngay từ bây giờ.

**Tự kiểm tra.** Cụm của bạn có mấy node, và \`kubectl get nodes -o wide\` cho biết container runtime nào đang chạy trên đó?`,
      },
      {
        id: "kb-w2-2",
        text: "kubectl và ứng dụng đầu tiên chạy trên cụm",
        lesson: `**Mục tiêu.** Triển khai Kiada lên cụm, phơi nó ra ngoài, scale nó, và giải thích được cái gì đã tự động sinh ra mà bạn không hề tạo.

**Đọc.** [§3.2 Tương tác với Kubernetes](#/docs/k8sbook-03) — chú ý §3.2.2 (cấu hình kubectl trỏ vào cụm nào) và §3.2.3. Sau đó [§3.3 Chạy ứng dụng đầu tiên của bạn trên Kubernetes](#/docs/k8sbook-03), làm hết §3.3.1 tới §3.3.4.

**Bẫy.** Gõ xong \`kubectl\` mà không biết nó đang nói chuyện với cụm nào. \`kubectl config get-contexts\` và \`kubectl config use-context\` là hai lệnh bạn sẽ dùng cả đời — nhất là khi máy có đồng thời kind, Minikube và một cụm công ty. Xoá nhầm namespace vì sai context là tai nạn kinh điển.

**Tự kiểm tra.** §3.3.4 chỉ ra rằng lệnh triển khai đầu tiên của bạn sinh ra nhiều hơn một object. Kể tên chúng và nói cái nào tạo ra cái nào.`,
      },
      {
        id: "kb-w2-3",
        text: "Bốn phần của mọi object: type metadata, metadata, spec, status",
        lesson: `**Mục tiêu.** Mở YAML của bất kỳ object nào và chỉ đúng phần nào do bạn viết, phần nào do Kubernetes ghi vào.

**Đọc.** [§4.1 Làm quen với Kubernetes API](#/docs/k8sbook-04) rồi [§4.2 Xem xét các thuộc tính riêng lẻ của một object](#/docs/k8sbook-04) — §4.2.1 mổ một Node object thật, §4.2.3 nói về status condition, §4.2.4 về \`kubectl describe\`.

**Bẫy.** Sửa \`status\` trong file YAML rồi \`apply\`. **\`spec\` là của bạn, \`status\` là của Kubernetes** — nó bị ghi đè ngay ở vòng đối chiếu kế tiếp. Bẫy thứ hai: \`kubectl explain\` bị bỏ quên. Trong phòng thi lẫn đời thật, \`kubectl explain pod.spec.containers\` nhanh hơn mở trình duyệt.

**Tự kiểm tra.** Một Node có condition \`Ready=False\` kèm \`reason\`. Theo §4.2.3, bạn đọc thêm trường nào để biết Kubernetes phát hiện ra điều đó lúc nào?`,
      },
      {
        id: "kb-w2-4",
        text: "Event object — nhật ký nói cho bạn biết cụm vừa làm gì",
        lesson: `**Mục tiêu.** Dùng event làm bước chẩn đoán đầu tiên cho mọi sự cố, thay vì đoán mò từ trạng thái Pending hay CrashLoopBackOff.

**Đọc.** [§4.3 Quan sát các sự kiện trong cluster thông qua Event object](#/docs/k8sbook-04) — cả §4.3.1 và §4.3.2.

**Bẫy.** Tin rằng \`kubectl get events\` cho bạn toàn bộ lịch sử. Event **hết hạn** (mặc định khoảng một giờ) và bị dọn đi; sự cố xảy ra đêm qua thì sáng nay không còn dấu vết. Bẫy thứ hai: event mặc định lọc theo namespace hiện tại — pod của bạn Pending vì vấn đề ở cấp cụm thì manh mối có thể nằm ở namespace khác.

**Tự kiểm tra.** Pod ở trạng thái Pending. Ba lệnh đầu tiên bạn gõ là gì, theo thứ tự nào, và mỗi lệnh loại trừ được khả năng gì?`,
      },
    ],
  },
  {
    id: "kb-w3",
    week: "Tuần 3",
    title: "Pod — đơn vị triển khai nhỏ nhất, và vòng đời của nó",
    goal: "Viết được manifest pod từ đầu, thao tác thành thạo với pod đang chạy, và giải thích được vì sao container của bạn bị khởi động lại.",
    practice: "Viết pod Kiada có init container chờ một service, thêm sidecar Envoy, rồi cố tình làm liveness probe trượt và đọc `kubectl describe pod` để thấy đúng lý do khởi động lại.",
    resources: [
      { label: "KIA 05 — Chạy ứng dụng với pod", href: "#/docs/k8sbook-05" },
      { label: "KIA 06 — Quản lý vòng đời của pod và sức khỏe của container", href: "#/docs/k8sbook-06" },
      { label: "Ôn lại: CKAD tuần 2", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Pod Lifecycle", href: "https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/" },
    ],
    items: [
      {
        id: "kb-w3-1",
        text: "Vì sao cần pod, và viết manifest pod đầu tiên",
        lesson: `**Mục tiêu.** Trả lời được "tại sao không chạy thẳng container mà phải bọc trong pod", và viết được YAML pod không cần chép mẫu.

**Đọc.** [§5.1 Tìm hiểu về pod](#/docs/k8sbook-05) — §5.1.2 (tổ chức container thành pod) là phần quan trọng nhất. Rồi [§5.2 Tạo pod từ file YAML hoặc JSON](#/docs/k8sbook-05), gõ lại manifest thay vì copy.

**Bẫy.** Nhét mọi thứ vào một pod cho tiện. Tiêu chí của sách: các container **chỉ nên ở chung pod khi chúng phải scale cùng nhau và phải nằm cùng một máy**. Web server và database ở chung pod nghĩa là bạn không thể scale riêng chúng — và đó là quyết định rất khó gỡ về sau.

**Tự kiểm tra.** Hai container trong cùng pod chia sẻ những gì và không chia sẻ những gì? Kể ít nhất một thứ chia sẻ và một thứ riêng.`,
      },
      {
        id: "kb-w3-2",
        text: "Sống chung với pod đang chạy: logs, exec, cp, port-forward, ephemeral container",
        lesson: `**Mục tiêu.** Chẩn đoán được một pod bằng công cụ có sẵn, kể cả khi image không có shell.

**Đọc.** [§5.3 Tương tác với ứng dụng và pod](#/docs/k8sbook-05) — làm hết §5.3.1 tới §5.3.6. §5.3.6 (ephemeral container) là mục ít người biết nhưng cứu bạn ở image distroless.

**Bẫy.** Bó tay khi \`kubectl exec\` báo không có \`/bin/sh\`. Image tối giản (distroless, scratch) cố tình không có shell — đó là lúc dùng \`kubectl debug\` với **ephemeral container** để gắn một container có đủ công cụ vào đúng pod đó. Bẫy nhỏ hơn: \`kubectl logs\` chỉ trả log của lần chạy hiện tại; container vừa restart thì phải thêm \`--previous\`.

**Tự kiểm tra.** Pod chạy nhưng không phục vụ request. Bạn dùng \`port-forward\` thế nào để tách bạch "ứng dụng hỏng" với "mạng/service hỏng"?`,
      },
      {
        id: "kb-w3-3",
        text: "Nhiều container trong một pod: sidecar và init container",
        lesson: `**Mục tiêu.** Chọn đúng giữa init container và sidecar cho một nhu cầu cụ thể, và biết native sidecar của Kubernetes khác sidecar "thủ công" ở đâu.

**Đọc.** [§5.4 Chạy nhiều container trong một pod](#/docs/k8sbook-05) rồi [§5.5 Chạy các container bổ sung khi pod khởi động](#/docs/k8sbook-05) — đọc kỹ §5.5.4 về native sidecar container.

**Bẫy.** Dùng init container cho việc phải chạy suốt vòng đời pod. **Init container chạy tuần tự và phải kết thúc** trước khi container chính khởi động; nếu nó không thoát, pod kẹt mãi ở \`Init:0/1\`. Việc chạy song song lâu dài (proxy, đẩy log, làm mới chứng chỉ) là việc của sidecar — và từ khi có native sidecar, đó là một init container khai \`restartPolicy: Always\`, không phải một container thường.

**Tự kiểm tra.** Ứng dụng cần một file chứng chỉ được tải về trước khi khởi động, và cần nó được làm mới mỗi giờ sau đó. Bạn dùng init container, sidecar, hay cả hai — và vì sao?`,
      },
      {
        id: "kb-w3-4",
        text: "Vì sao container bị khởi động lại: phase, probe, hook và tắt êm",
        lesson: `**Mục tiêu.** Đọc \`kubectl describe pod\` và nói đúng nguyên nhân restart; cấu hình được liveness/startup probe không giết nhầm ứng dụng khỏe mạnh.

**Đọc.** [§6.1 Tìm hiểu status của pod](#/docs/k8sbook-06) và [§6.2 Giữ cho các container khỏe mạnh](#/docs/k8sbook-06) — §6.2.6 (startup probe) và §6.2.7 (viết handler hiệu quả) là hai mục sinh lời nhất. Sau đó [§6.3 Thực thi các hành động khi container khởi động và tắt](#/docs/k8sbook-06) và [§6.4 Tìm hiểu vòng đời của pod](#/docs/k8sbook-06), riêng §6.4.3 (giai đoạn kết thúc) đọc kỹ.

**Bẫy.** Đặt liveness probe kiểm tra cả database phía sau. Khi database chậm, probe trượt, Kubernetes giết ứng dụng **đang hoàn toàn khỏe mạnh** — và bạn tự tạo ra một sự cố lan rộng. Liveness chỉ nên hỏi "tiến trình này còn tự phục vụ được không". Bẫy thứ hai: ứng dụng khởi động chậm bị liveness giết trong vòng lặp; lời giải là **startup probe**, không phải nới \`initialDelaySeconds\` lên vô tận.

**Tự kiểm tra.** Theo §6.4.3, từ lúc bạn gõ \`kubectl delete pod\` tới lúc container bị \`SIGKILL\`, những gì xảy ra theo thứ tự nào, và \`terminationGracePeriodSeconds\` cắt vào đâu?`,
      },
    ],
  },
  {
    id: "kb-w4",
    week: "Tuần 4",
    title: "Tổ chức cụm & cấu hình ứng dụng",
    goal: "Chia được cụm bằng namespace và label, và đưa được toàn bộ cấu hình ra khỏi image bằng ConfigMap, Secret và Downward API.",
    practice: "Tách Kiada thành hai namespace dev/prod, gắn label `app`/`rel`, lọc bằng label selector, rồi chuyển mọi biến môi trường hardcode sang ConfigMap và Secret.",
    resources: [
      { label: "KIA 07 — Tổ chức pod và các tài nguyên khác bằng namespace và label", href: "#/docs/k8sbook-07" },
      { label: "KIA 08 — Cấu hình ứng dụng với ConfigMap và Secret", href: "#/docs/k8sbook-08" },
      { label: "Ôn lại: CKAD tuần 4", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Recommended Labels", href: "https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/" },
    ],
    items: [
      {
        id: "kb-w4-1",
        text: "Namespace: chia cụm vật lý thành cụm ảo — và nó KHÔNG cô lập cái gì",
        lesson: `**Mục tiêu.** Dùng namespace đúng mục đích, và nói được nó cô lập cái gì, không cô lập cái gì.

**Đọc.** [§7.1 Tổ chức object vào các namespace](#/docs/k8sbook-07) — §7.1.4 (sự thiếu cô lập giữa các namespace) là mục phải đọc kỹ nhất; §7.1.5 nói về cái bẫy xoá namespace.

**Bẫy.** Tưởng namespace là ranh giới bảo mật. Namespace **chỉ chia không gian tên**; mặc định pod ở namespace này vẫn gọi thẳng được pod ở namespace kia qua mạng. Muốn có cô lập thật phải thêm NetworkPolicy và RBAC — đó là nội dung của giáo trình CKS. Bẫy thứ hai: \`kubectl delete namespace\` xoá **mọi thứ bên trong**, không hỏi lại, và không hoàn tác được.

**Tự kiểm tra.** Pod \`a\` ở namespace \`dev\` gọi service \`b\` ở namespace \`prod\`. Tên DNS đầy đủ là gì, và mặc định lời gọi đó có đi tới nơi không?`,
      },
      {
        id: "kb-w4-2",
        text: "Label, label selector, field selector và annotation",
        lesson: `**Mục tiêu.** Thiết kế bộ label dùng được lâu dài, lọc object bằng selector, và biết khi nào phải dùng annotation thay vì label.

**Đọc.** [§7.2 Tổ chức pod bằng label](#/docs/k8sbook-07) — chú ý §7.2.3 (quy tắc cú pháp) và §7.2.4 (khoá label tiêu chuẩn). Rồi [§7.3 Lọc object bằng label selector](#/docs/k8sbook-07), trong đó §7.3.2 cho thấy selector còn dùng để **lập lịch pod lên node cụ thể**. Cuối cùng [§7.4 Lọc object bằng field selector](#/docs/k8sbook-07) và [§7.5 Gắn annotation cho object](#/docs/k8sbook-07).

**Bẫy.** Nhét dữ liệu dài hoặc tuỳ ý vào label. Label có **giới hạn cú pháp chặt** (63 ký tự, tập ký tự hạn chế) và mọi label đều bị đánh chỉ mục để selector tìm; mô tả dài, URL, JSON, checksum thuộc về **annotation**. Bẫy thứ hai: đổi label của pod đang được ReplicaSet quản lý — pod lập tức "mồ côi" và controller tạo pod mới thế chỗ (chương 14 giải thích cơ chế).

**Tự kiểm tra.** Bạn muốn tất cả pod của một ứng dụng chỉ chạy trên node có SSD. Dùng label ở đâu, selector ở đâu, và trường nào trong pod spec?`,
      },
      {
        id: "kb-w4-3",
        text: "command, args, biến môi trường và ConfigMap",
        lesson: `**Mục tiêu.** Đưa mọi giá trị đổi theo môi trường ra khỏi image, và biết chính xác cái gì ghi đè cái gì.

**Đọc.** [§8.1 Thiết lập lệnh, đối số và biến môi trường](#/docs/k8sbook-08) — §8.1.1 giải thích quan hệ giữa \`ENTRYPOINT\`/\`CMD\` của Dockerfile với \`command\`/\`args\` của pod. Rồi [§8.2 Dùng ConfigMap để tách cấu hình khỏi pod manifest](#/docs/k8sbook-08), làm hết §8.2.1 tới §8.2.4.

**Bẫy.** Nhầm \`command\` với \`args\`. Trong pod spec, \`command\` ghi đè **ENTRYPOINT** còn \`args\` ghi đè **CMD** — đặt cả dòng lệnh vào \`command\` là cách phổ biến nhất để vô hiệu hoá entrypoint của image mà không nhận ra. Bẫy thứ hai: sửa ConfigMap rồi mong ứng dụng nhận giá trị mới. Biến môi trường lấy từ ConfigMap **chỉ được đọc lúc container khởi động** — không restart thì không đổi (§8.2.4).

**Tự kiểm tra.** Cùng một khoá được khai trong ConfigMap và trong \`env\` của container. Giá trị nào thắng, và làm sao bạn kiểm chứng?`,
      },
      {
        id: "kb-w4-4",
        text: "Secret và Downward API — dữ liệu nhạy cảm và metadata của chính pod",
        lesson: `**Mục tiêu.** Truyền được thông tin nhạy cảm cho container và nói thẳng được Secret bảo vệ tới đâu.

**Đọc.** [§8.3 Dùng Secret để truyền dữ liệu nhạy cảm cho container](#/docs/k8sbook-08) — §8.3.4 (tại sao Secret không phải lúc nào cũng an toàn) là mục quan trọng nhất chương. Rồi [§8.4 Công khai metadata cho container thông qua Downward API](#/docs/k8sbook-08).

**Bẫy.** Coi Secret là mã hoá. Nội dung Secret chỉ được **encode base64**, ai đọc được object là đọc được giá trị; mặc định nó cũng nằm dạng thô trong etcd. Bảo vệ thật đến từ RBAC, mã hoá at-rest cho etcd, và hạn chế ai mount được Secret nào — đúng những gì CKS dạy. Bẫy thứ hai: đưa Secret vào biến môi trường rồi ứng dụng in cả \`env\` ra log lúc khởi động.

**Tự kiểm tra.** Ứng dụng cần biết tên node nó đang chạy và giới hạn bộ nhớ của chính nó. Downward API cung cấp hai giá trị đó qua đường nào?`,
      },
    ],
  },
  {
    id: "kb-w5",
    week: "Tuần 5",
    title: "Lưu trữ — từ emptyDir tới PersistentVolume",
    goal: "Chọn đúng loại volume cho từng nhu cầu, và cấp phát được lưu trữ bền vững mà pod không cần biết công nghệ lưu trữ bên dưới.",
    practice: "Cho hai container chia sẻ một emptyDir, mount ConfigMap thành file cấu hình, rồi tạo PVC dùng StorageClass mặc định, ghi dữ liệu, xoá pod và kiểm chứng dữ liệu còn nguyên.",
    resources: [
      { label: "KIA 09 — Thêm volume cho lưu trữ, cấu hình và metadata", href: "#/docs/k8sbook-09" },
      { label: "KIA 10 — Lưu trữ dữ liệu bền vững với PersistentVolume", href: "#/docs/k8sbook-10" },
      { label: "Ôn lại: CKAD tuần 7", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Persistent Volumes", href: "https://kubernetes.io/docs/concepts/storage/persistent-volumes/" },
    ],
    items: [
      {
        id: "kb-w5-1",
        text: "Volume là gì, và emptyDir giải quyết hai bài toán khác nhau",
        lesson: `**Mục tiêu.** Nói được volume gắn vào pod hay vào container, và dùng emptyDir đúng cho cả "sống sót qua restart" lẫn "chia sẻ file giữa container".

**Đọc.** [§9.1 Giới thiệu về volume](#/docs/k8sbook-09) — §9.1.2 (volume nằm ở đâu trong pod) là hình quan trọng nhất chương. Rồi [§9.2 Sử dụng emptyDir volume](#/docs/k8sbook-09), làm cả §9.2.1, §9.2.2 và §9.2.3.

**Bẫy.** Tin rằng emptyDir là lưu trữ bền. Volume **thuộc về pod, không thuộc về container**: nó sống sót qua việc container khởi động lại, nhưng **biến mất cùng pod**. Pod bị xoá hay bị lập lịch sang node khác là mất sạch. Bẫy thứ hai: mount volume đè lên thư mục đang có sẵn file trong image — nội dung cũ bị che khuất, không phải hợp nhất.

**Tự kiểm tra.** Container A ghi file vào emptyDir, container B đọc. Nếu container A crash và được khởi động lại, B có mất dữ liệu không? Còn nếu cả pod bị lập lịch sang node khác?`,
      },
      {
        id: "kb-w5-2",
        text: "Volume cho cấu hình và metadata: configMap, secret, downwardAPI, projected — và hostPath",
        lesson: `**Mục tiêu.** Đưa ConfigMap/Secret vào container dưới dạng **file** thay vì biến môi trường, và biết vì sao đó thường là cách tốt hơn.

**Đọc.** [§9.5 ConfigMap, Secret, Downward API và projected volume](#/docs/k8sbook-09) — §9.5.2 (configMap volume hoạt động thế nào) giải thích cơ chế cập nhật; §9.5.4 về quyền file; §9.5.6 về projected volume. Đọc thêm [§9.3 Mount một container image dưới dạng volume](#/docs/k8sbook-09) và [§9.4 Truy cập file trên filesystem của worker node](#/docs/k8sbook-09).

**Bẫy.** Dùng hostPath cho dữ liệu ứng dụng. hostPath trỏ vào **đúng một node cụ thể**; pod lập lịch sang node khác là thấy thư mục rỗng, và nó mở toang một lỗ bảo mật. hostPath dành cho pod tác nhân node (chương 17), không dành cho ứng dụng. Bẫy thứ hai: mong file từ configMap volume cập nhật tức thì — nó có tự làm mới, nhưng **có độ trễ** và không làm mới nếu bạn mount bằng \`subPath\`.

**Tự kiểm tra.** Vì sao mount ConfigMap dưới dạng volume lại cho phép ứng dụng nhận cấu hình mới mà không cần restart, còn qua biến môi trường thì không?`,
      },
      {
        id: "kb-w5-3",
        text: "PVC, PV và StorageClass — cấp phát động",
        lesson: `**Mục tiêu.** Viết được PVC và giải thích được ai tạo ra PV, khi nào, dựa trên cái gì.

**Đọc.** [§10.1 Giới thiệu persistent storage trong Kubernetes](#/docs/k8sbook-10) rồi [§10.2 Cấp phát động một PersistentVolume](#/docs/k8sbook-10) — đọc kỹ §10.2.4 (access mode), §10.2.5 (StorageClass) và §10.2.6 (CSI driver).

**Bẫy.** Đọc \`ReadWriteMany\` như một tuỳ chọn tự do. Access mode được **provisioner quyết định**, không phải bạn: đa số block storage của cloud chỉ hỗ trợ \`ReadWriteOnce\`, và PVC xin \`ReadWriteMany\` sẽ nằm Pending mãi mà không báo lỗi rõ ràng. Bẫy thứ hai: PVC Pending vì cụm **không có StorageClass mặc định** — luôn kiểm tra \`kubectl get sc\` trước khi đi tìm nguyên nhân khác.

**Tự kiểm tra.** Bạn tạo PVC và một PV xuất hiện ngay sau đó. Ai đã tạo nó, và \`reclaimPolicy\` của StorageClass quyết định điều gì khi bạn xoá PVC?`,
      },
      {
        id: "kb-w5-4",
        text: "Cấp phát tĩnh, resize, snapshot và PV tạm thời",
        lesson: `**Mục tiêu.** Xử lý được lưu trữ có sẵn do quản trị viên cấp, và biết vòng đời một PV đi qua những trạng thái nào.

**Đọc.** [§10.3 Cấp phát tĩnh một PersistentVolume](#/docs/k8sbook-10) — §10.3.3 (giải phóng và tái sử dụng PV thủ công) là mục hay bị bỏ qua. Rồi [§10.4 Quản lý PersistentVolume](#/docs/k8sbook-10) (resize, snapshot, khôi phục) và [§10.5 Tạo PersistentVolume tạm thời cho từng pod riêng lẻ](#/docs/k8sbook-10).

**Bẫy.** Xoá PVC rồi tạo lại PVC giống hệt và mong nó nối lại vào PV cũ. PV được giải phóng chuyển sang trạng thái **Released, không phải Available**: dữ liệu còn đó nhưng không PVC nào claim được nó cho tới khi quản trị viên can thiệp (§10.3.3). Đây là cách kinh điển để "mất" dữ liệu mà thực ra dữ liệu vẫn nằm nguyên trên đĩa.

**Tự kiểm tra.** Khi nào bạn chọn ephemeral volume (§10.5) thay vì PVC thông thường, và nó khác emptyDir ở điểm nào?`,
      },
    ],
  },
];
