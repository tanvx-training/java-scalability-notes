# Thực hành CKA — đợt 4 (chặng 6 Bảo mật truy cập, chặng 7 Helm/Kustomize/CRD, chặng 8 Vận hành cluster) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phát hành 13 buổi `s33`–`s45` của chương trình `cka` (nội dung đầy đủ + script lab chạy thật trên 3 VM), nâng số buổi học được từ 32 lên 45.

**Architecture:** Cùng khuôn đợt 3: bảng "người học làm / `verify.sh` kiểm" → script đỏ rồi xanh trên VM thật → nội dung đầy đủ trong `stage-06.js`/`stage-07.js`/`stage-08.js` → tăng `practice-published:cka` → `selftest`. Ba buổi sự cố dùng `labs/cka/breaks/<id>/run.sh`. Thêm ba mốc snapshot `st6-done` (s36), `st7-done` (s40, cũng là mốc "trước nâng cấp" của spec 8.3), `st8-upgraded` (s42, mốc "trước etcd"), `st8-done` (s45).

**Tech Stack:** bash 3.2 (macOS) + Multipass 1.16.3, Kubernetes 1.36 kubeadm nâng lên 1.37 ở s42, Calico 3.33, containerd 2.2.1, `openssl`, Helm (bản hiện hành, ghim), Kustomize trong kubectl, cert-manager (chart ghim), etcd/`etcdctl`/`etcdutl` khớp phiên bản etcd của kubeadm, ứng dụng `shop`, dữ liệu ES module của `webapp/`.

**Spec:** `docs/superpowers/specs/2026-11-13-practice-module-cka-design.md` (mục 5.4, 7.1, 7.2, 7.4, 7.5, 8.3, 8.4, 11, 12). Plan đợt 3 làm mẫu: `docs/superpowers/plans/2026-11-15-practice-cka-wave3.md`. Ghi chú lab: `labs/cka/README.md`. Khung 13 buổi (tiêu đề, goals, skills, uses, stateIn/stateOut) đã có ở `webapp/js/data/practice/cka/stage-06.js`, `stage-07.js`, `stage-08.js`.

## Global Constraints

- Nhánh `feat/practice-cka-wave4` từ `main`. Không push, không merge.
- **An toàn VM (spec A3):** VM `cp1`, `w1`, `w2` có sẵn trên máy không được bật, tắt, sửa, chụp, xoá. Mọi lệnh vào VM đi qua `./labs/lab …` hoặc hàm `vm`/`mp` của `labs/lib/multipass.sh`. Không đụng container hay tiến trình OrbStack/Java của người dùng. Không `./labs/lab destroy`, không `selftest` thiếu `--from`.
- **Cổng máy chủ (thay luật swap của đợt 3):** trước khi bật VM `memory_pressure` báo trống ≥ 45% và tải 1 phút < 5, chờ tối đa 10 phút. **Cửa sổ khởi động:** sau `up`/`restore` tải trong VM tự nhiên 30–60 khoảng 10 phút; chỉ chấm khi `kubectl get --raw /readyz` = `ok` và tải VM < 4; đỏ trong cửa sổ đó không tính. **Luật dừng:** tải Mac > 10 kéo dài quá 10 phút, hoặc `multipass exec`/kubectl hết giờ lặp lại → commit phần đã đo, `./labs/lab down cka` (chạy lần hai nếu `cka-w2` hết giờ QEMU), báo BLOCKED. Lệnh dài ghi log ra tệp trong scratchpad. Không nối `restore` và `selftest` bằng `;`: chỉ chạy bước sau khi bước trước trả 0. Kết thúc task: `./labs/lab down cka`.
- bash trong `labs/` chạy được với `/bin/bash` 3.2. `labs/lib/` không chứa chuỗi `cka` hay `kubernetes`. Không sửa `labs/lib/`, `labs/lab`, `webapp/js/views/`, `webapp/js/lib/`; nếu buộc phải sửa thì báo lại.
- Không sửa buổi đã phát hành `s01`–`s32`, trừ lỗi thật tìm thấy khi chạy; ghi rõ trong báo cáo, commit riêng `fix(practice): …`.
- **Id bất biến:** id buổi, nhiệm vụ, kỹ năng, chặng giữ nguyên. Được sửa `title`, `goals`, `stateIn`, `stateOut`, `durationMin`, `label` kỹ năng, `projectMilestone`, và **thêm** id đã có vào `uses`. Mọi kỹ năng trong `skills` của buổi phải được luyện thật trong buổi.
- **Trạng thái chấm phải bền:** `verify.sh` của buổi N là `check` của buổi N+1 và phải đạt sau `./labs/lab down` + `up`. Thứ không bền (Event, trạng thái release giữa chừng, kết quả vòng request) chấm qua tệp trong `~/drills/<id>/` (`answers.env`, log do script cho sẵn ghi) hoặc `check.sh` riêng.
- **Quy ước giữ nguyên từ đợt 2–3:** manifest người học ở `~/shop/` (chỉ manifest, `k apply -f ~/shop/` chạy được), cấu hình ở `~/shop/config/`, bài nháp và đáp án ở `~/drills/<id>/`; buổi có câu trả lời có `setup.sh` tạo `~/drills/<id>` và xoá `answers.env` cũ; dữ kiện thu trong một lần gọi VM (`files/facts.sh`); vòng chờ giới hạn theo đồng hồ, kubectl có `--request-timeout`, lệnh lỗi là "chưa sẵn sàng", dòng "đã xoá" đỏ khi `get` lỗi; ước lượng thời gian in ra đúng trường hợp chậm nhất; chờ sau khi VM khởi động lại dùng `labs/cka/sessions/s26/files/wait.sh` (Pod Ready sau giờ boot của `cka-cp`), không viết bản thứ tư; lệnh nhiều dấu nháy trong template literal viết bằng YAML khối `|` và kiểm bằng `node -e`.
- `verify.sh` không sửa trạng thái buổi học tạo ra (ngoại lệ namespace tạm, spec 8.4).
- Mỗi dòng `verify.sh` **đỏ trên trạng thái đầu vào** (đo thật, ghi báo cáo) và có ít nhất một phép thử "làm lỏng" cho thấy verify không bị qua mặt (ví dụ cấp quyền rộng hơn yêu cầu phải đỏ); mọi yêu cầu của nhiệm vụ có dòng chấm.
- Mỗi buổi 60–90 phút, đủ mọi khối spec 5.4, có ít nhất một tình huống hỏng, `outcome.verifyOutput` chép từ output thật, `refs` có ít nhất một tài liệu trong app (kiểm id thật) và trang kubernetes.io (hoặc helm.sh, cert-manager.io, etcd.io cho phần tương ứng). Phần Tư duy nối Java/Spring khi tự nhiên (keystore/truststore và mTLS ở s33, Spring profile so với overlay ở s38, `@ConfigurationProperties` so với values ở s37, graceful shutdown khi drain ở s41).
- Văn bản tiếng Việt, xưng "bạn", giữ thuật ngữ tiếng Anh của Kubernetes.
- **Tài nguyên:** cuối s32 phần trống đo được là `cka-cp` 1679 MB, `cka-w1` 1004 MB, `cka-w2` 927 MB. Mỗi thành phần mới (Helm component s37, Pod `shop-dev` s38, cert-manager s39, replica thêm s41) đo `free -m` và `kubectl describe node` trước và sau, ghi README. Thành phần hạ tầng đặt trên `cka-cp` (toleration control plane + nodeSelector) khi chart cho phép.
- Image và binary ngoài `shop/*` (helm, chart, cert-manager, etcd tools nếu cần) ghim phiên bản, có bản arm64; implementer tra bản hiện hành lúc làm và ghi nguồn vào README.
- Lệnh: **CHECK** `webapp/scripts/build-content.sh webapp/content && node webapp/scripts/check-data.mjs`; **UNIT** `node --test "webapp/scripts/tests/*.test.mjs"`; **LABTEST** `/bin/bash labs/tests/run.sh`.
- Commit tiếng Việt kiểu `feat(practice): …`, kết thúc bằng dòng attribution của phiên.

### Quyết định của plan (khác khung hiện có)

- **Kiểm quyền bằng danh tính thật.** Verify của s34–s36 gọi `kubectl --kubeconfig /home/ubuntu/{dev,ops}.kubeconfig auth can-i …` (và một lệnh `get` thật), không dùng `--as`, để chấm cùng lúc cert, kubeconfig và binding. Mỗi vai có dòng "không được" (dev không đọc node, không đụng `kube-system`; ops không `create`/`delete`/`patch` gì) để quyền quá rộng bị đỏ.
- **s35 ServiceAccount của `order`:** SA `order`, Role chỉ `get`/`watch`/`list` ConfigMap theo `resourceNames` của ConfigMap mà `order` dùng (implementer đọc tên thật), `automountServiceAccountToken` giữ mặc định. Chart ở s37 phải giữ `serviceAccountName: order`.
- **s37 Helm nhận lại đối tượng đang chạy (adoption), không xoá rồi cài.** Chart `~/charts/shop` gồm Deployment + Service ClusterIP của `gateway`, `gateway-v1`, `catalog`, `order`, ConfigMap của chúng, HPA `catalog`, SA/Role/RoleBinding của `order`. **Ngoài chart:** StatefulSet/Service `postgres`, `postgres-rw`, Secret `db-cred`, NetworkPolicy, `gateway-nodeport`, Ingress, Gateway/HTTPRoute, ResourceQuota/LimitRange. Selector của Deployment phải giữ nguyên (bất biến). Người học gắn nhãn `app.kubernetes.io/managed-by=Helm` và annotation `meta.helm.sh/release-name=shop`, `meta.helm.sh/release-namespace=shop` rồi `helm install`; phần Tư duy nói cách "xoá rồi cài" và cái giá (gián đoạn). Tệp manifest của các đối tượng đã vào chart chuyển sang `~/shop/pre-helm/` để `k apply -f ~/shop/` không giành quyền với Helm. Component cài từ repo công khai: chart nhẹ có image arm64, đặt trên `cka-cp`, không thay hạ tầng đang chạy (implementer chọn, ví dụ `podinfo` hay `kube-state-metrics`; ghi lý do và RAM).
- **s38 Kustomize gọn để vừa RAM:** base chỉ có `catalog` (chế độ H2, không `DB_URL`) + Service + `configMapGenerator`; overlay `dev` (namespace `shop-dev`, 1 replica, tag `1.0`, memory limit nhỏ nhất `catalog` chạy được — đo), overlay `prod` (2 replica, tag `2.0`) chỉ build bằng `kubectl kustomize`, không apply.
- **s39 operator là cert-manager** cài bằng Helm (chart ghim, `crds.enabled=true`, controller/webhook/cainjector trên `cka-cp`); `Issuer` tự ký + `Certificate` `shop-local` cho `shop.local` trong `shop`, Secret riêng `shop-local-cm-tls` (không thay `shop-tls` của s29). CRD tự viết `shopfeatures.shop.example.com` (namespaced, `v1`, có schema, hai resource).
- **s40 hai release hỏng:** `shop` failed sau một lần `helm upgrade --wait` với values xấu; release component của s37 kẹt `pending-upgrade` (run.sh dừng một lần upgrade giữa chừng). Cách gỡ `pending-upgrade` dạy theo đúng hành vi Helm đo được (rollback hay xoá Secret release mới nhất); ghi số đo.
- **s41 drain không mất request:** trên đường gọi NodePort 30180 mỗi service `gateway`, `catalog`, `order` có ≥ 2 replica trải hai worker (anti-affinity hoặc topologySpread qua values của chart) và PDB `minAvailable: 1` (`catalog-pdb` theo khung, thêm `gateway-pdb`, `order-pdb`). Vòng request là script cho sẵn `~/drills/s41/loop.sh` (2 request/giây tới 30180, ghi log); verify đọc log: 0 lỗi trong lúc drain `cka-w1`. Nếu RAM không đủ cho 2 replica mỗi service thì dừng và báo kèm số đo, không hạ tiêu chí.
- **s42 nâng 1.36 → 1.37 và giới hạn của lưu trữ cục bộ:** drain `cka-cp` làm các controller ghim `cka-cp` (ingress-nginx, NGF, cert-manager) tạm Pending, nên vòng request của s42 đi qua NodePort 30180. Drain `cka-w2` buộc `postgres-0` ngừng (PV local-path ghim node, bài s24). Tiêu chí: 0 lỗi trong lúc nâng `cka-cp` và `cka-w1` (log riêng); nâng `cka-w2` sau, lỗi trong cửa sổ đó được phép và người học ghi `W2_OUTAGE_SECONDS`. Sửa goal thứ hai và `stateOut` của s42, và `projectMilestone` của `st8` cho khớp ("app không gián đoạn trừ lúc nâng node giữ PostgreSQL").
- **s43 etcd:** người học tạo ConfigMap `before-snapshot`, chụp `/opt/backup/etcd.db`, tạo ConfigMap `after-snapshot`, xoá Deployment `order`, khôi phục vào `/var/lib/etcd-restore`, sửa manifest static pod. Verify: snapshot hợp lệ (`etcdutl snapshot status`), manifest etcd trỏ `/var/lib/etcd-restore` (cả `--data-dir` và hostPath), `order` Available, có `before-snapshot`, không có `after-snapshot`, Helm release `shop` vẫn `deployed`. `apply.sh` chạy lại được: nếu etcd đã chạy từ `/var/lib/etcd-restore` với đúng dấu hiệu thì bỏ qua.
- **s44 gia hạn:** `setup.sh` ghi mốc giờ vào `~/drills/s44/started` (vì `kubeadm upgrade apply` ở s42 đã tự gia hạn); verify: mọi chứng chỉ kubeadm có `notBefore` sau mốc đó, apiserver đang phục vụ đúng cert trên đĩa (so fingerprint qua `openssl s_client`), `~/.kube/config` dùng client cert của `admin.conf` mới, kubeconfig dev/ops của s34 vẫn dùng được.
- **s45 break không được làm etcd chạy trên data-dir rỗng hoặc cũ** (mất hay lùi dữ liệu cluster): lỗi etcd phải làm etcd không lên (ví dụ hostPath trỏ vào một tệp thường), đo thật. Lỗi kubelet: `cka-w2` về kubelet 1.36 (vẫn Ready vì nằm trong version skew) — tiêu chí là ba node cùng minor 1.37.
- **Mốc snapshot:** `milestones` thêm `s36 st6-done`, `s40 st7-done`, `s42 st8-upgraded`, `s45 st8-done`. Trước khi chụp mỗi mốc kiểm dung lượng đĩa trống của máy Mac (`df -h ~`), ghi README.
- **Nợ đợt 3 (M9)** ở Task 1 bước 1: chụp lại `st1-done`, `st2-done` có `tcp_mtu_probing` (restore mốc, chạy `sessions/s28/files/node-net.sh` trên ba node như `s06/apply.sh`, `snapshot cka <tên>`); máy không đủ yên thì ghi chưa làm.

## Review Focus

- VM khởi động lại giữa hai buổi, nhất là sau nâng cấp (s42+) và sau khôi phục etcd (s43+): `verify` chờ có giới hạn (`s26/files/wait.sh`), không đỏ giả; kubeconfig dev/ops và release Helm vẫn đúng.
- `restore` đi qua mốc mới: `restore cka s41` (từ `st7-done`, cluster 1.36), `restore cka s45` (từ `st8-upgraded`, chạy lại s43 khôi phục etcd và s44 gia hạn); mỗi `apply.sh` chạy hai lần liền vẫn xanh (CSR đã duyệt, release đã có, node đã ở 1.37, etcd đã ở data-dir mới).
- Người học làm đúng nhưng khác đường: `kubectl certificate approve` hay duyệt bằng YAML; `helm upgrade --install` thay `install`; patch Kustomize kiểu strategic merge hay JSON 6902; `etcdutl` thay `etcdctl snapshot restore`: verify chấm trạng thái, không chấm cách làm.
- Quyền quá rộng hoặc qua mặt: dev là `cluster-admin`, ops có `*` verbs, RoleBinding gắn `system:authenticated`, chart cài bằng tên release khác, Certificate Ready nhưng Secret sai tên: mỗi trường hợp phải đỏ.
- `begin` chạy lại trên buổi sự cố đang sửa dở (s36, s40, s45): `run.sh` lần hai không hỏng thêm, mỗi buổi sự cố có `check.sh` riêng không đòi thứ sự cố đã phá; s45 không bao giờ để etcd lên với dữ liệu rỗng.

---

### Task 1: Chặng 6 phần đầu — s33, s34 (và nợ M9)

**Files:**
- Modify: `webapp/js/data/practice/cka/stage-06.js`, `skills.js` (chỉ label/uses nếu cần), `webapp/scripts/check-data.mjs` (`practice-published:cka` → 34)
- Create: `labs/cka/sessions/s33`, `s34`

**Interfaces:**
- Consumes: trạng thái cuối s32 (mốc `st5-done`).
- Produces: trên `cka-cp` `/home/ubuntu/users/dev.{key,crt}` (CN `dev`, O `shop-dev`), `ops.{key,crt}` (CN `ops`, O `shop-ops`) do CA cluster ký; CSR `dev`, `ops` Approved; `/home/ubuntu/dev.kubeconfig`, `/home/ubuntu/ops.kubeconfig` nhúng cert, context mặc định namespace `shop` (dev) và `default` (ops), server `https://192.168.252.35:6443`, quyền tệp 600 chủ `ubuntu`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s33 | Đọc cert apiserver bằng `openssl x509 -noout -text` (issuer, SAN, hạn), `kubeadm certs check-expiration`; tạo key + CSR cho dev/ops (`openssl req -subj "/CN=dev/O=shop-dev"`); CertificateSigningRequest YAML (`signerName: kubernetes.io/kube-apiserver-client`, `usages: [client auth]`, `expirationSeconds`), approve, lấy cert bằng jsonpath + `base64 -d`; ghi `APISERVER_SANS`, `CERT_GROUP_FIELD` (trường chứa group: `O`). Tình huống hỏng: CSR thiếu `usages` hoặc sai `signerName` → không cấp cert | Bốn tệp tồn tại; cert ký bởi CA cluster (`openssl verify -CAfile /etc/kubernetes/pki/ca.crt`); CN/O đúng; key khớp cert (so modulus/pubkey); CSR `dev`, `ops` có điều kiện Approved; hai đáp án đúng |
| s34 | `kubectl config set-cluster/set-credentials --embed-certs/set-context` với `--kubeconfig` riêng; `config view --minify`; `use-context`; làm việc qua `--kubeconfig` mà `~/.kube/config` không đổi; đọc kubeconfig lạ trong `~/drills/s34/stranger.kubeconfig` (setup.sh tạo), ghi `STRANGER_SERVER`, `STRANGER_USER`, `STRANGER_NS`. Tình huống hỏng: quên `--embed-certs` rồi chép tệp đi chỗ khác | Hai kubeconfig: một cluster/user/context, cert nhúng (không đường dẫn), server đúng, namespace mặc định đúng, quyền 600; gọi API bằng chúng xác thực được (lệnh `get` trả `Forbidden` có tên user `dev`/`ops`, không phải `Unauthorized`); `~/.kube/config` vẫn là admin; ba đáp án đúng |

- [ ] **Bước 1:** `./labs/lab up cka`. Nợ M9 khi máy yên (tổng ~30–40 phút): `restore cka s09` → `node-net.sh` ba node → `snapshot cka st1-done`; như vậy cho `s16`/`st2-done`. Ghi README; không đủ yên thì ghi chưa làm.
- [ ] **Bước 2:** `./labs/lab restore cka s32 --yes` (từ `st5-done`). Từng buổi: viết `verify.sh` → chạy trên trạng thái đầu vào, mọi dòng đỏ (ghi output) → viết `apply.sh` → xanh → `apply.sh` lần hai, vẫn xanh. s33 `apply.sh` lần hai không tạo CSR trùng làm lỗi (xoá CSR cũ hoặc bỏ qua khi cert hợp lệ).
- [ ] **Bước 3:** Phép thử qua mặt: cert tự ký bằng CA khác (s33 đỏ), kubeconfig trỏ đường dẫn cert (s34 đỏ).
- [ ] **Bước 4:** `down` + `up`, `verify cka s34` vẫn xanh.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi. s33 khối `foundation` về chuỗi chứng chỉ (trỏ `net-tls-chain`), nối keystore/truststore và mTLS của Spring; s34 cấu trúc kubeconfig, vì sao nhúng cert.
- [ ] **Bước 6:** `practice-published:cka` → 34; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s33–s34. `./labs/lab down cka`. Commit `feat(practice): cka chặng 6 — PKI, CSR, kubeconfig (s33–s34)`.

### Task 2: Chặng 6 phần sau — s35, s36 và mốc `st6-done`

**Files:**
- Modify: `stage-06.js`, `check-data.mjs` (→ 36), `labs/cka/milestones` (thêm `s36 st6-done`)
- Create: `labs/cka/sessions/s35`, `s36`, `labs/cka/breaks/st6-access/run.sh`

**Interfaces:**
- Consumes: hai kubeconfig của s34.
- Produces: Role `shop-deployer` + RoleBinding `shop-dev` (group `shop-dev`, namespace `shop`); ClusterRole `shop-ops-view` + ClusterRoleBinding `shop-ops` (group `shop-ops`, chỉ `get`/`list`/`watch`, gồm node); SA `order`, Role `order-config-reader`, RoleBinding cùng tên, Deployment `order` chạy với `serviceAccountName: order`. Tệp ở `~/shop/rbac.yaml`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s35 | `create role/rolebinding/clusterrole/clusterrolebinding` sinh YAML rồi sửa; `auth can-i --as dev --as-group shop-dev` và `--list`; SA `order` + Role theo `resourceNames`; `rollout restart order`; `create token order` rồi gọi API bằng token từ một Pod tạm. Tình huống hỏng: RoleBinding trỏ `kind: User` tên `shop-dev` thay vì `Group` | Bằng kubeconfig thật: dev `create deploy`, `patch deploy`, `get pods` trong `shop` được; dev `get nodes`, mọi thao tác ở `kube-system`, `create clusterrole` không được; ops `get nodes`, `list pods -A` được; ops `delete`/`create`/`patch` không được; Pod `order` chạy với SA `order`, SA đọc được đúng ConfigMap của nó và không đọc được Secret `db-cred`; `order` Available; tệp `~/shop/rbac.yaml` khớp cluster |
| s36 | `run.sh` gây: `dev.kubeconfig` trỏ server sai cổng và cert của ops; RoleBinding `shop-ops` gắn nhầm chủ thể (User `shop-ops`). Người học trong 20 phút đọc `Forbidden`/`Unauthorized`/lỗi TLS, `auth whoami`, `describe rolebinding`, `api-resources` tìm API group; ghi `FORBIDDEN_MISSING` (verb/resource/group của một thông báo cho sẵn) | Mọi dòng của `s35/verify.sh` lại xanh (gọi lại facts của s35); kubeconfig dev nhúng đúng cert dev; đáp án đúng |

`s36` có `check.sh` riêng. `s36/apply.sh` = `lab_break st6-access` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s34 --yes`.
- [ ] **Bước 2:** Đọc tên ConfigMap mà `order` thật sự dùng và các thao tác shop cần (Deployment, Service, ConfigMap, Pod/log/exec, HPA); chọn verbs của `shop-deployer` vừa đủ, ghi lý do.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. Phép thử qua mặt: dev gắn `cluster-admin` (đỏ), ops có `*` (đỏ). s36: sau `begin` verify đỏ trong 2 phút; `run.sh` lần hai không lỗi; `begin cka s36` hai lần liền đi được.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s35: RBAC cộng dồn, Role/ClusterRole và phạm vi binding, nối với phân quyền theo vai của Spring Security; s36: quy trình đọc lỗi xác thực (401) và phân quyền (403).
- [ ] **Bước 5:** `milestones` thêm `s36 st6-done`; `practice-published:cka` → 36; CHECK, UNIT, LABTEST xanh. `down` + `up` → `verify cka s36` xanh. Thử chụp `st6-done` một lần.
- [ ] **Bước 6:** Kiểm trình duyệt s35–s36. `./labs/lab down cka`. Commit `feat(practice): cka chặng 6 — RBAC, ServiceAccount và sự cố truy cập (s35–s36)`.

### Task 3: Chặng 7 phần đầu — s37, s38

**Files:**
- Modify: `stage-07.js`, `check-data.mjs` (→ 38)
- Create: `labs/cka/sessions/s37`, `s38` (gồm `files/chart/` lời giải chuẩn của chart `shop`)

**Interfaces:**
- Consumes: trạng thái cuối s36.
- Produces: `helm` (bản ghim) trên `cka-cp`; release `shop` (namespace `shop`, chart `~/charts/shop`, `version: 0.1.0`) nhận các đối tượng ở "Quyết định của plan"; `~/charts/shop/values.yaml` có `image.tag` theo service, `replicas`, `resources`; release component công khai (tên `demo`, namespace riêng); `~/shop/pre-helm/`; `~/kustomize/shop/{base,overlays/dev,overlays/prod}`; namespace `shop-dev` chạy `catalog` 1 replica từ overlay `dev`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s37 | Cài helm; `helm repo add/search`, cài component đúng `--version` với `--set` và `-f`; `helm create` rồi gọt thành chart `shop`; `helm template` so với cluster (`kubectl diff`); gắn nhãn/annotation nhận lại; `helm install shop`; `helm upgrade` đổi một value (ví dụ replicas `gateway`) rồi xem `helm history`. Tình huống hỏng: cài khi chưa gắn annotation → lỗi "exists and cannot be imported" | Release `shop` `deployed`, chart `shop-0.1.0`, đúng namespace; mọi đối tượng trong danh sách mang annotation của release; selector Deployment không đổi; ba service + `gateway-v1` Available, `order` vẫn dùng SA `order`; `/api/products` qua 30180 trả 200 từ Mac; release `demo` `deployed` đúng phiên bản chart chỉ định và value ghi đè có hiệu lực; `~/shop/` không còn tệp của đối tượng đã vào chart |
| s38 | Base + hai overlay; `configMapGenerator` (thấy hậu tố hash, sửa literal → Pod rollout); `images`, `replicas`, `namespace`, patch; `kubectl kustomize` xem trước, `apply -k overlays/dev`; ghi `HASHED_CM_NAME`. Tình huống hỏng: patch nhắm sai tên đối tượng → lỗi build | `shop-dev` có `catalog` Available, tag `1.0`, 1 replica, ConfigMap tên có hậu tố hash và Pod đang dùng đúng ConfigMap đó; build overlay `prod` ra 2 replica, tag `2.0`, namespace khác `shop-dev` (verify tự build); `HASHED_CM_NAME` khớp; shop vẫn Available |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s36 --yes`.
- [ ] **Bước 2:** Tra bản helm hiện hành (ghi nguồn, arm64), chọn component s37, đo RAM trước/sau; đo memory limit nhỏ nhất `catalog` H2 chạy ổn cho s38.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. Phép thử qua mặt: release tên khác (đỏ), overlay dev apply nhầm vào `shop` (đỏ).
- [ ] **Bước 4:** `down` + `up` → `verify cka s38` xanh.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi. s37: values so với `@ConfigurationProperties`/profile, adoption so với xoá-rồi-cài; s38: overlay so với Spring profile, vì sao hash ConfigMap gây rollout.
- [ ] **Bước 6:** `practice-published:cka` → 38; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s37–s38. `./labs/lab down cka`. Commit `feat(practice): cka chặng 7 — Helm và Kustomize (s37–s38)`.

### Task 4: Chặng 7 phần sau — s39, s40 và mốc `st7-done`

**Files:**
- Modify: `stage-07.js`, `check-data.mjs` (→ 40), `labs/cka/milestones` (thêm `s40 st7-done`)
- Create: `labs/cka/sessions/s39`, `s40`, `labs/cka/breaks/st7-helm/run.sh`

**Interfaces:**
- Consumes: release `shop`, `demo` của s37.
- Produces: CRD `shopfeatures.shop.example.com` với hai ShopFeature trong `shop`; cert-manager (release `cert-manager`, namespace `cert-manager`); `Issuer` `selfsigned` và `Certificate` `shop-local` (Secret `shop-local-cm-tls`) trong `shop`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s39 | Viết CRD (group, `names`, `scope: Namespaced`, `versions[].schema`), tạo hai resource, `kubectl explain shopfeature.spec`, `api-resources --namespaced`; cài cert-manager bằng Helm, tạo Issuer + Certificate, đọc `status.conditions`; ghi `CERT_MANAGER_CRDS` (số CRD `*.cert-manager.io`). Tình huống hỏng: tạo resource sai schema → bị từ chối | CRD Established, namespaced, có schema; hai ShopFeature; cert-manager ba Deployment Available trên `cka-cp`; Certificate `Ready=True`, Secret `shop-local-cm-tls` có SAN `shop.local`; `shop-tls` của s29 không đổi; đáp án khớp số thật |
| s40 | `run.sh` gây hai release hỏng (Quyết định của plan). Người học trong 20 phút: `helm list -a`, `status`, `history`, `get values --revision`, log Pod mới; `rollback` `shop`; gỡ `pending-upgrade` của `demo`; `repo update`; ghi `BAD_VALUE` (key values gây lỗi) | Release `shop` `deployed`, values bằng revision tốt của s37 (so `get values -a`); không Pod nào của shop dùng image/values xấu; ba service Available; release `demo` `deployed`; đáp án đúng |

`s40` có `check.sh` riêng. `s40/apply.sh` = `lab_break st7-helm` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s38 --yes`.
- [ ] **Bước 2:** Tra bản cert-manager hiện hành tương thích 1.36/1.37 (ghi nguồn), đo RAM `cka-cp` trước/sau. Đo hành vi Helm với release `pending-upgrade` (upgrade, rollback, xoá Secret) trước khi viết s40.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s40: sau `begin` verify đỏ trong 2 phút; `run.sh` lần hai không lỗi; `begin cka s40` hai lần liền đi được.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s39: operator pattern (vòng reconcile) nối với `@Scheduled` reconcile/Kubernetes Java client; s40: quy trình chẩn đoán release.
- [ ] **Bước 5:** `milestones` thêm `s40 st7-done`; `practice-published:cka` → 40; CHECK, UNIT, LABTEST xanh. `down` + `up` → `verify cka s40` xanh. Thử chụp `st7-done` một lần.
- [ ] **Bước 6:** Kiểm trình duyệt s39–s40. `./labs/lab down cka`. Commit `feat(practice): cka chặng 7 — CRD, operator và sự cố Helm (s39–s40)`.

### Task 5: Chặng 8 phần đầu — s41, s42 và mốc `st8-upgraded`

**Files:**
- Modify: `stage-08.js`, `program.js` (chỉ `projectMilestone` của `st8`), `check-data.mjs` (→ 42), `labs/cka/milestones` (thêm `s42 st8-upgraded`), `labs/cka/README.md` (Kubernetes sau s42)
- Create: `labs/cka/sessions/s41`, `s42` (gồm `files/loop.sh` dùng chung cho hai buổi)

**Interfaces:**
- Consumes: release `shop` (values đổi replicas/affinity qua `helm upgrade`).
- Produces: PDB `gateway-pdb`, `catalog-pdb`, `order-pdb` (`minAvailable: 1`, trong chart); ba node `v1.37.x`, gói `kubeadm`/`kubelet`/`kubectl` 1.37 `hold`, repo apt trỏ `v1.37`; log vòng request `~/drills/s41/loop.log`, `~/drills/s42/loop-cp-w1.log`, `loop-w2.log`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s41 | Nâng replicas + anti-affinity qua values, PDB trong chart; chạy `loop.sh`; `cordon`, `drain cka-w1 --ignore-daemonsets --delete-emptydir-data`, thấy drain chờ PDB; `uncordon`. Tình huống hỏng: PDB `minAvailable` bằng số replica → drain treo, đọc thông báo, sửa | Ba PDB đúng; mỗi service ≥ 2 replica Ready trên hai worker; `cka-w1` schedulable, Ready; log có đoạn drain (dấu do `loop.sh` ghi khi thấy node cordon) và 0 lỗi; release `shop` `deployed` |
| s42 | Theo trang "Upgrading kubeadm clusters" 1.37: đổi repo apt, `unhold`, `kubeadm upgrade plan/apply`, drain/uncordon `cka-cp`, kubelet/kubectl; từng worker `kubeadm upgrade node`; ghi `W2_OUTAGE_SECONDS`, `SKEW_RULE`. Tình huống hỏng: quên `daemon-reload`/restart kubelet → node vẫn báo phiên bản cũ | Ba node `v1.37.x`, Ready, schedulable; static pod control plane image 1.37; gói 1.37 trên ba node và `hold`; `loop-cp-w1.log` 0 lỗi; `W2_OUTAGE_SECONDS` khớp khoảng lỗi trong `loop-w2.log` (±10 giây); shop, Ingress, Gateway trả 200 từ Mac; hai đáp án đúng |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s40 --yes`.
- [ ] **Bước 2:** Đo RAM với 2 replica mỗi service (Quyết định của plan); tra bản vá 1.37 hiện hành, kéo trước image control plane, đo thời gian nâng từng node.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. `s42/apply.sh` lần hai khi đã ở 1.37 bỏ qua nâng cấp mà vẫn xanh. `restore cka s41` (từ `st7-done`) đi được trên 1.36.
- [ ] **Bước 4:** Nội dung đầy đủ hai buổi. s41: graceful shutdown của Spring Boot và `terminationGracePeriodSeconds` khi bị evict; s42: version skew policy, thứ tự nâng, giới hạn của lưu trữ cục bộ (nối s24).
- [ ] **Bước 5:** Sửa goal/stateOut s42 và `projectMilestone` `st8` theo Quyết định của plan; `milestones` thêm `s42 st8-upgraded`; `practice-published:cka` → 42; CHECK, UNIT, LABTEST xanh. `down` + `up` → `verify cka s42` xanh. Thử chụp `st8-upgraded` một lần.
- [ ] **Bước 6:** Kiểm trình duyệt s41–s42. `./labs/lab down cka`. Commit `feat(practice): cka chặng 8 — bảo trì node và nâng cấp 1.37 (s41–s42)`.

### Task 6: Chặng 8 giữa — s43, s44

**Files:**
- Modify: `stage-08.js`, `check-data.mjs` (→ 44)
- Create: `labs/cka/sessions/s43`, `s44`

**Interfaces:**
- Consumes: cluster 1.37 cuối s42.
- Produces: `/opt/backup/etcd.db`; etcd chạy từ `/var/lib/etcd-restore`; ConfigMap `before-snapshot` trong `shop`; chứng chỉ kubeadm mới, `~/.kube/config` mới; `~/drills/s44/started`.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s43 | `etcdctl snapshot save` với endpoint và ba cert (đọc từ manifest etcd), `etcdutl snapshot status`; luồng ConfigMap/xoá `order`/khôi phục ở Quyết định của plan; theo dõi bằng `crictl ps`/`crictl logs` khi apiserver tạm mất; ghi `LOST_OBJECT` (đối tượng tạo sau snapshot). Tình huống hỏng: sửa `--data-dir` mà quên hostPath | Như Quyết định của plan; cộng: etcd và apiserver khoẻ (`/readyz`), ba node Ready, shop trả 200 từ Mac |
| s44 | `kubeadm certs check-expiration`, `kubeadm certs renew all`, khởi động lại static pod (dời manifest ra rồi vào), chép `admin.conf` vào `~/.kube/config`; vẽ HA stacked/external etcd, quorum; viết lệnh `kubeadm init --control-plane-endpoint … --upload-certs` và `join --control-plane` vào `~/drills/s44/ha.txt`; `etcdctl member list`; ghi `QUORUM_5` | Như Quyết định của plan; `ha.txt` chứa đủ cờ (`--control-plane-endpoint`, `--upload-certs`, `--control-plane`, `--certificate-key`); `QUORUM_5=3`; kubeconfig dev/ops gọi được API |

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s42 --yes` (từ `st8-upgraded`).
- [ ] **Bước 2:** Tra phiên bản etcd của kubeadm 1.37 và cách có `etcdctl`/`etcdutl` trên `cka-cp` (gói, binary ghim, hay `crictl exec` vào container etcd); ghi nguồn.
- [ ] **Bước 3:** Từng buổi như Task 1 bước 2. s43: `apply.sh` lần hai bỏ qua đúng; `down` + `up` sau khôi phục, etcd vẫn chạy từ data-dir mới. s44: phép thử qua mặt — chỉ gia hạn một cert (đỏ), gia hạn mà không khởi động lại apiserver (đỏ).
- [ ] **Bước 4:** `down` + `up` → `verify cka s44` xanh; `restore cka s44` (từ `st8-upgraded`) đi được.
- [ ] **Bước 5:** Nội dung đầy đủ hai buổi. s43: snapshot etcd so với backup database của app (PostgreSQL ở PV không nằm trong etcd); s44: hạn cert một năm, xoay cert kubelet.
- [ ] **Bước 6:** `practice-published:cka` → 44; CHECK, UNIT, LABTEST xanh; kiểm trình duyệt s43–s44. `./labs/lab down cka`. Commit `feat(practice): cka chặng 8 — etcd và chứng chỉ (s43–s44)`.

### Task 7: Chặng 8 cuối — s45 và mốc `st8-done`

**Files:**
- Modify: `stage-08.js`, `check-data.mjs` (→ 45), `labs/cka/milestones` (thêm `s45 st8-done`)
- Create: `labs/cka/sessions/s45`, `labs/cka/breaks/st8-ops/run.sh`

**Interfaces:**
- Consumes: trạng thái cuối s44.
- Produces: trạng thái cuối chặng 8 như `stateOut` của s45.

| Buổi | Người học làm | `verify.sh` kiểm |
|---|---|---|
| s45 | `run.sh` gây: `cka-w2` về kubelet 1.36 (gói `hold` ở 1.36); manifest etcd hỏng theo Quyết định của plan (etcd không lên). Người học trong 20 phút: `crictl ps -a`, `crictl logs` etcd, `journalctl -u kubelet`, `kubectl version`, `kubelet --version`, `etcdctl endpoint health`; sửa; ghi `BROKEN_COMPONENTS` | Ba node `v1.37.x` Ready, gói 1.37 `hold`; etcd chạy từ `/var/lib/etcd-restore` và khoẻ; dữ liệu đúng cuối s44 (`before-snapshot` có, `after-snapshot` không, release `shop` `deployed`); shop trả 200 từ Mac; đáp án đúng |

`s45` có `check.sh` riêng. `s45/apply.sh` = `lab_break st8-ops` rồi sửa. `run.sh` không in ra đã làm gì và chạy lại được.

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s44 --yes`.
- [ ] **Bước 2:** Đo cách gây lỗi etcd: chứng minh etcd không lên và dữ liệu không đổi sau khi sửa (đếm khoá etcd hoặc so `resourceVersion` của `before-snapshot` trước/sau). Đo cách lấy kubelet 1.36 khi repo apt đã ở 1.37.
- [ ] **Bước 3:** Như Task 1 bước 2. Sau `begin` verify đỏ trong 3 phút (apiserver mất thì facts phải báo đỏ có giới hạn, không treo); `run.sh` lần hai không lỗi; `begin cka s45` hai lần liền đi được.
- [ ] **Bước 4:** Nội dung đầy đủ: quy trình khi kubectl không dùng được (kubelet → crictl → manifest → log).
- [ ] **Bước 5:** `milestones` thêm `s45 st8-done`; `practice-published:cka` → 45; CHECK, UNIT, LABTEST xanh. `down` + `up` → `verify cka s45` xanh. Thử chụp `st8-done` một lần.
- [ ] **Bước 6:** Kiểm trình duyệt s45. `./labs/lab down cka`. Commit `feat(practice): cka chặng 8 — sự cố sau nâng cấp và khôi phục (s45)`.

### Task 8: Nghiệm thu đợt 4 và tài liệu

**Files:**
- Modify: `labs/cka/README.md` (mốc snapshot và nguồn gốc, bảng `setup.sh`/`check.sh`, lỗi có chủ ý của ba break, thời gian selftest, phiên bản helm/cert-manager/etcd tools và nguồn, Kubernetes 1.37 sau s42, số đo bộ nhớ cuối chặng 8, dung lượng đĩa snapshot), `webapp/README.md` và `README.md` nếu có con số buổi đã phát hành

- [ ] **Bước 1:** `./labs/lab up cka`, `./labs/lab restore cka s32 --yes` (từ `st5-done`); chỉ khi trả 0 và 8/8 mới `./labs/lab selftest cka --from s33 --yes`: s33 → s45 xanh, chụp lại các mốc mới. Không `destroy`. Ghi tổng thời gian và số tiêu chí từng buổi vào README.
- [ ] **Bước 2:** `restore cka s38 --yes` (từ `st6-done`) → xanh; `restore cka s44 --yes` (từ `st8-upgraded`) → xanh.
- [ ] **Bước 3:** `free -m` ba VM ở cuối s45 sau 5 phút nghỉ; `journalctl -k | grep -i oom` lần boot hiện tại rỗng; `df -h ~` trên Mac; ghi README.
- [ ] **Bước 4:** `multipass list`: `cp1`, `w1`, `w2` còn nguyên và Stopped.
- [ ] **Bước 5:** Trình duyệt: trang chủ `cka` báo 45/53, độ phủ domain architecture/troubleshooting đổi đúng; đi trọn s35 như người học (ba bước, tick, gợi ý, ghi chú, hoàn thành, sang s36 thấy câu ôn); hai theme, màn hẹp 380px; trang `ssia` không đổi.
- [ ] **Bước 6:** CHECK, UNIT, LABTEST xanh. `./labs/lab down cka`. Commit `docs(practice): cka đợt 4 — README, mốc snapshot, thời gian selftest`.

---

## Các đợt sau (không thuộc plan này)

Đợt 5: chặng 9 Troubleshooting tổng hợp (s46–s51) + hai đề mock (s52–s53). Cùng khuôn với plan này.
