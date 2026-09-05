// Lộ trình đọc Kubernetes: Up and Running (ấn bản 3) — Phần 1 (Tuần 1–5).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes: Up and Running", ấn bản 3 — Brendan
// Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson (O'Reilly).
// Thư mục nguồn: kuar-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// GIỮ NGUYÊN id (ku-w<N> / ku-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là ku-, KHÔNG phải kb- (đã thuộc track Kubernetes in Action).
//
// Tuần 2 đọc Phụ lục NGAY SAU chương 3 chứ không để cuối sách: cùng chủ đề
// dựng cluster, và đọc nó ở tuần 9 thì đã muộn để dùng.

export const kuarWeeksPart1 = [
  {
    id: "ku-w1",
    week: "Tuần 1",
    title: "Vì sao Kubernetes, và container đến từ đâu",
    goal: "Nói được bốn lợi ích mà sách dùng để biện minh cho Kubernetes, và tự đóng gói được một ứng dụng thành image chạy được.",
    practice: `Viết Dockerfile cho ứng dụng \`kuard\` theo §"Xây dựng Application Image với Docker", đẩy lên một registry công khai, rồi \`docker run\` lại từ registry đó trên máy sạch (hoặc sau khi \`docker image rm\`).`,
    resources: [
      { label: "KUAR 01 — Giới thiệu", href: "#/docs/kuar-01" },
      { label: "KUAR 02 — Tạo và chạy Container", href: "#/docs/kuar-02" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
      { label: "docs.docker.com — Get started", href: "https://docs.docker.com/get-started/" },
    ],
    items: [
      {
        id: "ku-w1-1",
        text: "Tốc độ, tính bất biến và cấu hình khai báo",
        lesson: `**Mục tiêu.** Nói được vì sao sách định nghĩa "tốc độ" không phải là số tính năng phát hành mỗi giờ, mà là khả năng phát hành liên tục trong khi vẫn giữ dịch vụ sẵn sàng cao, và phân biệt được hạ tầng bất biến với hạ tầng khả biến bằng chính ví dụ sách dùng.

**Đọc.** Ch.1, mục [Tốc độ (Velocity)](#/docs/kuar-01) — đọc trọn mục này, gồm cả hai mục con "Giá trị của tính bất biến" và "Cấu hình khai báo".

**Bẫy.** Nghĩ "tốc độ" nghĩa là release càng nhiều tính năng càng nhanh càng tốt. Sách nói ngược lại: tốc độ được đo bằng số thứ bạn phát hành được trong khi vẫn duy trì một dịch vụ có tính sẵn sàng cao — một service sập sau mỗi lần deploy không hề "nhanh" theo định nghĩa này, dù đội ngũ push code liên tục. Bẫy thứ hai nằm ở khái niệm bất biến: hạ tầng bất biến không có nghĩa "không ai được đổi gì", mà nghĩa là mọi thay đổi tạo ra một artifact hoàn toàn mới thay vì vá đè lên artifact cũ. Một khi bạn đăng nhập vào container và "sao chép file nhị phân mới lên trên file nhị phân hiện có", image cũ không còn tồn tại để quay lại — rollback gần như bất khả thi.

**Tự kiểm tra.** Sách dùng đúng một lệnh làm ví dụ điển hình cho việc cập nhật một hệ thống khả biến (mutable infrastructure) — lệnh đó là gì, và cách nó áp dụng bản cập nhật (tuần tự ghi đè các file nhị phân cũ) khiến việc rollback trở nên gần như bất khả thi ra sao so với cách bất biến (build image mới, giữ image cũ)?`,
      },
      {
        id: "ku-w1-2",
        text: "Mở rộng đội ngũ, trừu tượng hoá hạ tầng, hiệu quả",
        lesson: `**Mục tiêu.** Giải thích được bằng lời của mình vì sao tách rời (decoupling) qua API giúp một đội nhỏ vận hành cluster phục vụ được hàng trăm đội ứng dụng, và chỉ ra được tính năng cụ thể nào của Kubernetes cho phép nhiều nhà phát triển chia sẻ an toàn một cluster kiểm thử duy nhất.

**Đọc.** Ch.1, các mục [Mở rộng dịch vụ và đội ngũ của bạn](#/docs/kuar-01), [Trừu tượng hóa hạ tầng](#/docs/kuar-01), [Hiệu quả](#/docs/kuar-01) và [Hệ sinh thái cloud native](#/docs/kuar-01).

**Bẫy.** Nghĩ "trừu tượng hoá hạ tầng" nghĩa là bạn không cần quan tâm đang chạy trên cloud nào nữa, chỉ cần dùng API Kubernetes là xong. Sách nói rõ điều kiện đi kèm: để giữ được tính di động thực sự, bạn phải tránh các dịch vụ managed đặc thù cho từng cloud (DynamoDB của Amazon, Cosmos DB của Azure, Cloud Spanner của Google) và tự triển khai các giải pháp mã nguồn mở tương đương (Cassandra, MySQL, MongoDB) — nếu không, ứng dụng của bạn vẫn khoá chặt vào một cloud cụ thể dù nó chạy trên Kubernetes.

**Tự kiểm tra.** Theo mục "Hiệu quả", Kubernetes dùng đúng tính năng nào — cũng chính là trường bạn sẽ đặt trong \`metadata\` của mọi đối tượng ở các chương sau — để nhiều nhà phát triển cùng dùng chung một cluster kiểm thử duy nhất thay vì mỗi người một cluster ba máy riêng, và vì sao cách gom đó làm giảm tổng số máy cần mua?`,
      },
      {
        id: "ku-w1-3",
        text: "Container image và cách Docker dựng nó theo lớp",
        lesson: `**Mục tiêu.** Giải thích được container image là một chuỗi các lớp filesystem chồng lên nhau chứ không phải một file đơn lẻ, và tự viết được một Dockerfile tối giản (\`FROM\`/\`WORKDIR\`/\`COPY\`/\`RUN\`/\`CMD\`) build ra image chạy được bằng \`docker build -t simple-node .\`.

**Đọc.** Ch.2, các mục [Container Image](#/docs/kuar-02) và [Xây dựng Application Image với Docker](#/docs/kuar-02) — làm theo từng lệnh trong ví dụ Node.js/Express, đừng chỉ đọc lướt. Khung "Phân lớp container" giải thích cơ chế mỗi lớp kế thừa và sửa đổi lớp trước bằng ví dụ ba container A/B/C rẽ nhánh từ một OS cơ sở chung.

**Bẫy.** Nghĩ image chỉ là "một file zip lớn". Image thực ra là một chuỗi lớp filesystem, mỗi lớp thêm/xoá/sửa file so với lớp trước, và đây là lý do thứ tự các chỉ thị trong Dockerfile quan trọng. Ví dụ mẫu cố tình \`COPY package*.json ./\` rồi \`RUN npm install\` TRƯỚC khi \`COPY . .\` copy toàn bộ mã nguồn — không phải ngẫu nhiên. Nếu đảo ngược thứ tự (copy mã nguồn trước, cài dependency sau), mỗi lần bạn sửa một dòng trong \`server.js\`, lớp cài đặt \`node\` nằm phía sau nó cũng bị coi là thay đổi và phải build/push/pull lại toàn bộ — dù dependency chẳng đổi gì. Quy tắc chung sách đưa ra: xếp các lớp từ ít khả năng thay đổi nhất đến nhiều khả năng thay đổi nhất.

**Tự kiểm tra.** Trong Dockerfile mẫu, vì sao \`COPY package*.json ./\` và \`RUN npm install\` được đặt trước \`COPY . .\` thay vì gộp chung một \`COPY . .\` duy nhất rồi mới \`npm install\`, và điều đó giúp gì cho tốc độ push/pull khi chỉ có \`server.js\` thay đổi mà file \`package.json\` thì không?`,
      },
      {
        id: "ku-w1-4",
        text: "Registry và Container Runtime Interface",
        lesson: `**Mục tiêu.** Đẩy được một image lên registry từ xa bằng \`docker tag\` và \`docker push\`, kéo nó về chạy trên một máy khác, và giải thích được vì sao Kubernetes không tự nói chuyện trực tiếp với \`docker\` mà thông qua một chuẩn trung gian.

**Đọc.** Ch.2, các mục [Lưu trữ Image trong Registry từ xa](#/docs/kuar-02), [Container Runtime Interface](#/docs/kuar-02) và [Dọn dẹp](#/docs/kuar-02).

**Bẫy.** Nghĩ vì chương này dạy \`docker run\` để chạy container, nên khi Pod chạy trên Kubernetes, chính \`kubelet\` cũng gọi thẳng lệnh \`docker run\` phía sau. Từ Kubernetes 1.25, cluster chỉ hoạt động với các runtime hỗ trợ chuẩn Container Runtime Interface (CRI) như \`containerd\` hay \`cri-o\` — Docker daemon tự nó không nói CRI, nó cần một shim trung gian. Bẫy thứ hai nằm ở dọn dẹp: build lại một image với đúng tag cũ (ví dụ \`kuard:blue\`) KHÔNG xoá hay ghi đè image cũ, nó chỉ chuyển tag sang image mới — image cũ vẫn nằm đó dưới một ID khác, chiếm dung lượng, cho tới khi bạn xoá tường minh. Bẫy thứ ba: chọn public registry khi thực ra ứng dụng cần xác thực, vì public registry cho phép TẢI XUỐNG không cần đăng nhập.

**Tự kiểm tra.** Bạn vừa \`docker build\` một image mới với cùng tag \`kuard:blue\` như image cũ. Theo mục "Dọn dẹp", image cũ có tự mất không, và bạn cần chạy lệnh gì (\`docker rmi\` với tham số nào — tag hay image ID, hoặc lệnh dọn dẹp tổng quát nào chạy định kỳ được) để thực sự giải phóng dung lượng nó chiếm?`,
      },
    ],
  },
  {
    id: "ku-w2",
    week: "Tuần 2",
    title: "Dựng cluster và sống trong kubectl",
    goal: "Có một cluster chạy được trên máy mình, và gọi tên được từng thành phần của nó khi `kubectl get` trả về. Tuần này đọc Phụ lục ngay sau chương 3 thay vì để cuối sách như thứ tự gốc, vì cùng chủ đề dựng cluster — đọc nó ở tuần 9 thì đã muộn để còn dùng được.",
    practice: "Dựng cluster bằng `kind` **và** `minikube`, rồi chạy `kubectl get componentstatuses` cùng `kubectl get pods -n kube-system` trên cả hai; ghi lại khác biệt về danh sách thành phần.",
    resources: [
      { label: "KUAR 03 — Triển khai một Kubernetes Cluster", href: "#/docs/kuar-03" },
      { label: "KUAR A — Tự xây dựng Kubernetes Cluster", href: "#/docs/kuar-A" },
      { label: "KUAR 04 — Các lệnh kubectl thông dụng", href: "#/docs/kuar-04" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — kubectl Cheat Sheet", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
    ],
    items: [
      {
        id: "ku-w2-1",
        text: "Ba đường dựng cluster: cloud, minikube, Docker",
        lesson: `**Mục tiêu.** Dựng được một cluster học tập bằng \`minikube\` hoặc \`kind\`, chạy \`kubectl version\` để xác nhận kết nối, và giải thích được vì sao hai công cụ này khác nhau về khả năng mô phỏng nhiều node.

**Đọc.** Ch.3, các mục [Cài đặt Kubernetes trên nhà cung cấp Public Cloud](#/docs/kuar-03), [Cài đặt Kubernetes cục bộ bằng minikube](#/docs/kuar-03), [Chạy Kubernetes trong Docker](#/docs/kuar-03) và [Kubernetes Client](#/docs/kuar-03). Ba mục cài đặt trên cloud (GKE, AKS, EKS) chỉ cần đọc lướt nếu bạn chọn học cục bộ.

**Bẫy.** Nghĩ \`minikube\` cho bạn một cluster nhiều node để luyện tập lịch trình (scheduling) thật. Sách nói rõ \`minikube\` chỉ tạo một VM đơn node — nó không thể hiện hết mọi khía cạnh của một cluster phân tán thật, và một số tính năng cần tích hợp cloud sẽ không có sẵn hoặc bị giới hạn. Ngược lại, \`kind\` chạy MỖI node bên trong một container Docker riêng, nên nó dựng được cluster nhiều node ngay trên một máy laptop duy nhất — đây là khác biệt cơ chế, không phải chỉ là "công cụ khác nhau nhưng làm cùng một việc". Bẫy thứ hai: quên rằng \`minikube\` cần một hypervisor cài sẵn (VirtualBox trên Linux/macOS, Hyper-V trên Windows) trước khi \`minikube start\` chạy được.

**Tự kiểm tra.** Bạn đã dùng xong cluster và muốn dọn sạch. Lệnh xoá cluster của \`kind\` (\`kind delete cluster\`) khác gì với lệnh tương ứng của \`minikube\`, và trước đó bạn cần chạy lệnh nào (\`kind create cluster --wait 5m\` hay \`minikube start\`) để tạo cluster đó ngay từ đầu?`,
      },
      {
        id: "ku-w2-2",
        text: "Các thành phần chạy bên trong một cluster",
        lesson: `**Mục tiêu.** Liệt kê được kube-proxy và DNS server của cluster đang chạy dưới dạng loại đối tượng Kubernetes nào, và tìm được chúng bằng \`kubectl\` trong namespace \`kube-system\` thay vì đoán mò.

**Đọc.** Ch.3, mục [Các thành phần của Cluster](#/docs/kuar-03) — đọc cả ba mục con: Kubernetes Proxy, Kubernetes DNS, Kubernetes UI.

**Bẫy.** Nghĩ các thành phần hệ thống như kube-proxy hay DNS server là những tiến trình "ma thuật" chạy ngầm bên ngoài phạm vi quan sát của \`kubectl\`. Sách chỉ thẳng ra một sự thật thú vị: phần lớn các thành phần tạo nên cluster thực ra được triển khai bằng chính Kubernetes — kube-proxy thường chạy như một DaemonSet, DNS server (\`core-dns\` hoặc \`kube-dns\`) chạy như một Deployment được nhân bản kèm một Service cân bằng tải riêng, cả hai đều nằm gọn trong namespace \`kube-system\` và bạn xem được y hệt như xem bất kỳ Pod, DaemonSet hay Deployment nào khác của chính mình. Nếu Pod của bạn cần phân giải tên service, chính địa chỉ cluster IP của Service DNS này (ví dụ \`10.96.0.10\`) là thứ được tự động điền vào \`/etc/resolv.conf\` bên trong mọi container.

**Tự kiểm tra.** kube-proxy chạy dưới dạng loại đối tượng nào trên mỗi node (bạn sẽ học kỹ đối tượng này ở Chương 11), và lệnh \`kubectl get\` đầy đủ nào — kèm tên loại đối tượng, cờ namespace và tên đối tượng — cho bạn thấy nó đang có bao nhiêu bản sao sẵn sàng trên toàn cluster?`,
      },
      {
        id: "ku-w2-3",
        text: "Tự dựng cluster trên phần cứng thật",
        lesson: `**Mục tiêu.** Hiểu được toàn bộ chuỗi bước để biến bốn Raspberry Pi rời rạc thành một Kubernetes cluster hoạt động: ghi image, thiết lập mạng và DHCP, cài container runtime, rồi \`kubeadm init\` trên node API server và \`kubeadm join\` trên các node worker.

**Đọc.** Phụ lục, từ mục [Danh sách linh kiện](#/docs/kuar-A) đến mục [Thiết lập mạng Cluster](#/docs/kuar-A) — đọc hết các mục con ở giữa: Ghi Image, Khởi động lần đầu, Thiết lập mạng, Cài đặt Container Runtime, Cài đặt Kubernetes, Thiết lập Cluster. Đây chính là lý do Phụ lục được kéo lên tuần này thay vì để cuối sách như thứ tự gốc — cùng chủ đề dựng cluster với chương 3, và đọc lúc gần cuối lộ trình thì đã muộn để còn thử ngay.

**Bẫy.** Chạy \`sudo apt-get install containerd\` từ repository mặc định của Ubuntu vì nghĩ "containerd là containerd, cài gói nào cũng vậy". Sách cảnh báo tường minh: phiên bản trong repo Ubuntu tiêu chuẩn thường lạc hậu, và điều quan trọng là cài \`containerd.io\` — gói từ chính repository của Docker — chứ không phải gói \`containerd\` mặc định. Bẫy thứ hai: quên đổi mật khẩu \`ubuntu\`/\`ubuntu\` mặc định trước khi làm bất cứ việc gì khác; sách coi đây là bước bắt buộc đầu tiên trên mọi thiết bị mới, vì mật khẩu mặc định luôn được biết trước bởi bất kỳ ai muốn khai thác nó.

**Tự kiểm tra.** Trên node API server, bạn chạy \`kubeadm init\` để khởi tạo control plane. Cờ nào bắt buộc phải truyền để khai báo dải CIDR cho mạng Pod, và giá trị cụ thể sách dùng cho cờ đó trong ví dụ Raspberry Pi là gì?`,
      },
      {
        id: "ku-w2-4",
        text: "`kubectl`: namespace, context, CRUD đối tượng và lệnh gỡ lỗi",
        lesson: `**Mục tiêu.** Chuyển đổi được namespace mặc định của \`kubectl\` theo hai cách khác nhau (tạm thời bằng cờ, lâu dài bằng context), và dùng thành thạo bộ tứ \`logs\`/\`exec\`/\`cp\`/\`port-forward\` để gỡ lỗi một Pod đang chạy mà không cần SSH vào node.

**Đọc.** Ch.4, các mục [Namespace](#/docs/kuar-04), [Context](#/docs/kuar-04), [Xem các đối tượng Kubernetes API](#/docs/kuar-04), [Tạo, cập nhật và hủy các đối tượng Kubernetes](#/docs/kuar-04), [Gắn Label và Annotation cho đối tượng](#/docs/kuar-04) và [Các lệnh gỡ lỗi](#/docs/kuar-04).

**Bẫy.** Nhầm cờ \`--namespace\` (hay \`-n\`) truyền cho một lệnh đơn lẻ với việc đổi namespace mặc định lâu dài. Cờ \`-n\` chỉ có hiệu lực cho đúng lệnh đó; muốn đổi namespace mặc định cho mọi lệnh sau này, bạn phải tạo và chuyển context bằng \`kubectl config set-context my-context --namespace=mystuff\` rồi \`kubectl config use-context my-context\` — tạo context thôi chưa kích hoạt nó. Bẫy thứ hai nằm ở việc xoá label: cú pháp không phải \`kubectl label pods bar color=""\` mà là thêm dấu gạch ngang ngay sau tên khoá, không có dấu bằng. Bẫy thứ ba: theo mặc định \`label\`/\`annotate\` từ chối ghi đè một label đã có sẵn, phải yêu cầu tường minh mới cho ghi đè.

**Tự kiểm tra.** Muốn xoá hẳn label \`color\` khỏi Pod \`bar\`, cú pháp chính xác của lệnh \`kubectl label\` là gì (viết đủ, có dấu gạch ngang ở đâu)? Và nếu ngược lại bạn muốn GHI ĐÈ giá trị của một label đã tồn tại thay vì xoá nó, cờ bắt buộc nào bạn phải thêm vào lệnh \`label\` hoặc \`annotate\`?`,
      },
    ],
  },
  {
    id: "ku-w3",
    week: "Tuần 3",
    title: "Pod và cách gắn nhãn cho mọi thứ",
    goal: "Quyết định được hai container nên ở chung Pod hay tách Pod, và giải thích được vì sao.",
    practice: `Chạy Pod \`kuard\` theo §"Chạy Pod", thêm liveness và readiness probe theo §"Kiểm tra sức khỏe", rồi cố ý làm probe thất bại và quan sát khác biệt giữa hai loại probe.`,
    resources: [
      { label: "KUAR 05 — Pod", href: "#/docs/kuar-05" },
      { label: "KUAR 06 — Label và Annotation", href: "#/docs/kuar-06" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
    ],
    items: [
      {
        id: "ku-w3-1",
        text: "Pod là gì, và khi nào KHÔNG nên gộp container",
        lesson: `**Mục tiêu.** Trả lời được bằng lập luận (không phải cảm tính) câu hỏi "hai container này nên chung một Pod hay tách hai Pod?", và tự viết được một Pod manifest tối giản với đúng ba phần \`apiVersion\`/\`kind\`/\`metadata\`/\`spec\`.

**Đọc.** Ch.5, các mục [Pod trong Kubernetes](#/docs/kuar-05), [Tư duy với Pod](#/docs/kuar-05), [Pod Manifest](#/docs/kuar-05) và [Chạy Pod](#/docs/kuar-05).

**Bẫy.** Thấy WordPress và MySQL "đi cùng nhau tạo thành một instance ứng dụng" rồi kết luận chúng nên ở chung một Pod. Sách gọi đây là một antipattern rõ ràng, vì hai lý do: chúng không thực sự cộng sinh (giao tiếp qua mạng vẫn ổn dù nằm trên máy khác nhau), và bạn không muốn mở rộng chúng theo cùng một tỷ lệ — frontend WordPress gần như stateless nên cần nhân bản theo tải, còn MySQL thường chỉ mở rộng theo chiều dọc bằng cách tăng tài nguyên cho đúng một Pod. Câu hỏi đúng sách đưa ra không phải "chúng có liên quan không" mà là "chúng có hoạt động đúng nếu nằm trên các máy khác nhau không?" — nếu câu trả lời là có, hãy tách Pod; ví dụ ở đầu chương (web server đồng bộ với một Git repo qua cùng filesystem) mới thật sự là trường hợp câu trả lời là không, nên bắt buộc chung một Pod.

**Tự kiểm tra.** Trong \`kuard-pod.yaml\` (Ví dụ 5-1), trường nào bên trong mảng \`spec.containers\` đặt tên cho container (khác với \`metadata.name\` là tên của cả Pod), và trường đó có bắt buộc trùng với \`metadata.name\` của Pod không?`,
      },
      {
        id: "ku-w3-2",
        text: "Truy cập Pod và hai loại health check",
        lesson: `**Mục tiêu.** Dùng đúng công cụ trong bộ tứ \`logs\`/\`exec\`/\`cp\` để gỡ lỗi một Pod đang chạy mà không cần SSH vào node, và cấu hình được một liveness probe với các tham số thời gian hợp lý.

**Đọc.** Ch.5, các mục [Truy cập Pod của bạn](#/docs/kuar-05) và [Kiểm tra sức khỏe (Health Check)](#/docs/kuar-05) — đọc cả phần Liveness Probe, Readiness Probe, Startup Probe và các loại kiểm tra sức khỏe khác (\`tcpSocket\`, \`exec\`).

**Bẫy.** Lẫn lộn hậu quả của liveness probe thất bại với readiness probe thất bại — đây là bẫy lớn nhất của chương. Container thất bại liveness probe bị Kubernetes GIẾT và khởi động lại; container thất bại readiness probe không bị đụng tới, nó chỉ bị loại khỏi danh sách endpoint của Service (không nhận lưu lượng mới) cho tới khi khoẻ lại. Nếu bạn gắn nhầm logic readiness vào liveness, một sự cố tạm thời (ví dụ backend chậm) sẽ khiến Kubernetes khởi động lại container liên tục thay vì chỉ đơn giản tạm ngừng gửi lưu lượng cho tới khi nó tự hồi phục. Bẫy thứ hai: dùng \`kubectl cp\` để vá nhanh một file vào container đang chạy là chấp nhận được để "cầm máu" sự cố, nhưng nếu bạn không lập tức build và phát hành lại image sau đó, bản sửa cục bộ đó chắc chắn sẽ bị đè mất ở lần phát hành định kỳ tiếp theo.

**Tự kiểm tra.** Trong Ví dụ 5-2, \`livenessProbe\` có \`failureThreshold: 3\` và \`initialDelaySeconds: 5\`. Sau ba lần probe liên tiếp thất bại, điều gì xảy ra với container? Và trường \`initialDelaySeconds\` kiểm soát chính xác điều gì — nó trì hoãn lần probe đầu tiên bao nhiêu giây sau khi tất cả container trong Pod được tạo?`,
      },
      {
        id: "ku-w3-3",
        text: "requests/limits và volume trong Pod",
        lesson: `**Mục tiêu.** Viết được \`resources.requests\` và \`resources.limits\` đúng đơn vị cho CPU và bộ nhớ, và giải thích được vì sao Kubernetes xử lý việc vượt limit CPU khác hẳn việc vượt limit bộ nhớ.

**Đọc.** Ch.5, các mục [Quản lý tài nguyên](#/docs/kuar-05), [Lưu trữ dữ liệu bền vững với Volume](#/docs/kuar-05) và [Kết hợp tất cả lại](#/docs/kuar-05) — chú ý phần liệt kê các cách dùng volume (giao tiếp/đồng bộ hoá, cache, dữ liệu bền vững, mount filesystem của host).

**Bẫy.** Viết nhầm \`400m\` (bốn trăm milli-đơn vị) khi ý định là \`400M\` (bốn trăm mega-đơn vị) — sách gọi thẳng đây là "một nguồn lỗi phổ biến". \`400m\` CPU nghĩa là 0,4 lõi, hoàn toàn khác đơn vị bộ nhớ. Bẫy thứ hai nằm ở cách kernel xử lý việc vượt limit: vượt CPU limit chỉ bị điều tiết (throttle), tiến trình vẫn sống với tốc độ chậm hơn; nhưng vượt memory limit khiến \`kubelet\` chấm dứt hẳn container, vì bộ nhớ đã cấp phát không thể "lấy lại" giữa chừng như CPU. Bẫy thứ ba: \`requests\` là mức tối thiểu được đảm bảo chứ không phải mức trần — một Pod duy nhất trên node vẫn có thể dùng hết toàn bộ CPU rảnh của node dù chỉ yêu cầu 0,5 core.

**Tự kiểm tra.** Container của bạn khai \`resources.requests.cpu: "500m"\` và \`resources.limits.memory: "256Mi"\`. \`500m\` CPU tương ứng với bao nhiêu lõi CPU thực? Và nếu container này thực sự dùng vượt quá 256Mi bộ nhớ, \`kubelet\` sẽ điều tiết nó hay chấm dứt nó — khác gì với việc vượt CPU limit?`,
      },
      {
        id: "ku-w3-4",
        text: "Label và annotation — khác nhau ở mục đích, không ở cú pháp",
        lesson: `**Mục tiêu.** Viết được một label selector kết hợp AND/OR/phủ định đúng cú pháp qua \`kubectl get ... --selector=\`, và giải thích được label với annotation dùng chung một khuôn cặp khoá/giá trị nhưng phục vụ hai mục đích khác nhau.

**Đọc.** Ch.6, các mục [Label](#/docs/kuar-06), [Annotation](#/docs/kuar-06) và [Dọn dẹp](#/docs/kuar-06) — chú ý bảng liệt kê các toán tử selector (\`=\`, \`!=\`, \`in\`, \`notin\`, có/không thiết lập khoá).

**Bẫy.** Nghĩ label và annotation khác nhau ở cú pháp lưu trữ. Thực ra cả hai đều là cặp khoá/giá trị dạng chuỗi, tuân theo đúng cùng quy tắc đặt tên (tiền tố DNS subdomain tối đa 253 ký tự, tên tối đa 63 ký tự) — khác biệt duy nhất là MỤC ĐÍCH: label dùng để định danh, nhóm và LỌC bằng selector; annotation chỉ để lưu siêu dữ liệu cho công cụ đọc, không bao giờ dùng trong một selector, và giá trị của nó là chuỗi tự do không được xác thực định dạng. Bẫy thứ hai nằm ở toán tử \`in\`: dùng dấu phẩy giữa các selector (\`app=alpaca,ver=2\`) là phép AND, còn liệt kê nhiều giá trị trong \`in (...)\` cho MỘT khoá lại là phép OR trên chính khoá đó — hai cú pháp trông giống nhau nhưng logic khác hẳn. Sách khuyên: khi phân vân nên dùng cái nào, hãy bắt đầu bằng annotation rồi nâng lên thành label nếu sau này bạn cần lọc bằng nó.

**Tự kiểm tra.** Bạn muốn liệt kê mọi Pod có label \`app\` là \`alpaca\` HOẶC \`bandicoot\` bằng \`kubectl get pods --selector=...\`. Cú pháp chính xác của biểu thức đó dùng toán tử nào, và nó khác gì về mặt logic so với việc viết \`--selector="app=alpaca,app=bandicoot"\`?`,
      },
    ],
  },
  {
    id: "ku-w4",
    week: "Tuần 4",
    title: "Service discovery và Ingress",
    goal: "Đưa được một ứng dụng ra ngoài cluster bằng đúng cơ chế phù hợp, và nói được vì sao không chọn hai cơ chế kia.",
    practice: `Cài Contour theo §"Cài đặt Contour", tạo hai Ingress trỏ hai host khác nhau về hai Service, rồi kiểm bằng \`curl -H "Host: ..."\`.`,
    resources: [
      { label: "KUAR 07 — Service Discovery", href: "#/docs/kuar-07" },
      { label: "KUAR 08 — Cân bằng tải HTTP với Ingress", href: "#/docs/kuar-08" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
      { label: "kubernetes.io — Ingress", href: "https://kubernetes.io/docs/concepts/services-networking/ingress/" },
    ],
    items: [
      {
        id: "ku-w4-1",
        text: "Service discovery và đối tượng Service",
        lesson: `**Mục tiêu.** Tạo được một Service bằng \`kubectl expose\` mà không cần tự khai selector thủ công, và đọc đúng được tên DNS đầy đủ mà Kubernetes gán cho nó.

**Đọc.** Ch.7, các mục [Service Discovery là gì?](#/docs/kuar-07) và [Đối tượng Service](#/docs/kuar-07) — gồm cả phần Service DNS và Kiểm tra Readiness trong mục Đối tượng Service.

**Bẫy.** Nghĩ phải tự tay khai \`selector\` khớp chính xác với label của Deployment khi tạo Service bằng \`kubectl expose\`. Thực ra lệnh này tiện lợi tự LẤY cả label selector lẫn cổng liên quan trực tiếp từ định nghĩa Deployment, bạn không cần chỉ định lại. Bẫy thứ hai là DNS: nhiều hệ thống (Java là ví dụ sách nêu) tra cứu tên trong DNS một lần rồi cache mãi, không bao giờ phân giải lại — với DNS truyền thống trên internet đây từng là vấn đề gây client nói chuyện với IP sai, nhưng cluster IP của Service là một địa chỉ ảo ổn định nên vấn đề cache đó không còn đáng lo như với IP Pod trực tiếp. Bẫy thứ ba: chỉ thêm readiness probe vào template của Deployment sẽ tạo lại Pod, nên đừng ngạc nhiên nếu bạn phải khởi động lại lệnh \`port-forward\` đang chạy dở sau khi sửa.

**Tự kiểm tra.** Bạn tạo Service bằng \`kubectl expose deployment alpaca-prod\` mà không truyền \`--selector\` hay \`--port\` nào cả. Lệnh này tự động lấy hai giá trị đó từ đâu? Và tên DNS đầy đủ mà Kubernetes gán cho Service này trong namespace \`default\` gồm bốn phần phân tách bằng dấu chấm, kết thúc bằng \`svc.cluster.local.\` — hãy viết đủ bốn phần đó, theo đúng thứ tự.`,
      },
      {
        id: "ku-w4-2",
        text: "Ra ngoài cluster: NodePort, LoadBalancer và chi tiết bên trong",
        lesson: `**Mục tiêu.** Chọn đúng \`spec.type\` cho Service (\`NodePort\` hay \`LoadBalancer\`) tuỳ theo bạn cần lưu lượng chạm tới node cụ thể hay ra hẳn internet công cộng, và giải thích được \`kube-proxy\` hiện thực cluster IP bằng cơ chế gì.

**Đọc.** Ch.7, các mục [Nhìn ra ngoài Cluster](#/docs/kuar-07), [Tích hợp Load Balancer](#/docs/kuar-07), [Chi tiết nâng cao](#/docs/kuar-07) và [Kết nối với các môi trường khác](#/docs/kuar-07) — gồm cả phần Endpoints, kube-proxy và Cluster IP trong mục "Chi tiết nâng cao".

**Bẫy.** Tưởng có một trường chuẩn kiểu \`spec.internal: true\` để tạo load balancer chỉ phơi bày trong mạng riêng. Không có trường như vậy — hỗ trợ load balancer nội bộ được thêm vào Kubernetes muộn nên nó chỉ hiện thực qua ANNOTATION đặc thù cho từng cloud (ví dụ \`service.beta.kubernetes.io/azure-load-balancer-internal: "true"\` trên Azure, khác hẳn cú pháp trên AWS hay GCP). Bẫy thứ hai: tạo Service \`type: LoadBalancer\` sẽ phơi bày nó ra internet công cộng ngay khi cloud gán xong địa chỉ ngoài — sách nhắc bạn cân nhắc điều đó trước khi làm, vì không phải lúc nào phơi ra công khai cũng là điều bạn muốn.

**Tự kiểm tra.** Bạn đổi \`spec.type\` của một Service từ \`NodePort\` thành \`LoadBalancer\`. Theo sách, loại \`LoadBalancer\` "xây dựng trên" (build on) loại nào khác — nghĩa là trường \`NodePort:\` vẫn còn xuất hiện khi bạn chạy \`kubectl describe service\` sau đó? Và trường nào trong kết quả \`describe\` đó cho bạn địa chỉ IP hoặc hostname bên ngoài mới được cloud cấp?`,
      },
      {
        id: "ku-w4-3",
        text: "Ingress và Ingress Controller là hai thứ khác nhau",
        lesson: `**Mục tiêu.** Cài đặt được một Ingress controller (Contour) và tạo một Ingress object trỏ đúng service upstream theo host và theo path, hiểu được vì sao hai việc này là hai bước tách biệt trong Kubernetes.

**Đọc.** Ch.8, các mục [Đặc tả Ingress so với Ingress Controller](#/docs/kuar-08), [Cài đặt Contour](#/docs/kuar-08) và [Sử dụng Ingress](#/docs/kuar-08) — gồm cả ba cách dùng: mặc định (\`defaultBackend\`), theo host, và theo path với quy tắc tiền tố dài nhất khớp trước.

**Bẫy.** Tạo một đối tượng Ingress rồi mong lưu lượng HTTP tự động được định tuyến ngay. Đây chính là điểm sách nhấn mạnh nhất của chương: Ingress chỉ là một ĐẶC TẢ tài nguyên (schema), không có Ingress controller "tiêu chuẩn" nào được tích hợp sẵn trong Kubernetes. \`kubectl apply\` sẽ thành công và tạo object bình thường, nhưng nếu không có controller nào (như Contour) đang chạy để đọc và hành động trên object đó, sẽ không có gì xảy ra với lưu lượng thật — không lỗi, không cảnh báo, chỉ đơn giản là không định tuyến. Bẫy thứ hai: cài Contour đòi hỏi quyền \`cluster-admin\`, vì nó tạo cả namespace, ServiceAccount và CustomResourceDefinition riêng.

**Tự kiểm tra.** Bạn \`kubectl apply -f simple-ingress.yaml\` trên một cluster CHƯA cài Ingress controller nào. Lệnh \`apply\` có báo lỗi không? Và thực tế điều gì (hay đúng hơn là KHÔNG điều gì) sẽ xảy ra khi bạn thử truy cập service đó qua địa chỉ Ingress, cho tới khi bạn cài xong một controller như Contour bằng \`kubectl apply -f https://projectcontour.io/quickstart/contour.yaml\`?`,
      },
      {
        id: "ku-w4-4",
        text: "Giới hạn của Ingress và những gì đến sau nó",
        lesson: `**Mục tiêu.** Dùng đúng trường \`spec.ingressClassName\` để chọn Ingress controller khi cluster chạy nhiều controller cùng lúc, và biết vì sao hành vi xuyên namespace của Ingress đòi hỏi phối hợp toàn cluster chứ không chỉ trong phạm vi đội mình.

**Đọc.** Ch.8, các mục [Các chủ đề nâng cao về Ingress và những điều cần lưu ý](#/docs/kuar-08), [Các hiện thực Ingress thay thế](#/docs/kuar-08) và [Tương lai của Ingress](#/docs/kuar-08) — gồm cả các mục con Chạy nhiều Ingress Controller, Ingress và Namespace, Ghi lại đường dẫn, Phục vụ TLS.

**Bẫy.** Nghĩ vì một Ingress object chỉ được tham chiếu tới service upstream trong CÙNG namespace (đúng, đây là giới hạn bảo mật có chủ đích), nên các Ingress ở các namespace khác nhau hoàn toàn độc lập với nhau. Sai: nhiều đối tượng Ingress ở các namespace khác nhau chỉ định đường dẫn con cho CÙNG một host vẫn được hợp nhất lại thành một cấu hình duy nhất cho controller — nghĩa là một Ingress viết sai trong namespace của đội khác vẫn có thể gây xung đột hành vi (không xác định) cho host bạn đang dùng, dù bạn chưa hề đụng gì tới namespace của họ.

**Tự kiểm tra.** Cluster của bạn chạy song song cả Contour lẫn NGINX Ingress controller. Trường nào trong \`spec\` của đối tượng Ingress cho phép bạn chỉ định chính xác controller nào phải xử lý nó, và annotation cũ hơn (dùng trước Kubernetes 1.18, nay không còn được khuyến nghị) mà trường này đã thay thế là gì?`,
      },
    ],
  },
  {
    id: "ku-w5",
    week: "Tuần 5",
    title: "ReplicaSet và Deployment",
    goal: "Giải thích được vòng lặp đồng bộ bằng lời của mình, và chọn được chiến lược rollout phù hợp với một ràng buộc cho trước.",
    practice: "Tạo Deployment, đổi image để kích hoạt rollout, rồi `kubectl rollout pause` giữa chừng và quan sát số Pod của **hai** ReplicaSet cùng lúc. Sau đó `resume` và `undo`.",
    resources: [
      { label: "KUAR 09 — ReplicaSet", href: "#/docs/kuar-09" },
      { label: "KUAR 10 — Deployment", href: "#/docs/kuar-10" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
    ],
    items: [
      {
        id: "ku-w5-1",
        text: "Vòng lặp đồng bộ và quan hệ Pod ↔ ReplicaSet",
        lesson: `**Mục tiêu.** Giải thích được bằng lời của mình vòng lặp đồng bộ (trạng thái mong muốn so với trạng thái quan sát được), và mô tả được vì sao ReplicaSet chỉ liên kết lỏng với Pod qua label selector chứ không "sở hữu" chúng theo kiểu cha-con.

**Đọc.** Ch.9, các mục [Vòng lặp đồng bộ (Reconciliation Loop)](#/docs/kuar-09), [Liên hệ giữa Pod và ReplicaSet](#/docs/kuar-09) và [Thiết kế với ReplicaSet](#/docs/kuar-09) — gồm cả hai mục con Tiếp nhận các Container hiện có và Cách ly Container.

**Bẫy.** Nghĩ ReplicaSet "sở hữu" các Pod nó tạo ra theo kiểu cha-con chặt chẽ, giống như một tiến trình cha giữ tham chiếu trực tiếp tới tiến trình con. Thực ra quan hệ này liên kết lỏng: ReplicaSet chỉ dùng TRUY VẤN LABEL để tìm Pod nó nên quản lý, đi qua đúng Pod API công khai mà bạn tự tay dùng ở Chương 5 — sách gọi đây là "đi vào bằng cửa trước". Chính vì lỏng như vậy, một ReplicaSet mới có thể "tiếp nhận" (adopt) một Pod mệnh lệnh đã tồn tại sẵn, thay vì buộc phải xoá Pod đó rồi tạo lại từ đầu — chuyển liền mạch từ một Pod đơn lẻ sang một tập được nhân bản mà không có khoảnh khắc gián đoạn nào.

**Tự kiểm tra.** Một Pod \`kuard\` đang chạy nhưng hành xử sai dù vẫn pass mọi health check. Theo mục "Cách ly Container", bạn sửa trường nào trên chính Pod đó (không xoá nó) để tách nó khỏi ReplicaSet và Service, và ReplicaSet sẽ làm gì ngay sau khi phát hiện thiếu một Pod khớp selector?`,
      },
      {
        id: "ku-w5-2",
        text: "Tạo, kiểm tra, mở rộng và xoá ReplicaSet",
        lesson: `**Mục tiêu.** Viết được một ReplicaSet manifest tối thiểu với đúng ba phần \`replicas\`/\`selector\`/\`template\`, mở rộng nó bằng cả hai cách mệnh lệnh (\`kubectl scale\`) và khai báo (sửa file rồi \`kubectl apply\`), và xoá nó mà không kéo theo Pod nếu cần.

**Đọc.** Ch.9, các mục [Đặc tả ReplicaSet](#/docs/kuar-09), [Tạo ReplicaSet](#/docs/kuar-09), [Kiểm tra ReplicaSet](#/docs/kuar-09), [Mở rộng ReplicaSet](#/docs/kuar-09) và [Xóa ReplicaSet](#/docs/kuar-09) — gồm cả phần tìm ReplicaSet từ một Pod qua \`ownerReferences\` và tự động mở rộng bằng \`kubectl autoscale\`.

**Bẫy.** Dùng \`kubectl scale replicasets kuard --replicas=4\` để phản ứng nhanh với sự cố tăng tải, rồi quên cập nhật lại số \`replicas\` trong file YAML đã lưu ở hệ thống quản lý mã nguồn. Sách kể câu chuyện Alice/Bob: Alice scale khẩn cấp lên 10 nhưng không sửa file; vài ngày sau Bob chỉnh image mới rồi \`apply\` lại file cũ (vẫn ghi \`replicas: 5\`) — kết quả là vừa đổi image vừa vô tình giảm một nửa số replica đúng lúc tải cao, gây sự cố ngừng dịch vụ. Bài học: mọi thay đổi mệnh lệnh khẩn cấp phải được theo ngay sau bởi một thay đổi khai báo tương ứng trong cùng file cấu hình. Bẫy thứ hai: kết hợp \`kubectl autoscale\` với việc tự tay \`scale\` hay sửa \`replicas\` trong file là một antipattern — hai bên sẽ giẫm chân nhau và cho hành vi khó đoán.

**Tự kiểm tra.** Bạn chạy \`kubectl delete rs kuard\` không kèm cờ gì. Mặc định, điều gì xảy ra với các Pod mà ReplicaSet đó đang quản lý? Và cờ nào bạn phải thêm vào lệnh \`delete\` để CHỈ xoá đối tượng ReplicaSet, giữ nguyên các Pod đang chạy?`,
      },
      {
        id: "ku-w5-3",
        text: "Deployment điều khiển ReplicaSet như thế nào",
        lesson: `**Mục tiêu.** Chứng minh được bằng thực nghiệm rằng sửa trực tiếp ReplicaSet bên dưới một Deployment sẽ bị ghi đè trở lại, và giải thích được vì sao (vòng lặp đồng bộ ở cấp Deployment, chạy phía trên vòng lặp của chính ReplicaSet).

**Đọc.** Ch.10, các mục [Deployment đầu tiên của bạn](#/docs/kuar-10), [Tạo Deployment](#/docs/kuar-10), [Quản lý Deployment](#/docs/kuar-10) và [Cập nhật Deployment](#/docs/kuar-10) — gồm cả các mục con Mở rộng Deployment, Cập nhật Container Image và Lịch sử Rollout.

**Bẫy.** Nghĩ mở rộng trực tiếp ReplicaSet bên dưới (bằng \`kubectl scale replicasets ...\`) là cách "nhanh hơn" để scale một Deployment vì bỏ qua một lớp trung gian. Sách tự tay chứng minh điều ngược lại: nếu bạn đặt ReplicaSet về 1 replica trong khi Deployment phía trên vẫn khai \`replicas: 2\`, chỉ vài giây sau ReplicaSet lại quay về 2 — Deployment controller phát hiện trạng thái quan sát không khớp trạng thái mong muốn của NÓ và tự sửa lại. Đây không phải bug, đây chính là hệ thống tự phục hồi hoạt động đúng như thiết kế; muốn quản lý trực tiếp ReplicaSet, bạn phải xoá hẳn Deployment (nhớ \`--cascade=false\`) trước. Bẫy thứ hai: chạy \`kubectl create -f\` lần đầu rồi quên chạy thêm \`kubectl replace --save-config\` sẽ khiến các lần \`apply\` sau không có bản ghi cấu hình trước đó để hợp nhất thông minh.

**Tự kiểm tra.** Bạn chạy \`kubectl scale replicasets kuard-1128242161 --replicas=1\` trực tiếp trên ReplicaSet bên dưới một Deployment có \`spec.replicas: 2\`. Vài giây sau, \`kubectl get replicasets\` cho kết quả bao nhiêu replica mong muốn, và trường nào trên chính đối tượng Deployment (không phải ReplicaSet) là "nguồn chân lý" khiến điều đó xảy ra?`,
      },
      {
        id: "ku-w5-4",
        text: "Chiến lược rollout, xoá và giám sát",
        lesson: `**Mục tiêu.** Chọn đúng cặp \`maxUnavailable\`/\`maxSurge\` cho một ràng buộc cho trước (ví dụ "không được giảm dưới 100% năng lực"), và đọc được trạng thái thất bại của một rollout qua \`status.conditions\`.

**Đọc.** Ch.10, các mục [Chiến lược Deployment](#/docs/kuar-10), [Xóa Deployment](#/docs/kuar-10) và [Giám sát Deployment](#/docs/kuar-10) — gồm cả hai mục con Quản lý nhiều phiên bản của service và Cấu hình rolling update, cùng vai trò của \`minReadySeconds\` và \`progressDeadlineSeconds\`.

**Bẫy.** Nghĩ \`Recreate\` và \`RollingUpdate\` là hai cơ chế hoàn toàn tách biệt về bản chất. Sách chỉ ra một sự thật gây bất ngờ cho người tinh ý: chiến lược \`Recreate\` thực chất giống hệt \`RollingUpdate\` với \`maxUnavailable\` được đặt là \`100%\` — nó chỉ là một trường hợp đặc biệt, không phải một cơ chế riêng, và vì thế nó luôn gây thời gian ngừng dịch vụ. Bẫy thứ hai: đặt \`maxUnavailable: 0\` và \`maxSurge: 20%\` cho một Deployment 10 replica, bước ĐẦU TIÊN rollout thực hiện là MỞ RỘNG ReplicaSet mới thêm 2 replica trước, chứ không phải thu nhỏ ReplicaSet cũ trước — nếu làm ngược lại, năng lực sẽ tụt dưới 100% ngay từ bước đầu, trái với đúng ràng buộc bạn vừa đặt ra.

**Tự kiểm tra.** Với \`maxUnavailable: 0\` và \`maxSurge: 20%\` trên một Deployment 10 replica, bước đầu tiên của rollout là tăng hay giảm ReplicaSet nào trước — ReplicaSet mới lên bao nhiêu replica, hay ReplicaSet cũ xuống bao nhiêu? Và vì sao thứ tự đó đảm bảo năng lực dịch vụ không bao giờ tụt dưới 100% trong suốt quá trình?`,
      },
    ],
  },
];
