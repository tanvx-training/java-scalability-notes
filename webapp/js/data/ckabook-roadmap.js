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
  // … 3 khối tuần ở Step 3–5, thêm 3 khối nữa ở Task 7 …
];
