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

`milestones`: `s05 st0-done`, `s09 st1-done`, `s16 st2-done`, `s21 st3-done`. Snapshot được chụp lúc VM đã dừng, nên khi khôi phục:

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

Lỗi có chủ ý: `breaks/st1-node-notready/run.sh` — `cka-w1`: `/etc/default/kubelet` ghi đè `--config` bằng đường dẫn không tồn tại; `cka-w2`: kubelet `stop` + `disable`. Hai worker `NotReady` sau khoảng một phút.

`breaks/st2-pods-broken/run.sh` — sửa `~/shop/{catalog,order,gateway}.yaml` bằng PyYAML (tệp phải là đúng một Deployment; comment mất) rồi apply: catalog tag `1.1` không có (ImagePullBackOff), order `secretKeyRef` khoá `DB_PASS` (CreateContainerConfigError), gateway `JAVA_OPTS` nối hai cờ bằng NBSP U+00A0 (JVM `Unrecognized VM option 'UseSerialGC -XX:MaxRAMPercentage=60'`, CrashLoopBackOff); Pod lẻ `report-once` (`restartPolicy: Never`) gọi `/api/oders` → 404, `Failed`, exit 1. Chạy lại được: đặt lại đúng bốn lỗi. Rollout kẹt nhưng Pod cũ vẫn phục vụ (`maxUnavailable` 0).

`breaks/st3-pending/run.sh` — sửa `~/shop/{order,gateway,quota}.yaml` bằng PyYAML rồi apply: order `nodeSelector: {disktype: ssd}` (không node nào có nhãn đó), gateway `requests.memory`/`limits.memory` 1900Mi, `shop-quota` `requests.memory: 1Gi` (dưới mức đang dùng); `kubectl cordon cka-w1`; Pod `batch-7f` ở `default` (busybox `while :`, `limits.cpu: 500m`, đo 488m trong `kubectl top`). Với quota 3Gi của s18, gateway 1900Mi không bao giờ Pending: 1280Mi đang dùng + 1900Mi > 3072Mi nên ReplicaSet chỉ báo `FailedCreate`; "Insufficient memory" được cho thấy bằng Pod thử `mem-probe` ở `default`. Chạy lại được: Pod `batch-7f` đang `Running`/`Pending` thì giữ nguyên, đã dừng (`restartPolicy: Never`, sau khi VM khởi động lại) thì xoá và tạo lại.

## Thời gian selftest

`./labs/lab destroy cka --yes && ./labs/lab selftest cka --yes` từ VM sạch, s01 → s09, gồm hai lần chụp snapshot: **12 phút 4 giây** (s01 11/11, s02 8/8, s03 6/6, s04 9/9, s05 5/5, s06 39/39, s07 8/8, s08 10/10, s09 8/8) (2026-11-13, máy Mac Apple Silicon 16 GB RAM; VM mới nên kéo image Kubernetes và Calico từ Internet).

Đợt 2 (s10 → s21), 2026-11-15: không `destroy`; `restore cka s09 --yes` (mốc `st1-done`) rồi `./labs/lab selftest cka --from s10 --yes`, chụp `st2-done` sau s16 và `st3-done` sau s21. s01–s09 và `labs/lib` không đổi kể từ lần nghiệm thu đợt 1 nên không chạy lại. Lần chạy thứ nhất dừng ở s14 sau **5 phút 38 giây** (s10 12/12, s11 13/13, s12 14/14, s13 14/14; apply s14: vòng curl có 1 dòng `000` trên 268 trong lúc rollout); chạy tiếp `selftest cka --from s14 --yes`: **25 phút 31 giây**, gồm hai lần chụp snapshot (s14 7/7, s15 7/7, s16 8/8, s17 7/7, s18 7/7, s19 5/5, s20 7/7, s21 7/7). Tổng s10 → s21 khoảng **31 phút**. Mỗi lần chụp snapshot (dừng ba VM, chụp, bật lại) mất khoảng 5 phút.

Vòng curl của s14 đòi mọi dòng mã 200. Với vòng cũ (`curl -m 2` mỗi 0,2 giây, chỉ in mã HTTP), khi máy Mac chạy thêm việc nặng khác (đã đo: ba tiến trình `node`/`tsc` của dự án khác mỗi cái 100–170% CPU, load cka-cp 13, PSI CPU trong VM avg300 tới 59%), JVM gateway trả lời chậm hơn 2 giây, probe 3 giây cũng hết giờ, và vòng curl có vài dòng `000` lẻ (đo: 1/268, rồi 3/435). Vì thế vòng curl nay dùng `-m 5` và in thêm mã thoát của curl (`-w '%{http_code} %{exitcode}'`): `000 28` là hết giờ (máy nghẽn), `000 7` là bị từ chối kết nối (Pod rời EndpointSlice chậm, lỗi thật của rollout). `apply.sh` của s14 đo lại một lần (về 1.0 rồi lên 2.0) nếu lần đầu có dòng lỗi; người học vẫn bị chấm chặt trên log của mình. Probe của Pod có `timeoutSeconds: 3`, nên khi phản hồi chậm quá 3 giây Pod tự rời EndpointSlice và lỗi vẫn hiện: lúc đó chạy lại s14 khi máy rảnh.

## Tài nguyên máy Mac

Ba VM cần khoảng 7 GB RAM thật. Khi máy Mac thiếu RAM và phải đẩy bộ nhớ VM ra swap, control plane không ổn định. Đã gặp: `kubeadm init` hết giờ ở `wait-control-plane`, apiserver báo `etcd-readiness failed`, `multipass exec` báo `ssh connection failed: Timeout connecting`. Tắt bớt ứng dụng nặng trước khi chạy chặng 1 trở đi. Bộ nhớ trong VM ở trạng thái cuối chặng 1 (cluster 3 node, Calico, static pod `web-static`; đo lúc VM đã chạy 4 phút sau `restore cka s09`), `free -m`: `cka-cp` dùng 919 MB, còn 2036 MB available trên tổng 2956 MB; `cka-w1` dùng 410 MB, còn 1544 MB available trên 1955 MB; `cka-w2` dùng 390 MB, còn 1564 MB available trên 1955 MB. Journal kernel không có dòng OOM nào, PSI memory bằng 0. Hai worker 2 GB còn dư cho shop ở chặng 2.

Bộ nhớ ở cuối chặng 2 (ba service có probe, gateway 2 replica, DaemonSet log-agent, đo sau `apply` s15 ngày 2026-11-14), `free -m`: `cka-cp` dùng 1022 MB, còn 1934 MB available trên 2956 MB; `cka-w1` dùng 1008 MB, còn 947 MB available trên 1955 MB; `cka-w2` dùng 779 MB, còn 1175 MB available trên 1955 MB. Lúc ba JVM khởi động cùng lúc trên worker 2 vCPU (load cka-cp tới 13), Spring Boot mất tới 93 giây mới lên (`Started CatalogApplication in 59.984 seconds (process running for 93.439)`): lý do startupProbe của s13 cho 150 giây và liveness/readiness `timeoutSeconds: 3`. Khi máy Mac phải đẩy bộ nhớ VM ra swap, liveness vẫn có thể giết JVM đang bị treo (đã thấy ba Pod restart cùng lúc, exit 143): đó là nghẽn của máy, không phải lỗi của bài.

Bộ nhớ ở cuối chặng 3 (cuối s21: ba Deployment, gateway 2 replica, catalog 2 replica dưới HPA, metrics-server, log-agent; đo lúc VM đã chạy 5 phút sau lần bật lại của snapshot `st3-done`, 2026-11-15), `free -m`: `cka-cp` dùng 977 MB, còn 1978 MB available trên 2956 MB; `cka-w1` dùng 762 MB, còn 1193 MB available trên 1955 MB; `cka-w2` dùng 954 MB, còn 1000 MB available trên 1955 MB. `journalctl -k | grep -i oom` rỗng trên cả ba VM. Máy Mac 16 GB lúc đó: swap 6,0/7,2 GB. Trong lúc chạy chặng 3 (Task 4), apiserver của cka-cp khởi động lại nhiều lần khi máy Mac thiếu bộ nhớ (restart count 6 trong 25 phút); trong selftest đợt 2 swap của máy xuống còn 570 MB trống lúc chụp `st2-done` rồi hồi lại.

Sau `down` + `up` ở cuối s21: `verify cka s21` 7/7 ngay lần đầu, mất 4 phút 16 giây (phần lớn là chờ JVM Available).

## Requests/limits của shop (chặng 3)

Số đo ngày 2026-11-14 trên trạng thái cuối s15/s16 (chưa có limit; JVM chạy `-XX:MaxRAMPercentage=75` của image nên heap được phép tới ~1,4 GB trên worker 2 GB): `memory.current` của cgroup mỗi Pod 204–249 MiB lúc rảnh, 204–268 MiB (đỉnh 278 MiB) sau 3000 request `GET /api/products` qua gateway. `free -m` lúc đó: `cka-w1` dùng 1023 MB, còn 931 MB available; `cka-w2` dùng 857 MB, còn 1097 MB. Allocatable của mỗi worker: 2 CPU, 1899736Ki.

Thí nghiệm `oom-lab` (`shop/catalog:1.0`, limit 384Mi, `/internal/alloc`): `-Xmx384m` → OOMKilled 137 ở lần alloc 220 MB sau 100 MB; không `JAVA_OPTS` (75%, heap 288 MiB) → OOMKilled ở alloc 250 MB; `-XX:MaxRAMPercentage=50` (heap 192 MiB) → JVM ném `OutOfMemoryError`, container sống, `memory.peak` 320 MiB. Non-heap của một service shop vì thế cỡ 130–140 MiB; `verify` của s17 đòi heap tối đa chừa ≥ 128 MiB dưới limit.

| | requests.cpu | requests.memory | limits.memory | `JAVA_OPTS` |
|---|---|---|---|---|
| gateway (×2) | 100m | 256Mi | 384Mi | `-XX:MaxRAMPercentage=50` |
| catalog (×2) | 200m | 256Mi | 384Mi | như trên |
| order (×1) | 100m | 256Mi | 384Mi | như trên |
| init `wait-catalog` của gateway | 10m | 16Mi | 32Mi | — |

Không đặt `limits.cpu` (QoS Burstable, tránh CFS throttling lúc JVM khởi động). Sau s17, `describe node cka-w1`: requests cpu 550m (27%), memory 512Mi (27%), limits memory 768Mi (41%); `free -m`: `cka-w1` còn 1168 MB available, `cka-w2` (ba JVM) còn 978 MB.

s18: `shop-quota` `pods 20`, `requests.cpu 2`, `requests.memory 3Gi`, `limits.memory 5Gi` (used sau s17: 8 Pod, 700m, 1280Mi, 1920Mi); `shop-limits` (Container) `defaultRequest` 50m/64Mi, `default` memory 128Mi, `max` memory 2Gi, không giới hạn CPU. Bài vượt quota chạy trên namespace nháp `quota-lab` (busybox, quota `pods=2`) để không bật thêm JVM trên hai worker. Chỗ còn trong quota cho HPA của s20: 1300m `requests.cpu` (6 replica catalog 200m) và 1792Mi `requests.memory` (7 replica 256Mi), trừ đi Pod surge, Pod của CronJob và log-agent nếu được tạo lại — vẫn nhiều hơn RAM thật của hai worker cho phép; `maxReplicas` của s20 phải chọn theo `free -m`. LimitRange có `defaultRequest.cpu`, nên một Deployment nháp "thiếu requests.cpu" trong `shop` sẽ nhận 50m: tình huống HPA `<unknown>` của s20 chạy ở namespace nháp `hpa-lab` (người học tạo rồi xoá; `apply.sh` của s20 cũng vậy).

Sau khi VM khởi động lại (`down` + `up`), năm JVM cùng khởi động trên hai worker: khi máy Mac đang đẩy bộ nhớ VM ra swap (đã đo: swap 6,2/7 GB), Pod mất hơn 4 phút mới Available và startupProbe/liveness có thể giết một lượt. `verify` của s17–s19 và s21 vì thế chờ tối đa ~6 phút trước khi kiểm (s16: 4 phút). Hạn tính theo đồng hồ (`date +%s`), không theo số vòng: mỗi lệnh `kubectl` trong vòng chờ có `--request-timeout=10s` (`/readyz` 5 giây), lệnh lỗi hay hết giờ được coi là "chưa sẵn sàng", nên khi apiserver quá tải verify vẫn dừng chờ trong khoảng thời gian đã in ra (vượt tối đa ~10 giây).

## metrics-server và HPA (s20)

metrics-server **v0.9.1** (`components.yaml` của release, image `registry.k8s.io/metrics-server/metrics-server:v0.9.1`), thêm `--kubelet-insecure-tls`: kubelet của kubeadm dùng chứng chỉ serving tự ký không có IP SAN (log: `x509: cannot validate certificate for 192.168.252.36 because it doesn't contain any IP SANs`). Sau khi VM khởi động lại, `kubectl top nodes` có số sau khoảng một phút; `verify` của s20 chờ chung tối đa ~10 phút (Deployment, rồi `top` có số cho cả ba node, rồi số CPU của HPA). Node chưa có metrics hiện `<unknown>` trong `kubectl top nodes`, nên chỉ đếm dòng có số.

HPA catalog: min 2, **max 3**, CPU 60%, `behavior.scaleDown.stabilizationWindowSeconds: 60`. Đo ngày 2026-11-15 với một vòng `wget …/internal/burn?ms=100; sleep 0.2`: `cpu: 81%/60%` ở 2 replica → 3 replica sau 100 giây, Pod thứ ba Available sau 68 giây nữa; `free -m` lúc 3 replica: `cka-w1` dùng 960 MB, còn 995 MB available; `cka-w2` dùng 957 MB, còn 997 MB. Ngừng tải → về 2 sau 93 giây. Chọn 3 chứ không 4 vì máy Mac lúc đo đã dùng 6,9 GB swap và apiserver khởi động lại một lần trong lúc chạy tải. JVM khởi động (sau khi VM bật) cũng đủ đưa HPA lên 3 trong 75 giây mà không có tải.

## Storage (s22–s23)

s22: PV `shop-data` tạo tay (hostPath `/mnt/shop-data`, `type: DirectoryOrCreate`, 1Gi, RWO, `storageClassName: manual`, `Retain`, `nodeAffinity` ghim `cka-w2`) + PVC `shop/shop-data`, cả hai trong `~/shop/shop-data.yaml`. Không có đối tượng StorageClass `manual`: PVC sai (RWX, 2Gi) đứng Pending với Event `ProvisioningFailed … storageclass.storage.k8s.io "manual" not found` (đo 2026-11-15), cả khi chưa có PV lẫn khi PV đã `Available`. Sửa PVC Pending bằng `apply` bị từ chối (`spec is immutable after creation except resources.requests and volumeAttributesClassName for bound claims`): phải xoá rồi tạo lại. `verify` đọc `probe.txt` thẳng trên đĩa của cka-w2 theo đường dẫn trong PV.

s23: local-path-provisioner **v0.0.37** (bản phát hành không phải RC mới nhất, 2026-08-05, theo GitHub releases API; manifest `deploy/local-path-storage.yaml` của tag; image `docker.io/rancher/local-path-provisioner:v0.0.37` có arm64 theo Docker Hub). Manifest gốc không có nodeSelector/toleration và helper Pod dùng `docker.io/library/busybox` không tag: lab thêm `nodeSelector: node-role.kubernetes.io/control-plane: ""` + toleration control plane (Pod chạy trên cka-cp) và ghim helper `busybox:1.37` (image đã có trên các node). StorageClass `local-path` (`WaitForFirstConsumer`, `Delete`) đặt mặc định bằng annotation. PV động: hostPath `/opt/local-path-provisioner/pvc-<uid>_<ns>_<pvc>` trên node mà scheduler chọn cho Pod (annotation `volume.kubernetes.io/selected-node`), nodeAffinity ghim node đó; helper Pod chạy trên node chứa volume. `Delete` xoá cả thư mục; PV đổi sang `Retain` thì `Released` và thư mục còn, `apply.sh` xoá PV và thư mục.

RAM khi cài provisioner (đo 2026-11-15, cuối s22 → sau s23, `free -m` trên cka-cp): trước dùng 991 MB, còn 1964 MB available; sau dùng 1014 MB, còn 1942 MB. `kubectl top`: Pod provisioner 15m CPU, 9Mi. Manifest không khai requests nên Allocated resources của cka-cp không đổi (cpu 1100m, memory 240Mi requests). Worker không thêm gì thường trực.

