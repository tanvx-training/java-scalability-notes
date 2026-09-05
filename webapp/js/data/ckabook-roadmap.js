// Lộ trình NƯỚC RÚT ôn thi CKA — bám cuốn CKA Study Guide (ấn bản 2).
//
// Nguồn: bản dịch tiếng Việt "Certified Kubernetes Administrator (CKA) Study
// Guide", ấn bản 2 — Benjamin Muschko, O'Reilly. Thư mục nguồn: cka-book-vi/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// ĐỊNH VỊ: track này chạy SAU khi học xong giáo trình CKA (#/roadmap/cka).
// Nó là vòng ôn thứ hai, KHÔNG dạy lại từ đầu — mỗi mục ưu tiên phần
// "Trọng tâm cho kỳ thi" của chương, và giao bài tập mẫu cuối chương.
//
// Mỗi mục là KẾ HOẠCH ĐỌC trỏ vào sách, không chép lại nội dung sách.
// Đề bài "Bài tập mẫu" KHÔNG được chép sang đây — chỉ trỏ tới chương.
// GIỮ NGUYÊN id (cb-w<N> / cb-w<N>-<M>) — tiến độ localStorage lưu theo id này.
// Tiền tố là cb-, KHÔNG phải cka- (đã thuộc track chứng chỉ CKA).

export const ckabookWeeks = [
  {
    id: "cb-w1",
    week: "Tuần 1",
    title: "Luật chơi phòng thi, kiến trúc cluster và kubeadm",
    goal: "Nói lại được đề cương chấm điểm theo tỷ trọng nào, và tự dựng rồi nâng cấp một cluster kubeadm mà không tra tài liệu.",
    practice: "Làm **Bài tập mẫu** cuối chương 4, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bấm giờ 12 phút cho bài nâng cấp cluster — đó là mốc thời gian thực tế của đề thật.",
    resources: [
      { label: "CKA Book 01 — Chi tiết về kỳ thi và tài nguyên", href: "#/docs/ckabook-01" },
      { label: "CKA Book 02 — Tóm lược về Kubernetes", href: "#/docs/ckabook-02" },
      { label: "CKA Book 03 — Tương tác với Kubernetes", href: "#/docs/ckabook-03" },
      { label: "CKA Book 04 — Cài đặt và nâng cấp cluster", href: "#/docs/ckabook-04" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
      { label: "kubernetes.io — Upgrading kubeadm clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/kubeadm/kubeadm-upgrade/" },
    ],
    items: [
      {
        id: "cb-w1-1",
        text: "Đề cương chấm điểm, môi trường thi và cách chia thời gian",
        lesson: `**Mục tiêu.** Nói lại chính xác năm lĩnh vực của đề cương CKA cùng trọng số điểm của từng lĩnh vực, và dựng sẵn một chiến lược chia thời gian cho hai giờ thi trước khi mở câu hỏi đầu tiên — đây là vòng ôn thứ hai nên bạn không cần học lại khái niệm, chỉ cần khớp lại con số.

**Đọc.** [CKA Book 01](#/docs/ckabook-01) §"Mục tiêu của kỳ thi" và §"Đề cương" — thuộc lòng năm trọng số (25% kiến trúc/cài đặt/cấu hình cluster, 15% workload và lập lịch, 20% service và mạng, 10% lưu trữ, 30% xử lý sự cố) vì chúng quyết định bạn nên đầu tư thời gian ôn ở đâu trong ba tuần tới. Sau đó đọc §"Môi trường thi và các mẹo" (voucher, PSI, giám thị qua video) và §"Quản lý thời gian" (số câu, thời gian trung bình mỗi câu, các chiến lược chia thời gian sách gợi ý).

**Bẫy.** Coi Xử lý sự cố là lĩnh vực phụ vì nó không có một chương riêng mang tên đó. Đây là lĩnh vực có trọng số cao nhất (30%) nhưng lại nằm rải rác trong mọi chương khác — nếu bạn chỉ ôn theo tên chương, bạn sẽ đánh giá thấp đúng phần chiếm điểm nhiều nhất. Bẫy thứ hai: nghĩ phải làm hoàn hảo từng câu. Sách nói rõ đề thi có điểm thành phần (partial credit) và ưu tiên bề rộng hơn độ hoàn hảo — chiến lược tốt hơn là làm hết 15–20 câu ở mức "chạy được" thay vì dồn hết thời gian cho vài câu khó.

**Tự kiểm tra.** Không mở sách: liệt kê năm lĩnh vực đề cương theo đúng thứ tự trọng số giảm dần, kèm phần trăm của từng lĩnh vực. Sai một con số nghĩa là bạn chưa sẵn sàng phân bổ thời gian ôn cho ba tuần tới.`,
      },
      {
        id: "cb-w1-2",
        text: "Kiến trúc cluster và các primitive API phải thuộc",
        lesson: `**Mục tiêu.** Vẽ lại được sơ đồ kiến trúc cluster (control plane và worker node, các thành phần bên trong mỗi loại node) từ trí nhớ, và gọi đúng tên cấu trúc bốn phần của một object khi thấy một manifest lạ.

**Đọc.** [CKA Book 02](#/docs/ckabook-02) §"Kiến trúc tổng quan" (API server, scheduler, controller manager, etcd trên control plane; kubelet, kube-proxy, container runtime trên mọi node) và §"Các tính năng" (mô hình khai báo, autoscaling, quản lý ứng dụng, lưu trữ bền vững, mạng). Rồi sang [CKA Book 03](#/docs/ckabook-03) §"Các primitive và đối tượng của API" — phần ví von primitive như một lớp (class) và object như một thể hiện (instance), cùng bốn phần cấu trúc chung: apiVersion, kind, metadata, spec/status.

**Bẫy.** Nghĩ node control plane bắt buộc phải cài container runtime engine. Sách nói rõ điều đó không bắt buộc, vì control plane thường không lập lịch workload — nếu một câu hỏi thi mô tả một cluster mà node control plane thiếu containerd, đó chưa chắc là lỗi cấu hình. Bẫy thứ hai, ở object model: sửa trường \`status\` để "chữa" một đối tượng gặp lỗi. Bạn ghi \`spec\` (trạng thái mong muốn) và đọc \`status\` (trạng thái thực tế) — chiều ngược lại là việc của controller; object chưa được hiện thực hoá nếu \`status\` hiển thị \`{}\`.

**Tự kiểm tra.** Kể tên đúng bốn thành phần chỉ chạy trên node control plane, và hai thành phần chạy trên mọi node kể cả worker — không nhìn sách. Sau đó trả lời: nếu bạn thấy \`status: {}\` trong output YAML của một object, điều đó cho biết điều gì về object đó?`,
      },
      {
        id: "cb-w1-3",
        text: "`kubectl` ở tốc độ phòng thi: alias, `--dry-run`, `explain`",
        lesson: `**Mục tiêu.** Gõ được một lệnh \`kubectl\` hoàn chỉnh — mệnh lệnh, khai báo, hoặc lai — mà không dừng lại tra cú pháp, và dùng \`kubectl explain\` để tra một trường lạ nhanh hơn mở trình duyệt.

**Đọc.** [CKA Book 01](#/docs/ckabook-01) §"Mẹo và thủ thuật dòng lệnh" (alias \`k\` đã có sẵn trong môi trường thi, auto-completion, và tên viết tắt tài nguyên — \`kubectl api-resources\` liệt kê chúng, ví dụ \`pvc\` thay cho \`persistentvolumeclaims\`) và [CKA Book 03](#/docs/ckabook-03) §"Sử dụng kubectl" (cú pháp \`kubectl [command] [TYPE] [NAME] [flags]\`, \`kubectl explain\`) cùng §"Quản lý đối tượng" (ba cách: mệnh lệnh, khai báo, cách tiếp cận lai với \`--dry-run=client -o yaml\`).

**Bẫy.** Tưởng \`kubectl create\` và \`kubectl apply\` hoán đổi cho nhau được. \`create\` thất bại nếu object đã tồn tại — dùng để tạo một lần; \`apply\` so sánh trạng thái mong muốn với trạng thái hiện tại nên vừa tạo vừa cập nhật được, và theo dõi thay đổi qua annotation \`kubectl.kubernetes.io/last-applied-configuration\`. Bẫy thứ hai, tốn thời gian thật: để mặc định lệnh \`kubectl delete pod\` xoá êm thấm (grace period 30 giây) trong lúc làm bài thi. Tác động đến người dùng cuối không phải mối bận tâm trong phòng thi — luôn thêm \`--now\` để buộc xoá ngay bằng SIGKILL.

**Tự kiểm tra.** Câu lệnh nào sinh ra một file YAML của Pod từ cách tiếp cận mệnh lệnh mà không tạo object thật trên cluster? Và câu lệnh xoá Pod tên \`nginx\` ngay lập tức, bỏ qua grace period, gõ đầy đủ cờ dòng lệnh, là gì?`,
      },
      {
        id: "cb-w1-4",
        text: "Dựng cluster bằng kubeadm và nâng cấp phiên bản",
        lesson: `**Mục tiêu.** Tự chạy được toàn bộ quy trình \`kubeadm init\` → cài CNI → \`kubeadm join\` để dựng một cluster hai node, và tự nâng cấp nó lên một phiên bản patch mới hơn — chỉ mở tài liệu để sao chép lệnh dài, không mở để nhớ cú pháp.

**Đọc.** [CKA Book 04](#/docs/ckabook-04) §"Sử dụng kubeadm" (kubeadm không cung cấp hạ tầng nền tảng), §"Cài đặt Cluster" (toàn bộ quy trình \`kubeadm init --pod-network-cidr\`, cài CNI, \`kubeadm join\`), §"Quản lý cluster có tính sẵn sàng cao" (topology etcd xếp chồng và etcd bên ngoài), §"Nâng cấp phiên bản Cluster" (nâng \`kubeadm\` trước, \`kubeadm upgrade plan\`/\`apply\`, drain, nâng kubelet/kubectl, uncordon), và §"Trọng tâm cho kỳ thi" của chính chương này.

**Bẫy.** Nhảy nhiều phiên bản minor một lần khi nâng cấp — sách khuyến nghị chỉ nhảy một minor (ví dụ 1.31 lên 1.32) hoặc nhiều patch trong cùng minor, tránh tác dụng phụ không mong muốn. Bẫy thứ hai, đúng thứ tự nâng cấp control plane đầu tiên: nâng \`kubeadm\` → \`kubeadm upgrade apply\` → drain node đó → nâng kubelet/kubectl → uncordon; các node control plane còn lại chỉ chạy \`kubeadm upgrade node\`, không chạy lại \`apply\`. Bẫy thứ ba: quên rằng \`kubeadm upgrade\` không tự nâng cấp chính file thực thi \`kubeadm\` — bạn phải cài phiên bản đích cho \`kubeadm\` trước khi chạy \`upgrade plan\`.

**Tự kiểm tra.** Nêu đúng thứ tự bốn nhóm lệnh khi nâng cấp một node control plane duy nhất, từ nâng \`kubeadm\` đến \`uncordon\`. Và: topology HA nào cần gấp đôi số host so với topology etcd xếp chồng?`,
      },
    ],
  },
  {
    id: "cb-w2",
    week: "Tuần 2",
    title: "etcd, xác thực/ủy quyền, CRD và đóng gói",
    goal: "Snapshot rồi khôi phục etcd trong 8 phút, và đọc được một lỗi `Forbidden` để chỉ ra thiếu Role hay thiếu RoleBinding.",
    practice: "Làm **Bài tập mẫu** cuối chương 5, 6 và 8, đối chiếu [Phụ lục A](#/docs/ckabook-A). Riêng bài etcd làm hai lần: lần hai không mở tài liệu.",
    resources: [
      { label: "CKA Book 05 — Sao lưu và khôi phục etcd", href: "#/docs/ckabook-05" },
      { label: "CKA Book 06 — Xác thực, ủy quyền và kiểm soát tiếp nhận", href: "#/docs/ckabook-06" },
      { label: "CKA Book 07 — Operator và CRD", href: "#/docs/ckabook-07" },
      { label: "CKA Book 08 — Helm và Kustomize", href: "#/docs/ckabook-08" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
      { label: "kubernetes.io — Operating etcd clusters", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" },
    ],
    items: [
      {
        id: "cb-w2-1",
        text: "Snapshot và khôi phục etcd — bài gần như chắc chắn có trong đề",
        lesson: `**Mục tiêu.** Chạy trọn quy trình snapshot etcd bằng \`etcdctl\` rồi khôi phục bằng \`etcdutl\` trong dưới 8 phút, không tra cứu tên cờ dòng lệnh giữa chừng.

**Đọc.** [CKA Book 05](#/docs/ckabook-05) §"Sử dụng các tiện ích quản trị etcd" — cả sao lưu lẫn khôi phục đều nằm trong mục này: cách tìm phiên bản etcd qua \`kubectl describe pod etcd-...\`, ba cờ bắt buộc \`--cacert\`/\`--cert\`/\`--key\` lấy từ chính output describe đó, \`etcdctl snapshot save\`, rồi \`etcdutl snapshot restore --data-dir=...\` và bước sửa \`hostPath\` trong manifest tĩnh của Pod etcd. Đọc thêm §"Trọng tâm cho kỳ thi" — sách nhấn hai điều đúng là hai bước hay bị quên trong phòng thi.

**Bẫy.** Dùng \`etcdctl snapshot restore\` — lệnh này đã lỗi thời và sẽ bị gỡ khi etcd 3.6 phát hành; dùng \`etcdutl snapshot restore\` thay thế. Bẫy thứ hai, bẫy chết bài: khôi phục vào thư mục dữ liệu mới rồi dừng lại. Giải nén snapshot vào một thư mục không tự động khiến etcd dùng nó — bạn còn phải sửa \`spec.volumes[].hostPath.path\` trong \`/etc/kubernetes/manifests/etcd.yaml\` từ \`/var/lib/etcd\` trỏ sang thư mục vừa khôi phục để kubelet khởi động lại Pod etcd với dữ liệu mới. Nếu Pod không chuyển \`Running\`, sách gợi ý xoá thủ công để buộc tạo lại.

**Tự kiểm tra.** Không tra sách: viết đủ lệnh \`etcdctl snapshot save\` với ba cờ chứng chỉ bắt buộc, và tên chính xác của thuộc tính manifest bạn phải sửa để etcd đọc dữ liệu đã khôi phục.`,
      },
      {
        id: "cb-w2-2",
        text: "Một request đi qua API server: xác thực trước, ủy quyền sau",
        lesson: `**Mục tiêu.** Vẽ lại ba giai đoạn API server xử lý một request theo đúng thứ tự, và tự sửa được một context/kubeconfig sai mà không cần mở lại phần lý thuyết.

**Đọc.** [CKA Book 06](#/docs/ckabook-06) §"Xử lý một yêu cầu API" (ba giai đoạn: xác thực → ủy quyền → kiểm soát tiếp nhận), §"Xác thực với kubectl" (file kubeconfig, context = cluster + user + namespace, biến \`KUBECONFIG\` gộp nhiều file, và các lệnh con \`kubectl config current-context\`/\`use-context\`/\`set-credentials\` để đọc và sửa kubeconfig mà không cần mở file thủ công), và §"Ủy quyền với kiểm soát truy cập dựa trên vai trò" (ba khối RBAC: subject, resource, verb; Role/RoleBinding theo namespace; \`kubectl auth can-i\`).

**Bẫy.** Đảo thứ tự hai giai đoạn đầu trong đầu — sách xếp rõ xác thực trước, ủy quyền sau: một request có bearer token sai bị chặn ngay ở giai đoạn một, trước khi RBAC kịp can thiệp; còn một request đã xác thực hợp lệ nhưng không đủ quyền vẫn bị chặn ở giai đoạn hai. Bẫy thứ hai: tưởng RoleBinding tự áp dụng lên mọi namespace. Role và RoleBinding chỉ có hiệu lực trong namespace bạn tạo chúng — cần ClusterRole/ClusterRoleBinding cho phạm vi cluster hoặc cho tài nguyên không thuộc namespace như node, CRD.

**Tự kiểm tra.** Một lệnh \`kubectl get replicasets\` trả về \`Error from server (Forbidden): ... cannot list resource "replicasets"\`. Request đã qua được giai đoạn nào, và bị chặn ở giai đoạn nào? Lệnh nào tra nhanh toàn bộ quyền hiện có của một user cụ thể mà không cần thử từng verb?`,
      },
      {
        id: "cb-w2-3",
        text: "Service Account, kiểm soát tiếp nhận, Operator và CRD",
        lesson: `**Mục tiêu.** Gán được Service Account tuỳ chỉnh cho Pod, cấp đúng Role/RoleBinding tối thiểu để nó gọi API thành công, và tự cài một Operator rồi tạo Custom Resource từ CRD nó cung cấp.

**Đọc.** [CKA Book 06](#/docs/ckabook-06) §"Làm việc với Service Account" (service account mặc định chỉ có quyền \`system:discovery\`, gắn service account tuỳ chỉnh cho Pod qua \`spec.serviceAccountName\`, token tự mount tại \`/var/run/secrets/kubernetes.io/serviceaccount/token\`), §"Kiểm soát tiếp nhận" (giai đoạn ba của xử lý request, plugin như \`NamespaceLifecycle\`, \`PodSecurity\`) và §"Trọng tâm cho kỳ thi" của chương 6. Sang [CKA Book 07](#/docs/ckabook-07) §"Làm việc với Operator" (mẫu operator = CRD + controller, cài qua OLM hoặc Helm) và §"Làm việc với Custom Resource Definition" (khám phá bằng \`kubectl get crds\`/\`describe crd\`, CRUD trên CR như một object bình thường).

**Bẫy.** Giả định service account mặc định (\`default\`) có quyền đọc cluster. Sách chỉ rõ nó chỉ ngang một user chưa xác thực — không liệt kê hay sửa được bất kỳ tài nguyên nào ngoài Role \`system:discovery\`; một Pod gọi API bằng service account \`default\` sẽ luôn nhận lỗi Forbidden cho tới khi bạn gắn Role/RoleBinding riêng. Bẫy thứ hai: nghĩ kỳ thi bắt bạn hiện thực controller cho CRD. Sách nói rõ việc hiện thực controller nằm ngoài phạm vi thi — bạn chỉ cần biết khám phá schema và CRUD trên Custom Resource bằng \`kubectl\`.

**Tự kiểm tra.** Một Pod dùng service account \`sa-api\` gọi API và nhận lỗi \`"pods is forbidden: User \\"system:serviceaccount:k97:sa-api\\" cannot list resource"\`. Bạn cần tạo hai object RBAC nào, đúng tên loại, để sửa lỗi này? Lệnh nào liệt kê mọi CRD đã cài trên cluster?`,
      },
      {
        id: "cb-w2-4",
        text: "Helm và Kustomize — khác nhau ở đâu và gõ lệnh nào",
        lesson: `**Mục tiêu.** Cài, cấu hình và nâng cấp được một Helm chart có sẵn bằng đúng chuỗi lệnh thêm repo, tìm phiên bản, cài đặt, nâng cấp; và chọn đúng công cụ — Helm hay Kustomize — khi đề bài mô tả một tình huống cụ thể.

**Đọc.** [CKA Book 08](#/docs/ckabook-08) §"Làm việc với Helm" (quy trình bảy bước: xác định chart, thêm repo, cài đặt với \`--version\`/\`--set\`/\`--values\`, liệt kê, nâng cấp, gỡ cài đặt) và §"Làm việc với Kustomize" (file \`kustomization.yaml\` bắt buộc, hai chế độ \`kubectl kustomize\` để xem trước và \`kubectl apply -k\` để tạo object thật, ba trường hợp dùng: kết hợp manifest, sinh từ nguồn khác, thêm cấu hình chung). Chốt lại bằng §"Những khác biệt chính giữa Helm và Kustomize".

**Bẫy.** Cài chart mà không khoá phiên bản. Sách minh hoạ đúng tình huống: phiên bản chart mới nhất có lỗ hổng bảo mật, nên bạn luôn cần cờ \`--version\` khi \`helm install\`/\`helm upgrade\` thay vì để Helm tự chọn bản mới nhất. Bẫy thứ hai: quên \`helm repo update\` trước khi tìm phiên bản mới — \`helm search repo\` chỉ đọc cache cục bộ, không tự động gọi mạng. Bẫy thứ ba, phân biệt công cụ: Kustomize đã có sẵn trong \`kubectl\`, không cần cài thêm và không cần đóng gói thành archive; Helm cần cài file thực thi riêng và đóng gói chart thành TAR để phân phối.

**Tự kiểm tra.** Viết đủ bốn lệnh Helm theo đúng thứ tự để cài một chart tên \`jenkins\` từ repo \`jenkinsci\` ở đúng phiên bản \`5.8.25\`, không dùng bản mới nhất. Lệnh nào chỉ hiển thị kết quả Kustomize sinh ra trên console mà không tạo object thật?`,
      },
    ],
  },
  {
    id: "cb-w3",
    week: "Tuần 3",
    title: "Pod, cấu hình, Deployment và scale",
    goal: "Tạo và sửa được bốn primitive này hoàn toàn bằng lệnh mệnh lệnh, không mở trình soạn thảo trừ khi bắt buộc.",
    practice: "Làm **Bài tập mẫu** cuối cả bốn chương 9–12, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bấm giờ 6 phút mỗi bài.",
    resources: [
      { label: "CKA Book 09 — Pod và Namespace", href: "#/docs/ckabook-09" },
      { label: "CKA Book 10 — ConfigMap và Secret", href: "#/docs/ckabook-10" },
      { label: "CKA Book 11 — Deployment và ReplicaSet", href: "#/docs/ckabook-11" },
      { label: "CKA Book 12 — Scale workload", href: "#/docs/ckabook-12" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
    ],
    items: [
      {
        id: "cb-w3-1",
        text: "Pod và namespace ở tốc độ mệnh lệnh",
        lesson: `**Mục tiêu.** Tạo, kiểm tra, exec vào, và xoá một Pod trong một namespace cụ thể bằng toàn bộ lệnh mệnh lệnh, không mở YAML trừ khi câu hỏi yêu cầu cấu hình mà \`kubectl run\` không hỗ trợ qua cờ.

**Đọc.** [CKA Book 09](#/docs/ckabook-09) §"Làm việc với Pod" — trọn mục này, từ \`kubectl run\` với các cờ quan trọng, các pha vòng đời Pod, \`kubectl logs\`/\`exec\`, Pod tạm thời với \`--rm -it --restart=Never\`, IP Pod, đến khai báo biến môi trường và \`command\`/\`args\`. Rồi §"Làm việc với Namespace" (liệt kê, tạo, đặt namespace ưu tiên bằng \`kubectl config set-context --current --namespace=...\`, xoá namespace lan truyền xuống mọi object bên trong) và §"Trọng tâm cho kỳ thi".

**Bẫy.** Quên đặt namespace cố định trước khi làm câu hỏi. Sách nhấn mạnh hầu hết câu hỏi thi chỉ định một namespace không phải \`default\` — quên \`-n\` hoặc quên \`set-context --current --namespace=\` nghĩa là bạn có thể tạo đúng object nhưng sai chỗ, và mất điểm dù logic đúng. Bẫy thứ hai: nhầm \`command\` và \`args\` với \`ENTRYPOINT\`/\`CMD\` của image — \`command\` ghi đè \`ENTRYPOINT\`, \`args\` thay thế \`CMD\`. Bẫy thứ ba: xoá một namespace kéo theo xoá toàn bộ object bên trong nó, không có bước xác nhận nào trước khi lệnh chạy.

**Tự kiểm tra.** Viết một lệnh \`kubectl run\` duy nhất tạo Pod \`hazelcast\` với image, port, một biến môi trường và hai label, không dùng YAML. Lệnh nào đặt \`code-red\` làm namespace cố định cho context hiện tại, để các lệnh sau không cần \`-n\` nữa?`,
      },
      {
        id: "cb-w3-2",
        text: "ConfigMap và Secret: các cách đưa cấu hình vào container",
        lesson: `**Mục tiêu.** Tạo ConfigMap/Secret bằng đúng cờ nguồn dữ liệu — \`--from-literal\`, \`--from-file\`, \`--from-env-file\` — tương ứng với định dạng dữ liệu đề bài đưa ra, và gắn chúng vào Pod bằng cả hai cách: biến môi trường và volume.

**Đọc.** [CKA Book 10](#/docs/ckabook-10) §"Làm việc với ConfigMap" (bốn tuỳ chọn nguồn dữ liệu, dùng làm biến môi trường qua \`envFrom.configMapRef\`, mount làm volume chỉ đọc) và §"Làm việc với Secret" (Secret chỉ encode Base64 chứ không mã hoá, \`stringData\` so với \`data\`, các loại chuyên biệt như \`kubernetes.io/basic-auth\`) rồi §"Trọng tâm cho kỳ thi".

**Bẫy.** Tin rằng Secret mã hoá dữ liệu vì cái tên "Secret". Sách nói thẳng: giá trị chỉ được encode Base64, ai có quyền đọc object đều decode được bằng một lệnh \`base64\` — không nên coi Secret là đủ an toàn để bỏ qua kiểm soát truy cập, và tuyệt đối không commit manifest Secret vào kho mã nguồn cùng các file khác. Bẫy thứ hai: nhầm \`--from-env-file\` với \`--from-file\`. \`--from-env-file\` kỳ vọng file dạng \`KEY=value\` mỗi dòng và tách thành nhiều key riêng; \`--from-file\` nạp toàn bộ nội dung file làm giá trị của một key duy nhất (tên key chính là tên file) — dùng sai cờ cho một file JSON cấu hình sẽ tạo ra ConfigMap sai cấu trúc hoàn toàn.

**Tự kiểm tra.** Bạn có một file \`db.env\` chứa \`DB_HOST=mysql\` và \`DB_USER=admin\`. Cờ nào tạo ra ConfigMap với hai key riêng biệt, và cờ nào thay vào đó sẽ nhét cả file thành một key \`db.env\` duy nhất? Viết đủ lệnh \`kubectl create secret generic\` tạo Secret \`db-creds\` với \`pwd=s3cre!\` từ giá trị literal.`,
      },
      {
        id: "cb-w3-3",
        text: "Deployment: rolling update, rollback và thay thế replica",
        lesson: `**Mục tiêu.** Rollout một image mới bằng \`kubectl set image\`, gán nguyên nhân thay đổi, đọc lịch sử revision, và rollback về đúng revision cần thiết — toàn bộ trong dưới ba phút.

**Đọc.** [CKA Book 11](#/docs/ckabook-11) §"Làm việc với Deployment" (quan hệ Deployment → ReplicaSet → Pod, ba chỗ label selector phải khớp: \`metadata.labels\`, \`spec.selector.matchLabels\`, \`spec.template.metadata.labels\`), §"Thay thế replica" (ReplicaSet tự tạo lại Pod bị xoá — tính self-healing), §"Thực hiện rolling update và rollback" (năm cách cập nhật Pod template, \`rollout status\`/\`history\`/\`undo --to-revision\`, annotation \`kubernetes.io/change-cause\`), và §"Trọng tâm cho kỳ thi".

**Bẫy.** Sửa \`metadata.labels\` ở cấp Deployment để "cho khớp" khi tạo object thất bại vì lỗi selector. Sách chỉ rõ chỉ \`spec.selector.matchLabels\` mới cần khớp với \`spec.template.metadata.labels\` — \`metadata.labels\` ở cấp Deployment không hề tham gia vào việc chọn Pod template, đổi nó không giải quyết được gì. Bẫy thứ hai: xoá tay từng Pod để "restart" ứng dụng — ReplicaSet lập tức tạo Pod thay thế, nên thao tác đó vô nghĩa và tốn thời gian; muốn đổi phiên bản ứng dụng, bạn phải sửa Pod template chứ không phải xoá Pod. Bẫy thứ ba: \`rollout undo\` không khôi phục dữ liệu bền vững — nó chỉ hoàn nguyên \`spec.template\`, các cấu hình khác như số replica giữ nguyên.

**Tự kiểm tra.** Viết đủ lệnh cập nhật image container \`nginx\` của Deployment \`web-server\` thành \`nginx:1.25.2\` theo cách mệnh lệnh nhanh nhất, không dùng \`edit\` hay YAML. Lệnh nào rollback Deployment \`app-cache\` về đúng revision 1, không phải revision liền trước?`,
      },
      {
        id: "cb-w3-4",
        text: "Scale thủ công và autoscaling",
        lesson: `**Mục tiêu.** Scale thủ công một Deployment/StatefulSet bằng một lệnh, và tạo được một HorizontalPodAutoscaler hoạt động thật — nghĩa là không bị kẹt ở \`<unknown>\` vì thiếu điều kiện tiên quyết.

**Đọc.** [CKA Book 12](#/docs/ckabook-12) §"Scale workload thủ công" (\`kubectl scale deployment/statefulset --replicas=\`), §"Autoscaling workload" (ba điều kiện tiên quyết của HPA: Metrics Server, resource request CPU/memory trên container, đủ tài nguyên cluster; lệnh \`kubectl autoscale deployment --cpu-percent --min --max\`; HPA chỉ scale được Deployment/ReplicaSet/StatefulSet, không scale Pod độc lập), và §"Trọng tâm cho kỳ thi".

**Bẫy.** Tạo HPA mà quên định nghĩa \`resources.requests.cpu\` (hoặc \`.memory\`) trên Pod template. Sách minh hoạ đúng hậu quả: cột \`TARGETS\` của \`kubectl get hpa\` hiển thị \`<unknown>/80%\` mãi mãi vì HPA không có đường cơ sở để tính phần trăm sử dụng — object HPA tồn tại nhưng không bao giờ scale. Bẫy thứ hai: nghĩ \`kubectl autoscale\` cấu hình được ngưỡng memory. Lệnh mệnh lệnh này chỉ có cờ \`--cpu-percent\`; muốn scale theo memory hoặc nhiều metric cùng lúc, bạn buộc phải viết manifest YAML với mảng \`spec.metrics\`. Bẫy thứ ba: quên rằng HPA không tự scale một Pod đứng riêng — nó chỉ nhắm tới \`scaleTargetRef\` là một tài nguyên có thể scale.

**Tự kiểm tra.** Deployment \`nginx\` có một replica, chưa có \`resources.requests\`. Bạn tạo HPA \`nginx-hpa\` với \`--cpu-percent=80 --min=3 --max=8\`. \`kubectl get hpa\` sẽ hiển thị gì ở cột \`TARGETS\`, và vì sao? Viết đủ lệnh sửa vấn đề đó bằng cách scale thủ công trong lúc chờ.`,
      },
    ],
  },
  {
    id: "cb-w4",
    week: "Tuần 4",
    title: "Tài nguyên, lập lịch và lưu trữ",
    goal: "Đặt được Pod lên đúng node bằng ba cơ chế khác nhau, và nối được một PVC vào Pod từ con số không.",
    practice: "Làm **Bài tập mẫu** cuối chương 13–16, đối chiếu [Phụ lục A](#/docs/ckabook-A). Bài chương 14 làm trên cluster nhiều node — chương có hướng dẫn dựng sẵn ở §\"Thiết lập cluster phát triển nhiều node\".",
    resources: [
      { label: "CKA Book 13 — Yêu cầu tài nguyên, giới hạn và quota", href: "#/docs/ckabook-13" },
      { label: "CKA Book 14 — Lập lịch Pod", href: "#/docs/ckabook-14" },
      { label: "CKA Book 15 — Volume", href: "#/docs/ckabook-15" },
      { label: "CKA Book 16 — Persistent Volume", href: "#/docs/ckabook-16" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
    ],
    items: [
      {
        id: "cb-w4-1",
        text: "requests/limits, ResourceQuota và LimitRange",
        lesson: `**Mục tiêu.** Viết đúng cú pháp resource request/limit cho container, và dự đoán được hành vi runtime khi một Pod chạm ResourceQuota hoặc bị LimitRange biến đổi (mutate) — không cần thử-sai trên cluster thật.

**Đọc.** [CKA Book 13](#/docs/ckabook-13) §"Làm việc với yêu cầu tài nguyên" (bốn thuộc tính requests/limits, cách scheduler cộng tổng request để so với dung lượng node, thông báo lỗi \`PodExceedsFreeCPU\`/\`PodExceedsFreeMemory\`), §"Làm việc với ResourceQuota" (giới hạn cứng cộng dồn ở cấp namespace — số object, tổng CPU/memory — đọc bằng \`kubectl describe resourcequota\`) và §"Làm việc với LimitRange" (ràng buộc và giá trị mặc định ở cấp object đơn lẻ, annotation \`kubernetes.io/limit-ranger\` đánh dấu Pod đã bị mutate).

**Bẫy.** Nghĩ ResourceQuota có thể ràng buộc từng Pod riêng lẻ — nó chỉ cộng dồn ở cấp namespace; muốn ép min/max hoặc gán mặc định cho một object đơn lẻ phải dùng LimitRange, hai primitive không thay thế nhau. Bẫy thứ hai: thông báo lỗi của ResourceQuota nêu đúng tên object đang chặn (ví dụ "failed quota: awesome-quota"), còn thông báo lỗi của LimitRange thì không — bạn phải chủ động chạy \`kubectl get limitranges\` mới biết ràng buộc nào đang thực thi. Bẫy thứ ba: tạo hai LimitRange trong cùng một namespace khiến giá trị mặc định được chọn không xác định (nondeterministic) — sách khuyến cáo chỉ nên có một LimitRange mỗi namespace.

**Tự kiểm tra.** Viết đủ lệnh xem bảng \`Used\`/\`Hard\` hiện tại của ResourceQuota \`awesome-quota\` trong namespace \`team-awesome\`, và đủ lệnh xem bảng \`Min\`/\`Max\`/\`Default Request\`/\`Default Limit\` của LimitRange \`cpu-resource-constraint\`. Cột nào trong đầu ra lệnh đầu cho biết mức tài nguyên đang tiêu thụ thực tế, khác với cột nào chỉ lặp lại đúng giá trị bạn đã khai trong manifest?`,
      },
      {
        id: "cb-w4-2",
        text: "Thuật toán lập lịch và node affinity",
        lesson: `**Mục tiêu.** Giải thích đúng hai bước lọc/chấm điểm của scheduler, và viết được node affinity thay cho node selector khi đề bài cần biểu thức OR hoặc một ưu tiên mềm thay vì một yêu cầu cứng duy nhất.

**Đọc.** [CKA Book 14](#/docs/ckabook-14) §"Thuật toán lập lịch Pod" (hai bước filtering rồi scoring; Pod ở lại trạng thái chưa lập lịch nếu không node nào qua được bước lọc), §"Các tùy chọn lập lịch Pod" (bốn khái niệm — node selector, node affinity/anti-affinity, taint/toleration, ràng buộc phân bố topology — và khi nào chọn cái nào) và §"Làm việc với node affinity và anti-affinity" (\`spec.affinity.nodeAffinity\`, hai loại \`requiredDuringSchedulingIgnoredDuringExecution\`/\`preferredDuringSchedulingIgnoredDuringExecution\`, các toán tử \`In\`/\`NotIn\`/\`Exists\`/\`DoesNotExist\`/\`Gt\`/\`Lt\`).

**Bẫy.** Coi \`preferredDuringSchedulingIgnoredDuringExecution\` là một ràng buộc cứng — đây là ưu tiên mềm, scheduler cố gắng tuân thủ nhưng không đảm bảo, khác hẳn tiền tố \`requiredDuringScheduling\` biểu đạt yêu cầu bắt buộc. Bẫy thứ hai: hậu tố \`IgnoredDuringExecution\` trên cả hai loại nghĩa là quy tắc chỉ được đánh giá tại thời điểm lập lịch — sửa label node hoặc sửa affinity của Pod sau khi Pod đã chạy không kích hoạt lập lịch lại, Pod cứ đứng yên dù không còn thoả điều kiện. Bẫy thứ ba: dùng node selector khi đề bài cần "node A HOẶC node B" — node selector chỉ khớp chính xác một tập key-value, phải chuyển sang node affinity với toán tử \`In\` và danh sách nhiều value mới biểu đạt được logic OR.

**Tự kiểm tra.** Viết đoạn \`spec.affinity.nodeAffinity\` với yêu cầu cứng để Pod chỉ chạy trên node có label \`disk=ssd\` hoặc \`disk=hdd\`, dùng đúng toán tử. Nếu bạn đổi toán tử đó thành \`NotIn\` với cùng danh sách value, tập node mà Pod có thể được lập lịch lên thay đổi ra sao?`,
      },
      {
        id: "cb-w4-3",
        text: "Taint, toleration và ràng buộc phân bố topology",
        lesson: `**Mục tiêu.** Gán taint đúng cú pháp ba phần \`key=value:effect\`, viết toleration khớp chính xác để "mở khoá" một node bị taint, và cấu hình topology spread constraint phân bố Pod đều trên các zone.

**Đọc.** [CKA Book 14](#/docs/ckabook-14) §"Làm việc với taint và toleration" (ba effect \`NoSchedule\`/\`PreferNoSchedule\`/\`NoExecute\`, lệnh \`kubectl taint\`, taint mặc định \`node-role.kubernetes.io/control-plane:NoSchedule\` trên node control plane), §"Làm việc với ràng buộc phân bố topology của Pod" (\`spec.topologySpreadConstraints\`, \`maxSkew\`, \`topologyKey\`, \`whenUnsatisfiable\`) và §"Trọng tâm cho kỳ thi" của chương.

**Bẫy.** Nhầm taint/toleration với node affinity như hai cách làm cùng một việc — taint đẩy Pod ra khỏi node theo mặc định (cô lập node), còn node affinity/anti-affinity kéo hoặc đẩy Pod dựa trên lựa chọn của chính Pod; một node bị taint vẫn nhận được Pod không hề định nghĩa affinity nào, miễn Pod đó có toleration khớp. Bẫy thứ hai: quên trường \`effect\` trong toleration — thiếu nó, toleration không khớp bất kỳ taint nào trừ khi bạn dùng toán tử \`Exists\` không kèm \`value\`, và ngay cả khi đó sách vẫn khuyến nghị luôn khai báo effect tường minh. Bẫy thứ ba: hiểu nhầm ràng buộc phân bố topology tự cân bằng lại Pod cũ — nó chỉ tác động đến Pod mới được lập lịch, không di chuyển Pod đang chạy, và một ràng buộc quá chặt có thể khiến Pod mới kẹt ở trạng thái chưa lập lịch nếu tài nguyên hạn chế.

**Tự kiểm tra.** Viết đủ lệnh \`kubectl taint\` gán taint \`special=true:NoSchedule\` cho node \`multi-node-m02\`, rồi viết đoạn YAML toleration khớp chính xác taint đó. Effect nào trong ba effect taint vừa chặn lập lịch Pod mới vừa trục xuất Pod đang chạy sẵn trên node?`,
      },
      {
        id: "cb-w4-4",
        text: "Volume, PersistentVolume, PVC và StorageClass",
        lesson: `**Mục tiêu.** Đi trọn chuỗi bốn bước — tạo volume tạm thời, tạo PersistentVolume tĩnh, tạo PersistentVolumeClaim gắn kết với nó, rồi mount PVC vào Pod — và biết lúc nào nên chuyển sang cung cấp động bằng StorageClass thay vì tự tạo PV.

**Đọc.** [CKA Book 15](#/docs/ckabook-15) §"Các loại Volume" (bảng rút gọn: \`emptyDir\`, \`hostPath\`, \`configMap\`/\`secret\`, \`nfs\`, \`persistentVolumeClaim\`) và §"Tạo và truy cập Volume" (hai bước bắt buộc — khai \`spec.volumes[]\` rồi mount qua \`spec.containers[].volumeMounts[]\`, ánh xạ theo tên khớp). Sang [CKA Book 16](#/docs/ckabook-16) §"Cung cấp tĩnh và cung cấp động" (khác biệt cốt lõi: tự tạo object PV so với để storage class tự cung cấp), §"Tạo PersistentVolume" (chỉ tạo được theo cách manifest-first, không có lệnh mệnh lệnh riêng cho PV như \`kubectl create persistentvolume\`), §"Tạo PersistentVolumeClaim" (\`storageClassName: ""\` để ép cung cấp tĩnh), §"Mount PersistentVolumeClaim trong Pod" (\`spec.volumes[].persistentVolumeClaim.claimName\`) và §"Storage Class" (provisioner bắt buộc, gán \`spec.storageClassName\` trong PVC để bật cung cấp động).

**Bẫy.** Quên chuỗi ánh xạ tên hai tầng: PV không mount trực tiếp vào Pod — Pod chỉ tham chiếu PVC theo tên qua \`claimName\`, còn PVC chỉ gắn kết một-một với PV thoả cả dung lượng, access mode lẫn storage class. Bẫy thứ hai: để trống \`storageClassName\` khi muốn cung cấp tĩnh trong khi cluster có sẵn storage class mặc định — PVC sẽ tự động chuyển sang cung cấp động thay vì chờ PV bạn tạo tay, trừ khi bạn đặt tường minh chuỗi rỗng \`""\`. Bẫy thứ ba: gán cho PVC một storage class mà provisioner không thể cung cấp được — Kubernetes không báo lỗi hay cảnh báo, PVC chỉ đứng yên ở trạng thái \`Pending\` mãi mãi.

**Tự kiểm tra.** Bạn tạo một PVC với \`storageClassName: standard\` nhưng không có PV tĩnh nào phù hợp và provisioner cũng không cung cấp động được. PVC sẽ hiển thị trạng thái gì? Viết đúng thuộc tính YAML mà một Pod dùng để tham chiếu tới PVC tên \`db-pvc\`.`,
      },
    ],
  },
  {
    id: "cb-w5",
    week: "Tuần 5",
    title: "Service, Ingress, Gateway API và NetworkPolicy",
    goal: "Chọn đúng loại Service cho một yêu cầu mô tả bằng lời, và viết được NetworkPolicy chặn đúng chiều cần chặn.",
    practice: "Làm **Bài tập mẫu** cuối chương 17–20, đối chiếu [Phụ lục A](#/docs/ckabook-A). Sau khi xong bài chương 20, thử xoá policy và kiểm lại bằng Pod tạm — thấy tận mắt cluster mặc định cho mọi Pod nói chuyện với nhau.",
    resources: [
      { label: "CKA Book 17 — Service", href: "#/docs/ckabook-17" },
      { label: "CKA Book 18 — Ingress", href: "#/docs/ckabook-18" },
      { label: "CKA Book 19 — Gateway API", href: "#/docs/ckabook-19" },
      { label: "CKA Book 20 — Network Policy", href: "#/docs/ckabook-20" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
      { label: "kubernetes.io — Network Policies", href: "https://kubernetes.io/docs/concepts/services-networking/network-policies/" },
    ],
    items: [
      {
        id: "cb-w5-1",
        text: "Service: ClusterIP, NodePort và LoadBalancer",
        lesson: `**Mục tiêu.** Chọn đúng loại Service — ClusterIP, NodePort hay LoadBalancer — khi đề bài chỉ mô tả yêu cầu bằng lời, và tự tay tạo cả ba loại bằng cả cách mệnh lệnh lẫn manifest YAML trong vài phút.

**Đọc.** [CKA Book 17](#/docs/ckabook-17) §"Làm việc với Service" (lựa chọn label thay cho địa chỉ IP không ổn định, ánh xạ \`port\`/\`targetPort\`, ba cách tạo bằng \`kubectl create service\`/\`kubectl run --expose\`/\`kubectl expose deployment\`), §"Loại Service ClusterIP" (mặc định, chỉ truy cập được từ trong cluster, khám phá qua DNS và biến môi trường), §"Loại Service NodePort" (port 30000–32767 trên mọi node, kế thừa hành vi ClusterIP) và §"Loại Service LoadBalancer" (IP ngoài do cloud cấp, kế thừa cả hai loại trên), cùng §"Trọng tâm cho kỳ thi".

**Bẫy.** Coi ba loại Service là ba lựa chọn tách biệt thay vì một chuỗi kế thừa — một Service NodePort vẫn truy cập được qua ClusterIP từ trong cluster, và một Service LoadBalancer vẫn mang đủ hành vi của cả ClusterIP lẫn NodePort; đề bài yêu cầu "truy cập được từ trong cluster" không tự động loại hai loại kia. Bẫy thứ hai: dùng NodePort cho production vì tưởng nó "công khai ra ngoài" là đủ — sách chỉ rõ nó không cân bằng tải qua nhiều node, port thường được cấp phát động nên khó đoán trước, và mở rộng bề mặt tấn công; NodePort chủ yếu dành cho dev/test. Bẫy thứ ba: gọi Service từ Pod ở namespace khác chỉ bằng tên ngắn — DNS ngắn chỉ phân giải trong cùng namespace, xuyên namespace phải thêm hậu tố \`.<namespace>\`.

**Tự kiểm tra.** Viết đủ hai lệnh mệnh lệnh tạo một Pod chạy image cho trước và một Service loại NodePort ánh xạ port 5005 vào container port 8080, gán nhãn \`app=echoserver\`. Từ một Pod tạm trong namespace \`other\`, lệnh \`wget\` nào gọi đúng tới Service \`echoserver\` đang chạy ở namespace \`default\` bằng tên DNS đầy đủ?`,
      },
      {
        id: "cb-w5-2",
        text: "Ingress và luật định tuyến theo host/path",
        lesson: `**Mục tiêu.** Viết một Ingress định tuyến nhiều đường dẫn URL tới nhiều Service backend khác nhau trên cùng một host, và chẩn đoán đúng khi \`describe ingress\` báo lỗi backend không tìm thấy endpoint.

**Đọc.** [CKA Book 18](#/docs/ckabook-18) §"Làm việc với Ingress" — trọn mục, từ lý do Ingress thay thế nhiều Service LoadBalancer tốn kém, cài Ingress controller (Pod trong namespace riêng phải ở trạng thái \`Running\`), \`spec.ingressClassName\` khi có nhiều controller, ba thành phần một quy tắc (host tuỳ chọn, danh sách path, backend service:port), đến hai loại đường dẫn \`Exact\`/\`Prefix\` và cách xử lý sự cố bằng \`kubectl describe ingress\` — và §"Trọng tâm cho kỳ thi".

**Bẫy.** Nhầm Ingress với Service — Ingress chỉ định tuyến lưu lượng HTTP(S) từ bên ngoài dựa trên host và path tới các Service \`ClusterIP\` có sẵn, nó không tự tạo hay thay thế Service. Bẫy thứ hai: quên rằng Ingress không hoạt động nếu chưa cài Ingress controller — quy tắc Ingress vẫn được API chấp nhận nhưng không được thực thi cho tới khi có Pod controller chạy; đề thi giả định controller đã được cài sẵn. Bẫy thứ ba, dễ mất điểm nhất: nhầm lẫn \`Exact\` và \`Prefix\` ở dấu gạch chéo cuối — path \`Exact: /app\` không khớp \`/app/\`, trong khi \`Prefix: /app\` khớp cả \`/app/\` lẫn \`/application\`; chọn sai loại khiến một URL hợp lệ trả về 404 dù backend hoàn toàn khoẻ mạnh.

**Tự kiểm tra.** Viết đủ lệnh \`kubectl create ingress\` tạo một Ingress tên \`next-app\` với hai quy tắc trên host \`next.example.com\`: đường dẫn \`/app\` tới Service \`app-service:8080\` và đường dẫn \`/metrics\` tới Service \`metrics-service:9090\`. Nếu \`kubectl describe ingress\` báo \`<error: endpoints "app-service" not found>\`, nguyên nhân nhiều khả năng nhất là gì?`,
      },
      {
        id: "cb-w5-3",
        text: "Gateway API và đường chuyển từ Ingress",
        lesson: `**Mục tiêu.** Dựng được chuỗi bốn object của Gateway API — GatewayClass, Gateway, HTTPRoute, và Service backend — để định tuyến lưu lượng HTTP theo path, và nói được lý do Gateway API ra đời thay vì mở rộng thêm Ingress.

**Đọc.** [CKA Book 19](#/docs/ckabook-19) §"Tại sao primitive Ingress chưa đủ?" (hai hạn chế cốt lõi: annotation không khả chuyển giữa các Ingress controller, và mô hình phân quyền không đủ cho môi trường đa người thuê), §"Làm việc với Gateway API" (bốn loại tài nguyên GatewayClass/Gateway/HTTPRoute-GRPCRoute/ReferenceGrant, thiết kế hướng vai trò, cài CRD, tạo GatewayClass rồi Gateway rồi HTTPRoute) và §"Chuyển đổi từ Ingress sang Gateway API" (chuyển dần theo giai đoạn, công cụ ingress2gateway chỉ cần biết cho đủ, không cần dùng thi).

**Bẫy.** Tưởng phải luôn tự tạo GatewayClass — sách nhắc rõ các cluster của nhà cung cấp cloud thường đã có sẵn GatewayClass, kiểm tra bằng \`kubectl get gatewayclasses\` trước khi tạo mới để khỏi trùng lặp không cần thiết. Bẫy thứ hai: quên rằng các CRD của Gateway API chưa nằm trong API chuẩn của Kubernetes — phải \`apply\` bộ CRD trước, nếu không object \`Gateway\`/\`HTTPRoute\` sẽ báo lỗi "no matches for kind". Bẫy thứ ba: nhầm vai trò ba loại tài nguyên — GatewayClass do nhà cung cấp nền tảng khai báo, Gateway/ReferenceGrant do quản trị viên cluster tạo, còn HTTPRoute là việc của nhà phát triển ứng dụng; gán nhầm chỗ dễ khiến bạn tạo sai đối tượng khi đề bài mô tả một vai trò cụ thể.

**Tự kiểm tra.** Liệt kê đúng thứ tự bốn loại tài nguyên bạn phải tạo (không tính CRD) để một request HTTP đi từ bên ngoài tới một Service tên \`web\` trên port 3000. Trường nào trong HTTPRoute xác định host mà quy tắc định tuyến áp dụng, và trường nào chọn loại khớp path là tiền tố?`,
      },
      {
        id: "cb-w5-4",
        text: "NetworkPolicy: mặc định mở, đóng bằng tay",
        lesson: `**Mục tiêu.** Viết một NetworkPolicy chặn đúng một chiều lưu lượng theo yêu cầu đề bài, và giải thích được vì sao mặc định mọi Pod trong cluster nói chuyện được với nhau cho tới khi có policy đầu tiên chọn trúng chúng.

**Đọc.** [CKA Book 20](#/docs/ckabook-20) §"Làm việc với Network Policy" — trọn mục: hành vi mặc định cho phép giao tiếp Pod-với-Pod không hạn chế xuyên namespace, network policy controller (không phải mọi CNI đều có, ví dụ flannel không thực thi), cấu trúc \`podSelector\`/\`policyTypes\`/\`ingress\`/\`egress\`, các thuộc tính \`podSelector\`/\`namespaceSelector\` trong \`from\`/\`to\`, policy \`default-deny-all\` với \`podSelector: {}\`, và giới hạn theo port — cùng §"Trọng tâm cho kỳ thi".

**Bẫy.** Tin rằng network policy có thể chọn hoặc chặn theo Service — sách nói thẳng network policy hoàn toàn không liên quan tới Service, mọi quy tắc gắn với namespace và Pod cụ thể qua label selector. Bẫy thứ hai, bẫy khó nhận ra nhất trong cả chương: một khi bất kỳ network policy nào chọn trúng một Pod theo \`podSelector\`, Pod đó lập tức bị cô lập theo hướng mà \`policyTypes\` liệt kê — chỉ còn nhận đúng lưu lượng được cho phép tường minh, kể cả khi policy đó chỉ định nghĩa \`ingress\` mà không hề nhắc tới \`egress\`. Bẫy thứ ba: quên rằng network policy có tính cộng dồn (additive) — nhiều policy cùng chọn một Pod thì hợp lại bằng phép OR, không phải AND, nên không thể dùng một policy để "thu hẹp" quyền một policy khác đã mở.

**Tự kiểm tra.** Viết đủ manifest YAML một NetworkPolicy tên \`default-deny-all\` cấm toàn bộ ingress và egress cho mọi Pod trong namespace \`internal-tools\`. Nếu sau đó bạn thêm một NetworkPolicy thứ hai chỉ cho phép ingress từ Pod có label \`app=consumer\`, Pod đích có egress ra ngoài được không, và vì sao?`,
      },
    ],
  },
  {
    id: "cb-w6",
    week: "Tuần 6",
    title: "Xử lý sự cố (30% đề thi) và tổng duyệt",
    goal: "Đi từ triệu chứng tới nguyên nhân theo một trình tự cố định, không đoán mò — và đóng được mọi khoảng trống còn lại trước ngày thi.",
    practice: "Làm lại **toàn bộ Bài tập mẫu** của 19 chương có bài (ch.4–22), bấm giờ, rồi đối chiếu [Phụ lục A](#/docs/ckabook-A). Ghi lại chương nào còn phải mở sách — đó chính là danh sách ôn của ngày cuối.",
    resources: [
      { label: "CKA Book 21 — Xử lý sự cố ứng dụng", href: "#/docs/ckabook-21" },
      { label: "CKA Book 22 — Xử lý sự cố cluster", href: "#/docs/ckabook-22" },
      { label: "CKA Book A — Đáp án câu hỏi ôn tập", href: "#/docs/ckabook-A" },
      { label: "Ôn lại: giáo trình CKA", href: "#/roadmap/cka" },
      { label: "kubernetes.io — Troubleshooting Clusters", href: "https://kubernetes.io/docs/tasks/debug/debug-cluster/" },
    ],
    items: [
      {
        id: "cb-w6-1",
        text: "Xử lý sự cố Pod và container",
        lesson: `**Mục tiêu.** Đi từ \`kubectl get pods\` tới nguyên nhân gốc rễ của một Pod lỗi theo đúng trình tự sách khuyến nghị — trạng thái, event, rồi log — và biết chọn giữa \`exec\` hay ephemeral container tuỳ image có shell hay không.

**Đọc.** [CKA Book 21](#/docs/ckabook-21) §"Xử lý sự cố Pod" (đọc cột READY/STATUS/RESTARTS, bảng trạng thái lỗi phổ biến \`ImagePullBackOff\`/\`CrashLoopBackOff\`/\`CreateContainerConfigError\`, đọc event bằng \`kubectl describe pod\` khi Pod kẹt ở \`ContainerCreating\` mà không có trạng thái lỗi rõ ràng, và \`kubectl port-forward\` để chạm trực tiếp một Pod nghi vấn) và §"Xử lý sự cố container" (\`kubectl logs\` với \`-f\`/\`--previous\`, mở shell tương tác bằng \`exec\`, và ephemeral container qua \`kubectl debug\` cho image distroless không có \`/bin/sh\`).

**Bẫy.** Nhảy thẳng vào \`exec\` hay \`logs\` khi Pod còn chưa qua khỏi \`ContainerCreating\` — ở giai đoạn đó chưa có container nào chạy để lấy log hay mở shell, thông tin duy nhất nằm trong event, chỉ thấy được qua \`describe pod\`. Bẫy thứ hai: coi \`Running\` đồng nghĩa "ứng dụng hoạt động đúng" — sách nói thẳng một Pod hoàn toàn có thể ở trạng thái \`Running\` trong khi ứng dụng bên trong đã hỏng logic; số lần restart lớn hơn 0 là dấu hiệu cần soi kỹ liveness probe. Bẫy thứ ba: cố \`kubectl exec ... -- /bin/sh\` vào một image distroless — lệnh này chắc chắn lỗi \`stat /bin/sh: no such file\`, công cụ đúng là ephemeral container qua \`kubectl debug -it <pod> --image=busybox\`.

**Tự kiểm tra.** Một Pod hiển thị \`0/1 CrashLoopBackOff\`. Bạn chạy lệnh nào trước để xem lý do container thoát, và cờ nào lấy log của lần khởi động trước nếu container đã restart? Với một Pod chạy image \`k8s.gcr.io/pause:3.1\` không có shell, lệnh \`kubectl debug\` đầy đủ để chèn một ephemeral container \`busybox\` và mở shell tương tác là gì?`,
      },
      {
        id: "cb-w6-2",
        text: "Xử lý sự cố Service/mạng và đọc số liệu tài nguyên",
        lesson: `**Mục tiêu.** Chẩn đoán một Service không định tuyến được lưu lượng theo đúng bốn điểm kiểm sách liệt kê — label selector, ánh xạ port, endpoint, rồi DNS/network policy — và đọc được số liệu CPU/memory bằng \`kubectl top\`.

**Đọc.** [CKA Book 21](#/docs/ckabook-21) §"Xử lý sự cố Service và mạng" (chẩn đoán label selector bằng \`describe service\` đối chiếu \`--show-labels\`, khớp \`targetPort\` với \`containerPort\`, \`kubectl get endpoints\` — không endpoint nghĩa là selector hoặc port sai, phạm vi truy cập theo loại Service, FQDN \`<svc>.<namespace>.svc.cluster.local\` khi gọi xuyên namespace, log CoreDNS, và mô hình "mặc định từ chối" của network policy khiến kết nối thất bại trong im lặng) và §"Kiểm tra số liệu tài nguyên" (Metrics Server là nguồn cho \`kubectl top nodes\`/\`kubectl top pod\`, cần vài phút sau khi cài để có dữ liệu) — cùng §"Trọng tâm cho kỳ thi".

**Bẫy.** Kết luận "Service hỏng" ngay khi \`get endpoints\` trả về rỗng, mà không kiểm tra tiếp xem đó là do label selector không khớp Pod nào hay do \`targetPort\` không khớp \`containerPort\` — hai nguyên nhân khác nhau, cùng một triệu chứng. Bẫy thứ hai: khi một kết nối trước đây chạy tốt bỗng timeout, vội đổ lỗi cho DNS hoặc Service trong khi network policy không hề báo lỗi tường minh — sách nhấn mạnh đây là loại sự cố "thất bại trong im lặng", buộc phải chủ động \`kubectl get networkpolicies\` rồi \`describe\` để loại trừ. Bẫy thứ ba: chạy \`kubectl top pod\` ngay sau khi bật Metrics Server và kết luận cluster không có tải — dữ liệu cần vài phút để thu thập, lỗi \`Metrics API not available\` lúc mới bật không phải sự cố thật.

**Tự kiểm tra.** \`kubectl get endpoints myservice\` trả về danh sách rỗng. Liệt kê đúng thứ tự hai điều bạn kiểm tra tiếp theo, và lệnh \`kubectl\` cho từng bước. Lệnh nào hiển thị mức CPU/memory hiện tại của node \`worker-1\`, và của Pod \`frontend\`?`,
      },
      {
        id: "cb-w6-3",
        text: "Xử lý sự cố node và thành phần control plane",
        lesson: `**Mục tiêu.** Từ một node \`NotReady\`, đi đúng trình tự sách khuyến nghị — \`describe node\` đọc Conditions, rồi SSH kiểm \`systemctl\`/\`journalctl\` — để tìm ra tiến trình hay tài nguyên nào đang gây sự cố, và biết vị trí manifest của static Pod control plane khi một thành phần cluster bị crash.

**Đọc.** [CKA Book 22](#/docs/ckabook-22) §"Kiểm tra trạng thái của các node trong cluster" (STATUS và VERSION lệch nhau là hai chỉ báo sớm), §"Kiểm tra trạng thái của các thành phần trong cluster" (bảy thành phần control plane/node và namespace \`kube-system\` chứa Pod của chúng, ngoại lệ ở managed cluster), §"Xử lý sự cố node" (bốn Condition MemoryPressure/DiskPressure/PIDPressure/Ready qua \`describe node\`, \`systemctl status kubelet\` và \`journalctl -u kubelet\`, gia hạn chứng chỉ bằng \`kubeadm certs check-expiration\`/\`renew all\`, kiểm Pod \`kube-proxy\`) và §"Trọng tâm cho kỳ thi".

**Bẫy.** Thấy Condition nào đó hiển thị \`True\` mà vội yên tâm — với \`MemoryPressure\`/\`DiskPressure\`/\`PIDPressure\`, giá trị \`True\` (hoặc \`Unknown\`) mới là dấu hiệu có vấn đề; chỉ riêng \`Ready\` thì \`True\` mới là trạng thái tốt. Bẫy thứ hai: sửa file YAML trong \`/etc/kubernetes/manifests\` rồi đi tìm lệnh "restart" cho thành phần đó — static Pod không cần lệnh restart, kubelet tự phát hiện thay đổi file và khởi động lại Pod ngay. Bẫy thứ ba: gia hạn xong chứng chỉ bằng \`kubeadm certs renew all\` rồi coi như xong việc — sách nhắc bạn vẫn phải tự khởi động lại kube-apiserver, kube-controller-manager, kube-scheduler và etcd thì các thành phần mới thực sự dùng chứng chỉ mới.

**Tự kiểm tra.** Node \`worker-1\` hiển thị \`NotReady\`. Viết đúng ba lệnh theo thứ tự bạn chạy để đi từ triệu chứng tới việc xác nhận tiến trình kubelet đang dừng. Thư mục nào chứa manifest của các static Pod control plane, và vì sao sửa file trong đó không cần lệnh khởi động lại thủ công?`,
      },
      {
        id: "cb-w6-4",
        text: "Tổng duyệt: chạy lại bài tập 19 chương và đối chiếu đáp án",
        lesson: `**Mục tiêu.** Trong một buổi, chạy lại toàn bộ bài tập mẫu của 19 chương có bài (ch.4–22) dưới áp lực thời gian như phòng thi thật, rồi biến kết quả tự chấm thành danh sách ôn cụ thể cho những ngày còn lại trước kỳ thi — không phải đọc lại sách từ đầu.

**Đọc.** Không có chương mới trong mục này. Tài nguyên duy nhất là [Phụ lục A](#/docs/ckabook-A) — đáp án của toàn bộ 19 chương có bài tập, xếp theo đúng thứ tự chương 4 đến chương 22. Chỉ mở phụ lục này **sau khi** đã tự làm xong bài của một chương; mở trước sẽ biến bài tập thành chép đáp án và làm hỏng mục đích của buổi tổng duyệt.

**Bẫy.** Chỉ làm lại các chương bạn thấy "quen tay" (ví dụ Pod, Deployment) mà bỏ qua các chương ít luyện — nước rút hiệu quả nhất nhắm đúng lĩnh vực trọng số cao và ít được ôn: 30% Xử lý sự cố (ch.21–22) không nằm gọn trong một chương nên dễ bị đánh giá thấp, và Gateway API (ch.19) là nội dung mới nhất trong đề cương nên thường bị bỏ sót. Bẫy thứ hai: đối chiếu Phụ lục A rồi coi một đáp án "gần đúng" là đã thuộc — kỳ thi chấm theo kết quả object thực tế trên cluster (Pod có \`Running\` không, PVC có \`Bound\` không), không chấm theo việc bạn hiểu đúng ý; hãy luôn kiểm bằng \`kubectl get\`/\`describe\` trước khi coi một bài là xong. Bẫy thứ ba: không ghi lại thời gian mỗi bài — nếu không bấm giờ, bạn sẽ không biết chương nào cần luyện thêm tốc độ trước ngày thi thật.

**Tự kiểm tra.** Sau khi làm xong toàn bộ 19 chương và đối chiếu Phụ lục A, liệt kê tên chương của ba bài bạn phải mở sách hoặc tra cứu mới làm được — đó chính là danh sách ưu tiên cho buổi ôn cuối cùng, không phải danh sách để đọc lại từ đầu.`,
      },
    ],
  },
];
