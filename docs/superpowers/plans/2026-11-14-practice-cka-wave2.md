# Thực hành CKA — đợt 2 (chặng 2 Workload, chặng 3 Scheduling và tài nguyên) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phát hành 12 buổi `s10`–`s21` của chương trình `cka` (nội dung đầy đủ + script lab chạy thật trên 3 VM), nâng số buổi học được từ 9 lên 21.

**Architecture:** Không thêm hạ tầng. Mỗi buổi theo đúng khuôn Task 10/11 của đợt 1: bảng "người học làm / `verify.sh` kiểm" → script đỏ rồi xanh trên VM thật → nội dung đầy đủ trong `stage-0N.js` → tăng `practice-published:cka` → `selftest`. Hai buổi sự cố dùng `labs/cka/breaks/<id>/run.sh`. Thêm hai mốc snapshot `st2-done`, `st3-done`.

**Tech Stack:** bash 3.2 (macOS) + Multipass 1.16.3, Kubernetes 1.36 kubeadm, Calico 3.33, ứng dụng `shop` (Spring Boot 4.1.2, image `shop/*:1.0|2.0` đã nạp sẵn), dữ liệu ES module của `webapp/`.

**Spec:** `docs/superpowers/specs/2026-11-13-practice-module-cka-design.md` (mục 5.4, 7.2, 7.4, 7.5, 8.3, 8.4, 12). Kế hoạch đợt 1 làm mẫu: `docs/superpowers/plans/2026-11-13-practice-module-cka-wave1.md` (Task 10, 11).

## Global Constraints

- Nhánh `feat/practice-cka-wave2` từ `main`. Không push, không merge.
- **An toàn VM (spec A3):** VM `cp1`, `w1`, `w2` có sẵn trên máy không được bật, tắt, sửa, chụp, xoá. Mọi lệnh vào VM đi qua `./labs/lab …` hoặc hàm `vm`/`mp` của `labs/lib/multipass.sh`; không gọi `multipass` trực tiếp với tên instance.
- **Một task dùng VM tại một thời điểm.** Trước khi bật VM: `memory_pressure | tail -1` và `sysctl vm.swapusage`; nếu máy đang thiếu RAM (swap gần đầy, `kubeadm`/apiserver hết giờ, `multipass exec` timeout) thì dừng và báo BLOCKED, không tắt ứng dụng hay container của người dùng. Kết thúc task: `./labs/lab down cka`.
- bash trong `labs/` chạy được với `/bin/bash` 3.2. `labs/lib/` không chứa chuỗi `cka` hay `kubernetes`. Không sửa `labs/lib/`, `labs/lab`, `webapp/js/views/`, `webapp/js/lib/` trong đợt này; nếu thấy buộc phải sửa thì báo lại thay vì tự sửa.
- Không sửa buổi đã phát hành `s01`–`s09` (dữ liệu và script), trừ lỗi thật tìm thấy khi chạy; khi đó ghi rõ trong báo cáo.
- **Id bất biến:** id buổi, id nhiệm vụ, id kỹ năng, id chặng đã có trong khung giữ nguyên. Được sửa `title`, `goals`, `stateIn`, `stateOut`, `durationMin`, `label` của kỹ năng. Mọi kỹ năng trong `skills` của buổi phải được luyện thật trong buổi; kỹ năng khung không luyện được thì chuyển sang `uses` của buổi khác là không được (PR: học đúng một buổi) — thay vào đó thêm bước luyện.
- **Cluster dùng H2 cho tới s24.** Không có PostgreSQL ở chặng 2–3. `catalog`, `order` chạy H2 trong bộ nhớ (vắng `DB_URL`), nên dữ liệu đơn hàng mất khi Pod `order` khởi động lại: `verify.sh` không được chấm bằng số đơn hàng.
- **Trạng thái chấm phải bền:** `verify.sh` của buổi N là `check` của buổi N+1 và phải đạt sau `./labs/lab down` + `up` (VM khởi động lại, mọi Pod bị tạo lại). Thứ không bền (Event, số lần restart, `kubectl top`) chỉ được chấm qua `~/drills/<id>/answers.env` do người học ghi, hoặc buổi kế tiếp có `check.sh` riêng.
- `verify.sh` không sửa trạng thái buổi học tạo ra (ngoại lệ namespace tạm, spec 8.4); dùng `--dry-run=server` và `kubectl get --raw …/proxy/…` khi cần thử hành vi.
- Mỗi dòng `verify.sh` phải **đỏ trên trạng thái đầu vào của buổi** (đo thật, ghi vào báo cáo); dòng nào xanh sẵn thì bỏ hoặc đổi.
- Mọi yêu cầu nêu trong nhiệm vụ đều có dòng chấm; không có yêu cầu "tự giác".
- Mỗi buổi 60–90 phút, đủ mọi khối của spec 5.4, có ít nhất một tình huống hỏng để chẩn đoán, `outcome.verifyOutput` chép từ output thật, `refs` có ít nhất một tài liệu trong app (kiểm id thật) và trang kubernetes.io tương ứng. Phần Tư duy liên hệ Java/Spring khi tự nhiên.
- Văn bản tiếng Việt, xưng "bạn" với người đọc, giữ thuật ngữ tiếng Anh của Kubernetes. Không chép lại lý thuyết đã có trong app.
- Tài nguyên: hai worker 2 GB. Mọi con số requests/limits/replica trong plan này là điểm xuất phát; implementer đo `free -m` và `kubectl describe node` trên VM, chỉnh cho vừa và ghi số đo vào `labs/cka/README.md`.
- Image ngoài `shop/*` (busybox, metrics-server…) kéo từ Internet, ghim tag cụ thể, có bản arm64.
- Lệnh: **CHECK** `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`; **UNIT** `node --test "webapp/scripts/tests/*.test.mjs"`; **LABTEST** `/bin/bash labs/tests/run.sh`.
- Commit tiếng Việt kiểu `feat(practice): …`, kết thúc bằng dòng attribution của phiên.

### Quyết định của plan (khác khung hiện có)

- **s15:** Job `seed` tạo đơn hàng mẫu qua `gateway` (`POST /api/orders`), không "nạp dữ liệu cho catalog" (catalog chỉ có GET và dùng H2). Sửa `goals`/`stateOut` của khung cho khớp.
- **s19:** `cka-w2` **không giữ taint** ở trạng thái cuối. Hai worker 2 GB không đủ để dành riêng một node; taint được luyện trọn vòng (đặt → Pod Pending → thêm toleration → gỡ). Trạng thái cuối chỉ giữ nhãn `role=db` trên `cka-w2` (s24 dùng bằng nodeAffinity). podAntiAffinity của `catalog` ở trạng thái cuối là `preferred` (để HPA ở s20 tăng quá 2 replica được); dạng `required` luyện trên Deployment nháp để thấy replica thứ ba Pending. Sửa `goals`/`stateOut` của s19 và mọi `stateIn` buổi sau có nhắc taint dành cho db.
- **s20:** `apply.sh` không sinh tải (để `restore` nhanh); việc HPA co giãn thật được implementer chứng minh một lần trên VM và chép output vào nội dung.

## Review Focus

- VM khởi động lại giữa hai buổi: `check` buổi kế tiếp vẫn đạt (Pod bị tạo lại, H2 mất dữ liệu, metrics-server chưa có số trong ~1 phút đầu → verify chờ có giới hạn).
- Người học làm đúng nhưng khác tên/đường đi (ví dụ dùng `kubectl edit` thay vì YAML, thứ tự khác): verify chấm trạng thái, không chấm cách làm.
- `begin` chạy lại trên buổi sự cố đang sửa dở: `setup.sh`/`run.sh` chạy lần hai không làm hỏng thêm kiểu khác và không báo lỗi.
- Thiếu RAM trên worker: Pod Pending hoặc OOMKilled ngoài ý muốn ở s17–s20 khi cộng dồn replica (HPA max, Deployment nháp chưa dọn).
- `restore cka s21` từ mốc `st1-done`: chuỗi `apply.sh` s10→s21 chạy liền không cần người, mỗi `apply.sh` chạy lại nhiều lần được.

---

### Task 1: Chặng 2 phần đầu — s10, s11, s12

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-02.js`, `webapp/js/data/practice/cka/skills.js`, `webapp/scripts/check-data.mjs` (`practice-published:cka` → 12)
- Create: `labs/cka/sessions/s10`, `s11`, `s12` (mỗi thư mục `apply.sh`, `verify.sh`, thêm `setup.sh`/`check.sh`/`files/` khi cần)

**Interfaces:**
- Consumes: hợp đồng script buổi (`labs/README.md`), `labs/lib/assert.sh`, mẫu `labs/cka/sessions/s08`, `s09`; hình dạng buổi đã phát hành trong `stage-01.js`; app `shop` (`labs/cka/app/README.md`).
- Produces: namespace `shop`; Deployment `gateway` (1), `catalog` (2), `order` (1) image `:1.0`, nhãn `app=<tên>`; Service ClusterIP cùng tên, cổng 8080; ConfigMap `shop-config`, ConfigMap `gateway-files`, Secret `db-cred`. Thư mục bài làm của người học: `~/shop/` trên `cka-cp` (manifest), `~/drills/<id>/`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s10 | `kubectl run catalog` image `shop/catalog:1.0` trong `default`; sinh `~/drills/s10/pod.yaml` bằng `$do`, sửa (nhãn `app=catalog`, `containerPort: 8080`) rồi apply; logs, exec, port-forward gọi `/actuator/health`; đọc Events; ghi `NODE`, `POD_IP` vào `~/drills/s10/answers.env`. Tình huống hỏng: một Pod với tag image sai để đọc Events | Pod `catalog` ở `default` Running + Ready, đúng image, có nhãn và `containerPort`; `pod.yaml` qua `apply --dry-run=server`; `…/pods/catalog:8080/proxy/actuator/health` qua apiserver trả `UP`; `NODE`, `POD_IP` khớp giá trị script tự đọc |
| s11 | Tạo namespace `shop`; xoá Pod lẻ; ba Deployment từ YAML sinh bằng `kubectl create deploy … $do` lưu ở `~/shop/`; scale `catalog` lên 2; xoá một Pod và lần `ownerReferences`; `kubectl expose` ba Service; gọi `gateway` → `/api/products`; ghi `CATALOG_RS` (tên ReplicaSet hiện hành) vào `answers.env`. Tình huống hỏng: Service có selector lệch nhãn → Endpoints rỗng | Pod `catalog` ở `default` không còn; ba Deployment Available đúng image và số replica; ba Service ClusterIP cổng 8080 có số địa chỉ EndpointSlice bằng số replica; `gateway` `/api/products` qua service proxy trả đủ 3 sản phẩm; `CATALOG_RS` khớp; ba tệp YAML trong `~/shop/` qua `--dry-run=server` |
| s12 | ConfigMap `shop-config` (từ literal: `APP_GREETING` giá trị mới, `CATALOG_URL`, `ORDER_URL`) nạp vào `gateway` bằng `envFrom`; ConfigMap `gateway-files` từ tệp, mount thành volume ở đường dẫn Spring đọc được (implementer đo cách Spring Boot của image nạp tệp ngoài và chọn một khoá cấu hình quan sát được qua HTTP); Secret `db-cred` (`DB_USER`, `DB_PASSWORD`) nạp vào `catalog`, `order` bằng `secretKeyRef`; đọc ngược bằng jsonpath + `base64 -d`, ghi `DB_PASSWORD_DECODED`; đổi ConfigMap rồi quan sát env cần `rollout restart`, volume tự cập nhật. Tình huống hỏng: tham chiếu khoá không tồn tại → `CreateContainerConfigError` | Hai ConfigMap và Secret tồn tại đúng khoá; `gateway` có `envFrom.configMapRef` và `/api/info` trả đúng lời chào trong ConfigMap; volume mount đúng ConfigMap và tệp trong Pod bằng nội dung khoá; `catalog`, `order` có hai biến từ `secretKeyRef`; `DB_PASSWORD_DECODED` khớp; ba Deployment Available |

Phải đo trước khi viết s12: `catalog`/`order` vẫn khởi động với `DB_USER`/`DB_PASSWORD` mà không có `DB_URL` (H2). Nếu không, báo lại kèm log thay vì tự đổi thiết kế.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s09 --yes`, `./labs/lab images cka`; xác nhận 3 node Ready.
- [ ] **Bước 2:** Với từng buổi theo thứ tự: viết `verify.sh` → chạy trên trạng thái đầu vào, mọi dòng đỏ (ghi output) → viết `apply.sh` → chạy → `verify` xanh → chạy `apply.sh` lần hai, vẫn xanh.
- [ ] **Bước 3:** `./labs/lab down cka && ./labs/lab up cka` rồi `verify cka s12` vẫn xanh (trạng thái bền).
- [ ] **Bước 4:** Viết nội dung đầy đủ ba buổi trong `stage-02.js`, `status: "published"`, theo khuôn buổi `s08` trong `stage-01.js`. Riêng: s10 Tư duy nối "Pod = một tiến trình JVM có địa chỉ riêng"; s11 nối Deployment với việc chạy nhiều instance sau load balancer; s12 nối ConfigMap/Secret với `application.yaml`, profile và thứ tự ưu tiên nguồn cấu hình của Spring Boot. `refs`: bài lộ trình `#/roadmap/cka/…` và chương `#/docs/ckabook-NN` tương ứng (kiểm id thật), mục `#/commands` khi có.
- [ ] **Bước 5:** `practice-published:cka` → 12. CHECK, UNIT, LABTEST xanh.
- [ ] **Bước 6:** Mở app (`./webapp/scripts/dev.sh 8899`) kiểm trang s10–s12 hiển thị đủ khối, không lỗi console.
- [ ] **Bước 7:** `./labs/lab down cka`. Commit `feat(practice): cka chặng 2 — Pod, Deployment, ConfigMap/Secret (s10–s12)`.

### Task 2: Chặng 2 phần sau — s13, s14, s15, s16 và mốc `st2-done`

**Files:**
- Modify: `stage-02.js`, `skills.js`, `check-data.mjs` (→ 16), `labs/cka/milestones` (thêm `s16 st2-done`)
- Create: `labs/cka/sessions/s13` … `s16`, `labs/cka/breaks/st2-pods-broken/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s12 (Task 1).
- Produces: ba Deployment có ba probe + `preStop`; `gateway` 2 replica image `:2.0`, `maxUnavailable: 0`, `maxSurge: 1`; DaemonSet `log-agent`, Job `seed`, CronJob `order-report` trong `shop`; mốc snapshot `st2-done`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s13 | Gắn `startupProbe`, `livenessProbe` (`/actuator/health/liveness`), `readinessProbe` (`/actuator/health/readiness`) vào ba Deployment; `preStop` + `terminationGracePeriodSeconds`; initContainer `wait-catalog` cho `gateway`; thí nghiệm trên Deployment nháp `probe-lab`: readiness sai → rút khỏi Endpoints, không restart; liveness sai → restart; ghi `READINESS_RESTARTS`, `LIVENESS_RESTARTS_GE1` vào `answers.env`; xoá `probe-lab` | Mỗi Deployment đủ ba probe đúng path và cổng, có `preStop`, `terminationGracePeriodSeconds` khai rõ; `gateway` có initContainer; ba Deployment Available; EndpointSlice chỉ chứa địa chỉ `ready`; `probe-lab` không còn; hai đáp án đúng (`0`, `yes`) |
| s14 | `gateway` lên 2 replica, khai `RollingUpdate` `maxUnavailable: 0`/`maxSurge: 1`; chạy vòng `curl` ghi mã HTTP vào `~/drills/s14/curl.log` trong lúc `set image` lên `2.0`; `rollout status`, `history`, annotation `kubernetes.io/change-cause`; rollout một image hỏng rồi `rollout undo --to-revision`; roll lại lên `2.0` | `gateway` image `:2.0`, 2 replica Available, strategy đúng; `/api/info` trả version `2.0`; lịch sử có ≥ 3 revision, revision hiện hành có change-cause khác rỗng; `curl.log` có ≥ 30 dòng và không dòng nào khác `200` |
| s15 | DaemonSet `log-agent` (busybox ghim tag, `hostPath /var/log` chỉ đọc, toleration control plane) có Pod trên cả 3 node; Job `seed` (`completions: 3`, `backoffLimit` khai rõ) gọi `POST /api/orders` qua `gateway`; CronJob `order-report` (`*/5 * * * *`, giới hạn lịch sử) gọi `GET /api/orders`; `kubectl create job order-report-manual --from=cronjob/order-report`. Tình huống hỏng: Job với lệnh sai chạm `backoffLimit` | DaemonSet desired = ready = 3; Job `seed` `succeeded=3`; CronJob đúng schedule, có `lastSuccessfulTime`; Job `order-report-manual` Complete và có ownerReference/annotation chứng tỏ tạo từ CronJob |
| s16 | `setup.sh` gây bốn lỗi: `catalog` tag image sai (ImagePullBackOff); `order` tham chiếu khoá Secret không tồn tại (CreateContainerConfigError); `gateway` `JAVA_OPTS` có cờ JVM sai (CrashLoopBackOff); Pod lẻ `report-once` image sai (phải `replace --force`). Người học sửa trong 20 phút bằng `describe`, `logs --previous`, Events sắp theo thời gian, `kubectl debug` | Ba Deployment Available đúng image và số replica cuối s15; `envFrom`, `secretKeyRef`, probe còn nguyên; `gateway` không còn cờ JVM sai; Pod `report-once` chạy đúng image; namespace `shop` không còn Pod nào ngoài Running/Succeeded |

`s16/apply.sh` = `lab_break st2-pods-broken` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s12 --yes`.
- [ ] **Bước 2:** Từng buổi theo thứ tự như Task 1 bước 2. Với s16: sau `setup.sh`, `verify` phải đỏ ở mọi dòng liên quan lỗi trong vòng 2 phút; ghi output.
- [ ] **Bước 3:** s14: đo thật vòng `curl` không rớt request với cấu hình buổi dạy; nếu rớt, tìm nguyên nhân (readiness, `preStop`) và sửa nội dung s13/s14 cho đúng trước khi viết.
- [ ] **Bước 4:** Nội dung đầy đủ bốn buổi. Riêng: s13 nối probe với Actuator health group và `server.shutdown=graceful`; s14 nối với blue/green, rolling deploy đã biết; s16 trình bày quy trình chẩn đoán (trạng thái → Events → log lần trước → YAML đang chạy), không chỉ lệnh sửa; khối `foundation` ở s16 về hiện ký tự trắng trong vim.
- [ ] **Bước 5:** `milestones` thêm `s16 st2-done`; `practice-published:cka` → 16; CHECK, UNIT, LABTEST xanh.
- [ ] **Bước 6:** `./labs/lab restore cka s09 --yes` rồi `./labs/lab restore cka s16 --yes` (chuỗi apply s10→s16 liền mạch) → `verify cka s16` xanh; snapshot `st2-done` được chụp theo cơ chế sẵn có.
- [ ] **Bước 7:** Kiểm trình duyệt s13–s16. `./labs/lab down cka`. Commit `feat(practice): cka chặng 2 — probe, rollout, Job, sự cố Pod (s13–s16)`.

### Task 3: Chặng 3 phần đầu — s17, s18, s19

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-03.js`, `skills.js`, `check-data.mjs` (→ 19); `stage-04.js` chỉ khi `stateIn` nhắc taint dành cho db
- Create: `labs/cka/sessions/s17`, `s18`, `s19`

**Interfaces:**
- Consumes: trạng thái cuối s16.
- Produces: ba Deployment có `requests.cpu`, `requests.memory`, `limits.memory` (QoS Burstable) và `JAVA_OPTS` chứa `-XX:MaxRAMPercentage=`; ResourceQuota `shop-quota`, LimitRange `shop-limits`; context mặc định của user `ubuntu` trên `cka-cp` ở namespace `shop`; nhãn `role=db` trên `cka-w2`, không taint thừa; `catalog` có podAntiAffinity `preferred` theo `kubernetes.io/hostname`; PriorityClass `shop-critical` gắn cho `gateway`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s17 | `kubectl set resources` và YAML cho ba Deployment; Deployment nháp `oom-lab` limit thấp + `/internal/alloc` để gây OOMKilled, đọc `lastState`, ghi `OOM_REASON`, `OOM_EXIT_CODE`; sửa bằng `MaxRAMPercentage` qua `JAVA_OPTS`; đọc QoS và `Allocated resources` của node, ghi `QOS_GATEWAY`; xoá `oom-lab` | Mọi container của ba Deployment đủ ba trường tài nguyên; QoS của mọi Pod là `Burstable`; `JAVA_OPTS` có `MaxRAMPercentage`; ba Deployment Available; `oom-lab` không còn; ba đáp án đúng (`OOMKilled`, `137`, `Burstable`) |
| s18 | `kubectl config set-context --current --namespace=shop`; ResourceQuota `shop-quota` (pods, `requests.cpu`, `requests.memory`, `limits.memory`); LimitRange `shop-limits` (default, defaultRequest, max); scale vượt quota và tìm lỗi `FailedCreate` ở ReplicaSet, ghi `QUOTA_ERROR_KIND`; trả scale về | Quota và LimitRange tồn tại đủ khoá; namespace của context hiện hành là `shop`; Pod không khai tài nguyên tạo bằng `--dry-run=server` nhận đúng default của LimitRange; `used` ≤ `hard` và ba Deployment Available đúng số replica; `QUOTA_ERROR_KIND=ReplicaSet` |
| s19 | Nhãn `role=db` cho `cka-w2`; vòng taint `dedicated=db:NoSchedule` → Pod Pending → toleration + nodeAffinity trên Pod `db-probe` → gỡ taint, xoá Pod; podAntiAffinity `required` trên Deployment nháp 3 replica (replica thứ ba Pending) rồi xoá; `preferred` cho `catalog`; Pod `pinned` bằng `nodeName`; PriorityClass `shop-critical` cho `gateway`; ghi `PENDING_REASON` (chuỗi trong Event FailedScheduling), `NODENAME_SKIPS_SCHEDULER` | `cka-w2` có nhãn, hai worker không có taint ngoài mặc định; `catalog` có podAntiAffinity preferred đúng topologyKey và hai Pod ở hai node khác nhau; PriorityClass tồn tại và `gateway` dùng nó; Pod/Deployment nháp không còn; hai đáp án đúng; ba Deployment Available |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s16 --yes`.
- [ ] **Bước 2:** Đo trước: bộ nhớ thật của một Pod `shop` khi rảnh và khi gọi `/api/products` (`kubectl exec … cat /sys/fs/cgroup/memory.current` hoặc `crictl stats`), `free -m` hai worker; chọn requests/limits từ số đo và ghi vào `labs/cka/README.md`.
- [ ] **Bước 3:** Từng buổi theo thứ tự như Task 1 bước 2.
- [ ] **Bước 4:** `down` + `up`, `verify cka s19` vẫn xanh (lưu ý dòng "hai Pod `catalog` ở hai node khác nhau" sau khởi động lại: nếu không bền thì bỏ dòng đó khỏi `verify.sh` và chấm bằng `answers.env`).
- [ ] **Bước 5:** Nội dung đầy đủ ba buổi. Riêng: s17 là buổi nối Java mạnh nhất — heap, non-heap, `MaxRAMPercentage`, vì sao `-Xmx` bằng limit là sai; `refs` có `#/docs/<id bài Java 07 threadpool-sizing>` (kiểm id thật); s18 nối quota với giới hạn pool/tenant; s19 có bảng bốn cách gắn Pod với node và cách nào bỏ qua scheduler.
- [ ] **Bước 6:** `practice-published:cka` → 19; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s17–s19.
- [ ] **Bước 7:** `./labs/lab down cka`. Commit `feat(practice): cka chặng 3 — tài nguyên, quota, scheduling (s17–s19)`.

### Task 4: Chặng 3 phần sau — s20, s21 và mốc `st3-done`

**Files:**
- Modify: `stage-03.js`, `skills.js`, `check-data.mjs` (→ 21), `labs/cka/milestones` (thêm `s21 st3-done`)
- Create: `labs/cka/sessions/s20`, `s21`, `labs/cka/breaks/st3-pending/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s19.
- Produces: metrics-server trong `kube-system` (ghim phiên bản, `--kubelet-insecure-tls`); HPA `catalog` (`autoscaling/v2`, min 2, max theo số đo, CPU 60%, `behavior.scaleDown.stabilizationWindowSeconds: 60`); mốc `st3-done`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s20 | Cài metrics-server từ manifest ghim phiên bản, sửa đối số cho kubelet của kubeadm; `kubectl top node/pod`; `kubectl autoscale` rồi viết lại bằng YAML v2; sinh tải bằng `/internal/burn`, xem replica tăng rồi giảm, ghi `MAX_REPLICAS_SEEN`; tình huống hỏng: HPA `<unknown>` vì Deployment thiếu `requests.cpu` (trên Deployment nháp) | metrics-server Available; `kubectl top nodes` ra 3 dòng (chờ tối đa 120 giây); HPA đúng min/max/target và có `behavior.scaleDown`; `status.currentMetrics` có số; quota đủ chỗ cho max replica; `MAX_REPLICAS_SEEN` ≥ 3; Deployment nháp không còn |
| s21 | `setup.sh` gây lỗi chồng nhau: `order` có `nodeSelector` nhãn không tồn tại; `shop-quota` bị hạ khiến ReplicaSet mới `FailedCreate`; `gateway` `requests.memory` lớn hơn mọi node; `cka-w1` bị cordon; một Pod `batch-7f` ở `default` đốt CPU. Người học sửa trong 20 phút, tìm Pod ngốn CPU bằng `kubectl top --sort-by`, ghi `HOG_NS`, `HOG_POD`, xoá nó | Ba Deployment Available đúng số replica; không Pod nào Pending trong `shop`; quota bằng đúng giá trị cuối s18/s20; hai worker schedulable, không taint thừa; tài nguyên `gateway` như cuối s17; Pod `batch-7f` không còn; hai đáp án đúng |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s19 --yes`.
- [ ] **Bước 2:** Từng buổi theo thứ tự như Task 1 bước 2. s20: chạy tải thật một lần, chép output `kubectl get hpa -w` vào nội dung; chọn `maxReplicas` sao cho mọi replica chạy được trên hai worker (đo `free -m` lúc đỉnh, ghi README). s21: sau `setup.sh` verify đỏ trong 2 phút; `run.sh` chạy lần hai không lỗi.
- [ ] **Bước 3:** Nội dung đầy đủ hai buổi. s20 giải thích công thức `desiredReplicas`, vì sao cần `requests.cpu`, độ trễ scale down; s21 trình bày cách đọc `FailedScheduling` ("0/3 nodes are available: …") từng vế và phân biệt thiếu tài nguyên thật với ràng buộc sai.
- [ ] **Bước 4:** `milestones` thêm `s21 st3-done`; `practice-published:cka` → 21; CHECK, UNIT, LABTEST xanh.
- [ ] **Bước 5:** `./labs/lab restore cka s16 --yes` rồi `./labs/lab restore cka s21 --yes` → `verify cka s21` xanh; `down` + `up` → vẫn xanh.
- [ ] **Bước 6:** Kiểm trình duyệt s20–s21. `./labs/lab down cka`. Commit `feat(practice): cka chặng 3 — HPA và sự cố Pending (s20–s21)`.

### Task 5: Nghiệm thu đợt 2 và tài liệu

**Files:**
- Modify: `labs/cka/README.md` (mốc snapshot, bảng `setup.sh`/`check.sh`, lỗi có chủ ý của hai break, thời gian selftest, số đo bộ nhớ cuối chặng 3), `webapp/README.md` và `README.md` nếu có con số buổi đã phát hành

- [ ] **Bước 1:** `./labs/lab destroy cka --yes && ./labs/lab selftest cka --yes` từ VM sạch, s01 → s21 xanh; ghi tổng thời gian và số tiêu chí từng buổi vào `labs/cka/README.md`.
- [ ] **Bước 2:** `./labs/lab restore cka s14 --yes` → `verify cka s14` xanh (khôi phục giữa chặng từ mốc `st1-done`); `./labs/lab restore cka s20 --yes` → xanh (từ mốc `st2-done`).
- [ ] **Bước 3:** `free -m` ba VM ở trạng thái cuối s21 sau 5 phút chạy; `journalctl -k | grep -i oom` rỗng; ghi README.
- [ ] **Bước 4:** `multipass list`: `cp1`, `w1`, `w2` còn nguyên và Stopped.
- [ ] **Bước 5:** Trình duyệt: trang chủ `cka` báo 21/53, độ phủ domain đổi đúng; đi trọn s10 như người học (ba bước, tick, gợi ý, ghi chú, hoàn thành, sang s11 thấy câu ôn); hai theme, màn hẹp 380px; trang `ssia` không đổi.
- [ ] **Bước 6:** CHECK, UNIT, LABTEST xanh. `./labs/lab down cka`. Commit `docs(practice): cka đợt 2 — README, mốc snapshot, thời gian selftest`.

---

## Các đợt sau (không thuộc plan này)

Đợt 3: chặng 5 Networking + chặng 4 Storage. Đợt 4: chặng 6 + 8 (+ chặng 7). Đợt 5: chặng 9 + hai đề mock. Cùng khuôn với plan này.
