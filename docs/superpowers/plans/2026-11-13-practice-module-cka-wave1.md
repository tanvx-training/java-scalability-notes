# Module Thực hành + chương trình CKA, đợt 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Giao đợt 1 của chức năng thực hành: module **Thực hành** trong DevPrep (đủ màn hình), bộ lệnh `./lab` chạy Multipass, ứng dụng Spring Boot "shop", khung 53 buổi của chương trình CKA và nội dung đầy đủ 9 buổi đầu (chặng 0–1), để người dùng bắt đầu học được ngay.

**Architecture:** Ba khối độc lập nối nhau bằng id buổi. (1) Web: dữ liệu ES module trong `webapp/js/data/practice/`, logic thuần trong `webapp/js/lib/practice.js`, một view `webapp/js/views/practice.js` đăng ký như module toàn cục giống `planner`. (2) Lab: CLI bash `labs/lab` + thư viện `labs/lib/` không biết gì về CKA; mọi thứ riêng của CKA nằm trong `labs/cka/` (env, script từng buổi). (3) App "shop": Maven multi-module trong `labs/cka/app/`, build bằng Docker, nạp image thẳng vào containerd của node. `webapp/scripts/check-data.mjs` ép bất biến dữ liệu và đối chiếu dữ liệu buổi với thư mục script.

**Tech Stack:** JavaScript ES modules (không build, không dependency), Node 22 (`node --test`, `check-data.mjs`), bash 3.2 (macOS), Multipass 1.16, Docker, Ubuntu 24.04 arm64, kubeadm + containerd + Calico, Java + Spring Boot (build trong Docker).

**Spec:** [`docs/superpowers/specs/2026-11-13-practice-module-cka-design.md`](../specs/2026-11-13-practice-module-cka-design.md)

## Global Constraints

- Nhánh làm việc: `feat/practice-cka`, tạo từ `main`. Commit đầu tiên của nhánh là spec + plan này.
- **An toàn VM (spec A3):** máy người dùng có sẵn VM `cp1`, `w1`, `w2`. Mọi lời gọi `multipass` có tên instance phải đi qua hàm bao `mp` trong `labs/lib/multipass.sh`; hàm này từ chối mọi tên không bắt đầu bằng `LAB_PREFIX` của chương trình. Không task nào được gọi `multipass` trực tiếp ở chỗ khác.
- VM của CKA: `cka-cp` (2 vCPU, 3G, 20G), `cka-w1` và `cka-w2` (2 vCPU, 2G, 15G), image `24.04`.
- bash: mọi script trong `labs/` chạy được với `/bin/bash` 3.2 của macOS (không mảng kết hợp, không `mapfile`, không `${var,,}`). Script chạy bên trong VM thì không bị ràng buộc này.
- Web: không thêm dependency, không bước build; không sửa `webapp/js/views/labs.js`, `webapp/js/data/senior-java/schedule.js`, `webapp/js/views/planner.js`. Không đổi `NS` trong `store.js`.
- `labs/lib/` và `webapp/js/views/practice.js`, `webapp/js/lib/practice.js` **không chứa chuỗi `cka` hay `kubernetes`** (spec A5). Có lint cho điều này ở Task 3 và Task 7.
- Id là khoá lưu tiến độ và là tên thư mục script: buổi `s01`…`s53`, nhiệm vụ `t1`…, chặng `st0`…`st10`, đề mock `m1`…, kỹ năng có tiền tố theo mảng `k-` (kubernetes), `vim-`, `lx-` (linux), `net-`. Id buổi là định danh mờ: thứ tự lấy từ `stages[].sessions`.
- Id domain: `troubleshooting` (30), `architecture` (25), `networking` (20), `workloads` (15), `storage` (10).
- Khoá `localStorage` mới: `practice.done`, `practice.tasks`, `practice.notes`, `practice.mock` (hình dạng ở spec mục 5.7).
- Dòng kết quả mock: `devprep-mock:v1:<program>:<mock>:<YYYY-MM-DD>:<domain>=<got>/<max>,<domain>=<got>/<max>…` (không khoảng trắng).
- Mọi văn bản hiển thị bằng tiếng Việt, giữ thuật ngữ tiếng Anh của Kubernetes (Pod, Deployment, control plane, kubelet…).
- Không chép lại lý thuyết đã có trong app: buổi thực hành link tới `#/docs/<id>`, `#/roadmap/cka/<itemId>`, `#/commands`. Không sao chép nội dung từ repo `NotHarshhaa/DevOps-Projects`.
- Lệnh kiểm dữ liệu, chạy từ gốc repo, viết tắt **CHECK**: `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`.
- Lệnh test đơn vị, viết tắt **UNIT**: `node --test webapp/scripts/tests/`. Test lab, viết tắt **LABTEST**: `bash labs/tests/run.sh`.
- Commit message tiếng Việt kiểu `feat(practice): …`, kết thúc bằng `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.

### Sai khác có chủ ý so với spec

- **53 buổi** thay vì khoảng 51 (spec cho phép 48–54): chặng 2 có 7 buổi (tách DaemonSet/Job/CronJob), chặng 8 có 5 buổi (tách chứng chỉ + HA khỏi buổi sự cố).
- Thêm lệnh **`./lab begin <program> <session>`** = `check` + chạy `setup.sh` của buổi nếu có (đặt tệp bài tập, hoặc gây lỗi cho buổi sự cố). Trang chủ hiện `begin` thay cho `check` ở bước khởi động. `check` vẫn tồn tại và không sửa gì.
- Trạng thái đầu vào của một buổi mặc định được kiểm bằng `verify.sh` của buổi đứng trước; buổi nào có trạng thái đầu vào không bền qua khởi động lại VM thì có `check.sh` riêng.

## Review Focus

1. **Lệnh lab chạm vào VM không thuộc chương trình** (`cp1`, `w1`, `w2`, hoặc `LAB_PREFIX` rỗng): phải từ chối trước khi gọi `multipass`. Test ở Task 7.
2. **Dòng kết quả mock dán vào bị hỏng** (thiếu trường, sai chương trình, domain lạ, `got > max`, có khoảng trắng hoặc xuống dòng thừa ở hai đầu): cắt khoảng trắng hai đầu, còn lại từ chối kèm thông báo, không ghi gì vào lịch sử. Test ở Task 2.
3. **Tiến độ cũ hoặc nhập từ tệp chứa khoá của buổi không còn tồn tại, hoặc buổi khung bị đánh dấu xong**: bị bỏ qua; số đã xong không bao giờ vượt tổng; buổi khung không tính là xong. Test ở Task 2.
4. **URL trỏ tới chương trình hoặc buổi không tồn tại** (`#/practice/xyz`, `#/practice/cka/s99`, `#/practice/cka/mock/m9`): hiện trạng thái rỗng có link quay lại, không ném lỗi. Test hàm tra cứu ở Task 2, bấm thử ở Task 6.
5. **Chạy lab khi tiền điều kiện thiếu** (chưa cài `multipass`, VM đang dừng, buổi chưa có script, id buổi sai): thông báo một dòng nói rõ thiếu gì và lệnh cần chạy, thoát mã khác 0, không in stack của bash. Test ở Task 7 và Task 8.

---

## Bảng tham chiếu dùng chung

### Năng lực curriculum (`exam.competencies`)

Danh sách dưới đây là curriculum CKA theo hiểu biết của người viết plan; **Task 3 bước 1 phải đối chiếu với `github.com/cncf/curriculum` và sửa cho khớp bản hiện hành** trước khi viết dữ liệu.

| id | domain | Nội dung |
|---|---|---|
| `ar-rbac` | architecture | Manage role based access control (RBAC) |
| `ar-infra` | architecture | Prepare underlying infrastructure for installing a Kubernetes cluster |
| `ar-kubeadm` | architecture | Create and manage Kubernetes clusters using kubeadm |
| `ar-lifecycle` | architecture | Manage the lifecycle of Kubernetes clusters |
| `ar-ha` | architecture | Implement and configure a highly-available control plane |
| `ar-helm-kustomize` | architecture | Use Helm and Kustomize to install cluster components |
| `ar-ext` | architecture | Understand extension interfaces (CNI, CSI, CRI, etc.) |
| `ar-crd` | architecture | Understand CRDs, install and configure operators |
| `wl-deploy-rollout` | workloads | Understand application deployments and how to perform rolling update and rollbacks |
| `wl-config` | workloads | Use ConfigMaps and Secrets to configure applications |
| `wl-autoscale` | workloads | Configure workload autoscaling |
| `wl-selfheal` | workloads | Understand the primitives used to create robust, self-healing, application deployments |
| `wl-admission-sched` | workloads | Configure Pod admission and scheduling (limits, node affinity, etc.) |
| `nw-pod-conn` | networking | Understand connectivity between Pods |
| `nw-netpol` | networking | Define and enforce Network Policies |
| `nw-svc` | networking | Use ClusterIP, NodePort, LoadBalancer service types and endpoints |
| `nw-gateway` | networking | Use the Gateway API to manage Ingress traffic |
| `nw-ingress` | networking | Know how to use Ingress controllers and Ingress resources |
| `nw-dns` | networking | Understand and use CoreDNS |
| `st-sc-dynamic` | storage | Implement storage classes and dynamic volume provisioning |
| `st-volume-types` | storage | Configure volume types, access modes and reclaim policies |
| `st-pv-pvc` | storage | Manage persistent volumes and persistent volume claims |
| `ts-nodes` | troubleshooting | Troubleshoot clusters and nodes |
| `ts-components` | troubleshooting | Troubleshoot cluster components |
| `ts-monitor` | troubleshooting | Monitor cluster and application resource usage |
| `ts-logs` | troubleshooting | Manage and evaluate container output streams |
| `ts-net` | troubleshooting | Troubleshoot services and networking |

### 53 buổi

Cột "năng lực" phải cùng domain với buổi. Buổi `domain` rỗng thì `competencies` rỗng. `requires` mặc định là buổi ngay trước, trừ `s01`.

| id | Chặng | Tiêu đề | domain | năng lực | Mảnh project (`pieces`) |
|---|---|---|---|---|---|
| s01 | st0 | Multipass, ba VM và ssh giữa các node | — | — | `vms` |
| s02 | st0 | vim, tmux và bash tốc độ phòng thi | — | — | |
| s03 | st0 | Linux quản trị: systemd, journalctl, tiến trình, quyền, gói | — | — | |
| s04 | st0 | Linux network: ip, route, DNS, iptables, network namespace | — | — | |
| s05 | st0 | Container thuần: containerd, crictl và image shop | — | — | `images` |
| s06 | st1 | Chuẩn bị node: swap, kernel, containerd, kubeadm/kubelet/kubectl | architecture | ar-infra | |
| s07 | st1 | kubeadm init, cài CNI, join hai worker | architecture | ar-kubeadm | `cluster` |
| s08 | st1 | Giải phẫu cluster: static pod, PKI, kubeconfig, CRI/CNI/CSI | architecture | ar-ext | |
| s09 | st1 | Sự cố chặng 1: node NotReady | troubleshooting | ts-nodes | |
| s10 | st2 | Pod đầu tiên của shop: run, logs, exec, port-forward | workloads | wl-selfheal | |
| s11 | st2 | Deployment, ReplicaSet và Service tối thiểu cho ba service | workloads | wl-deploy-rollout | `deployments` |
| s12 | st2 | ConfigMap và Secret | workloads | wl-config | `config` |
| s13 | st2 | Probe, vòng đời Pod và graceful shutdown | workloads | wl-selfheal | `probes` |
| s14 | st2 | Rolling update và rollback từ v1 lên v2 | workloads | wl-deploy-rollout | |
| s15 | st2 | DaemonSet, Job và CronJob | workloads | wl-selfheal | |
| s16 | st2 | Sự cố chặng 2: Pod không chạy | troubleshooting | ts-logs | |
| s17 | st3 | Requests, limits, QoS và JVM trong container | workloads | wl-admission-sched | `resources` |
| s18 | st3 | Namespace, LimitRange và ResourceQuota | workloads | wl-admission-sched | |
| s19 | st3 | nodeSelector, affinity, taint, toleration, static pod | workloads | wl-admission-sched | |
| s20 | st3 | metrics-server, kubectl top và HPA | workloads | wl-autoscale | `hpa` |
| s21 | st3 | Sự cố chặng 3: Pod Pending và thiếu tài nguyên | troubleshooting | ts-monitor | |
| s22 | st4 | Volume, PersistentVolume và PersistentVolumeClaim | storage | st-pv-pvc, st-volume-types | |
| s23 | st4 | StorageClass, dynamic provisioning, access mode, reclaim policy | storage | st-sc-dynamic, st-volume-types | |
| s24 | st4 | StatefulSet cho PostgreSQL và nối shop vào database | storage | st-pv-pvc | `postgres` |
| s25 | st4 | Sự cố chặng 4: PVC Pending và dữ liệu biến mất | troubleshooting | ts-logs | |
| s26 | st5 | Mạng Pod tới Pod và CNI soi từ trên node | networking | nw-pod-conn | |
| s27 | st5 | Service ClusterIP, NodePort, LoadBalancer, Endpoints, kube-proxy | networking | nw-svc | `services` |
| s28 | st5 | CoreDNS | networking | nw-dns | |
| s29 | st5 | Ingress controller và Ingress | networking | nw-ingress | `ingress` |
| s30 | st5 | Gateway API | networking | nw-gateway | `gateway-api` |
| s31 | st5 | NetworkPolicy | networking | nw-netpol | `netpol` |
| s32 | st5 | Sự cố chặng 5: Service không tới được Pod | troubleshooting | ts-net | |
| s33 | st6 | PKI của cluster, openssl và CSR cho user mới | architecture | ar-rbac | |
| s34 | st6 | kubeconfig: cluster, user, context | architecture | ar-rbac | |
| s35 | st6 | RBAC và ServiceAccount | architecture | ar-rbac | `rbac` |
| s36 | st6 | Sự cố chặng 6: Forbidden và kubeconfig hỏng | troubleshooting | ts-components | |
| s37 | st7 | Helm: cài component và viết chart cho shop | architecture | ar-helm-kustomize | `helm` |
| s38 | st7 | Kustomize: base và overlay | architecture | ar-helm-kustomize | |
| s39 | st7 | CRD và operator | architecture | ar-crd | |
| s40 | st7 | Sự cố chặng 7: release hỏng | troubleshooting | ts-logs | |
| s41 | st8 | Bảo trì node: cordon, drain, PodDisruptionBudget | architecture | ar-lifecycle | |
| s42 | st8 | Nâng cấp cluster bằng kubeadm | architecture | ar-lifecycle | `upgraded` |
| s43 | st8 | Backup và restore etcd | architecture | ar-lifecycle | `etcd-restore` |
| s44 | st8 | Gia hạn chứng chỉ và control plane HA | architecture | ar-ha, ar-lifecycle | |
| s45 | st8 | Sự cố chặng 8: sau nâng cấp và sau restore | troubleshooting | ts-components | |
| s46 | st9 | Quy trình chẩn đoán theo tầng và sự cố tầng ứng dụng | troubleshooting | ts-logs | |
| s47 | st9 | Sự cố Service, DNS và NetworkPolicy | troubleshooting | ts-net | |
| s48 | st9 | Sự cố node, kubelet và container runtime | troubleshooting | ts-nodes | |
| s49 | st9 | Sự cố control plane: apiserver, scheduler, controller-manager | troubleshooting | ts-components | |
| s50 | st9 | Sự cố etcd, chứng chỉ và kubeconfig | troubleshooting | ts-components | |
| s51 | st9 | Tổng hợp bấm giờ: giám sát tài nguyên và sự cố nhiều tầng | troubleshooting | ts-monitor | |
| s52 | st10 | Mock 1 | — | — | |
| s53 | st10 | Mock 2 | — | — | |

Mảnh project (`project.pieces`, theo thứ tự hiển thị): `vms` Ba VM, `images` Image shop, `cluster` Cluster kubeadm 3 node, `deployments` Ba service Spring Boot, `config` ConfigMap và Secret, `probes` Probe và graceful shutdown, `resources` Requests và limits, `hpa` HPA, `postgres` PostgreSQL bền vững, `services` Service, `ingress` Ingress, `gateway-api` Gateway API, `netpol` NetworkPolicy, `rbac` RBAC dev và ops, `helm` Helm chart, `upgraded` Cluster đã nâng cấp, `etcd-restore` Đã khôi phục etcd.

Mốc snapshot (tệp `labs/cka/milestones`): `s05 st0-done`, `s09 st1-done`. Các mốc sau thuộc đợt sau.

---

### Task 1: Nhánh, spec và dọn dẹp

**Files:**
- Modify: `.gitignore`, `.dockerignore`
- Commit: `docs/superpowers/specs/2026-11-13-practice-module-cka-design.md`, plan này

- [ ] **Bước 1:** `git checkout -b feat/practice-cka`.
- [ ] **Bước 2:** Thêm vào `.gitignore` hai dòng `.superpowers/brainstorm/` và `labs/.state/`. Thêm `labs` vào `.dockerignore`.
- [ ] **Bước 3:** Kiểm: `git status --short` không còn liệt kê gì dưới `.superpowers/brainstorm/`; CHECK vẫn xanh như trước (61 bất biến).
- [ ] **Bước 4:** Commit `docs(spec): thiết kế module Thực hành và chương trình CKA, kế hoạch đợt 1`.

### Task 2: Logic thuần của module Thực hành

**Files:**
- Create: `webapp/js/lib/practice.js`
- Test: `webapp/scripts/tests/practice.test.mjs`, `webapp/scripts/tests/fixtures/program.mjs`
- Modify: `.github/workflows/deploy-pages.yml` (thêm bước `node --test webapp/scripts/tests/` vào job `check`, sau "Check data integrity")

**Interfaces:**
- Consumes: không có (hàm nhận `program` và trạng thái làm tham số; không import dữ liệu thật).
- Produces (tất cả export từ `lib/practice.js`):
  - `RESERVED_SEGMENTS: string[]` = `["skills", "project", "mock"]`
  - `sessionKey(programId, sessionId): string` → `"cka:s14"`; `taskKey(programId, sessionId, taskId): string`
  - `orderedSessions(program): Session[]` theo `stages[].sessions`
  - `findSession(program, sessionId): Session | null`; `findMock(program, mockId): Mock | null`
  - `isPublished(session): boolean`
  - `isDone(program, sessionId, done): boolean` — chỉ đúng khi buổi tồn tại, đã phát hành và có khoá trong `done`
  - `doneCount(program, done): number`
  - `nextSession(program, done): Session | null` — buổi đầu tiên theo thứ tự chưa xong (kể cả buổi khung)
  - `neighbors(program, sessionId): { prev: Session | null, next: Session | null }`
  - `missingRequires(program, sessionId, done): string[]`
  - `stageProgress(program, done): { stage, done, total }[]`
  - `domainCoverage(program, done): { domain, done, total }[]` — bỏ buổi `domain` rỗng, giữ thứ tự `exam.domains`
  - `weeksLeft(program, done, perWeek = 3): number` — `ceil(số buổi chưa xong / perWeek)`
  - `projectPieces(program, done): { piece, have }[]`
  - `skillIndex(program, skills): { skill, learnedIn: string | null, usedIn: string[] }[]`
  - `reviewFor(program, sessionId): { session: Session, review: { q, a }[] } | null` — buổi đứng trước và câu ôn của nó; `null` khi là buổi đầu hoặc buổi trước không có câu ôn
  - `formatMockLine(record): string`; `parseMockResult(line, program): { ok: true, record } | { ok: false, error: string }`
  - Bọc `store`: `practiceState(): { done, tasks, notes, mock }`, `setDone(programId, sessionId, on)`, `setTask(programId, sessionId, taskId, on)`, `setNote(programId, sessionId, text)`, `addMockResult(record)`

- [ ] **Bước 1: Viết fixture** `fixtures/program.mjs`: chương trình `tst` thuộc field `kubernetes`, 2 domain (`a` 60, `b` 40), 2 chặng, 4 buổi `x1` (published, domain rỗng), `x2` (published, `a`, requires `x1`), `x3` (published, `b`, requires `x2`), `x4` (skeleton, `a`); 2 mảnh project (`p1` since `x1`, `p2` since `x3`); 3 kỹ năng (một cái học ở `x2` dùng lại ở `x3`, một cái không buổi nào học); 1 đề mock `m1`.
- [ ] **Bước 2: Viết test thất bại** với các khẳng định:
  - `orderedSessions` trả `["x1","x2","x3","x4"]`.
  - `isDone(p, "x4", {"tst:x4": 1}) === false` (buổi khung); `isDone(p, "zz", {"tst:zz": 1}) === false`.
  - `doneCount(p, {"tst:x1":1, "tst:zz":1, "tst:x4":1, "other:x2":1}) === 1`.
  - `nextSession` với `{}` là `x1`; với `x1` xong là `x2`; với `x1..x3` xong là `x4` (buổi khung không bao giờ tính là xong, nên vẫn là buổi kế tiếp); với một bản sao fixture đã bỏ `x4` và `x1..x3` xong thì trả `null`.
  - `neighbors(p, "x1").prev === null`; `neighbors(p, "zz")` trả `{prev:null,next:null}`.
  - `missingRequires(p, "x3", {"tst:x1":1})` là `["x2"]`.
  - `domainCoverage` với `x2` xong: `[{domain a, done 1, total 2}, {domain b, done 0, total 1}]`.
  - `weeksLeft(p, {})` là `2` (4 buổi / 3).
  - `projectPieces` với `x1` xong: `p1.have === true`, `p2.have === false`.
  - `skillIndex`: kỹ năng thứ nhất `learnedIn "x2"`, `usedIn ["x3"]`; kỹ năng mồ côi `learnedIn null`.
  - `reviewFor(p, "x1") === null`; `reviewFor(p, "x2").session.id === "x1"`.
  - `findSession(p, "s99") === null`; `findMock(p, "m9") === null`.
  - `parseMockResult(formatMockLine(r), p)` trả lại đúng `r` với `total` = tổng `got` / tổng `max` tính theo phần trăm làm tròn.
  - `parseMockResult` từ chối, mỗi trường hợp `ok === false` và `error` khác rỗng: chuỗi rỗng; `"abc"`; sai phiên bản `v2`; chương trình khác (`cka` khi program là `tst`); mock không tồn tại; ngày `2026-13-40`; domain lạ; thiếu một domain; `got > max`; số âm; trùng domain.
  - `parseMockResult("  " + line + "\n", p).ok === true`.
- [ ] **Bước 3:** UNIT → FAIL vì chưa có module.
- [ ] **Bước 4: Viết `lib/practice.js`.** Hàm tính toán không đọc `store`; chỉ bốn hàm bọc ở cuối tệp mới gọi `store.get/set`. `setDone` gọi thêm `recordActivity()` của `lib/activity.js` khi bật.
- [ ] **Bước 5:** UNIT → PASS. Thêm bước CI. Commit `feat(practice): logic thuần của module Thực hành kèm test`.

### Task 3: Khung chương trình CKA và bất biến dữ liệu

**Files:**
- Create: `webapp/js/data/practice/index.js`, `webapp/js/data/practice/cka/program.js`, `skills.js`, `stage-00.js` … `stage-10.js`, `mocks.js`
- Modify: `webapp/scripts/check-data.mjs`
- Create: `labs/cka/sessions/ORDER`

**Interfaces:**
- Consumes: Task 2 (`orderedSessions`, `skillIndex`, `RESERVED_SEGMENTS`).
- Produces:
  - `data/practice/index.js`: `PROGRAMS: Program[]`, `getProgram(id): Program | null`, `fieldOfProgram(id): string | null`, `programsOfField(fieldId): Program[]`. Mỗi `Program` đã ráp sẵn `sessions: Session[]` (gộp từ các tệp chặng), `skills: Skill[]`, `mocks: Mock[]`.
  - Hình dạng `Program`, `Session`, `Skill`, `Mock` theo spec mục 6, cộng `session.status: "skeleton" | "published"` và `session.pieces: string[]` (id mảnh project buổi này hoàn thành; `project.pieces[].sinceSession` suy ra từ đây, không khai hai nơi).
  - `labs/cka/sessions/ORDER`: 53 dòng, mỗi dòng một id buổi theo đúng thứ tự.

- [ ] **Bước 1: Đối chiếu nguồn chính thức.** Mở `https://github.com/cncf/curriculum` (bản CKA mới nhất) và trang thông tin kỳ thi CKA của Linux Foundation. Sửa bảng năng lực và tỷ trọng domain trong dữ liệu cho khớp; ghi `exam.k8sVersion` = phiên bản minor của đề hiện hành (gọi là N). Nếu curriculum có năng lực không nằm trong bảng của plan, gắn nó vào buổi phù hợp nhất và ghi chú trong commit.
- [ ] **Bước 2: Thêm bất biến vào `check-data.mjs`** (dùng khung `check`/`expect` sẵn có), thêm `"practice-sessions:cka": 53`, `"practice-published:cka": 0` vào `EXPECTED.counts`, và trong bất biến "Số lượng bản ghi khớp bảng kỳ vọng" tính thêm `actual["practice-sessions:<id>"]` và `actual["practice-published:<id>"]` cho mỗi chương trình:
  - PR1: id chương trình không trùng; `field` tồn tại trong `FIELDS`; tổng `exam.domains[].weight` = 100.
  - PR2: trong một chương trình, id buổi / kỹ năng / chặng / mock không trùng; id buổi không thuộc `RESERVED_SEGMENTS`; mọi buổi thuộc đúng một `stages[].sessions` và `session.stage` khớp.
  - PR3: `requires`, `competencies`, `domain`, `pieces`, `skills[].skill`, `uses[]` trỏ tới thứ tồn tại; năng lực của buổi cùng domain với buổi; buổi `domain` rỗng thì `competencies` rỗng.
  - PR4: `requires` chỉ trỏ tới buổi đứng trước theo thứ tự (suy ra không vòng).
  - PR5: mỗi kỹ năng được học ở đúng một buổi; mọi buổi `uses` nó đứng sau buổi học; `kind` thuộc `command|yaml|procedure|concept|docs|path`, `area` thuộc `kubernetes|vim|linux|network`; `ref` (nếu có) trỏ tới lệnh/YAML/quy trình có thật trong `data/kubernetes/`.
  - PR6: mọi năng lực curriculum được ít nhất một buổi phủ; mọi mảnh project được đúng một buổi hoàn thành.
  - PR7: buổi khung có đủ `id, stage, title, durationMin (60–90), domain, competencies, requires, goals (≥1), skills (≥2), uses, stateIn, stateOut, status, pieces`.
  - PR8: buổi đã phát hành có thêm `mindset, refs (≥1 link bắt đầu bằng "#/"), tasks (≥3, id không trùng), hints (≥2), solution, exam.patterns (≥1 trừ buổi domain rỗng), exam.timeTargetMin, tips (≥2), outcome.md, outcome.verifyOutput, outcome.projectDelta, review (3–5 câu)`; mọi link `#/docs/<id>` trong `refs` tồn tại; mọi link `#/roadmap/cka/<itemId>` tồn tại.
  - PR9: tỷ lệ số buổi theo domain (trên các buổi có domain) lệch không quá 8 điểm phần trăm so với `exam.domains[].weight`.
  - PR10: mỗi đề mock: id câu không trùng, domain hợp lệ, tổng `weight` theo domain lệch không quá 5 điểm phần trăm so với tỷ trọng đề. (Đợt 1 `mocks` rỗng: bất biến chạy rỗng.)
  - PR11: `labs/<program>/sessions/ORDER` (bỏ dòng trống và dòng `#`) bằng đúng `orderedSessions(program).map(id)`; mỗi buổi đã phát hành có `labs/<program>/sessions/<id>/verify.sh` và `apply.sh`; mỗi thư mục con của `sessions/` là id một buổi đã phát hành; mỗi mock có `labs/<program>/mocks/<id>/setup.sh` và `score.sh`.
  - PR12: `webapp/js/lib/practice.js` và `webapp/js/views/practice.js` (khi tồn tại) không chứa chuỗi `cka` hay `kubernetes` (đọc tệp, so khớp không phân biệt hoa thường).
- [ ] **Bước 3:** CHECK → FAIL (chưa có dữ liệu).
- [ ] **Bước 4: Viết dữ liệu.** `program.js` (meta, `exam`, `env` với 3 VM và các lệnh, `project.summary`, `project.architectureMd` có sơ đồ mermaid gateway → catalog/order → PostgreSQL, 17 mảnh, 11 chặng với `title`, `goal`, `projectMilestone` lấy từ spec mục 7.4). 53 buổi khung theo bảng tham chiếu: mỗi buổi 2–4 `goals`, `stateIn`/`stateOut` một hai câu, 3–8 kỹ năng. `skills.js`: mỗi kỹ năng một bản ghi; lệnh/YAML/quy trình đã có trong `commands.js`, `commands-admin.js`, `snippets.js`, `playbooks.js` thì điền `ref`. Kỹ năng nền (vim, Linux, network) nằm ở chặng 0 và ở các buổi dùng tới lần đầu theo spec mục 7.3. `mocks.js` export mảng rỗng. Viết `ORDER`.
- [ ] **Bước 5:** CHECK → PASS (61 bất biến cũ + PR1–PR12). UNIT vẫn PASS.
- [ ] **Bước 6:** In thử bằng một dòng node: số kỹ năng theo `area` và theo `kind`; xác nhận cả bốn `area` đều có kỹ năng và mỗi `area` nền có ít nhất 8.
- [ ] **Bước 7:** Commit `feat(practice): khung 53 buổi chương trình CKA và 12 bất biến dữ liệu`.

### Task 4: View — đăng ký module, danh sách và trang chủ chương trình

**Files:**
- Create: `webapp/js/views/practice.js`, `webapp/js/lib/timer.js`
- Modify: `webapp/js/app.js` (import, `routes`, suy lĩnh vực từ chương trình trong `navigate()`), `webapp/js/data/fields.js` (`GLOBAL_MODULES`, mục nav), `webapp/js/views/dashboard.js` (thẻ buổi kế tiếp), `webapp/css/style.css`, `webapp/js/lib/store.js` (chỉ thêm chú thích 4 khoá mới)

**Interfaces:**
- Consumes: Task 2, Task 3.
- Produces:
  - `views/practice.js`: `render(root, params)`, `cleanup()`. Bộ điều phối theo `params`: `[]` → danh sách (một chương trình thì chuyển thẳng `#/practice/<id>`); `[p]` → trang chủ; `[p, "skills"]`, `[p, "project"]`, `[p, "mock"]`, `[p, "mock", m]`, `[p, sessionId]` → gọi các hàm render tương ứng (Task 5, 6 điền thân; ở task này trả trang "đang xây" tạm).
  - `lib/timer.js`: `createStopwatch({ limitSec }): { el, stop }`, `createCountdown({ totalSec, onEnd }): { el, start, stop }`.
  - Mục nav: `{ id: "practice", label: "Thực hành", icon: "🛠️", href: "#/practice", global: true }` trong nhóm "Kế hoạch", sau `planner`.

- [ ] **Bước 1:** Thêm `"practice"` vào `GLOBAL_MODULES`, thêm mục nav. Trong `navigate()`: `if (name === "practice" && params[0]) owner = fieldOfProgram(params[0]);`. CHECK → PASS (bất biến nav sẵn có tự bao mục global mới).
- [ ] **Bước 2:** Viết trang chủ theo spec mục 5.3 và mockup `.superpowers/brainstorm/46458-1794557064/content/practice-home-and-session.html` (Màn 1), dùng class sẵn có (`card`, `card-accent`, `badge`, `progress`, `chip`, `stepper`, `codeblock`) trước khi thêm class mới tiền tố `pr-`. Khối **Buổi hôm nay**: bước 1 hiện `program.env.commands.up` và lệnh `begin` cho buổi (có nút sao chép, dùng `codeNode`), kèm dòng `restore` về buổi trước; bước 2 hiện `reviewFor()` (mỗi câu là `<details>`) và ghi chú buổi trước nếu có; bước 3 là nút vào buổi. Nếu buổi kế tiếp là buổi khung: hiện "Buổi này chưa có nội dung" thay cho ba bước. Nếu đã xong hết: hiện trạng thái hoàn thành.
- [ ] **Bước 3:** Các khối còn lại: project (`projectPieces`), lộ trình chặng (`stageProgress`, mỗi chặng là `<details>` liệt kê buổi, buổi khung có badge "chưa có nội dung", buổi xong có dấu ✓), độ phủ đề thi (`domainCoverage`, nhãn kèm tỷ trọng), điểm mock gần nhất (ẩn khi chưa có).
- [ ] **Bước 4:** Chương trình không tồn tại → `emptyState` với link về `#/practice`.
- [ ] **Bước 5:** Thẻ trên bảng điều khiển: với mỗi chương trình của lĩnh vực hiện tại (`programsOfField`), một thẻ link "🛠️ Buổi thực hành kế tiếp: <tiêu đề>" + "Buổi n / tổng".
- [ ] **Bước 6: Kiểm trong trình duyệt** (`./webapp/scripts/dev.sh`, mở `http://localhost:8888/#/practice`): vào thẳng trang CKA; sidebar có mục Thực hành ở mọi lĩnh vực; đứng ở lĩnh vực Java mở `#/practice/cka` thì lĩnh vực chuyển sang Kubernetes; `#/practice/xyz` hiện trạng thái rỗng; cả theme sáng và tối; thu cửa sổ còn 380px không tràn ngang; console không có lỗi.
- [ ] **Bước 7:** CHECK, UNIT → PASS. Commit `feat(practice): module toàn cục Thực hành và trang chủ chương trình`.

### Task 5: View — trang một buổi

**Files:**
- Modify: `webapp/js/views/practice.js`, `webapp/css/style.css`

**Interfaces:**
- Consumes: Task 2 (`setDone`, `setTask`, `setNote`, `missingRequires`, `neighbors`), Task 4 (`createStopwatch`).
- Produces: hàm nội bộ `renderSession(root, program, session)`.

- [ ] **Bước 1:** Dựng 14 khối theo đúng thứ tự spec mục 5.4. Khối kỹ năng là bảng nhóm theo `kind` (nhãn: ⌨️ Lệnh, 📄 YAML, 🧭 Quy trình, 💡 Khái niệm, 🔖 Trang docs, 📁 File và đường dẫn), cột "Mức cần đạt" lấy từ `skills[].level`; dòng có `ref` là link (`#/commands` kèm anchor theo cách `lib/search.js` đang làm). Khối Nền tảng chỉ hiện khi `foundation` khác null. Gợi ý và Cách xử lý là `<details class="reveal">`. Markdown qua `mdInto`.
- [ ] **Bước 2:** Nhiệm vụ: checkbox gắn `setTask`; đếm "x / y bước". Ghi chú: `<textarea>` lưu khi `blur` và khi rời trang (`cleanup`). Nút hoàn thành: bật/tắt `setDone`; khi bật mà `missingRequires` khác rỗng thì vẫn cho phép nhưng `toast` nhắc buổi còn thiếu.
- [ ] **Bước 3:** Câu luyện kiểu đề thi: mỗi câu một `<details>` có `createStopwatch({ limitSec })` và lời giải ẩn. `cleanup()` dừng mọi đồng hồ.
- [ ] **Bước 4:** Buổi khung: chỉ hiện tiêu đề, badge, mục tiêu, kỹ năng, trạng thái vào/ra và thông báo "Nội dung buổi này sẽ phát hành ở đợt sau"; không có nút hoàn thành. Buổi không tồn tại: `emptyState` với link về trang chủ chương trình.
- [ ] **Bước 5:** Điều hướng trước/sau; `pushRecent` để buổi hiện ở "Tiếp tục" trên bảng điều khiển.
- [ ] **Bước 6: Kiểm trong trình duyệt** với một buổi khung (`#/practice/cka/s10`) và `#/practice/cka/s99`. Để kiểm buổi đã phát hành trước khi có nội dung thật (Task 10): sửa tạm `s01` thành `published` với nội dung giả đủ mọi trường, kiểm đủ 14 khối, tick nhiệm vụ, ghi chú, hoàn thành, tải lại trang vẫn giữ, rồi **hoàn tác sửa tạm** (`git checkout -- webapp/js/data/practice/`) và xác nhận `git status` sạch ở thư mục đó.
- [ ] **Bước 7:** CHECK → PASS. Commit `feat(practice): trang buổi thực hành`.

### Task 6: View — bản đồ kỹ năng, project, mock và tìm kiếm

**Files:**
- Modify: `webapp/js/views/practice.js`, `webapp/js/lib/search.js`, `webapp/css/style.css`, `webapp/scripts/tests/practice.test.mjs`

**Interfaces:**
- Consumes: Task 2 (`skillIndex`, `parseMockResult`, `addMockResult`, `findMock`), Task 4 (`createCountdown`).
- Produces: `renderSkills`, `renderProject`, `renderMockIndex`, `renderMock` (nội bộ); hai loại kết quả tìm kiếm mới `practice` ("Buổi thực hành") và `skill` ("Kỹ năng").

- [ ] **Bước 1: Bản đồ kỹ năng** theo spec mục 5.5: chip lọc theo `kind` và theo `area`; bảng cột Kỹ năng / Học ở / Dùng lại ở; không cột trạng thái, không số đếm thành thạo. Dòng tổng chỉ ghi "N kỹ năng".
- [ ] **Bước 2: Trang project:** `project.summary`, `architectureMd` (mermaid qua `mdInto`), bảng mảnh project với buổi hoàn thành, mốc từng chặng (`projectMilestone`).
- [ ] **Bước 3: Mock.** Danh sách: khi `mocks` rỗng hiện "Đề mock phát hành ở đợt cuối". Trang một đề: thông tin, lệnh `./lab mock <program> <mock> start`, nút bắt đầu `createCountdown`, danh sách câu (đánh dấu để quay lại, chỉ lưu trong bộ nhớ trang), ô dán dòng kết quả → `parseMockResult` → lỗi thì hiện `error` cạnh ô, đúng thì `addMockResult` và hiện bảng điểm theo domain, ngưỡng đỗ `exam.passPct`, mở khoá lời giải từng câu. Lịch sử các lần làm ở trang danh sách.
- [ ] **Bước 4: Test** thêm vào `practice.test.mjs` cho fixture có mock: dán dòng hợp lệ hai lần cùng ngày tạo hai bản ghi lịch sử (không khử trùng); `findMock` với id lạ trả `null`. UNIT → PASS.
- [ ] **Bước 5: Tìm kiếm:** trong `buildIndex()` thêm buổi (tiêu đề, mục tiêu, chặng) và kỹ năng (nhãn; `href` tới bản đồ kỹ năng), `field` = `program.field`. Thêm hai loại vào `TYPES`.
- [ ] **Bước 6: Kiểm trong trình duyệt:** lọc kỹ năng theo `vim`, `linux`, `network` đều có kết quả; `Ctrl/⌘K` gõ "kubeadm" ra buổi `s07`; `#/practice/cka/mock/m9` hiện trạng thái rỗng; xuất tiến độ ở Cài đặt, xoá, nhập lại → tiến độ thực hành còn nguyên.
- [ ] **Bước 7:** CHECK, UNIT → PASS. Commit `feat(practice): bản đồ kỹ năng, trang project, mock và tìm kiếm`.

### Task 7: Lab CLI — lõi, chặn tiền tố, vòng đời VM

**Files:**
- Create: `labs/lab`, `labs/lib/core.sh`, `labs/lib/multipass.sh`, `labs/cka/env.sh`
- Test: `labs/tests/run.sh`, `labs/tests/stubs/multipass`, `labs/tests/fixtures/tst/env.sh`, `labs/tests/fixtures/bad/env.sh`

**Interfaces:**
- Produces:
  - `labs/lab <command> <program> [args…]`. Biến môi trường `LAB_ROOT` (mặc định thư mục chứa `lab`) cho phép test trỏ sang fixtures. Cờ `--yes` bỏ hỏi xác nhận.
  - `env.sh` của chương trình khai: `LAB_PREFIX` (khớp `^[a-z0-9]+-$`), `LAB_VMS` (chuỗi tên cách nhau bằng dấu cách), `LAB_CP` (tên VM control plane), hàm `lab_vm_spec <name>` in `"<cpus> <mem> <disk>"`, `LAB_IMAGE` (mặc định `24.04`), `K8S_INSTALL_MINOR`, `K8S_TARGET_MINOR`.
  - `lib/core.sh`: `die <msg>` (in `lab: <msg>` ra stderr, thoát 1), `info`, `confirm <prompt>`, `load_program <name>` (kiểm thư mục và `env.sh`, kiểm `LAB_PREFIX`, kiểm mọi tên trong `LAB_VMS` bắt đầu bằng tiền tố), `require_cmd <name> <gợi ý cài>`.
  - `lib/multipass.sh`: `mp <subcommand> [args…]` (mọi đối số là tên instance, hoặc dạng `name.snapshot`, `name:path`, đều phải qua `guard_vm`), `guard_vm <name>`, `vm_state <name>`, `vm <name> <cmd…>` (= `mp exec <name> -- bash -lc "<cmd>"`), `vm_put <src> <name> <dest>`.
  - Lệnh ở task này: `up`, `down`, `status`, `destroy`, `help`.
- `labs/cka/env.sh`: giá trị theo Global Constraints; `K8S_TARGET_MINOR` = N của Task 3 bước 1, `K8S_INSTALL_MINOR` = N-1.

- [ ] **Bước 1: Viết stub và khung test.** `stubs/multipass` ghi mỗi lời gọi (một dòng) vào `$MP_LOG` và trả lời theo biến môi trường (`MP_LIST` cho `list --format csv`, `MP_FAIL` để giả lỗi). `run.sh` đặt `PATH` có stub đứng đầu, chạy từng ca, in `ok`/`FAIL`, thoát 1 nếu có ca hỏng.
- [ ] **Bước 2: Viết ca test thất bại:**
  - `lab up bad` (fixture có `LAB_VMS="cp1 bad-w1"`, `LAB_PREFIX="bad-"`) → mã khác 0, stderr nhắc `cp1`, `$MP_LOG` rỗng.
  - Fixture `LAB_PREFIX=""` → từ chối, `$MP_LOG` rỗng.
  - `mp delete cp1` gọi trực tiếp qua `lib/multipass.sh` với chương trình `tst` → từ chối, `$MP_LOG` rỗng; `mp restore w1.snap` → từ chối.
  - `lab up tst` khi `MP_LIST` rỗng → log có đúng một `launch` cho mỗi VM của `tst` với `--cpus/--memory/--disk` theo `lab_vm_spec`; khi VM đã tồn tại ở trạng thái `Stopped` → `start`, không `launch`.
  - `lab destroy tst` không `--yes` và stdin trả `n` → không có `delete` trong log; với `--yes` → `delete` đúng các VM của `tst` và không VM nào khác dù `MP_LIST` có `cp1,w1,w2`.
  - `lab status tst` khi `MP_LIST` có cả `cp1` → output không nhắc `cp1`.
  - `lab up nope` → "lab: không có chương trình 'nope'", mã 1. `lab` không tham số → in trợ giúp, mã 1.
  - Gỡ stub khỏi `PATH` và không có `multipass` → "lab: chưa cài multipass …", mã 1.
  - `grep -ril "cka\|kubernetes" labs/lib labs/lab` không ra tệp nào.
- [ ] **Bước 3:** LABTEST → FAIL.
- [ ] **Bước 4: Viết `lab`, `core.sh`, `multipass.sh`, `cka/env.sh`.** `up` chờ mọi VM `Running` rồi in bảng `status`. `destroy` liệt kê VM sẽ xoá trước khi hỏi.
- [ ] **Bước 5:** LABTEST → PASS, chạy bằng `/bin/bash labs/tests/run.sh` để chắc bash 3.2.
- [ ] **Bước 6: Chạy thật:** `./labs/lab up cka` rồi `multipass list` → có `cka-cp`, `cka-w1`, `cka-w2` Running và `cp1`, `w1`, `w2` vẫn Stopped, không đổi. `./labs/lab down cka`.
- [ ] **Bước 7:** Commit `feat(lab): CLI lab với chặn tiền tố VM và vòng đời VM`.

### Task 8: Lab CLI — lệnh theo buổi, checkpoint, mock

**Files:**
- Create: `labs/lib/session.sh`, `labs/lib/assert.sh`, `labs/lib/snapshot.sh`, `labs/cka/milestones`
- Modify: `labs/lab`, `labs/tests/run.sh`
- Test fixtures: `labs/tests/fixtures/tst/sessions/{ORDER,a1,a2,a3}/…`, `labs/tests/fixtures/tst/mocks/m1/…`, `labs/tests/fixtures/tst/milestones`

**Interfaces:**
- Consumes: Task 7.
- Produces:
  - Lệnh: `check <p> <s>`, `begin <p> <s>`, `verify <p> <s>`, `restore <p> <s>`, `break <p> <id>`, `mock <p> <m> start|score`, `selftest <p> [--from <s>]`, `snapshot <p> <name>`.
  - **Hợp đồng script buổi** (`labs/<p>/sessions/<id>/`): `verify.sh` (bắt buộc, không sửa cluster), `apply.sh` (bắt buộc, lời giải chuẩn, chạy lại được), `check.sh` (tuỳ chọn, thay cho `verify.sh` của buổi trước khi kiểm đầu vào), `setup.sh` (tuỳ chọn, chạy bởi `begin`), `files/` (tuỳ chọn). Script được `lab` chạy bằng `source` trong subshell, có sẵn `vm`, `vm_put`, `LAB_CP`, `LAB_VMS`, `SESSION_DIR` và các hàm assert.
  - `lib/assert.sh`: `expect_ok "<nhãn>" <cmd…>`, `expect_fail "<nhãn>" <cmd…>`, `expect_eq "<nhãn>" "<kỳ vọng>" <cmd…>`, `expect_match "<nhãn>" "<regex>" <cmd…>`; mỗi hàm in `  ✓ nhãn` hoặc `  ✗ nhãn (thực tế: …)`; `assert_summary` in `  → a/b đạt` và trả 0 khi đủ.
  - `sessions/ORDER` là nguồn thứ tự. `milestones`: mỗi dòng `<sessionId> <tên-snapshot>`.
  - Hợp đồng mock: `mocks/<id>/setup.sh`; `mocks/<id>/score.sh` in mỗi dòng `<questionId> <domain> <got> <max>`. `lab mock … score` gộp theo domain, in bảng và dòng `devprep-mock:v1:…` theo Global Constraints (ngày = hôm nay).
  - `restore`: tìm mốc gần nhất tại hoặc trước buổi có snapshot tồn tại trên mọi VM → dừng VM, `multipass restore` từng VM, bật lại, rồi chạy `apply.sh` các buổi sau mốc tới buổi đích, rồi `verify`. Không có mốc dùng được → hỏi xác nhận xoá và dựng lại VM, chạy `apply.sh` từ đầu. Luôn liệt kê VM bị tác động và hỏi xác nhận (trừ `--yes`).
  - `selftest`: VM sạch → với mỗi buổi trong `ORDER` có thư mục: `apply.sh` rồi `verify.sh`; dừng ở buổi đầu tiên hỏng; tạo snapshot khi đi qua một mốc.

- [ ] **Bước 1: Viết ca test thất bại** (fixture `tst` có `a1`, `a2`, `a3`; script fixture chỉ ghi tên mình vào `$TRACE` và trả mã theo biến môi trường):
  - `verify tst a2` chạy `a2/verify.sh`; mã thoát theo `assert_summary`.
  - `check tst a2` chạy `a1/verify.sh`; `check tst a3` chạy `a3/check.sh` (fixture `a3` có `check.sh`) và không chạy `a2/verify.sh`; `check tst a1` chỉ kiểm VM đang chạy.
  - `begin tst a2` = check rồi `a2/setup.sh`; check hỏng thì không chạy `setup.sh` và in gợi ý `lab restore tst a1`.
  - `restore tst a3 --yes` với mốc ở `a1` và stub báo có snapshot: log có `stop`, `restore <vm>.<snap>` cho từng VM, `start`; `$TRACE` là `a2/apply a3/apply a3/verify`. Không có snapshot: `$TRACE` là `a1/apply a2/apply a3/apply a3/verify`.
  - `verify tst zz` → "lab: không có buổi 'zz' trong chương trình 'tst'", mã 1. `verify tst a4` khi `a4` có trong `ORDER` nhưng không có thư mục → "lab: buổi 'a4' chưa có script", mã 1.
  - `verify` khi stub báo VM `Stopped` → "lab: VM … đang dừng, chạy: ./lab up tst", mã 1.
  - `mock tst m1 score` với `score.sh` fixture in 4 dòng thuộc 2 domain → dòng cuối stdout khớp `^devprep-mock:v1:tst:m1:[0-9]{4}-[0-9]{2}-[0-9]{2}:a=3/6,b=2/4$`.
  - Các hàm assert: `expect_eq` sai in `✗` kèm giá trị thực tế; `assert_summary` trả 1 khi có ít nhất một `✗`.
- [ ] **Bước 2:** LABTEST → FAIL.
- [ ] **Bước 3: Viết các lệnh.** Trước khi viết `snapshot.sh`, thử trên VM thật: `multipass stop cka-w2 && multipass snapshot cka-w2 --name probe && multipass restore cka-w2.probe --destructive && multipass delete --purge cka-w2.probe` (đi qua `mp`). Nếu snapshot không hoạt động như vậy trên 1.16.3, ghi lại hành vi thật trong chú thích đầu `snapshot.sh` và để `restore` luôn đi nhánh dựng lại từ đầu (spec mục 8.3 cho phép).
- [ ] **Bước 4:** LABTEST → PASS với `/bin/bash`.
- [ ] **Bước 5: Test liên thông với web:** thêm vào `practice.test.mjs` một ca dùng `child_process.execFileSync` chạy `labs/lab mock tst m1 score` (với `LAB_ROOT` là fixtures và stub trên `PATH`) rồi đưa dòng cuối vào `parseMockResult` với fixture program có cùng id domain → `ok === true`. UNIT → PASS.
- [ ] **Bước 6:** Commit `feat(lab): lệnh theo buổi, checkpoint, mock và selftest`.

### Task 9: Ứng dụng shop

**Files:**
- Create: `labs/cka/app/pom.xml`, `labs/cka/app/{gateway,catalog,order}/…`, `labs/cka/app/Dockerfile`, `labs/cka/app/README.md`
- Modify: `labs/lab` (lệnh `images`), `labs/lib/` (hàm nạp image), `labs/cka/env.sh` (danh sách image)

**Interfaces:**
- Produces:
  - Image: `shop/gateway`, `shop/catalog`, `shop/order`, mỗi cái hai tag `1.0` và `2.0`, kiến trúc `linux/arm64`. Cổng 8080.
  - Cấu hình bằng biến môi trường: `CATALOG_URL`, `ORDER_URL` (gateway, order); `DB_URL`, `DB_USER`, `DB_PASSWORD` (catalog, order; vắng `DB_URL` thì dùng H2 trong bộ nhớ có sẵn 3 sản phẩm mẫu); `APP_GREETING` (gateway).
  - HTTP: gateway `GET /api/info` → `{ service, version, hostname, greeting }`, `GET /api/products`, `POST /api/orders {productId, qty}`, `GET /api/orders`; catalog `GET /products`, `GET /products/{id}`; order `POST /orders`, `GET /orders`. Mỗi service: `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`; `GET /internal/burn?ms=<n>` (đốt CPU), `GET /internal/alloc?mb=<n>` (giữ bộ nhớ), `GET /internal/slow?ms=<n>`.
  - Khác biệt v2: `/api/info.version` là `"2.0"` và sản phẩm có thêm trường `discount`.
  - `server.shutdown=graceful`; JVM dùng `-XX:MaxRAMPercentage=75`.
  - `./lab images <program>`: build (nếu chưa có), `docker save`, `vm_put` vào từng VM, `sudo ctr -n k8s.io images import`; bỏ qua VM chưa có containerd kèm một dòng cảnh báo.
  - `env.sh`: `LAB_IMAGES="shop/gateway:1.0 …"` và `lab_build_images` (hàm gọi `docker build`).

- [ ] **Bước 1: Chọn phiên bản.** Dùng Java 25 và Spring Boot 4.x nếu `docker manifest inspect eclipse-temurin:25-jre` có `arm64`; không thì Java 21 và Spring Boot 3.x mới nhất. Ghi lựa chọn vào `app/README.md`.
- [ ] **Bước 2: Viết test thất bại** (Spring Boot test, chạy bằng stage `test` của Dockerfile: `docker build --target test labs/cka/app`):
  - catalog: `GET /products` trả 3 sản phẩm khi không có `DB_URL`; `GET /products/999` trả 404.
  - order: `POST /orders` với catalog giả (MockRestServiceServer hoặc tương đương) trả 201 và `GET /orders` thấy đơn; catalog trả 404 → order trả 422; catalog không kết nối được → 503.
  - gateway: `/api/info` có đủ 4 trường, `greeting` lấy từ `APP_GREETING`; `/api/products` chuyển tiếp catalog.
  - Mỗi service: `/actuator/health/readiness` trả `UP`.
- [ ] **Bước 3:** `docker build --target test labs/cka/app` → FAIL.
- [ ] **Bước 4: Viết ba service** (một Dockerfile nhiều stage, `ARG SERVICE`, `ARG APP_VERSION`; build Maven trong container nên máy không cần JDK).
- [ ] **Bước 5:** Stage `test` → PASS. Build 6 image; `docker run --rm -p 18080:8080 shop/catalog:1.0` rồi `curl localhost:18080/products` trả 3 sản phẩm, `curl localhost:18080/actuator/health` trả `UP`; `docker image inspect` báo `arm64`.
- [ ] **Bước 6:** Thêm lệnh `images` và ca LABTEST: với stub, `lab images tst` gọi `transfer` và `exec … ctr -n k8s.io images import` cho từng VM của `tst`. LABTEST → PASS.
- [ ] **Bước 7:** Commit `feat(lab): ứng dụng shop ba service Spring Boot và lệnh nạp image`.

### Task 10: Nội dung chặng 0 (s01–s05)

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-00.js`, `skills.js`, `webapp/scripts/check-data.mjs` (`practice-published:cka` → 5)
- Create: `labs/cka/sessions/s01` … `s05` (mỗi thư mục `apply.sh`, `verify.sh`, và `check.sh`/`setup.sh`/`files/` khi cần)

**Interfaces:**
- Consumes: hợp đồng script (Task 8), hình dạng buổi đã phát hành (PR8), image shop (Task 9).

Tiêu chí `verify.sh` của từng buổi (đây là định nghĩa "kết quả mong muốn"; nội dung buổi phải dẫn tới đúng các tiêu chí này):

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s01 | Tạo cặp khoá ssh trên `cka-cp`, phát khoá công khai sang hai worker, khai tên ba máy trong `/etc/hosts` của cả ba | Ba VM Running; từ mỗi VM `getent hosts` ra đúng IP hai máy còn lại; `ssh -o BatchMode=yes cka-w1 hostname` và `cka-w2` từ `cka-cp` chạy được |
| s02 | Viết `~/.vimrc` cho YAML, `~/.tmux.conf`, alias và biến trong `~/.bashrc`; sửa tệp YAML hỏng `~/drills/s02/broken.yaml` (do `setup.sh` đặt) bằng vim | `.vimrc` có `expandtab`, `tabstop=2`, `shiftwidth=2`; `.bashrc` có `alias k=kubectl`, `export do=`, `export now=`; `broken.yaml` parse được bằng `python3 -c 'import yaml…'` và sau khi chuẩn hoá bằng đúng `files/expected.yaml` |
| s03 | Tạo user `shop`, thư mục `/opt/shop` đúng chủ và quyền, unit systemd `shop-heartbeat.service` ghi log mỗi 10 giây, cài `jq` và `apt-mark hold` | `id shop`; `/opt/shop` thuộc `shop:shop` mode `750`; unit `enabled` và `active`; `journalctl -u shop-heartbeat` có ít nhất 2 dòng; `apt-mark showhold` có `jq` |
| s04 | Trên `cka-cp`: tạo hai network namespace nối bằng veth có IP `10.200.0.1/24` và `10.200.0.2/24`; đọc bảng route, tra DNS, soi cổng đang nghe, thêm và đọc một rule iptables; ghi đáp án vào `~/drills/s04/answers.env` | `ip netns` có `shop-a`, `shop-b`; ping giữa hai namespace được; chain `SHOP-DEMO` tồn tại và có đúng một rule; `answers.env` có `DEFAULT_GW`, `DNS_SERVER`, `SSH_PORT_PID_NAME` khớp giá trị script tự lấy trên máy |
| s05 | Trên `cka-cp`: thêm apt repo Kubernetes bản `K8S_INSTALL_MINOR`, cài `containerd` và `cri-tools`, cấu hình `/etc/crictl.yaml`, nạp image (`./lab images cka`), chạy `shop/catalog:1.0` bằng `ctr` với mạng host, soi namespace và cgroup của tiến trình | `containerd` active; `crictl info` chạy được; `ctr -n k8s.io images ls` có `shop/catalog:1.0`; `curl -s localhost:8080/actuator/health` trên `cka-cp` trả `UP` |

`s05/check.sh` và `s06/check.sh` chỉ kiểm thứ bền qua khởi động lại (netns của s04 và container của s05 không bền).

- [ ] **Bước 1:** Viết `apply.sh` + `verify.sh` của `s01`, chạy `./labs/lab verify cka s01` trên VM sạch → hỏng mọi tiêu chí; chạy `apply.sh` (qua `./labs/lab restore cka s01 --yes`) → `verify` đạt hết. Lặp lại cho `s02` … `s05` theo thứ tự.
- [ ] **Bước 2:** Viết nội dung đầy đủ 5 buổi trong `stage-00.js`, `status: "published"`. Yêu cầu riêng ngoài PR8:
  - Mỗi buổi có khối `foundation` thật sự dạy: lý thuyết ngắn + bài tập làm trên VM, không chỉ link. `refs` trỏ tới `#/docs/prerequisites` (kiểm id thật của `CKAD-Prerequisites.md` trong `data/kubernetes/docs.js`) và chương mạng của lĩnh vực `sysprog` ở buổi s04.
  - s02 có bộ bài tập vim tính giờ (xoá khối, thụt lề khối, thay thế hàng loạt, nhảy dòng lỗi, dán không vỡ thụt lề) và thao tác tmux chia pane; s05 liên hệ container với thứ Java dev đã biết (tiến trình JVM, cgroup và `MaxRAMPercentage`, link `#/docs/<id bài Java 07>`).
  - `exam.patterns` của chặng 0 ghi cách kỹ năng này xuất hiện gián tiếp trong đề (sửa manifest bằng vim, đọc `journalctl -u kubelet`, soi cổng 6443…).
  - `outcome.verifyOutput` chép từ output thật của `./labs/lab verify`.
- [ ] **Bước 3:** Sửa `EXPECTED.counts["practice-published:cka"]` thành 5. CHECK → PASS.
- [ ] **Bước 4:** `./labs/lab selftest cka` (tới hết s05) → xanh; snapshot `st0-done` được tạo (hoặc bị bỏ qua có thông báo, nếu Task 8 đã kết luận snapshot không dùng được).
- [ ] **Bước 5: Kiểm trong trình duyệt:** đi trọn buổi `s01` như người học: trang chủ → ba bước → trang buổi → tick nhiệm vụ → mở gợi ý, cách xử lý → ghi chú → hoàn thành → sang `s02` thấy câu ôn và ghi chú của `s01`.
- [ ] **Bước 6:** Commit `feat(practice): nội dung chặng 0 — môi trường và kỹ năng nền (5 buổi)`.

### Task 11: Nội dung chặng 1 (s06–s09)

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-01.js`, `skills.js`, `webapp/scripts/check-data.mjs` (`practice-published:cka` → 9)
- Create: `labs/cka/sessions/s06` … `s09`, `labs/cka/breaks/st1-node-notready/run.sh`

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s06 | Trên cả ba node: tắt swap (cả `fstab`), nạp và khai bền `overlay`, `br_netfilter`, ba sysctl mạng, containerd với `SystemdCgroup = true`, cài `kubeadm`, `kubelet`, `kubectl` bản `K8S_INSTALL_MINOR` và `apt-mark hold` | Mỗi node: `swapon --show` rỗng; hai module đã nạp và có trong `/etc/modules-load.d/`; ba sysctl bằng 1; containerd active và config có `SystemdCgroup = true`; ba gói đúng minor và đang hold |
| s07 | `kubeadm init` với pod CIDR, chép kubeconfig, cài Calico, `kubeadm join` hai worker (tự tạo lại token) | 3 node `Ready` đúng minor; Pod Calico Running trên cả ba node; `kubectl` chạy được với user `ubuntu` trên `cka-cp`; một Pod thử trên `cka-w1` ping được Pod thử trên `cka-w2` (script tự tạo và tự xoá trong namespace tạm) |
| s08 | Tìm và ghi vào `~/drills/s08/answers.env`: thư mục dữ liệu etcd, địa chỉ advertise của apiserver, pod CIDR, service CIDR, cgroup driver của kubelet, ngày hết hạn chứng chỉ apiserver; tạo static pod `web-static` trên `cka-w1`; bật completion cho `kubectl` và alias `k` | Từng giá trị trong `answers.env` khớp giá trị script tự đọc từ cluster; Pod `web-static-cka-w1` Running; `~/.bashrc` có completion và `complete -F __start_kubectl k` |
| s09 | `setup.sh` gây hai lỗi: `cka-w1` kubelet trỏ sai đường dẫn config qua `/etc/default/kubelet`; `cka-w2` kubelet bị `stop` và `disable`. Người học tự tìm và sửa trong 20 phút | 3 node `Ready`; kubelet `active` và `enabled` trên cả hai worker; Deployment thử 2 replica chạy được trên hai worker (namespace tạm, tự dọn) |

`s09/apply.sh` = chạy kịch bản gây lỗi rồi chạy cách sửa. `s09/setup.sh` gọi `lab_break st1-node-notready` và không in ra đã làm gì.

- [ ] **Bước 1:** Viết và chạy thật từng buổi theo thứ tự như Task 10 bước 1 (verify đỏ trước, apply, verify xanh). Với s09: sau `setup.sh`, `kubectl get nodes` phải thấy hai worker `NotReady` trong vòng 2 phút.
- [ ] **Bước 2:** Viết nội dung đầy đủ 4 buổi trong `stage-01.js`. Yêu cầu riêng ngoài PR8:
  - `refs` trỏ tới bài lộ trình CKA tương ứng (`#/roadmap/cka/cka-w1-1`, `cka-w1-2`… kiểm id thật), chương 2, 4 và 22 của CKA Study Guide (`#/docs/ckabook-02`, `ckabook-04`, `ckabook-22`, kiểm id thật), và trang kubernetes.io về cài kubeadm.
  - s06 có khối `foundation` về `systemctl`/`journalctl` nâng cao và module kernel; s09 có khối `foundation` về đọc log kubelet.
  - s08 liên hệ static pod và kubeconfig với thứ Java dev đã biết khi tự nhiên (manifest như tệp cấu hình được tiến trình giám sát nạp lại).
  - Mỗi buổi 1–2 câu luyện kiểu đề thi có `timeLimitMin` và lời giải.
  - s09: phần Cách xử lý trình bày quy trình chẩn đoán (node → `systemctl status kubelet` → `journalctl -u kubelet` → tệp cấu hình), không chỉ đưa lệnh sửa.
- [ ] **Bước 3:** `practice-published:cka` → 9. CHECK → PASS.
- [ ] **Bước 4:** `./labs/lab destroy cka --yes && ./labs/lab selftest cka` → xanh từ s01 tới s09 trên VM sạch; ghi tổng thời gian vào `labs/cka/README.md`. Sau đó `./labs/lab restore cka s07 --yes` → `verify cka s07` đạt.
- [ ] **Bước 5:** `multipass list` → `cp1`, `w1`, `w2` vẫn tồn tại và Stopped.
- [ ] **Bước 6:** Commit `feat(practice): nội dung chặng 1 — dựng cluster bằng kubeadm (4 buổi)`.

### Task 12: Tài liệu và nghiệm thu đợt 1

**Files:**
- Modify: `README.md`, `webapp/README.md`, `sources/kubernetes/certs/CKA-Study-Guide.md` (chỉ mục "Môi trường Lab": thêm một đoạn trỏ tới module Thực hành)
- Create: `labs/README.md`

- [ ] **Bước 1:** `labs/README.md`: yêu cầu máy, bảng lệnh, hợp đồng script buổi, cách thêm một chương trình mới (tạo `labs/<id>/env.sh`, `sessions/ORDER`, dữ liệu trong `webapp/js/data/practice/<id>/`, đăng ký trong `index.js`), lời cảnh báo về tiền tố VM.
- [ ] **Bước 2:** `webapp/README.md`: thêm hàng "🛠️ Thực hành" vào bảng tính năng, thêm `practice.*` vào phần lưu tiến độ, cập nhật số bất biến (61 → 73), cây thư mục (`data/practice/`, `lib/practice.js`, `lib/timer.js`, `views/practice.js`, `scripts/tests/`), và mục "Thêm buổi thực hành / chương trình thực hành". `README.md` gốc: thêm `labs/` vào cấu trúc repo và một dòng trong bảng DevPrep.
- [ ] **Bước 3:** `grep -n "61 bất biến\|57 bất biến" README.md webapp/README.md` → không còn kết quả.
- [ ] **Bước 4: Nghiệm thu:** CHECK, UNIT, LABTEST đều xanh; mở app đi lại danh sách kiểm ở spec mục 10 (trọn một buổi, xuất/nhập tiến độ, theme sáng/tối, màn hẹp); `docker compose up --build` vẫn build được và image không chứa `labs/`.
- [ ] **Bước 5:** Commit `docs(practice): README cho module Thực hành và bộ lệnh lab`.

---

## Các đợt sau (khuôn lặp, không thuộc plan này)

Mỗi đợt một hoặc hai chặng, theo đúng khuôn Task 10/11: viết bảng "người học làm / `verify.sh` kiểm" cho từng buổi → script đỏ rồi xanh trên VM thật → nội dung đầy đủ → tăng `practice-published:cka` → `selftest` từ mốc snapshot gần nhất → kiểm trong trình duyệt → commit. Đợt cuối viết 2 đề mock (`mocks.js` + `labs/cka/mocks/m1`, `m2`) và nội dung `s52`, `s53`.
