// Lộ trình đọc Kubernetes in Action — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes in Action", ấn bản 2 (MEAP V15) —
// Marko Lukša, Manning. Thư mục nguồn: k8s-ebook/
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (kb-w<N> / kb-w<N>-<M>) — tiến độ localStorage lưu theo id này.
//
// Một số mục trong bản dịch còn giữ nguyên tiêu đề tiếng Anh (§9.2.5, §9.2.6,
// §9.3, §9.4). Ở những chỗ đó, nhãn liên kết trích đúng tiêu đề sách thật sự
// có, và phần diễn giải tiếng Việt nằm trong câu văn — không bịa tiêu đề.

export const k8sbookWeeksPart2 = [
  {
    id: "kb-w6",
    week: "Tuần 6",
    title: "Cấu hình & tổ chức đối tượng",
    goal: "Tách được toàn bộ cấu hình ra khỏi image, và tổ chức đối tượng trong cụm bằng namespace và label thay vì bằng quy ước đặt tên.",
    practice: "Chuyển toàn bộ biến môi trường hard-code của Kiada sang ConfigMap và Secret, rồi gắn nhãn `app`/`rel` cho pod và thử lọc bằng `kubectl get pod -l`.",
    resources: [
      { label: "KIA 09 — ConfigMap, Secret, Downward API", href: "#/docs/k8sbook-09" },
      { label: "KIA 10 — Namespace và Label", href: "#/docs/k8sbook-10" },
      { label: "Tra cứu nhanh: CKAD Cheat Sheet", href: "#/docs/cheat-sheet" },
    ],
    items: [
      {
        id: "kb-w6-1",
        text: "command, args, biến môi trường và ConfigMap",
        lesson: `**Mục tiêu.** Đổi được cấu hình của một container mà không build lại image, rồi đưa cấu hình đó ra khỏi pod manifest để một manifest chạy được ở mọi môi trường.

**Đọc.** [§9.1 Thiết lập command, argument và biến môi trường](#/docs/k8sbook-09) — chú ý Bảng 9.1 ánh xạ \`ENTRYPOINT\`/\`CMD\` sang \`command\`/\`args\`. Rồi [§9.2 Sử dụng config map để tách biệt cấu hình khỏi pod](#/docs/k8sbook-09); hai mục cuối của nó bản dịch còn giữ tiêu đề tiếng Anh — §9.2.5 "Updating and deleting config maps" và §9.2.6 "Understanding how configMap volumes work" — đừng bỏ qua.

**Bẫy.** Tưởng \`$(VAR_NAME)\` phân giải được mọi biến. Cú pháp này **chỉ tham chiếu được biến khai trong cùng manifest, và phải khai trước** — nên \`$(NODE_VERSION)\` vốn đến từ image sẽ nằm nguyên trong chuỗi kết quả. Bẫy thứ hai ở §9.2.5: sửa config map thì **tệp trong volume \`configMap\` tự cập nhật** (có thể mất tới một phút), còn **biến môi trường thì không** — chúng chỉ đổi khi container khởi động lại. Mount bằng \`subPath\` là mất luôn cơ chế tự cập nhật đó.

**Tự kiểm tra.** Theo §9.1.2, vì sao tham chiếu \`$(NODE_VERSION)\` không được phân giải, và bạn viết thế nào nếu muốn giữ nguyên chuỗi ký tự \`$(VAR_NAME)\` trong giá trị biến?`,
      },
      {
        id: "kb-w6-2",
        text: "Secret, Downward API và projected volume",
        lesson: `**Mục tiêu.** Đặt dữ liệu nhạy cảm vào đúng loại đối tượng, và lấy được thông tin của chính pod mà không phải chép tay vào manifest.

**Đọc.** [§9.3 Using Secrets to pass sensitive data to containers](#/docs/k8sbook-09) và [§9.4 Passing pod metadata to the application via the Downward API](#/docs/k8sbook-09) — bản dịch giữ nguyên tiêu đề tiếng Anh của hai mục này; chúng nói về Secret và Downward API. Bảng 9.3 và Bảng 9.5 cần thuộc. Rồi [§9.5 Sử dụng volume tích hợp để gộp nhiều volume làm một](#/docs/k8sbook-09).

**Bẫy.** Nghĩ trường \`data\` của Secret cũng là văn bản thuần như \`data\` của ConfigMap. Bảng 9.3 cho thấy hai tên trường **bắt chéo nhau**: \`data\` của Secret ứng với \`binaryData\` của ConfigMap và chứa giá trị **mã hoá Base64**, còn \`stringData\` mới là văn bản thuần — và nó **chỉ ghi**, đọc lại đối tượng thì nội dung đã nằm ở \`data\`. Bẫy thứ hai, có khuyến nghị riêng ở §9.3.3: đừng truyền Secret qua biến môi trường, vì ứng dụng hay in hết biến môi trường ra log và tiến trình con kế thừa toàn bộ chúng.

**Tự kiểm tra.** Theo Bảng 9.5, những trường nào chỉ truyền được qua biến môi trường mà không dùng được trong volume \`downwardAPI\`, và trường nào thì ngược lại?`,
      },
      {
        id: "kb-w6-3",
        text: "Namespace, label, label selector và annotation",
        lesson: `**Mục tiêu.** Biết namespace bảo vệ bạn khỏi cái gì và **không** bảo vệ khỏi cái gì, rồi tổ chức hàng trăm pod bằng nhãn thay vì bằng cách đặt tên dài dòng.

**Đọc.** [§10.1 Tổ chức các đối tượng vào các Namespace](#/docs/k8sbook-10) — §10.1.4 là mục quan trọng nhất của cả phần này. Rồi [§10.2 Tổ chức các pod bằng label](#/docs/k8sbook-10) với §10.2.3 về quy tắc cú pháp, [§10.3 Lọc các đối tượng bằng bộ chọn nhãn (label selector)](#/docs/k8sbook-10) và [§10.4 Chú thích đối tượng (annotation)](#/docs/k8sbook-10).

**Bẫy.** Coi namespace là ranh giới cách ly. §10.1.4 nói thẳng: các node vẫn dùng chung, pod ở hai namespace khác nhau vẫn có thể nằm trên cùng một node và **chung kernel**; mặc định cũng **không có cách ly mạng** giữa các namespace. Kết luận của tác giả: đừng dùng namespace để chia production/staging/development trên một cụm vật lý. Bẫy thứ hai: nhét dữ liệu dài vào nhãn — giá trị nhãn tối đa **63 ký tự** và không được chứa khoảng trắng.

**Tự kiểm tra.** Bạn muốn đính kèm mô tả một đoạn văn và mã băm commit Git vào pod. Theo §10.2.3 và §10.4.1, hai giới hạn nào của nhãn buộc bạn chuyển sang annotation?`,
      },
    ],
  },
  {
    id: "kb-w7",
    week: "Tuần 7",
    title: "Mạng — Service và Ingress",
    goal: "Cho một pod gọi được pod khác qua một địa chỉ không bao giờ đổi, chọn đúng cách phơi ứng dụng ra ngoài theo hạ tầng đang có, và kiểm soát được thời điểm một pod bắt đầu nhận lưu lượng.",
    practice: "Tạo Service ClusterIP cho quote và quiz rồi gọi chúng bằng `kubectl exec ... curl`; đổi Service của kiada sang NodePort; chạy `kubectl run -it --rm dns-test --image=giantswarm/tiny-tools` và `nslookup` tên Service; gộp hai Ingress thành một đối tượng nhiều quy tắc; cuối cùng thêm readiness probe trỏ vào `/quote` rồi xoá tệp `quote` trong pod để xem nó rời khỏi danh sách endpoint.",
    resources: [
      { label: "KIA 11 — Cung cấp quyền truy cập Pod qua Service", href: "#/docs/k8sbook-11" },
      { label: "KIA 12 — Công khai dịch vụ ra ngoài bằng Ingress", href: "#/docs/k8sbook-12" },
      { label: "Ôn lại: CKAD tuần 6 — Services & Networking", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Service", href: "https://kubernetes.io/docs/concepts/services-networking/service/" },
    ],
    items: [
      {
        id: "kb-w7-1",
        text: "Service tìm pod thế nào, và ba cách phơi ra ngoài",
        lesson: `**Mục tiêu.** Viết được manifest Service từ đầu, và chọn đúng loại Service cho cụm bạn đang có thay vì chép loại đầu tiên gặp trên mạng.

**Đọc.** [§11.1 Cung cấp quyền truy cập Pod qua Service](#/docs/k8sbook-11) — ba lý do ở đầu mục giải thích vì sao không nối thẳng vào IP pod được. Rồi [§11.2 Cung cấp quyền truy cập Service từ bên ngoài](#/docs/k8sbook-11): mục này mở đầu bằng **bốn** lựa chọn, trong đó \`externalIPs\`, \`NodePort\` và \`LoadBalancer\` nằm ngay trong đối tượng Service, còn Ingress để dành cho chương 12.

**Bẫy.** Chạy \`kubectl port-forward svc/my-service\` rồi tin rằng mình đang thử Service. Sách ghi rõ lệnh này **không kết nối tới chính Service** — nó chỉ mượn Service để tìm một pod phù hợp rồi nối thẳng vào pod đó. Muốn thử thật thì \`kubectl exec\` một \`curl\` từ bên trong pod khác. Bẫy thứ hai ở §11.2.3: đặt \`externalTrafficPolicy: Local\` để giữ được IP nguồn thật, nhưng node nào không có pod cục bộ thì kết nối **bị treo**, và tải chia không đều giữa các pod.

**Tự kiểm tra.** Theo §11.2.3, chính sách \`Local\` giải quyết hai vấn đề nào của chính sách \`Cluster\`, và đổi lại nó tạo ra hai vấn đề mới nào?`,
      },
      {
        id: "kb-w7-2",
        text: "Endpoints và bản ghi DNS của Service",
        lesson: `**Mục tiêu.** Nhìn một Service không hoạt động và biết ngay phải mở đối tượng nào tiếp theo, đồng thời gọi được dịch vụ bằng tên DNS thay vì bằng IP.

**Đọc.** [§11.3 Quản lý các Endpoint của Service](#/docs/k8sbook-11) — §11.3.1 (Endpoints), §11.3.2 (EndpointSlice), §11.3.3 (tự quản lý endpoint cho dịch vụ ngoài cụm). Rồi [§11.4 Tìm hiểu các bản ghi DNS dành cho đối tượng Service](#/docs/k8sbook-11) trọn vẹn: bản ghi \`A\` và \`SRV\`, headless service, và bí danh \`CNAME\` qua Service kiểu \`ExternalName\`.

**Bẫy.** Đi tìm danh sách pod bên trong YAML của Service. Ngoài bộ chọn nhãn, **\`spec\` và \`status\` của Service không chứa danh sách đó** — nó nằm trong một đối tượng **Endpoints trùng tên với Service**. Chi tiết dễ vấp: loại đối tượng là \`Endpoints\` ở dạng số nhiều, gõ \`kubectl get endpoint\` sẽ báo lỗi. Bẫy thứ hai: EndpointSlice **không** trùng tên Service mà có thêm hậu tố ngẫu nhiên, và mặc định mỗi slice chỉ chứa tối đa 100 endpoint nên một Service có thể đi kèm nhiều slice.

**Tự kiểm tra.** Theo §11.3.3, khi bạn tạo Service không khai bộ chọn nhãn thì đối tượng nào bạn buộc phải tự tạo bằng tay, và đối tượng nào Kubernetes vẫn tự sinh giúp bạn?`,
      },
      {
        id: "kb-w7-3",
        text: "Định tuyến tới endpoint ở gần và điều kiện pod được nhận lưu lượng",
        lesson: `**Mục tiêu.** Ép được lưu lượng ở lại trong node khi ngữ nghĩa dịch vụ đòi hỏi, và viết readiness probe phản ánh đúng khả năng phục vụ của ứng dụng.

**Đọc.** [§11.5 Cấu hình service để định tuyến lưu lượng đến các endpoint ở gần](#/docs/k8sbook-11) — §11.5.1 về \`internalTrafficPolicy\`; §11.5.2 chỉ cần đọc hiểu nguyên lý, vì sách nói rõ topology-aware hints còn ở mức alpha nên không hướng dẫn thực hành. Rồi [§11.6 Quản lý việc đưa pod vào danh sách endpoint của service](#/docs/k8sbook-11) trọn vẹn, nhất là §11.6.3.

**Bẫy.** Lẫn \`internalTrafficPolicy\` với \`externalTrafficPolicy\` ở mục trước. Chúng cùng nhận giá trị \`Local\` nhưng một cái áp cho lưu lượng **từ ngoài cụm đi vào**, cái kia áp cho lưu lượng **giữa các pod trong cụm**. Bẫy thứ hai, khác biệt cốt lõi với chương 6: container trượt readiness probe **không bị khởi động lại** — nó chỉ bị gỡ khỏi danh sách endpoint, dù nhãn vẫn khớp bộ chọn. Và §11.6.3 cảnh báo: không khai readiness probe thì pod thành endpoint **ngay khi vừa được tạo**.

**Tự kiểm tra.** Theo §11.6.1, readiness probe có một thuộc tính cấu hình mà liveness probe không có — đó là thuộc tính nào và nó quy định điều gì?`,
      },
      {
        id: "kb-w7-4",
        text: "Ingress, định tuyến theo host/path và cấu hình TLS",
        lesson: `**Mục tiêu.** Phơi nhiều dịch vụ qua một địa chỉ IP công khai duy nhất, và biết phần nào của cấu hình HTTPS là chuẩn Kubernetes còn phần nào phụ thuộc vào bộ điều khiển bạn chọn.

**Đọc.** [§12.1 Giới thiệu về Ingress](#/docs/k8sbook-12) — ba thành phần cấu thành Ingress ở đầu mục là thứ cần thuộc; §12.1.3 hướng dẫn cài Nginx Ingress Controller nếu cụm chưa có. Rồi [§12.2 Tạo và sử dụng các đối tượng Ingress](#/docs/k8sbook-12), đọc kỹ Bảng 12.1–12.3 về \`pathType\`. Cuối cùng [§12.3 Cấu hình TLS cho Ingress](#/docs/k8sbook-12).

**Bẫy.** Hiểu \`pathType: Prefix\` như phép so khớp chuỗi đơn thuần. Bảng 12.3 cho thấy đường dẫn được **cắt theo từng thành phần phân tách bởi dấu \`/\`** rồi mới so: quy tắc \`/foo\` khớp \`/foo/bar\` nhưng **không** khớp \`/foobar\`. Bẫy thứ hai: coi TLS passthrough là tính năng chuẩn. Sách nói thẳng Kubernetes **không có phương thức chuẩn hoá nào** để khai passthrough trong đối tượng Ingress — với Nginx Ingress Controller phải thêm annotation riêng và chạy controller kèm cờ \`--enable-ssl-passthrough\`.

**Tự kiểm tra.** Theo §12.1.2, khi proxy nhận một yêu cầu HTTP, nó chuyển tiếp tới IP của Service hay tới IP của pod, và điều đó nói gì về vai trò của Service trong luồng Ingress?`,
      },
    ],
  },
  {
    id: "kb-w8",
    week: "Tuần 8",
    title: "Nhân bản & cập nhật không gián đoạn",
    goal: "Giải thích được vòng lặp điều hoà của một bộ điều khiển bằng lời của mình, và chạy một đợt cập nhật ứng dụng mà Service không lúc nào thiếu pod để chuyển tiếp lưu lượng.",
    practice: "Tạo ReplicaSet `kiada` ba bản sao, xoá tay một pod rồi đổi nhãn `rel` của một pod khác thành `debug` để xem bộ điều khiển phản ứng ra sao. Sau đó chuyển sang Deployment, cập nhật image từ 0.5 lên 0.6 với `maxSurge: 0` và `maxUnavailable: 1`, tạm dừng giữa chừng bằng `kubectl rollout pause` để hai phiên bản chạy song song, rồi quay lui bằng `kubectl rollout undo`.",
    resources: [
      { label: "KIA 13 — Nhân bản Pod bằng ReplicaSet", href: "#/docs/k8sbook-13" },
      { label: "KIA 14 — Quản lý Pod bằng Deployment", href: "#/docs/k8sbook-14" },
      { label: "Ôn lại: CKAD tuần 3 — Workloads", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Deployments", href: "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/" },
    ],
    items: [
      {
        id: "kb-w8-1",
        text: "ReplicaSet giữ đúng số bản sao — và nguyên lý bộ điều khiển",
        lesson: `**Mục tiêu.** Mô tả được vòng lặp điều hoà mà **mọi** bộ điều khiển Kubernetes đều chạy, và chỉ ra chính xác giới hạn của ReplicaSet — thứ khiến chương sau phải tồn tại.

**Đọc.** [§13.1 Giới thiệu về ReplicaSet](#/docs/k8sbook-13), chú ý §13.1.3 về \`ownerReferences\` và bộ thu gom rác. Rồi [§13.2 Cập nhật một ReplicaSet](#/docs/k8sbook-13) — đọc §13.2.2 thật chậm. [§13.3 Tìm hiểu nguyên lý hoạt động của bộ điều khiển ReplicaSet](#/docs/k8sbook-13) là trái tim của chương. Cuối cùng [§13.4 Xóa một ReplicaSet](#/docs/k8sbook-13).

**Bẫy.** Sửa mẫu Pod của ReplicaSet rồi chờ các pod đang chạy đổi theo. Thí nghiệm ở §13.2.2 cho kết quả ngược lại: pod cũ **giữ nguyên nhãn cũ**, chỉ pod tạo sau đó mới mang nhãn mới — sách ví mẫu Pod như chiếc khuôn cắt bánh quy, đổi khuôn không đổi những chiếc bánh đã cắt. Đó đúng là lý do bạn cần Deployment. Bẫy thứ hai: bộ chọn nhãn của ReplicaSet là **bất biến**; muốn đổi thì phải xoá đối tượng, và nếu không muốn mất pod thì xoá kèm \`--cascade=orphan\`.

**Tự kiểm tra.** Theo §13.3.3, bạn đổi nhãn \`rel\` của một pod hỏng thành \`debug\`. Bộ điều khiển làm gì ngay sau đó, và trường nào trong \`metadata\` của chính pod đó thay đổi theo?`,
      },
      {
        id: "kb-w8-2",
        text: "Deployment, rollout, quay lui và các chiến lược cập nhật",
        lesson: `**Mục tiêu.** Cấu hình được một đợt rollout đủ chậm để phát hiện phiên bản lỗi trước khi nó lan ra toàn bộ bản sao, và quay lui trong vài giây khi cần.

**Đọc.** [§14.1 Giới thiệu về Deployment](#/docs/k8sbook-14) để thấy chuỗi Deployment → ReplicaSet → Pod. Trọng tâm là [§14.2 Cập nhật một Deployment](#/docs/k8sbook-14): Bảng 14.2 (hai chiến lược), §14.2.3 (\`maxSurge\`/\`maxUnavailable\`), §14.2.4 (tạm dừng), §14.2.5 (\`minReadySeconds\`), §14.2.6 (quay lui). [§14.3 Triển khai các chiến lược deployment khác](#/docs/k8sbook-14) chỉ cần đọc để biết Kubernetes hỗ trợ tới đâu.

**Bẫy.** Đánh đồng "sẵn sàng" (ready) với "khả dụng" (available). Một pod chỉ khả dụng sau khi đã giữ trạng thái sẵn sàng đủ \`minReadySeconds\`, và rollout chờ mốc khả dụng — nhưng sách có lưu ý dễ bỏ sót: pod **đã sẵn sàng mà chưa khả dụng vẫn nằm trong Service và vẫn nhận yêu cầu của client**. Bẫy thứ hai ở §14.2.6: khi Deployment đang bị tạm dừng, \`kubectl rollout undo\` **không có tác dụng gì** cho tới khi bạn \`rollout resume\`.

**Tự kiểm tra.** Theo §14.2.5, bạn đặt \`minReadySeconds: 60\` và một pod phiên bản mới vừa sẵn sàng được 20 giây. Service đã chuyển lưu lượng tới nó chưa, và bộ điều khiển Deployment lúc đó đang làm gì?`,
      },
    ],
  },
  {
    id: "kb-w9",
    week: "Tuần 9",
    title: "Workload chuyên biệt — StatefulSet, DaemonSet, Job",
    goal: "Chọn đúng loại đối tượng cho những workload không phải web phi trạng thái, và đọc được manifest của các pod hệ thống trong namespace kube-system mà không thấy chỗ nào lạ.",
    practice: "Chuyển dịch vụ Quiz từ Deployment sang StatefulSet ba bản sao kèm headless Service, xoá pod `quiz-1` rồi kiểm chứng tên và PVC của pod thay thế. Sau đó mở `kubectl -n kube-system get ds kube-proxy -o yaml` và tự tìm `privileged`, `hostNetwork`, `priorityClassName`. Cuối cùng chạy một Job với `completions: 5` và `parallelism: 2`, quan sát thứ tự pod bằng `kubectl get pods -w`.",
    resources: [
      { label: "KIA 15 — Triển khai workload có trạng thái bằng StatefulSet", href: "#/docs/k8sbook-15" },
      { label: "KIA 16 — Tác nhân node và daemon bằng DaemonSet", href: "#/docs/k8sbook-16" },
      { label: "KIA 17 — Khối công việc hữu hạn bằng Job và CronJob", href: "#/docs/k8sbook-17" },
      { label: "kubernetes.io — StatefulSets", href: "https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/" },
    ],
    items: [
      {
        id: "kb-w9-1",
        text: "StatefulSet: danh tính ổn định và volume riêng từng bản sao",
        lesson: `**Mục tiêu.** Nói được vì sao một Deployment gắn PersistentVolumeClaim không scale lên nhiều bản sao được, và triển khai được cụm cơ sở dữ liệu ba nút chỉ bằng một StatefulSet cộng một headless Service.

**Đọc.** [§15.1 Giới thiệu về StatefulSet](#/docs/k8sbook-15) — §15.1.1 (thí nghiệm scale Deployment \`quiz\` lên 3), §15.1.2 (so với Deployment), §15.1.5 (vai trò headless Service). Rồi [§15.2 Tìm hiểu hành vi của StatefulSet](#/docs/k8sbook-15), nhất là §15.2.1 và §15.2.4. [§15.3 Cập nhật một StatefulSet](#/docs/k8sbook-15) đọc §15.3.1–§15.3.2; [§15.4 Quản lý ứng dụng có trạng thái bằng Kubernetes Operator](#/docs/k8sbook-15) chỉ cần lướt.

**Bẫy.** Nghĩ scale Deployment lên ba là có ba bản sao cơ sở dữ liệu. Cả ba pod dùng chung **một** PersistentVolumeClaim nên chung luôn một thư mục dữ liệu; MongoDB trong thí nghiệm của sách dừng ngay với lỗi \`DBPathInUse\`. Bẫy thứ hai: cho rằng thu nhỏ StatefulSet là dọn sạch. Mặc định PersistentVolumeClaim **được giữ lại**; muốn xoá tự động phải khai \`persistentVolumeClaimRetentionPolicy\`, mà đây vẫn là tính năng alpha cần bật feature gate khi tạo cụm.

**Tự kiểm tra.** Theo §15.2.1, bạn xoá pod \`quiz-1\`. Pod thay thế mang tên gì, gắn PersistentVolumeClaim nào, và vì sao client dùng hostname không nhận ra pod đã bị thay?`,
      },
      {
        id: "kb-w9-2",
        text: "DaemonSet: một pod mỗi node và các đặc quyền đi kèm",
        lesson: `**Mục tiêu.** Triển khai được một tác nhân chạy trên đúng tập node bạn chọn, và cấp cho nó lượng đặc quyền tối thiểu thay vì bật \`privileged\` cho xong việc.

**Đọc.** [§16.1 Giới thiệu về DaemonSet](#/docs/k8sbook-16) — §16.1.1 (vòng lặp điều hoà), §16.1.3 (bộ chọn node), §16.1.4 (Bảng 16.2, hai chiến lược cập nhật). Rồi [§16.2 Các tính năng đặc biệt trong các Pod chạy tác nhân node và daemon](#/docs/k8sbook-16), đọc kèm manifest thật của \`kube-proxy\` và \`kindnet\`. Cuối cùng [§16.3 Giao tiếp với daemon Pod cục bộ](#/docs/k8sbook-16).

**Bẫy.** Lẫn bộ chọn node với bộ chọn pod. §16.1.3 nhắc riêng: DaemonSet dùng **bộ chọn node để lọc node đủ điều kiện**, còn **bộ chọn pod để nhận diện pod nào thuộc về nó**. Bẫy thứ hai: bật \`privileged: true\` chỉ vì thấy \`kube-proxy\` làm vậy — container đặc quyền **bỏ qua mọi bước kiểm tra quyền của kernel**, trong khi \`kindnet\` cho thấy cách đúng hơn là liệt kê capability tối thiểu. Bẫy thứ ba: pod của DaemonSet **không** mặc nhiên quan trọng hơn pod của Deployment; muốn vậy phải tự đặt \`priorityClassName\`.

**Tự kiểm tra.** Theo §16.2.3, đặt \`hostNetwork: true\` khiến pod mất đi thứ gì so với pod thường, và những loại namespace nào nó vẫn giữ riêng nếu bạn không khai thêm gì?`,
      },
      {
        id: "kb-w9-3",
        text: "Job chạy tới khi xong, CronJob chạy theo lịch",
        lesson: `**Mục tiêu.** Chạy được một tác vụ hữu hạn mà không phải ngồi canh, và cấu hình lịch định kỳ không tự dẫm lên chân mình khi một lượt chạy quá lâu.

**Đọc.** [§17.1 Chạy các tác vụ bằng tài nguyên Job](#/docs/k8sbook-17) — §17.1.1 (vì sao không dùng pod trần), §17.1.2 (Bảng 17.1 về \`completions\` và \`parallelism\`), §17.1.3 (xử lý lỗi). §17.1.4–§17.1.6 có thể để sau. Rồi [§17.2 Lập lịch cho Job bằng CronJob](#/docs/k8sbook-17): định dạng crontab, \`startingDeadlineSeconds\` và Bảng 17.5 về \`concurrencyPolicy\`.

**Bẫy.** Đặt \`restartPolicy\` cho có. Trong Job, chính trường này quyết định lỗi được xử lý ở **cấp nào**: với \`OnFailure\`, Kubelet khởi động lại container ngay trong pod cũ trên cùng node; với \`Never\`, cả pod bị đánh dấu thất bại và bộ điều khiển Job tạo pod mới, có thể trên node khác. Bẫy thứ hai: mặc định \`concurrencyPolicy\` là \`Allow\`, nên một lượt chạy dài hơn chu kỳ lịch sẽ bị lượt sau chồng lên. Bẫy thứ ba: \`ttlSecondsAfterFinished\` xoá Job **kể cả khi nó thất bại** — log biến mất trước khi bạn kịp đọc.

**Tự kiểm tra.** Theo §17.1.2, nếu bạn chỉ khai \`parallelism\` mà bỏ trống \`completions\` thì Job được coi là hoàn tất khi nào, và điều gì xảy ra nếu \`parallelism\` lớn hơn \`completions\`?`,
      },
    ],
  },
];
