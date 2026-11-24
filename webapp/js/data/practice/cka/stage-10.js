// Chặng 10 — Mock. Hai buổi là trang mỏng dẫn sang đề mock tương ứng (spec mục
// 12): kind "mock", 120 phút, không dạy kỹ năng mới, ngoài domain đề thi.

export const sessions = [
  {
    id: "s52",
    stage: "st10",
    kind: "mock",
    title: "Mock 1",
    durationMin: 120,
    domain: null,
    competencies: [],
    requires: ["s51"],
    status: "published",
    pieces: [],
    goals: [
      "Làm trọn đề m1 (16 câu, 120 phút) trên cluster lab, chỉ tra kubernetes.io, theo nhịp phòng thi: ba lượt đọc đề, `k config current-context` trước mỗi câu, ghi đáp án đúng đường dẫn.",
      "Đạt ít nhất 66% (`./labs/lab verify cka s52` xanh) và biết domain nào kéo điểm xuống, từ dòng `devprep-mock:v1:…` dán vào app.",
      "Chữa bài: đọc lời giải từng câu mất điểm, làm lại câu đó trên chính cluster cho tới khi score.sh cho đủ điểm câu đó.",
    ],
    skills: [],
    uses: ["k-exam-triage", "k-use-context", "k-answer-to-file"],
    stateIn: "Đầu ra s51 (mốc `st9-done`): lõi khoẻ, `s51-batch` đã sửa, không còn Pod ngốn CPU. Trên Mac: `./labs/lab mock cka m1 start` kiểm lõi khoẻ rồi dọn lần làm trước của m1 và dựng 16 câu (namespace `m1-q1`…`m1-q16`, chart ở `/opt/m1/charts/notice`, đáp án ghi vào `/opt/m1/`, ~1–3 phút); một câu sự cố cấp node sửa trên `cka-w1`. Chạy lại `start` là làm lại từ đầu: mọi thứ của m1 bị xoá.",
    stateOut: "Đề m1 đã chấm (`./labs/lab mock cka m1 score`: 16 dòng điểm từng phần, bảng theo domain, dòng `devprep-mock:v1:cka:m1:…` đã dán vào trang đề) và ≥ 66%; câu sự cố q12 đã sửa tận gốc (kubelet `cka-w1` đúng `clusterDNS`), lõi khoẻ như s51. Hai Pod ngốn CPU của q4 đã xoá. Đồ còn lại của m1 (namespace `m1-*`, StorageClass `m1-fast`, PV `m1-*`, một dòng `legacy.m1.lab` trong Corefile) ở lại tới lần `mock … m1 start` sau; Mock 2 không cần dọn chúng.",
    mindset: `**Phòng thi là bài toán ngân sách: 120 phút, 100 điểm, mỗi câu một giá.** Đề m1 chấm từng phần như đề thật: tạo đúng tên mà sai một trường chỉ mất phần của trường đó, còn câu bỏ trắng là 0. Vì vậy thứ tự làm quan trọng ngang kỹ thuật.

**Ba lượt đọc đề.**

| Lượt | Làm gì | Thời gian |
|---|---|---|
| 1. Đọc lướt | Đọc hết 16 câu, ghi ra giấy: số câu, trọng số, ước lượng phút (≤ 5 / 5–8 / > 8), câu nào "lúc sự cố" phải làm trước khi sửa | 3–5 phút |
| 2. Câu nhanh | Mọi câu ước ≤ 5 phút, theo thứ tự đề: ghi tệp, RBAC, rollout, PV/PVC, Helm, etcd snapshot | ~45 phút |
| 3. Câu dài | Câu sự cố và câu nhiều bước, mỗi câu trần 1,5 lần ước lượng; quá trần thì ghi số câu, đi tiếp | ~55 phút |
| Cuối | Quay lại câu đã đánh dấu; \`cat\` lại mọi tệp đáp án | ~10 phút |

**Mỗi câu một nghi thức.** Đề thật mở đầu mỗi câu bằng một dòng \`kubectl config use-context <cluster>\`: dán nó trước tiên, kể cả khi nghĩ là đang đúng context — làm đúng bài trên sai cluster là 0 điểm. Lab có một cluster nên nghi thức ở đây là \`k config current-context\` và đọc kỹ dòng "Làm việc trên: …" (namespace, node). Rồi: đọc yêu cầu thành danh sách tiêu chí → làm → **tự kiểm từng tiêu chí** (\`k get … -o yaml\`, \`k auth can-i\`, \`curl\`, \`cat\` tệp) → mới sang câu sau.

**Đọc đề như đọc spec.** Mỗi danh từ cụ thể (tên, cổng, đường dẫn, "chỉ tên Pod", "không xoá probe") là một tiêu chí chấm. Câu hỏi về trạng thái **lúc sự cố** (log, Event, Pod không Ready) làm trước khi sửa cùng đối tượng: sửa xong bằng chứng đổi. Câu "không được làm X" thường có một lối tắt bị cấm (xoá readinessProbe, gắn ClusterRole \`edit\`, chép binary, chèn cờ) mà score.sh chấm riêng.

Như chạy test suite Java: chạy hết test nhanh trước để biết mình đang ở đâu, test tích hợp chậm để sau — đừng để một test treo chặn cả buổi.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 9 — Mock bấm giờ 2 tiếng", href: "#/roadmap/cka/cka-w9-2" },
      { label: "Bài lộ trình CKA: Tuần 9 — Chỉ tiêu tốc độ bài trọng điểm", href: "#/roadmap/cka/cka-w9-4" },
      { label: "CKA Cheat Sheet", href: "#/docs/cka-cheat-sheet" },
      { label: "CKA Study Guide, chương 1 — Kỳ thi CKA", href: "#/docs/ckabook-01" },
      { label: "kubectl Quick Reference", href: "https://kubernetes.io/docs/reference/kubectl/quick-reference/" },
      { label: "Sidecar containers", href: "https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/" },
      { label: "Gateway API — HTTPRoute", href: "https://kubernetes.io/docs/concepts/services-networking/gateway/" },
      { label: "Customizing DNS Service (CoreDNS)", href: "https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/" },
    ],
    tasks: [
      { id: "t1", text: "Chuẩn bị như phòng thi (≤ 2 phút): `multipass shell cka-cp`, `alias k=kubectl`, `export do=\"--dry-run=client -o yaml\"`, mở sẵn một tab kubernetes.io/docs. Trên Mac: `./labs/lab mock cka m1 start`. Mở trang đề `#/practice/cka/mock/m1`, bấm **Bắt đầu đếm giờ**." },
      { id: "t2", text: "**Lượt 1 (3–5 phút).** Đọc lướt 16 câu, ghi ra giấy bảng `câu | trọng số | ước phút | làm trước khi sửa?`. Đánh dấu q4 (log, top) và q16 (reason của Event) là câu \"lúc sự cố\"; q12 làm trên node `cka-w1`." },
      { id: "t3", text: "**Lượt 2 (~45 phút).** Làm mọi câu ước ≤ 5 phút theo thứ tự đề. Mỗi câu: `k config current-context`, đọc dòng \"Làm việc trên\", làm, tự kiểm từng tiêu chí (`-o yaml`, `auth can-i`, `curl`, `cat /opt/m1/<tệp>`), rồi bấm \"Đánh dấu để quay lại\" nếu còn nghi." },
      { id: "t4", text: "**Lượt 3 (~55 phút).** Câu sự cố và câu nhiều bước (q8, q9, q12, q14, q16…), mỗi câu trần 1,5 lần ước lượng. Kẹt quá trần: ghi số câu, đi tiếp. 10 phút cuối: quay lại câu đã đánh dấu, `ls -l /opt/m1/` và `cat` từng tệp đáp án." },
      { id: "t5", text: "Hết giờ (hay xong sớm): trên Mac `./labs/lab mock cka m1 score`. Dán dòng cuối `devprep-mock:v1:cka:m1:…` vào ô **Kết quả** của trang đề: app lưu điểm theo domain và mở lời giải từng câu. Muốn biết câu nào mất điểm vì sao: `MOCK_WHY=1 ./labs/lab mock cka m1 score`." },
      { id: "t6", text: "**Tình huống hỏng.** Câu q12 có lối tắt: sửa xong `config.yaml` của kubelet nhưng chưa restart, hay restart mà Pod `dns-probe` vẫn là Pod cũ — node vẫn Ready, chỉ Pod MỚI mới nhận cấu hình. Chạy `./labs/lab verify cka s52`: dòng q12 đỏ dù bạn \"đã sửa tệp\". Đọc `k get --raw /api/v1/nodes/cka-w1/proxy/configz` (cấu hình kubelet ĐANG chạy) và `cat /etc/resolv.conf` trong Pod mới, sửa cho tới khi dòng đó xanh." },
      { id: "t7", text: "Chữa bài (ngoài 120 phút): với mỗi câu chưa đủ điểm, mở lời giải trên trang đề, làm lại câu đó trên chính cluster, chấm lại tới khi đủ. Ghi vào sổ tay `~/notes/runbook.md` một mục `## s52` (≥ 3 dòng): câu mất điểm, vì sao, thời gian thật so với ước lượng. Dọn hai Pod ngốn CPU của q4: `k -n m1-q4 delete pod -l 'app in (cache,burner)'` (q4 chấm theo mốc lúc dựng đề, vẫn đủ điểm; để chúng chạy thì câu đo CPU của Mock 2 lệch). Cuối cùng `./labs/lab verify cka s52` phải 3/3." },
    ],
    hints: [
      "Không biết bắt đầu câu nào: câu có trọng số cao mà ước ≤ 5 phút (q4 8%, q6 7%) đáng làm trước câu 5% dài.",
      "Câu ghi tệp: đề nói \"chỉ tên Pod\" thì không ghi `<ns>/<pod>`, không ghi cả dòng của `top`. `awk '{print $1}'` sau `--no-headers`.",
      "RBAC: `k create role` gán cùng một bộ verb cho mọi `--resource`; đề đòi hai bộ verb khác nhau thì viết YAML hai rule. Kiểm bằng `k auth can-i … --as=system:serviceaccount:<ns>:<sa>` cả chiều \"được\" lẫn \"không được\".",
      "HPA `<unknown>`: `k describe hpa` → `missing request for cpu`. HPA tính phần trăm trên requests.",
      "PVC Pending: `k describe pvc` — `WaitForFirstConsumer` là bình thường tới khi có Pod; PVC không ghi `storageClassName` thì nhận lớp mặc định và không bao giờ khớp PV tĩnh.",
      "Service không trả lời: `k get endpointslice -l kubernetes.io/service-name=<svc>`. Rỗng thì Pod chưa Ready hay selector lệch; có địa chỉ mà vẫn lỗi thì `targetPort`.",
      "HTTPRoute: `k get httproute <tên> -o yaml` phần `status.parents[].conditions` — `Accepted` (gắn được listener) và `ResolvedRefs` (backend có thật) là hai câu hỏi khác nhau.",
      "Pod cùng spec chạy được ở node này mà hỏng ở node kia: so `cat /etc/resolv.conf`, image có trên node chưa, `k describe node` — thứ khác nhau nằm ở node, không ở Pod.",
    ],
    solution: `Lời giải từng câu nằm trên trang đề (\`#/practice/cka/mock/m1\`), mở ra sau khi bạn dán dòng kết quả; mỗi lời giải ghi thời gian mục tiêu, lệnh và vì sao. Đó cũng là đúng các bước của \`labs/cka/mocks/m1/files/solve.sh\` (cka-cp) và \`solve-node.sh\` (cka-w1) mà \`apply.sh\` của buổi chạy.

Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, từ mốc \`st9-done\`). Ngay sau \`mock cka m1 start\`, chưa làm gì:

\`\`\`text
$ ./labs/lab mock cka m1 score
  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)
DOMAIN             ĐIỂM
architecture       0/25
workloads          0/15
storage            0/10
troubleshooting    0/30
networking         0/20
devprep-mock:v1:cka:m1:2026-11-25:architecture=0/25,workloads=0/15,storage=0/10,troubleshooting=0/30,networking=0/20
\`\`\`

Sau lời giải chuẩn (\`apply.sh\` của s52 dừng lỗi nếu chưa đủ 100):

\`\`\`text
$ MOCK_WHY=1 … (cuối apply.sh của s52)
  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)
  q1    6/6
  q2    5/5
  q3    5/5
  q4    8/8
  q5    7/7
  q6    7/7
  q7    5/5
  q8    7/7
  q9    7/7
  q10   6/6
  q11   5/5
  q12   8/8
  q13   5/5
  q14   6/6
  q15   6/6
  q16   7/7
s52: điểm m1 sau lời giải chuẩn: 100/100

$ ./labs/lab mock cka m1 score
DOMAIN             ĐIỂM
architecture       25/25
workloads          15/15
storage            10/10
troubleshooting    30/30
networking         20/20
devprep-mock:v1:cka:m1:2026-11-25:architecture=25/25,workloads=15/15,storage=10/10,troubleshooting=30/30,networking=20/20
\`\`\`

Thời gian đo khi soạn: \`mock … start\` 28–65 giây (65 giây lần đầu từ \`st9-done\`, 28–29 giây hai lần chạy lại liền); \`score\` 1–11 giây (16 câu; apiserver tắt: 0,9 giây, vẫn đủ 16 dòng, chỉ câu chấm bằng tệp có điểm); \`apply.sh\` (dựng + lời giải + chấm) 1 phút 31 giây – 2 phút 30 giây → 100/100 (ba lần). Phân bổ theo ước lượng của từng câu: tổng thời gian mục tiêu 16 câu là 90 phút — còn ~30 phút cho đọc đề, kiểm lại và câu kẹt.`,
    exam: {
      timeTargetMin: 120,
      patterns: [
        "**Mỗi câu một context**: đề thật có 4–6 cluster, mỗi câu mở bằng `kubectl config use-context …` — dán dòng đó trước tiên, mỗi câu, không ngoại lệ.",
        "**Chấm từng phần**: phần nào làm được là có điểm phần đó. Câu kẹt vẫn làm phần dễ (tạo đối tượng đúng tên, đúng namespace) rồi đi tiếp.",
        "**Câu \"lúc sự cố\"** (log, Event, Pod không Ready ghi ra tệp) làm trước khi sửa đối tượng đó.",
      ],
    },
    tips: [
      "Đừng chạy lại `./labs/lab mock cka m1 start` giữa giờ để \"làm sạch\" một câu: nó xoá cả 16 câu và mọi tệp trong `/opt/m1/`.",
      "Dán dòng `devprep-mock:v1:…` ngay sau khi chấm: app lưu theo ngày, chấm lại sau khi chữa bài cho dòng mới (điểm đã chữa) — giữ dòng đầu tiên làm điểm thật của lần làm.",
      "Thứ m1 để lại (namespace `m1-*`, StorageClass `m1-fast`, PV `m1-*`, dòng `legacy.m1.lab` trong Corefile) không ảnh hưởng Mock 2; `mock … m1 start` lần sau tự dọn.",
      "Câu nào lỡ làm hỏng cluster (sửa nhầm `etcd.yaml`, xoá nhầm namespace `shop`): `./labs/lab restore cka s51` rồi làm lại đề — mất ~10 phút, rẻ hơn gỡ tay trong giờ thi.",
    ],
    outcome: {
      md: "Một lần làm trọn đề bấm giờ, có điểm theo domain trong app. Trên Mac:\n\n```bash\n./labs/lab verify cka s52\n```\n\nBa dòng. **Đề đã dựng:** `/opt/m1/started` có (do `mock … start` ghi). **Điểm ≥ 66%:** tổng của `mocks/m1/score.sh` (16 câu chấm từng phần theo sự thật trên cluster và mốc lúc dựng đề ở `/root/.lab/m1/`: tên Pod, mã trang, revision, CRD, CRI/CNI thật — không theo chuỗi đoán được); dòng này in câu nào chưa đủ. **Câu sự cố đã sửa và lõi khoẻ:** q12 đủ điểm (kubelet `cka-w1` chạy với `clusterDNS` đúng, `config.yaml` như bản kubeadm, Pod `dns-probe` mới Ready) cộng ba node, control plane, shop trải hai worker. Trên đầu vào (chưa `start`): **0/3** (đo); ngay sau `mock … start`: **1/3** trong 4 giây — chỉ dòng \"đã dựng\" xanh.",
      verifyOutput: "lab: kiểm s52\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~14 phút)\n  ✓ Đề m1 đã dựng (/opt/m1/started)\n  ✓ Điểm m1 ≥ 66%: 100/100 (score.sh, 16 câu chấm từng phần)\n  ✓ Câu sự cố q12 đã sửa (kubelet cka-w1: clusterDNS, Pod mới phân giải được); lõi khoẻ: ba node, control plane, shop\n  → 3/3 đạt",
      projectDelta: "Không thêm mảnh project (buổi mock). Cluster giữ mốc `st9-done` cộng đồ của đề m1; kết quả mock đầu tiên lưu trong app theo domain.",
    },
    review: [
      { q: "Vì sao đề bắt ghi số revision của `VERSION=v1` **trước** khi rollback, và vì sao `rollout undo` trần không đủ?", a: "`rollout undo` không đối số quay về revision liền trước (v2). `--to-revision=N` mới về đúng v1, và sau rollback bản v1 được đánh số revision mới nhất: số cũ biến mất khỏi `rollout history`, nên ghi sau thì không còn gì để đọc." },
      { q: "Pod `dns-probe` trên cka-w1 không phân giải được tên, Pod cùng spec trên cka-w2 thì được, CoreDNS khoẻ. Bạn khoanh vùng thế nào trong 2 phút?", a: "Cùng spec, khác node → lỗi ở node. `cat /etc/resolv.conf` trong hai Pod: nameserver khác nhau. Nameserver do kubelet của node ghi từ `clusterDNS` trong `/var/lib/kubelet/config.yaml`, nên so tệp đó với `k -n kube-system get svc kube-dns`. Sửa, restart kubelet (nó chỉ đọc tệp lúc khởi động), tạo lại Pod (Pod cũ giữ resolv.conf cũ)." },
      { q: "NetworkPolicy chỉ cho `app=client` vào `api`: vì sao thêm `namespaceSelector: {}` vào cùng phần tử `from` là sai, dù client vẫn gọi được?", a: "Trong một phần tử `from`, `namespaceSelector` và `podSelector` cùng lúc nghĩa là \"Pod khớp nhãn ở các namespace khớp selector\"; `{}` khớp mọi namespace, nên Pod `app=client` ở `m1-q14` cũng vào được. Chỉ `podSelector` thì giới hạn trong namespace của policy. Thử cả chiều bị chặn, không chỉ chiều được." },
      { q: "Bạn còn 15 phút, ba câu chưa làm: q15 (6%, ước 6 phút), q9 (7%, ước 7 phút, đã làm được Service), q2 (5%, ước 4 phút). Làm theo thứ tự nào?", a: "q2 rồi q15 (rẻ, chắc điểm: 11% trong ~10 phút), rồi phần còn lại của q9 (HTTPRoute) nếu còn giờ — q9 đã có 3/7 từ Service, phần route là phần rủi ro nhất. Trọng số chia thời gian, không phải thứ tự trong đề." },
      { q: "Vì sao m1 không có câu \"node NotReady\" như s48, dù đó là câu sự cố node kinh điển?", a: "Đo trên lab: worker NotReady quá 300 giây thì Pod bị đuổi sang worker còn lại; metrics-server (system-cluster-critical) preempt `postgres-0` trên cka-w2 vì thiếu bộ nhớ, shop mất cơ sở dữ liệu cho tới khi gỡ tay. Đề thật mỗi câu một cluster riêng nên không có hiệu ứng dây chuyền đó; lab một cluster thì câu node phải hỏng mà node vẫn Ready. NotReady đã luyện ở s09 và s48." },
    ],
  },
  {
    id: "s53",
    stage: "st10",
    kind: "mock",
    title: "Mock 2",
    durationMin: 120,
    domain: null,
    competencies: [],
    requires: ["s52"],
    status: "skeleton",
    pieces: [],
    goals: [
      "Làm đề thứ hai sau khi đã ôn các domain yếu của Mock 1.",
      "Đạt ít nhất 75% để có biên an toàn trước khi đặt lịch thi thật.",
    ],
    skills: [],
    uses: [],
    stateIn: "Đã xong Mock 1; `./labs/lab mock cka m2 start` dựng đề trên cluster.",
    stateOut: "Đã chấm bằng `./labs/lab mock cka m2 score` và dán dòng kết quả vào app.",
  },
];
