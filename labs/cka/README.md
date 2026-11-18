# Chương trình `cka` — ghi chú bộ lab

Phần chung của bộ lệnh `lab` (cài đặt, các lệnh, hợp đồng script buổi) ở [`../README.md`](../README.md). Tệp này chỉ ghi những gì riêng của chương trình CKA.

## VM và phiên bản

| Thứ | Giá trị | Ở đâu |
|---|---|---|
| VM | `cka-cp` 2 vCPU / 3G / 20G; `cka-w1`, `cka-w2` 2 vCPU / 2G / 15G; Ubuntu 24.04 arm64 | `env.sh` |
| Kubernetes cài đặt | minor `1.36` (`K8S_INSTALL_MINOR`) từ pkgs.k8s.io, bản vá mới nhất của repo lúc chạy (1.36.6 khi soạn) | `env.sh`, `sessions/s06/files/prepare-node.sh` |
| Kubernetes của đề thi | `1.37` (`K8S_TARGET_MINOR`), dùng ở buổi nâng cấp | `env.sh` |
| containerd | gói Ubuntu (2.2.1 khi soạn), `SystemdCgroup = true` | `sessions/s05`, `sessions/s06` |
| CNI | Calico **v3.33.0**, manifest `calico.yaml` (không dùng operator); Tigera ghi là đã kiểm thử với 1.35/1.36/1.37 | `sessions/s07/apply.sh` (`CALICO_VERSION`) |
| Pod CIDR | `10.244.0.0/16` (không dùng `192.168.0.0/16` mặc định của Calico vì dải đó chứa mạng Multipass `192.168.252.0/24`); Calico tự lấy CIDR từ cấu hình kubeadm, `init-cp.sh` kiểm IPPool | `sessions/s07/apply.sh` |
| Service CIDR | mặc định của kubeadm `10.96.0.0/12` | — |
| kube-proxy | chế độ mặc định của kubeadm (`mode: ""` trong ConfigMap `kube-proxy`), tức **iptables**: log ghi `Using iptables Proxier`, rule Service đọc được bằng `sudo iptables -t nat -S \| grep <service>` (kiểm trên cluster lab 1.36.6 ngày 2026-11-14) | — |
| Image ứng dụng | nạp vào namespace containerd `k8s.io` (`LAB_CTR_NAMESPACE`), nơi kubelet tìm image | `env.sh` |

## Mốc snapshot

`milestones`: `s05 st0-done`, `s09 st1-done`, `s16 st2-done`, `s21 st3-done`, `s25 st4-done`. Snapshot được chụp lúc VM đã dừng, nên khi khôi phục:

- `restore` áp lại `apply.sh` của chính buổi mốc (container `catalog` chạy bằng `ctr` của s05 không bền qua lần tắt VM; khôi phục `st1-done` thì s09 gây lỗi rồi sửa lại).
- Snapshot có trên cả ba VM (2026-11-15): `st0-done`, `st1-done`, `st2-done`, `st3-done` (hai mốc sau chụp trong selftest đợt 2). `restore` tới s10–s15 đi từ `st1-done` (áp s09 rồi từng buổi), tới s16–s20 đi từ `st2-done` (áp s16 rồi từng buổi), tới s21 từ `st3-done` (áp lại s21: gây sự cố st3-pending rồi sửa). Đo: `restore cka s09` (từ `st1-done`) 5 phút 45 giây; `restore cka s14` (từ `st1-done`, áp s09…s14) 16 phút 24 giây tới bước vòng curl của s14.
- Cluster kubeadm tự lên lại sau khi khởi động: kubelet `enabled`, control plane là static pod. `verify` của s07–s09 chờ có giới hạn (apiserver `/readyz` tối đa 120 giây, node Ready tối đa 180 giây) trước khi kiểm.

## Buổi có `setup.sh` / `check.sh`

| Buổi | Tệp | Làm gì |
|---|---|---|
| s02 | `setup.sh` | đặt `~/drills/s02/broken.yaml` |
| s05 | `check.sh` | chỉ kiểm phần bền của s01–s04 |
| s06 | `setup.sh` | thêm swapfile `/swap.img` 512 MiB và dòng fstab (dùng TAB như bộ cài Ubuntu), vì VM Multipass mặc định không có swap |
| s06 | `check.sh` | chỉ kiểm phần bền của chặng 0 (không đòi container `catalog`) |
| s09 | `setup.sh` | `lab_break st1-node-notready` (không in ra đã làm gì) |
| s11 | `check.sh` | như `verify.sh` của s10 nhưng chỉ đòi `POD_IP` trong `answers.env` là một IPv4: Pod lẻ `catalog` được dựng lại sandbox sau khi VM khởi động lại nên IP có thể đổi |
| s12, s13, s15 | `setup.sh` | tạo `~/drills/<buổi>`, xoá `answers.env` cũ: các đáp án của ba buổi này là giá trị cố định, làm lại buổi trên cùng VM thì phải đo lại |
| s16 | `setup.sh` | xoá `~/drills/s16/answers.env` cũ, rồi `lab_break st2-pods-broken` (không in ra đã làm gì) |
| s17, s18, s19 | `setup.sh` | xoá `~/drills/<buổi>/answers.env` cũ: làm lại buổi thì đáp án phải đo lại |
| s20 | `setup.sh` | tạo `~/drills/s20` (t1 tải manifest vào đó), xoá `~/drills/s20/answers.env` cũ |
| s21 | `check.sh` | như `verify.sh` của s20 nhưng bỏ dòng "shop-quota đủ chỗ cho catalog ở maxReplicas": sự cố st3-pending hạ quota nên dòng đó đỏ suốt buổi; nhờ vậy `begin cka s21` chạy lại được giữa buổi (gây lại sự cố, xoá đáp án cũ) mà không phải restore. Quota do verify của s21 chấm |
| s21 | `setup.sh` | tạo `~/drills/s21`, xoá `~/drills/s21/answers.env` cũ, rồi `lab_break st3-pending` (không in ra đã làm gì) |
| s22, s23 | `setup.sh` | tạo `~/drills/<buổi>`, xoá `answers.env` cũ |
| s24 | `setup.sh` | tạo `~/drills/s24`, xoá `answers.env` cũ |
| s25 | `check.sh` | chỉ phần của cuối s24 mà sự cố st4-storage không phá: lớp mặc định local-path, còn PV Retain của `shop/data-postgres-0` ghim cka-w2, Service `postgres` headless, `~/shop/postgres.yaml` có StatefulSet, catalog có `DB_URL`, cka-w2 schedulable và chỉ nó mang `role=db`, đáp án s24. Nhờ vậy `begin cka s25` chạy lại được giữa buổi (đo: hai lần liền, và cả sau khi người học lỡ apply postgres.yaml trước khi giải phóng PV) |
| s25 | `setup.sh` | tạo `~/drills/s25`, xoá `answers.env` cũ, rồi `lab_break st4-storage` (không in ra đã làm gì) |
| s26, s27, s28 | `setup.sh` | tạo `~/drills/<buổi>`, xoá `answers.env` cũ (không có sự cố gây bằng script: tình huống hỏng của ba buổi do người học tự dựng trên Service/Pod nháp) |

Lỗi có chủ ý: `breaks/st1-node-notready/run.sh` — `cka-w1`: `/etc/default/kubelet` ghi đè `--config` bằng đường dẫn không tồn tại; `cka-w2`: kubelet `stop` + `disable`. Hai worker `NotReady` sau khoảng một phút.

`breaks/st2-pods-broken/run.sh` — sửa `~/shop/{catalog,order,gateway}.yaml` bằng PyYAML (tệp phải là đúng một Deployment; comment mất) rồi apply: catalog tag `1.1` không có (ImagePullBackOff), order `secretKeyRef` khoá `DB_PASS` (CreateContainerConfigError), gateway `JAVA_OPTS` nối hai cờ bằng NBSP U+00A0 (JVM `Unrecognized VM option 'UseSerialGC -XX:MaxRAMPercentage=60'`, CrashLoopBackOff); Pod lẻ `report-once` (`restartPolicy: Never`) gọi `/api/oders` → 404, `Failed`, exit 1. Chạy lại được: đặt lại đúng bốn lỗi. Rollout kẹt nhưng Pod cũ vẫn phục vụ (`maxUnavailable` 0).

`breaks/st3-pending/run.sh` — sửa `~/shop/{order,gateway,quota}.yaml` bằng PyYAML rồi apply: order `nodeSelector: {disktype: ssd}` (không node nào có nhãn đó), gateway `requests.memory`/`limits.memory` 1900Mi, `shop-quota` `requests.memory: 1Gi` (dưới mức đang dùng); `kubectl cordon cka-w1`; Pod `batch-7f` ở `default` (busybox `while :`, `limits.cpu: 500m`, đo 488m trong `kubectl top`). Với quota 3Gi của s18, gateway 1900Mi không bao giờ Pending: 1280Mi đang dùng + 1900Mi > 3072Mi nên ReplicaSet chỉ báo `FailedCreate`; "Insufficient memory" được cho thấy bằng Pod thử `mem-probe` ở `default`. Chạy lại được: Pod `batch-7f` đang `Running`/`Pending` thì giữ nguyên, đã dừng (`restartPolicy: Never`, sau khi VM khởi động lại) thì xoá và tạo lại.

`breaks/st4-storage/run.sh` — cần một PV `Retain` từng giữ `shop/data-postgres-0` (cuối s24), không có thì dừng không gây gì. Sửa `DB_URL` trong `~/shop/order.yaml` (PyYAML) sang cổng 5433 rồi apply (Pod mới CrashLoopBackOff, Pod cũ vẫn chạy vì rolling update); ghi `~/shop/reports.yaml` (PVC `reports` 256Mi `storageClassName: fast-ssd` không tồn tại + Deployment `reports` busybox ghi `/reports/heartbeat.log`, readiness `test -s`) và apply (PVC Pending `ProvisioningFailed … "fast-ssd" not found`, Pod Pending `pod has unbound immediate PersistentVolumeClaims`); xoá StatefulSet `postgres` rồi PVC `data-postgres-0` (PV sang `Released`, dữ liệu còn ở cka-w2). Chạy lại được: PVC `reports` đã sửa sang lớp khác thì xoá Deployment và PVC rồi tạo lại bản lỗi; PV `Delete` mà người học lỡ tạo cho `data-postgres-0` bị xoá theo PVC. Đo: `begin cka s25` 7 giây, `verify` ngay sau đó 0/6 trong 4 giây (không chờ khi sự cố còn).

## PostgreSQL (s24–s25)

Image **`postgres:17.12-alpine3.24`** (tag bản vá mới nhất của PostgreSQL 17 trên Docker Hub ngày 2026-11-16, có `arm64/v8`, 115 MB nén; `PG_VERSION=17.12` trong container). App đã thử với `postgres:17-alpine` (`app/README.md`); lab ghim bản vá. StatefulSet `postgres` 1 replica, `nodeSelector: role=db` (cka-w2), `POSTGRES_USER`/`POSTGRES_PASSWORD` từ `db-cred`, `POSTGRES_DB=shop`, `PGDATA=/var/lib/postgresql/data/pgdata`, readiness/liveness `pg_isready -h 127.0.0.1 -U shop -d shop`, `volumeClaimTemplates` `data` 1Gi từ lớp mặc định. Lần đầu (kéo image + initdb) `postgres-0` Ready sau 65 giây.

RAM (đo 2026-11-15/16): `postgres-0` 76Mi ngay khi catalog/order nối vào, 33Mi lúc rảnh (`kubectl top`), `memory.peak` cgroup 53 MiB sau seed với 26 kết nối Hikari. Lab đặt requests 100m/128Mi, limits memory 256Mi. Quota `shop` sau s24: pods 9/20, `requests.cpu` 800m/2, `requests.memory` 1408Mi/3Gi, `limits.memory` 2176Mi/5Gi. `describe node cka-w2`: requests cpu 850m (42%), memory 1096Mi (59%), limits memory 1408Mi (75%). `free -m` cka-w2: trước 985 MB available, sau 924 MB; cka-w1 1176 MB. s25 thêm Deployment `reports` (busybox, 10m/16Mi/32Mi).

`DB_URL=jdbc:postgresql://postgres-0.postgres.shop.svc.cluster.local:5432/shop` là env thẳng trong `~/shop/{catalog,order}.yaml` (không ở Secret, để sự cố s25 sửa được riêng order); verify của s24, `check.sh` và verify của s25 đều chấp nhận cả `DB_URL` qua `secretKeyRef` vào `db-cred` (đo cả hai dạng). Sự cố st4-storage ghi đè env `DB_URL` của order thành giá trị thẳng sai cổng ở cả hai dạng. Chạy lại `begin cka s25` khi PV đã được gỡ `claimRef` (hẳn, hay chỉ `uid`) thì `run.sh` đặt lại `claimRef` trỏ PVC đã mất (uid giả, `resourceVersion: "1"`) để PV về `Released` như sự cố (đo).

Thứ tự khởi động sau `down` + `up` (đo, không có initContainer chờ): một Pod catalog lên trước `postgres-0` Ready, `schema.sql` lúc khởi động cần kết nối, Service headless chưa có bản ghi cho Pod chưa Ready → `java.net.UnknownHostException: postgres-0.postgres.shop.svc.cluster.local`, CrashLoopBackOff một lần, lần sau lên bình thường; cả ba Pod Ready khoảng 2 phút 15 giây sau khi VM chạy. Tự hồi nên không thêm initContainer; `verify` chờ tối đa ~7 phút.

Dời node (s24): gắn `role=db` cho cka-w1, cordon cka-w2, xoá `postgres-0` → `FailedScheduling: 0/3 nodes are available: 1 node(s) didn't match PersistentVolume's node affinity, 1 node(s) had untolerated taint(s), 1 node(s) were unschedulable` (Kubernetes 1.36.6; câu `volume node affinity conflict` của plan là cách ghi cũ). Không gắn nhãn cho cka-w1 thì vế của cka-w1 chỉ là `didn't match Pod's node affinity/selector` (filter nhãn chạy trước filter volume). `verify` chấm `MOVE_REASON` chứa `PersistentVolume's node affinity` và `unschedulable` (không phân biệt hoa thường), và bằng chứng bền của bước này (review Task 2, I2): Pod `postgres-0` hiện tại có `lastTransitionTime` của condition `PodScheduled=True` cách `creationTimestamp` ≥ 10 giây (đo: dời node 16 giây; xoá Pod thường 0 giây, chuỗi chép từ bài vẫn đỏ). Sau `down` + `up` Pod giữ UID và hai mốc này (kubelet khởi động lại container, không tạo Pod mới). Vì thế bước dời node phải là lần cuối xoá `postgres-0` trong s24; `apply.sh` làm nó cuối cùng và để Pod Pending 15 giây.

`created_at` là `TIMESTAMP` không múi giờ, điền bằng `CURRENT_TIMESTAMP` theo `TimeZone` của phiên (pgjdbc lấy múi giờ JVM): facts đổi bằng `created_at AT TIME ZONE current_setting('TimeZone')` trước khi so với `creationTimestamp` (UTC) của API, nên đặt `TZ`/`-Duser.timezone` cho JVM không làm sai phép so. Chấm "đã xoá postgres-0 và dữ liệu còn" (s24): `creationTimestamp` của Pod `postgres-0` phải sau `created_at` của đơn hàng thứ ba (theo id, đọc bằng `psql`); bền qua khởi động lại vì kubelet khởi động lại container chứ không tạo Pod mới. Chấm "dùng lại PV cũ" (s25): PV của `data-postgres-0` phải có trước PVC (và tên khác `pvc-<uid PVC>`), thư mục `…_shop_data-postgres-0`, `Retain`; đơn hàng cũ nhất phải có trước PVC hiện tại.

Finalizer `kubernetes.io/pvc-protection` (đo s25): PVC mà Pod duy nhất dùng nó còn Pending chưa có node bị xoá ngay; PVC đang được Pod chạy trên node dùng thì chờ Pod mất. `apply.sh` của s25 đọc finalizer trên `data-postgres-0`.

## Mạng (s26–s28)

Calico (đo 2026-11-18): IPPool `default-ipv4-ippool` `10.244.0.0/16`, `ipipMode: Always`, `vxlanMode: Never`, `blockSize: 26` (mặc định của manifest v3.33.0); tunnel `tunl0` MTU 1480; `calico_backend: bird`, nhưng route `/26` qua `tunl0` do Felix viết (`FelixConfiguration default`: `programClusterRoutes: EnabledIPIPOnly`, route `proto 80`). Khối IPAM: cka-cp `10.244.160.0/26`, cka-w1 `10.244.95.128/26`, cka-w2 `10.244.62.128/26`. Tên veth trên node: `cali` + 11 ký tự đầu SHA-1 của `<namespace>.<tên Pod>` (đo: `shop.catalog-6977c4d66f-bnmd7` → `cali599a3c2b8b4`). Node có sẵn `tcpdump`, `jq`, `dig`, `nsenter`, `crictl` (không phải cài; `apply.sh` của s26 vẫn cài `tcpdump` nếu thiếu); `/etc/cni/net.d` chỉ root đọc được (`10-calico.conflist`, `calico-kubeconfig`).

s26 không để lại trạng thái bền: verify so đáp án với giá trị đọc lúc chấm. **Sau `down` + `up` Pod giữ tên nhưng sandbox mới nhận IP mới** (đo: `catalog-6977c4d66f-bnmd7` `10.244.62.157` → `10.244.62.159`, veth giữ tên `cali599a3c2b8b4`). Vì thế `files/facts.sh` nhận `CATALOG_POD_IP` cũ khi Pod mang đúng `HOST_VETH` (theo công thức tên trên) đang chạy trên `CATALOG_NODE`, container của nó khởi động sau `mtime` của `answers.env`, và IP cũ thuộc khối IPAM của node đó (`blockaffinities`); route được kiểm tới IP hiện tại. Đáp án ghi sau lần khởi động lại mà vẫn là IP cũ thì đỏ (đo). Pod đổi hẳn (HPA, rollout ở s27) thì phải đọc lại.

kube-proxy: ConfigMap `mode: ""`, `curl localhost:10249/proxyMode` trên node trả `iptables`, log `Using iptables Proxier`. Tên chuỗi `KUBE-SVC-…` băm từ `namespace/service:tên-cổng` + giao thức: cổng không tên (do `kubectl expose` ở s11) cho `KUBE-SVC-OWLUSNPMDHU62CCK` với comment `shop/catalog cluster IP`; sau khi đặt tên `http` thành `KUBE-SVC-ITBI3OHKD3FRXPDK` (`shop/catalog:http cluster IP`). Verify s27 đọc chuỗi bằng `sudo iptables-save -t nat` trên cka-cp lúc chấm.

s27 thêm `containerPort` 8080 tên `http` vào ba Deployment (rolling update, rồi mới đổi Service sang `targetPort: http`), `~/shop/services.yaml` và `~/shop/gateway-nodeport.yaml` (NodePort **30180**; s29/s30 dùng cổng khác). Verify gọi `curl` **từ máy Mac** tới `InternalIP` của cka-w1 (đọc từ API) cổng 30180, tối đa 6 lần × 5 giây; đo: 200 với 3 sản phẩm qua cả IP của cka-cp và cka-w2. `k get --raw …/services/gateway:8080/proxy/…` vẫn chạy sau khi đặt tên cổng (apiserver nhận số hay tên). Service LoadBalancer nháp: `EXTERNAL-IP <pending>`, NodePort vẫn được cấp (đo `8080:32285/TCP`). `kubectl run --rm -i` với lệnh chạy xong ngay có lúc mất output (attach sau khi container thoát): các `apply.sh` dùng Pod `sleep` + `exec`.

CoreDNS: 2 Pod trên cka-cp, Service `kube-dns` `10.96.0.10` (`clusterDNS` trong `/var/lib/kubelet/config.yaml`), Corefile mặc định của kubeadm có `cache 30 { disable success cluster.local; disable denial cluster.local }` và `reload`. Pod của shop: `search shop.svc.cluster.local svc.cluster.local cluster.local`, `ndots:5`. kubelet `resolvConf: /run/systemd/resolve/resolv.conf` (cho `dnsPolicy: Default`). **`nslookup catalog.shop` của busybox ra IP công cộng** (`216.150.1.65`, `216.150.16.1`: `.shop` là TLD có thật trả lời mọi tên con) vì busybox hỏi nguyên tên trước; `getent hosts catalog.shop` (glibc trong Pod order, musl trong `postgres-0`) ra ClusterIP `10.101.94.107`. Verify s28 tra bằng `getent` trong `postgres-0`.

s28: Service `postgres-rw` (ClusterIP thường, ví dụ `10.101.112.159`) cùng selector `app: postgres` với headless `postgres`; khối `hosts { <IP> db.shop.internal; fallthrough }` chèn trước plugin `kubernetes` trong ConfigMap `coredns` (kubeadm quản lý, nhưng ConfigMap bền: sau `down` + `up` khối còn nguyên và tra cứu vẫn đúng, đo). Plugin `reload` áp Corefile mới sau ~40 giây tới ~1,5 phút (đo: gỡ khối, Pod order hết phân giải sau 39 giây; `apply.sh` lần hai tổng 1 phút 39 giây gồm vòng chờ reload). **`rollout restart deploy/coredns` có thể dời Pod CoreDNS sang worker** (Deployment của kubeadm không ghim cka-cp; hai Pod nằm ở cka-cp chỉ vì worker join sau `kubeadm init`), và worker phải kéo `registry.k8s.io/coredns/coredns:v1.14.2`. Ngày 2026-11-18 containerd trên cka-w1 và cka-w2 kéo **mọi** image từ `registry.k8s.io` lỗi `httpReadSeeker: failed open … cdn.registry.k8s.io … net/http: TLS handshake timeout` (lặp lại, cả `registry.k8s.io/pause:3.9`), trong khi `curl` tới cùng URL từ node trả 200 và kéo từ Docker Hub vẫn chạy: Pod CoreDNS mới ở worker đứng `ImagePullBackOff`, rollout dừng giữa chừng với một Pod cũ phục vụ. Đã sửa môi trường bằng cách chép image từ cka-cp (`ctr -n k8s.io images export` → `multipass transfer` → `images import` trên hai worker). Vì vậy `apply.sh` của s28 chờ `reload` (tối đa 180 giây) và chỉ `rollout restart` khi quá hạn; bài dạy cả hai cách và ghi rõ hệ quả này. Nguyên nhân chưa rõ (máy chủ đang quá tải khi đo); Task 4 (ingress-nginx, image ở `registry.k8s.io`) cần kiểm lại trước khi viết.

Pod nháp: `dnspolicy-lab` (`dnsPolicy: None`, nameserver `10.96.0.10`, searches `shop.svc.cluster.local svc.cluster.local`, `ndots: "2"`) và `dns-default` (`dnsPolicy: Default`: resolv.conf `nameserver 192.168.252.1` + IPv6 link-local, `catalog.shop.svc.cluster.local` NXDOMAIN). Verify đỏ khi còn một trong hai Pod (mọi namespace). Ứng dụng sau khi đặt tên cổng: HPA `catalog` vẫn có số liệu (`cpu: 14%/60%`), initContainer `wait-catalog` của gateway (gọi `catalog:8080`) không đổi; `k get --raw /api/v1/namespaces/shop/services/gateway:8080/proxy/…` (dùng trong verify các buổi trước) vẫn chạy.

