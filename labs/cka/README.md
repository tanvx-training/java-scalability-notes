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

`milestones`: `s05 st0-done`, `s09 st1-done`, `s16 st2-done`. Snapshot được chụp lúc VM đã dừng, nên khi khôi phục:

- `restore` áp lại `apply.sh` của chính buổi mốc (container `catalog` chạy bằng `ctr` của s05 không bền qua lần tắt VM; khôi phục `st1-done` thì s09 gây lỗi rồi sửa lại).
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
| s16 | `setup.sh` | xoá `~/drills/s16/answers.env` cũ, rồi `lab_break st2-pods-broken` (không in ra đã làm gì) |

Lỗi có chủ ý: `breaks/st1-node-notready/run.sh` — `cka-w1`: `/etc/default/kubelet` ghi đè `--config` bằng đường dẫn không tồn tại; `cka-w2`: kubelet `stop` + `disable`. Hai worker `NotReady` sau khoảng một phút.

`breaks/st2-pods-broken/run.sh` — sửa `~/shop/{catalog,order,gateway}.yaml` bằng PyYAML (tệp phải là đúng một Deployment; comment mất) rồi apply: catalog tag `1.1` không có (ImagePullBackOff), order `secretKeyRef` khoá `DB_PASS` (CreateContainerConfigError), gateway `JAVA_OPTS` nối hai cờ bằng NBSP U+00A0 (JVM `Unrecognized VM option 'UseSerialGC -XX:MaxRAMPercentage=60'`, CrashLoopBackOff); Pod lẻ `report-once` (`restartPolicy: Never`) gọi `/api/oders` → 404, `Failed`, exit 1. Chạy lại được: đặt lại đúng bốn lỗi. Rollout kẹt nhưng Pod cũ vẫn phục vụ (`maxUnavailable` 0).

## Thời gian selftest

`./labs/lab destroy cka --yes && ./labs/lab selftest cka --yes` từ VM sạch, s01 → s09, gồm hai lần chụp snapshot: **12 phút 4 giây** (s01 11/11, s02 8/8, s03 6/6, s04 9/9, s05 5/5, s06 39/39, s07 8/8, s08 10/10, s09 8/8) (2026-11-13, máy Mac Apple Silicon 16 GB RAM; VM mới nên kéo image Kubernetes và Calico từ Internet).

## Tài nguyên máy Mac

Ba VM cần khoảng 7 GB RAM thật. Khi máy Mac thiếu RAM và phải đẩy bộ nhớ VM ra swap, control plane không ổn định. Đã gặp: `kubeadm init` hết giờ ở `wait-control-plane`, apiserver báo `etcd-readiness failed`, `multipass exec` báo `ssh connection failed: Timeout connecting`. Tắt bớt ứng dụng nặng trước khi chạy chặng 1 trở đi. Bộ nhớ trong VM ở trạng thái cuối chặng 1 (cluster 3 node, Calico, static pod `web-static`; đo lúc VM đã chạy 4 phút sau `restore cka s09`), `free -m`: `cka-cp` dùng 919 MB, còn 2036 MB available trên tổng 2956 MB; `cka-w1` dùng 410 MB, còn 1544 MB available trên 1955 MB; `cka-w2` dùng 390 MB, còn 1564 MB available trên 1955 MB. Journal kernel không có dòng OOM nào, PSI memory bằng 0. Hai worker 2 GB còn dư cho shop ở chặng 2.

Bộ nhớ ở cuối chặng 2 (ba service có probe, gateway 2 replica, DaemonSet log-agent, đo sau `apply` s15 ngày 2026-11-14), `free -m`: `cka-cp` dùng 1022 MB, còn 1934 MB available trên 2956 MB; `cka-w1` dùng 1008 MB, còn 947 MB available trên 1955 MB; `cka-w2` dùng 779 MB, còn 1175 MB available trên 1955 MB. Lúc ba JVM khởi động cùng lúc trên worker 2 vCPU (load cka-cp tới 13), Spring Boot mất tới 93 giây mới lên (`Started CatalogApplication in 59.984 seconds (process running for 93.439)`): lý do startupProbe của s13 cho 150 giây và liveness/readiness `timeoutSeconds: 3`. Khi máy Mac phải đẩy bộ nhớ VM ra swap, liveness vẫn có thể giết JVM đang bị treo (đã thấy ba Pod restart cùng lúc, exit 143): đó là nghẽn của máy, không phải lỗi của bài.

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

s18: `shop-quota` `pods 20`, `requests.cpu 2`, `requests.memory 3Gi`, `limits.memory 5Gi` (used sau s17: 8 Pod, 700m, 1280Mi, 1920Mi); `shop-limits` (Container) `defaultRequest` 50m/64Mi, `default` memory 128Mi, `max` memory 2Gi, không giới hạn CPU. Bài vượt quota chạy trên namespace nháp `quota-lab` (busybox, quota `pods=2`) để không bật thêm JVM trên hai worker. Chỗ còn trong quota cho HPA của s20: 1300m `requests.cpu` (6 replica catalog 200m) và 1792Mi `requests.memory` (7 replica 256Mi), trừ đi Pod surge, Pod của CronJob và log-agent nếu được tạo lại — vẫn nhiều hơn RAM thật của hai worker cho phép; `maxReplicas` của s20 phải chọn theo `free -m`. LimitRange có `defaultRequest.cpu`, nên một Deployment nháp "thiếu requests.cpu" trong `shop` sẽ nhận 50m: tình huống HPA `<unknown>` của s20 cần chạy ở namespace khác (vd. `default`).

Sau khi VM khởi động lại (`down` + `up`), năm JVM cùng khởi động trên hai worker: khi máy Mac đang đẩy bộ nhớ VM ra swap (đã đo: swap 6,2/7 GB), Pod mất hơn 4 phút mới Available và startupProbe/liveness có thể giết một lượt. `verify` của s17–s19 vì thế chờ tối đa ~6 phút trước khi kiểm.
