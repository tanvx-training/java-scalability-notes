// Lộ trình đọc Kubernetes: Up and Running (ấn bản 3) — Phần 2 (Tuần 6–9).
//
// Nguồn: bản dịch tiếng Việt "Kubernetes: Up and Running", ấn bản 3 — Brendan
// Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson (O'Reilly).
// Thư mục nguồn: sources/kubernetes/kubernetes-up-and-running/
// Sách có bản quyền thương mại, không phải giấy phép mở như CC BY 4.0.
//
// Bốn tuần cuối nặng hơn mặt bằng (12–16k từ/tuần) vì các chương cuối là chủ
// đề nâng cao/tuỳ chọn — giữ nhịp 4 mục/tuần, không tách thành 10 tuần.
// GIỮ NGUYÊN id (ku-w<N> / ku-w<N>-<M>) — tiến độ localStorage lưu theo id này.

export const kuarWeeksPart2 = [
  {
    id: "ku-w6",
    week: "Tuần 6",
    title: "DaemonSet, Job và cấu hình",
    goal: "Chọn đúng controller cho một mô tả công việc, và đưa cấu hình vào ứng dụng mà không nướng cứng nó vào image.",
    practice: `Chạy một DaemonSet giới hạn theo nodeSelector, một CronJob mỗi phút, rồi nạp cùng một tệp cấu hình vào Pod theo cả hai cách của chương 13 (biến môi trường và volume) và so sánh điều gì xảy ra khi ConfigMap đổi.`,
    resources: [
      { label: "KUAR 11 — DaemonSet", href: "#/docs/kuar-11" },
      { label: "KUAR 12 — Job", href: "#/docs/kuar-12" },
      { label: "KUAR 13 — ConfigMap và Secret", href: "#/docs/kuar-13" },
      { label: "Ôn lại: giáo trình CKAD", href: "#/roadmap/ckad" },
    ],
    items: [
      {
        id: "ku-w6-1",
        text: "DaemonSet: một Pod trên mỗi node",
        lesson: `**Mục tiêu.** Giải thích được vì sao Pod do DaemonSet tạo bị Kubernetes scheduler bỏ qua hoàn toàn, giới hạn được DaemonSet chỉ chạy trên các node mang một label cụ thể bằng \`nodeSelector\`, và biết đúng cờ để xoá một DaemonSet mà không kéo theo các Pod nó đang quản lý.

**Đọc.** Ch.11, các mục [DaemonSet Scheduler](#/docs/kuar-11), [Tạo DaemonSet](#/docs/kuar-11), [Giới hạn DaemonSet cho các Node cụ thể](#/docs/kuar-11), [Cập nhật DaemonSet](#/docs/kuar-11) và [Xóa DaemonSet](#/docs/kuar-11) — đọc cả hai mục con "Thêm Label cho Node" và "Node Selector".

**Bẫy.** Nghĩ Pod của DaemonSet được Kubernetes scheduler lên lịch giống mọi Pod khác. Sách nói ngược lại: DaemonSet tự đặt trường \`nodeName\` ngay khi tạo Pod, nên các Pod này bị scheduler bỏ qua hoàn toàn — không có bước "chờ được lên lịch" như với ReplicaSet. Bẫy thứ hai: nghĩ xoá label khỏi một node không ảnh hưởng tới Pod DaemonSet đang chạy sẵn ở đó. Sai — nếu label mà \`nodeSelector\` yêu cầu bị xoá khỏi node, DaemonSet controller sẽ xoá luôn Pod đó khỏi node, y hệt như việc thêm label sẽ tự động triển khai một Pod mới đến. Bẫy thứ ba: \`kubectl delete\` một DaemonSet mặc định xoá luôn mọi Pod nó quản lý — nếu chỉ muốn xoá đối tượng DaemonSet mà giữ nguyên Pod, phải khai báo tường minh.

**Tự kiểm tra.** Trường nào trong Pod spec (Ví dụ 11-2) giới hạn DaemonSet \`nginx-fast-storage\` chỉ chạy trên các node có label \`ssd=true\`? Và cờ nào bạn phải thêm vào \`kubectl delete -f fluentd.yaml\` để chỉ xoá đối tượng DaemonSet mà KHÔNG xoá các Pod \`fluentd\` nó đang quản lý?`,
      },
      {
        id: "ku-w6-2",
        text: "Job và các mẫu song song",
        lesson: `**Mục tiêu.** Phân biệt được ba mẫu Job trong Bảng 12-1 bằng đúng giá trị \`completions\`/\`parallelism\`, và biết vì sao \`restartPolicy: OnFailure\` được khuyến nghị hơn \`Never\` cho Pod của một Job.

**Đọc.** Ch.12, các mục [Đối tượng Job](#/docs/kuar-12) và [Các mẫu Job](#/docs/kuar-12) — đọc cả ba mục con One Shot, Song song (Parallelism) và Hàng đợi công việc (Work Queue), chú ý kỹ Bảng 12-1.

**Bẫy.** Nghĩ \`completions\` và \`parallelism\` là hai cách viết khác nhau của cùng một ý "chạy bao nhiêu Pod". Bảng 12-1 phân biệt rõ ba mẫu qua đúng hai tham số này: one-shot (\`completions=1, parallelism=1\`), parallel fixed completions (nhiều Pod cùng nhắm tới một số lần hoàn thành cố định), và work queue (\`completions\` không đặt, \`parallelism\` là số worker song song, dừng khi Pod đầu tiên thoát mã 0). Bẫy thứ hai: dùng \`restartPolicy: Never\` cho Pod one-shot vì nghĩ nó "sạch" hơn trạng thái CrashLoopBackOff. Thực ra sách cho thấy điều ngược lại — với \`Never\`, mỗi lần Pod thất bại, \`kubelet\` không khởi động lại mà đánh dấu Pod là lỗi, và Job controller tạo hẳn một Pod MỚI thay thế, để lại một đống Pod \`Error\` làm rác cluster; sách khuyên dùng \`OnFailure\` để Pod thất bại được chạy lại tại chỗ. Bẫy thứ ba: do bản chất hệ phân tán, có khả năng nhỏ Job tạo ra Pod trùng lặp cho cùng một mục công việc trong một số kịch bản lỗi — ứng dụng xử lý mục công việc phải tự chịu được việc bị xử lý hai lần.

**Tự kiểm tra.** Trong Ví dụ 12-3 (\`job-parallel.yaml\`), tạo 100 khóa bằng 10 lần chạy \`kuard\` (mỗi lần 10 khóa) nhưng giới hạn tối đa 5 Pod chạy đồng thời — hai trường \`completions\` và \`parallelism\` trong file đó được đặt lần lượt là bao nhiêu? Và mẫu "work queue" khác cấu hình đó ở chỗ nào — trường nào bị bỏ không đặt trong Ví dụ 12-7 (\`job-consumers.yaml\`)?`,
      },
      {
        id: "ku-w6-3",
        text: "CronJob",
        lesson: `**Mục tiêu.** Viết đúng biểu thức \`spec.schedule\` theo cú pháp cron chuẩn cho một CronJob, biết CronJob tạo ra một đối tượng Job mới (không sửa Job cũ) mỗi lần đến giờ kích hoạt, và tra được trạng thái hiện tại của một CronJob đang chạy bằng \`kubectl describe\`.

**Đọc.** Ch.12, mục [CronJob](#/docs/kuar-12).

**Bẫy.** Đọc nhầm thứ tự năm trường trong biểu thức cron chuẩn (phút, giờ, ngày-trong-tháng, tháng, thứ-trong-tuần) rồi nghĩ \`"0 */5 * * *"\` nghĩa là "chạy mỗi 5 phút". Trường đầu tiên là phút (đặt cố định \`0\`), trường thứ hai là giờ (\`*/5\` — mỗi 5 giờ); biểu thức này chạy đúng vào phút 0 của mỗi giờ chia hết cho 5, tức mỗi 5 giờ một lần, không phải mỗi 5 phút. Bẫy thứ hai: nghĩ CronJob là một đối tượng tự chạy container trực tiếp. Thực ra cấu hình container nằm lồng sâu hơn một Job thường — trong \`spec.jobTemplate.spec.template.spec\` — vì CronJob không tự chạy Pod, nó chỉ chịu trách nhiệm tạo một đối tượng Job MỚI đúng lịch, và chính Job mới đó mới tạo Pod. Mỗi lần kích hoạt để lại một đối tượng Job riêng biệt trong lịch sử, không phải một Job duy nhất được tái sử dụng. Bẫy thứ ba: đi tìm trạng thái CronJob bằng cách xem trực tiếp đối tượng CronJob như xem một Job — muốn biết lần chạy gần nhất và các Job con nó đã tạo, lệnh đúng là \`kubectl describe <cron-job>\`.

**Tự kiểm tra.** Với \`spec.schedule: "0 */5 * * *"\` trong Ví dụ 12-8, CronJob \`example-cron\` kích hoạt container \`batch-job\` bao lâu một lần? Và viết đủ đường dẫn trường lồng (từ \`spec\`) trong đặc tả CronJob chứa Pod template thực sự được dùng để tạo container đó.`,
      },
      {
        id: "ku-w6-4",
        text: "ConfigMap, Secret và cách quản lý chúng",
        lesson: `**Mục tiêu.** Tiêu thụ một ConfigMap theo cả ba cách (filesystem, biến môi trường, đối số dòng lệnh) trong cùng một Pod, tạo một Secret lưu cặp khóa/chứng chỉ TLS, và cập nhật một Secret từ file trên đĩa mà không phải tự mã hoá base64 thủ công.

**Đọc.** Ch.13, các mục [ConfigMap](#/docs/kuar-13), [Secret](#/docs/kuar-13), [Ràng buộc đặt tên](#/docs/kuar-13) và [Quản lý ConfigMap và Secret](#/docs/kuar-13) — đọc cả các mục con Tạo ConfigMap, Sử dụng ConfigMap, Tạo Secret, Tiêu thụ Secret và Private Container Registry, cùng các cách cập nhật ở cuối mục "Quản lý ConfigMap và Secret".

**Bẫy.** Nghĩ vì Secret mã hoá dữ liệu bằng base64 nên nó đã được bảo mật. Sách cảnh báo tường minh: base64 chỉ là một cách ENCODING để lưu được dữ liệu nhị phân dạng text, không phải ENCRYPTION — mặc định Kubernetes Secret vẫn lưu dạng văn bản thuần trong \`etcd\`, và bất kỳ ai có quyền quản trị cluster đều đọc được toàn bộ Secret. Bẫy thứ hai: nghĩ tên khóa ConfigMap/Secret tuỳ ý miễn là chuỗi hợp lệ. Tên khóa phải khớp một biểu thức chính quy cụ thể ánh xạ đến tên biến môi trường hợp lệ — ví dụ \`Token..properties\` (hai dấu chấm liền nhau) và \`_password.txt\` (gạch dưới ngay đầu) đều là tên KHÔNG hợp lệ theo Bảng 13-1. Bẫy thứ ba: cập nhật ConfigMap qua API rồi mong ứng dụng tự nhận ra ngay. Kubernetes chỉ đẩy giá trị mới vào volume mount sau vài giây — không có cơ chế tích hợp sẵn nào báo hiệu cho ứng dụng biết có bản mới, việc theo dõi file thay đổi và tải lại là trách nhiệm của chính ứng dụng.

**Tự kiểm tra.** Bạn đã lưu *kuard.crt* và *kuard.key* trên đĩa và muốn cập nhật Secret \`kuard-tls\` hiện có mà không tự tay mã hoá base64. Chuỗi lệnh \`kubectl create secret generic ... --dry-run -o yaml | kubectl replace -f -\` làm gì ở mỗi nửa của pipe đó? Và cú pháp \`--from-file=\` nào (viết đủ) cho phép bạn đặt tên khóa dữ liệu Secret khác với tên file gốc?`,
      },
    ],
  },
  {
    id: "ku-w7",
    week: "Tuần 7",
    title: "RBAC, service mesh và lưu trữ",
    goal: "Cấp đúng quyền tối thiểu cho một service account, và biết khi nào service mesh là câu trả lời sai.",
    practice: `Tạo một ServiceAccount với Role chỉ đọc Pod trong một namespace, rồi dùng \`kubectl auth can-i --as=system:serviceaccount:...\` để kiểm cả trường hợp được phép lẫn bị từ chối.`,
    resources: [
      { label: "KUAR 14 — Kiểm soát truy cập dựa trên vai trò (RBAC)", href: "#/docs/kuar-14" },
      { label: "KUAR 15 — Service Mesh", href: "#/docs/kuar-15" },
      { label: "KUAR 16 — Tích hợp các giải pháp lưu trữ", href: "#/docs/kuar-16" },
      { label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" },
    ],
    items: [
      {
        id: "ku-w7-1",
        text: "Role, RoleBinding, ClusterRole và chủ thể",
        lesson: `**Mục tiêu.** Viết đúng một cặp Role + RoleBinding có phạm vi namespace cho một danh tính cụ thể, phân biệt được Role/RoleBinding (namespace) với ClusterRole/ClusterRoleBinding (cluster), và biết bốn ClusterRole tích hợp sẵn dành cho người dùng cuối.

**Đọc.** Ch.14, mục [Kiểm soát truy cập dựa trên vai trò](#/docs/kuar-14) — đọc cả các mục con Danh tính trong Kubernetes, Hiểu về Role và Role Binding, Role và Role Binding trong Kubernetes (gồm các verb, dùng role tích hợp sẵn, tự động đồng bộ role tích hợp sẵn).

**Bẫy.** Nghĩ một RoleBinding đặt trong namespace X sẽ cấp quyền trên tài nguyên ở BẤT KỲ namespace nào miễn Role đó định nghĩa quyền rộng. Sai — cả Role lẫn RoleBinding chỉ có hiệu lực trong CHÍNH namespace chứa chúng; ràng buộc chỉ cung cấp ủy quyền trong đúng namespace đó. Muốn quyền xuyên toàn cluster hoặc trên tài nguyên không thuộc namespace (như CustomResourceDefinition) bắt buộc phải dùng cặp ClusterRole/ClusterRoleBinding. Bẫy thứ hai: sửa trực tiếp một ClusterRole tích hợp sẵn (như \`edit\`) rồi tưởng thay đổi đó tồn tại lâu dài. Vì API server tự cài lại các ClusterRole tích hợp sẵn mỗi khi khởi động, bản sửa của bạn sẽ bị ghi đè ở lần khởi động lại tiếp theo — trừ khi bạn thêm annotation \`rbac.authorization.kubernetes.io/autoupdate: "false"\` để ngăn việc tự đồng bộ. Bẫy thứ ba: nhầm bốn role tích hợp sẵn cho người dùng cuối — \`cluster-admin\` (toàn cluster), \`admin\` (toàn một namespace), \`edit\` (sửa tài nguyên trong namespace), \`view\` (chỉ đọc) — với các role hệ thống khác cũng nằm trong \`kubectl get clusterroles\`.

**Tự kiểm tra.** Bạn muốn giữ nguyên các sửa đổi thủ công của mình lên ClusterRole \`edit\` tích hợp sẵn qua các lần API server khởi động lại. Annotation nào, với giá trị gì, bạn phải thêm vào ClusterRole đó trước khi sửa? Và Role trong ví dụ \`pod-and-services\` cấp những verb nào (liệt kê đủ) trên hai resource \`pods\` và \`services\`?`,
      },
      {
        id: "ku-w7-2",
        text: "Quản lý RBAC trong thực tế",
        lesson: `**Mục tiêu.** Dùng \`kubectl auth can-i\` để kiểm tra quyền, kể cả trên một subresource, đồng bộ một tập Role/RoleBinding bằng \`kubectl auth reconcile\`, và định nghĩa một ClusterRole tổng hợp từ các ClusterRole chi tiết hơn bằng \`aggregationRule\`.

**Đọc.** Ch.14, các mục [Các kỹ thuật quản lý RBAC](#/docs/kuar-14) và [Các chủ đề nâng cao](#/docs/kuar-14) — gồm cả các mục con Kiểm tra ủy quyền với can-i, Quản lý RBAC trong hệ thống quản lý mã nguồn, Tổng hợp ClusterRole và Sử dụng Group cho Binding.

**Bẫy.** Nghĩ \`kubectl auth reconcile\` áp dụng thay đổi ngay lập tức, không có cách xem trước. Sai — giống \`kubectl apply\`, nó có cờ \`--dry-run\` để xuất ra chứ không áp dụng thay đổi, cho bạn xem trước điều sắp xảy ra. Bẫy thứ hai: nghĩ để tạo một ClusterRole tổng hợp từ nhiều role con, bạn phải copy toàn bộ \`rules\` từ role con vào role cha. Cách đúng là dùng \`aggregationRule.clusterRoleSelectors\` (một label selector) trong ClusterRole cha; mọi ClusterRole khớp selector đó tự động được gộp rules vào mảng \`rules\` của role tổng hợp, và thay đổi ở role con tự động lan sang role cha — sao chép thủ công là antipattern vì không đồng bộ khi role con đổi. Bẫy thứ ba: nghĩ dùng group để ràng buộc role chỉ là vấn đề thẩm mỹ so với ràng buộc từng cá nhân. Sách chỉ ra lý do thực dụng: khi ai đó gia nhập hoặc rời một đội, chỉ cần thêm/xóa họ khỏi group trong MỘT thao tác, thay vì phải rà soát và sửa nhiều RoleBinding riêng lẻ cho danh tính của họ.

**Tự kiểm tra.** Bạn muốn kiểm tra xem người dùng hiện tại có được phép xem log của Pod không (một subresource, không phải chính Pod). Cờ nào bạn thêm vào \`kubectl auth can-i get pods\` để kiểm đúng subresource đó? Và trường nào trong \`spec\` của một ClusterRole tổng hợp (như role \`edit\` tích hợp sẵn) chứa label selector xác định những ClusterRole con nào được tự động gộp vào?`,
      },
      {
        id: "ku-w7-3",
        text: "Service mesh: mTLS, traffic shaping — và câu hỏi có cần không",
        lesson: `**Mục tiêu.** Giải thích được ba khả năng cốt lõi mà service mesh thêm vào (mã hoá/xác thực, điều chỉnh lưu lượng, khả năng quan sát), và tự đưa ra được quyết định có nên thêm service mesh vào một ứng dụng cụ thể hay không dựa trên tiêu chí sách nêu.

**Đọc.** Ch.15, các mục [Mã hóa và xác thực với Mutual TLS](#/docs/kuar-15), [Điều chỉnh lưu lượng (Traffic Shaping)](#/docs/kuar-15), [Khả năng quan sát nội tại (Introspection)](#/docs/kuar-15) và [Bạn thực sự cần Service Mesh không?](#/docs/kuar-15).

**Bẫy.** Nghĩ mọi kiến trúc cloud native "bắt buộc" phải có service mesh vì các sơ đồ kiến trúc trừu tượng hay vẽ nó vào. Sách bác bỏ điều này ngay đầu chương: dựa vào các tài nguyên Kubernetes sẵn có (Service, Ingress) thường đơn giản và đáng tin cậy hơn nếu chúng đáp ứng đủ nhu cầu — thêm service mesh là đánh đổi độ phức tạp lấy khả năng, không phải một bước bắt buộc. Bẫy thứ hai: nghĩ sidecar service mesh là một thư viện được LINK vào code ứng dụng, nên nhà phát triển phải tự sửa image để dùng nó. Thực ra hầu hết hiện thực dùng một MUTATING ADMISSION CONTROLLER để tự động tiêm container sidecar vào mọi Pod được tạo — nhà phát triển không cần sửa gì trong định nghĩa Pod hay image của họ. Bẫy thứ ba: nghĩ service mesh thất bại chỉ ảnh hưởng riêng phần chức năng mesh cung cấp (như mã hoá). Vì sidecar chặn TRONG SUỐT toàn bộ giao tiếp mạng của Pod, khi service mesh thất bại, toàn bộ ứng dụng của bạn — không chỉ tính năng mesh — ngừng hoạt động.

**Tự kiểm tra.** Sidecar mà service mesh tiêm vào mỗi Pod dùng công cụ tầng mạng cụ thể nào (nêu cả công cụ lâu năm và công cụ mới hơn sách nhắc tới) để chặn lưu lượng một cách trong suốt? Và cơ chế cụ thể nào (tên loại thành phần đảm nhiệm) tự động thực hiện việc tiêm sidecar đó vào mọi Pod mới, mà không cần nhà phát triển tự sửa Pod manifest?`,
      },
      {
        id: "ku-w7-4",
        text: "Nối lưu trữ vào cluster: service ngoài, singleton, StatefulSet",
        lesson: `**Mục tiêu.** Nhập một service bên ngoài cluster bằng Service loại \`ExternalName\` hoặc bằng Service không selector kèm đối tượng Endpoints thủ công, và giải thích được các đảm bảo thứ tự riêng của StatefulSet so với ReplicaSet.

**Đọc.** Ch.16, các mục [Nhập các Service bên ngoài](#/docs/kuar-16), [Chạy các Singleton đáng tin cậy](#/docs/kuar-16) và [Lưu trữ gốc Kubernetes với StatefulSet](#/docs/kuar-16) — gồm cả các mục con Service không có Selector, Hạn chế của Service bên ngoài: Kiểm tra sức khỏe, Chạy một MySQL Singleton và Các thuộc tính của StatefulSet.

**Bẫy.** Nghĩ để trỏ một Service đến một database bên ngoài có tên DNS, bạn vẫn cần khai \`selector\` như Service thường. Với server bên ngoài có tên DNS, cách đúng là đặt \`spec.type: ExternalName\` và \`spec.externalName\` — service này không có địa chỉ IP riêng, DNS Kubernetes chỉ điền một bản ghi CNAME bí danh sang tên ngoài, không có selector nào cả. Bẫy thứ hai: nếu server ngoài CHỈ có địa chỉ IP (không có tên DNS), tạo Service không selector là chưa đủ — bạn phải tự tay tạo thêm một đối tượng Endpoints riêng cùng tên để điền địa chỉ IP đó, vì không có selector nghĩa là không có gì tự động điền endpoint. Bẫy thứ ba: nghĩ StatefulSet chỉ khác ReplicaSet ở hostname ổn định. Sách nêu thêm hai đảm bảo thứ tự: mỗi replica được tạo tuần tự từ chỉ số thấp đến cao, và việc tạo replica kế tiếp CHỜ đến khi replica trước đó khỏe mạnh; khi xóa hoặc thu nhỏ, thứ tự bị đảo ngược — từ chỉ số cao xuống thấp — chứ không xoá đồng thời như ReplicaSet.

**Tự kiểm tra.** Server cơ sở dữ liệu bên ngoài của bạn chỉ có địa chỉ IP \`192.168.0.1\`, không có tên DNS. Sau khi tạo một Service không có \`selector\`, bạn cần tạo thêm đối tượng Kubernetes loại gì (\`kind\` gì), và trường nào bên trong nó chứa địa chỉ IP đó? Còn nếu server có tên DNS \`database.company.com\`, bạn đặt hai trường nào trong \`spec\` của Service để nhập nó bằng loại \`ExternalName\`?`,
      },
    ],
  },
  {
    id: "ku-w8",
    week: "Tuần 8",
    title: "Mở rộng Kubernetes và bảo mật ứng dụng",
    goal: "Chỉ ra được điểm mở rộng phù hợp cho một yêu cầu, và siết một Pod đang chạy quyền root xuống mức tối thiểu.",
    practice: `Khai một CRD đơn giản theo chương 17 và tạo một đối tượng của nó. Rồi lấy một Pod bất kỳ, thêm \`securityContext\` theo chương 19 để nó chạy non-root, read-only rootfs, và bỏ hết capability — sửa cho tới khi Pod vẫn chạy được.`,
    resources: [
      { label: "KUAR 17 — Mở rộng Kubernetes", href: "#/docs/kuar-17" },
      { label: "KUAR 18 — Truy cập Kubernetes từ ngôn ngữ lập trình", href: "#/docs/kuar-18" },
      { label: "KUAR 19 — Bảo mật ứng dụng trong Kubernetes", href: "#/docs/kuar-19" },
      { label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" },
    ],
    items: [
      {
        id: "ku-w8-1",
        text: "Mở rộng Kubernetes nghĩa là gì và có những điểm nào",
        lesson: `**Mục tiêu.** Viết đúng tên hợp lệ cho một CustomResourceDefinition mới theo quy tắc \`<resource-plural>.<api-group>\`, và phân biệt được admission controller với custom resource là hai điểm mở rộng khác nhau của API server.

**Đọc.** Ch.17, các mục [Mở rộng Kubernetes có nghĩa là gì](#/docs/kuar-17) và [Các điểm mở rộng](#/docs/kuar-17) — đọc kỹ phần định nghĩa CustomResourceDefinition (CRD), luồng yêu cầu qua admission controller, và cách đăng ký một ValidatingWebhookConfiguration hay MutatingWebhookConfiguration.

**Bẫy.** Nghĩ \`metadata.name\` của một CustomResourceDefinition có thể đặt tuỳ ý miễn không trùng tên khác. Sách yêu cầu tường minh định dạng \`<resource-plural>.<api-group>\` (ví dụ \`loadtests.beta.kuar.com\`) — đúng định dạng này là thứ duy nhất đảm bảo không hai CustomResourceDefinition nào định nghĩa trùng cùng một tài nguyên trên cluster. Bẫy thứ hai: khai nhiều phiên bản (\`versions\`) cho một tài nguyên rồi đặt \`storage: true\` cho TẤT CẢ. Trường \`storage\` chỉ được phép là \`true\` cho ĐÚNG MỘT phiên bản duy nhất — đó là phiên bản dùng để lưu dữ liệu trong bộ lưu trữ nền của API server. Bẫy thứ ba: nghĩ chỉ cần tạo CustomResourceDefinition là custom resource đã "hoạt động". Tạo CRD chỉ cho bạn CRUD dữ liệu qua API — không có controller nào giám sát và hành động trên các đối tượng LoadTest thì việc tạo một LoadTest chỉ lưu dữ liệu chứ không kích hoạt load test thật nào cả.

**Tự kiểm tra.** Bạn định nghĩa một CustomResourceDefinition tên \`loadtests.beta.kuar.com\` với hai phiên bản \`v1\` và \`v2\` trong mảng \`versions\`. Trường boolean nào trong mỗi phần tử của mảng đó quyết định phiên bản nào được dùng để lưu dữ liệu, và tại một thời điểm, trường đó được phép là \`true\` cho bao nhiêu phiên bản? Và \`kind\` nào bạn khai để đăng ký một admission controller kiểm tra xác thực (không sửa đổi) cho tài nguyên LoadTest?`,
      },
      {
        id: "ku-w8-2",
        text: "Các mẫu dùng Custom Resource",
        lesson: `**Mục tiêu.** Phân biệt được ba mẫu API extension (Chỉ là dữ liệu, Trình biên dịch, Operator) theo đúng mức độ quản lý trực tuyến mỗi mẫu cung cấp, và biết dự án nào sách gợi ý để bắt đầu xây dựng extension của riêng mình.

**Đọc.** Ch.17, các mục [Các mẫu cho Custom Resource](#/docs/kuar-17) và [Bắt đầu](#/docs/kuar-17) — đọc cả ba mục con Chỉ là dữ liệu (Just Data), Trình biên dịch (Compiler) và Operator.

**Bẫy.** Nghĩ mẫu "Chỉ là dữ liệu" là cách hợp lý để lưu dữ liệu ứng dụng nói chung, vì API server đã có sẵn cơ chế CRUD. Sách cảnh báo tường minh: Kubernetes API server KHÔNG được thiết kế để làm kho khóa/giá trị cho dữ liệu ứng dụng — mẫu "chỉ là dữ liệu" chỉ nên dùng cho các đối tượng điều khiển hoặc cấu hình triển khai/thời gian chạy (ví dụ tham số canary), không phải dữ liệu nghiệp vụ. Bẫy thứ hai: nhầm mẫu "Trình biên dịch" với mẫu "Operator" vì cả hai đều cần một controller "biên dịch" đối tượng cấp cao xuống các đối tượng Kubernetes cấp thấp (Pod, Service). Khác biệt cốt lõi: mẫu Trình biên dịch KHÔNG có bảo trì sức khỏe trực tuyến sau khi biên dịch xong — nó ủy quyền hẳn xuống các đối tượng cấp thấp; còn mẫu Operator tiếp tục giám sát trạng thái CHẠY của ứng dụng do nó tạo ra (ví dụ tự chụp snapshot backup, tự khắc phục cơ sở dữ liệu không khỏe mạnh) — đây là quản lý chủ động, liên tục, không dừng lại sau bước tạo.

**Tự kiểm tra.** Extension LoadTest ở phần trước của chương — nơi một đối tượng \`loadtest\` cấp cao được "biên dịch" thành một tập Pod và Service — là ví dụ của mẫu nào trong ba mẫu (Chỉ là dữ liệu / Trình biên dịch / Operator)? Và dự án nào sách gợi ý trong mục "Bắt đầu" chứa thư viện code giúp bạn khởi động việc xây dựng một Kubernetes API extension đáng tin cậy?`,
      },
      {
        id: "ku-w8-3",
        text: "Gọi Kubernetes API từ code ứng dụng",
        lesson: `**Mục tiêu.** Xác thực đúng cách với Kubernetes API server tuỳ theo code chạy trong hay ngoài cluster (kubeconfig so với service account token), và gọi được đúng hàm client để liệt kê Pod trong một namespace cụ thể.

**Đọc.** Ch.18, các mục [Kubernetes API: Góc nhìn của Client](#/docs/kuar-18) và [Lập trình với Kubernetes API](#/docs/kuar-18) — gồm cả các mục con OpenAPI và các thư viện Client được sinh tự động, Cài đặt các thư viện Client, Xác thực với Kubernetes API, Truy cập Kubernetes API và Kết hợp tất cả lại: Liệt kê và tạo Pod bằng Python, Java và .NET.

**Bẫy.** Nghĩ code chạy bên trong một Pod của cluster cũng cần một file kubeconfig như code chạy bên ngoài. Sách phân biệt rõ hai cách lấy thông tin xác thực: code NGOÀI cluster đọc từ file kubeconfig (mặc định \`\${HOME}/.kube/config\` hoặc biến \`\$KUBECONFIG\`), còn code chạy TRONG một Pod lấy token và certificate authority tự động được Kubernetes mount vào Pod dưới dạng volume — không cần kubeconfig, và API server luôn có sẵn ở tên DNS cố định \`kubernetes\`. Bẫy thứ hai: nghĩ service account mặc định gắn cho Pod có đủ quyền để code trong Pod thao túng API tự do. Sách cảnh báo service account mặc định chỉ có role RBAC tối thiểu — nếu gặp lỗi ủy quyền, bạn phải gán cho Pod một service account riêng có role phù hợp. Bẫy thứ ba: nghĩ mọi khả năng của \`kubectl\` đều có sẵn dưới dạng một lệnh gọi API tương ứng trong client library. Nhiều tính năng tinh vi của \`kubectl\` chỉ tồn tại như logic PHÍA CLIENT, phải được hiện thực lại riêng trong từng thư viện — nếu không tìm thấy hàm tương ứng, sách gợi ý thêm cờ \`--v=10\` vào \`kubectl\` để xem đúng các request/response HTTP nó thực sự gửi.

**Tự kiểm tra.** Code Python của bạn chạy BÊN TRONG một Pod trong cluster và cần tạo client Kubernetes. Hàm nào (viết đủ, kèm module \`config.\`) bạn gọi thay vì \`config.load_kube_config()\` dùng cho code chạy ngoài cluster? Và cờ dòng lệnh nào bạn thêm vào một lệnh \`kubectl\` để xem toàn bộ request/response HTTP nó gửi, khi bạn cần tái tạo hành vi đó trong code của mình?`,
      },
      {
        id: "ku-w8-4",
        text: "SecurityContext, Pod Security và các lớp phòng thủ khác",
        lesson: `**Mục tiêu.** Viết đúng các trường SecurityContext bắt buộc để một Pod chạy non-root, chỉ đọc rootfs và bỏ hết capability; áp dụng một Pod Security Standard ở cấp namespace bằng label; và chọn đúng cơ chế (RuntimeClass, NetworkPolicy, hay bảo mật image) cho một yêu cầu cô lập cụ thể.

**Đọc.** Ch.19, các mục [Hiểu về SecurityContext](#/docs/kuar-19), [Pod Security](#/docs/kuar-19), [Quản lý Service Account](#/docs/kuar-19), [RuntimeClass](#/docs/kuar-19), [Network Policy](#/docs/kuar-19) và [Bảo mật Image](#/docs/kuar-19) — gồm cả các mục con Pod Security là gì? và Áp dụng Pod Security Standard.

**Bẫy.** Nghĩ \`privileged: false\` là đủ để chặn một tiến trình trong container giành thêm đặc quyền so với tiến trình cha. Đó là hai trường khác nhau: \`allowPrivilegeEscalation: false\` mới là trường chặn trực tiếp việc nâng quyền, và bản thân nó sẽ tự động bị ghi đè thành \`true\` nếu bạn đặt \`privileged: true\`. Bẫy thứ hai: nghĩ NetworkPolicy tự động có hiệu lực ngay khi \`kubectl apply\`, giống Ingress — đúng cái bẫy của Ingress lặp lại ở đây: NetworkPolicy không đi kèm controller tích hợp sẵn, nó chỉ được THỰC THI bởi các plug-in mạng như Calico, Cilium hay Weave Net; không cài plug-in nào, tài nguyên NetworkPolicy tồn tại nhưng vô tác dụng. Bẫy thứ ba: nghĩ nếu một Pod không khớp NetworkPolicy nào thì mặc định lưu lượng của nó bị chặn. Ngược lại — Pod không bị bất kỳ NetworkPolicy nào khớp thì lưu lượng được CHO PHÉP tự do; chỉ khi một Pod bị ít nhất một NetworkPolicy khớp, mọi giao tiếp ingress/egress không được khai báo tường minh trong đó mới bị chặn.

**Tự kiểm tra.** Bạn muốn một Pod chạy non-root, rootfs chỉ đọc, và bỏ hết mọi Linux capability. Viết đủ ba trường trong \`securityContext\` thực hiện ba yêu cầu đó — riêng phần "bỏ hết capability" cần đúng cú pháp \`capabilities.drop\` với giá trị gì? Và cặp label nào (dạng \`pod-security.kubernetes.io/<MODE>: <LEVEL>\`) bạn gắn vào một Namespace để ENFORCE Pod Security Standard \`baseline\` trên mọi Pod trong đó?`,
      },
    ],
  },
  {
    id: "ku-w9",
    week: "Tuần 9",
    title: "Chính sách, đa cluster và tổ chức ứng dụng",
    goal: "Đặt được một ràng buộc chính sách chặn cấu hình sai ngay khi nộp, và bố trí được repo cho nhiều môi trường mà không sao chép YAML.",
    practice: `Cài Gatekeeper theo chương 20, viết một constraint bắt mọi Pod phải có label \`app\`, rồi thử nộp một Pod thiếu label và đọc thông điệp từ chối. Sau đó tổ chức lại manifest của bài tập tuần 6 theo cấu trúc thư mục chương 22.`,
    resources: [
      { label: "KUAR 20 — Chính sách và quản trị cho Cluster", href: "#/docs/kuar-20" },
      { label: "KUAR 21 — Triển khai ứng dụng đa Cluster", href: "#/docs/kuar-21" },
      { label: "KUAR 22 — Tổ chức ứng dụng của bạn", href: "#/docs/kuar-22" },
      { label: "Ôn lại: giáo trình CKS", href: "#/roadmap/cks" },
      { label: "open-policy-agent.github.io — Gatekeeper", href: "https://open-policy-agent.github.io/gatekeeper/website/docs/" },
    ],
    items: [
      {
        id: "ku-w9-1",
        text: "Luồng admission và vì sao cần chính sách",
        lesson: `**Mục tiêu.** Giải thích được vì sao RBAC không đủ chi tiết để hạn chế giá trị của các trường cụ thể trong một tài nguyên, và phân biệt mutating admission controller với validating admission controller trong luồng yêu cầu API.

**Đọc.** Ch.20, các mục [Tại sao chính sách và quản trị quan trọng](#/docs/kuar-20) và [Luồng Admission](#/docs/kuar-20).

**Bẫy.** Nghĩ RBAC đã đủ để ngăn một Pod dùng image từ registry không được phép, vì RBAC vốn kiểm soát ai được tạo Pod. Sách chỉ thẳng giới hạn này: RBAC chỉ kiểm soát AI được thực hiện HÀNH ĐỘNG nào trên LOẠI tài nguyên nào (ví dụ "alice được tạo Pod") — nó không đủ chi tiết để hạn chế GIÁ TRỊ của từng trường bên trong tài nguyên đó (ví dụ trường \`image\` phải bắt đầu bằng một registry cụ thể). Đó chính là khoảng trống mà chính sách và quản trị (như Gatekeeper ở phần sau) lấp vào. Bẫy thứ hai: nhầm lẫn hai loại admission controller. Mutating admission controller CHO PHÉP sửa đổi tài nguyên (ví dụ tự thêm giá trị mặc định); validating admission controller thì KHÔNG sửa đổi, chỉ chấp nhận hoặc từ chối. Cả hai đều chạy admission — tức là TRƯỚC khi đối tượng được ghi vào bộ lưu trữ nền — không phải sau.

**Tự kiểm tra.** Trong luồng yêu cầu qua Kubernetes API server, admission controller chạy ở giai đoạn nào so với việc ghi tài nguyên vào bộ lưu trữ nền — trước hay sau? Và hai loại tài nguyên cấu hình webhook nào (viết đủ \`kind\`) cho phép quản trị viên cluster cấu hình động một endpoint để API server gửi yêu cầu tới đánh giá — một loại có thể sửa đổi tài nguyên, loại kia thì không?`,
      },
      {
        id: "ku-w9-2",
        text: "Gatekeeper: constraint template và constraint",
        lesson: `**Mục tiêu.** Viết được một ConstraintTemplate định nghĩa chính sách bằng Rego và một constraint khởi tạo chính sách đó với tham số cụ thể, và chọn đúng giá trị \`enforcementAction\` (\`deny\`/\`dryrun\`/\`warn\`) phù hợp với giai đoạn triển khai chính sách.

**Đọc.** Ch.20, mục [Chính sách và quản trị với Gatekeeper](#/docs/kuar-20) — đọc cả các mục con Open Policy Agent là gì?, Cài đặt Gatekeeper, Cấu hình chính sách, Hiểu về Constraint Template, Tạo Constraint và Kiểm toán (Audit).

**Bẫy.** Nghĩ cài đặt Gatekeeper xong và bật \`enforcementAction: deny\` ngay lập tức là an toàn cho một cluster đã có sẵn nhiều workload. Sách cảnh báo tường minh: constraint chỉ được đánh giá trên sự kiện CREATE và UPDATE — các workload đang chạy sẵn không bị đánh giá lại ngay, nhưng lần tiếp theo một trong số chúng bị UPDATE (kể cả chỉ scale một Deployment khiến ReplicaSet tạo thêm Pod) mà không tuân thủ, nó sẽ bị từ chối bất ngờ; sách khuyên đặt \`enforcementAction: "dryrun"\` và kiểm toán trước, xác nhận không còn vi phạm nào, rồi mới chuyển sang \`"deny"\`. Bẫy thứ hai: nghĩ ba giá trị \`enforcementAction\` chỉ khác nhau ở "chặn cứng hay không". Thực ra \`"dryrun"\` không hề chặn hay cảnh báo, nó dùng riêng tính năng kiểm toán để chỉ ra vi phạm mà không ảnh hưởng gì tới người dùng; \`"warn"\` cho phép tạo/cập nhật kèm cảnh báo hiển thị trực tiếp cho người dùng; chỉ \`"deny"\` mới thực sự chặn yêu cầu. Bẫy thứ ba: nghĩ constraint template tự nó là chính sách hoàn chỉnh. Nó chỉ định nghĩa schema tham số và logic Rego dùng chung; phải tạo thêm một constraint (một instance riêng) cung cấp tham số cụ thể (như danh sách registry) thì chính sách mới thực sự có hiệu lực.

**Tự kiểm tra.** Bạn vừa cài Gatekeeper xong trên một cluster đã có nhiều workload đang chạy, và muốn biết trước những gì sẽ vi phạm chính sách mới mà chưa chặn gì cả. Bạn nên đặt trường \`enforcementAction\` trong constraint thành giá trị nào trong ba giá trị \`deny\`/\`dryrun\`/\`warn\`? Và trường \`kind\` bạn khai trong \`spec.crd.spec.names\` của một ConstraintTemplate dùng để làm gì — nó trở thành \`kind\` của loại tài nguyên nào khi bạn tạo constraint sau đó?`,
      },
      {
        id: "ku-w9-3",
        text: "Triển khai ứng dụng trên nhiều cluster",
        lesson: `**Mục tiêu.** Giải thích được vì sao ngay cả một cluster theo vùng (regional) cũng không đủ cho khả năng phục hồi, và chọn đúng mô hình kiến trúc (silo được nhân bản, sharding, hay định tuyến microservice) cho một ràng buộc chi phí/linh hoạt cho trước.

**Đọc.** Ch.21, các mục [Trước khi bạn bắt đầu](#/docs/kuar-21), [Bắt đầu từ trên cùng với cách tiếp cận cân bằng tải](#/docs/kuar-21) và [Xây dựng ứng dụng cho nhiều Cluster](#/docs/kuar-21) — gồm cả ba mục con Silo được nhân bản: Mô hình xuyên vùng đơn giản nhất, Sharding: Dữ liệu theo vùng và Linh hoạt hơn: Định tuyến Microservice.

**Bẫy.** Nghĩ một cluster Kubernetes theo vùng (trải trên nhiều zone) đã đủ khả năng phục hồi, không cần nhiều cluster. Sách chỉ ra lỗ hổng: bản thân MỘT cluster Kubernetes luôn gắn với một phiên bản Kubernetes cụ thể, và việc nâng cấp cluster đó — không phải sự cố hạ tầng — mới là nguyên nhân phổ biến khiến ứng dụng gặp sự cố; cluster theo vùng chỉ giải quyết lỗi hạ tầng bên dưới, không giải quyết rủi ro từ chính control plane. Bẫy thứ hai: nghĩ mô hình "silo được nhân bản" (sao chép y hệt ứng dụng vào mọi vùng) luôn là lựa chọn tốt nhất. Sách chỉ rõ cái giá: mỗi silo phải định cỡ theo vùng ĐÔNG NGƯỜI DÙNG NHẤT, nên các silo ở vùng nhỏ hơn bị cấp phát dư thừa tài nguyên. Bẫy thứ ba: nghĩ GeoDNS luôn là cách tốt nhất để định tuyến người dùng đến cluster gần nhất. Sách nêu nhược điểm cụ thể: DNS bị cache rộng khắp internet bất kể TTL, nên khi cần chuyển khẩn cấp lưu lượng khỏi một vùng gặp sự cố, độ trễ do cache DNS kéo dài thời gian và tác động của sự cố đó.

**Tự kiểm tra.** Trong ví dụ sharding của sách với sáu cluster theo vùng A–F và ba shard dữ liệu (1, 2, 3), mỗi shard được đặt ở đúng bao nhiêu cluster để vẫn có dự phòng? Và kỹ thuật cân bằng tải nào (khác GeoDNS) sách mô tả dùng một địa chỉ IP tĩnh DUY NHẤT được quảng bá từ nhiều địa điểm cùng lúc, định tuyến lưu lượng theo khoảng cách hiệu năng mạng thay vì khoảng cách địa lý?`,
      },
      {
        id: "ku-w9-4",
        text: "Tổ chức repo và tham số hoá bằng template",
        lesson: `**Mục tiêu.** Bố trí một cây thư mục cấu hình theo đúng ba nguyên tắc dẫn đường của chương (filesystem là nguồn chân lý, review code, feature gate), và tham số hoá cùng một template Helm cho nhiều môi trường bằng một file tham số riêng cho mỗi môi trường.

**Đọc.** Ch.22, các mục [Các nguyên tắc dẫn đường](#/docs/kuar-22), [Quản lý ứng dụng trong hệ thống quản lý mã nguồn](#/docs/kuar-22), [Cấu trúc ứng dụng cho phát triển, kiểm thử và triển khai](#/docs/kuar-22), [Tham số hóa ứng dụng với Template](#/docs/kuar-22) và [Triển khai ứng dụng của bạn khắp thế giới](#/docs/kuar-22) — gồm cả các mục con Filesystem là nguồn chân lý, Bố trí Filesystem, Quản lý phiên bản với branch và tag, Quản lý phiên bản với thư mục, Ánh xạ các giai đoạn với revision, và Tham số hóa với Helm và Template.

**Bẫy.** Nghĩ nhóm nhiều đối tượng Kubernetes khác nhau (Deployment, Service, ConfigMap...) vào chung một file YAML luôn tiện lợi hơn tách file. Sách gọi đây là một antipattern trừ khi các đối tượng đó "giống hệt về khái niệm" — nguyên tắc chọn nên giống cách bạn quyết định gộp gì vào một class hay struct, không phải "gộp cho gọn". Bẫy thứ hai: nhầm lẫn hai cách quản lý phiên bản. Với cách branch/tag, bạn sửa lỗi bằng cách commit vào HEAD rồi CHERRY-PICK sang từng branch release liên quan (\`git cherry-pick <edit>\`) — dễ quên cherry-pick vào các release cũ hơn đang hoạt động; với cách thư mục, một pull request DUY NHẤT sửa file YAML trong tất cả các thư mục revision liên quan cùng lúc. Bẫy thứ ba: nghĩ mỗi giai đoạn triển khai (staging, canary, production...) cần một bộ file cấu hình hoàn toàn riêng. Sách khuyên dùng ÁNH XẠ giữa giai đoạn và revision — ví dụ một symbolic link \`canary/ -> v2/\` — thay vì nhân bản cấu hình cho từng tổ hợp phiên bản×giai đoạn.

**Tự kiểm tra.** Trong cú pháp template "mustache" của Helm, viết đúng cú pháp để trường \`metadata.name\` lấy giá trị từ tham số \`Release.Name\`. Và trong bố trí filesystem dựa trên thư mục, viết đúng cú pháp ký hiệu (ví dụ cho giai đoạn \`canary\` trỏ tới revision \`v2\`) dùng để ánh xạ một giai đoạn triển khai sang một revision cụ thể mà không cần nhân bản cấu hình.`,
      },
    ],
  },
];
