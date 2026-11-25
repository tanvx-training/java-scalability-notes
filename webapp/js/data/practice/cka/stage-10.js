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
      "Thứ m1 để lại (namespace `m1-*`, StorageClass `m1-fast`, PV `m1-*`, dòng `legacy.m1.lab` trong Corefile) không ảnh hưởng Mock 2; `mock … m1 start` lần sau tự dọn. Bỏ dở q12 (kubelet `cka-w1` còn `clusterDNS` sai) hay q14 (Corefile làm DNS hỏng) cũng không chặn s53: `./labs/lab mock cka m2 start` đưa hai thứ đó về bản tốt của m1 trước khi dựng đề (không xoá gì của `m1-*`); muốn sửa ngay thì `./labs/lab mock cka m1 start` hay `./labs/lab restore cka s51`.",
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
    status: "published",
    pieces: [],
    goals: [
      "Làm trọn đề m2 (16 câu, 120 phút, khó hơn m1 một bậc, không câu nào lặp lại dạng của m1) theo nhịp phòng thi: lượt đọc lướt phát hiện câu chặn các câu khác, `k config current-context` trước mỗi câu, đáp án đúng đường dẫn.",
      "Đạt ít nhất 75% (`./labs/lab verify cka s53` xanh): biên an toàn trên ngưỡng đỗ 66% trước khi đặt lịch thi thật; so dòng `devprep-mock:v1:cka:m2:…` với Mock 1 theo từng domain.",
      "Chữa bài: mỗi câu mất điểm, đọc lời giải, làm lại trên chính cluster tới khi score.sh cho đủ điểm câu đó; ghi các domain còn yếu vào sổ tay để ôn trước ngày thi.",
    ],
    skills: [],
    uses: ["k-exam-triage", "k-use-context", "k-answer-to-file", "k-etcd-member-list", "k-etcd-restore", "k-kustomization-yaml",
      "k-priorityclass", "k-default-sc", "k-pv-release", "k-headless-svc", "k-netpol-dns-egress", "k-job-from-cronjob", "k-oomkilled",
      "k-limitrange-yaml", "k-kubeadm-token", "k-crictl-images", "k-endpointslice", "k-gateway-httproute"],
    stateIn: "Đầu ra s52 (Mock 1 đã làm; không đòi điểm m1 — trượt Mock 1 vẫn làm được Mock 2) và lõi khoẻ như s51: ba node, control plane, shop trải hai worker, etcd/dữ liệu như cuối s45 (`./labs/lab check cka s53`). Đồ của m1 còn đó, không cần dọn. Trên Mac: `./labs/lab mock cka m2 start` sửa trước phần mà một lần làm dở để lại (kube-scheduler của m2; kubelet `cka-w1` và Corefile nếu câu q12/q14 của m1 còn hỏng), kiểm lõi khoẻ, dọn lần làm trước của m2 rồi dựng 16 câu (namespace `m2-q1`…`m2-q16`, `m2-q5-db`; đáp án vào `/opt/m2/`; ~1–2 phút). Một câu sự cố ở control plane, một câu trên node `cka-w2`.",
    stateOut: "Đề m2 đã chấm (`./labs/lab mock cka m2 score`: 16 dòng điểm từng phần, dòng `devprep-mock:v1:cka:m2:…` đã dán vào trang đề) và ≥ 75%; câu sự cố q1 đã sửa tận gốc (kube-scheduler như bản kubeadm, giữ lease), lõi khoẻ như s51. Đồ của m2 ở lại tới lần `mock … m2 start` sau: namespace `m2-*`, ClusterRole/ClusterRoleBinding/CSR/PriorityClass `m2-*`, PV `m2-archive`, image `m2.lab/tools:1.0` trên `cka-w2`, thư mục `/var/lib/etcd-m2-check` (không dùng) và **StorageClass mặc định là `m2-standard`** (cùng provisioner `rancher.io/local-path`; `mock … m2 start` lần sau đưa về `local-path`). Đây là buổi cuối của chương trình.",
    mindset: `**Mock 2 kiểm thứ mà Mock 1 chưa kiểm: bạn có nhận ra câu chặn cả đề không.** Đề thật mỗi câu một cluster nên một sự cố không lan. Lab có một cluster: câu q1 làm kube-scheduler ngừng xếp lịch, và mọi câu cần Pod **mới** (rollout, PVC chờ Pod, Job, StatefulSet) đứng \`Pending\` theo. Người đọc lướt cả đề sẽ thấy "Pod Pending không có Event" ở q1 và hiểu vì sao làm q1 trước; người đi thẳng từ q2 sẽ mất 20 phút gỡ những câu không hỏng.

**Lượt đọc lướt, bản m2.** Ngoài bảng \`câu | trọng số | ước phút | lúc sự cố?\` của Mock 1, thêm một cột: **câu này có làm hỏng thứ dùng chung không** (control plane, DNS, StorageClass mặc định, node). Câu như vậy làm trước, rồi kiểm cả cluster (\`k get pod -A | grep -v Running\`) trước khi sang câu sau.

| Tín hiệu | Nghĩa là | Câu |
|---|---|---|
| Pod \`Pending\`, **không** Event | scheduler không làm việc (Pod scheduler vẫn có thể Running) | q1 |
| Pod \`Pending\`, \`FailedScheduling\` | scheduler làm việc, không node nào hợp | — |
| \`ErrImageNeverPull\` | image không có trên node, policy cấm kéo | q16 |
| Exit 137, RESTARTS tăng | bị SIGKILL — thường là OOM | q7 |
| Service không trả lời, Pod Ready | EndpointSlice: selector hay \`targetPort\` | q11 |
| PVC Pending mãi với PV tĩnh | lớp, cỡ, hay \`claimRef\` cũ (PV Released) | q12 |

**Câu có thứ tự bên trong.** Bốn câu m2 phạt làm sai thứ tự: đổi StorageClass mặc định **trước** khi tạo PVC (q4), có LimitRange **trước** khi tạo lại Pod (q3), đọc exit code và log \`--previous\` **trước** khi sửa (q7), đọc reason **trước** khi nạp image (q16). Viết thứ tự ra giấy ở lượt 1.

**Kiểm bằng data plane, không bằng status.** HTTPRoute \`Accepted\` chưa có nghĩa nginx đã nạp route; NetworkPolicy tạo xong chưa có nghĩa Calico đã chặn; Service có selector chưa có nghĩa có endpoint. Mỗi câu mạng kết thúc bằng một \`curl\`/\`wget\` thật cả chiều được lẫn chiều bị chặn.

Như sự cố production với Spring: khi một nửa endpoint cùng lỗi, đừng mở từng controller — tìm thứ chúng dùng chung (connection pool, DNS, config server) trước.`,
    refs: [
      { label: "Bài lộ trình CKA: Tuần 9 — Mock bấm giờ 2 tiếng", href: "#/roadmap/cka/cka-w9-2" },
      { label: "Bài lộ trình CKA: Tuần 9 — Chỉ tiêu tốc độ bài trọng điểm", href: "#/roadmap/cka/cka-w9-4" },
      { label: "CKA Cheat Sheet", href: "#/docs/cka-cheat-sheet" },
      { label: "CKA Study Guide, chương 1 — Kỳ thi CKA", href: "#/docs/ckabook-01" },
      { label: "Leader election của thành phần control plane (Lease)", href: "https://kubernetes.io/docs/concepts/architecture/leases/" },
      { label: "Pod Priority and Preemption", href: "https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/" },
      { label: "Resource Quotas", href: "https://kubernetes.io/docs/concepts/policy/resource-quotas/" },
      { label: "Operating etcd clusters — restoring", href: "https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/" },
      { label: "Declarative management with Kustomize", href: "https://kubernetes.io/docs/tasks/manage-kubernetes-objects/kustomization/" },
      { label: "Gateway API — HTTPRoute", href: "https://kubernetes.io/docs/concepts/services-networking/gateway/" },
    ],
    tasks: [
      { id: "t1", text: "Chuẩn bị như phòng thi (≤ 2 phút): `multipass shell cka-cp`, `alias k=kubectl`, `export do=\"--dry-run=client -o yaml\"`, một tab kubernetes.io/docs. Trên Mac: `./labs/lab check cka s53` (lõi khoẻ), rồi `./labs/lab mock cka m2 start`. Mở trang đề `#/practice/cka/mock/m2`, bấm **Bắt đầu đếm giờ**." },
      { id: "t2", text: "**Lượt 1 (3–5 phút).** Đọc lướt 16 câu, ghi bảng `câu | trọng số | ước phút | lúc sự cố? | phá thứ dùng chung?`. Đánh dấu: q1 (control plane, làm trước), q7 và q16 (đọc trước khi sửa), q3 và q4 (thứ tự bên trong câu), q16 làm trên `cka-w2`." },
      { id: "t3", text: "**q1 trước tiên (~8 phút).** Pod `nightly` Pending không Event: đọc log của `kube-scheduler-cka-cp`, sửa manifest (sao lưu ngoài `manifests/`), chờ Pod scheduler giữ lease `kube-system/kube-scheduler`. Kiểm cả cluster: `k get pod -A | grep -v -E 'Running|Completed'` — chỉ còn Pod của các câu khác." },
      { id: "t4", text: "**Lượt 2 (~40 phút).** Mọi câu ước ≤ 6 phút theo thứ tự đề: q13, q15, q4, q11, q8, q16, q6, q3, q12. Mỗi câu: `k config current-context`, đọc dòng \"Làm việc trên\", làm, tự kiểm từng tiêu chí, đánh dấu nếu còn nghi." },
      { id: "t5", text: "**Lượt 3 (~50 phút).** Câu dài: q2 (CSR + kubeconfig), q5 (egress), q7, q9 (HTTPRoute), q10 (Kustomize), q14 (headless + NodePort). Câu mạng kết thúc bằng `curl`/`wget` thật cả chiều được lẫn chiều bị chặn. 10 phút cuối: `ls -l /opt/m2/`, `cat` từng tệp đáp án." },
      { id: "t6", text: "**Tình huống hỏng.** Ở q1, thay vì sửa manifest, tạo namespace `kube-sytem`: scheduler giành được lease ở namespace sai và Pod `nightly` chạy. Chấm (`MOCK_WHY=1 ./labs/lab mock cka m2 score`): q1 chỉ còn điểm tên cờ — dòng lý do `đã tạo namespace kube-sytem để lách`, và `verify cka s53` dòng 3 đỏ. Xoá namespace đó, sửa manifest đúng cách, chấm lại tới khi q1 8/8." },
      { id: "t7", text: "Hết giờ: trên Mac `./labs/lab mock cka m2 score`, dán dòng `devprep-mock:v1:cka:m2:…` vào ô **Kết quả** của trang đề. So với Mock 1 theo từng domain trong app." },
      { id: "t8", text: "Chữa bài (ngoài 120 phút): mỗi câu chưa đủ điểm, mở lời giải, làm lại trên cluster, chấm lại tới khi đủ. Ghi vào `~/notes/runbook.md` mục `## s53` (≥ 3 dòng): domain yếu nhất qua hai đề, câu mất điểm vì đọc sai đề, kế hoạch ôn trước ngày thi. Cuối cùng `./labs/lab verify cka s53` phải 3/3." },
    ],
    hints: [
      "Pod Pending mà `describe` không có Event: hỏi \"ai lẽ ra phải ghi Event?\" — scheduler. `k -n kube-system logs kube-scheduler-cka-cp`, `k -n kube-system get lease`.",
      "Sửa static pod: sửa đúng tệp trong `/etc/kubernetes/manifests/`, đừng để bản sao `.bak` trong thư mục đó (kubelet đọc mọi tệp ở đó). Chờ ~20 giây cho kubelet thấy tệp đổi.",
      "Egress NetworkPolicy: `namespaceSelector` và `podSelector` trong **cùng một** phần tử `to` là phép AND; hai phần tử riêng là OR. Quên DNS (UDP/TCP 53 tới kube-dns) thì gọi theo tên chết, theo IP vẫn chạy.",
      "`kubectl set resources` không có `-c <container>` sửa mọi container của Pod.",
      "PVC mới không gắn được vào PV `Released`: `k get pv <pv> -o jsonpath='{.spec.claimRef}'` — gỡ `claimRef`, không xoá PV.",
      "`ctr` mặc định dùng namespace `default` của containerd; kubelet dùng `k8s.io`. Kiểm bằng `crictl images` — nó thấy đúng như kubelet.",
      "Kustomize: `k kustomize <overlay>` xem trước trước khi `apply -k`; ConfigMap từ generator mang hậu tố hash và tham chiếu trong Deployment tự đổi theo.",
      "Token bootstrap: `kubeadm token create --ttl 2h --description … --print-join-command` in sẵn cả lệnh join; `kubeadm token list` cột DESCRIPTION để tìm token cần xoá.",
    ],
    solution: `Lời giải từng câu nằm trên trang đề (\`#/practice/cka/mock/m2\`), mở ra sau khi bạn dán dòng kết quả; mỗi lời giải ghi thời gian mục tiêu, lệnh, vì sao và cách chấm từng phần. Đó cũng là đúng các bước của \`labs/cka/mocks/m2/files/solve.sh\` (cka-cp) và \`solve-node.sh\` (cka-w2) mà \`apply.sh\` của buổi chạy.

Output là của máy soạn bài (2026-11-25, Kubernetes 1.37.2, từ cuối s52, đồ của m1 còn nguyên). Ngay sau \`mock cka m2 start\`, chưa làm gì:

\`\`\`text
$ ./labs/lab mock cka m2 score
  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)
DOMAIN             ĐIỂM
troubleshooting    0/30
architecture       0/25
workloads          0/15
storage            0/10
networking         0/20
devprep-mock:v1:cka:m2:2026-11-25:troubleshooting=0/30,architecture=0/25,workloads=0/15,storage=0/10,networking=0/20
\`\`\`

Sau lời giải chuẩn (\`apply.sh\` của s53 chấm tối đa ba lần, dừng lỗi nếu chưa đủ 100):

\`\`\`text
$ MOCK_WHY=1 … (cuối apply.sh của s53)
  (chấm 16 câu, thường 30–60 giây; tối đa ~4 phút)
  q1    8/8
  q2    6/6
  q3    5/5
  q4    5/5
  q5    7/7
  q6    7/7
  q7    8/8
  q8    5/5
  q9    7/7
  q10   6/6
  q11   7/7
  q12   5/5
  q13   5/5
  q14   6/6
  q15   6/6
  q16   7/7
s53: điểm m2 sau lời giải chuẩn (lần chấm 1): 100/100

$ ./labs/lab mock cka m2 score
DOMAIN             ĐIỂM
troubleshooting    30/30
architecture       25/25
workloads          15/15
storage            10/10
networking         20/20
devprep-mock:v1:cka:m2:2026-11-25:troubleshooting=30/30,architecture=25/25,workloads=15/15,storage=10/10,networking=20/20
\`\`\`

Thời gian đo khi soạn: \`mock … m2 start\` 58 giây (từ cuối s52), 4 phút 07 giây khi phải chữa q12 + q14 của m1 bỏ dở (kubelet \`cka-w1\`, Corefile, tạo lại Pod shop); \`score\` 4,6 giây (apiserver tắt: 0,9 giây, vẫn đủ 16 dòng, chỉ phần chấm bằng tệp có điểm); \`apply.sh\` (dựng + lời giải + chấm) 1 phút 51 giây – 2 phút 48 giây → 100/100 ở lần chấm đầu. Một lượt "đúng tên, sai spec" trên cả 16 câu (mỗi câu một lối tắt: cờ kèm giá trị, binding cho user, hai lớp mặc định, policy mở cả namespace, revision của etcd đang chạy, \`set resources\` không \`-c\`, bỏ rule header, đổi image…) cho **70/100**: dưới ngưỡng 75% của buổi. Tổng thời gian mục tiêu 16 câu là 96 phút — còn ~24 phút cho đọc đề, kiểm lại và câu kẹt.`,
    exam: {
      timeTargetMin: 120,
      patterns: [
        "**Câu chặn cả đề**: đề thật không có (mỗi câu một cluster), nhưng một câu control plane trong đề thật vẫn chặn **chính nó**: sửa xong phải thấy thành phần làm việc (Pod mới được xếp lịch, lease mới), không chỉ thấy Pod Running.",
        "**Thứ tự trong một câu**: đề viết \"trước khi sửa\", \"không ghi storageClassName\", \"Pod phải nhận mặc định\" là đang chấm thứ tự — làm ngược thì phải xoá tạo lại, tốn gấp đôi.",
        "**Kiểm bằng request thật**: câu Service/Gateway/NetworkPolicy chấm bằng curl thật; `status` đẹp mà curl lỗi là 0 phần đó.",
      ],
    },
    tips: [
      "Đừng chạy lại `./labs/lab mock cka m2 start` giữa giờ: nó xoá cả 16 câu, mọi tệp trong `/opt/m2/` và đưa StorageClass mặc định về `local-path`.",
      "Câu q12 của m1 (kubelet `cka-w1`) hay q14 (Corefile) còn hỏng thì không cần sửa tay trước Mock 2: `mock … m2 start` đưa chúng về bản tốt của m1 (chỉ Corefile khi DNS đang hỏng), tạo lại Pod ngoài `m1-*` còn giữ nameserver sai, và không xoá gì của `m1-*`. `check cka s53` không đỏ vì riêng hai câu đó.",
      "Câu nào lỡ làm hỏng cluster (sửa nhầm `etcd.yaml`, xoá nhầm namespace `shop`): `./labs/lab restore cka s52` rồi làm lại đề — rẻ hơn gỡ tay trong giờ thi.",
      "Hai đề đều ≥ 75% và không domain nào dưới 60%: sẵn sàng đặt lịch. Domain nào dưới 60% ở cả hai đề: làm lại các buổi của chặng đó (bản đồ chặng ở trang chương trình) trước khi thi.",
    ],
    outcome: {
      md: "Lần làm trọn đề thứ hai, có điểm theo domain trong app để so với Mock 1. Trên Mac:\n\n```bash\n./labs/lab verify cka s53\n```\n\nBa dòng. **Đề đã dựng:** `/opt/m2/started` có. **Điểm ≥ 75%:** tổng của `mocks/m2/score.sh` (16 câu chấm từng phần theo sự thật trên cluster và mốc lúc dựng đề ở `/root/.lab/m2/`: mã trang, revision và member ID của etcd, uid của PV, hash CA, image ID — không theo chuỗi đoán được; chỉ nhìn đồ của m2, đồ m1 để lại không cho điểm); dòng này in câu nào chưa đủ. **Câu sự cố đã sửa và lõi khoẻ:** q1 đủ 8/8 (manifest kube-scheduler như bản kubeadm, Pod scheduler giữ lease, Pod `nightly` được xếp lịch, không lách bằng namespace) cộng ba node, control plane, shop trải hai worker. Trên đầu vào (chưa `start`, mô phỏng bằng cách tạm cất hai tệp `started`): **0/3** (đo); ngay sau `mock … start`: **1/3** trong 9 giây — chỉ dòng \"đã dựng\" xanh; lối tắt namespace `kube-sytem` ở q1: dòng 3 đỏ `q1 (kube-scheduler) 1/8`.",
      verifyOutput: "lab: kiểm s53\n  (chờ apiserver và Deployment của shop, nếu đang khởi động: tối đa ~14 phút)\n  ✓ Đề m2 đã dựng (/opt/m2/started)\n  ✓ Điểm m2 ≥ 75%: 100/100 (score.sh, 16 câu chấm từng phần)\n  ✓ Câu sự cố q1 đã sửa (kube-scheduler như bản tốt, giữ lease, Pod mới được xếp lịch); lõi khoẻ: ba node, control plane, shop\n  → 3/3 đạt",
      projectDelta: "Không thêm mảnh project (buổi mock). Cluster giữ trạng thái cuối s52 cộng đồ của đề m2; kết quả mock thứ hai lưu trong app theo domain, cạnh Mock 1.",
    },
    review: [
      { q: "Pod `kube-scheduler-cka-cp` Running và Ready, vậy mà không Pod mới nào được xếp lịch. Vì sao có thể như vậy, và bạn chứng minh scheduler đã thật sự làm việc lại bằng gì?", a: "Scheduler chạy leader election: chỉ bản giữ Lease `kube-system/kube-scheduler` mới xếp lịch; không giành được lease (namespace của lock gõ sai, không tồn tại) thì nó chờ mãi mà healthz/readyz vẫn ok. Bằng chứng làm việc là Lease có `holderIdentity` cka-cp và `renewTime` mới, Pod `Pending` có `nodeName` và Event `Scheduled` — không phải trạng thái Pod của scheduler." },
      { q: "Vì sao tạo namespace `kube-sytem` làm Pod chạy lại mà vẫn là lời giải sai?", a: "Nó che triệu chứng: scheduler giữ lease ở namespace lạ, manifest vẫn khác bản kubeadm; lần nâng cấp `kubeadm upgrade` hay ai xoá namespace rác đó là cluster lại ngừng xếp lịch. Sửa tận gốc là sửa cờ trong manifest; namespace lách còn làm hai bản scheduler (nếu sau này có HA) giành hai lease khác nhau và xếp lịch đôi." },
      { q: "Egress của fetcher: viết `- namespaceSelector: {...m2-q5-db}` và `- podSelector: {app: store}` thành hai phần tử `to` khác nhau thì chuyện gì xảy ra?", a: "Hai phần tử là OR: \"mọi Pod trong m2-q5-db\" hoặc \"Pod app=store trong chính m2-q5\". Pod `cache` ở m2-q5-db lọt qua. Phải gộp vào cùng một phần tử (AND). Và đừng quên một rule DNS tới kube-dns, không thì gọi theo tên chết." },
      { q: "PV `Retain` bị xoá PVC: dữ liệu ở đâu, PV ở trạng thái gì, và cách đúng để PVC mới dùng lại dữ liệu?", a: "Dữ liệu còn nguyên trên đĩa (hostPath/đĩa thật); PV chuyển `Released` và vẫn giữ `claimRef` (uid của PVC cũ), nên không PVC nào khác gắn được. Gỡ `claimRef` (`kubectl patch pv … --type json -p '[{\"op\":\"remove\",\"path\":\"/spec/claimRef\"}]'`) → `Available` → PVC mới (cùng lớp, cỡ ≤, `volumeName` nếu muốn chắc) Bound. Xoá PV tạo lại cũng được với hostPath nhưng mất metadata và dễ nhầm đường dẫn." },
      { q: "Mock 1 và Mock 2 đều có câu etcd. Một câu chụp snapshot, một câu khôi phục thử vào thư mục mới. Vì sao khôi phục thử là kỹ năng riêng?", a: "Bản sao lưu chưa từng khôi phục là bản sao lưu chưa được kiểm. `etcdutl snapshot restore … --data-dir <thư mục mới>` dựng data-dir mà không đụng etcd đang chạy; `snapshot status` trên `member/snap/db` cho cùng revision với tệp sao lưu là bằng chứng tệp dùng được. Chỉ đổi `--data-dir`/hostPath trong `etcd.yaml` khi thật sự muốn quay lại thời điểm đó." },
    ],
  },
];
