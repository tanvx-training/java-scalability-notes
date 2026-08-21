// Ngân hàng câu hỏi trắc nghiệm — sinh cho ứng dụng luyện thi K8s.
export const questions = [
  // ===== CKAD — Application Design and Build (design) =====
  {
    id: "q001",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "Trong một Pod multi-container, init container khác container thường ở điểm nào?",
    code: null,
    options: [
      "Chạy song song với các container khác trong suốt vòng đời Pod",
      "Chạy tuần tự theo thứ tự khai báo và phải kết thúc thành công trước khi container chính khởi động",
      "Chỉ chạy khi Pod bị restart bởi kubelet",
      "Tự động chạy lại định kỳ để kiểm tra sức khỏe Pod",
    ],
    answer: 1,
    explanation: "Init containers khai báo trong `pod.spec.initContainers` chạy tuần tự; mỗi container phải exit 0 thì container tiếp theo mới chạy, và tất cả phải xong thì các container chính mới start.",
  },
  {
    id: "q002",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Với Kubernetes 1.29+, container `log-agent` trong YAML sau hoạt động như thế nào?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  initContainers:
  - name: log-agent
    image: fluent-bit:2.2
    restartPolicy: Always
  containers:
  - name: app
    image: nginx:1.27`,
    },
    options: [
      "Chạy xong rồi thoát trước khi container app khởi động, giống init container thường",
      "YAML không hợp lệ vì initContainer không được phép có restartPolicy",
      "Chạy song song với app nhưng bị dừng ngay khi app sẵn sàng",
      "Là native sidecar: khởi động trước app và tiếp tục chạy trong suốt vòng đời Pod",
    ],
    answer: 3,
    explanation: "Từ K8s 1.29, init container có `restartPolicy: Always` trở thành native sidecar (feature SidecarContainers): nó start trước các container chính, không cần exit, và được kubelet giữ chạy đến khi Pod kết thúc.",
  },
  {
    id: "q003",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "Trường `command` và `args` trong spec của container tương ứng với gì trong Dockerfile?",
    code: null,
    options: [
      "`command` ghi đè ENTRYPOINT, `args` ghi đè CMD",
      "`command` ghi đè CMD, `args` ghi đè ENTRYPOINT",
      "Cả hai đều được nối thêm vào sau ENTRYPOINT của image",
      "`command` chỉ dùng được khi image không định nghĩa ENTRYPOINT",
    ],
    answer: 0,
    explanation: "Trong `pod.spec.containers`, `command` thay thế ENTRYPOINT còn `args` thay thế CMD của image. Nếu chỉ đặt `args`, ENTRYPOINT gốc của image vẫn được dùng với tham số mới.",
  },
  {
    id: "q004",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Job sau sẽ chạy các Pod như thế nào?",
    code: {
      lang: "yaml",
      text: `apiVersion: batch/v1
kind: Job
metadata:
  name: batch-render
spec:
  completions: 6
  parallelism: 2
  template:
    spec:
      containers:
      - name: worker
        image: renderer:1.0
      restartPolicy: Never`,
    },
    options: [
      "Chạy 6 Pod đồng thời, Job xong khi 2 Pod hoàn thành",
      "Chạy đúng 2 Pod tổng cộng, mỗi Pod xử lý 3 lần",
      "Chạy tối đa 2 Pod đồng thời cho đến khi có tổng cộng 6 Pod hoàn thành thành công",
      "Chạy 6 Pod tuần tự, mỗi lần đúng 1 Pod",
    ],
    answer: 2,
    explanation: "`job.spec.completions: 6` yêu cầu 6 lần hoàn thành thành công, còn `parallelism: 2` giới hạn số Pod chạy đồng thời là 2.",
  },
  {
    id: "q005",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Trường `backoffLimit` của Job có ý nghĩa gì?",
    code: null,
    options: [
      "Thời gian tối đa (giây) Job được phép chạy",
      "Số Pod tối đa được chạy đồng thời",
      "Số lần retry tối đa trước khi Job bị đánh dấu Failed",
      "Khoảng thời gian chờ giữa hai lần chạy CronJob",
    ],
    answer: 2,
    explanation: "`job.spec.backoffLimit` (mặc định 6) là số lần thử lại khi Pod thất bại; vượt quá thì Job chuyển sang trạng thái Failed. Thời gian chờ giữa các lần retry tăng theo cấp số nhân.",
  },
  {
    id: "q006",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "CronJob có `schedule: \"*/5 * * * *\"` sẽ chạy vào lúc nào?",
    code: null,
    options: [
      "Mỗi 5 phút một lần",
      "Vào phút thứ 5 của mỗi giờ",
      "Mỗi 5 giờ một lần",
      "Mỗi ngày lúc 5 giờ sáng",
    ],
    answer: 0,
    explanation: "Cú pháp cron `*/5` ở vị trí phút nghĩa là chạy ở mọi phút chia hết cho 5 (0, 5, 10, ...), tức mỗi 5 phút. Nếu muốn phút thứ 5 mỗi giờ thì dùng `5 * * * *`.",
  },
  {
    id: "q007",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "CronJob đặt `concurrencyPolicy: Forbid` sẽ hành xử thế nào khi lần chạy trước vẫn đang chạy đến thời điểm trigger tiếp theo?",
    code: null,
    options: [
      "Dừng Job cũ và khởi động Job mới thay thế",
      "Chạy cả hai Job song song",
      "Báo lỗi và tạm dừng CronJob vĩnh viễn",
      "Bỏ qua (skip) lần chạy mới, chờ đến lần trigger kế tiếp",
    ],
    answer: 3,
    explanation: "`cronjob.spec.concurrencyPolicy: Forbid` cấm chạy chồng lấn: lần chạy mới bị bỏ qua nếu Job trước chưa xong. `Replace` mới là chính sách dừng Job cũ để chạy Job mới; `Allow` (mặc định) cho chạy song song.",
  },
  {
    id: "q008",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Giá trị `restartPolicy` nào hợp lệ cho Pod template của một Job?",
    code: null,
    options: [
      "Chỉ Always",
      "Never hoặc OnFailure",
      "Always hoặc OnFailure",
      "Bất kỳ giá trị nào, kể cả Always",
    ],
    answer: 1,
    explanation: "Job yêu cầu `template.spec.restartPolicy` là `Never` hoặc `OnFailure` vì Pod của Job phải có khả năng kết thúc; `Always` (mặc định của Deployment) sẽ khiến Job không bao giờ hoàn thành nên bị API từ chối.",
  },
  {
    id: "q009",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "Dữ liệu trong volume kiểu `emptyDir` tồn tại đến khi nào?",
    code: null,
    options: [
      "Tồn tại khi container restart, nhưng mất khi Pod bị xóa khỏi node",
      "Tồn tại vĩnh viễn trên node kể cả khi Pod bị xóa",
      "Mất ngay khi bất kỳ container nào trong Pod restart",
      "Tồn tại cho đến khi PVC gắn với nó bị xóa",
    ],
    answer: 0,
    explanation: "`emptyDir` được tạo khi Pod được gán lên node và bị xóa cùng Pod; container crash/restart không làm mất dữ liệu vì volume thuộc về Pod, không thuộc về container.",
  },
  {
    id: "q010",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Khác biệt chính giữa volume `emptyDir` và `hostPath` là gì?",
    code: null,
    options: [
      "emptyDir chia sẻ được giữa nhiều Pod, hostPath thì không",
      "hostPath chỉ dùng được cho static Pod",
      "hostPath mount một đường dẫn có sẵn trên filesystem của node, dữ liệu gắn với node cụ thể và tồn tại sau khi Pod bị xóa",
      "emptyDir luôn nằm trên RAM còn hostPath luôn nằm trên đĩa",
    ],
    answer: 2,
    explanation: "`hostPath` trỏ trực tiếp vào filesystem của node nên dữ liệu sống lâu hơn Pod nhưng phụ thuộc node và có rủi ro bảo mật; `emptyDir` là thư mục tạm theo vòng đời Pod (chỉ nằm trên RAM khi đặt `medium: Memory`).",
  },
  {
    id: "q011",
    cert: "CKAD",
    domain: "design",
    difficulty: 3,
    question: "Nhiều Pod có thể cùng lúc sử dụng PVC dưới đây không?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi`,
    },
    options: [
      "Không, ReadWriteOnce nghĩa là chỉ đúng một Pod được mount",
      "Có, miễn là các Pod đó cùng chạy trên một node — RWO giới hạn theo node, không theo Pod",
      "Có, không giới hạn gì vì accessModes chỉ mang tính khai báo",
      "Không, muốn nhiều Pod dùng chung phải đổi sang ReadOnlyMany",
    ],
    answer: 1,
    explanation: "`ReadWriteOnce` cho phép volume được mount read-write bởi MỘT node — nhiều Pod trên cùng node vẫn dùng chung được. Muốn giới hạn đúng một Pod thì dùng `ReadWriteOncePod`; `ReadWriteMany` mới cho nhiều node.",
  },
  {
    id: "q012",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Một PVC ở trạng thái Pending kéo dài (không có dynamic provisioning). Nguyên nhân phổ biến nhất là gì?",
    code: null,
    options: [
      "PVC chưa được gắn vào Pod nào",
      "Namespace chưa có ResourceQuota cho storage",
      "kubelet trên node chưa được cấp quyền mount",
      "Không có PV nào thỏa mãn về capacity, accessModes và storageClassName để bind",
    ],
    answer: 3,
    explanation: "PVC bind với PV theo tiêu chí dung lượng đủ lớn, accessModes tương thích và cùng `storageClassName`; không có PV phù hợp thì PVC ở Pending. Dùng `kubectl describe pvc` để xem event chi tiết.",
  },
  {
    id: "q013",
    cert: "CKAD",
    domain: "design",
    difficulty: 3,
    question: "Việc đặt `storageClassName: \"\"` (chuỗi rỗng) trong PVC dưới đây có ý nghĩa gì?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: static-pvc
spec:
  storageClassName: ""
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi`,
    },
    options: [
      "Giống hệt việc bỏ trống field: dùng StorageClass mặc định của cluster",
      "PVC sẽ bị API server từ chối vì giá trị không hợp lệ",
      "PVC tự tạo một StorageClass mới tên rỗng",
      "Tắt dynamic provisioning: PVC chỉ bind với PV tĩnh có storageClassName rỗng",
    ],
    answer: 3,
    explanation: "Chuỗi rỗng là giá trị hợp lệ và khác với việc không khai báo: `storageClassName: \"\"` yêu cầu bind PV được provision sẵn (static), còn bỏ trống field thì admission controller sẽ điền StorageClass mặc định để dynamic provisioning.",
  },
  {
    id: "q014",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "Trường hợp nào sau đây là ví dụ điển hình của sidecar pattern?",
    code: null,
    options: [
      "Container chạy migration database rồi thoát trước khi app start",
      "Container thu gom log của container chính và đẩy lên hệ thống log tập trung",
      "Hai bản sao của cùng một app chạy trong hai Pod khác nhau",
      "Container chính tự fork thêm process phụ bên trong",
    ],
    answer: 1,
    explanation: "Sidecar là container phụ chạy song song cùng Pod để bổ sung chức năng (log shipping, proxy, sync file) và chia sẻ volume/network với container chính. Migration chạy rồi thoát là init container pattern.",
  },
  {
    id: "q015",
    cert: "CKAD",
    domain: "design",
    difficulty: 3,
    question: "App của bạn cần kết nối tới một cluster Redis phức tạp; bạn thêm một container phụ làm proxy để app chỉ cần trỏ về `localhost:6379`. Đây là pattern nào?",
    code: null,
    options: [
      "Adapter — vì nó chuyển đổi giao thức dữ liệu",
      "Init container — vì nó phải chạy trước app",
      "Ambassador — container phụ đóng vai trò proxy các kết nối mạng ra bên ngoài thay cho container chính",
      "Anti-affinity — vì nó tách app khỏi Redis",
    ],
    answer: 2,
    explanation: "Ambassador pattern dùng container phụ làm proxy đại diện cho các kết nối đi ra (ví dụ tới database/cluster bên ngoài), giúp app đơn giản hóa cấu hình. Adapter thì ngược lại: chuẩn hóa đầu ra (ví dụ format metrics) của container chính cho hệ thống bên ngoài.",
  },
  {
    id: "q016",
    cert: "CKAD",
    domain: "design",
    difficulty: 2,
    question: "Image `busybox:1.36` có CMD mặc định là `sh`. Container trong Pod sau sẽ thực thi lệnh gì?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: greeter
spec:
  containers:
  - name: busy
    image: busybox:1.36
    command: ["echo"]
    args: ["hello"]
  restartPolicy: Never`,
    },
    options: [
      "Chạy `echo hello` — command và args thay thế hoàn toàn ENTRYPOINT/CMD của image",
      "Chạy `sh echo hello` vì CMD của image được giữ lại",
      "Chạy `sh -c hello` vì command chỉ có hiệu lực khi không có args",
      "Báo lỗi vì không được khai báo cả command lẫn args cùng lúc",
    ],
    answer: 0,
    explanation: "Khi khai báo cả `command` và `args`, chúng thay thế hoàn toàn ENTRYPOINT và CMD của image; container chạy `echo hello`, in ra rồi thoát. Khai báo cả hai cùng lúc là hoàn toàn hợp lệ.",
  },
  {
    id: "q017",
    cert: "CKAD",
    domain: "design",
    difficulty: 3,
    question: "Một Job có cả `activeDeadlineSeconds: 100` và `backoffLimit: 6`. Điều gì xảy ra khi Job chạy đến giây 100 mà mới retry 2 lần?",
    code: null,
    options: [
      "Job bị chấm dứt ngay: mọi Pod đang chạy bị kill và Job đánh dấu Failed với reason DeadlineExceeded",
      "Job tiếp tục chạy cho đến khi dùng hết 6 lần retry",
      "Job tạm dừng và tự resume sau 100 giây nữa",
      "Chỉ Pod hiện tại bị kill, Job tạo Pod mới và đếm lại deadline",
    ],
    answer: 0,
    explanation: "`job.spec.activeDeadlineSeconds` có độ ưu tiên cao hơn `backoffLimit`: hết deadline thì toàn bộ Pod của Job bị chấm dứt và Job Failed với `reason: DeadlineExceeded`, bất kể còn bao nhiêu lần retry.",
  },
  {
    id: "q018",
    cert: "CKAD",
    domain: "design",
    difficulty: 1,
    question: "Bạn cần chạy đúng một bản agent thu thập metrics trên MỖI node của cluster (kể cả node mới thêm vào). Workload resource nào phù hợp nhất?",
    code: null,
    options: [
      "Deployment với replicas bằng số node",
      "StatefulSet với podAntiAffinity",
      "Job với parallelism cao",
      "DaemonSet",
    ],
    answer: 3,
    explanation: "DaemonSet đảm bảo mỗi node (thỏa điều kiện scheduling) chạy đúng một Pod và tự động thêm Pod khi node mới join cluster — Deployment không tự bám theo số lượng node.",
  },

  // ===== CKAD — Application Deployment (deployment) =====
  {
    id: "q019",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 1,
    question: "Trong chiến lược RollingUpdate của Deployment, `maxSurge` có ý nghĩa gì?",
    code: null,
    options: [
      "Số Pod cũ tối đa có thể không sẵn sàng trong khi update",
      "Số Pod tối đa được tạo VƯỢT quá số replicas mong muốn trong khi update",
      "Tốc độ tối đa (Pod/giây) khi rollout",
      "Số revision tối đa được lưu trong lịch sử rollout",
    ],
    answer: 1,
    explanation: "`deployment.spec.strategy.rollingUpdate.maxSurge` (số tuyệt đối hoặc %) cho phép tạm thời có nhiều hơn `replicas` Pod trong khi rollout; còn `maxUnavailable` mới là số Pod được phép thiếu hụt.",
  },
  {
    id: "q020",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Deployment sau rollout phiên bản mới như thế nào?",
    code: {
      lang: "yaml",
      text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0`,
    },
    options: [
      "Xóa từng Pod cũ rồi mới tạo Pod mới thay thế",
      "Xóa cả 3 Pod cũ cùng lúc rồi tạo 3 Pod mới",
      "Tạo 1 Pod mới trước, chờ nó Ready rồi mới xóa 1 Pod cũ — luôn có đủ 3 Pod sẵn sàng",
      "Tạo cả 3 Pod mới song song với 3 Pod cũ",
    ],
    answer: 2,
    explanation: "`maxUnavailable: 0` bảo đảm không lúc nào thiếu Pod sẵn sàng, còn `maxSurge: 1` cho phép tạm có 4 Pod: mỗi bước tạo 1 Pod mới, chờ Ready, rồi xóa 1 Pod cũ — zero-downtime.",
  },
  {
    id: "q021",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 1,
    question: "Lệnh nào để quay Deployment `web` về revision ngay trước đó sau một lần cập nhật lỗi?",
    code: null,
    options: [
      "`kubectl rollback deployment/web`",
      "`kubectl rollout restart deployment/web`",
      "`kubectl rollout undo deployment/web`",
      "`kubectl apply --revert -f web.yaml`",
    ],
    answer: 2,
    explanation: "`kubectl rollout undo deployment/web` quay về revision trước; thêm `--to-revision=<n>` để về một revision cụ thể. `rollout restart` chỉ khởi động lại Pod với cùng spec, không đổi phiên bản.",
  },
  {
    id: "q022",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Muốn cột CHANGE-CAUSE trong `kubectl rollout history` hiển thị lý do thay đổi, bạn làm gì?",
    code: null,
    options: [
      "Thêm label `change-cause` vào Pod template",
      "Đặt annotation `kubernetes.io/change-cause` trên Deployment (hoặc dùng `kubectl annotate`)",
      "Dùng cờ `--message` khi chạy kubectl apply",
      "Không thể — CHANGE-CAUSE luôn do hệ thống tự sinh",
    ],
    answer: 1,
    explanation: "`kubectl rollout history` đọc annotation `kubernetes.io/change-cause` của mỗi revision; bạn đặt nó bằng `kubectl annotate deployment web kubernetes.io/change-cause=\"update image to 1.27\"` sau mỗi thay đổi.",
  },
  {
    id: "q023",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Trong pipeline CI/CD, lệnh nào phù hợp để CHỜ và xác nhận một Deployment đã rollout thành công (fail pipeline nếu rollout hỏng)?",
    code: null,
    options: [
      "`kubectl get deployment web -w`",
      "`kubectl describe deployment web`",
      "`kubectl wait --for=condition=Ready pod -l app=web`",
      "`kubectl rollout status deployment/web`",
    ],
    answer: 3,
    explanation: "`kubectl rollout status` block cho đến khi rollout hoàn tất và trả về exit code khác 0 nếu rollout thất bại (ví dụ vượt `progressDeadlineSeconds`) — chuẩn để dùng trong CI.",
  },
  {
    id: "q024",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Khi nào nên dùng strategy `Recreate` thay vì `RollingUpdate` cho Deployment?",
    code: null,
    options: [
      "Khi ứng dụng không thể chạy hai phiên bản song song (ví dụ migration schema không tương thích) và chấp nhận downtime",
      "Khi muốn zero-downtime tuyệt đối",
      "Khi cluster có ít hơn 3 node",
      "Khi image quá lớn khiến kéo image chậm",
    ],
    answer: 0,
    explanation: "`strategy.type: Recreate` xóa toàn bộ Pod cũ trước khi tạo Pod mới nên có downtime, nhưng bảo đảm hai phiên bản không bao giờ chạy đồng thời — cần thiết khi phiên bản mới không tương thích dữ liệu/lock với bản cũ.",
  },
  {
    id: "q025",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Trong mô hình blue-green trên Kubernetes (hai Deployment `web-blue` và `web-green`), thao tác chuyển toàn bộ traffic sang phiên bản green thường là gì?",
    code: null,
    options: [
      "Scale Deployment blue về 0 rồi chờ Service tự phát hiện",
      "Cập nhật selector của Service từ `version: blue` sang `version: green`",
      "Đổi nodePort của Service sang cổng mới",
      "Xóa Deployment blue để Service chỉ còn thấy green",
    ],
    answer: 1,
    explanation: "Blue-green chuyển traffic tức thời bằng cách sửa `service.spec.selector` trỏ sang nhãn của Deployment green; Deployment blue vẫn giữ nguyên để rollback nhanh nếu cần.",
  },
  {
    id: "q026",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 3,
    question: "Bạn muốn canary ~10% traffic sang phiên bản mới chỉ bằng Deployment và Service (không có service mesh). Cách làm đúng là gì?",
    code: null,
    options: [
      "Chạy 2 Deployment cùng mang label mà Service select (ví dụ `app: web`): bản ổn định 9 replicas, bản canary 1 replica",
      "Tạo 2 Service với cùng selector, một cái đánh dấu canary",
      "Đặt annotation `traffic-split: 10%` trên Service",
      "Dùng `maxSurge: 10%` trên Deployment hiện có",
    ],
    answer: 0,
    explanation: "Service phân phối xấp xỉ đều giữa các endpoint, nên tỷ lệ traffic xấp xỉ tỷ lệ replicas: 1/(9+1) = 10% vào canary. Cả hai Deployment phải cùng mang label khớp `service.spec.selector`, khác nhau ở label phụ như `track: canary`.",
  },
  {
    id: "q027",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 1,
    question: "Lệnh Helm nào cài chart nếu release chưa tồn tại, và nâng cấp nếu đã tồn tại (idempotent)?",
    code: null,
    options: [
      "`helm install --force myapp ./chart`",
      "`helm apply myapp ./chart`",
      "`helm upgrade --install myapp ./chart`",
      "`helm create myapp ./chart`",
    ],
    answer: 2,
    explanation: "`helm upgrade --install` (thường viết tắt là `helm upgrade -i`) là cách chuẩn trong CI/CD: cài mới khi release chưa có, ngược lại thì upgrade. `helm apply` không tồn tại.",
  },
  {
    id: "q028",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Release Helm `shop` vừa được upgrade lên revision 5 và bị lỗi. Lệnh nào đưa release về revision 3?",
    code: null,
    options: [
      "`helm undo shop --to=3`",
      "`helm downgrade shop 3`",
      "`helm revert shop --revision 3`",
      "`helm rollback shop 3`",
    ],
    answer: 3,
    explanation: "`helm rollback <release> <revision>` quay release về revision chỉ định (xem danh sách bằng `helm history shop`). Bỏ số revision thì Helm quay về revision liền trước.",
  },
  {
    id: "q029",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 3,
    question: "Khác biệt chính giữa `helm template` và `helm install --dry-run` là gì?",
    code: null,
    options: [
      "helm template chỉ render được chart local, dry-run chỉ render được chart từ repo",
      "Không có khác biệt, hai lệnh là alias của nhau",
      "helm template tạo release trong cluster còn dry-run thì không",
      "helm template render hoàn toàn ở client, không cần kết nối cluster; install --dry-run gửi manifest lên API server để validate và có thể dùng lookup",
    ],
    answer: 3,
    explanation: "`helm template` chạy offline, hữu ích khi chưa có cluster (hàm `lookup` trả rỗng); `helm install --dry-run` cần kết nối cluster để validate manifest với API server nhưng không tạo tài nguyên thật.",
  },
  {
    id: "q030",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 1,
    question: "Khi chạy `helm install web ./chart --set image.tag=2.0`, giá trị `image.tag` cuối cùng được lấy từ đâu?",
    code: null,
    options: [
      "Từ file values.yaml vì file luôn có ưu tiên cao nhất",
      "Từ Chart.yaml của chart",
      "Từ cờ `--set` vì nó ghi đè giá trị trong values.yaml",
      "Helm báo lỗi vì trùng key giữa hai nguồn",
    ],
    answer: 2,
    explanation: "Thứ tự ưu tiên của Helm values: `--set` > `-f/--values` (file sau đè file trước) > values.yaml mặc định của chart. Vì vậy `--set image.tag=2.0` thắng giá trị trong values.yaml.",
  },
  {
    id: "q031",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Trong Kustomize, quan hệ giữa base và overlay là gì?",
    code: null,
    options: [
      "Overlay tham chiếu base và áp các patch/thay đổi theo môi trường (dev, staging, prod) mà không sửa base",
      "Base import overlay để tạo template dùng chung",
      "Base và overlay là hai bản copy độc lập của cùng manifest",
      "Overlay chỉ dùng để đổi tên namespace, mọi thay đổi khác phải sửa base",
    ],
    answer: 0,
    explanation: "Kustomize không dùng template: overlay khai báo base trong `resources:` của kustomization.yaml rồi patch (image, replicas, labels, env...) theo từng môi trường, giữ base nguyên vẹn và tái sử dụng.",
  },
  {
    id: "q032",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 1,
    question: "Lệnh nào build và apply trực tiếp một thư mục chứa kustomization.yaml?",
    code: null,
    options: [
      "`kubectl apply -f overlays/prod/`",
      "`kubectl apply -k overlays/prod/`",
      "`kubectl kustomize apply overlays/prod/`",
      "`helm install -k overlays/prod/`",
    ],
    answer: 1,
    explanation: "`kubectl apply -k <dir>` build kustomization rồi apply kết quả. Còn `kubectl kustomize <dir>` chỉ render YAML ra stdout mà không apply; `apply -f` không xử lý kustomization.yaml.",
  },
  {
    id: "q033",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "kustomization.yaml sau tạo ra thay đổi gì khi apply?",
    code: {
      lang: "yaml",
      text: `apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
images:
- name: nginx
  newTag: "1.27"
namePrefix: prod-`,
    },
    options: [
      "Đổi mọi image `nginx` trong deployment.yaml sang tag 1.27 và thêm tiền tố `prod-` vào tên resource",
      "Tạo image mới tên prod-nginx:1.27 trong registry",
      "Chỉ đổi tag image; namePrefix bị bỏ qua vì thiếu namespace",
      "Báo lỗi vì trường images không hợp lệ trong Kustomization",
    ],
    answer: 0,
    explanation: "Transformer `images` thay tag/tên image khớp `name: nginx`, còn `namePrefix` thêm tiền tố vào metadata.name của mọi resource được render (ví dụ Deployment `web` thành `prod-web`).",
  },
  {
    id: "q034",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Lệnh nào tạo HorizontalPodAutoscaler giữ CPU trung bình 80%, từ 2 đến 5 replicas cho Deployment `web`?",
    code: null,
    options: [
      "`kubectl scale deployment web --min=2 --max=5`",
      "`kubectl autoscale deployment web --min=2 --max=5 --cpu-percent=80`",
      "`kubectl create hpa web --replicas=2-5 --cpu=80`",
      "`kubectl set autoscale deployment/web 2:5:80`",
    ],
    answer: 1,
    explanation: "`kubectl autoscale` tạo HPA nhắm vào workload chỉ định; HPA cần metrics-server và các Pod phải khai báo `resources.requests.cpu` để tính phần trăm. `kubectl scale` chỉ đặt số replicas cố định.",
  },
  {
    id: "q035",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 3,
    question: "Điều gì xảy ra khi apply Deployment sau?",
    code: {
      lang: "yaml",
      text: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 2
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web-v2
    spec:
      containers:
      - name: nginx
        image: nginx:1.27`,
    },
    options: [
      "Tạo thành công nhưng Deployment không quản lý được Pod nào",
      "Tạo thành công, các Pod tự nhận thêm label app: web",
      "Pod bị treo ở Pending do không match node",
      "API server từ chối với lỗi selector không khớp template labels",
    ],
    answer: 3,
    explanation: "Với `apps/v1`, `spec.selector.matchLabels` bắt buộc phải là tập con của `template.metadata.labels`; ở đây `app: web` khác `app: web-v2` nên apply thất bại với lỗi `selector does not match template labels`.",
  },
  {
    id: "q036",
    cert: "CKAD",
    domain: "deployment",
    difficulty: 2,
    question: "Deployment `web` có một container tên `nginx`. Lệnh imperative nào cập nhật image của nó lên `nginx:1.27`?",
    code: null,
    options: [
      "`kubectl set image deployment/web web=nginx:1.27`",
      "`kubectl edit image deployment/web nginx:1.27`",
      "`kubectl set image deployment/web nginx=nginx:1.27`",
      "`kubectl update deployment/web --image nginx:1.27`",
    ],
    answer: 2,
    explanation: "Cú pháp là `kubectl set image <resource> <tên-container>=<image mới>` — phần bên trái dấu bằng là TÊN CONTAINER trong Pod template (ở đây là `nginx`), không phải tên Deployment.",
  },

  // ===== CKAD — Observability and Maintenance (observability) =====
  {
    id: "q037",
    cert: "CKAD",
    domain: "observability",
    difficulty: 1,
    question: "Điều gì xảy ra khi liveness probe của một container thất bại liên tục vượt ngưỡng failureThreshold?",
    code: null,
    options: [
      "Pod bị xóa vĩnh viễn khỏi node",
      "Container bị đánh dấu NotReady nhưng vẫn chạy",
      "kubelet restart container đó theo restartPolicy của Pod",
      "Toàn bộ Pod được chuyển sang node khác",
    ],
    answer: 2,
    explanation: "Liveness probe fail khiến kubelet kill và restart CONTAINER (không phải cả Pod, không reschedule sang node khác). Việc loại khỏi endpoints của Service là tác dụng của readiness probe.",
  },
  {
    id: "q038",
    cert: "CKAD",
    domain: "observability",
    difficulty: 1,
    question: "Khi readiness probe của một Pod thất bại, hậu quả trực tiếp là gì?",
    code: null,
    options: [
      "Container bị restart ngay lập tức",
      "Pod bị xóa và tạo lại",
      "kubelet dừng gửi log của Pod",
      "Pod bị loại khỏi danh sách endpoints của Service — không nhận traffic nữa, nhưng container vẫn chạy",
    ],
    answer: 3,
    explanation: "Readiness chỉ quyết định Pod có nhận traffic hay không: fail thì Pod bị gỡ khỏi EndpointSlice của Service cho đến khi probe pass trở lại. Restart container là hành vi của liveness probe.",
  },
  {
    id: "q039",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "startupProbe giải quyết vấn đề gì cho các ứng dụng khởi động chậm?",
    code: null,
    options: [
      "Tăng tốc quá trình khởi động bằng cách cấp thêm CPU",
      "Vô hiệu hóa liveness/readiness probe cho đến khi startupProbe thành công, tránh app bị kill khi chưa khởi động xong",
      "Tự động tăng initialDelaySeconds của mọi probe khác",
      "Trì hoãn việc gán Pod vào node cho đến khi image được kéo xong",
    ],
    answer: 1,
    explanation: "Khi khai báo `startupProbe`, kubelet tạm ngưng liveness và readiness probe cho đến khi startup probe pass; nhờ đó app khởi động chậm không bị liveness kill oan, mà không cần initialDelaySeconds dài cho mọi trường hợp.",
  },
  {
    id: "q040",
    cert: "CKAD",
    domain: "observability",
    difficulty: 3,
    question: "Với cấu hình probe sau, phát biểu nào mô tả đúng hành vi của kubelet?",
    code: {
      lang: "yaml",
      text: `livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3`,
    },
    options: [
      "Chờ 10 giây mới probe lần đầu; sau đó probe mỗi 5 giây và cần 3 lần fail LIÊN TIẾP thì container mới bị restart",
      "Probe ngay khi container start, restart sau đúng 10 giây nếu chưa có response",
      "Probe mỗi 10 giây, restart ngay ở lần fail đầu tiên",
      "Chờ 15 giây (10+5) rồi restart nếu tổng cộng có 3 lần fail bất kỳ trong đời container",
    ],
    answer: 0,
    explanation: "`initialDelaySeconds` chỉ trì hoãn lần probe đầu; `periodSeconds` là chu kỳ probe và `failureThreshold` đếm số lần fail liên tiếp (một lần thành công sẽ reset bộ đếm) trước khi kubelet restart container.",
  },
  {
    id: "q041",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Ứng dụng của bạn không có HTTP endpoint nhưng lắng nghe trên cổng TCP 5432. Loại probe nào phù hợp nhất để kiểm tra nó còn sống?",
    code: null,
    options: [
      "httpGet tới cổng 5432",
      "tcpSocket — probe thành công nếu kubelet mở được kết nối TCP tới cổng",
      "grpc probe",
      "Không thể probe được app không có HTTP",
    ],
    answer: 1,
    explanation: "Probe có ba cơ chế chính: `httpGet` (status 200–399 là pass), `tcpSocket` (mở được kết nối là pass) và `exec` (lệnh exit 0 là pass). Với app chỉ nghe TCP thuần, `tcpSocket` là lựa chọn tự nhiên.",
  },
  {
    id: "q042",
    cert: "CKAD",
    domain: "observability",
    difficulty: 1,
    question: "Container trong Pod `api-7d4f` vừa crash và đã restart. Lệnh nào xem log của lần chạy TRƯỚC khi crash?",
    code: null,
    options: [
      "`kubectl logs api-7d4f --since=10m`",
      "`kubectl logs api-7d4f --tail=100`",
      "`kubectl logs api-7d4f --previous`",
      "`kubectl describe pod api-7d4f`",
    ],
    answer: 2,
    explanation: "`kubectl logs --previous` (viết tắt `-p`) đọc log của instance container đã kết thúc trước đó — thiết yếu khi debug CrashLoopBackOff vì log hiện tại thường chưa kịp có gì.",
  },
  {
    id: "q043",
    cert: "CKAD",
    domain: "observability",
    difficulty: 1,
    question: "Pod `web` có hai container `app` và `log-shipper`. Lệnh nào theo dõi (stream) log của riêng container `log-shipper`?",
    code: null,
    options: [
      "`kubectl logs -f web -c log-shipper`",
      "`kubectl logs -f web/log-shipper`",
      "`kubectl logs -f web --container-index=1`",
      "`kubectl logs -f log-shipper -n web`",
    ],
    answer: 0,
    explanation: "Với Pod nhiều container phải chỉ định container bằng `-c <tên>`; `-f` (follow) stream log liên tục. Dùng `--all-containers=true` nếu muốn log của tất cả container.",
  },
  {
    id: "q044",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Lệnh `kubectl top pod` báo lỗi `Metrics API not available`. Nguyên nhân là gì?",
    code: null,
    options: [
      "Các Pod chưa khai báo resources.requests nên không đo được",
      "Thiếu quyền RBAC đọc log của Pod",
      "Prometheus chưa được cài trong cluster",
      "Cluster chưa cài metrics-server — thành phần cung cấp Metrics API cho kubectl top và HPA",
    ],
    answer: 3,
    explanation: "`kubectl top pod/node` đọc từ Metrics API do metrics-server cung cấp; không có metrics-server thì lệnh thất bại. Prometheus là hệ thống giám sát riêng, không phải backend của `kubectl top`.",
  },
  {
    id: "q045",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Trạng thái CrashLoopBackOff của một Pod có nghĩa là gì?",
    code: null,
    options: [
      "Image không kéo được nên container chưa từng chạy",
      "Pod không được schedule vì thiếu tài nguyên",
      "Node của Pod bị NotReady lặp đi lặp lại",
      "Container khởi động rồi liên tục thoát/crash; kubelet restart nó với thời gian chờ (backoff) tăng dần",
    ],
    answer: 3,
    explanation: "CrashLoopBackOff nghĩa là container CHẠY ĐƯỢC nhưng cứ thoát bất thường; kubelet restart với backoff lũy tiến (tối đa 5 phút). Bắt đầu debug bằng `kubectl logs --previous` và `kubectl describe pod`.",
  },
  {
    id: "q046",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Pod bị treo ở Pending với event như sau. Cách khắc phục hợp lý nhất là gì?",
    code: {
      lang: "bash",
      text: `$ kubectl describe pod big-app | tail -2
  Warning  FailedScheduling  2m  default-scheduler
  0/3 nodes are available: 3 Insufficient memory.`,
    },
    options: [
      "Giảm `resources.requests.memory` của Pod xuống mức node đáp ứng được, hoặc thêm node/tăng cỡ node",
      "Tăng `resources.limits.memory` để Pod được ưu tiên hơn",
      "Restart kube-scheduler để nó thử lại",
      "Thêm toleration để Pod bỏ qua kiểm tra tài nguyên",
    ],
    answer: 0,
    explanation: "Scheduler chọn node dựa trên `resources.requests` so với phần còn trống (allocatable) của node; `Insufficient memory` nghĩa là không node nào đủ chỗ theo requests. Tăng limits không giúp gì, toleration không bỏ qua được kiểm tra tài nguyên.",
  },
  {
    id: "q047",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Pod ở trạng thái ImagePullBackOff. Nguyên nhân nào KHÔNG phải là thủ phạm thường gặp?",
    code: null,
    options: [
      "Tên image hoặc tag bị gõ sai",
      "Image nằm trong registry private nhưng Pod thiếu imagePullSecrets",
      "Container thoát với exit code khác 0 ngay sau khi start",
      "Node không có kết nối mạng tới registry",
    ],
    answer: 2,
    explanation: "ImagePullBackOff xảy ra TRƯỚC khi container chạy — do không kéo được image (sai tên/tag, thiếu credential qua `pod.spec.imagePullSecrets`, lỗi mạng). Container chạy rồi crash là chuyện của CrashLoopBackOff.",
  },
  {
    id: "q048",
    cert: "CKAD",
    domain: "observability",
    difficulty: 2,
    question: "Trích `kubectl describe pod` cho thấy như sau. Chuyện gì đã xảy ra và hướng xử lý?",
    code: {
      lang: "bash",
      text: `Last State:  Terminated
  Reason:    OOMKilled
  Exit Code: 137
Restart Count: 4`,
    },
    options: [
      "Node hết dung lượng đĩa; cần dọn image không dùng",
      "Container dùng vượt `resources.limits.memory` nên bị kernel kill (exit 137); cần tăng limit hoặc giảm mức tiêu thụ bộ nhớ của app",
      "Liveness probe fail 4 lần; cần tăng failureThreshold",
      "Container bị admin kill thủ công bằng kubectl delete",
    ],
    answer: 1,
    explanation: "`OOMKilled` với exit code 137 (128+9, SIGKILL) nghĩa là container chạm trần memory limit. Xử lý bằng cách tăng `resources.limits.memory`, tối ưu app, hoặc xem lại memory leak — tăng failureThreshold không liên quan.",
  },
  {
    id: "q049",
    cert: "CKAD",
    domain: "observability",
    difficulty: 1,
    question: "Muốn xem các Event (FailedScheduling, FailedMount, Unhealthy...) liên quan đến một Pod cụ thể, lệnh nào trực tiếp nhất?",
    code: null,
    options: [
      "`kubectl describe pod <tên-pod>` — phần Events ở cuối output",
      "`kubectl logs <tên-pod> --events`",
      "`kubectl top pod <tên-pod>`",
      "`kubectl explain pod.events`",
    ],
    answer: 0,
    explanation: "`kubectl describe pod` tổng hợp trạng thái container, điều kiện và bảng Events của Pod — điểm bắt đầu chuẩn khi debug. Ngoài ra có thể dùng `kubectl get events --field-selector involvedObject.name=<pod>`.",
  },
  {
    id: "q050",
    cert: "CKAD",
    domain: "observability",
    difficulty: 3,
    question: "Một manifest cũ dùng `apiVersion: extensions/v1beta1` cho Ingress và bị cluster 1.29 từ chối. Cách xử lý đúng là gì?",
    code: null,
    options: [
      "Thêm cờ `--validate=false` khi apply để bỏ qua kiểm tra",
      "Downgrade cluster về phiên bản còn hỗ trợ API cũ",
      "Bật lại API cũ bằng feature gate trên kube-apiserver",
      "Cập nhật manifest sang `networking.k8s.io/v1` — dùng `kubectl api-resources` hoặc `kubectl explain ingress` để xác nhận apiVersion hiện hành",
    ],
    answer: 3,
    explanation: "API đã bị gỡ bỏ (removed) thì không bật lại được và `--validate=false` cũng vô ích vì API server không còn endpoint đó. Ingress ổn định ở `networking.k8s.io/v1` từ K8s 1.19; `kubectl api-resources` liệt kê apiVersion mỗi resource đang được cluster phục vụ.",
  },

  // ===== CKAD — Environment, Configuration and Security (config) =====
  {
    id: "q051",
    cert: "CKAD",
    domain: "config",
    difficulty: 1,
    question: "Lệnh imperative nào tạo ConfigMap `app-config` với key DB_HOST=db.local?",
    code: null,
    options: [
      "`kubectl create configmap app-config --from-literal=DB_HOST=db.local`",
      "`kubectl create configmap app-config --set DB_HOST=db.local`",
      "`kubectl apply configmap app-config DB_HOST=db.local`",
      "`kubectl create cm app-config --env DB_HOST=db.local`",
    ],
    answer: 0,
    explanation: "`kubectl create configmap` nhận `--from-literal=key=value` (lặp lại được nhiều lần), `--from-file` và `--from-env-file`. Cờ `--set` hay `--env` không tồn tại cho lệnh này.",
  },
  {
    id: "q052",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Cấu hình sau đưa dữ liệu ConfigMap vào container theo cách nào?",
    code: {
      lang: "yaml",
      text: `spec:
  containers:
  - name: app
    image: myapp:1.0
    envFrom:
    - configMapRef:
        name: app-config`,
    },
    options: [
      "Mount ConfigMap thành các file trong thư mục /app-config",
      "Chỉ nạp key tên là app-config vào biến môi trường cùng tên",
      "Ghi toàn bộ ConfigMap vào file JSON trong container",
      "Nạp TẤT CẢ các key của ConfigMap thành biến môi trường, tên biến trùng tên key",
    ],
    answer: 3,
    explanation: "`envFrom.configMapRef` bơm mọi cặp key/value của ConfigMap thành biến môi trường (có thể thêm `prefix`). Muốn chọn từng key thì dùng `env[].valueFrom.configMapKeyRef`; muốn dạng file thì mount volume.",
  },
  {
    id: "q053",
    cert: "CKAD",
    domain: "config",
    difficulty: 3,
    question: "Bạn cập nhật một ConfigMap đang được Pod sử dụng. Trường hợp nào container sẽ TỰ ĐỘNG thấy giá trị mới (không cần restart Pod)?",
    code: null,
    options: [
      "Khi ConfigMap được nạp qua env hoặc envFrom",
      "Khi ConfigMap được mount volume với subPath",
      "Khi ConfigMap được mount như volume (không dùng subPath) — kubelet đồng bộ file sau một độ trễ",
      "Không có trường hợp nào; mọi thay đổi ConfigMap đều cần tạo lại Pod",
    ],
    answer: 2,
    explanation: "Chỉ ConfigMap mount dạng volume thường mới được kubelet cập nhật tự động (độ trễ theo sync period). Biến môi trường chỉ đọc lúc container start, và mount qua `subPath` cũng KHÔNG nhận cập nhật — hai bẫy kinh điển.",
  },
  {
    id: "q054",
    cert: "CKAD",
    domain: "config",
    difficulty: 1,
    question: "Phát biểu nào đúng về dữ liệu trong trường `data` của Secret?",
    code: null,
    options: [
      "Dữ liệu được mã hóa AES nên an toàn tuyệt đối",
      "Dữ liệu chỉ được encode base64 — không phải mã hóa; ai đọc được Secret đều decode ra bản gốc",
      "Dữ liệu được hash một chiều, không thể khôi phục",
      "Dữ liệu chỉ giải mã được bởi Pod dùng đúng ServiceAccount",
    ],
    answer: 1,
    explanation: "Base64 là ENCODING, không phải encryption: `echo <giá-trị> | base64 -d` là đọc được ngay. Muốn bảo vệ thật sự cần RBAC chặt và bật encryption at rest cho etcd.",
  },
  {
    id: "q055",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Trường `stringData` trong manifest Secret khác `data` như thế nào?",
    code: null,
    options: [
      "stringData chỉ dùng cho Secret kiểu TLS",
      "stringData lưu giá trị dạng plain text vĩnh viễn trong etcd",
      "stringData bị deprecated từ K8s 1.25",
      "stringData cho phép viết giá trị plain text trong manifest; API server tự encode base64 và gộp vào data khi lưu",
    ],
    answer: 3,
    explanation: "`stringData` là tiện ích write-only: bạn viết giá trị thường (không cần tự base64), server encode rồi lưu vào `data`. Khi get lại Secret, bạn chỉ thấy `data` đã encode.",
  },
  {
    id: "q056",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Biến môi trường DB_PASS của container dưới đây nhận giá trị gì?",
    code: {
      lang: "yaml",
      text: `spec:
  containers:
  - name: app
    image: myapp:1.0
    env:
    - name: DB_PASS
      valueFrom:
        secretKeyRef:
          name: db-secret
          key: password`,
    },
    options: [
      "Giá trị đã decode của key `password` trong Secret `db-secret`",
      "Chuỗi base64 của key `password` (app phải tự decode)",
      "Toàn bộ nội dung Secret db-secret dạng JSON",
      "Chuỗi `db-secret/password` để app tự đi lấy",
    ],
    answer: 0,
    explanation: "`env[].valueFrom.secretKeyRef` trỏ tới một key cụ thể của Secret; kubelet decode base64 trước khi đặt vào biến môi trường nên app nhận được giá trị gốc.",
  },
  {
    id: "q057",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Để Pod kéo được image từ registry private, bạn tạo Secret loại nào và tham chiếu ra sao?",
    code: null,
    options: [
      "Secret loại Opaque chứa USERNAME/PASSWORD, nạp qua envFrom",
      "Secret tạo bằng `kubectl create secret docker-registry` (loại kubernetes.io/dockerconfigjson), tham chiếu qua `pod.spec.imagePullSecrets`",
      "Secret loại kubernetes.io/tls chứa chứng chỉ registry",
      "Không cần Secret — chỉ cần đăng nhập docker trên máy chạy kubectl",
    ],
    answer: 1,
    explanation: "Credential registry phải ở dạng `kubernetes.io/dockerconfigjson` và được kubelet dùng khi pull image thông qua `imagePullSecrets` (khai báo trên Pod hoặc gắn vào ServiceAccount). Đăng nhập trên máy kubectl không giúp gì cho kubelet trên node.",
  },
  {
    id: "q058",
    cert: "CKAD",
    domain: "config",
    difficulty: 1,
    question: "Khác biệt giữa `resources.requests` và `resources.limits` của container là gì?",
    code: null,
    options: [
      "requests là lượng tài nguyên dùng để scheduler chọn node; limits là mức trần khi chạy (CPU bị throttle, vượt memory bị OOMKill)",
      "requests là mức trần, limits là mức sàn",
      "requests chỉ áp dụng cho CPU, limits chỉ áp dụng cho memory",
      "Hai trường tương đương, chỉ khác tên",
    ],
    answer: 0,
    explanation: "Scheduler cộng `requests` để quyết định Pod vừa node nào; runtime enforce `limits`: CPU vượt limit thì bị throttle, memory vượt limit thì container bị OOMKill.",
  },
  {
    id: "q059",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Pod với cấu hình resources sau thuộc QoS class nào?",
    code: {
      lang: "yaml",
      text: `spec:
  containers:
  - name: app
    image: myapp:1.0
    resources:
      requests:
        cpu: "500m"
        memory: "256Mi"
      limits:
        cpu: "500m"
        memory: "256Mi"`,
    },
    options: [
      "Burstable",
      "BestEffort",
      "Guaranteed",
      "Premium",
    ],
    answer: 2,
    explanation: "Guaranteed yêu cầu MỌI container đều có requests bằng limits cho cả CPU lẫn memory — thỏa mãn ở đây. Chỉ cần một chênh lệch (hoặc thiếu một trường) là rơi xuống Burstable.",
  },
  {
    id: "q060",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Một Pod không khai báo requests/limits nào cho bất kỳ container nào. Phát biểu nào đúng?",
    code: null,
    options: [
      "Pod thuộc QoS Guaranteed vì được cấp tài nguyên không giới hạn",
      "Pod không được schedule cho đến khi khai báo requests",
      "Pod thuộc QoS Burstable, mức trung bình",
      "Pod thuộc QoS BestEffort và nằm trong nhóm bị evict ĐẦU TIÊN khi node cạn tài nguyên",
    ],
    answer: 3,
    explanation: "Không có requests/limits nào thì Pod là BestEffort — ưu tiên thấp nhất khi kubelet phải evict do node-pressure (BestEffort trước, rồi Burstable vượt requests, Guaranteed được bảo vệ nhất).",
  },
  {
    id: "q061",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Khác biệt giữa LimitRange và ResourceQuota trong một namespace là gì?",
    code: null,
    options: [
      "LimitRange áp cho node, ResourceQuota áp cho Pod",
      "ResourceQuota đặt default requests/limits cho container, LimitRange giới hạn tổng",
      "Hai object này thay thế được cho nhau",
      "LimitRange áp min/max/default cho TỪNG Pod/container; ResourceQuota giới hạn TỔNG tài nguyên và số object của cả namespace",
    ],
    answer: 3,
    explanation: "LimitRange kiểm soát từng đối tượng đơn lẻ (kèm khả năng gán `default`/`defaultRequest` khi container không khai báo); ResourceQuota là ngân sách gộp của namespace (tổng CPU/memory, số Pod, số Service...).",
  },
  {
    id: "q062",
    cert: "CKAD",
    domain: "config",
    difficulty: 3,
    question: "Namespace có ResourceQuota sau. Điều gì xảy ra khi tạo một Pod KHÔNG khai báo requests/limits cho CPU và memory?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi`,
    },
    options: [
      "Pod được tạo bình thường và không bị tính vào quota",
      "Pod được tạo với requests mặc định do quota tự sinh",
      "Pod bị API server TỪ CHỐI: khi quota quản lý compute resources, mọi Pod phải khai báo requests/limits tương ứng (trừ khi LimitRange cấp default)",
      "Pod được tạo nhưng bị đánh dấu BestEffort và evict ngay",
    ],
    answer: 2,
    explanation: "Đây là quy tắc hay bị bỏ quên: quota trên `requests.*`/`limits.*` buộc mọi Pod mới phải khai báo các giá trị đó, nếu không sẽ bị từ chối ngay từ admission với lỗi `must specify ...`. Thường phải kèm một LimitRange đặt default để tránh phiền hà.",
  },
  {
    id: "q063",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Pod đặt `spec.securityContext.runAsUser: 1000`, còn container `app` đặt `securityContext.runAsUser: 2000`. Container `app` chạy dưới UID nào?",
    code: null,
    options: [
      "UID 2000 — securityContext cấp container ghi đè cấp Pod cho các trường trùng nhau",
      "UID 1000 — cấp Pod luôn thắng",
      "UID 0 vì cấu hình xung đột",
      "Pod bị từ chối tạo do khai báo trùng",
    ],
    answer: 0,
    explanation: "Các trường xuất hiện ở cả hai cấp (runAsUser, runAsGroup, runAsNonRoot...) thì giá trị ở `containers[].securityContext` ghi đè `pod.spec.securityContext`; cấp Pod chỉ là mặc định chung cho các container không tự khai báo.",
  },
  {
    id: "q064",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Trường `fsGroup` trong securityContext có tác dụng gì và khai báo được ở đâu?",
    code: null,
    options: [
      "Đổi group của process trong container; khai báo ở cấp container",
      "Đặt group sở hữu cho các volume được mount (file mới thuộc group này); chỉ khai báo được ở cấp Pod (`pod.spec.securityContext.fsGroup`)",
      "Giới hạn dung lượng filesystem; khai báo ở cả hai cấp",
      "Bật chế độ đọc-ghi cho hostPath; chỉ khai báo ở cấp container",
    ],
    answer: 1,
    explanation: "`fsGroup` khiến kubelet chown/chmod dữ liệu volume theo GID chỉ định để container non-root ghi được vào volume; đây là trường CHỈ có ở pod-level securityContext, không tồn tại ở container-level.",
  },
  {
    id: "q065",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "YAML sau có lỗi gì?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: net-tool
spec:
  securityContext:
    capabilities:
      add: ["NET_ADMIN"]
  containers:
  - name: tool
    image: nettools:1.0`,
    },
    options: [
      "`capabilities` không hợp lệ ở pod-level securityContext — phải đặt trong `containers[].securityContext.capabilities`",
      "Thiếu trường `drop` bắt buộc khi đã có `add`",
      "NET_ADMIN phải viết là CAP_NET_ADMIN",
      "YAML hoàn toàn hợp lệ, không có lỗi",
    ],
    answer: 0,
    explanation: "Linux capabilities là thuộc tính CONTAINER-level: `pod.spec.securityContext` không có trường `capabilities` nên manifest bị từ chối (unknown field). Chuyển khối này xuống securityContext của container `tool` là xong.",
  },
  {
    id: "q066",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "`allowPrivilegeEscalation: false` trong securityContext của container ngăn chặn điều gì?",
    code: null,
    options: [
      "Container tạo kết nối mạng ra ngoài cluster",
      "Process trong container giành thêm privilege cao hơn process cha (ví dụ qua binary setuid như sudo)",
      "Container mount thêm volume mới lúc runtime",
      "Pod được schedule lên node control plane",
    ],
    answer: 1,
    explanation: "Trường này set cờ `no_new_privs` cho process: các cơ chế nâng quyền như setuid/setgid binary hay file capabilities không còn tác dụng. Đây là yêu cầu của chuẩn Pod Security `restricted`.",
  },
  {
    id: "q067",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Container bật `readOnlyRootFilesystem: true` nhưng app cần ghi file tạm vào /tmp. Giải pháp chuẩn là gì?",
    code: null,
    options: [
      "Tắt readOnlyRootFilesystem vì hai yêu cầu mâu thuẫn",
      "Thêm capability SYS_ADMIN để bỏ qua kiểm tra ghi",
      "Chạy container với runAsUser: 0 để có quyền ghi",
      "Mount một volume `emptyDir` vào /tmp — volume mount không bị ràng buộc bởi root filesystem read-only",
    ],
    answer: 3,
    explanation: "`readOnlyRootFilesystem` chỉ khóa filesystem gốc của container; các volume mount (emptyDir, PVC...) vẫn ghi được bình thường. Mount emptyDir vào các thư mục cần ghi là pattern chuẩn để giữ hardening.",
  },
  {
    id: "q068",
    cert: "CKAD",
    domain: "config",
    difficulty: 1,
    question: "Làm thế nào để Pod chạy dưới một ServiceAccount cụ thể tên `app-sa`?",
    code: null,
    options: [
      "Thêm label `serviceaccount: app-sa` vào Pod",
      "Đặt biến môi trường SERVICE_ACCOUNT=app-sa",
      "Khai báo `spec.serviceAccountName: app-sa` trong Pod spec (SA phải tồn tại trong cùng namespace)",
      "Dùng lệnh `kubectl bind sa app-sa pod/mypod`",
    ],
    answer: 2,
    explanation: "Trường `pod.spec.serviceAccountName` chỉ định identity của Pod; bỏ trống thì Pod dùng ServiceAccount `default` của namespace. ServiceAccount là tài nguyên namespaced nên phải cùng namespace với Pod.",
  },
  {
    id: "q069",
    cert: "CKAD",
    domain: "config",
    difficulty: 2,
    question: "Khi nào bắt buộc phải dùng ClusterRole thay vì Role?",
    code: null,
    options: [
      "Khi muốn cấp quyền cho ServiceAccount thay vì user",
      "Khi cần quyền write thay vì chỉ read",
      "Khi cấp quyền trên tài nguyên không thuộc namespace (nodes, persistentvolumes) hoặc trên mọi namespace",
      "Khi namespace có nhiều hơn 10 Role",
    ],
    answer: 2,
    explanation: "Role là namespaced và chỉ nói về tài nguyên trong một namespace; tài nguyên cluster-scoped (`kubectl api-resources --namespaced=false`) hoặc quyền xuyên mọi namespace đòi hỏi ClusterRole (kết hợp ClusterRoleBinding).",
  },
  {
    id: "q070",
    cert: "CKAD",
    domain: "config",
    difficulty: 3,
    question: "Một RoleBinding trong namespace `dev` tham chiếu tới ClusterRole `view`. Kết quả là gì?",
    code: null,
    options: [
      "Không hợp lệ — RoleBinding chỉ được tham chiếu Role",
      "Subject được quyền view trên TOÀN cluster",
      "ClusterRole tự động bị copy thành Role trong namespace dev",
      "Subject được các quyền định nghĩa trong ClusterRole `view` nhưng CHỈ trong phạm vi namespace dev",
    ],
    answer: 3,
    explanation: "Đây là pattern tái sử dụng chính thống: RoleBinding + ClusterRole giới hạn hiệu lực của ClusterRole vào namespace của binding. Muốn hiệu lực toàn cluster phải dùng ClusterRoleBinding.",
  },
  {
    id: "q071",
    cert: "CKAD",
    domain: "config",
    difficulty: 1,
    question: "Lệnh nào kiểm tra ServiceAccount `app-sa` trong namespace `dev` có quyền tạo Pod ở đó hay không?",
    code: null,
    options: [
      "`kubectl get rolebinding -n dev | grep app-sa`",
      "`kubectl auth can-i create pods -n dev --as=system:serviceaccount:dev:app-sa`",
      "`kubectl describe sa app-sa -n dev`",
      "`kubectl auth check app-sa create pods`",
    ],
    answer: 1,
    explanation: "`kubectl auth can-i <verb> <resource>` trả lời yes/no; cờ `--as` với định danh `system:serviceaccount:<namespace>:<tên-sa>` cho phép kiểm tra thay mặt một ServiceAccount mà không cần token của nó.",
  },
  {
    id: "q072",
    cert: "CKAD",
    domain: "config",
    difficulty: 3,
    question: "Pod của bạn không bao giờ gọi Kubernetes API. Cách nào giảm bề mặt tấn công liên quan đến token ServiceAccount?",
    code: null,
    options: [
      "Đặt `automountServiceAccountToken: false` trên Pod spec (hoặc trên ServiceAccount) để token không bị mount vào container",
      "Xóa ServiceAccount default của namespace",
      "Đặt token vào Secret loại Opaque thay vì projected volume",
      "Chuyển Pod sang namespace kube-system nơi token được bảo vệ",
    ],
    answer: 0,
    explanation: "Mặc định token SA được mount vào `/var/run/secrets/kubernetes.io/serviceaccount`; app không cần gọi API thì tắt bằng `pod.spec.automountServiceAccountToken: false` — kẻ chiếm được container sẽ không có sẵn credential API.",
  },

  // ===== CKAD — Services and Networking (networking) =====
  {
    id: "q073",
    cert: "CKAD",
    domain: "networking",
    difficulty: 1,
    question: "Nếu không khai báo `spec.type`, Service được tạo với loại nào và phạm vi truy cập ra sao?",
    code: null,
    options: [
      "NodePort — truy cập được qua IP của node",
      "ClusterIP — chỉ truy cập được từ bên trong cluster qua IP/DNS nội bộ",
      "LoadBalancer — tự xin IP công khai",
      "ExternalName — trỏ ra DNS bên ngoài",
    ],
    answer: 1,
    explanation: "`ClusterIP` là type mặc định: Service nhận một IP ảo nội bộ và chỉ các workload trong cluster gọi được. NodePort/LoadBalancer là các lớp mở rộng để nhận traffic từ ngoài.",
  },
  {
    id: "q074",
    cert: "CKAD",
    domain: "networking",
    difficulty: 1,
    question: "Dải cổng mặc định mà Kubernetes cấp cho Service loại NodePort là gì?",
    code: null,
    options: [
      "1024–2048",
      "8000–9000",
      "30000–32767",
      "80–443",
    ],
    answer: 2,
    explanation: "NodePort mặc định nằm trong dải 30000–32767 (cấu hình qua `--service-node-port-range` của kube-apiserver); mỗi node đều lắng nghe cổng đó và chuyển tiếp vào Service.",
  },
  {
    id: "q075",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Trong spec của Service, bộ ba `port`, `targetPort`, `nodePort` lần lượt có ý nghĩa gì?",
    code: null,
    options: [
      "port: cổng mà Service expose nội bộ; targetPort: cổng container đích nhận traffic; nodePort: cổng mở trên mỗi node (chỉ với type NodePort/LoadBalancer)",
      "port: cổng trên node; targetPort: cổng Service; nodePort: cổng container",
      "port: cổng container; targetPort: cổng node; nodePort: cổng Service",
      "Cả ba luôn phải bằng nhau để Service hoạt động",
    ],
    answer: 0,
    explanation: "Client trong cluster gọi `<service>:port`; kube-proxy chuyển tới `targetPort` trên container (mặc định bằng port nếu bỏ trống, có thể là tên port); `nodePort` chỉ xuất hiện khi cần nhận traffic qua IP node.",
  },
  {
    id: "q076",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Các Pod backend mang label `app: web-api`. Vì sao gọi tới Service dưới đây bị lỗi không có endpoint?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    app: web
  ports:
  - port: 80
    targetPort: 8080`,
    },
    options: [
      "Thiếu trường type nên Service không hoạt động",
      "targetPort 8080 không nằm trong dải cho phép",
      "Thiếu nodePort nên không route được",
      "Selector `app: web` không khớp label `app: web-api` của Pod nên EndpointSlice rỗng",
    ],
    answer: 3,
    explanation: "Service chọn backend hoàn toàn bằng label selector; lệch một giá trị là danh sách endpoint rỗng và kết nối thất bại. Kiểm tra nhanh bằng `kubectl get endpointslices` hoặc `kubectl describe svc web-svc`.",
  },
  {
    id: "q077",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Headless Service (`clusterIP: None`) khác Service thường ở điểm nào?",
    code: null,
    options: [
      "Không thể truy cập từ trong cluster",
      "Chỉ dùng được với Deployment, không dùng được với StatefulSet",
      "Tự động tạo LoadBalancer không có IP",
      "Không có IP ảo; DNS trả về trực tiếp IP của từng Pod backend, cho phép client tự chọn Pod",
    ],
    answer: 3,
    explanation: "Với `clusterIP: None`, truy vấn DNS tên Service trả về danh sách A/AAAA record của các Pod thay vì một virtual IP; StatefulSet dựa vào đây để mỗi Pod có DNS ổn định dạng `pod-0.svc-name...`.",
  },
  {
    id: "q078",
    cert: "CKAD",
    domain: "networking",
    difficulty: 1,
    question: "Tên DNS đầy đủ (FQDN) của Service `db` trong namespace `shop` (cluster domain mặc định) là gì?",
    code: null,
    options: [
      "`db.shop.svc.cluster.local`",
      "`shop.db.svc.cluster.local`",
      "`db.svc.shop.cluster.local`",
      "`cluster.local.svc.shop.db`",
    ],
    answer: 0,
    explanation: "Cấu trúc DNS của Service là `<service>.<namespace>.svc.<cluster-domain>` — tên Service đứng trước, rồi đến namespace. Trong cùng namespace chỉ cần gọi `db` là đủ.",
  },
  {
    id: "q079",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Pod ở namespace `frontend` cần gọi Service `api` ở namespace `backend`. Cách gọi ngắn gọn nhất mà vẫn đúng là gì?",
    code: null,
    options: [
      "Gọi `api` — DNS tự tìm ở mọi namespace",
      "Phải tạo thêm một Service trung gian trong namespace frontend",
      "Gọi `api.backend` (hoặc FQDN `api.backend.svc.cluster.local`)",
      "Không thể gọi Service khác namespace nếu không có Ingress",
    ],
    answer: 2,
    explanation: "Tên ngắn `api` chỉ resolve trong namespace của Pod gọi; thêm namespace thành `api.backend` là đủ để resolver (search domain của cluster DNS) tìm đúng — không cần tạo gì thêm.",
  },
  {
    id: "q080",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Lệnh imperative nào tạo Service ClusterIP nhận traffic cổng 80 và chuyển tới cổng 8080 của các Pod thuộc Deployment `web`?",
    code: null,
    options: [
      "`kubectl create service web --port=80:8080`",
      "`kubectl expose deployment web --port=80 --target-port=8080`",
      "`kubectl expose deployment web --nodeport=80 --pod-port=8080`",
      "`kubectl service add web 80 8080`",
    ],
    answer: 1,
    explanation: "`kubectl expose` tạo Service với selector lấy từ workload được expose; `--port` là cổng của Service, `--target-port` là cổng container. Thêm `--type=NodePort` nếu muốn mở ra ngoài.",
  },
  {
    id: "q081",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Với Ingress sau, request nào được route tới service `api-svc`?",
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ing
spec:
  ingressClassName: nginx
  rules:
  - host: shop.example.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 80`,
    },
    options: [
      "Cả `shop.example.com/api` lẫn `shop.example.com/api/v1/orders` — Prefix khớp theo từng phân đoạn đường dẫn",
      "Chỉ đúng `shop.example.com/api`, không khớp đường dẫn con",
      "Mọi đường dẫn bắt đầu bằng chữ a, ví dụ /app",
      "Mọi host miễn là path bắt đầu bằng /api",
    ],
    answer: 0,
    explanation: "`pathType: Prefix` so khớp theo phân đoạn phân tách bởi dấu `/`: /api và mọi path con như /api/v1 đều khớp (nhưng /apiv2 thì không). `Exact` mới đòi khớp tuyệt đối, và rule này chỉ áp cho host khai báo.",
  },
  {
    id: "q082",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Trường `spec.ingressClassName` trong Ingress dùng để làm gì?",
    code: null,
    options: [
      "Đặt mức độ ưu tiên giữa các Ingress trùng host",
      "Chọn loại chứng chỉ TLS được cấp",
      "Khai báo namespace mà Ingress có hiệu lực",
      "Chỉ định IngressClass, tức controller nào (nginx, traefik...) chịu trách nhiệm xử lý Ingress này",
    ],
    answer: 3,
    explanation: "Cluster có thể chạy nhiều ingress controller; mỗi controller theo dõi các Ingress trỏ đến IngressClass của nó qua `ingressClassName`. Không khớp class nào (và không có class mặc định) thì Ingress bị bỏ qua.",
  },
  {
    id: "q083",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Để bật TLS cho host trong Ingress, Secret được tham chiếu trong `spec.tls[].secretName` phải như thế nào?",
    code: null,
    options: [
      "Loại Opaque với key bất kỳ chứa chứng chỉ",
      "Loại kubernetes.io/tls với hai key `tls.crt` và `tls.key`, nằm cùng namespace với Ingress",
      "Loại kubernetes.io/dockerconfigjson chứa CA bundle",
      "Không cần Secret — chứng chỉ nhúng thẳng vào manifest Ingress",
    ],
    answer: 1,
    explanation: "Tạo bằng `kubectl create secret tls <tên> --cert=... --key=...` sẽ ra đúng định dạng: type `kubernetes.io/tls` với `tls.crt`/`tls.key`. Ingress controller chỉ đọc được Secret trong cùng namespace với Ingress.",
  },
  {
    id: "q084",
    cert: "CKAD",
    domain: "networking",
    difficulty: 1,
    question: "Bạn apply một Ingress hợp lệ nhưng truy cập không hoạt động, và `kubectl get ingress` không hiện ADDRESS. Nguyên nhân nền tảng thường là gì?",
    code: null,
    options: [
      "Ingress phải chờ 24h để DNS lan truyền",
      "Thiếu NetworkPolicy cho phép traffic vào Ingress",
      "Cluster chưa cài Ingress CONTROLLER — bản thân resource Ingress chỉ là khai báo, cần controller (nginx, traefik...) hiện thực hóa",
      "Ingress chỉ hoạt động trên cloud, không chạy được on-premise",
    ],
    answer: 2,
    explanation: "Kubernetes không kèm sẵn ingress controller; Ingress không có controller xử lý sẽ nằm im. Cài một controller (ví dụ ingress-nginx) và trỏ `ingressClassName` cho đúng là điều kiện tiên quyết.",
  },
  {
    id: "q085",
    cert: "CKAD",
    domain: "networking",
    difficulty: 3,
    question: "NetworkPolicy sau cho phép loại traffic nào?",
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: db-ingress
  namespace: data
spec:
  podSelector:
    matchLabels:
      app: db
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          team: backend
    ports:
    - protocol: TCP
      port: 5432`,
    },
    options: [
      "Mọi Pod trong namespace data được gọi tới app=db trên mọi cổng",
      "Pod app=db được phép gọi ra ngoài tới cổng 5432",
      "Pod BẤT KỲ nằm trong các namespace có label team=backend được kết nối tới Pod app=db (namespace data) trên cổng TCP 5432; mọi ingress khác tới app=db bị chặn",
      "Chỉ Pod có label team=backend trong chính namespace data được kết nối",
    ],
    answer: 2,
    explanation: "Policy áp lên Pod khớp `spec.podSelector` (app=db ở namespace data). Nguồn là `namespaceSelector` nên điều kiện đặt trên LABEL CỦA NAMESPACE, không phải label Pod; khi Pod đã bị một policy chọn, mọi ingress không được liệt kê đều bị từ chối.",
  },
  {
    id: "q086",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Policy sau có hiệu lực gì trong namespace `prod`?",
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: prod
spec:
  podSelector: {}
  policyTypes:
  - Ingress`,
    },
    options: [
      "Không có hiệu lực vì podSelector rỗng không chọn Pod nào",
      "Default deny ingress: áp lên TẤT CẢ Pod trong prod (selector rỗng chọn mọi Pod) và chặn toàn bộ traffic đến, trừ khi có policy khác cho phép",
      "Chặn cả ingress lẫn egress của mọi Pod trong prod",
      "Chặn traffic từ ngoài cluster nhưng cho phép Pod trong prod gọi lẫn nhau",
    ],
    answer: 1,
    explanation: "`podSelector: {}` nghĩa là CHỌN MỌI Pod (bẫy ngược trực giác). Policy khai báo `policyTypes: [Ingress]` mà không có rule ingress nào thì mặc định từ chối mọi ingress; egress không bị ảnh hưởng vì không nằm trong policyTypes.",
  },
  {
    id: "q087",
    cert: "CKAD",
    domain: "networking",
    difficulty: 3,
    question: "Sau khi apply policy egress sau, các Pod app=web không resolve được DNS nữa. Cần bổ sung gì?",
    code: {
      lang: "yaml",
      text: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: web-egress
spec:
  podSelector:
    matchLabels:
      app: web
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: api
    ports:
    - protocol: TCP
      port: 8080`,
    },
    options: [
      "Thêm policyTypes Ingress để DNS trả lời được",
      "Đổi port 8080 sang 53 vì một policy chỉ được một cổng",
      "Không cần thêm gì; DNS không bị NetworkPolicy kiểm soát",
      "Thêm một rule egress cho phép cổng 53 UDP (và TCP) tới kube-dns/CoreDNS — khi Pod bị policy egress chọn, cả truy vấn DNS cũng bị chặn nếu không được mở",
    ],
    answer: 3,
    explanation: "Đây là lỗi kinh điển: policy egress \"deny mọi thứ trừ được liệt kê\" chặn luôn UDP/TCP 53 tới CoreDNS, khiến mọi resolve tên miền thất bại. Luôn thêm rule mở port 53 (thường kèm namespaceSelector trỏ kube-system) trong policy egress.",
  },
  {
    id: "q088",
    cert: "CKAD",
    domain: "networking",
    difficulty: 3,
    question: "Trong mảng `from` của NetworkPolicy, khác biệt giữa việc đặt `namespaceSelector` và `podSelector` trong CÙNG một phần tử so với TÁCH thành hai phần tử là gì?",
    code: null,
    options: [
      "Cùng phần tử = điều kiện AND (Pod khớp podSelector VÀ nằm trong namespace khớp namespaceSelector); hai phần tử = OR (thỏa một trong hai là được)",
      "Không có khác biệt, YAML chỉ là hai cách viết",
      "Cùng phần tử = OR, hai phần tử = AND",
      "Hai selector không bao giờ được xuất hiện cùng nhau trong from",
    ],
    answer: 0,
    explanation: "Mỗi phần tử trong `from` là một nguồn được phép (các phần tử OR với nhau); các selector nằm TRONG cùng một phần tử phải thỏa đồng thời (AND). Chỉ khác một dấu gạch đầu dòng `-` mà ngữ nghĩa đổi hoàn toàn — điểm hay ra đề.",
  },
  {
    id: "q089",
    cert: "CKAD",
    domain: "networking",
    difficulty: 2,
    question: "Trong NetworkPolicy, khối `ipBlock` với `except` có ý nghĩa gì?",
    code: null,
    options: [
      "Chặn toàn bộ CIDR khai báo, chỉ cho phép các dải trong except",
      "Cho phép traffic từ/đến dải CIDR khai báo, NGOẠI TRỪ các dải con liệt kê trong except",
      "except là danh sách namespace được miễn policy",
      "ipBlock chỉ dùng được cho ingress, không dùng cho egress",
    ],
    answer: 1,
    explanation: "`ipBlock.cidr` mở một dải IP (thường cho traffic ngoài cluster), còn `except` khoét lỗ loại trừ các subnet con khỏi dải đó. Dùng được cho cả ingress lẫn egress.",
  },
  {
    id: "q090",
    cert: "CKAD",
    domain: "networking",
    difficulty: 1,
    question: "Bạn tạo NetworkPolicy thành công nhưng traffic vẫn không bị chặn gì cả. Nguyên nhân hạ tầng nào cần nghĩ đến đầu tiên?",
    code: null,
    options: [
      "CNI plugin của cluster không hỗ trợ NetworkPolicy (ví dụ flannel thuần) — policy được lưu nhưng không được enforce",
      "NetworkPolicy cần restart toàn bộ Pod mới có hiệu lực",
      "Phải bật feature gate NetworkPolicy trên kube-apiserver",
      "NetworkPolicy chỉ hoạt động ở namespace kube-system",
    ],
    answer: 0,
    explanation: "NetworkPolicy do CNI plugin enforce, không phải kube-apiserver: với CNI không hỗ trợ (flannel thuần), object vẫn tạo được nhưng vô tác dụng. Calico, Cilium, hoặc Antrea là các CNI enforce policy phổ biến.",
  },

  // ===== CKA — Cluster Administration (cka-core) =====
  {
    id: "q091",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 3,
    question: "Bạn đã tạo snapshot etcd như dưới đây. Quy trình đúng để RESTORE cluster (etcd dạng static pod) là gì?",
    code: {
      lang: "bash",
      text: `ETCDCTL_API=3 etcdctl snapshot save /backup/etcd.db \\
  --endpoints=https://127.0.0.1:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key`,
    },
    options: [
      "Chạy `etcdctl snapshot save` lần nữa với cờ --restore",
      "Copy đè file etcd.db vào /var/lib/etcd rồi restart kubelet",
      "Dùng `etcdutl/etcdctl snapshot restore /backup/etcd.db --data-dir=<thư-mục-mới>` rồi sửa manifest static pod của etcd (hostPath volume) trỏ sang data-dir mới",
      "Chạy `kubeadm init --restore /backup/etcd.db` trên control plane",
    ],
    answer: 2,
    explanation: "Restore luôn ghi ra một data directory MỚI bằng `snapshot restore --data-dir=...`; sau đó cập nhật `/etc/kubernetes/manifests/etcd.yaml` (volume hostPath `/var/lib/etcd`) trỏ tới thư mục này để kubelet tạo lại etcd với dữ liệu khôi phục.",
  },
  {
    id: "q092",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 2,
    question: "Token join của cluster kubeadm đã hết hạn. Cách nhanh nhất để lấy lệnh join hoàn chỉnh cho worker node mới là gì?",
    code: null,
    options: [
      "Chạy lại `kubeadm init --refresh-token` trên control plane",
      "Chạy `kubeadm token create --print-join-command` trên control plane, rồi thực thi output đó trên node mới",
      "Copy file /etc/kubernetes/admin.conf sang node mới là đủ để join",
      "Node tự join khi cài kubelet cùng phiên bản",
    ],
    answer: 1,
    explanation: "`kubeadm token create --print-join-command` sinh token mới (mặc định TTL 24h) và in nguyên câu lệnh `kubeadm join` kèm discovery hash của CA — chỉ việc chạy trên worker. `kubeadm init` chỉ dùng khi dựng control plane.",
  },
  {
    id: "q093",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 2,
    question: "Khác biệt giữa `kubectl cordon` và `kubectl drain` đối với một node là gì?",
    code: null,
    options: [
      "cordon xóa node khỏi cluster, drain chỉ tạm ngưng nó",
      "drain chỉ chặn Pod mới, cordon di dời Pod cũ",
      "Hai lệnh giống nhau, drain là alias mới",
      "cordon chỉ đánh dấu node unschedulable (Pod đang chạy giữ nguyên); drain vừa cordon vừa evict các Pod đang chạy (thường cần --ignore-daemonsets)",
    ],
    answer: 3,
    explanation: "Quy trình bảo trì node chuẩn: `kubectl drain <node> --ignore-daemonsets` (kèm `--delete-emptydir-data` nếu cần) để dọn Pod, bảo trì xong thì `kubectl uncordon` mở lại. `cordon` đơn thuần đặt `spec.unschedulable=true`.",
  },
  {
    id: "q094",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 2,
    question: "Static Pod khác Pod thông thường như thế nào?",
    code: null,
    options: [
      "Static Pod không bao giờ hiển thị qua kubectl",
      "Static Pod do scheduler đặt cố định vào một node",
      "Do kubelet quản lý trực tiếp từ file manifest trong staticPodPath (thường /etc/kubernetes/manifests); xóa mirror Pod qua API sẽ bị tạo lại — muốn xóa hẳn phải gỡ file manifest",
      "Static Pod chỉ chạy được image trong local cache của node",
    ],
    answer: 2,
    explanation: "kubelet theo dõi thư mục `staticPodPath` và tự chạy mọi manifest trong đó (cách các thành phần control plane của kubeadm hoạt động); API server chỉ thấy mirror Pod (tên có hậu tố tên node) ở chế độ read-only.",
  },
  {
    id: "q095",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 2,
    question: "Node `gpu-1` bị taint `gpu=true:NoSchedule`. Pod dưới đây có được schedule lên node đó không?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Pod
metadata:
  name: trainer
spec:
  tolerations:
  - key: "gpu"
    operator: "Equal"
    value: "true"
    effect: "NoSchedule"
  containers:
  - name: train
    image: trainer:1.0`,
    },
    options: [
      "Có thể — toleration khớp taint nên node đủ điều kiện, nhưng KHÔNG bảo đảm Pod sẽ vào đúng node đó (toleration không phải cơ chế hút)",
      "Chắc chắn có — toleration buộc scheduler đặt Pod lên node có taint tương ứng",
      "Không — cần thêm operator Exists mới khớp taint",
      "Không — NoSchedule chặn tuyệt đối mọi Pod",
    ],
    answer: 0,
    explanation: "Toleration chỉ GỠ rào cản taint, không kéo Pod về node; scheduler vẫn có thể chọn node khác không taint. Muốn Pod nhắm đúng node GPU phải kết hợp nodeSelector/nodeAffinity với toleration.",
  },
  {
    id: "q096",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 3,
    question: "Trình tự đúng khi nâng cấp một cluster kubeadm (ví dụ 1.29 lên 1.30) là gì?",
    code: null,
    options: [
      "Nâng kubelet mọi node trước rồi mới nâng control plane",
      "Nâng gói kubeadm trên control plane, chạy `kubeadm upgrade plan` rồi `kubeadm upgrade apply v1.30.x`, nâng kubelet control plane; sau đó lần lượt từng worker: drain, nâng kubeadm+`kubeadm upgrade node`+kubelet, uncordon",
      "Chỉ cần đổi image tag của các static pod trong /etc/kubernetes/manifests",
      "Chạy `kubeadm init --upgrade` trên mọi node cùng lúc",
    ],
    answer: 1,
    explanation: "Nguyên tắc: control plane trước, worker sau, mỗi lần một minor version, và drain node trước khi nâng kubelet. `kubeadm upgrade plan` liệt kê phiên bản đích khả dụng, `upgrade apply` cho control plane đầu tiên, `upgrade node` cho các node còn lại.",
  },
  {
    id: "q097",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 1,
    question: "kubeconfig của bạn có nhiều context. Lệnh nào chuyển hẳn sang làm việc với context `prod-cluster`?",
    code: null,
    options: [
      "`kubectl config use-context prod-cluster`",
      "`kubectl config set-context prod-cluster`",
      "`kubectl switch prod-cluster`",
      "`kubectl config view prod-cluster`",
    ],
    answer: 0,
    explanation: "`use-context` đổi `current-context` trong kubeconfig; còn `set-context` là để tạo/sửa định nghĩa context (bộ ba cluster + user + namespace). Xem danh sách bằng `kubectl config get-contexts`.",
  },
  {
    id: "q098",
    cert: "CKA",
    domain: "cka-core",
    difficulty: 2,
    question: "Một Pod được tạo với `spec.nodeName: worker-2` ngay trong manifest. Điều gì đúng?",
    code: null,
    options: [
      "Scheduler sẽ ưu tiên node worker-2 nhưng vẫn có thể chọn node khác",
      "Pod BỎ QUA hoàn toàn kube-scheduler và được kubelet trên worker-2 nhận chạy trực tiếp",
      "Pod chỉ chạy trên worker-2 nếu node này có label nodeName tương ứng",
      "Manifest không hợp lệ vì nodeName do hệ thống quản lý",
    ],
    answer: 1,
    explanation: "`nodeName` được điền sẵn đồng nghĩa Pod đã được \"gán node\" — scheduler không tham gia, các cơ chế như taint NoSchedule hay affinity không được xét (kubelet vẫn có thể từ chối nếu thiếu tài nguyên). Khác với `nodeSelector`, vốn vẫn đi qua scheduler.",
  },

  // ===== CKS — Security (cks-core) =====
  {
    id: "q099",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 2,
    question: "Sau khi gắn label như dưới đây cho namespace, điều gì xảy ra khi tạo một Pod chạy container privileged trong đó?",
    code: {
      lang: "yaml",
      text: `apiVersion: v1
kind: Namespace
metadata:
  name: payments
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/warn: restricted`,
    },
    options: [
      "Pod được tạo kèm cảnh báo trong event",
      "Pod được tạo nhưng container privileged bị tự động hạ quyền",
      "Chỉ Deployment bị kiểm tra, Pod tạo trực tiếp thì không",
      "Pod bị Pod Security Admission TỪ CHỐI ngay khi tạo vì vi phạm chuẩn restricted",
    ],
    answer: 3,
    explanation: "Pod Security Admission (thay thế PodSecurityPolicy từ 1.25) đọc label `pod-security.kubernetes.io/<mode>` trên namespace; mode `enforce: restricted` chặn hẳn Pod vi phạm (privileged, chạy root, thiếu seccomp...), còn `warn`/`audit` chỉ cảnh báo/ghi log.",
  },
  {
    id: "q100",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 1,
    question: "Công cụ trivy thường được dùng để làm gì trong quy trình bảo mật Kubernetes?",
    code: null,
    options: [
      "Giám sát syscall của container lúc runtime",
      "Mã hóa Secret trong etcd",
      "Scan image (và filesystem, repo IaC) để phát hiện CVE trong OS package và dependency của ứng dụng, ví dụ `trivy image nginx:1.27`",
      "Ký số image trước khi push lên registry",
    ],
    answer: 2,
    explanation: "Trivy là scanner tĩnh: đối chiếu package trong image với cơ sở dữ liệu lỗ hổng và báo CVE theo mức độ (`--severity HIGH,CRITICAL`). Giám sát runtime là việc của Falco; ký image là cosign.",
  },
  {
    id: "q101",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 2,
    question: "Cách khai báo đúng để container dùng seccomp profile mặc định của container runtime là gì?",
    code: null,
    options: [
      "Thêm annotation `seccomp.security.alpha.kubernetes.io/pod: default`",
      "Đặt `securityContext.privileged: false` là đủ để bật seccomp",
      "Đặt `securityContext.seccompProfile.type: RuntimeDefault` (ở cấp Pod hoặc container)",
      "Cài AppArmor trên node, seccomp sẽ tự bật theo",
    ],
    answer: 2,
    explanation: "Trường chính thức là `seccompProfile.type: RuntimeDefault` (annotation alpha cũ đã bị gỡ từ 1.25) — seccomp lọc SYSCALL mà process được phép gọi. AppArmor là cơ chế MAC riêng, cấu hình qua `securityContext.appArmorProfile` từ 1.30.",
  },
  {
    id: "q102",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 3,
    question: "Với EncryptionConfiguration sau được nạp qua `--encryption-provider-config` của kube-apiserver, phát biểu nào đúng?",
    code: {
      lang: "yaml",
      text: `apiVersion: apiserver.config.k8s.io/v1
kind: EncryptionConfiguration
resources:
- resources:
  - secrets
  providers:
  - aescbc:
      keys:
      - name: key1
        secret: BASE64_ENCODED_32_BYTE_KEY
  - identity: {}`,
    },
    options: [
      "Mọi Secret cũ trong etcd lập tức được mã hóa lại",
      "identity đứng cuối nghĩa là dữ liệu vẫn được ghi dạng plain text",
      "Cấu hình sai vì không được để identity cùng aescbc",
      "Secret GHI MỚI sẽ được mã hóa bằng aescbc; identity ở cuối cho phép ĐỌC các Secret cũ chưa mã hóa; muốn mã hóa lại toàn bộ phải chạy `kubectl get secrets -A -o json | kubectl replace -f -`",
    ],
    answer: 3,
    explanation: "Provider ĐẦU danh sách dùng để ghi, các provider sau chỉ để đọc dữ liệu tồn tại từ trước — nên `identity` cuối danh sách là bước chuyển tiếp hợp lệ. Encryption at rest không tự mã hóa lại dữ liệu cũ; phải rewrite toàn bộ Secret.",
  },
  {
    id: "q103",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 2,
    question: "Theo hướng zero-trust, cách hardening network chuẩn cho một namespace production là gì?",
    code: null,
    options: [
      "Chỉ chặn traffic từ Internet, còn traffic nội bộ cluster luôn tin cậy",
      "Áp NetworkPolicy default-deny cho CẢ Ingress lẫn Egress trên mọi Pod, rồi mở dần từng luồng cần thiết (kể cả DNS port 53)",
      "Dùng Service loại ClusterIP là đủ cách ly",
      "Tắt kube-proxy trên các node production",
    ],
    answer: 1,
    explanation: "Mặc định Kubernetes cho phép mọi Pod nói chuyện với nhau; hardening bắt đầu bằng policy `podSelector: {}` với `policyTypes: [Ingress, Egress]` không kèm rule (deny all), sau đó whitelist từng luồng hợp lệ. ClusterIP không phải cơ chế cách ly.",
  },
  {
    id: "q104",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 1,
    question: "Falco đóng vai trò gì trong hệ sinh thái bảo mật Kubernetes?",
    code: null,
    options: [
      "Runtime security: theo dõi syscall/sự kiện của container lúc đang chạy và cảnh báo hành vi bất thường (ví dụ shell được spawn trong container, đọc /etc/shadow)",
      "Scan manifest YAML tìm cấu hình sai trước khi apply",
      "Quản lý và xoay vòng chứng chỉ TLS cho cluster",
      "Thay thế kube-proxy bằng eBPF",
    ],
    answer: 0,
    explanation: "Falco (dự án CNCF graduated) bắt sự kiện syscall qua kernel module/eBPF và so với bộ rule để phát hiện xâm nhập lúc RUNTIME — bổ sung cho scan tĩnh (trivy) vốn chỉ nhìn thấy lỗ hổng trước khi chạy.",
  },
  {
    id: "q105",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 2,
    question: "Thực hành nào KHÔNG phù hợp với nguyên tắc least privilege trong RBAC?",
    code: null,
    options: [
      "Cấp Role chỉ chứa đúng verb và resource mà workload cần",
      "Gán ClusterRole cluster-admin cho ServiceAccount của ứng dụng để đỡ phải debug thiếu quyền",
      "Dùng `kubectl auth can-i --list --as=<sa>` để rà soát quyền thực tế",
      "Tạo ServiceAccount riêng cho từng ứng dụng thay vì dùng chung default",
    ],
    answer: 1,
    explanation: "`cluster-admin` cho một app đồng nghĩa mọi RCE trong app trở thành chiếm toàn cluster. Least privilege: SA riêng từng app, Role hẹp theo namespace, tránh wildcard `*` trong verbs/resources, và audit định kỳ bằng `auth can-i --list`.",
  },
  {
    id: "q106",
    cert: "CKS",
    domain: "cks-core",
    difficulty: 3,
    question: "Trong audit policy của kube-apiserver, level `RequestResponse` khác `Metadata` như thế nào?",
    code: null,
    options: [
      "RequestResponse chỉ ghi response, Metadata chỉ ghi request",
      "Metadata ghi nhiều dữ liệu hơn RequestResponse",
      "Metadata chỉ ghi thông tin ai-gọi-gì-khi-nào; RequestResponse ghi thêm cả BODY của request lẫn response — chi tiết nhất nhưng nặng và có thể lộ dữ liệu nhạy cảm trong log",
      "Hai level giống nhau với resource thường, chỉ khác với Secret",
    ],
    answer: 2,
    explanation: "Bốn level tăng dần: `None` < `Metadata` < `Request` (thêm body request) < `RequestResponse` (thêm cả body response). Audit bật qua `--audit-policy-file` và `--audit-log-path` trên kube-apiserver; với Secret nên dùng Metadata để tránh ghi giá trị secret vào log.",
  },

  // ===== KCNA — Cloud Native Fundamentals (kcna-core) =====
  {
    id: "q107",
    cert: "KCNA",
    domain: "kcna-core",
    difficulty: 1,
    question: "CNCF (Cloud Native Computing Foundation) là gì và Kubernetes có quan hệ thế nào với tổ chức này?",
    code: null,
    options: [
      "Là tổ chức trung lập (thuộc Linux Foundation) host các dự án cloud native mã nguồn mở; Kubernetes là dự án đầu tiên và đã ở mức graduated",
      "Là công ty thương mại bán bản Kubernetes enterprise",
      "Là nhóm làm việc của Google quản lý mã nguồn Kubernetes",
      "Là chuẩn bắt buộc mọi cloud provider phải đạt để chạy container",
    ],
    answer: 0,
    explanation: "CNCF nuôi dưỡng dự án theo ba mức trưởng thành sandbox → incubating → graduated; Kubernetes được Google trao cho CNCF năm 2015 và là dự án graduated đầu tiên. CNCF Landscape liệt kê toàn cảnh hệ sinh thái cloud native.",
  },
  {
    id: "q108",
    cert: "KCNA",
    domain: "kcna-core",
    difficulty: 1,
    question: "Container orchestration (điều phối container) giải quyết những bài toán nào mà chạy container thủ công không xử lý được?",
    code: null,
    options: [
      "Chỉ giúp build image nhanh hơn",
      "Chỉ cung cấp giao diện web để xem log",
      "Thay thế hoàn toàn nhu cầu viết Dockerfile",
      "Tự động scheduling container lên máy phù hợp, scaling theo tải, self-healing khi lỗi, service discovery và rolling update",
    ],
    answer: 3,
    explanation: "Orchestrator như Kubernetes quản lý vòng đời container ở quy mô lớn: đặt workload lên node (scheduling), giữ đúng số bản sao mong muốn (reconciliation/self-healing), scale, cân bằng tải và cập nhật không downtime.",
  },
  {
    id: "q109",
    cert: "KCNA",
    domain: "kcna-core",
    difficulty: 2,
    question: "Thành phần nào sau đây KHÔNG thuộc control plane của Kubernetes?",
    code: null,
    options: [
      "kube-apiserver",
      "etcd",
      "kube-scheduler",
      "kubelet",
    ],
    answer: 3,
    explanation: "Control plane gồm kube-apiserver (cổng giao tiếp duy nhất), etcd (kho dữ liệu key-value), kube-scheduler (chọn node cho Pod) và kube-controller-manager (các vòng lặp reconcile). kubelet là agent chạy TRÊN MỖI NODE để quản lý container, cùng với kube-proxy.",
  },
  {
    id: "q110",
    cert: "KCNA",
    domain: "kcna-core",
    difficulty: 1,
    question: "Nguyên tắc cốt lõi của GitOps là gì?",
    code: null,
    options: [
      "Git repository là nguồn chân lý duy nhất mô tả trạng thái mong muốn của hệ thống; một agent (ArgoCD, Flux) liên tục đồng bộ cluster về đúng trạng thái khai báo trong Git",
      "Mọi developer phải deploy thủ công bằng kubectl apply sau khi merge",
      "Lưu image container trực tiếp trong Git thay vì registry",
      "CI/CD pipeline push thẳng vào cluster mà không cần khai báo trạng thái",
    ],
    answer: 0,
    explanation: "GitOps = declarative + version controlled + tự động reconcile: thay đổi hạ tầng đi qua pull request, agent trong cluster phát hiện lệch (drift) giữa thực tế và Git rồi tự đưa về trạng thái mong muốn. ArgoCD và Flux là hai dự án GitOps graduated của CNCF.",
  },
];
