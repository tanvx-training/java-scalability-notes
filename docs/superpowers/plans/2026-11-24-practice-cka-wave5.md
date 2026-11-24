# Thực hành CKA — đợt 5 (chặng 9 Troubleshooting tổng hợp, chặng 10 Mock) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phát hành 8 buổi cuối `s46`–`s53` của chương trình `cka` (sáu buổi sự cố chặng 9 + hai đề mock `m1`, `m2` chặng 10, nội dung đầy đủ + script lab chạy thật trên 3 VM), nâng số buổi học được từ 45 lên 53/53.

**Architecture:** Cùng khuôn đợt 4: bảng "người học làm / `verify.sh` kiểm" → script đỏ rồi xanh trên VM thật → nội dung đầy đủ trong `stage-09.js`/`stage-10.js`/`mocks.js` → tăng `practice-published:cka` → `selftest`. Sáu buổi chặng 9 đều là buổi sự cố (`setup.sh` gọi `lab_break st9-…`, `check.sh` riêng, `apply.sh` = gây rồi sửa). Hai đề mock nằm ở `labs/cka/mocks/m1|m2/{setup.sh,score.sh,files/}` (lệnh `./labs/lab mock cka <đề> start|score` đã có trong `labs/lib/session.sh`); buổi `s52`/`s53` là trang mỏng `kind: "mock"` có `apply.sh` = dựng đề + lời giải chuẩn, `verify.sh` = chấm. Thêm một mốc snapshot `st9-done` (s51), là điểm xuất phát của hai đề mock.

**Tech Stack:** bash 3.2 (macOS) + Multipass 1.16.3, Kubernetes 1.37.2 kubeadm, Calico 3.33, containerd 2.2.1, etcd 3.7.0 (`etcdctl`/`etcdutl` ở `/usr/local/bin` từ s43), Helm v4.3.2, metrics-server (s20), ứng dụng `shop` (release Helm `shop` từ s37), python3 + PyYAML trên `cka-cp` cho facts, dữ liệu ES module của `webapp/`.

**Spec:** `docs/superpowers/specs/2026-11-13-practice-module-cka-design.md` (mục 5.4, 5.6, 6 — hình dạng `mocks.js`, 7.4 chặng 9–10, 7.5, 8.2 lệnh `mock`, 8.3, 8.4, 12 — buổi sự cố, buổi mock). Plan đợt 4 làm mẫu: `docs/superpowers/plans/2026-11-19-practice-cka-wave4.md`. Ghi chú lab: `labs/cka/README.md`. Khung 8 buổi (tiêu đề, goals, skills, uses, stateIn/stateOut) đã có ở `webapp/js/data/practice/cka/stage-09.js`, `stage-10.js`; view trang mock (`renderMockPage`) và parser dòng `devprep-mock:v1` đã có, không sửa.

## Global Constraints

- Nhánh `feat/practice-cka-wave5` từ `main`. Không push, không merge.
- **An toàn VM (spec A3):** VM `cp1`, `w1`, `w2` có sẵn trên máy không được bật, tắt, sửa, chụp, xoá, **không được nhắc tên trong bất kỳ lệnh nào**. Mọi lệnh vào VM đi qua `./labs/lab …` hoặc hàm `vm`/`mp` của `labs/lib/multipass.sh`. Không đụng container hay tiến trình OrbStack/Docker/Java của người dùng (cần máy yên thì nhờ người dùng tắt OrbStack). Không `./labs/lab destroy`, không `selftest` thiếu `--from`.
- **Cổng máy chủ:** trước khi bật VM lấy ba mẫu cách nhau 30 giây: tải 1 phút < 4 và 5 phút < 5; chờ tối đa 10 phút. **Cửa sổ khởi động:** sau `up`/`restore` tải trong VM tự nhiên 30–60 khoảng 10 phút; chỉ chấm khi `kubectl get --raw /readyz` = `ok` và tải VM < 4; đỏ trong cửa sổ đó không tính. **Luật dừng:** tải Mac > 10 kéo dài quá 10 phút, hoặc `multipass exec`/kubectl hết giờ lặp lại → commit `wip(practice): …` phần đã đo, `./labs/lab down cka` (chạy lần hai nếu `cka-w2` hết giờ QEMU), báo BLOCKED. Chỉ chụp snapshot khi `df -h ~` trống ≥ 10 GiB. Lệnh dài ghi log ra tệp trong scratchpad. Không nối `restore` và `selftest` bằng `;`: chỉ chạy bước sau khi bước trước trả 0. Kết thúc task: `./labs/lab down cka`.
- **Khoá dpkg:** mọi script gửi `apt`/`dpkg` vào VM chờ khoá bằng `labs/cka/sessions/s42/files/aptlock.sh` (unattended-upgrade đã làm hỏng s42 một lần).
- bash trong `labs/` chạy được với `/bin/bash` 3.2. `labs/lib/` không chứa chuỗi `cka` hay `kubernetes`. Không sửa `labs/lib/`, `labs/lab`, `webapp/js/views/`, `webapp/js/lib/`; nếu buộc phải sửa thì dừng và báo lại.
- Không sửa buổi đã phát hành `s01`–`s45`, trừ lỗi thật tìm thấy khi chạy và hai món nợ ở Task 1 bước 1; ghi rõ trong báo cáo, commit riêng `fix(practice): …`.
- **Id bất biến:** id buổi, nhiệm vụ, kỹ năng, chặng giữ nguyên. Được sửa `title`, `goals`, `stateIn`, `stateOut`, `durationMin`, `label` kỹ năng, `projectMilestone`, và **thêm** id đã có vào `uses`. Mọi kỹ năng trong `skills` của buổi phải được luyện thật trong buổi. Id đề mock `m1`, `m2` và id câu `q1`…`q16` là khoá lưu tiến độ: đặt một lần, không đổi.
- **Trạng thái chấm phải bền:** `verify.sh` của buổi N là `check` của buổi N+1 (trừ khi N+1 có `check.sh`) và phải đạt sau `./labs/lab down` + `up`. Thứ không bền chấm qua tệp trong `~/drills/<id>/` (hoặc `/opt/answers/` ở s51, `/opt/m1|m2/` ở mock).
- **Quy ước giữ nguyên từ đợt 2–4:** manifest người học ở `~/shop/` (chỉ manifest), chart ở `~/charts/shop`, bài nháp và đáp án ở `~/drills/<id>/`; buổi có câu trả lời có `setup.sh` tạo `~/drills/<id>` và xoá `answers.env` cũ; dữ kiện thu trong một lần gọi VM (`files/facts.sh`, python3, in `KHOÁ=giá-trị`, mỗi lệnh có timeout); vòng chờ giới hạn theo đồng hồ, kubectl có `--request-timeout`, lệnh lỗi là "chưa sẵn sàng"; ước lượng thời gian in ra đúng trường hợp chậm nhất; chờ sau khi VM khởi động lại dùng `labs/cka/sessions/s26/files/wait.sh`, không viết bản mới; khi etcd/apiserver có thể đang hỏng thì hỏi etcd trước có giới hạn như `s45/files/probe.sh` rồi mới chờ, không treo.
- **Buổi sự cố (spec 12):** trạng thái đầu vào = đầu ra buổi trước + `./labs/lab break`. `run.sh` không in ra đã làm gì, chạy lại được (lần sau đưa về bản tốt rồi gây lại đúng các lỗi đó, không thêm lỗi khác), cần trạng thái đầu vào thì kiểm trước và dừng nếu thiếu, **không bao giờ làm mất hay lùi dữ liệu** (etcd, PV `postgres`, `/var/lib/etcd-restore`). Bản tốt của tệp bị sửa lưu ở `/root/.lab/<break-id>/` trên node bị sửa. Mỗi buổi có `check.sh` riêng chỉ kiểm phần sự cố không phá; `begin cka <buổi>` chạy hai lần liền đi được; sau `begin` verify đỏ trong 3 phút. Lỗi của chặng 9 **khác các lỗi đã dùng ở `st1`–`st8`** (`breaks/*/run.sh`, chú thích đầu tệp).
- `verify.sh` không sửa trạng thái buổi học tạo ra (ngoại lệ namespace tạm, spec 8.4); `score.sh` của mock cũng vậy.
- Mỗi dòng `verify.sh` **đỏ trên trạng thái đầu vào** (đo thật, ghi báo cáo) và có ít nhất một phép thử "làm lỏng" cho thấy verify không bị qua mặt; mọi yêu cầu của nhiệm vụ có dòng chấm. Đáp án chấm theo sự thật đo trên cluster hoặc mốc do `run.sh` ghi, không theo một chuỗi đoán được.
- Mỗi buổi 60–90 phút (mock 120), đủ mọi khối spec 5.4 (buổi mock cũng phải đủ trường PR8 dù view chỉ hiện trang mỏng), có ít nhất một tình huống hỏng, `outcome.verifyOutput` chép từ output thật, `refs` có ít nhất một tài liệu trong app (kiểm id thật) và trang kubernetes.io. Phần Tư duy nối Java/Spring khi tự nhiên (stack trace và `Caused by` ở s46, timeout HikariCP so với DNS ở s47, JVM không lên vì `-Xmx` so với kubelet không lên vì cấu hình ở s48, phân tầng chẩn đoán như đọc log Spring theo tầng ở s49/s51).
- Văn bản tiếng Việt, xưng "bạn", giữ thuật ngữ tiếng Anh của Kubernetes.
- **Tài nguyên:** cuối chặng 8 phần trống đo được là `cka-cp` 1523 MB, `cka-w1` 809 MB, `cka-w2` 745 MB. Pod do break hay mock tạo dùng image đã có trên node khi có thể (`busybox:1.37`), mỗi Pod có requests/limits nhỏ (≤ 50m CPU, ≤ 64Mi trừ Pod ngốn CPU có chủ ý), đo `free -m` trước/sau mỗi break và mỗi đề, ghi README. Image mới ghim phiên bản, có arm64, ghi nguồn vào README.
- Lệnh: **CHECK** `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`; **UNIT** `node --test "webapp/scripts/tests/*.test.mjs"`; **LABTEST** `/bin/bash labs/tests/run.sh`.
- Commit tiếng Việt kiểu `feat(practice): …`, kết thúc bằng dòng attribution của phiên.

### Quyết định của plan (khác khung hiện có)

- **Id lỗi:** `st9-app` (s46), `st9-net` (s47), `st9-node` (s48), `st9-cp` (s49), `st9-etcd` (s50), `st9-multi` (s51). Mỗi buổi chặng 9 có `setup.sh` (xoá `answers.env`, `lab_break …`), `check.sh`, `verify.sh`, `apply.sh` (= `setup.sh` rồi `files/solve*.sh`).
- **Phần "lõi khoẻ" dùng chung, viết một lần ở s46:** `labs/cka/sessions/s46/files/core-facts.sh` (chạy trên `cka-cp`, in `CORE_NODES`, `CORE_CP`, `CORE_SHOP`, `W1_IP`) và `labs/cka/sessions/s46/files/mac.sh` (nạp trên Mac, định nghĩa `mac_get <ip> <đường dẫn>` như `s45/verify.sh`). `CORE_NODES`: ba node Ready, schedulable, kubelet v1.37.x. `CORE_CP`: bốn static pod control plane Running, etcd chạy từ `/var/lib/etcd-restore`, `/readyz`. `CORE_SHOP`: release `shop` `deployed`; `gateway`, `gateway-v1`, `catalog`, `order` Available; `gateway`, `catalog`, `order` mỗi service ≥ 2 Pod Ready trải cả `cka-w1` lẫn `cka-w2` (trạng thái của s41); `postgres-0` Ready; image/probe/env/Service của bốn Deployment khớp `helm get manifest shop` (drift do `kubectl patch` bị bắt). Mọi `verify.sh` của s46–s51 và hai `score.sh`/`setup.sh` mock gọi lại hai tệp này (`$SESSION_DIR/../s46/files/…`, mock: `$SESSION_DIR/../../sessions/s46/files/…`), không chép lại.
- **Sổ tay sự cố (mốc project của chặng 9):** `~/notes/runbook.md` trên `cka-cp`. s46 verify: có ≥ 4 heading `##` phủ bốn tầng (khớp không phân biệt hoa thường một từ của mỗi nhóm: `app|ứng dụng|pod`; `service|dns`; `node|kubelet`; `control plane|apiserver`), mỗi mục ≥ 3 dòng không rỗng. s47–s51 verify: có heading chứa id buổi (`s47`…) với ≥ 3 dòng không rỗng (triệu chứng, nguyên nhân, lệnh). `setup.sh` không xoá sổ tay.
- **s46 `st9-app` (ba lỗi tầng ứng dụng, đều qua `kubectl patch`/`set` lên đối tượng Helm quản lý, không đổi chart):** `catalog` nhận biến môi trường làm app chết lúc khởi động (CrashLoopBackOff; dòng nguyên nhân chỉ thấy ở `logs --previous`), `order` đổi image sang tag không tồn tại (rollout kẹt, Pod cũ vẫn phục vụ: lỗi ẩn), `gateway` liveness probe sai đường dẫn (restart lặp). Người học sửa bằng `helm upgrade shop ~/charts/shop --reuse-values` hay `helm rollback` hay `kubectl` — verify chấm trạng thái. Đáp án `~/drills/s46/answers.env`: `CATALOG_CAUSE` (một dòng log chứa chuỗi gây lỗi; `run.sh` ghi chuỗi mong đợi ở `/root/.lab/st9-app/`), `ORDER_REASON` (`ImagePullBackOff` hoặc `ErrImagePull`), `GATEWAY_PROBE` (`liveness`); cộng `~/drills/s46/not-ready.txt` (người học tạo bằng jsonpath/`--sort-by`, một dòng `<ns>/<pod>` mỗi Pod không Ready lúc sự cố) chứa đúng tên các Pod hỏng mà `run.sh` ghi lại sau khi gây lỗi (chấp nhận thừa Pod đã thay tên trong lúc sửa, không chấp nhận thiếu). Phần Tư duy dạy vì sao `--field-selector=status.phase!=Running` không bắt CrashLoopBackOff.
- **s47 `st9-net` (ba lỗi mạng, khác `st5-network`):** Corefile của CoreDNS sửa zone `cluster.local` thành một zone khác (Pod không phân giải tên trong cluster; tên ngoài vẫn được), kube-proxy trên `cka-w1` hỏng (ví dụ ConfigMap riêng hoặc cờ làm Pod kube-proxy của node đó crash: ClusterIP không tới được chỉ từ Pod trên `cka-w1`; implementer đo cách nào đọc được qua `k logs -n kube-system` mà không phá node khác), một NetworkPolicy mới `allow-monitoring` trong `shop` vô tình chặn egress của `order` tới `catalog` (policy egress chọn `app=order`). Đáp án: `DNS_ZONE_FOUND` (zone sai đọc được trong Corefile), `PROXY_NODE` (`cka-w1`), `BLOCKING_POLICY` (`allow-monitoring`), `ONE_TEST` (lệnh duy nhất tách DNS khỏi Service, verify chỉ kiểm có `nslookup|dig` và một ClusterIP/tên). Verify: Corefile và kube-proxy khớp bản tốt `run.sh` lưu; từ Pod tạm trên **mỗi** worker (namespace tạm) phân giải `catalog.shop.svc.cluster.local` và tới được ClusterIP của `catalog`; `order` gọi `catalog` được (`/api/orders` 200 từ Mac); NetworkPolicy của s31–s32 còn nguyên (đếm và so `spec` với bản lưu cuối s45), `allow-monitoring` không còn chặn (xoá hoặc sửa đều được); lõi khoẻ.
- **s48 `st9-node` (khác `st1-node-notready` là chỉ phá kubelet):** `cka-w1` — containerd không lên (cấu hình `/etc/containerd/config.toml` hỏng cú pháp, bản tốt lưu ở `/root/.lab/st9-node/`), kubelet vẫn chạy và báo lỗi runtime: node NotReady mà lỗi ở containerd. `cka-w2` — `containerRuntimeEndpoint` (hoặc `clientCAFile`) trong `/var/lib/kubelet/config.yaml` sai: kubelet crash lặp. Người học vào `cka-w1` bằng `kubectl debug node/cka-w1 -it --image=busybox:1.37` để đọc một dữ kiện (ví dụ `cgroupDriver` trong `/host/var/lib/kubelet/config.yaml`) ghi vào `NODE_DEBUG_CGROUP`; trường hợp debug node không dùng được khi node NotReady thì đổi sang đọc trên `cka-cp` — implementer đo và chọn, ghi lý do. Đáp án: `W1_COMPONENT=containerd`, `W2_FIELD` (khoá cấu hình sai), `NODE_DEBUG_CGROUP=systemd`. Node NotReady quá 300 giây làm Pod bị evict: verify đòi lại trạng thái trải hai worker của s41 (`CORE_SHOP`), `solve.sh` dùng `rollout restart` khi cần; `postgres-0` (PV local-path ghim `cka-w2`) phải Ready lại. Verify: `config.toml` và `config.yaml` khớp bản tốt; containerd, kubelet `active` và `enabled` trên ba node; lõi khoẻ; đáp án.
- **s49 `st9-cp` (khác `st8-ops` là phá etcd):** ba manifest trong `/etc/kubernetes/manifests/` bị sửa: `kube-apiserver.yaml` một cờ gõ sai làm container thoát ngay (đọc ở `crictl logs` hay `/var/log/pods/`), `kube-scheduler.yaml` trỏ `--kubeconfig` vào tệp không có (Pod mới Pending, không có event `Scheduled`), `kube-controller-manager.yaml` sai một cờ làm nó crash (Deployment scale lên mà không có Pod mới). `run.sh` lưu bản tốt và bản hỏng (sha256) ở `/root/.lab/st9-cp/`. Người học **sao lưu trước khi sửa** vào `~/drills/s49/backup/` (ngoài thư mục manifests: tips nói bẫy để bản sao trong `manifests/`); verify kiểm `~/drills/s49/backup/kube-apiserver.yaml` có sha256 bằng bản hỏng (chứng minh đã chép trước khi sửa). Đáp án: `APISERVER_BAD_FLAG`, `SCHEDULER_SYMPTOM` (`Pending`), `CM_SYMPTOM` (chuỗi mô tả: chấp nhận khi chứa `replica` hoặc `ReplicaSet`). Verify: ba manifest khớp bản tốt (so nội dung YAML đã nạp, không so byte, để thứ tự khoá khác vẫn xanh), bốn static pod Running, trong `manifests/` không có tệp thừa; một Deployment tạm trong namespace tạm được xếp lịch và đạt 2 replica trong 90 giây (chứng minh scheduler và controller-manager làm việc) rồi xoá namespace; lõi khoẻ.
- **s50 `st9-etcd`:** `kube-apiserver.yaml` đổi `--etcd-cafile` (hoặc `--etcd-certfile`/`--etcd-keyfile`) sang tệp của CA khác trong `pki/` (apiserver không nói chuyện được với etcd; etcd vẫn khoẻ và **không bị sửa**); `/home/ubuntu/ops.kubeconfig` nhúng một client cert `ops` đã hết hạn (ký bởi CA cluster với `notAfter` trong quá khứ — implementer chọn `openssl ca -startdate/-enddate` hay `python3` cryptography, đo trên VM). Người học: `etcdctl endpoint status -w table` (ghi `ETCD_LEADER_ID` hay `ETCD_VERSION` — verify so với giá trị thật), đọc `notAfter` trong kubeconfig, cấp cert mới cho `ops` qua CSR như s33 rồi nhúng lại. Đáp án: `ETCD_FLAG` (cờ bị sửa), `EXPIRED_KUBECONFIG` (`ops`), `ETCD_VERSION` hay `ETCD_LEADER_ID`. Verify: cờ etcd của apiserver khớp bản tốt; `/readyz`; `ops.kubeconfig` nhúng cert CN `ops` O `shop-ops` do CA cluster ký, còn hạn ≥ 1 giờ, không phải cert hết hạn đã gây, gọi API trả `Forbidden` có user `ops` cho `create` và đọc được node; `dev.kubeconfig` vẫn dùng được (như s34); kubeconfig admin dùng được; lõi khoẻ.
- **s51 `st9-multi` (sáu câu kiểu đề, 60 phút, đáp án ở `/opt/answers/`, thư mục chủ `ubuntu`):** `run.sh` tạo namespace `s51-batch` gồm một Pod ngốn CPU có chủ ý (`cruncher`, limits ~300m, luôn đứng đầu `top`), một Pod hai container có container phụ ghi log lỗi, và gây hai sự cố nhiều tầng nhỏ: (a) Deployment `report` trong `s51-batch` gọi `catalog.shop` thất bại vì hai chỗ cùng lúc (ví dụ Service `report-svc` sai `targetPort` và NetworkPolicy `default-deny` trong `s51-batch` chặn egress DNS), (b) `cka-w2` bị gắn taint `NoSchedule` lạ và một Deployment `s51-batch/indexer` Pending vì `nodeSelector` sai. Sáu câu: Q1 `/opt/answers/top-cpu.txt` = `<ns>/<pod>` Pod ngốn CPU nhất toàn cluster; Q2 `/opt/answers/node-metrics.json` = JSON thô `NodeMetrics` của `cka-w1` từ `kubectl get --raw`; Q3 `/opt/answers/events.txt` = `reason` của Event cảnh báo gần nhất của `indexer`; Q4 `/opt/answers/sidecar.log` = các dòng log của container phụ; Q5, Q6 sửa (a), (b). Verify: mỗi câu một dòng, chấm theo sự thật (Q1 đối chiếu tên Pod `run.sh` đã ghi; Q2 hình dạng JSON + tên node; Q3 so với reason thật lúc sự cố đã lưu; Q4 chứa đúng các dòng); (a) `report` nhận 200 từ `catalog`; (b) không còn taint lạ, `indexer` Running; cộng lõi khoẻ và etcd/dữ liệu như cuối s45 (gọi lại dòng `STATE` của `s43/files/facts.sh`). Q1 chấm theo tên Pod `run.sh` đã lưu, nên vẫn xanh khi `cruncher` đã bị xoá; `solve.sh` xoá `cruncher` ở cuối (tips dặn dọn Pod ngốn CPU trước mock) và `stateOut` của s51 ghi namespace `s51-batch` ở lại không có `cruncher`.
- **Mốc snapshot:** `milestones` thêm `s51 st9-done`. Trước khi chụp kiểm `df -h ~` ≥ 10 GiB, ghi README.
- **Hai đề mock (`labs/cka/mocks/m1`, `m2`):** mỗi đề 16 câu `q1`…`q16`, 120 phút, trọng số đúng `exam.domains` (troubleshooting 4 câu = 30, architecture 4 = 25, networking 3 = 20, workloads 3 = 15, storage 2 = 10; tổng 100, PR10 lệch 0). Câu phủ cả năng lực curriculum ít luyện ở chặng 1–9 (`ar-ha` dạng viết lệnh vào tệp, `ar-ext` CRI/CNI/CSI, Gateway API HTTPRoute, sidecar native `initContainers.restartPolicy: Always`, PriorityClass, StorageClass mặc định, reclaim policy). Mỗi câu làm trong namespace riêng `m1-qN`/`m2-qN` hay trên node/thành phần ghi ở `context`; không câu nào sửa namespace `shop`, release `shop`, dữ liệu etcd hay PV `postgres`. Câu sự cố cấp node/control plane (một mỗi đề, ví dụ kubelet `cka-w1` dừng ở m1, scheduler hỏng ở m2) lưu bản tốt ở `/root/.lab/m1|m2/`.
  - `setup.sh`: kiểm lõi khoẻ (dừng nếu không, báo `restore cka s51`); dọn lần làm trước của **cùng** đề (xoá namespace `mN-*`, `/opt/mN`, khôi phục tệp node từ bản tốt), rồi dựng đề, ghi `/opt/mN/started`. Chạy lại được. Không in lời giải.
  - `score.sh`: chỉ đọc, in đúng 16 dòng `<qN> <domain> <got> <max>` (max = weight; chấm từng phần theo tiêu chí con, `got` nguyên), chạy được cả khi một câu sự cố còn hỏng (apiserver chưa phục vụ thì các câu cần apiserver được 0, không treo, tối đa vài phút).
  - `files/solve.sh` (chỉ dùng trong `apply.sh`): lời giải chuẩn cho cả 16 câu.
  - `s52/apply.sh`: dựng đề m1 như `mock start` (nạp `setup.sh` với `SESSION_DIR` của đề), chạy `solve.sh`, chạy `score.sh` và **dừng lỗi nếu chưa đủ 100/100**. `s52/verify.sh`: dòng 1 đề m1 đã dựng (`/opt/m1/started`), dòng 2 điểm m1 ≥ 66% (tổng của `score.sh`), dòng 3 câu sự cố của đề đã sửa và lõi khoẻ. `s53` như vậy với m2, cộng `check.sh` riêng (lõi khoẻ, không đòi điểm m1: người trượt m1 vẫn làm được m2). `s52` không có `check.sh` (đầu vào = verify s51).
  - `mocks.js`: `{ id, title, durationMin: 120, questions: [{ id, domain, weight, context, text, solution }] }`; `text` viết như đề CKA (tiếng Việt, tên tài nguyên cụ thể, đường dẫn tệp đáp án), `solution` markdown có lệnh và vì sao. Buổi `s52`/`s53` sửa `stateIn`/`stateOut` cho khớp (s53 không đòi điểm m1) và đủ trường PR8 (`mindset` về chiến thuật phòng thi, `tasks` ≥ 3, `review`, `exam.timeTargetMin: 120`).
- **Nợ đợt 4** ở Task 1 bước 1 (commit `fix(practice): …` riêng, không chụp lại mốc cũ): (1) `s03`, `s06` (`sessions/s06/files/prepare-node.sh`) gọi `apt` không chờ khoá dpkg → dùng `s42/files/aptlock.sh`; (2) `s33/verify.sh` chấp nhận cert người học tự ký bằng `/etc/kubernetes/pki/ca.key` mà không qua CSR → thêm điều kiện cert trên đĩa trùng `status.certificate` của CSR `dev`/`ops` đã Approved. Chạy `verify cka s33` trên mốc có sẵn (`restore cka s33`) để chứng minh vẫn xanh với lời giải chuẩn, và đỏ với cert tự ký bằng `ca.key`. Gộp các helper trùng (curl, `pkg_row`, etcd) **không** làm ở đợt này: ghi lại vào README mục nợ.

## Review Focus

- `begin` chạy lại giữa buổi sự cố đang sửa dở (nhất là s48 khi node NotReady và s49/s50 khi apiserver không chạy): `run.sh` lần hai đưa về bản tốt rồi gây lại, không chồng lỗi, không treo quá thời gian in ra; `check.sh` không đòi thứ sự cố đã phá.
- VM khởi động lại giữa hai buổi và ngay sau `restore cka s46…s53` từ `st8-done`/`st9-done`: verify chờ có giới hạn, không đỏ giả; Pod bị evict trong s48 không làm các buổi sau đỏ vì mất trải hai worker.
- Người học sửa đúng mà khác đường: `helm rollback` hay `helm upgrade --reuse-values` hay `kubectl` ở s46; xoá hay sửa `allow-monitoring` ở s47; sửa YAML bằng vim với thứ tự khoá khác ở s49; cấp cert mới bằng CSR hay bằng `kubeadm kubeconfig user` ở s50 — verify chấm trạng thái, không chấm cách làm (nhưng s50 vẫn đòi cert do CA cluster ký và còn hạn).
- Qua mặt: chép bản tốt từ `/root/.lab/` (s49: backup không trùng bản hỏng → đỏ), xoá Pod hỏng thay vì sửa đối tượng cha (đỏ ở drift/Available), xoá taint bằng cách xoá node khỏi lịch, mock: tạo đối tượng đúng tên mà sai spec (được 0 ở tiêu chí con), ghi tệp đáp án đúng tên mà sai nội dung.
- Mock chấm khi cluster đang hỏng một phần (câu sự cố chưa sửa, apiserver đang khởi động lại) hay khi làm m2 lúc còn sót đồ của m1: `score.sh` không treo, không cộng điểm oan, `setup.sh` của m2 không xoá đồ của m1 ngoài phần đụng nhau đã ghi rõ.

---

### Task 1: Chặng 9 phần đầu — s46, s47 (và nợ đợt 4)

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-09.js`, `skills.js` (chỉ label nếu cần), `webapp/scripts/check-data.mjs` (`practice-published:cka` → 47); nợ: `labs/cka/sessions/s03/…`, `sessions/s06/files/prepare-node.sh`, `sessions/s33/verify.sh` (+ `files/facts.sh` nếu cần)
- Create: `labs/cka/sessions/s46/{setup,check,verify,apply}.sh`, `s46/files/{core-facts.sh,mac.sh,facts.sh,check-facts.sh,solve.sh}`, `labs/cka/breaks/st9-app/run.sh`; như vậy cho `s47`, `breaks/st9-net/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s45 (mốc `st8-done`); `s26/files/wait.sh`; `s43/files/facts.sh` (dòng `ETCD`, `STATE`); `s45/files/probe.sh`.
- Produces: `s46/files/core-facts.sh` (in `CORE_NODES`, `CORE_CP`, `CORE_SHOP`, `W1_IP`, mỗi khoá `đạt` hoặc lý do ≤ 170 ký tự), `s46/files/mac.sh` (`mac_get <ip> <đường dẫn>` → `đạt` hoặc lý do); `~/notes/runbook.md`; bản lưu NetworkPolicy cuối s45 mà s47 so sánh (`run.sh` của `st9-net` lưu ở `/root/.lab/st9-net/netpol.json` lần đầu chạy).

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s46 | Viết `~/notes/runbook.md` bốn tầng; `k get pod -A` với `-o jsonpath`/`custom-columns` và `--sort-by=.status.containerStatuses[0].restartCount`, `--field-selector` (thấy giới hạn), `k logs -l app=… --all-containers --prefix`, `logs --previous`, `get events -A --sort-by=.lastTimestamp`; ghi `not-ready.txt` và `answers.env`; sửa ba lỗi trong 20 phút. Tình huống hỏng: xoá Pod CrashLoop thay vì sửa Deployment → Pod mới hỏng y hệt | Sổ tay bốn tầng; `not-ready.txt` đủ Pod hỏng đã ghi; bốn đáp án; lõi khoẻ (gồm không drift so với `helm get manifest`); `/api/products`, `/api/orders` 200 từ Mac |
| s47 | Phép thử một lệnh tách DNS khỏi Service (`nslookup` tên rồi `wget` ClusterIP từ Pod `busybox:1.37`/netshoot trên từng worker), `k logs -n kube-system -l k8s-app=kube-dns`, Corefile, `k logs` kube-proxy theo node, `k get netpol -o yaml` và đọc egress; sửa trong 25 phút; mục `s47` trong sổ tay. Tình huống hỏng: restart CoreDNS trước khi đọc Corefile → vẫn hỏng | Như Quyết định của plan; mục `s47` trong sổ tay; lõi khoẻ |

- [ ] **Bước 1 (nợ đợt 4):** `./labs/lab up cka` khi qua cổng. `restore cka s33 --yes` → sửa `s33/verify.sh` → `verify cka s33` xanh với lời giải chuẩn; thử cert tự ký bằng `ca.key` (đặt vào chỗ cert dev rồi trả lại) → đỏ. Sửa `s03`, `s06` chờ khoá dpkg (đọc hai script, chèn `aptlock.sh` như `s45/apply.sh`); kiểm cú pháp bằng `/bin/bash -n` và LABTEST (không chạy lại s03/s06 trên VM: cần VM trống). Commit `fix(practice): cka — s33 verify đòi cert từ CSR, s03/s06 chờ khoá dpkg`.
- [ ] **Bước 2:** `./labs/lab restore cka s45 --yes` (từ `st8-done`). Viết `core-facts.sh`, `mac.sh`; chạy riêng trên trạng thái cuối s45: mọi khoá `đạt`; thử làm lỏng: `kubectl set image` một Deployment của shop → `CORE_SHOP` đỏ vì drift, trả lại → xanh.
- [ ] **Bước 3:** Từng buổi: viết `run.sh` → `begin` → đo triệu chứng đúng như thiết kế (ghi output) → viết `verify.sh` → chạy ngay sau `begin`, mọi dòng đỏ (ghi output) → viết `solve.sh`/`apply.sh` → xanh → `apply.sh` lần hai vẫn xanh → `begin` hai lần liền đi được. Phép thử qua mặt: s46 xoá Pod hỏng thay vì sửa (đỏ), `not-ready.txt` thiếu một Pod (đỏ); s47 xoá toàn bộ NetworkPolicy của shop để "hết chặn" (đỏ), CoreDNS chạy lại mà Corefile vẫn sai (đỏ).
- [ ] **Bước 4:** `down` + `up` → `verify cka s47` xanh.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi (mọi khối 5.4, `outcome.verifyOutput` chép thật). s46 `foundation` (linux) về đọc log: `grep -E`, `tail -n`, `--since`, stack trace Java và dòng `Caused by`; s47 tư duy "một phép thử tách hai giả thuyết", nối timeout HikariCP/`UnknownHostException`.
- [ ] **Bước 6:** `practice-published:cka` → 47; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s46–s47. `./labs/lab down cka`. Commit `feat(practice): cka chặng 9 — chẩn đoán theo tầng, sự cố ứng dụng và mạng (s46–s47)`.

### Task 2: Chặng 9 giữa — s48, s49

**Files:**
- Modify: `stage-09.js`, `check-data.mjs` (→ 49)
- Create: `labs/cka/sessions/s48`, `s49` (cùng bộ tệp như s46), `labs/cka/breaks/st9-node/run.sh`, `labs/cka/breaks/st9-cp/run.sh`

**Interfaces:**
- Consumes: `s46/files/core-facts.sh`, `mac.sh`; `s45/files/probe.sh` (s49 hỏi etcd/apiserver có giới hạn trước khi chờ).
- Produces: bản tốt ở `/root/.lab/st9-node/` (`cka-w1`, `cka-w2`) và `/root/.lab/st9-cp/` (`cka-cp`: ba manifest tốt, sha256 ba bản hỏng); `~/drills/s49/backup/`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s48 | `k get node`, `describe node` (Conditions, `KubeletNotReady` và thông điệp runtime), ssh node: `systemctl status containerd kubelet`, `journalctl -u containerd -u kubelet --since`, `systemctl cat kubelet`, `crictl info`, `crictl inspect`; `kubectl debug node/…`; đọc `MemoryPressure`/`DiskPressure`; sửa hai node trong 20 phút; `rollout restart` nếu mất trải; mục `s48` trong sổ tay. Tình huống hỏng: restart kubelet trên `cka-w1` mà không nhìn containerd → vẫn NotReady | Như Quyết định của plan; mục `s48`; lõi khoẻ; Mac 200 |
| s49 | Thấy kubectl hỏng (`connection refused`), `crictl ps -a`, `crictl logs`, `/var/log/pods/kube-system_kube-apiserver-*`, `ss -lntp` cổng 6443/10259/10257; sao lưu manifest ra `~/drills/s49/backup/` trước khi sửa; `:set list` thấy ký tự lạ; chờ kubelet nạp lại; nhận ra scheduler (Pod Pending không event) và controller-manager (scale không có Pod) từ triệu chứng; `/livez?verbose`; sửa trong 15 phút + 15 phút; mục `s49`. Tình huống hỏng: để bản sao `kube-apiserver.yaml.bak` trong `manifests/` | Như Quyết định của plan; mục `s49`; lõi khoẻ |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s47 --yes`.
- [ ] **Bước 2:** s48 đo trước khi viết: containerd hỏng thì kubelet báo gì và sau bao lâu node NotReady; `kubectl debug node` có chạy được trên node NotReady không (chọn dữ kiện `NODE_DEBUG_CGROUP` cho khớp); Pod nào bị evict sau 300 giây, `postgres-0` hồi lại bao lâu sau khi `cka-w2` Ready; RAM `cka-cp` khi Pod dồn về. s49 đo: mỗi cờ hỏng cho thông báo lỗi gì ở `crictl logs`, kubelet nạp lại manifest sau bao lâu.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 3. Phép thử qua mặt: s48 chỉ `systemctl start containerd` khi `config.toml` vẫn hỏng (đỏ vì không lên/khác bản tốt), `cordon` node hỏng rồi bỏ qua (đỏ); s49 backup chép từ bản tốt (đỏ), bản `.bak` để trong `manifests/` (đỏ), sửa apiserver mà chừa scheduler (đỏ ở dòng xếp lịch).
- [ ] **Bước 4:** `down` + `up` → `verify cka s49` xanh. `begin cka s49` khi apiserver đang hỏng từ lần trước: đi được, không treo.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi. s48 `foundation` (linux) `systemctl cat`/drop-in, `journalctl -u … -p err --since`; tư duy "node NotReady: kubelet là người báo tin, chưa chắc là thủ phạm", nối JVM không lên vì cờ sai. s49 tư duy "kubectl chết thì xuống một tầng: kubelet → crictl → log trên đĩa".
- [ ] **Bước 6:** `practice-published:cka` → 49; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s48–s49. `./labs/lab down cka`. Commit `feat(practice): cka chặng 9 — sự cố node và control plane (s48–s49)`.

### Task 3: Chặng 9 cuối — s50, s51 và mốc `st9-done`

**Files:**
- Modify: `stage-09.js`, `check-data.mjs` (→ 51), `labs/cka/milestones` (thêm `s51 st9-done`)
- Create: `labs/cka/sessions/s50`, `s51`, `labs/cka/breaks/st9-etcd/run.sh`, `labs/cka/breaks/st9-multi/run.sh`

**Interfaces:**
- Consumes: `s46/files/*`, `s45/files/probe.sh`, `s43/files/facts.sh` (`STATE`), CSR/cert của s33, kubeconfig của s34.
- Produces: `/opt/answers/` (chủ `ubuntu`) với năm tệp của s51; namespace `s51-batch`; mốc `st9-done` (đầu vào của hai đề mock).

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s50 | apiserver không lên: `crictl logs` thấy lỗi TLS tới etcd, so ba cờ `--etcd-*` với `pki/`, `etcdctl endpoint status/health -w table` (etcd vẫn khoẻ); `kubectl --kubeconfig ops.kubeconfig` báo `x509: certificate has expired`, tách cert khỏi kubeconfig (`yq`/`jsonpath` + `base64 -d` + `openssl x509 -noout -enddate`), cấp cert mới qua CSR, nhúng lại; sửa trong 20 phút; mục `s50`. Tình huống hỏng: chỉnh giờ hệ thống thay vì cấp cert mới | Như Quyết định của plan; mục `s50`; lõi khoẻ |
| s51 | Sáu câu trong 60 phút, câu nhanh trước (Q1–Q4), đánh dấu câu kẹt; `k top pod -A --sort-by=cpu`, `--containers`, `k get --raw /apis/metrics.k8s.io/v1beta1/nodes/cka-w1`, `k get events -w`/`--field-selector involvedObject.name=…`, `k logs -c`; sửa (a), (b); mục `s51` | Sáu dòng câu như Quyết định của plan; lõi khoẻ; `STATE` của s43; mục `s51` |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s49 --yes`.
- [ ] **Bước 2:** s50 đo: cách tạo cert hết hạn do CA cluster ký trên VM (công cụ có sẵn trên Ubuntu 24.04), apiserver báo gì với từng cờ `--etcd-*` sai; xác nhận etcd không bị chạm (revision/raft không lùi như `s45/files/facts.sh`). s51 đo: Pod `cruncher` đứng đầu `top` ổn định (≥ 5 lần đo cách 30 giây), RAM sau khi thêm `s51-batch`, reason Event của `indexer`.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 3. Phép thử qua mặt: s50 kubeconfig `ops` nhúng cert tự ký CA khác (đỏ), dùng lại cert hết hạn (đỏ), đổi `ops.kubeconfig` sang cert admin (đỏ vì CN); s51 `top-cpu.txt` chỉ tên Pod không namespace (đỏ), xoá NetworkPolicy của `s51-batch` mà không sửa `targetPort` (đỏ), xoá `indexer` thay vì sửa (đỏ).
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s50 tư duy "lỗi x509: đọc ba thứ — cert nào, CA nào, giờ nào", nối truststore Java/`PKIX path building failed`; s51 khối Trong đề thi về phân bổ 120 phút, tips ghi đáp án đúng đường dẫn/định dạng, dọn `cruncher` trước mock.
- [ ] **Bước 5:** `milestones` thêm `s51 st9-done`; `practice-published:cka` → 51; CHECK, UNIT, LABTEST xanh. `down` + `up` → `verify cka s51` xanh. Thử chụp `st9-done` một lần (`df -h ~` ≥ 10 GiB).
- [ ] **Bước 6:** Kiểm trình duyệt s50–s51 và trang project (mốc `st9`). `./labs/lab down cka`. Commit `feat(practice): cka chặng 9 — etcd, chứng chỉ và tổng hợp bấm giờ (s50–s51)`.

### Task 4: Mock 1 — đề `m1`, buổi s52

**Files:**
- Modify: `webapp/js/data/practice/cka/mocks.js` (đề `m1`), `stage-10.js` (s52 đủ nội dung, `status: "published"`), `check-data.mjs` (→ 52)
- Create: `labs/cka/mocks/m1/{setup.sh,score.sh}`, `labs/cka/mocks/m1/files/{stage.sh,facts.sh,solve.sh,…}`, `labs/cka/sessions/s52/{apply,verify}.sh`

**Interfaces:**
- Consumes: mốc `st9-done`; `s46/files/core-facts.sh`, `mac.sh`; `cmd_mock` của `labs/lib/session.sh` (định dạng dòng `<câu> <domain> <got> <max>`).
- Produces: `/opt/m1/` (`started`, tệp đáp án của các câu ghi tệp), namespace `m1-q*`, bản tốt `/root/.lab/m1/`; dòng `devprep-mock:v1:cka:m1:<ngày>:…` dán được vào app; đề `m1` trong `mocks.js` có 16 câu.

| Phần | Nội dung | Kiểm |
|---|---|---|
| Đề | 16 câu theo Quyết định của plan; mỗi câu ghi `context` (node/namespace), thời gian mục tiêu ẩn trong `solution`; ít nhất: etcd snapshot ra `/opt/m1/etcd.db`, RBAC SA + Role, Helm install chart có sẵn với values, CRD/operator đọc ra tệp, HPA, rollout/rollback, sidecar native, PV/PVC + StorageClass, NetworkPolicy, Service + Gateway API HTTPRoute (dùng Gateway có sẵn của s30), CoreDNS, sửa kubelet `cka-w1`, gom log/metrics ra tệp | PR10 (trọng số lệch 0), PR11 (`setup.sh`, `score.sh` có), câu trả lời trong `solution` chạy được (là `solve.sh`) |
| `score.sh` | 16 dòng, chấm từng phần | Ngay sau `mock cka m1 start`: tổng ≤ 10 (đo, ghi; câu nào có điểm khi chưa làm thì sửa); sau `solve.sh`: 100/100; mỗi câu có ít nhất một phép thử "đúng tên sai spec" được điểm thấp hơn max |
| `s52` | `apply.sh`, `verify.sh` như Quyết định của plan | `verify cka s52` đỏ dòng điểm ngay sau `start`, xanh sau `apply.sh`; bền qua `down` + `up` |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s51 --yes` (từ `st9-done`).
- [ ] **Bước 2:** Viết đề trong `mocks.js` trước (câu, trọng số, `context`), chạy CHECK cho PR10. Đo RAM ba node trước khi dựng.
- [ ] **Bước 3:** Viết `files/stage.sh`, `setup.sh`; `./labs/lab mock cka m1 start` hai lần liền đi được; `free -m` sau khi dựng (ghi README).
- [ ] **Bước 4:** Viết `score.sh`; `./labs/lab mock cka m1 score` ngay sau start: in bảng và dòng `devprep-mock:v1:…`, tổng ≤ 10. Dán dòng đó vào trang mock trong trình duyệt: app nhận và lưu.
- [ ] **Bước 5:** Viết `solve.sh` (khớp `solution` của từng câu), `s52/apply.sh`, `s52/verify.sh`; `apply.sh` → 100/100, `verify cka s52` xanh; `apply.sh` lần hai vẫn 100/100. Phép thử: câu sự cố còn hỏng thì `score.sh` vẫn in đủ 16 dòng trong thời gian in ra; đối tượng đúng tên sai spec được điểm một phần.
- [ ] **Bước 6:** `down` + `up` → `verify cka s52` xanh.
- [ ] **Bước 7:** Nội dung s52 (trang mỏng nhưng đủ trường PR8: tư duy chiến thuật phòng thi, ba lượt đọc đề, `kubectl config use-context` mỗi câu); `practice-published:cka` → 52; CHECK, UNIT, LABTEST xanh; trình duyệt: trang `#/practice/cka/mock/m1` đủ 16 câu, đồng hồ, dán kết quả hiện lời giải, theme sáng/tối, màn 380px. `./labs/lab down cka`. Commit `feat(practice): cka chặng 10 — đề mock 1 (s52)`.

### Task 5: Mock 2 — đề `m2`, buổi s53

**Files:**
- Modify: `mocks.js` (đề `m2`), `stage-10.js` (s53), `check-data.mjs` (→ 53)
- Create: `labs/cka/mocks/m2/…` (như m1), `labs/cka/sessions/s53/{check,apply,verify}.sh`

**Interfaces:**
- Consumes: như Task 4; trạng thái cuối s52 (đồ của m1 còn đó).
- Produces: đề `m2` 16 câu; `/opt/m2/`; namespace `m2-q*`; `/root/.lab/m2/`.

Đề m2 **không lặp** câu của m1 (cùng năng lực thì khác dạng: m1 snapshot etcd thì m2 đọc `etcdctl member list`/endpoint ra tệp hay khôi phục vào thư mục tạm không đụng etcd đang chạy; m1 kubelet thì m2 scheduler/`kube-proxy`), khó hơn một chút (mục tiêu ≥ 75%). `s53/check.sh` = lõi khoẻ + etcd/dữ liệu như cuối s45, không đòi điểm m1.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s52 --yes` (từ `st9-done`, áp s52).
- [ ] **Bước 2–6:** Như Task 4 bước 2–6 cho m2. Thêm: `mock cka m2 start` trên cluster còn đồ của m1 (chưa dọn) đi được và không xoá `m1-*`; `mock cka m2 score` không tính điểm từ đồ của m1.
- [ ] **Bước 7:** Nội dung s53; `practice-published:cka` → 53; CHECK, UNIT, LABTEST xanh; trình duyệt trang m2 và lịch sử hai lần làm. `./labs/lab down cka`. Commit `feat(practice): cka chặng 10 — đề mock 2 (s53)`.

### Task 6: Nghiệm thu đợt 5 và tài liệu

**Files:**
- Modify: `labs/cka/README.md` (mốc `st9-done` và nguồn gốc, bảng `setup.sh`/`check.sh` thêm s46–s53, lỗi có chủ ý của sáu break, mục "Đề mock" (cấu trúc, tiêu chí chấm, thời gian dựng/chấm), thời gian selftest, số đo bộ nhớ cuối chặng 9 và sau mỗi đề, dung lượng đĩa, mục nợ còn lại), `webapp/README.md` và `README.md` nếu có con số buổi đã phát hành

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s45 --yes` (từ `st8-done`); chỉ khi trả 0 và 5/5 mới `./labs/lab selftest cka --from s46 --yes`: s46 → s53 xanh, chụp lại `st9-done`. Không `destroy`. Ghi tổng thời gian và số tiêu chí từng buổi vào README.
- [ ] **Bước 2:** `restore cka s48 --yes` (từ `st8-done`, áp s46…s48) → xanh; `restore cka s53 --yes` (từ `st9-done`, áp s52, s53) → xanh.
- [ ] **Bước 3:** `free -m` ba VM ở cuối s53 sau 5 phút nghỉ; `journalctl -k | grep -i oom` lần boot hiện tại rỗng; `df -h ~` trên Mac; ghi README.
- [ ] **Bước 4:** `multipass list`: ba VM của người dùng còn nguyên và Stopped (đọc output, không gọi lệnh nào khác với tên chúng).
- [ ] **Bước 5:** Trình duyệt: trang chủ `cka` báo 53/53, mọi thanh độ phủ domain đầy khi đánh dấu đủ; đi trọn s47 như người học (ba bước, tick, gợi ý, ghi chú, hoàn thành, sang s48 thấy câu ôn); trang mock m1: bắt đầu đồng hồ, dán dòng kết quả, lịch sử, điểm mock gần nhất ở trang chủ; hai theme, màn hẹp 380px; trang `ssia` không đổi.
- [ ] **Bước 6:** CHECK, UNIT, LABTEST xanh. `./labs/lab down cka`. Commit `docs(practice): cka đợt 5 — README, mốc st9-done, đề mock, thời gian selftest`.

---

## Sau đợt 5

Chương trình `cka` đủ 53/53 buổi. Nợ còn lại ghi ở README (gộp helper trùng của verify, `st0-done` chưa chụp lại với `tcp_mtu_probing`).
