# Kubernetes in Action, Ấn bản thứ hai (Bản dịch tiếng Việt)

Bản dịch tiếng Việt của cuốn *Kubernetes in Action, Second Edition* (Marko Lukša; Manning). Mỗi chương là một file Markdown; hình minh họa nằm trong thư mục [`images/`](images/), bản PDF gốc từng chương nằm trong [`pdf/`](pdf/).

Quy ước dịch:

- Các thuật ngữ chuyên ngành được giữ nguyên tiếng Anh (Pod, Deployment, ReplicaSet, StatefulSet, Service, Ingress, Gateway API, namespace, label, annotation, container, cluster, node, `kubectl`, v.v.).
- Toàn bộ code, lệnh, tên file, kết quả terminal được giữ nguyên bản.
- Tiêu đề mục giữ kèm nguyên văn tiếng Anh trong ngoặc đơn để đối chiếu với bản gốc.

## Mục lục

| # | Chương | File |
|---|---|---|
| 1 | Giới thiệu Kubernetes | [01-gioi-thieu-kubernetes.md](01-gioi-thieu-kubernetes.md) |
| 2 | Tìm hiểu container và các ứng dụng được container hóa | [02-tim-hieu-container-va-ung-dung-container-hoa.md](02-tim-hieu-container-va-ung-dung-container-hoa.md) |
| 3 | Triển khai ứng dụng đầu tiên trên Kubernetes | [03-trien-khai-ung-dung-dau-tien-tren-kubernetes.md](03-trien-khai-ung-dung-dau-tien-tren-kubernetes.md) |
| 4 | Khám phá Kubernetes API và mô hình đối tượng | [04-kham-pha-kubernetes-api-va-mo-hinh-doi-tuong.md](04-kham-pha-kubernetes-api-va-mo-hinh-doi-tuong.md) |
| 5 | Chạy ứng dụng với pod | [05-chay-ung-dung-voi-pod.md](05-chay-ung-dung-voi-pod.md) |
| 6 | Quản lý vòng đời của pod và sức khỏe của container | [06-quan-ly-vong-doi-pod-va-suc-khoe-container.md](06-quan-ly-vong-doi-pod-va-suc-khoe-container.md) |
| 7 | Tổ chức pod và các tài nguyên khác bằng namespace và label | [07-to-chuc-pod-va-tai-nguyen-bang-namespace-va-label.md](07-to-chuc-pod-va-tai-nguyen-bang-namespace-va-label.md) |
| 8 | Cấu hình ứng dụng với ConfigMap và Secret | [08-cau-hinh-ung-dung-voi-configmap-va-secret.md](08-cau-hinh-ung-dung-voi-configmap-va-secret.md) |
| 9 | Thêm volume cho lưu trữ, cấu hình và metadata | [09-them-volume-cho-luu-tru-cau-hinh-va-metadata.md](09-them-volume-cho-luu-tru-cau-hinh-va-metadata.md) |
| 10 | Lưu trữ dữ liệu bền vững với PersistentVolume | [10-luu-tru-du-lieu-ben-vung-voi-persistentvolume.md](10-luu-tru-du-lieu-ben-vung-voi-persistentvolume.md) |
| 11 | Expose pod bằng Service | [11-expose-pod-bang-service.md](11-expose-pod-bang-service.md) |
| 12 | Sử dụng Ingress để định tuyến lưu lượng đến Service | [12-su-dung-ingress-de-dinh-tuyen-luu-luong-den-service.md](12-su-dung-ingress-de-dinh-tuyen-luu-luong-den-service.md) |
| 13 | Định tuyến lưu lượng bằng Gateway API | [13-dinh-tuyen-luu-luong-bang-gateway-api.md](13-dinh-tuyen-luu-luong-bang-gateway-api.md) |
| 14 | Mở rộng quy mô và duy trì pod với ReplicaSet | [14-mo-rong-quy-mo-va-duy-tri-pod-voi-replicaset.md](14-mo-rong-quy-mo-va-duy-tri-pod-voi-replicaset.md) |
| 15 | Tự động hóa việc cập nhật ứng dụng với Deployment | [15-tu-dong-hoa-cap-nhat-ung-dung-voi-deployment.md](15-tu-dong-hoa-cap-nhat-ung-dung-voi-deployment.md) |
| 16 | Xử lý ứng dụng stateful với StatefulSet | [16-xu-ly-ung-dung-stateful-voi-statefulset.md](16-xu-ly-ung-dung-stateful-voi-statefulset.md) |
| 17 | Triển khai workload trên từng node với DaemonSet | [17-trien-khai-workload-tren-tung-node-voi-daemonset.md](17-trien-khai-workload-tren-tung-node-voi-daemonset.md) |
| 18 | Xử lý batch với Job và CronJob | [18-xu-ly-batch-voi-job-va-cronjob.md](18-xu-ly-batch-voi-job-va-cronjob.md) |

## Ghi chú

- 18 chương, 204 hình minh họa. Ảnh của chương *N* nằm trong `images/chuong-NN/`.
- Ấn bản 2 sắp xếp lại thứ tự chương so với ấn bản MEAP trước đó: namespace/label lên chương 7, ConfigMap/Secret chương 8, volume chương 9, PersistentVolume chương 10; chương 1 (giới thiệu) và chương 13 (Gateway API) là nội dung mới.
