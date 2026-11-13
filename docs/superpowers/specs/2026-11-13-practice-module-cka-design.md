# Module Thực hành và chương trình thực hành CKA — bản thiết kế

Ngày: 2026-11-13. Trạng thái: chờ duyệt.

Quy ước trong tài liệu: **[Đã chốt]** là điều người dùng nói hoặc xác nhận; **[Đề xuất]** là lựa chọn của người viết thiết kế, người dùng đã xem nhưng chưa phản đối; **[Tự quyết]** là lựa chọn của người viết mà người dùng chưa xem riêng; **[Builder]** là phần để người triển khai quyết.

## 1. Ý định

DevPrep hiện mạnh về đọc và ôn (345 tài liệu, 30 track lộ trình, flashcard, trắc nghiệm) nhưng phần thực hành chỉ có 22 lab CKAD rời rạc: không lưu tiến độ, không có trạng thái cluster đầu vào, bài này không nối sang bài kia, view gắn cứng vào Kubernetes.

Người dùng là Java/Spring software engineer, **mục tiêu chính hiện tại là thi đỗ CKA trong 3–6 tháng tới** [Đã chốt]; các nội dung khác của DevPrep (trục Senior Java, FlashSale, sách) chỉ còn là tham khảo trong giai đoạn này [Đã chốt].

Cần xây một **chức năng thực hành hạng nhất**, chương trình đầu tiên là CKA, và phải thiết kế để các chứng chỉ và chủ đề khác (CKAD, CKS, Kafka…) thêm vào sau chỉ bằng dữ liệu [Đã chốt].

### Một buổi học điển hình [Đã chốt]

1. Mở máy, mở DevPrep, xem checklist để biết đang ở buổi nào.
2. Khởi động cluster.
3. Ôn lại buổi trước.
4. Làm buổi hôm nay (ít nhất 1 tiếng).

## 2. Mục tiêu, ngoài phạm vi, điều phải tránh

### Mục tiêu

- G1. Module **Thực hành** độc lập với lĩnh vực: thêm chương trình mới không phải sửa view.
- G2. Chương trình **CKA** khoảng 51 buổi, mỗi buổi 60–90 phút, xếp theo thứ tự khoa học, phủ toàn bộ curriculum CKA hiện hành.
- G3. Mỗi buổi có đủ: mục tiêu, kỹ năng đạt được, tư duy, tham chiếu, trạng thái đầu vào, nhiệm vụ, gợi ý, cách xử lý, phần tương ứng trong đề thi, tips, kết quả mong muốn [Đã chốt danh sách thành phần].
- G4. Các buổi nối nhau thành **một project hoàn chỉnh**: hệ thống Spring Boot nhỏ chạy trên cluster kubeadm tự dựng [Đã chốt].
- G5. Chạy hoàn toàn trên MacBook Air M1 16GB bằng Multipass [Đã chốt].
- G6. Kỹ năng nền (vim, Linux, network) có lý thuyết và thực hành cụ thể, không coi là biết sẵn [Đã chốt].
- G7. Năng lực được đo ở các buổi **mock** bấm giờ, có điểm theo domain [Đã chốt].

### Ngoài phạm vi

- Không sửa module Labs hiện có (22 lab CKAD giữ nguyên).
- Không sửa lịch 104 tuần (`schedule.js`) và trang Kế hoạch tuần.
- Không theo dõi trạng thái thành thạo từng kỹ năng, không tự chấm nhớ/quên [Đã chốt: "phần trạng thái là không cần thiết"].
- Không tự động đồng bộ kết quả từ terminal vào web app (app tĩnh, không backend).
- Người dùng không viết code Java trong buổi học [Đề xuất].
- Nội dung ngoài curriculum CKA (Prometheus/Grafana, ArgoCD, service mesh, CI/CD) không nằm trong 51 buổi. Có thể thành chương trình "sau CKA" về sau.

### Điều phải tránh

- A1. Buổi học chỉ là danh sách lệnh chép lại: mỗi buổi phải có lý do xuất hiện trong project và có kết quả kiểm chứng được.
- A2. Phụ thuộc ngầm giữa các buổi: nếu cluster hỏng hoặc bỏ lâu, người dùng phải quay lại đúng điểm bắt đầu của một buổi bất kỳ bằng một lệnh.
- A3. Script lab đụng vào thứ không thuộc về nó. Máy người dùng **đang có sẵn 3 VM Multipass `cp1`, `w1`, `w2`** (trạng thái Stopped). Bộ lệnh lab chỉ được tạo, sửa, xoá VM mang tiền tố của chương trình (`cka-…`) và tuyệt đối không đụng VM khác.
- A4. Viết lại lý thuyết đã có: buổi thực hành trỏ về tài liệu, lộ trình, lệnh, YAML mẫu, quy trình sẵn có.
- A5. Thiết kế gắn cứng "kubernetes" hay "cka" trong view hoặc trong bộ lệnh lab.

## 3. Hiện trạng dự án liên quan

- Web app `webapp/`: vanilla JS, không build, không dependency; router theo hash trong `js/app.js`; dữ liệu trong `js/data/<lĩnh vực>/`; tiến độ trong `localStorage` qua `js/lib/store.js` (namespace `kubeprep.`, không đổi); `scripts/check-data.mjs` ép các bất biến dữ liệu và chạy trong CI trước deploy.
- Module toàn cục đã có tiền lệ: `planner` (`GLOBAL_MODULES` trong `js/data/fields.js`, mục nav `global: true`).
- Tài nguyên CKA sẵn có để tham chiếu:
  - Lộ trình `cka` 10 tuần / 55 bài (`js/data/kubernetes/roadmap-cka-part{1,2,3}.js`, id `cka-wN-M`).
  - Sách *CKA Study Guide* 22 chương (`sources/kubernetes/cka-study-guide/`, id tài liệu `ckabook-NN`), *Kubernetes in Action*, *Kubernetes: Up and Running*.
  - `sources/kubernetes/certs/CKA-Study-Guide.md`, `CKA-Cheat-Sheet.md`, `CKAD-Prerequisites.md` (đã có phần Linux, vim, YAML, networking cơ bản).
  - Thực hành nhanh: `commands.js` + `commands-admin.js` (130 lệnh), `snippets.js` (48 YAML), `playbooks.js` (16 quy trình).
  - Bài Java liên quan vận hành: `sources/java/07-threadpool-sizing.md` (container-aware JVM), bài 01, 02 (TCP, timeout).
- FlashSale không dùng làm project CKA: chạy kind, giai đoạn 4 cần 32GB, kind không luyện được kubeadm/etcd/kubelet.
- Repo tham khảo ngoài `NotHarshhaa/DevOps-Projects`: 41 project, chủ yếu EKS/AKS/Terraform/Jenkins, không có kubeadm. Chỉ mượn **ý tưởng hình dạng project** (ứng dụng 3 tầng + Helm ở project 15, nhiều môi trường ở 28, Java + GitOps ở 18, giám sát ở 24); không sao chép nội dung. Mới xem danh sách project, chưa đọc từng thư mục.
- Máy người dùng: Multipass 1.16.3, Docker đã cài, macOS trên Apple Silicon.

## 4. Khái niệm

| Khái niệm | Ý nghĩa |
|---|---|
| **Chương trình thực hành** (program) | Một khoá thực hành trọn vẹn: môi trường lab + project xuyên suốt + các chặng + các buổi + các đề mock. Thuộc về một lĩnh vực (`field`). CKA là chương trình đầu tiên, id `cka`. |
| **Chặng** (stage) | Nhóm buổi cùng chủ đề; kết thúc chặng thì project đạt một mốc mô tả được. |
| **Buổi** (session) | Đơn vị học 60–90 phút. Có trạng thái cluster đầu vào và đầu ra xác định. |
| **Kỹ năng** (skill) | Một thứ cụ thể làm được sau buổi: lệnh, YAML, quy trình, khái niệm, trang docs, file/đường dẫn. Chỉ là thông tin, không có trạng thái. |
| **Checkpoint** | Trạng thái chuẩn của cluster ở cuối một buổi, dựng lại được bằng lệnh. |
| **Mock** | Đề thi thử bấm giờ làm trên chính cluster lab, có script dựng đề và chấm điểm theo domain. |

## 5. Web app: module Thực hành

### 5.1 Vị trí [Tự quyết]

- `practice` là **module toàn cục** như `planner`: thêm vào `GLOBAL_MODULES`, mục nav `global: true` nhãn "Thực hành" (biểu tượng 🛠️), đặt trong nhóm nav "Kế hoạch" ngay dưới Kế hoạch tuần.
- Khi mở một chương trình, lĩnh vực hiện hành tự chuyển sang `field` của chương trình (giống hành vi tìm kiếm toàn cục khi mở kết quả).
- Bảng điều khiển của lĩnh vực có chương trình thực hành hiện thẻ **Buổi thực hành kế tiếp**.

### 5.2 Route

| Route | Màn hình |
|---|---|
| `#/practice` | Danh sách chương trình. Khi chỉ có một chương trình thì vào thẳng trang chủ của nó. |
| `#/practice/<program>` | Trang chủ chương trình |
| `#/practice/<program>/<sessionId>` | Trang một buổi |
| `#/practice/<program>/skills` | Bản đồ kỹ năng |
| `#/practice/<program>/project` | Project: kiến trúc, trạng thái theo chặng |
| `#/practice/<program>/mock` và `…/mock/<mockId>` | Danh sách đề mock, trang một đề |

### 5.3 Trang chủ chương trình [Đề xuất, người dùng đã xem mockup]

Mockup: `.superpowers/brainstorm/46458-1794557064/content/practice-home-and-session.html`. Từ trên xuống:

1. Tiêu đề, thanh tiến độ "Buổi N / tổng", chặng hiện tại, ước lượng số tuần còn lại theo nhịp 3 buổi/tuần.
2. Khối **Buổi hôm nay** (buổi chưa hoàn thành đầu tiên), gồm ba bước theo đúng thói quen người dùng:
   - Khởi động cluster: các lệnh `./lab up`, `./lab check` cho buổi này, kèm lệnh `./lab restore` nếu check lệch. Lệnh có nút sao chép.
   - Ôn nhanh buổi trước: 3–5 câu nhắc lại (lật để xem đáp án, **không chấm**) và ghi chú người dùng đã viết ở buổi trước.
   - Nút vào buổi.
3. **Project đang lớn dần**: các mảnh của hệ thống, mảnh đã có (suy từ buổi đã hoàn thành) hiện rõ, mảnh chưa có hiện mờ.
4. **Lộ trình các chặng**: mỗi chặng một hàng với số buổi xong/tổng, mở ra thấy danh sách buổi.
5. **Độ phủ đề thi**: mỗi domain một thanh, tính bằng số buổi đã hoàn thành thuộc domain đó trên tổng số buổi của domain.
6. Điểm mock gần nhất theo domain (khi đã có).

Không khoá buổi: người dùng mở được bất kỳ buổi nào; buổi chưa đủ điều kiện chỉ hiện nhắc "cần xong buổi X" [Tự quyết].

### 5.4 Trang một buổi [Đề xuất, người dùng đã xem mockup]

Thứ tự các khối:

1. Tiêu đề, badge domain đề thi và tỷ trọng, thời lượng, buổi tiên quyết.
2. 🎯 **Mục tiêu**: 2–4 câu kết quả, viết ở dạng làm được gì.
3. 🧰 **Sau buổi này anh làm được**: bảng kỹ năng nhóm theo loại, mỗi dòng có mức cần đạt (ví dụ "gõ được không tra", "dưới 3 phút", "giải thích được"). Dòng nào có mục tương ứng trong Thực hành nhanh thì là link tới đó. Mockup: `…/content/skills-layer.html` khối A (bỏ mọi thứ liên quan trạng thái).
4. 🧱 **Nền tảng cần cho buổi này** (chỉ có ở buổi cần): lý thuyết ngắn và bài tập cụ thể về vim, Linux hoặc network mà buổi này dùng tới lần đầu. Xem mục 7.3.
5. 🧠 **Tư duy**: mô hình tư duy của buổi, nối từ thứ người dùng đã biết ở Java/Spring sang Kubernetes; cách suy nghĩ khi gặp dạng bài này.
6. 📖 **Tham chiếu**: tài liệu trong app (chương sách, bài lộ trình CKA, bài Java), trang kubernetes.io cần bookmark, nguồn ngoài.
7. 📥 **Trạng thái đầu vào**: mô tả bằng lời và lệnh `./lab check`.
8. 📋 **Nhiệm vụ**: danh sách bước có checkbox, lưu tiến độ từng bước.
9. 💡 **Gợi ý** từng bước (ẩn) và 🔓 **Cách xử lý** đầy đủ (ẩn), có giải thích vì sao, không chỉ lệnh.
10. 🎓 **Trong đề thi**: domain, các dạng câu thường gặp, thời gian mục tiêu trong phòng thi, 1–2 câu luyện kiểu đề thi có đồng hồ bấm giờ (tái dùng đồng hồ của view Labs).
11. ⚡ **Tips**: mẹo tốc độ, bẫy thường gặp.
12. ✅ **Kết quả mong muốn**: mô tả trạng thái đầu ra, lệnh `./lab verify` và output kỳ vọng, phần project thay đổi thế nào sau buổi này.
13. Nút **Đánh dấu hoàn thành** (người dùng tự bấm sau khi verify đạt) và ô **Ghi chú của tôi** (lưu lại, hiện ở bước ôn của buổi kế tiếp).
14. Điều hướng buổi trước / buổi sau.

### 5.5 Bản đồ kỹ năng [Đề xuất, đã bỏ trạng thái theo yêu cầu]

Một trang mục lục, **sinh tự động** từ dữ liệu các buổi:

- Lọc theo loại (lệnh, YAML, quy trình, khái niệm, trang docs, file/đường dẫn) và theo mảng (Kubernetes, vim, Linux, network).
- Mỗi kỹ năng: học ở buổi nào (link), dùng lại ở các buổi nào (link), link tới Thực hành nhanh nếu có.
- Không có cột trạng thái, không có đếm "đã thành thạo".

### 5.6 Trang mock

- Trước khi làm: thời lượng, số câu, tỷ trọng domain, lệnh `./lab mock … start`.
- Trong khi làm: đồng hồ đếm ngược, danh sách câu hỏi (đề bài, node/namespace làm việc, trọng số), đánh dấu câu để quay lại.
- Sau khi làm: lệnh `./lab mock … score` in bảng điểm theo domain và **một dòng kết quả** để dán vào app; app lưu vào lịch sử và hiện lời giải từng câu [Tự quyết: dán một dòng thay vì nhập tay từng số].
- Lịch sử: bảng các lần làm, điểm tổng và theo domain, ngưỡng đỗ 66%.

### 5.7 Lưu tiến độ

Thêm các khoá `localStorage` (qua `store.js`, tự vào xuất/nhập tiến độ sẵn có):

| Khoá | Giá trị |
|---|---|
| `practice.done` | `{ "<program>:<sessionId>": epoch ms }` |
| `practice.tasks` | `{ "<program>:<sessionId>:<taskId>": true }` |
| `practice.notes` | `{ "<program>:<sessionId>": "văn bản" }` |
| `practice.mock` | `[ { program, mock, date, total, byDomain: { <domainId>: { got, max } } } ]` |

Id buổi, id nhiệm vụ, id đề mock là khoá lưu tiến độ: đã phát hành thì không đổi.

Tìm kiếm toàn cục (`lib/search.js`) lập chỉ mục thêm buổi thực hành và kỹ năng.

## 6. Mô hình dữ liệu

Đặt tại `webapp/js/data/practice/` [Tự quyết: thư mục riêng thay vì nằm trong `data/kubernetes/`, vì module là toàn cục và chương trình tương lai có thể thuộc lĩnh vực khác].

```
webapp/js/data/practice/
├── index.js              # PROGRAMS: danh sách chương trình (import từng chương trình)
└── cka/
    ├── program.js        # meta, exam, env, project, stages, coverage
    ├── skills.js         # danh mục kỹ năng
    ├── stage-00.js … stage-10.js   # các buổi của từng chặng
    └── mocks.js          # các đề mock
```

Hình dạng (tên trường là gợi ý, [Builder] được tinh chỉnh miễn giữ đủ thông tin):

```js
// program.js
{
  id: "cka", field: "kubernetes", label: "CKA", icon: "🛠️",
  name: "Thực hành CKA: dựng và vận hành một hệ thống Spring Boot trên cluster kubeadm",
  exam: {
    k8sVersion: "…",                 // phiên bản đề thi hiện hành
    passPct: 66, durationMin: 120,
    domains: [ { id: "troubleshooting", label: "Troubleshooting", weight: 30 }, … ],
    // Danh sách năng lực của curriculum chính thức, mỗi mục gắn domain
    competencies: [ { id: "ts-cluster-nodes", domain: "troubleshooting", text: "Troubleshoot clusters and nodes" }, … ],
  },
  env: { tool: "multipass", vms: [ … ], commands: { up: "./lab up cka", … } },
  project: { summary, architectureMd, pieces: [ { id, label, sinceSession } ] },
  stages: [ { id: "st3", title, goal, projectMilestone, sessions: ["s14", …] } ],
}

// skills.js
{ id: "k-set-resources", kind: "command", area: "kubernetes",
  label: "kubectl set resources deploy/…", ref: { type: "command", id: "c0xx" } }
// kind: command | yaml | procedure | concept | docs | path
// area: kubernetes | vim | linux | network

// một buổi trong stage-NN.js
{
  id: "s14", stage: "st3", title, durationMin: 75,
  domain: "workloads", competencies: ["wl-…"], requires: ["s13"],
  goals: [ "…" ],
  skills: [ { skill: "k-set-resources", level: "Gõ được không tra" } ],  // học lần đầu
  uses: [ "k-rollout-status" ],                                          // dùng lại
  foundation: { area: "linux", md: "…" } | null,
  mindset: "markdown",
  refs: [ { label, href } ],            // #/docs/…, #/roadmap/…, URL ngoài
  stateIn: "markdown", stateOut: "markdown",
  tasks: [ { id: "t1", text: "…" } ],
  hints: [ "…" ], solution: "markdown",
  exam: { patterns: [ "…" ], timeTargetMin: 6,
          drills: [ { text, timeLimitMin, solution } ] },
  tips: [ "…" ],
  outcome: { md: "…", verifyOutput: "…", projectDelta: "…" },
  review: [ { q, a } ],                 // 3–5 câu, hiện ở bước ôn của buổi kế tiếp
}

// mocks.js
{ id: "m1", title, durationMin: 120,
  questions: [ { id: "q1", domain, weight, context: "node/namespace", text, solution } ] }
```

### Bất biến mới trong `check-data.mjs`

- Id buổi, kỹ năng, nhiệm vụ, đề mock, câu mock không trùng trong một chương trình.
- `requires`, `skills[].skill`, `uses[]`, `competencies[]`, `stage`, `domain`, `ref` (lệnh/YAML/quy trình) đều trỏ tới thứ tồn tại; link `#/docs/…` trong `refs` tồn tại.
- Mỗi kỹ năng được **học ở đúng một buổi** (`skills`) và mọi buổi `uses` nó đứng sau buổi học.
- `requires` không tạo vòng; thứ tự buổi trong chặng tôn trọng `requires`.
- **Mọi `competency` của curriculum được ít nhất một buổi phủ**, và tỷ trọng câu hỏi theo domain của mỗi đề mock lệch không quá vài điểm phần trăm so với `exam.domains`.
- Mỗi buổi có đủ các trường bắt buộc ở mục 5.4 (trừ `foundation`).
- Đối chiếu với thư mục lab: mỗi buổi có thư mục script tương ứng và ngược lại (mục 8.4).
- Số lượng bản ghi theo bảng kỳ vọng (`EXPECTED.counts`) như các module khác.

## 7. Chương trình CKA

### 7.1 Môi trường [Đã chốt: Multipass trên máy cá nhân]

| VM | vCPU | RAM | Đĩa | Vai trò |
|---|---|---|---|---|
| `cka-cp` | 2 | 3 GB | 20 GB | control plane |
| `cka-w1` | 2 | 2 GB | 15 GB | worker |
| `cka-w2` | 2 | 2 GB | 15 GB | worker |

- Ubuntu LTS arm64, containerd, kubeadm. Tổng khoảng 7 GB RAM [Đề xuất].
- Người dùng làm bài **bên trong VM** (`multipass shell cka-cp`, ssh sang worker) để giống thao tác ssh giữa các node trong phòng thi; script lab chạy từ máy Mac [Tự quyết].
- Cluster cài ở phiên bản **thấp hơn phiên bản đề thi hiện hành một bậc minor**, để buổi nâng cấp ở chặng 8 nâng lên đúng phiên bản thi [Đề xuất].
- [Builder] phải kiểm tra tại thời điểm làm: phiên bản Kubernetes của đề CKA hiện hành và curriculum chính thức (`github.com/cncf/curriculum`), rồi điền `exam.k8sVersion`, `exam.competencies`. Tỷ trọng domain dùng để thiết kế: Troubleshooting 30%, Cluster Architecture, Installation & Configuration 25%, Services & Networking 20%, Workloads & Scheduling 15%, Storage 10%; nếu curriculum hiện hành khác thì theo curriculum.

### 7.2 Project xuyên suốt: "shop" [Đề xuất]

- Ba service Spring Boot: `gateway` (cửa vào, gọi hai service kia), `catalog` (đọc sản phẩm từ PostgreSQL), `order` (ghi đơn hàng vào PostgreSQL, gọi `catalog`), cùng một PostgreSQL.
- Mã nguồn và Dockerfile **viết sẵn**; người dùng không viết Java trong buổi học. Ứng dụng cố ý nhỏ nhưng có đủ thứ để mỗi phần đề thi có lý do xuất hiện:
  - Actuator health/readiness/liveness → probe.
  - Cấu hình qua biến môi trường và file → ConfigMap, Secret.
  - Graceful shutdown → rollout không rớt request.
  - Heap và bộ nhớ container → requests/limits, OOMKilled.
  - HikariCP nối PostgreSQL → Service, DNS, NetworkPolicy, StatefulSet, PVC.
  - Endpoint cố ý chậm hoặc ngốn CPU (bật bằng cấu hình) → HPA, troubleshooting.
  - Ít nhất hai phiên bản image → rolling update, rollback.
- Phiên bản Java/Spring Boot: [Builder], ưu tiên cùng mốc FlashSale (Java 25, Spring Boot 4.x) nếu image arm64 ổn định, không thì LTS gần nhất.
- Đưa image vào cluster không cần registry: build trên Mac bằng Docker (arm64), `docker save`, chuyển vào từng node và import vào containerd; gói trong lệnh `./lab images cka` [Tự quyết]. [Builder] có thể chọn cách khác nếu đơn giản và offline được.
- **Trạng thái cuối chương trình**: hệ thống chạy trên cluster 3 node tự dựng bằng kubeadm, cài bằng Helm chart, có Ingress và Gateway API, NetworkPolicy mặc định chặn, RBAC cho hai vai "dev" và "ops", PostgreSQL trên StatefulSet với dữ liệu bền vững, requests/limits và HPA, đã qua một lần nâng cấp cluster và một lần khôi phục etcd.

### 7.3 Kỹ năng nền: vim, Linux, network [Đã chốt là phải có; cách tổ chức là Tự quyết]

Hai lớp:

1. **Chặng 0 mở rộng thành 5 buổi**, thực hành ngay trên 3 VM trước khi có Kubernetes.
2. **Khối "Nền tảng cần cho buổi này"** đặt đúng buổi cần tới lần đầu (just-in-time), có lý thuyết ngắn và bài tập cụ thể. Ví dụ: `openssl` và chuỗi chứng chỉ trước buổi kubeconfig/RBAC; iptables/nftables đọc-hiểu trước buổi Service; `systemctl`/`journalctl` nâng cao trước buổi sửa kubelet; `ip route`, `tcpdump`, `nslookup`/`dig` trước buổi CoreDNS và NetworkPolicy; macro và thao tác khối trong vim trước buổi sửa nhiều manifest.

Mọi kỹ năng nền đều vào Bản đồ kỹ năng với `area` là `vim`, `linux` hoặc `network`. Phần lý thuyết tận dụng `CKAD-Prerequisites.md` và lĩnh vực Lập trình hệ thống (chương mạng) làm tham chiếu đọc thêm, nhưng bài tập trong buổi là mới và làm trên VM lab.

### 7.4 Lộ trình [Đề xuất; số buổi từng chặng là ước lượng, Builder được điều chỉnh ±1 mỗi chặng, tổng 48–54]

Nguyên tắc sắp xếp: theo thứ tự project cần đến, đi từ thứ quen với Java dev (chạy và cấu hình app) sang thứ lạ (quản trị cluster); **mỗi chặng 1–8 kết thúc bằng một buổi sự cố** của chính chặng đó vì Troubleshooting chiếm 30% đề.

| Chặng | Chủ đề | Buổi | Mốc project |
|---|---|---|---|
| 0 | Môi trường và kỹ năng nền: Multipass và 3 VM; thói quen phòng thi (alias, `$do`, tra kubernetes.io); vim + tmux + bash tốc độ; Linux quản trị (systemd, journalctl, tiến trình, quyền, gói); Linux network (ip, route, ss, DNS, curl/nc, đọc iptables, network namespace/veth); container thuần với containerd/crictl | 5 | 3 VM sẵn sàng, bộ lệnh lab chạy được |
| 1 | Dựng cluster: chuẩn bị node, containerd, `kubeadm init`/`join`, cài CNI, giải phẫu static pod và kubeconfig; buổi sự cố | 4 | Cluster 3 node Ready tự dựng |
| 2 | Workload: Pod, Deployment, ConfigMap/Secret, probe, rolling update/rollback, Job/CronJob, DaemonSet; buổi sự cố | 6 | 3 service chạy, cấu hình tách khỏi image |
| 3 | Scheduling và tài nguyên: requests/limits với JVM, QoS, quota/LimitRange, nodeSelector/affinity, taint/toleration, static pod, HPA và metrics-server; buổi sự cố | 5 | App có giới hạn tài nguyên, tự co giãn |
| 4 | Storage: volume, PV/PVC, StorageClass và dynamic provisioning, access mode/reclaim policy, StatefulSet; buổi sự cố | 4 | PostgreSQL giữ dữ liệu qua restart và dời node |
| 5 | Networking: mô hình mạng Pod và CNI, Service các loại, kube-proxy, CoreDNS, Ingress, Gateway API, NetworkPolicy; buổi sự cố | 7 | Gọi được từ máy Mac, mạng nội bộ khoá đúng mức |
| 6 | Bảo mật truy cập: PKI của cluster, CSR và user mới, kubeconfig, RBAC, ServiceAccount; buổi sự cố | 4 | Vai "dev" và "ops" với quyền khác nhau |
| 7 | Đóng gói và mở rộng: Helm, Kustomize, CRD và operator; buổi sự cố | 4 | Cả hệ thống cài lại bằng một lệnh |
| 8 | Vận hành cluster: drain/cordon, nâng cấp kubeadm, backup/restore etcd, gia hạn chứng chỉ, khái niệm HA control plane; buổi sự cố | 4 | Cluster nâng một phiên bản, app không gián đoạn; khôi phục được từ snapshot etcd |
| 9 | Troubleshooting tổng hợp: quy trình chẩn đoán theo tầng (app, Service/DNS, node, control plane), `./lab break` gây lỗi ẩn, người dùng tìm và sửa có bấm giờ | 6 | Sổ tay sự cố riêng (ghi chú các buổi) |
| 10 | Mock: 2 đề đầy đủ | 2 | Điểm theo domain |

Tổng 51 buổi. Ở nhịp 3 buổi/tuần là 17 tuần, vừa khung 3–6 tháng và còn dư chỗ làm lại mock.

### 7.5 Mỗi buổi phải thoả

- Có lý do trong câu chuyện project (ghi ở `outcome.projectDelta`).
- `./lab verify` kiểm được kết quả bằng máy, không dựa vào cảm giác.
- Ghi rõ domain, năng lực curriculum, dạng câu trong đề, thời gian mục tiêu.
- Phần Tư duy có ít nhất một liên hệ từ Java/Spring khi chủ đề cho phép; không gượng ép ở buổi thuần quản trị.
- Tham chiếu ít nhất một tài liệu trong app.

## 8. Bộ công cụ lab

### 8.1 Vị trí [Tự quyết]

Thư mục cấp một mới `labs/` trong repo (không vào bản deploy web, thêm vào `.dockerignore`):

```
labs/
├── lab                    # CLI, bash, chạy trên macOS; không phụ thuộc gì ngoài multipass, docker
├── lib/                   # hàm dùng chung, không biết gì về chương trình cụ thể
└── cka/
    ├── env.sh             # tên VM, kích thước, phiên bản
    ├── cloud-init/        # chuẩn bị VM
    ├── app/               # mã nguồn 3 service + Dockerfile
    ├── sessions/<id>/     # check.sh, apply.sh, verify.sh, tệp kèm theo
    ├── breaks/<id>/       # kịch bản gây lỗi
    └── mocks/<id>/        # setup.sh, score.sh
```

### 8.2 Lệnh [Đề xuất]

| Lệnh | Việc làm |
|---|---|
| `./lab up <program>` / `down` / `status` | Bật, tắt, xem 3 VM và trạng thái node. `up` lần đầu thì tạo VM. |
| `./lab check <program> <session>` | Kiểm tra cluster có đúng trạng thái đầu vào của buổi (tức đầu ra buổi trước). In từng điều kiện đạt/không đạt. |
| `./lab verify <program> <session>` | Chấm kết quả buổi: in từng tiêu chí và tổng kết. |
| `./lab restore <program> <session>` | Đưa cluster về trạng thái cuối buổi đó. |
| `./lab break <program> <id>` | Gây lỗi cho buổi sự cố; không in ra đã làm gì. |
| `./lab mock <program> <mock> start` / `score` | Dựng đề; chấm và in điểm theo domain cùng dòng kết quả để dán vào app. |
| `./lab images <program>` | Build và nạp image ứng dụng vào các node. |
| `./lab destroy <program>` | Xoá VM của chương trình, có hỏi xác nhận. |

### 8.3 Checkpoint và restore [Tự quyết]

- Mỗi buổi có `apply.sh`: lời giải chuẩn, chạy lại nhiều lần được, đưa cluster từ trạng thái đầu vào sang đầu ra của buổi.
- Một số mốc lớn có **snapshot VM** (ít nhất: VM trống sau chặng 0, cluster vừa dựng xong sau chặng 1, trước buổi nâng cấp, trước buổi etcd).
- `restore <N>` = về snapshot mốc gần nhất đứng trước hoặc tại N, rồi chạy lần lượt `apply.sh` của các buổi sau mốc đến N.
- [Builder] kiểm tra hành vi snapshot của Multipass trên máy thật (phiên bản 1.16.3; snapshot có thể yêu cầu VM dừng) và chọn cơ chế mốc phù hợp; nếu snapshot không đáng tin thì thay bằng dựng lại từ đầu bằng `apply.sh`, chấp nhận chậm hơn.
- `./lab selftest <program>`: chạy toàn bộ chuỗi `apply.sh` → `verify.sh` từ buổi đầu đến cuối trên cluster sạch, để chứng minh giáo trình chạy thật trước khi phát hành một chặng.

### 8.4 Ràng buộc

- Chỉ đụng VM có tiền tố của chương trình (xem A3). `destroy` và `restore` phải liệt kê VM sẽ bị tác động trước khi làm.
- Script trong `lib/` không chứa tên chương trình; mọi thứ riêng của CKA nằm trong `labs/cka/`.
- `check-data.mjs` đối chiếu: mỗi buổi trong dữ liệu có `labs/<program>/sessions/<id>/verify.sh`, và mỗi thư mục buổi có buổi tương ứng trong dữ liệu; tương tự cho mock (hai chiều), cộng dòng `milestones` và id `lab_break` phải trỏ tới thứ có thật (PR11).
- `verify.sh` không sửa trạng thái mà buổi học tạo ra. Ngoại lệ có chủ ý: khi cần thử một hành vi (vd. Pod chạy được, DNS phân giải trong cluster), `verify.sh` được chép một script trợ giúp vào `/tmp` của control plane (tệp này ở lại, chạy lại thì bị ghi đè) và tạo một **namespace tạm** cùng Pod trong đó; namespace **bị xoá trước khi script thoát** (s07, s09 làm vậy). Vì `check` chạy `verify.sh` của buổi trước, điều này cũng áp cho `check`.

## 9. Thứ tự giao hàng [Tự quyết, cần người dùng biết]

Viết 51 buổi đầy đủ là khối lượng lớn. Chia đợt để người dùng học được sớm:

1. **Đợt 1**: module Thực hành trong web app (đủ các màn hình), bộ lệnh `lab`, ứng dụng "shop", **khung cả chương trình** (đủ 51 buổi ở mức tiêu đề, chặng, domain, năng lực curriculum, kỹ năng, trạng thái vào/ra, để Bản đồ kỹ năng và độ phủ đề thi đúng ngay từ đầu), và **nội dung đầy đủ chặng 0–1**.
2. **Các đợt sau**: mỗi đợt một hoặc hai chặng, nội dung đầy đủ kèm script, qua `selftest` rồi mới phát hành. Thứ tự theo lộ trình.
3. **Đợt cuối**: 2 đề mock.

Buổi mới ở mức khung hiện trong app với nhãn "chưa có nội dung" và không tính là học được.

## 10. Kiểm chứng

- `check-data.mjs` xanh với các bất biến ở mục 6.
- `./lab selftest cka` xanh cho các chặng đã phát hành, chạy trên máy M1 16GB.
- Chạy app local (`./webapp/scripts/dev.sh`) và đi qua trọn một buổi: mở trang chủ, làm theo ba bước, tick nhiệm vụ, verify, đánh dấu hoàn thành, ghi chú, sang buổi sau thấy câu ôn và ghi chú.
- Xuất/nhập tiến độ giữ nguyên dữ liệu thực hành.
- Giao diện đúng ở cả theme sáng và tối, dùng được trên màn hình hẹp.

## 11. Để người triển khai quyết

- Tên trường chính xác, cách tách tệp dữ liệu, cấu trúc view và CSS (theo design system hiện có trong `css/style.css`).
- CNI, ingress controller, triển khai Gateway API, provisioner cho StorageClass: chọn thứ nhẹ, có image arm64, gần với môi trường đề thi.
- Cách script lab gọi vào VM (multipass exec hay kubeconfig trên Mac).
- Nội dung chi tiết từng buổi, miễn thoả mục 5.4 và 7.5.
- Cập nhật README, `webapp/README.md` và con số trong đó.

## 12. Làm rõ sau vòng reviewer đọc [Tự quyết]

- **Buổi khung và buổi đã phát hành.** Mỗi buổi có cờ trạng thái nội dung (khung / đã phát hành). Bất biến về cấu trúc (id, tham chiếu, độ phủ curriculum, thứ tự kỹ năng) áp cho mọi buổi; yêu cầu đủ trường ở mục 5.4 và có `verify.sh` chỉ áp cho buổi đã phát hành. Buổi khung không đánh dấu hoàn thành được.
- **Id buổi là định danh mờ.** Thứ tự buổi lấy từ `stages[].sessions`, không suy từ số trong id, nên thêm hoặc bớt một buổi khung không làm đổi id nào đã có.
- **Buổi không thuộc domain đề thi.** `domain` được phép rỗng cho các buổi nền tảng ở chặng 0 và hai buổi mock ở chặng 10; các buổi này không tính vào thanh độ phủ đề thi. Buổi chặng 10 là trang mỏng dẫn sang đề mock tương ứng.
- **Buổi sự cố.** Trạng thái đầu vào = đầu ra buổi trước + `./lab break`. `apply.sh` của buổi sự cố chạy kịch bản gây lỗi rồi chạy cách sửa, để `restore` và `selftest` đi xuyên qua bình thường.
- **Đồng hồ bấm giờ.** Viết một helper đồng hồ dùng chung cho module Thực hành; không sửa `views/labs.js`.
- **`selftest` chạy ở đâu.** Trên máy người dùng với VM Multipass thật, không chạy trong CI. Việc chặn theo tiền tố `cka-` (A3) phải được làm và kiểm trước mọi lệnh có khả năng xoá hoặc khôi phục VM.
- **Phạm vi kế hoạch triển khai.** Kế hoạch chi tiết cho đợt 1; các đợt sau mô tả thành một khuôn lặp lại theo chặng.

## 13. Việc lặt vặt đi kèm

- Thêm `.superpowers/brainstorm/` vào `.gitignore`.
