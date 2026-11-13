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

## Mốc snapshot

`milestones`: `s05 st0-done`, `s09 st1-done`. Snapshot được chụp lúc VM đã dừng, nên khi khôi phục:

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

Lỗi có chủ ý: `breaks/st1-node-notready/run.sh` — `cka-w1`: `/etc/default/kubelet` ghi đè `--config` bằng đường dẫn không tồn tại; `cka-w2`: kubelet `stop` + `disable`. Hai worker `NotReady` sau khoảng một phút.

## Thời gian selftest

`./labs/lab destroy cka --yes && ./labs/lab selftest cka --yes` từ VM sạch, s01 → s09, gồm hai lần chụp snapshot: **12 phút 4 giây** (s01 11/11, s02 8/8, s03 6/6, s04 9/9, s05 5/5, s06 39/39, s07 8/8, s08 10/10, s09 8/8) (2026-11-13, máy Mac Apple Silicon 16 GB RAM; VM mới nên kéo image Kubernetes và Calico từ Internet).

## Tài nguyên máy Mac

Ba VM cần khoảng 7 GB RAM thật. Khi máy Mac thiếu RAM và phải đẩy bộ nhớ VM ra swap, control plane không ổn định. Đã gặp: `kubeadm init` hết giờ ở `wait-control-plane`, apiserver báo `etcd-readiness failed`, `multipass exec` báo `ssh connection failed: Timeout connecting`. Tắt bớt ứng dụng nặng trước khi chạy chặng 1 trở đi. Bộ nhớ trong VM ở trạng thái cuối chặng 1 (cluster 3 node, Calico, static pod `web-static`; đo lúc VM đã chạy 4 phút sau `restore cka s09`), `free -m`: `cka-cp` dùng 919 MB, còn 2036 MB available trên tổng 2956 MB; `cka-w1` dùng 410 MB, còn 1544 MB available trên 1955 MB; `cka-w2` dùng 390 MB, còn 1564 MB available trên 1955 MB. Journal kernel không có dòng OOM nào, PSI memory bằng 0. Hai worker 2 GB còn dư cho shop ở chặng 2.
