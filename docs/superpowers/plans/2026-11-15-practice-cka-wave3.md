# Thực hành CKA — đợt 3 (chặng 4 Storage, chặng 5 Networking) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phát hành 11 buổi `s22`–`s32` của chương trình `cka` (nội dung đầy đủ + script lab chạy thật trên 3 VM), nâng số buổi học được từ 21 lên 32.

**Architecture:** Không thêm hạ tầng lab. Mỗi buổi theo đúng khuôn đợt 2: bảng "người học làm / `verify.sh` kiểm" → script đỏ rồi xanh trên VM thật → nội dung đầy đủ trong `stage-04.js`/`stage-05.js` → tăng `practice-published:cka` → `selftest`. Hai buổi sự cố dùng `labs/cka/breaks/<id>/run.sh`. Thêm hai mốc snapshot `st4-done` (sau s25), `st5-done` (sau s32).

**Tech Stack:** bash 3.2 (macOS) + Multipass 1.16.3, Kubernetes 1.36 kubeadm, Calico 3.33, containerd 2.2.1, ứng dụng `shop` (Spring Boot 4.1.2, image `shop/*:1.0|2.0`), `postgres:17-alpine`, local-path-provisioner, ingress-nginx, Gateway API + NGINX Gateway Fabric, dữ liệu ES module của `webapp/`.

**Spec:** `docs/superpowers/specs/2026-11-13-practice-module-cka-design.md` (mục 5.4, 7.2, 7.4, 7.5, 8.3, 8.4, 11, 12). Plan đợt 2 làm mẫu: `docs/superpowers/plans/2026-11-14-practice-cka-wave2.md`. App: `labs/cka/app/README.md` (`DB_URL` → PostgreSQL, `schema.sql`/`data.sql` chạy lại được, đã thử `postgres:17-alpine`).

## Global Constraints

- Nhánh `feat/practice-cka-wave3` từ `main`. Không push, không merge.
- **An toàn VM (spec A3):** VM `cp1`, `w1`, `w2` có sẵn trên máy không được bật, tắt, sửa, chụp, xoá. Mọi lệnh vào VM đi qua `./labs/lab …` hoặc hàm `vm`/`mp` của `labs/lib/multipass.sh`. Không đụng container OrbStack của người dùng.
- **Một task dùng VM tại một thời điểm.** Trước khi bật VM: `sysctl vm.swapusage`, `sysctl -n vm.loadavg`; chỉ bật khi swap còn trống ≥ 1 GB và tải 1 phút < 6. Trong lúc chạy, `multipass exec` hoặc kubectl hết giờ lặp lại, hay swap cạn → `./labs/lab down cka`, commit phần đã đo, báo BLOCKED kèm bằng chứng. Kết thúc task: `./labs/lab down cka`.
- bash trong `labs/` chạy được với `/bin/bash` 3.2. `labs/lib/` không chứa chuỗi `cka` hay `kubernetes`. Không sửa `labs/lib/`, `labs/lab`, `webapp/js/views/`, `webapp/js/lib/`; nếu buộc phải sửa thì báo lại.
- Không sửa buổi đã phát hành `s01`–`s21`, trừ lỗi thật tìm thấy khi chạy; ghi rõ trong báo cáo.
- **Id bất biến:** id buổi, nhiệm vụ, kỹ năng, chặng giữ nguyên. Được sửa `title`, `goals`, `stateIn`, `stateOut`, `durationMin`, `label` kỹ năng, và **thêm** id đã có vào `uses`. Mọi kỹ năng trong `skills` của buổi phải được luyện thật trong buổi.
- **Từ s24 dữ liệu nằm ở PostgreSQL.** Trước s24 vẫn là H2 (không chấm bằng số đơn hàng). Từ s24 `verify.sh` được chấm bằng dữ liệu trong PostgreSQL (đếm bằng `psql` trong `postgres-0`), vì dữ liệu bền qua khởi động lại.
- **Trạng thái chấm phải bền:** `verify.sh` của buổi N là `check` của buổi N+1 và phải đạt sau `./labs/lab down` + `up`. Thứ không bền (Event, `tcpdump`, số lần restart, tỷ lệ chia lưu lượng đếm được) chấm qua `~/drills/<id>/answers.env` hoặc `check.sh` riêng.
- **Quy ước đã có từ đợt 2, giữ nguyên:** manifest người học ở `~/shop/` (chỉ manifest, `k apply -f ~/shop/` chạy được), cấu hình ở `~/shop/config/`, bài nháp và đáp án ở `~/drills/<id>/`; buổi có câu trả lời thì có `setup.sh` tạo `~/drills/<id>` và xoá `answers.env` cũ; thu thập dữ kiện trong một lần gọi VM (`files/facts.sh`); vòng chờ của `verify.sh` giới hạn theo đồng hồ, mỗi lệnh kubectl có `--request-timeout`, lệnh lỗi tính là "chưa sẵn sàng" và dòng "đã xoá" đỏ khi `get` lỗi; ước lượng thời gian in ra phải đúng trường hợp chậm nhất; đếm EndpointSlice bỏ địa chỉ `terminating`; lệnh nhiều dấu nháy trong template literal viết bằng YAML khối `|` và kiểm bằng `node -e`.
- `verify.sh` không sửa trạng thái buổi học tạo ra (ngoại lệ namespace tạm, spec 8.4).
- Mỗi dòng `verify.sh` phải **đỏ trên trạng thái đầu vào** (đo thật, ghi báo cáo); mọi yêu cầu của nhiệm vụ có dòng chấm.
- Mỗi buổi 60–90 phút, đủ mọi khối spec 5.4, có ít nhất một tình huống hỏng, `outcome.verifyOutput` chép từ output thật, `refs` có ít nhất một tài liệu trong app (kiểm id thật) và trang kubernetes.io. Phần Tư duy nối Java/Spring khi tự nhiên (HikariCP, DNS cache của JVM, `server.forward-headers-strategy` sau Ingress).
- Văn bản tiếng Việt, xưng "bạn", giữ thuật ngữ tiếng Anh của Kubernetes.
- **Tài nguyên:** cuối s21 phần trống đo được là `cka-cp` 1978 MB, `cka-w1` 1193 MB, `cka-w2` 1000 MB; quota `shop` `pods: 20`, `requests.memory` 3Gi (dùng 1280Mi). Mỗi thành phần mới (postgres, local-path, ingress-nginx, NGINX Gateway Fabric, JVM thêm ở s30) phải đo `free -m` và `kubectl describe node` trước và sau, ghi README. Thành phần hạ tầng (provisioner, controller) đặt trên `cka-cp` khi chart/manifest cho phép (toleration control plane + nodeSelector) để dành RAM worker cho app.
- Image ngoài `shop/*` kéo từ Internet, ghim tag hoặc digest cụ thể, có bản arm64; implementer tra phiên bản hiện hành tại thời điểm làm và ghi nguồn vào README.
- Lệnh: **CHECK** `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`; **UNIT** `node --test "webapp/scripts/tests/*.test.mjs"`; **LABTEST** `/bin/bash labs/tests/run.sh`.
- Commit tiếng Việt kiểu `feat(practice): …`, kết thúc bằng dòng attribution của phiên.

### Quyết định của plan (khác khung hiện có)

- **Provisioner:** local-path-provisioner (giống môi trường đề thi), StorageClass `local-path` mặc định, `WaitForFirstConsumer`. Không dùng NFS.
- **s24 "dời sang node khác":** PV của local-path gắn `nodeAffinity` vào node chứa dữ liệu, nên postgres **không** dời được sang node khác mà giữ dữ liệu. Buổi dạy đúng điều đó: `postgres-0` ghim `cka-w2` bằng `nodeSelector role=db`; người học cordon `cka-w2` rồi xoá Pod, thấy Pod Pending với lý do `volume node affinity conflict`, ghi lý do vào `answers.env`, uncordon. Sửa goal thứ ba của s24 và `projectMilestone` của `st4` thành "PostgreSQL giữ dữ liệu qua restart; hiểu vì sao lưu trữ cục bộ ghim Pod vào node". Phần Tư duy nói storage mạng (NFS, CSI của cloud) mới cho dời node.
- **s24 Retain:** người học đặt PV `data-postgres-0` sang `Retain` (thêm `k-reclaim-policy` vào `uses` của s24); s25 cần điều này để lấy lại dữ liệu từ PV Released.
- **s29 ingress-nginx:** id kỹ năng là `k-ingress-nginx-install`, nên dùng ingress-nginx bản cuối ghim tag, kiểu NodePort cố định (ví dụ 30080/30443). Dự án ingress-nginx đã dừng bảo trì từ 2026; nội dung nói rõ điều này và trỏ sang Gateway API ở s30. Nếu implementer thấy image không còn kéo được thì báo lại, không tự đổi controller.
- **s30 Gateway API:** CRD kênh standard ghim phiên bản, implementation NGINX Gateway Fabric (nhẹ, arm64), NodePort cố định khác s29. Chia 90/10: `gateway` (2.0) nhận 90, Deployment mới `gateway-v1` (1 replica, image `:1.0`, cùng probe/tài nguyên như `gateway`) nhận 10. Nếu đo RAM thấy giữ `gateway-v1` lâu dài làm worker thiếu bộ nhớ ở trạng thái cuối, thì trạng thái cuối là HTTPRoute một backend `gateway` và xoá `gateway-v1`; việc chia 90/10 chấm qua `answers.env` (số lần trúng bản 1.0 trên 100 request nằm trong 3–20); sửa `stateOut` s30 và `stateIn` s31, s32 cho khớp.
- **s31 NetworkPolicy:** mở đủ luồng mà trạng thái cuối s30 cần: ingress controller và Gateway data plane → `gateway`; `gateway` → `catalog`, `order`; `order` → `catalog`; `catalog`, `order` → `postgres`; DaemonSet/Job/CronJob của `shop` tới `gateway`; egress DNS tới `kube-system`. Probe của kubelet và metrics-server phải vẫn chạy (đo thật trên Calico, ghi kết quả). HPA `catalog` phải vẫn có số liệu.
- **Nợ đo của đợt 2** làm ở Task 1 bước 1 (máy đủ chỗ thì làm, không thì ghi chưa đo).

## Review Focus

- VM khởi động lại giữa hai buổi: postgres khởi động sau catalog/order (HikariCP thử lại hay Pod CrashLoop?), ingress/gateway controller chưa sẵn sàng trong phút đầu → `verify` chờ có giới hạn, không đỏ giả.
- Người học làm đúng nhưng khác đường đi (Helm thay manifest khi cài controller, `kubectl patch` thay `edit`, tên tệp khác): verify chấm trạng thái, không chấm cách làm.
- `begin` chạy lại trên buổi sự cố đang sửa dở (s25, s32): `setup.sh`/`run.sh` lần hai không hỏng thêm, `check` của buổi không đòi điều mà sự cố đã phá (bài học từ s21: buổi sự cố có `check.sh` riêng).
- Thiếu RAM trên worker khi cộng dồn postgres + hai controller + JVM thêm ở s30: Pod Pending/OOMKilled ngoài ý muốn, HPA không tăng được tới max.
- `restore cka s32` từ mốc `st3-done`: chuỗi `apply.sh` s22→s32 chạy liền không cần người, mỗi `apply.sh` chạy lại được (cài controller lần hai, CRD đã có, PV Retain đã Released).

---

### Task 1: Chặng 4 phần đầu — s22, s23 (và nợ đo đợt 2)

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-04.js`, `skills.js`, `check-data.mjs` (`practice-published:cka` → 23)
- Create: `labs/cka/sessions/s22`, `s23`

**Interfaces:**
- Consumes: trạng thái cuối s21 (mốc `st3-done`).
- Produces: PV `shop-data` (hostPath trên `cka-w2`, `Retain`) Bound với PVC `shop-data` trong `shop`; local-path-provisioner trong namespace `local-path-storage`, StorageClass `local-path` mặc định, `WaitForFirstConsumer`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s22 | Pod nháp `scratch` có `emptyDir` dùng chung giữa hai container (một ghi, một đọc); PV `shop-data` hostPath trên `cka-w2` (1Gi, `ReadWriteOnce`, `storageClassName: manual`) và PVC `shop-data` khớp; Pod `pvc-probe` ghim `cka-w2` ghi một tệp, xoá rồi tạo lại Pod, đọc lại; ghi `PVC_REUSE_CONTENT` vào `answers.env`. Tình huống hỏng: PVC đòi `ReadWriteMany` hoặc 2Gi → Pending, đọc Events, sửa. Xoá `scratch`, `pvc-probe` | PV và PVC Bound với nhau, đúng dung lượng/access mode/storageClassName; tệp trên hostPath của `cka-w2` có nội dung người học ghi; `PVC_REUSE_CONTENT` khớp nội dung đó; Pod nháp không còn |
| s23 | Cài local-path-provisioner từ manifest ghim phiên bản; đặt `local-path` làm StorageClass mặc định (annotation); PVC `wffc-lab` đứng Pending tới khi có Pod, ghi `WFFC_REASON` (Event `WaitForFirstConsumer`); xoá PVC động → PV bị xoá theo (`Delete`); làm lại với PV đổi sang `Retain` → PV `Released`; `kubectl get pv --sort-by=.spec.capacity.storage`; dọn PV Released nháp | Provisioner Available; đúng một StorageClass mặc định và là `local-path` với `WaitForFirstConsumer`; PV `shop-data` có `Retain`; `WFFC_REASON` đúng; không còn PVC/PV nháp |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s21 --yes` (từ `st3-done`). Nợ đo đợt 2, theo thứ tự, dừng ở dấu hiệu hết giờ đầu tiên: `restore cka s20 --yes` → `verify cka s20`; chạy `s20/apply.sh` lần hai → verify; `begin cka s21` → verify đỏ → `begin cka s21` lần nữa (đường `check.sh`) → `apply` → xanh; `restore cka s14 --yes` → `verify cka s14`. Ghi kết quả vào báo cáo; lỗi tìm thấy thì sửa trong commit riêng `fix(practice): cka đợt 2 theo đo trên VM`.
- [ ] **Bước 2:** `restore cka s21 --yes`. Từng buổi: viết `verify.sh` → chạy trên trạng thái đầu vào, mọi dòng đỏ (ghi output) → viết `apply.sh` → xanh → `apply.sh` lần hai, vẫn xanh.
- [ ] **Bước 3:** Đo RAM `cka-cp` trước/sau khi cài provisioner; ghi README.
- [ ] **Bước 4:** `down` + `up`, `verify cka s23` vẫn xanh.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi. s22: bảng các loại volume và khi nào dùng; liên hệ thư mục tạm của Spring Boot (`java.io.tmpdir`) với `emptyDir`. s23: luồng PVC → provisioner → PV, vì sao `WaitForFirstConsumer` cần cho storage cục bộ.
- [ ] **Bước 6:** `practice-published:cka` → 23; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s22–s23. `./labs/lab down cka`. Commit `feat(practice): cka chặng 4 — volume, PV/PVC, StorageClass (s22–s23)`.

### Task 2: Chặng 4 phần sau — s24, s25 và mốc `st4-done`

**Files:**
- Modify: `stage-04.js`, `program.js` (chỉ `projectMilestone` của `st4`), `skills.js`, `check-data.mjs` (→ 25), `labs/cka/milestones` (thêm `s25 st4-done`)
- Create: `labs/cka/sessions/s24`, `s25`, `labs/cka/breaks/st4-storage/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s23.
- Produces: StatefulSet `postgres` (1 replica, `postgres:17-alpine`, `nodeSelector role=db`, requests/limits khai rõ), headless Service `postgres`, PVC `data-postgres-0` từ `local-path`, PV của nó `Retain`; Secret `db-cred` thêm `DB_URL` hoặc Deployment `catalog`/`order` có `DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop`; dữ liệu mẫu trong PostgreSQL.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s24 | Viết headless Service + StatefulSet `postgres` (`volumeClaimTemplates` 1Gi, probe `pg_isready`, Secret cho mật khẩu); `kubectl exec … psql` tạo database nếu cần; thêm `DB_URL` cho `catalog`, `order`, `rollout restart`; `POST /api/orders` qua `gateway` tạo 3 đơn; xoá `postgres-0`, chờ nó trở lại, đơn hàng vẫn còn; đặt PV `data-postgres-0` sang `Retain`; thử dời node: cordon `cka-w2`, xoá Pod, đọc lý do Pending, ghi `MOVE_REASON`, uncordon; ghi `STS_POD_DNS` (FQDN của `postgres-0`) | StatefulSet ready 1/1 trên `cka-w2`, Service headless (`clusterIP: None`); PVC `data-postgres-0` Bound, PV `Retain`; `catalog`, `order` có `DB_URL` trỏ PostgreSQL và Available; bảng sản phẩm có 3 dòng, bảng đơn hàng ≥ 3 dòng (đếm bằng `psql`); `/api/products` qua `gateway` trả đủ; `cka-w2` schedulable; hai đáp án đúng |
| s25 | `setup.sh` gây lỗi chồng nhau: PVC mới `reports` (do một Deployment nháp cần) đòi StorageClass không tồn tại → Pending; `order` có `DB_URL` sai cổng hoặc sai tên host → lỗi kết nối, Pod không Ready; PVC `data-postgres-0` bị xoá cùng StatefulSet nhưng PV `Retain` còn `Released` với dữ liệu. Người học trong 20 phút: đọc Events PVC, sửa `storageClassName`; đọc log (`--all-containers`, `--previous`) tìm lỗi JDBC; gỡ `claimRef` cho PV Released, tạo lại PVC đúng tên để StatefulSet dùng lại PV cũ, dữ liệu còn đủ; `df -h` trên `cka-w2` xem thư mục local-path; ghi `PROTECTION_FINALIZER` (finalizer giữ PVC đang dùng) | Mọi PVC trong `shop` Bound, không PV `Released` nào của `shop`; `postgres-0` dùng đúng PV cũ (cùng tên PV như cuối s24); dữ liệu bằng hoặc hơn cuối s24 (sản phẩm 3, đơn ≥ 3); `order`, `catalog` Available với `DB_URL` đúng; Deployment nháp đọc ghi được PVC `reports` hoặc đã xoá cùng PVC (theo nhiệm vụ chốt); đáp án đúng |

`s25` có `check.sh` riêng (không đòi thứ sự cố đã phá). `s25/apply.sh` = `lab_break st4-storage` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s23 --yes`.
- [ ] **Bước 2:** Đo trước: PostgreSQL rảnh và khi `catalog`/`order` nối vào (`free -m` `cka-w2`, `kubectl top pod`); kiểm quota `shop` đủ chỗ (pods, requests/limits); chọn requests/limits cho postgres từ số đo, ghi README.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s24: đo thứ tự khởi động sau `down`+`up` (catalog/order lên trước postgres có tự hồi không); nếu không, thêm cách chờ hợp lý (initContainer chờ `postgres-0` hoặc dựa vào liveness) và giải thích trong nội dung. s25: sau `setup.sh` verify đỏ trong 2 phút ở mọi dòng liên quan; `run.sh` lần hai không lỗi; `begin cka s25` hai lần liền đi được.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s24: StatefulSet so với Deployment (tên ổn định, thứ tự, PVC theo Pod); HikariCP và tên DNS ổn định; vì sao local-path không cho dời node. s25: quy trình chẩn đoán lưu trữ (PVC → Events → SC/PV → node → log ứng dụng).
- [ ] **Bước 5:** `milestones` thêm `s25 st4-done`; `practice-published:cka` → 25; sửa `projectMilestone` của `st4`; CHECK, UNIT, LABTEST xanh.
- [ ] **Bước 6:** `down` + `up` → `verify cka s25` xanh. Thử chụp `st4-done` một lần (`./labs/lab snapshot`), hết giờ thì ghi lại để Task 6 chụp.
- [ ] **Bước 7:** Kiểm trình duyệt s24–s25. `./labs/lab down cka`. Commit `feat(practice): cka chặng 4 — StatefulSet PostgreSQL và sự cố lưu trữ (s24–s25)`.

### Task 3: Chặng 5 phần đầu — s26, s27, s28

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-05.js`, `skills.js`, `check-data.mjs` (→ 28)
- Create: `labs/cka/sessions/s26`, `s27`, `s28`

**Interfaces:**
- Consumes: trạng thái cuối s25.
- Produces: ba Service ClusterIP của shop khai `port`/`targetPort` có tên (`http`); Service `gateway-nodeport` (NodePort cố định, ví dụ 30180) gọi được từ máy Mac qua IP node; ConfigMap `coredns` có khối `hosts` với `db.shop.internal` trỏ ClusterIP của Service `postgres-rw` (ClusterIP thường, cùng selector với headless `postgres`, tạo ở s28 vì headless không có ClusterIP) và `fallthrough`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s26 | Chọn Pod `gateway` trên `cka-w1` và Pod `catalog` trên `cka-w2`; trên node đọc `ip route`, interface `cali*` và tunnel của Calico (implementer đo chế độ encapsulation thật: IPIP, VXLAN hay không), `calicoctl`/`kubectl get` tài nguyên Calico để xem trạng thái; `crictl inspect` lấy PID, `nsenter -n -t <pid> ip addr`; `tcpdump` trên interface tunnel hoặc `cali*` khi gọi `catalog` từ `gateway`; Pod tạm (`k-tmp-pod`) gọi IP Pod trực tiếp; đọc `/etc/cni/net.d/` và `/opt/cni/bin/`; ghi `CATALOG_POD_IP`, `CATALOG_NODE`, `TUNNEL_IFACE`, `HOST_VETH` (tên `cali*` của Pod catalog trên node), `CNI_CONF` vào `answers.env` | Mỗi đáp án khớp giá trị script tự đọc lúc chấm (IP Pod và node của một Pod `catalog` đang chạy — chấp nhận bất kỳ Pod `catalog` nào; interface tunnel đúng chế độ đo được; `HOST_VETH` là interface có route tới IP đó trên node đó; tệp CNI đúng tên); cluster không đổi so với cuối s25 (ba Deployment + postgres Available) |
| s27 | Viết lại ba Service bằng YAML (`--dry-run=client -o yaml`, sửa `targetPort` tên `http`, thêm tên cổng ở Deployment); Service `gateway-nodeport` NodePort cố định; gọi từ máy Mac `curl http://<IP cka-w1>:<nodePort>/api/products`; đọc EndpointSlice; tìm chuỗi rule `KUBE-SVC-…`/`KUBE-SEP-…` của Service `catalog` bằng `iptables-save`, ghi `KUBE_SVC_CHAIN`; đọc `kube-proxy` mode từ ConfigMap, ghi `PROXY_MODE`; tạo Service `LoadBalancer` nháp, thấy `EXTERNAL-IP <pending>`, ghi `LB_EXTERNAL_IP_STATE`, xoá. Tình huống hỏng: `targetPort` sai số → EndpointSlice có địa chỉ nhưng gọi bị từ chối | Ba Service đúng port 8080 và `targetPort` theo tên cổng tồn tại trong Pod; số địa chỉ EndpointSlice ready bằng số replica; `gateway-nodeport` đúng nodePort và gọi từ máy Mac trả 200 với 3 sản phẩm (verify chạy `curl` từ Mac); `KUBE_SVC_CHAIN` khớp chuỗi thật hiện hành; `PROXY_MODE=iptables`; Service nháp không còn |
| s28 | Từ Pod tạm phân giải `catalog`, `catalog.shop`, `catalog.shop.svc.cluster.local`, đọc `/etc/resolv.conf` (search, `ndots`); `dig @<ClusterIP kube-dns>` từ node; đọc Corefile; tạo Service `postgres-rw`; thêm khối `hosts` cho `db.shop.internal` vào ConfigMap `coredns`, `rollout restart` CoreDNS (hoặc chờ `reload`), phân giải từ Pod `order`; Pod nháp `dnspolicy-lab` với `dnsPolicy: None` + `dnsConfig`; ghi `NDOTS`, `KUBE_DNS_IP`. Tình huống hỏng: Pod với `dnsPolicy: Default` không phân giải được tên Service | CoreDNS Available, Corefile có `hosts` chứa `db.shop.internal` đúng IP `postgres-rw` và `fallthrough`; `postgres-rw` có endpoint `postgres-0`; tra `db.shop.internal` từ một Pod của shop ra đúng IP; hai đáp án đúng; Pod nháp không còn; shop vẫn Available |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s25 --yes`.
- [ ] **Bước 2:** Đo trước cho s26: chế độ encapsulation của Calico, tên interface tunnel, `tcpdump` có sẵn trên node không (cài trong apply nếu thiếu — ghi rõ), cách lấy PID container bằng `crictl`. Ghi vào báo cáo trước khi viết nhiệm vụ.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s27: verify `curl` từ máy Mac tới IP node (đo thật, giới hạn thời gian). s28: sau `down`+`up` khối `hosts` còn nguyên (ConfigMap bền) và tra cứu vẫn đúng.
- [ ] **Bước 4:** Nội dung đầy đủ ba buổi. s26 khối `foundation` về network namespace/veth (trỏ bài chặng 0); s27 nối kube-proxy với load balancer phía client của Spring Cloud; s28 nối `ndots:5` với độ trễ phân giải của JVM và `networkaddress.cache.ttl`.
- [ ] **Bước 5:** `practice-published:cka` → 28; CHECK, UNIT, LABTEST xanh; `down`+`up` → `verify cka s28` xanh; kiểm trình duyệt s26–s28. `./labs/lab down cka`. Commit `feat(practice): cka chặng 5 — mạng Pod, Service, CoreDNS (s26–s28)`.

### Task 4: Chặng 5 giữa — s29, s30

**Files:**
- Modify: `stage-05.js`, `skills.js`, `check-data.mjs` (→ 30)
- Create: `labs/cka/sessions/s29`, `s30`

**Interfaces:**
- Consumes: trạng thái cuối s28.
- Produces: ingress-nginx (namespace `ingress-nginx`, NodePort cố định http/https), IngressClass `nginx`, Secret TLS `shop-tls` (tự ký, CN/SAN `shop.local`), Ingress `shop` (`shop.local`, path `/api` Prefix → `gateway`, path `/orders` Exact hoặc Prefix theo bài → `gateway`); CRD Gateway API kênh standard, NGINX Gateway Fabric, GatewayClass của nó, Gateway `shop-gw`, HTTPRoute `shop` (theo quyết định của plan về `gateway-v1`).

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s29 | Cài ingress-nginx từ manifest ghim (không dùng Helm: Helm thuộc chặng 7), NodePort cố định, controller đặt trên `cka-cp` nếu được; `kubectl create ingress … $do` sinh YAML rồi sửa; thêm `shop.local` vào `/etc/hosts` của `cka-cp` (và hướng dẫn người học thêm trên Mac); `openssl req -x509` tạo chứng chỉ, `kubectl create secret tls shop-tls`; Ingress có `tls`; `curl -H 'Host: shop.local'` và `curl --resolve` https từ máy Mac; ghi `PATH_EXACT_RESULT` (mã HTTP khi gọi `/orders/1` với Exact). Tình huống hỏng: Ingress thiếu `ingressClassName` → không controller nào nhận, không có ADDRESS | controller Available; IngressClass `nginx`; Ingress `shop` đúng class, host, hai path và pathType, có `tls` với `shop-tls`; Secret TLS có SAN `shop.local`; từ máy Mac http và https (`-k` hoặc `--cacert`) tới `shop.local/api/products` trả 200 (verify gọi từ Mac); đáp án đúng |
| s30 | Cài CRD Gateway API standard ghim phiên bản và NGINX Gateway Fabric (NodePort cố định khác s29); đọc GatewayClass; Gateway `shop-gw` listener http cho `shop.local`; HTTPRoute `shop` tương đương path `/api` của s29; Deployment + Service `gateway-v1` (`:1.0`); chia `backendRefs` weight 90/10; gọi 100 lần từ Mac đếm `version` trong `/api/info`, ghi `V1_HITS`; đọc `status.conditions` (`Accepted`, `Programmed`, `ResolvedRefs`), ghi `ROUTE_BAD_REASON` khi cố ý trỏ backend sai tên. Tình huống hỏng: HTTPRoute `parentRefs` sai tên Gateway → không `Accepted` | CRD có đủ (`gateways`, `httproutes` v1); Gateway `shop-gw` `Programmed=True`; HTTPRoute `Accepted=True`, `ResolvedRefs=True`, đúng hostname/path; weights theo trạng thái cuối đã chốt; gọi từ Mac qua NodePort của Gateway trả 200; `V1_HITS` trong 3–20; `ROUTE_BAD_REASON` đúng chuỗi lý do; Ingress của s29 vẫn phục vụ |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s28 --yes`.
- [ ] **Bước 2:** Tra phiên bản hiện hành (ingress-nginx bản cuối, Gateway API standard, NGINX Gateway Fabric tương thích Kubernetes 1.36), kiểm image arm64, ghi nguồn. Đo RAM trước/sau mỗi controller.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s30: đo RAM sau khi thêm `gateway-v1`; áp quyết định của plan (giữ 90/10 hay về một backend) và ghi số đo vào README.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s29 nối `X-Forwarded-*` với `server.forward-headers-strategy` của Spring Boot; nói rõ ingress-nginx đã dừng bảo trì. s30 so Ingress với Gateway API (vai trò hạ tầng/ứng dụng, GatewayClass/Gateway/Route), chia canary như rollout ở s14 nhưng theo lưu lượng.
- [ ] **Bước 5:** `practice-published:cka` → 30; CHECK, UNIT, LABTEST xanh; `down`+`up` → `verify cka s30` xanh; kiểm trình duyệt s29–s30. `./labs/lab down cka`. Commit `feat(practice): cka chặng 5 — Ingress và Gateway API (s29–s30)`.

### Task 5: Chặng 5 cuối — s31, s32 và mốc `st5-done`

**Files:**
- Modify: `stage-05.js`, `skills.js`, `check-data.mjs` (→ 32), `labs/cka/milestones` (thêm `s32 st5-done`)
- Create: `labs/cka/sessions/s31`, `s32`, `labs/cka/breaks/st5-network/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s30.
- Produces: NetworkPolicy trong `shop`: `default-deny` (ingress + egress), `allow-dns-egress`, và các policy mở đúng luồng ở "Quyết định của plan"; mọi đường gọi từ Mac (NodePort s27, Ingress s29, Gateway s30) vẫn chạy.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s31 | Trước khi chặn, từ Pod tạm ở `default` gọi `catalog` thành công; `default-deny`; thấy mọi thứ hỏng (kể cả DNS); mở egress DNS (namespaceSelector `kube-system` + podSelector `k8s-app: kube-dns`, cổng 53 UDP/TCP); mở từng luồng bằng podSelector/namespaceSelector; kiểm bằng `nc -zv -w 2` từ đúng Pod nguồn; ghi `DEFAULT_NS_TO_CATALOG` (kết quả sau khi chặn: `blocked`). Tình huống hỏng: viết `from` hai phần tử thay vì một phần tử có cả `namespaceSelector` và `podSelector` → mở rộng hơn ý muốn; giải thích AND/OR | Có `default-deny` chọn mọi Pod với cả hai `policyTypes`; có policy egress DNS; thử thật: Pod tạm trong namespace tạm của verify (spec 8.4) tới `catalog` bị chặn; `kubectl exec` vào Pod thật (không giả nhãn): `gateway` → `catalog:8080` mở, `catalog` → `order:8080` chặn, `order` → `postgres:5432` mở, `order` phân giải DNS được; ba đường từ Mac trả 200; HPA `catalog` còn số liệu; ba Deployment + postgres Available; đáp án đúng |
| s32 | `setup.sh` gây lỗi nhiều tầng: Service `catalog` selector lệch nhãn (EndpointSlice rỗng); Service `order` `targetPort` sai; một NetworkPolicy chặn ingress controller → `gateway` (shop.local trả 503/504); CoreDNS mất khối `hosts` hoặc `order` mất readiness vì lý do mạng (implementer chọn lỗi thứ tư quan sát được và không trùng s21/s25). Người học trong 25 phút dùng Pod `netshoot` (image ghim, arm64) thử từng chặng, `kubectl get endpointslice`, jsonpath cổng Service; ghi `FIRST_BROKEN_HOP` | Mọi dòng của `s31/verify.sh` lại xanh (gọi lại `facts.sh` của s31 hoặc chép dòng); Pod `netshoot` đã xoá; đáp án đúng |

`s32` có `check.sh` riêng. `s32/apply.sh` = `lab_break st5-network` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s30 --yes`.
- [ ] **Bước 2:** Đo trên Calico trước khi viết s31: probe của kubelet và scrape của metrics-server có còn chạy dưới `default-deny` không; ingress-nginx và NGINX Gateway Fabric gọi `gateway` từ namespace nào, nhãn gì. Ghi số đo.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s32: sau `setup.sh` verify đỏ trong 2 phút; `run.sh` lần hai không lỗi; `begin cka s32` hai lần liền đi được.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s31: ngữ nghĩa NetworkPolicy (cộng dồn, không có deny tường minh, AND/OR trong `from`), nối với security group và nguyên tắc least privilege của một service Spring. s32: quy trình theo thứ tự endpoints → selector/nhãn → targetPort → Pod Ready → NetworkPolicy → DNS.
- [ ] **Bước 5:** `milestones` thêm `s32 st5-done`; `practice-published:cka` → 32; CHECK, UNIT, LABTEST xanh.
- [ ] **Bước 6:** `down` + `up` → `verify cka s32` xanh. Thử chụp `st5-done` một lần.
- [ ] **Bước 7:** Kiểm trình duyệt s31–s32. `./labs/lab down cka`. Commit `feat(practice): cka chặng 5 — NetworkPolicy và sự cố mạng (s31–s32)`.

### Task 6: Nghiệm thu đợt 3 và tài liệu

**Files:**
- Modify: `labs/cka/README.md` (mốc snapshot, bảng `setup.sh`/`check.sh`, lỗi có chủ ý của hai break, thời gian selftest, phiên bản thành phần mới và nguồn, số đo bộ nhớ cuối chặng 5, NodePort đã dùng), `webapp/README.md` và `README.md` nếu có con số buổi đã phát hành

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s21 --yes` (từ `st3-done`), `./labs/lab selftest cka --from s22 --yes`: s22 → s32 xanh, chụp `st4-done`, `st5-done` nếu chưa có. Không `destroy`. Ghi tổng thời gian và số tiêu chí từng buổi vào README.
- [ ] **Bước 2:** `restore cka s24 --yes` (từ `st3-done`) → `verify cka s24` xanh; `restore cka s29 --yes` (từ `st4-done`) → xanh.
- [ ] **Bước 3:** `free -m` ba VM ở cuối s32 sau 5 phút nghỉ; `journalctl -k | grep -i oom` rỗng; ghi README.
- [ ] **Bước 4:** `multipass list`: `cp1`, `w1`, `w2` còn nguyên và Stopped.
- [ ] **Bước 5:** Trình duyệt: trang chủ `cka` báo 32/53, độ phủ domain storage/networking đổi đúng; đi trọn s24 như người học (ba bước, tick, gợi ý, ghi chú, hoàn thành, sang s25 thấy câu ôn); hai theme, màn hẹp 380px; trang `ssia` không đổi.
- [ ] **Bước 6:** CHECK, UNIT, LABTEST xanh. `./labs/lab down cka`. Commit `docs(practice): cka đợt 3 — README, mốc snapshot, thời gian selftest`.

---

## Các đợt sau (không thuộc plan này)

Đợt 4: chặng 6 Bảo mật truy cập + chặng 8 Vận hành cluster (+ chặng 7 Helm/Kustomize/CRD). Đợt 5: chặng 9 + hai đề mock. Cùng khuôn với plan này.
