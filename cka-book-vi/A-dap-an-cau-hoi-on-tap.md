# Phụ lục A. Đáp án câu hỏi ôn tập

*Dịch từ: Appendix A. Answers to Review Questions — Certified Kubernetes Administrator (CKA) Study Guide, 2nd Edition (O'Reilly).*

## Chương 4, Cài đặt và nâng cấp cluster

1. Liệt kê các node của cluster bằng lệnh sau. Bạn sẽ thấy:

   ```shell
   $ kubectl get nodes
   NAME           STATUS   ROLES           AGE     VERSION
   minikube       Ready    control-plane   2m20s   v1.32.2
   minikube-m02   Ready    <none>          2m10s   v1.32.2
   minikube-m03   Ready    <none>          2m3s    v1.32.2
   minikube-m04   Ready    <none>          116s    v1.32.2
   ```

   Lập lịch Pod bằng lệnh kiểu mệnh lệnh (imperative) sau:

   ```shell
   $ kubectl run nginx --image=nginx:1.27.4-alpine
   ```

   Bạn có thể xác định node mà Pod đang chạy như minh họa dưới đây. Pod đang chạy trên node có tên `minikube-m02`:

   ```shell
   $ kubectl get pod nginx -o jsonpath='{.spec.nodeName}'
   minikube-m02
   ```

   Dùng lệnh `kubectl drain` để trục xuất (evict) tất cả Pod trên một node. Ở đây, tên node là `minikube-m02`. Bạn sẽ cần dùng cờ `--ignore-daemonsets` để chỉ xóa những Pod không được quản lý bởi DaemonSet, và cờ `--force` để xóa những Pod không có controller:

   ```shell
   $ kubectl drain minikube-m02 --ignore-daemonsets --force
   evicting pod default/nginx
   pod/nginx evicted
   node/minikube-m02 drained
   ```

2. Lời giải cho bài tập mẫu này đòi hỏi nhiều bước thủ công. Các lệnh sau đây không hiển thị output của chúng.

   Mở một shell tương tác tới node control plane bằng Vagrant:

   ```shell
   $ vagrant ssh kube-control-plane
   ```

   Nâng cấp `kubeadm` lên phiên bản 1.32.2 và áp dụng:

   ```shell
   $ sudo apt-mark unhold kubeadm && sudo apt-get update && sudo apt-get \
     install -y kubeadm=1.32.2-1.1 && sudo apt-mark hold kubeadm
   $ sudo kubeadm upgrade apply v1.32.2
   ```

   Drain node, nâng cấp kubelet và `kubectl`, khởi động lại kubelet, rồi uncordon node:

   ```shell
   $ kubectl drain kube-control-plane --ignore-daemonsets
   $ sudo apt-get update && sudo apt-get install -y \
     --allow-change-held-packages kubelet=1.32.2-1.1 kubectl=1.32.2-1.1
   $ sudo systemctl daemon-reload
   $ sudo systemctl restart kubelet
   $ kubectl uncordon kube-control-plane
   ```

   Phiên bản của node giờ đây sẽ hiển thị v1.32.2. Thoát khỏi node:

   ```shell
   $ kubectl get nodes
   $ exit
   ```

   Mở một shell tương tác tới worker node bằng Vagrant:

   ```shell
   $ vagrant ssh kube-worker-1
   ```

   Nâng cấp `kubeadm` lên phiên bản 1.32.2 và áp dụng cho node:

   ```shell
   $ sudo apt-get update && sudo apt-get install -y \
     --allow-change-held-packages kubeadm=1.32.2-1.1
   $ sudo kubeadm upgrade node
   ```

   Drain node, nâng cấp kubelet và `kubectl`, khởi động lại kubelet, rồi uncordon node:

   ```shell
   $ kubectl drain kube-worker-1 --ignore-daemonsets
   $ sudo apt-get update && sudo apt-get install -y \
     --allow-change-held-packages kubelet=1.32.2-1.1 kubectl=1.32.2-1.1
   $ sudo systemctl daemon-reload
   $ sudo systemctl restart kubelet
   $ kubectl uncordon kube-worker-1
   ```

   Phiên bản của node giờ đây sẽ hiển thị v1.32.2. Thoát khỏi node:

   ```shell
   $ kubectl get nodes
   $ exit
   ```

## Chương 5, Sao lưu và khôi phục etcd

1. Mở một shell tương tác tới node control plane bằng Vagrant:

   ```shell
   $ vagrant ssh kube-control-plane
   ```

   Pod etcd chạy trong namespace `kube-system`. Xác định Pod bằng cách liệt kê tất cả Pod trong namespace đó. Bạn sẽ tìm thấy Pod có tên `etcd-kube-control-plane`:

   ```shell
   $ kubectl get pods -n kube-system
   ```

   Pod etcd chỉ chạy một container duy nhất. Bạn có thể hiển thị chi tiết của Pod bằng lệnh `kubectl get` hoặc `kubectl describe`. Để chỉ chọn ra container image, hãy dùng JSONPath sau:

   ```shell
   $ kubectl get pod etcd-kube-control-plane -n kube-system \
     -o jsonpath="{.spec.containers[0].image}"
   ```

   Container dùng image `registry.k8s.io/etcd:3.5.16-0`. Phiên bản etcd được dùng là 3.5.16. Ghi phiên bản này vào file có tên `etcd-version.txt`. Bạn có thể xem tất cả các phiên bản etcd đã phát hành trong kho GitHub tương ứng:

   ```shell
   $ echo "3.5.16" > etcd-version.txt
   ```

   Thoát khỏi node:

   ```shell
   $ exit
   ```

2. Lời giải cho bài tập mẫu này đòi hỏi nhiều bước thủ công. Các lệnh sau đây không hiển thị output của chúng.

   Mở một shell tương tác tới node control plane bằng Vagrant:

   ```shell
   $ vagrant ssh kube-control-plane
   ```

   Xác định các tham số của Pod `etcd-kube-control-plane` bằng cách describe nó. Dùng đúng các giá trị tham số để tạo file snapshot:

   ```shell
   $ kubectl describe pod etcd-kube-control-plane -n kube-system
   $ sudo ETCDCTL_API=3 etcdctl --cacert=/etc/kubernetes/pki/etcd/ca.crt \
     --cert=/etc/kubernetes/pki/etcd/server.crt \
     --key=/etc/kubernetes/pki/etcd/server.key snapshot save /opt/etcd.bak
   ```

   Khôi phục bản sao lưu (backup) từ file snapshot. Sửa manifest YAML của etcd và thay đổi giá trị của `spec.volumes.hostPath.path` cho volume có tên `etcd-data` thành `/var/bak`:

   ```shell
   $ sudo ETCDCTL_API=3 etcdutl --data-dir=/var/bak snapshot restore \
     /opt/etcd.bak
   $ sudo vim /etc/kubernetes/manifests/etcd.yaml
   ```

   Sau một lúc, Pod `etcd-kube-control-plane` sẽ chuyển trở lại trạng thái `Running`. Thoát khỏi node:

   ```shell
   $ kubectl get pod etcd-kube-control-plane -n kube-system
   $ exit
   ```

## Chương 6, Xác thực, ủy quyền và kiểm soát tiếp nhận

1. Dùng lệnh `kubectl create clusterrole` để tạo Role theo cách mệnh lệnh:

   ```shell
   $ kubectl create clusterrole service-view --verb=get,list \
     --resource=services
   ```

   Nếu bạn muốn bắt đầu với file YAML, hãy dùng nội dung như trong file `service-view-clusterrole.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: service-view
   rules:
   - apiGroups: [""]
     resources: ["services"]
     verbs: ["get", "list"]
   ```

   Tạo ClusterRole từ file YAML:

   ```shell
   $ kubectl apply -f service-view-clusterrole.yaml
   ```

   Tạo namespace `development`:

   ```shell
   $ kubectl create namespace development
   ```

   Dùng lệnh `kubectl create rolebinding` để tạo RoleBinding theo cách mệnh lệnh:

   ```shell
   $ kubectl create rolebinding ellasmith-service-view --user=ellasmith \
     --clusterrole=service-view -n development
   ```

   Cách tiếp cận khai báo (declarative) cho RoleBinding có thể trông giống như trong file `ellasmith-service-view-rolebinding.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: RoleBinding
   metadata:
     name: ellasmith-service-view
     namespace: development
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: ClusterRole
     name: service-view
   subjects:
   - kind: User
     name: ellasmith
     apiGroup: rbac.authorization.k8s.io
   ```

   Tạo RoleBinding từ file YAML:

   ```shell
   $ kubectl apply -f ellasmith-service-view-rolebinding.yaml
   ```

   Dùng lệnh `kubectl create clusterrole` để tạo ClusterRole theo cách mệnh lệnh:

   ```shell
   $ kubectl create clusterrole combined \
     --aggregation-rule="rbac.cka.cncf.com/aggregate=true"
   ```

   Nếu bạn muốn bắt đầu với file YAML, hãy dùng nội dung như trong file `combined-clusterrole.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: combined
   aggregationRule:
     clusterRoleSelectors:
     - matchLabels:
         rbac.cka.cncf.com/aggregate: "true"
   rules: []
   ```

   Tạo ClusterRole từ file YAML:

   ```shell
   $ kubectl apply -f combined-clusterrole.yaml
   ```

   Hiển thị các rule sẽ cho thấy một danh sách rỗng, vì chưa có ClusterRole nào được chọn thông qua việc chọn theo label:

   ```shell
   $ kubectl describe clusterrole combined
   Name:         combined
   Labels:       <none>
   Annotations:  <none>
   PolicyRule:
     Resources  Non-Resource URLs  Resource Names  Verbs
     ---------  -----------------  --------------  -----
   ```

   Dùng lệnh `kubectl create clusterrole` để tạo ClusterRole theo cách mệnh lệnh. Lệnh này không cung cấp tùy chọn để thêm label. Vì vậy, sinh manifest YAML bằng tùy chọn dry-run là một khởi đầu tốt:

   ```shell
   $ kubectl create clusterrole deployment-modify \
     --verb=create,delete,patch,update --resource=deployments \
     --dry-run=client -o yaml > deployment-modify-clusterrole.yaml
   ```

   Sửa nội dung như trong file `deployment-modify-clusterrole.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: deployment-modify
     labels:
       rbac.cka.cncf.com/aggregate: "true"
   rules:
   - apiGroups: ["apps"]
     resources: ["deployments"]
     verbs: ["create", "delete", "patch", "update"]
   ```

   Tạo ClusterRole từ file YAML:

   ```shell
   $ kubectl apply -f deployment-modify-clusterrole.yaml
   ```

   Hiển thị các rule của ClusterRole `combined` sẽ liệt kê các rule được định nghĩa bởi ClusterRole `deployment-modify`:

   ```shell
   $ kubectl describe clusterrole combined
   Name:         combined
   Labels:       <none>
   Annotations:  <none>
   PolicyRule:
     Resources         Non-Resource URLs  Resource Names  Verbs
     ---------         -----------------  --------------  -----
     deployments.apps  []                 []              [create \
     delete patch update]
   ```

   Việc liệt kê Service được cho phép đối với user `ellasmith` trong namespace `development`. Điều này được đảm nhiệm bởi RoleBinding `ellasmith-service-view`:

   ```shell
   $ kubectl auth can-i list services --as=ellasmith --namespace=development
   yes
   ```

   Ghi output vào file `list-services-ellasmith.txt`:

   ```shell
   $ echo 'yes' > list-services-ellasmith.txt
   ```

   Việc watch Deployment không được cho phép đối với user `ellasmith` trong namespace `production`. ClusterRole có tên `deployment-modify` chỉ cho phép các verb `create`, `delete`, `patch` và `update`:

   ```shell
   $ kubectl auth can-i watch deployments --as=ellasmith --namespace=production
   no
   ```

   Ghi output vào file `watch-deployments-ellasmith.txt`:

   ```shell
   $ echo 'no' > watch-deployments-ellasmith.txt
   ```

   Deployment được phép tạo, xóa, patch và update.

2. Trước tiên, tạo namespace có tên `apps`. Sau đó, chúng ta sẽ tạo ServiceAccount:

   ```shell
   $ kubectl create namespace apps
   $ kubectl create serviceaccount api-access -n apps
   ```

   Ngoài ra, bạn có thể dùng cách tiếp cận khai báo. Tạo namespace từ định nghĩa trong file `apps-namespace.yaml`:

   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: apps
   ```

   Tạo namespace từ file YAML:

   ```shell
   $ kubectl apply -f apps-namespace.yaml
   ```

   Tạo một file YAML mới có tên `api-serviceaccount.yaml` với nội dung sau:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: api-access
     namespace: apps
   ```

   Chạy lệnh `apply` để khởi tạo ServiceAccount từ file YAML:

   ```shell
   $ kubectl create -f api-serviceaccount.yaml
   ```

   Dùng lệnh `create clusterrole` để tạo ClusterRole theo cách mệnh lệnh:

   ```shell
   $ kubectl create clusterrole api-clusterrole --verb=watch,list,get \
     --resource=pods
   ```

   Nếu bạn muốn bắt đầu với file YAML, hãy dùng nội dung như trong file `api-clusterrole.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRole
   metadata:
     name: api-clusterrole
   rules:
   - apiGroups: [""]
     resources: ["pods"]
     verbs: ["watch","list","get"]
   ```

   Tạo ClusterRole từ file YAML:

   ```shell
   $ kubectl apply -f api-clusterrole.yaml
   ```

   Dùng lệnh `create clusterrolebinding` để tạo ClusterRoleBinding theo cách mệnh lệnh:

   ```shell
   $ kubectl create clusterrolebinding api-clusterrolebinding \
     --serviceaccount=apps:api-access --clusterrole=api-clusterrole
   ```

   Cách tiếp cận khai báo cho ClusterRoleBinding có thể trông giống như trong file `api-clusterrolebinding.yaml`:

   ```yaml
   apiVersion: rbac.authorization.k8s.io/v1
   kind: ClusterRoleBinding
   metadata:
     name: api-clusterrolebinding
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: ClusterRole
     name: api-clusterrole
   subjects:
   - apiGroup: ""
     kind: ServiceAccount
     name: api-access
     namespace: apps
   ```

   Tạo ClusterRoleBinding từ file YAML:

   ```shell
   $ kubectl apply -f api-clusterrolebinding.yaml
   ```

   Thực thi lệnh `run` để tạo các Pod trong các namespace khác nhau. Bạn sẽ cần tạo namespace `rm` trước khi có thể khởi tạo Pod `disposable`:

   ```shell
   $ kubectl run operator --image=nginx:1.21.1 --restart=Never \
     --port=80 --serviceaccount=api-access -n apps
   $ kubectl create namespace rm
   $ kubectl run disposable --image=nginx:1.21.1 --restart=Never \
     -n rm
   ```

   Manifest YAML sau đây cho thấy định nghĩa namespace `rm` được lưu trong file `rm-namespace.yaml`:

   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: rm
   ```

   Biểu diễn YAML của các Pod đó được lưu trong file `api-pods.yaml` có thể trông như sau:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: operator
     namespace: apps
   spec:
     serviceAccountName: api-access
     containers:
     - name: operator
       image: nginx:1.21.1
       ports:
       - containerPort: 80
   ---
   apiVersion: v1
   kind: Pod
   metadata:
     name: disposable
     namespace: rm
   spec:
     containers:
     - name: disposable
       image: nginx:1.21.1
   ```

   Tạo namespace và các Pod từ các file YAML:

   ```shell
   $ kubectl create -f rm-namespace.yaml
   $ kubectl create -f api-pods.yaml
   ```

   Xác định endpoint của API server và token truy cập trong Secret của ServiceAccount. Bạn sẽ cần thông tin này để thực hiện các lời gọi API:

   ```shell
   $ kubectl config view --minify -o \
     jsonpath='{.clusters[0].cluster.server}'
   https://192.168.64.4:8443
   $ kubectl get secret $(kubectl get serviceaccount api-access -n apps \
     -o jsonpath='{.secrets[0].name}') -o jsonpath='{.data.token}' -n apps
     | base64 --decode
   eyJhbGciOiJSUzI1NiIsImtpZCI6Ii1hOUhI...
   ```

   Mở một shell tương tác tới Pod có tên `operator`:

   ```shell
   $ kubectl exec operator -it -n apps -- /bin/sh
   ```

   Phát các lời gọi API để liệt kê tất cả Pod và xóa Pod `disposable` nằm trong namespace `rm`. Bạn sẽ thấy rằng trong khi thao tác `list` được cho phép thì thao tác `delete` lại không:

   ```shell
   # curl https://192.168.64.4:8443/api/v1/namespaces/rm/pods --header \
   "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ii1hOUhI..." \
   --insecure
   {
       "kind": "PodList",
       "apiVersion": "v1",
       ...
   }
   # curl -X DELETE https://192.168.64.4:8443/api/v1/namespaces \
   /rm/pods/disposable --header \
   "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6Ii1hOUhI..." \
   --insecure
   {
     "kind": "Status",
     "apiVersion": "v1",
     "metadata": {
     },
     "status": "Failure",
     "message": "pods \"disposable\" is forbidden: User \
     \"system:serviceaccount:apps:api-access\" cannot delete \
     resource \"pods\" in
     API group \"\" in the namespace \"rm\"",
     "reason": "Forbidden",
     "details": {
       "name": "disposable",
       "kind": "pods"
     },
     "code": 403
   }
   ```

## Chương 7, Operator và Custom Resource Definition (CRD)

1. Tạo CRD từ URL được cung cấp:

   ```shell
   $ kubectl apply -f https://raw.githubusercontent.com/mongodb/\
   mongodb-kubernetes-operator/master/config/crd/bases/mongodbcommunity.\
   mongodb.com_mongodbcommunity.yaml
   customresourcedefinition.apiextensions.k8s.io/mongodbcommunity.\
   mongodbcommunity.mongodb.com created
   ```

   Bạn có thể tìm thấy CRD đã cài đặt có tên `mongodbcommunity.mongodbcommunity.mongodb.com` bằng lệnh sau:

   ```shell
   $ kubectl get crds
   NAME                                            CREATED AT
   mongodbcommunity.mongodbcommunity.mongodb.com   2023-12-18T23:44:04Z
   ```

   Một cách để xem xét schema của CRD là dùng lệnh `kubectl describe`:

   ```shell
   $ kubectl describe crds mongodbcommunity.mongodbcommunity.mongodb.com
   ```

   Bạn sẽ thấy output của lệnh này rất dài. Xem qua các chi tiết, bạn sẽ thấy kiểu (type) này có tên là `MongoDBCommunity`. CRD cung cấp rất nhiều thuộc tính có thể được thiết lập khi khởi tạo một đối tượng thuộc kiểu này. Xem tài liệu của operator để biết thêm thông tin.

2. Tạo đối tượng từ file manifest YAML:

   ```shell
   $ kubectl apply -f backup-resource.yaml
   customresourcedefinition.apiextensions.k8s.io/backups.example.com created
   ```

   Bạn có thể tương tác với CRD bằng lệnh sau. Hãy đảm bảo viết đầy đủ tên của CRD, `backups.example.com`:

   ```shell
   $ kubectl get crd backups.example.com
   NAME                  CREATED AT
   backups.example.com   2023-05-24T15:11:15Z
   $ kubectl describe crd backups.example.com
   ...
   ```

   Tạo manifest YAML trong file `backup.yaml` dùng kind `Backup` của CRD:

   ```yaml
   apiVersion: example.com/v1
   kind: Backup
   metadata:
     name: nginx-backup
   spec:
     cronExpression: "0 0 * * *"
     podName: nginx
     path: /usr/local/nginx
   ```

   Tạo đối tượng từ file manifest YAML:

   ```shell
   $ kubectl apply -f backup.yaml
   backup.example.com/nginx-backup created
   ```

   Bạn có thể tương tác với đối tượng này bằng các lệnh `kubectl` tích hợp sẵn giống như với bất kỳ primitive API Kubernetes nào khác:

   ```shell
   $ kubectl get backups
   NAME           AGE
   nginx-backup   24s
   $ kubectl describe backup nginx-backup
   ...
   ```

## Chương 8, Helm và Kustomize

1. Thêm kho chart (chart repository) của Helm bằng URL được cung cấp. Tên được gán cho URL này là `prometheus-community`:

   ```shell
   $ helm repo add prometheus-community https://prometheus-community.\
   github.io/helm-charts
   "prometheus-community" has been added to your repositories
   ```

   Cập nhật thông tin chart bằng lệnh sau:

   ```shell
   $ helm repo update prometheus-community
   Hang tight while we grab the latest from your chart repositories...
   ...Successfully got an update from the "prometheus-community" \
   chart repository
   Update Complete. ⎈Happy Helming!⎈
   ```

   Bạn có thể tìm kiếm các phiên bản chart đã xuất bản trong kho có tên `prometheus-community`:

   ```shell
   $ helm search hub prometheus-community
   URL                                                  CHART VERSION   ..
   https://artifacthub.io/packages/helm/prometheus...   70.3.0          ..
   ```

   Cài đặt phiên bản mới nhất của chart `kube-prometheus-stack`:

   ```shell
   $ helm install prometheus prometheus-community/kube-prometheus-stack
   NAME: prometheus
   LAST DEPLOYED: Wed Mar 26 14:14:53 2025
   NAMESPACE: default
   STATUS: deployed
   REVISION: 1
   ...
   ```

   Các chart đã cài đặt có thể được liệt kê bằng lệnh sau:

   ```shell
   $ helm list
   NAME         NAMESPACE   REVISION   UPDATED      ...
   prometheus   default     1          2025-03-26   ...
   ```

   Một trong các đối tượng được chart tạo ra là Service có tên `prometheus-operated`. Service này expose Prometheus dashboard trên cổng 9090:

   ```shell
   $ kubectl get service prometheus-operated
   NAME                  TYPE        CLUSTER-IP   EXTERNAL-IP   ...
   prometheus-operated   ClusterIP   None         <none>        ...
   ```

   Thiết lập chuyển tiếp cổng (port forwarding) từ cổng 8080 tới cổng 9090:

   ```shell
   $ kubectl port-forward service/prometheus-operated 8080:9090
   Forwarding from 127.0.0.1:8080 -> 9090
   Forwarding from [::1]:8080 -> 9090
   ```

   Mở trình duyệt và nhập URL http://localhost:8080/. Bạn sẽ thấy Prometheus dashboard.

   ![Prometheus dashboard](images/chA/prometheus-dashboard.png)

   Gỡ cài đặt chart bằng lệnh sau:

   ```shell
   $ helm uninstall prometheus
   release "prometheus" uninstalled
   ```

2. Điều hướng đến thư mục chứa thư mục `manifests`. Tạo tất cả các đối tượng nằm trong thư mục `manifests` bằng lệnh `apply` đệ quy:

   ```shell
   $ kubectl apply -f manifests/ -R
   configmap/logs-config created
   pod/nginx created
   ```

   Sửa giá trị của key `dir` trong file `configmap.yaml` bằng một trình soạn thảo. Sau đó cập nhật đối tượng đang chạy (live object) của ConfigMap bằng lệnh sau:

   ```shell
   $ vim manifests/configmap.yaml
   $ kubectl apply -f manifests/configmap.yaml
   configmap/logs-config configured
   ```

   Xóa tất cả các đối tượng đã được tạo từ thư mục `manifests` bằng lệnh `delete` đệ quy:

   ```shell
   $ kubectl delete -f manifests/ -R
   configmap "logs-config" deleted
   pod "nginx" deleted
   ```

   Tạo file `kustomization.yaml`. File này cần định nghĩa thuộc tính chung cho namespace và tham chiếu tài nguyên bằng file `pod.yaml`. File YAML sau đây cho thấy nội dung của nó:

   ```yaml
   namespace: t012
   resources:
   - pod.yaml
   ```

   Chạy lệnh `kustomize` sau để hiển thị manifest đã được biến đổi ra output của console:

   ```shell
   $ kubectl kustomize ./
   apiVersion: v1
   kind: Pod
   metadata:
     name: nginx
     namespace: t012
   spec:
     containers:
     - image: nginx:1.21.1
       name: nginx
   ```

## Chương 9, Pod và Namespace

1. Bạn có thể dùng cách tiếp cận mệnh lệnh hoặc cách tiếp cận khai báo. Trước tiên, chúng ta sẽ xem cách tạo namespace theo cách tiếp cận mệnh lệnh:

   ```shell
   $ kubectl create namespace j43
   ```

   Tạo Pod:

   ```shell
   $ kubectl run nginx --image=nginx:1.17.10 --port=80 --namespace=j43
   ```

   Ngoài ra, bạn có thể dùng cách tiếp cận khai báo. Tạo một manifest YAML mới trong file có tên `namespace.yaml` với nội dung sau:

   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: j43
   ```

   Tạo namespace từ manifest YAML:

   ```shell
   $ kubectl apply -f namespace.yaml
   ```

   Tạo một manifest YAML mới trong file `nginx-pod.yaml` với nội dung sau:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: nginx
   spec:
     containers:
     - name: nginx
       image: nginx:1.17.10
       ports:
       - containerPort: 80
   ```

   Tạo Pod từ manifest YAML:

   ```shell
   $ kubectl apply -f nginx-pod.yaml --namespace=j43
   ```

   Bạn có thể dùng tùy chọn dòng lệnh `-o wide` để lấy địa chỉ IP của Pod:

   ```shell
   $ kubectl get pod nginx --namespace=j43 -o wide
   ```

   Thông tin tương tự cũng có sẵn nếu bạn truy vấn chi tiết của Pod:

   ```shell
   $ kubectl describe pod nginx --namespace=j43 | grep IP:
   ```

   Bạn có thể dùng các tùy chọn dòng lệnh `--rm` và `-it` để khởi động một Pod tạm thời. Lệnh sau giả định rằng địa chỉ IP của Pod có tên `nginx` là 10.1.0.66:

   ```shell
   $ kubectl run busybox --image=busybox:1.36.1 --restart=Never --rm -it \
     -n j43 -- wget -O- 10.1.0.66:80
   ```

   Để tải log về, hãy dùng một lệnh `logs` đơn giản:

   ```shell
   $ kubectl logs nginx --namespace=j43
   ```

   Việc sửa đối tượng đang chạy bị cấm. Bạn sẽ nhận được thông báo lỗi nếu cố thêm các biến môi trường:

   ```shell
   $ kubectl edit pod nginx --namespace=j43
   ```

   Bạn sẽ phải tạo lại đối tượng với manifest YAML đã sửa đổi, nhưng trước tiên bạn phải xóa đối tượng hiện có:

   ```shell
   $ kubectl delete pod nginx --namespace=j43
   ```

   Sửa manifest YAML hiện có trong file `nginx-pod.yaml`:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: nginx
   spec:
     containers:
     - name: nginx
       image: nginx:1.17.10
       ports:
       - containerPort: 80
       env:
       - name: DB_URL
         value: postgresql://mydb:5432
       - name: DB_USERNAME
         value: admin
   ```

   Áp dụng các thay đổi:

   ```shell
   $ kubectl apply -f nginx-pod.yaml --namespace=j43
   ```

   Dùng lệnh `exec` để mở một shell tương tác tới container:

   ```shell
   $ kubectl exec -it nginx --namespace=j43 -- /bin/sh
   # ls -l
   ```

2. Kết hợp các tùy chọn dòng lệnh `-o yaml` và `--dry-run=client` để ghi YAML được sinh ra vào một file. Hãy đảm bảo escape các ký tự dấu nháy kép của chuỗi được lệnh `echo` hiển thị:

   ```shell
   $ kubectl run loop --image=busybox:1.36.1 -o yaml --dry-run=client \
     --restart=Never -- /bin/sh -c 'for i in 1 2 3 4 5 6 7 8 9 10; \
     do echo "Welcome $i times"; done' \
     > pod.yaml
   ```

   Tạo Pod từ manifest YAML:

   ```shell
   $ kubectl apply -f pod.yaml --namespace=j43
   ```

   Trạng thái của Pod sẽ hiển thị `Completed`, vì lệnh được thực thi trong container không chạy trong một vòng lặp vô hạn:

   ```shell
   $ kubectl get pod loop --namespace=j43
   ```

   Không thể thay đổi lệnh của container đối với các Pod hiện có. Xóa Pod để bạn có thể sửa file manifest và tạo lại đối tượng:

   ```shell
   $ kubectl delete pod loop --namespace=j43
   ```

   Thay đổi nội dung manifest YAML:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     creationTimestamp: null
     labels:
       run: loop
     name: loop
   spec:
     containers:
     - args:
       - /bin/sh
       - -c
       - while true; do date; sleep 10; done
       image: busybox:1.36.1
       name: loop
       resources: {}
     dnsPolicy: ClusterFirst
     restartPolicy: Never
   status: {}
   ```

   Tạo Pod từ manifest YAML:

   ```shell
   $ kubectl apply -f pod.yaml --namespace=j43
   ```

   Bạn có thể xem các event của Pod bằng cách describe Pod rồi grep theo cụm từ này:

   ```shell
   $ kubectl describe pod loop --namespace=j43 | grep -C 10 Events:
   ```

   Bạn chỉ cần xóa namespace, việc này sẽ xóa tất cả các đối tượng bên trong namespace đó:

   ```shell
   $ kubectl delete namespace j43
   ```

## Chương 10, ConfigMap và Secret

1. Tạo ConfigMap và trỏ tới file văn bản ngay khi tạo:

   ```shell
   $ kubectl create configmap app-config --from-file=application.yaml
   configmap/app-config created
   ```

   ConfigMap định nghĩa một cặp key-value duy nhất. Key là tên của file YAML, và value là nội dung của `application.yaml`:

   ```shell
   $ kubectl get configmap app-config -o yaml
   apiVersion: v1
   data:
     application.yaml: |-
       dev:
         url: http://dev.bar.com
         name: Developer Setup
       prod:
         url: http://foo.bar.com
         name: My Cool App
   kind: ConfigMap
   metadata:
     creationTimestamp: "2023-05-22T17:47:52Z"
     name: app-config
     namespace: default
     resourceVersion: "7971"
     uid: 00cf4ce2-ebec-48b5-a721-e1bde2aabd84
   ```

   Thực thi lệnh `run` kết hợp với cờ `--dry-run` để sinh file cho Pod:

   ```shell
   $ kubectl run backend --image=nginx:1.23.4-alpine -o yaml \
     --dry-run=client --restart=Never > pod.yaml
   ```

   Manifest YAML cuối cùng sẽ trông tương tự đoạn mã sau:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     labels:
       run: backend
     name: backend
   spec:
     containers:
     - image: nginx:1.23.4-alpine
       name: backend
       volumeMounts:
       - name: config-volume
         mountPath: /etc/config
     volumes:
     - name: config-volume
       configMap:
         name: app-config
   ```

   Tạo Pod bằng cách trỏ lệnh `apply` tới manifest YAML:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/backend created
   ```

   Đăng nhập vào Pod và điều hướng đến thư mục `/etc/config`. Bạn sẽ tìm thấy file `application.yaml` với nội dung YAML như mong đợi:

   ```shell
   $ kubectl exec backend -it -- /bin/sh
   / # cd /etc/config
   /etc/config # ls
   application.yaml
   /etc/config # cat application.yaml
   dev:
     url: http://dev.bar.com
     name: Developer Setup
   prod:
     url: http://foo.bar.com
     name: My Cool App
   /etc/config # exit
   ```

2. Tạo Secret từ dòng lệnh rất dễ:

   ```shell
   $ kubectl create secret generic db-credentials --from-literal=\
   db-password=passwd
   secret/db-credentials created
   ```

   Lệnh mệnh lệnh này tự động mã hóa Base64 giá trị literal được cung cấp. Bạn có thể hiển thị chi tiết của đối tượng Secret từ dòng lệnh. Giá trị được gán cho key `db-password` là `cGFzc3dk`:

   ```shell
   $ kubectl get secret db-credentials -o yaml
   apiVersion: v1
   data:
     db-password: cGFzc3dk
   kind: Secret
   metadata:
     creationTimestamp: "2023-05-22T16:47:33Z"
     name: db-credentials
     namespace: default
     resourceVersion: "7557"
     uid: 2daf580a-b672-40dd-8c37-a4adb57a8c6c
   type: Opaque
   ```

   Thực thi lệnh `run` kết hợp với cờ `--dry-run` để sinh file cho Pod:

   ```shell
   $ kubectl run backend --image=nginx:1.23.4-alpine -o yaml \
     --dry-run=client --restart=Never > pod.yaml
   ```

   Sửa manifest YAML và tạo một biến môi trường đọc key từ Secret đồng thời gán cho nó một tên mới:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     labels:
       run: backend
     name: backend
   spec:
     containers:
     - image: nginx:1.23.4-alpine
       name: backend
       env:
         - name: DB_PASSWORD
           valueFrom:
             secretKeyRef:
               name: db-credentials
               key: db-password
   ```

   Tạo Pod bằng cách trỏ lệnh `apply` tới manifest YAML:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/backend created
   ```

   Bạn có thể tìm thấy biến môi trường ở dạng đã giải mã Base64 bằng cách mở shell vào container và chạy lệnh `env`:

   ```shell
   $ kubectl exec -it backend -- env
   DB_PASSWORD=passwd
   ```

## Chương 11, Deployment và ReplicaSet

1. Thực thi lệnh để tạo đối tượng Deployment. Bạn sẽ thấy một thông báo lỗi:

   ```shell
   $ kubectl apply -f fix-me-deployment.yaml
   The Deployment "nginx-deployment" is invalid: spec.template.metadata.labels:
    Invalid value: map[string]string{"app":"nginx"}: 'selector' does not \
    match template 'labels'
   ```

   Label selector không khớp với các label được gán trong Pod template. Thay đổi manifest để chúng khớp nhau. Manifest sau đây dùng `run: server` dưới `spec.selector.matchLabels` và `spec.template.metadata.labels`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nginx-deployment
     labels:
       app: nginx
   spec:
     replicas: 3
     selector:
       matchLabels:
         run: server
     template:
       metadata:
         labels:
           run: server
       spec:
         containers:
         - name: nginx
           image: nginx:1.14.2
           ports:
           - containerPort: 80
   ```

   Giờ đây bạn sẽ có thể tạo được đối tượng:

   ```shell
   $ kubectl apply -f fix-me-deployment.yaml
   deployment.apps/nginx-deployment created
   ```

2. Tạo manifest YAML cho một Deployment trong file `nginx-deployment.yaml`. Label selector phải khớp với các label được gán cho Pod template. Đoạn mã sau cho thấy nội dung của file manifest YAML:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nginx
     labels:
       tier: backend
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: v1
     template:
       metadata:
         labels:
           app: v1
       spec:
         containers:
         - image: nginx:1.23.0
           name: nginx
   ```

   Tạo Deployment bằng cách trỏ tới manifest YAML. Kiểm tra trạng thái của Deployment:

   ```shell
   $ kubectl apply -f nginx-deployment.yaml
   deployment.apps/nginx created
   $ kubectl get deployment nginx
   NAME    READY   UP-TO-DATE   AVAILABLE   AGE
   nginx   3/3     3            3           10s
   ```

   Đặt image mới và kiểm tra lịch sử revision:

   ```shell
   $ kubectl set image deployment/nginx nginx=nginx:1.23.4
   deployment.apps/nginx image updated
   $ kubectl rollout history deployment nginx
   deployment.apps/nginx
   REVISION  CHANGE-CAUSE
   1         <none>
   2         <none>
   $ kubectl rollout history deployment nginx --revision=2
   deployment.apps/nginx with revision #2
   Pod Template:
     Labels:       app=v1
           pod-template-hash=5bd95c598
     Containers:
      nginx:
       Image:      nginx:1.23.4
       Port:       <none>
       Host Port:  <none>
       Environment:        <none>
       Mounts:     <none>
     Volumes:      <none>
   ```

   Thêm nguyên nhân thay đổi (change cause) cho revision hiện tại bằng cách annotate đối tượng Deployment:

   ```shell
   $ kubectl annotate deployment nginx kubernetes.io/change-cause=\
   "Pick up patch version"
   deployment.apps/nginx annotated
   ```

   Nguyên nhân thay đổi của revision có thể được xem bằng cách hiển thị lịch sử rollout:

   ```shell
   $ kubectl rollout history deployment nginx
   deployment.apps/nginx
   REVISION  CHANGE-CAUSE
   1         <none>
   2         Pick up patch version
   ```

   Bây giờ, scale Deployment lên năm replica. Bạn sẽ thấy năm Pod được Deployment kiểm soát:

   ```shell
   $ kubectl scale deployment nginx --replicas=5
   deployment.apps/nginx scaled
   $ kubectl get pod -l app=v1
   NAME                    READY   STATUS    RESTARTS   AGE
   nginx-5bd95c598-25z4j   1/1     Running   0          3m39s
   nginx-5bd95c598-46mlt   1/1     Running   0          3m38s
   nginx-5bd95c598-bszvp   1/1     Running   0          48s
   nginx-5bd95c598-dwr8r   1/1     Running   0          48s
   nginx-5bd95c598-kjrvf   1/1     Running   0          3m37s
   ```

   Rollback về revision 1. Bạn sẽ thấy revision mới. Xem xét revision này sẽ thấy image `nginx:1.23.0`:

   ```shell
   $ kubectl rollout undo deployment/nginx --to-revision=1
   deployment.apps/nginx rolled back
   $ kubectl rollout history deployment nginx
   deployment.apps/nginx
   REVISION  CHANGE-CAUSE
   2         Pick up patch version
   3         <none>
   $ kubectl rollout history deployment nginx --revision=3
   deployment.apps/nginx with revision #3
   Pod Template:
     Labels:       app=v1
           pod-template-hash=f48dc88cd
     Containers:
      nginx:
       Image:      nginx:1.23.0
       Port:       <none>
       Host Port:  <none>
       Environment:        <none>
       Mounts:     <none>
     Volumes:      <none>
   ```

## Chương 12, Scale workload

1. Tạo một file YAML mới có tên `hello-world-deployment.yaml` với nội dung như sau:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: hello-world
   spec:
     replicas: 3
     selector:
       matchLabels:
         run: hello-world
     template:
       metadata:
         labels:
           run: hello-world
       spec:
         containers:
         - image: bmuschko/nodejs-hello-world:1.0.0
           name: hello-world
   ```

   Tạo đối tượng Deployment từ file manifest:

   ```shell
   $ kubectl apply -f hello-world-deployment.yaml
   deployment.apps/hello-world created
   ```

   Đảm bảo số lượng replica chính xác. Bạn sẽ thấy ba replica sẵn sàng:

   ```shell
   $ kubectl get deployment hello-world
   NAME          READY   UP-TO-DATE   AVAILABLE   AGE
   hello-world   3/3     3            3           32s
   ```

   Sửa file YAML `hello-world-deployment.yaml` bằng một trình soạn thảo. Thay đổi giá trị của thuộc tính `spec.replicas` thành tám. Lệnh sau dùng `vim`:

   ```shell
   $ vim hello-world-deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: hello-world
   spec:
     replicas: 8
   ...
   ```

   Áp dụng các thay đổi cho đối tượng hiện có:

   ```shell
   $ kubectl apply -f hello-world-deployment.yaml
   deployment.apps/hello-world configured
   ```

   Đảm bảo số lượng replica chính xác. Bạn sẽ thấy tám replica sẵn sàng:

   ```shell
   $ kubectl get deployment hello-world
   NAME          READY   UP-TO-DATE   AVAILABLE   AGE
   hello-world   8/8     8            8           56s
   ```

2. Định nghĩa Deployment trong file `nginx-deployment.yaml` như sau:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nginx
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: nginx
     template:
       metadata:
         labels:
           app: nginx
       spec:
         containers:
         - image: nginx:1.23.4
           name: nginx
           resources:
             requests:
               cpu: "0.5"
               memory: "500Mi"
             limits:
               memory: "500Mi"
   ```

   Tạo đối tượng Deployment từ file manifest:

   ```shell
   $ kubectl apply -f nginx-deployment.yaml
   deployment.apps/nginx created
   ```

   Đảm bảo tất cả các Pod được Deployment kiểm soát chuyển sang trạng thái `Running`:

   ```shell
   $ kubectl get deployment nginx
   NAME    READY   UP-TO-DATE   AVAILABLE   AGE
   nginx   1/1     1            1           49s
   $ kubectl get pods
   NAME                    READY   STATUS    RESTARTS   AGE
   nginx-5bbd9746c-9b4np   1/1     Running   0          24s
   ```

   Tiếp theo, định nghĩa HorizontalPodAutoscaler với các ngưỡng tài nguyên đã cho trong file `nginx-hpa.yaml`. Manifest cuối cùng được trình bày ở đây:

   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: nginx-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: nginx
     minReplicas: 3
     maxReplicas: 8
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 75
     - type: Resource
       resource:
         name: memory
         target:
           type: Utilization
           averageUtilization: 60
   ```

   Tạo đối tượng HorizontalPodAutoscaler từ file manifest:

   ```shell
   $ kubectl apply -f nginx-hpa.yaml
   horizontalpodautoscaler.autoscaling/nginx-hpa created
   ```

   Khi bạn xem xét đối tượng HorizontalPodAutoscaler, bạn sẽ thấy số lượng replica sẽ được scale lên đến số tối thiểu là ba, mặc dù Deployment chỉ định nghĩa một replica duy nhất. Tại thời điểm chạy lệnh này, các Pod không sử dụng lượng CPU và memory đáng kể. Đó là lý do các chỉ số (metric) hiện tại hiển thị 0%:

   ```shell
   $ kubectl get hpa nginx-hpa
   NAME        REFERENCE          TARGETS          MINPODS   MAXPODS \
     REPLICAS   AGE
   nginx-hpa   Deployment/nginx   0%/60%, 0%/75%   3         8       \
     3          2m19s
   ```

## Chương 13, Yêu cầu tài nguyên, giới hạn và quota

1. Bắt đầu bằng việc tạo một định nghĩa Pod cơ bản. Manifest YAML sau đây định nghĩa Pod có tên `hello` với một container duy nhất chạy image `bmuschko/nodejs-hello-world:1.0.0`. Thêm một volume kiểu `emptyDir` vào Pod và mount nó vào container. Cuối cùng, định nghĩa yêu cầu tài nguyên (resource requirements) cho container:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: hello
   spec:
     containers:
     - image: bmuschko/nodejs-hello-world:1.0.0
       name: hello
       ports:
       - name: nodejs-port
         containerPort: 3000
       volumeMounts:
       - name: log-volume
         mountPath: "/var/log"
       resources:
         requests:
           cpu: 100m
           memory: 500Mi
           ephemeral-storage: 1Gi
         limits:
           memory: 500Mi
           ephemeral-storage: 2Gi
     volumes:
     - name: log-volume
       emptyDir: {}
   ```

   Tạo đối tượng Pod bằng lệnh sau:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/hello created
   ```

   Cluster trong kịch bản này gồm ba node: một node control plane và hai worker node. Lưu ý rằng thiết lập của bạn nhiều khả năng sẽ khác:

   ```shell
   $ kubectl get nodes
   NAME           STATUS   ROLES           AGE   VERSION
   minikube       Ready    control-plane   65s   v1.32.2
   minikube-m02   Ready    <none>          44s   v1.32.2
   minikube-m03   Ready    <none>          26s   v1.32.2
   ```

   Cờ `-o wide` hiển thị node mà Pod đang chạy trên đó, trong trường hợp này là node có tên `minikube-m03`:

   ```shell
   $ kubectl get pod hello -o wide
   NAME    READY   STATUS    RESTARTS   AGE   IP           NODE
   hello   1/1     Running   0          25s   10.244.2.2   minikube-m03
   ```

   Chi tiết của Pod cung cấp thông tin về yêu cầu tài nguyên của container:

   ```shell
   $ kubectl describe pod hello
   ...
   Containers:
     hello:
       ...
       Limits:
         ephemeral-storage:  2Gi
         memory:             500Mi
       Requests:
         cpu:                100m
         ephemeral-storage:  1Gi
         memory:             500M
   ...
   ```

2. Trước tiên, tạo namespace và resource quota trong namespace đó:

   ```shell
   $ kubectl create namespace rq-demo
   namespace/rq-demo created
   $ kubectl apply -f resourcequota.yaml --namespace=rq-demo
   resourcequota/app created
   ```

   Kiểm tra chi tiết của resource quota:

   ```shell
   $ kubectl describe quota app --namespace=rq-demo
   Name:            app
   Namespace:       rq-demo
   Resource         Used  Hard
   --------         ----  ----
   pods             0     2
   requests.cpu     0     2
   requests.memory  0     500Mi
   ```

   Tiếp theo, tạo manifest YAML trong file `pod.yaml` với lượng memory yêu cầu nhiều hơn mức còn khả dụng trong quota. Bắt đầu bằng cách chạy lệnh `kubectl run mypod --image=nginx -o yaml --dry-run=client --restart=Never > pod.yaml`, rồi chỉnh sửa file được tạo ra. Nhớ thay thế thuộc tính `resources` đã được tạo tự động:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: mypod
   spec:
     containers:
     - image: nginx
       name: mypod
       resources:
         requests:
           cpu: "0.5"
           memory: "1Gi"
     restartPolicy: Never
   ```

   Tạo Pod và quan sát thông báo lỗi:

   ```shell
   $ kubectl apply -f pod.yaml --namespace=rq-demo
   Error from server (Forbidden): error when creating "pod.yaml": pods \
   "mypod" is forbidden: exceeded quota: app, requested: \
   requests.memory=1Gi, used: requests.memory=0, limited: \
   requests.memory=500Mi
   ```

   Hạ thiết lập memory xuống dưới 500 Mi (ví dụ 255 Mi) rồi tạo Pod:

   ```shell
   $ kubectl apply -f pod.yaml --namespace=rq-demo
   pod/mypod created
   ```

   Tài nguyên mà Pod tiêu thụ có thể xem trong cột `Used`:

   ```shell
   $ kubectl describe quota --namespace=rq-demo
   Name:            app
   Namespace:       rq-demo
   Resource         Used   Hard
   --------         ----   ----
   pods             1      2
   requests.cpu     500m   2
   requests.memory  255Mi  500Mi
   ```

3. Tạo các đối tượng từ manifest YAML đã cho. File này định nghĩa một namespace và một đối tượng LimitRange:

   ```shell
   $ kubectl apply -f setup.yaml
   namespace/d92 created
   limitrange/cpu-limit-range created
   ```

   Mô tả (describe) đối tượng LimitRange sẽ cho biết chi tiết cấu hình container của nó:

   ```shell
   $ kubectl describe limitrange cpu-limit-range -n d92
   Name:       cpu-limit-range
   Namespace:  d92
   Type        Resource  Min   Max   Default Request  Default Limit  ...
   ----        --------  ---   ---   ---------------  -------------
   Container   cpu       200m  500m  500m             500m           ...
   ```

   Định nghĩa một Pod trong file `pod-without-resource-requirements.yaml` không có bất kỳ yêu cầu tài nguyên nào:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: pod-without-resource-requirements
     namespace: d92
   spec:
     containers:
     - image: nginx:1.23.4-alpine
       name: nginx
   ```

   Tạo đối tượng Pod bằng lệnh `apply`:

   ```shell
   $ kubectl apply -f pod-without-resource-requirements.yaml
   pod/pod-without-resource-requirements created
   ```

   Một Pod không chỉ định yêu cầu tài nguyên sẽ dùng request và limit mặc định do LimitRange định nghĩa, trong trường hợp này là 500 m:

   ```shell
   $ kubectl describe pod pod-without-resource-requirements -n d92
   ...
   Containers:
     nginx:
       Limits:
         cpu:  500m
       Requests:
         cpu:  500m
   ```

   Pod được định nghĩa trong file `pod-with-more-cpu-resource-requirements.yaml` chỉ định resource limit CPU cao hơn mức LimitRange cho phép:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: pod-with-more-cpu-resource-requirements
     namespace: d92
   spec:
     containers:
     - image: nginx:1.23.4-alpine
       name: nginx
       resources:
         requests:
           cpu: 400m
         limits:
           cpu: 1.5
   ```

   Kết quả là Pod sẽ không được phép lập lịch:

   ```shell
   $ kubectl apply -f pod-with-more-cpu-resource-requirements.yaml
   Error from server (Forbidden): error when creating \
   "pod-with-more-cpu-resource-requirements.yaml": pods \
   "pod-with-more-cpu-resource-requirements" is forbidden: \
   maximum cpu usage per Container is 500m, but limit is 1500m
   ```

   Cuối cùng, định nghĩa một Pod trong file `pod-with-less-cpu-resource-requirements.yaml`. Resource request và limit CPU nằm trong giới hạn của LimitRange:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: pod-with-less-cpu-resource-requirements
     namespace: d92
   spec:
     containers:
     - image: nginx:1.23.4-alpine
       name: nginx
       resources:
         requests:
           cpu: 350m
         limits:
           cpu: 400m
   ```

   Tạo đối tượng Pod bằng lệnh `apply`:

   ```shell
   $ kubectl apply -f pod-with-less-cpu-resource-requirements.yaml
   pod/pod-with-less-cpu-resource-requirements created
   ```

   Pod dùng resource request và limit CPU đã cung cấp:

   ```shell
   $ kubectl describe pod pod-with-less-cpu-resource-requirements -n d92
   ...
   Containers:
     nginx:
       Limits:
         cpu:  400m
       Requests:
         cpu:  350m
   ```

## Chương 14, Lập lịch Pod

1. Lời giải sau đây minh họa việc dùng một cluster minikube nhiều node. Liệt kê các node cho ra output sau:

   ```shell
   $ kubectl get nodes
   NAME           STATUS   ROLES           AGE     VERSION
   minikube       Ready    control-plane   3m16s   v1.32.2
   minikube-m02   Ready    <none>          3m6s    v1.32.2
   minikube-m03   Ready    <none>          2m59s   v1.32.2
   ```

   Hãy gán label `color=green` cho node `minikube-m02` và label `color=red` cho node `minikube-m03`:

   ```shell
   $ kubectl label nodes minikube-m02 color=green
   node/minikube-m02 labeled
   $ kubectl label nodes minikube-m03 color=red
   node/minikube-m03 labeled
   ```

   Bạn có thể hiển thị các label đã gán cho tất cả các node bằng tùy chọn dòng lệnh `--show-labels`:

   ```shell
   $ kubectl get nodes --show-labels
   NAME           STATUS   ROLES           AGE   VERSION   LABELS
   minikube       Ready    control-plane   27m   v1.32.2   ...
   minikube-m02   Ready    <none>          27m   v1.32.2   ...,color=green
   minikube-m03   Ready    <none>          26m   v1.32.2   ...,color=red,.
   ```

   Manifest của Pod có thể trông như sau:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: app
   spec:
     nodeSelector:
       color: green
     containers:
     - name: nginx
       image: nginx:1.27.1
   ```

   Tạo Pod và kiểm tra node được gán:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/app created
   $ kubectl get pod app -o=wide
   NAME   READY   STATUS    RESTARTS   AGE   IP           NODE
   app    1/1     Running   0          21s   10.244.1.2   minikube-m02
   ```

   Sửa manifest của Pod để dùng node affinity nhằm lập lịch nó lên node `minikube-m02` hoặc `minikube-m03`. Định nghĩa YAML thu được sẽ trông như thế này:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: app
   spec:
     affinity:
       nodeAffinity:
         requiredDuringSchedulingIgnoredDuringExecution:
           nodeSelectorTerms:
           - matchExpressions:
             - key: color
               operator: In
               values:
               - green
               - red
     containers:
     - name: nginx
       image: nginx:1.27.1
   ```

   Trước tiên xóa Pod, sau đó tạo lại. Pod sẽ được lập lịch lên một trong hai node:

   ```shell
   $ kubectl delete -f pod.yaml
   pod "app" deleted
   $ kubectl apply -f pod.yaml
   pod/app created
   $ kubectl get pod app -o=wide
   NAME   READY   STATUS    RESTARTS   AGE   IP           NODE           .
   app    1/1     Running   0          12s   10.244.1.3   minikube-m02   .
   ```

2. Lời giải sau đây minh họa việc dùng một cluster minikube nhiều node. Liệt kê các node cho ra output sau:

   ```shell
   $ kubectl get nodes
   NAME           STATUS   ROLES           AGE     VERSION
   minikube       Ready    control-plane   3m16s   v1.32.2
   minikube-m02   Ready    <none>          3m6s    v1.32.2
   minikube-m03   Ready    <none>          2m59s   v1.32.2
   ```

   Định nghĩa Pod trong file `pod.yaml` có thể trông như sau:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: app
   spec:
     containers:
     - name: nginx
       image: nginx:1.27.1
   ```

   Tạo Pod và kiểm tra node được gán:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/app created
   $ kubectl get pod app -o=wide
   NAME   READY   STATUS    RESTARTS   AGE   IP           NODE           .
   app    1/1     Running   0          89s   10.244.2.2   minikube-m03   .
   ```

   Thêm taint vào node. Trong trường hợp này, node có tên `minikube-m03`:

   ```shell
   $ kubectl taint nodes minikube-m03 exclusive=yes:NoExecute
   node/minikube-m03 tainted
   ```

   Taint khiến Pod bị trục xuất (evict):

   ```shell
   $ kubectl get pods
   No resources found in default namespace.
   ```

   Sửa manifest của Pod và thêm toleration:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: app
   spec:
     tolerations:
     - key: "exclusive"
       operator: "Equal"
       value: "yes"
       effect: "NoExecute"
     containers:
     - name: nginx
       image: nginx:1.27.1
   ```

   Với toleration, Pod sẽ lại được phép lập lịch lên node `minikube-m03`:

   ```shell
   $ kubectl apply -f pod.yaml
   pod/app created
   $ kubectl get pod app -o=wide
   NAME   READY   STATUS    RESTARTS   AGE   IP           NODE           .
   app    1/1     Running   0          9s    10.244.2.3   minikube-m03   .
   ```

   Gỡ taint khỏi node. Pod sẽ tiếp tục chạy trên node đó:

   ```shell
   $ kubectl taint nodes minikube-m03 exclusive-
   node/minikube-m03 untainted
   $ kubectl get pod app -o=wide
   NAME   READY   STATUS    RESTARTS   AGE   IP           NODE           .
   app    1/1     Running   0          37s   10.244.2.3   minikube-m03   .
   ```

## Chương 15, Volume

1. Bắt đầu bằng cách sinh manifest YAML với lệnh `run` kết hợp tùy chọn `--dry-run`:

   ```shell
   $ kubectl run alpine --image=alpine:3.22.2 --dry-run=client \
     --restart=Never -o yaml -- /bin/sh -c "while true; do sleep 60; \
     done;" > multi-container-alpine.yaml
   $ vim multi-container-alpine.yaml
   ```

   Sau khi chỉnh sửa Pod, manifest có thể trông như sau. Tên các container ở đây là `container1` và `container2`:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     creationTimestamp: null
     labels:
       run: alpine
     name: alpine
   spec:
     containers:
     - args:
       - /bin/sh
       - -c
       - while true; do sleep 60; done;
       image: alpine:3.22.2
       name: container1
       resources: {}
     - args:
       - /bin/sh
       - -c
       - while true; do sleep 60; done;
       image: alpine:3.12.0
       name: container2
       resources: {}
     dnsPolicy: ClusterFirst
     restartPolicy: Always
   status: {}
   ```

   Tiếp tục chỉnh sửa manifest YAML bằng cách thêm volume và các đường dẫn mount cho cả hai container. Cuối cùng, định nghĩa Pod có thể trông như thế này:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     creationTimestamp: null
     labels:
       run: alpine
     name: alpine
   spec:
     volumes:
     - name: shared-vol
       emptyDir: {}
     containers:
     - args:
       - /bin/sh
       - -c
       - while true; do sleep 60; done;
       image: alpine:3.12.0
       name: container1
       volumeMounts:
       - name: shared-vol
         mountPath: /etc/a
       resources: {}
     - args:
       - /bin/sh
       - -c
       - while true; do sleep 60; done;
       image: alpine:3.12.0
       name: container2
       volumeMounts:
       - name: shared-vol
         mountPath: /etc/b
       resources: {}
     dnsPolicy: ClusterFirst
     restartPolicy: Always
   status: {}
   ```

   Tạo Pod và kiểm tra xem nó đã được tạo đúng chưa. Bạn sẽ thấy Pod ở trạng thái Running với hai container sẵn sàng:

   ```shell
   $ kubectl apply -f multi-container-alpine.yaml
   pod/alpine created
   $ kubectl get pods
   NAME     READY   STATUS    RESTARTS   AGE
   alpine   2/2     Running   0          18s
   ```

   Dùng lệnh `exec` để mở shell vào container có tên `container1`. Tạo file `/etc/a/data/hello.txt` với nội dung tương ứng:

   ```shell
   $ kubectl exec alpine -c container1 -it -- /bin/sh
   / # cd /etc/a
   /etc/a # ls -l
   total 0
   /etc/a # mkdir data
   /etc/a # cd data/
   /etc/a/data # echo "Hello World" > hello.txt
   /etc/a/data # cat hello.txt
   Hello World
   /etc/a/data # exit
   ```

   Dùng lệnh `exec` để mở shell vào container có tên `container2`. Nội dung của file `/etc/b/data/hello.txt` phải là `Hello World`:

   ```shell
   $ kubectl exec alpine -c container2 -it -- /bin/sh
   / # cat /etc/b/data/hello.txt
   Hello World
   / # exit
   ```

## Chương 16, Persistent Volume

1. Bắt đầu bằng cách tạo một file mới tên `logs-pv.yaml`. Nội dung có thể trông như sau:

   ```yaml
   kind: PersistentVolume
   apiVersion: v1
   metadata:
     name: logs-pv
   spec:
     capacity:
       storage: 5Gi
     accessModes:
       - ReadWriteOnce
       - ReadOnlyMany
     hostPath:
       path: /var/logs
   ```

   Tạo đối tượng PersistentVolume và kiểm tra trạng thái của nó:

   ```shell
   $ kubectl apply -f logs-pv.yaml
   persistentvolume/logs-pv created
   $ kubectl get pv
   NAME      CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM \
     STORAGECLASS   REASON   AGE
   logs-pv   5Gi        RWO,ROX        Retain           Available \
                     18s
   ```

   Tạo file `logs-pvc.yaml` để định nghĩa PersistentVolumeClaim. Manifest YAML sau đây cho thấy nội dung của nó:

   ```yaml
   kind: PersistentVolumeClaim
   apiVersion: v1
   metadata:
     name: logs-pvc
   spec:
     accessModes:
       - ReadWriteOnce
     resources:
       requests:
         storage: 2Gi
     storageClassName: ""
   ```

   Tạo đối tượng PersistentVolume và kiểm tra trạng thái của nó:

   ```shell
   $ kubectl apply -f logs-pvc.yaml
   persistentvolumeclaim/logs-pvc created
   $ kubectl get pvc
   NAME       STATUS   VOLUME    CAPACITY   ACCESS MODES   STORAGECLASS
   logs-pvc   Bound    logs-pv   5Gi        RWO,ROX
   ```

   Tạo manifest YAML cơ bản bằng tùy chọn dòng lệnh `--dry-run`:

   ```shell
   $ kubectl run nginx --image=nginx:1.25.1 --dry-run=client \
     -o yaml > nginx-pod.yaml
   ```

   Bây giờ, chỉnh sửa file `nginx-pod.yaml` và gắn (bind) PersistentVolumeClaim vào nó:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     creationTimestamp: null
     labels:
       run: nginx
     name: nginx
   spec:
     volumes:
       - name: logs-volume
         persistentVolumeClaim:
           claimName: logs-pvc
     containers:
     - image: nginx:1.25.1
       name: nginx
       volumeMounts:
         - mountPath: "/var/log/nginx"
           name: logs-volume
       resources: {}
     dnsPolicy: ClusterFirst
     restartPolicy: Never
   status: {}
   ```

   Tạo Pod bằng lệnh sau và kiểm tra trạng thái của nó:

   ```shell
   $ kubectl apply -f nginx-pod.yaml
   pod/nginx created
   $ kubectl get pods
   NAME    READY   STATUS    RESTARTS   AGE
   nginx   1/1     Running   0          8s
   ```

   Dùng lệnh `exec` để mở một shell tương tác vào Pod và tạo một file trong thư mục đã mount:

   ```shell
   $ kubectl exec nginx -it -- /bin/sh
   # cd /var/log/nginx
   # touch my-nginx.log
   # ls
   access.log  error.log  my-nginx.log
   # exit
   ```

   Sau khi bạn tạo lại Pod, file được lưu trên PersistentVolume vẫn phải còn tồn tại:

   ```shell
   $ kubectl delete pod nginx
   pod "nginx" deleted
   $ kubectl apply -f nginx-pod.yaml
   pod/nginx created
   $ kubectl exec nginx -it -- /bin/sh
   # cd /var/log/nginx
   # ls
   access.log  error.log  my-nginx.log
   # exit
   ```

2. Tạo file `db-pvc.yaml` để định nghĩa PersistentVolumeClaim. Manifest YAML sau đây cho thấy nội dung của nó:

   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: db-pvc
     namespace: persistence
   spec:
     accessModes:
       - ReadWriteOnce
     storageClassName: local-path
     resources:
       requests:
         storage: 128Mi
   ```

   Tạo đối tượng PersistentVolumeClaim từ manifest YAML:

   ```shell
   $ kubectl apply -f db-pvc.yaml
   persistentvolumeclaim/db-pvc created
   ```

   Kiểm tra trạng thái của đối tượng PersistentVolumeClaim:

   ```shell
   $ kubectl get pvc -n persistence
   NAME     STATUS    VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   ..
   db-pvc   Pending                                      local-path     ..
   ```

   Đối tượng PersistentVolume tương ứng lúc này chưa được tạo:

   ```shell
   $ kubectl get pv -n persistence
   No resources found
   ```

   Tạo manifest YAML cơ bản bằng tùy chọn dòng lệnh `--dry-run`:

   ```shell
   $ kubectl run app-consuming-pvc --image=alpine:3.21.3 -n persistence \
     --dry-run=client --restart=Never -o yaml \
     -- /bin/sh -c "while true; do sleep 60; done;" \
     > alpine-pod.yaml
   ```

   Bây giờ, chỉnh sửa file `alpine-pod.yaml` và gắn (bind) PersistentVolumeClaim vào nó:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: app-consuming-pvc
     namespace: persistence
   spec:
     volumes:
       - name: app-storage
         persistentVolumeClaim:
           claimName: db-pvc
     containers:
     - image: alpine:3.21.3
       name: app
       command: ["/bin/sh"]
       args: ["-c", "while true; do sleep 60; done;"]
       volumeMounts:
         - mountPath: "/mnt/data"
           name: app-storage
     restartPolicy: Never
   ```

   Tạo Pod bằng lệnh sau:

   ```shell
   $ kubectl apply -f alpine-pod.yaml
   pod/app-consuming-pvc created
   ```

   Đảm bảo Pod chuyển sang trạng thái `Running`:

   ```shell
   $ kubectl get pods -n persistence
   NAME                READY   STATUS    RESTARTS   AGE
   app-consuming-pvc   1/1     Running   0          8s
   ```

   Đối tượng PersistentVolume đã được cấp phát động (dynamic provisioning):

   ```shell
   $ kubectl get pv -n persistence
   NAME                                       CAPACITY   ACCESS MODES   ..
   pvc-af39068d-0cc2-4625-8a56-7b5207b79ace   128Mi      RWO            ..
   ```

   Dùng lệnh `exec` để mở một shell tương tác vào Pod, và tạo một file trong thư mục đã mount:

   ```shell
   $ kubectl exec app-consuming-pvc -n persistence -it -- /bin/sh
   # cd /mnt/data
   # touch test.db
   # ls
   test.db
   # exit
   ```

   File sẽ được lưu bền vững trong PersistentVolume.

## Chương 17, Service

1. Tạo định nghĩa Deployment trong file `deployment.yaml`. Hãy chắc chắn expose hai container port, 80 và 9090:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: webapp
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: webapp
     template:
       metadata:
         labels:
           app: webapp
       spec:
         containers:
         - name: webapp
           image: nginxdemos/hello:0.4-plain-text
           ports:
           - containerPort: 80
           - containerPort: 9090
   ```

   Định nghĩa Service trong file `service.yaml`. Phần quan trọng nhất là ánh xạ port. Chỉ gán node port tĩnh 30080 cho ánh xạ port `web`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: webapp-service
   spec:
     type: NodePort
     selector:
       app: webapp
     ports:
     - name: web
       port: 80
       targetPort: 80
       nodePort: 30080
     - name: metrics
       port: 9090
       targetPort: 9090
   ```

   Tạo các đối tượng Deployment và Service của ứng dụng:

   ```shell
   $ kubectl apply -f deployment.yaml
   $ kubectl apply -f service.yaml
   ```

   Khi liệt kê, các đối tượng Deployment và Service sẽ trông tương tự như sau:

   ```shell
   $ kubectl get deployment,service
   NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
   deployment.apps/webapp   3/3     3            3           6s

   NAME                     TYPE       CLUSTER-IP      EXTERNAL-IP   \
   PORT(S)                       AGE
   service/webapp-service   NodePort   10.111.80.190   <none>        \
       80:30080/TCP,9090:31231/TCP   6s
   ```

   Để kiểm tra khả năng truy cập từ máy host của bạn, bạn có thể cấu hình port forwarding cho Service. Ở đây, chúng ta ánh xạ port 9091 của máy host tới port 80 của Service:

   ```shell
   $ kubectl port-forward service/webapp-service 9091:80 &
   Forwarding from 127.0.0.1:9091 -> 80
   Forwarding from [::1]:9091 -> 80
   Handling connection for 9091
   ```

   Giờ bạn có thể truy cập Service từ máy host bằng `curl`:

   ```shell
   $ curl localhost:9091
   Server address: 127.0.0.1:80
   Server name: webapp-6dc64898b-hwll6
   Date: 21/Aug/2025:02:09:01 +0000
   URI: /
   Request ID: b5e0f6324ad7bac1b513dba9d2c1cf64
   ```

2. Tạo định nghĩa Deployment cho database trong file `database-deployment.yaml`. Thiết lập các biến môi trường (environment variable) và expose container port 3306:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: database
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: database
     template:
       metadata:
         labels:
           app: database
       spec:
         containers:
         - name: mysql
           image: mysql:9.4.0
           env:
           - name: MYSQL_ROOT_PASSWORD
             value: secretpass
           - name: MYSQL_DATABASE
             value: myapp
           ports:
           - containerPort: 3306
   ```

   Định nghĩa Service cho database trong file `database-service.yaml`. Ánh xạ port 3306 tới target port 3306:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: database-service
   spec:
     type: ClusterIP
     selector:
       app: database
     ports:
     - port: 3306
       targetPort: 3306
   ```

   Định nghĩa Deployment cho frontend trong file `frontend-deployment.yaml`. Hãy chắc chắn định nghĩa lệnh theo đúng định dạng:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: frontend
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: frontend
     template:
       metadata:
         labels:
           app: frontend
       spec:
         containers:
         - name: frontend
           image: busybox:1.35
           command:
           - sh
           - -c
           - "while true; do nc -zv database-service 3306; sleep 5; done"
   ```

   Tạo các đối tượng Deployment và Service của ứng dụng:

   ```shell
   $ kubectl apply -f database-deployment.yaml
   $ kubectl apply -f database-service.yaml
   $ kubectl apply -f frontend-deployment.yaml
   ```

   Các Pod frontend có thể được chọn bằng label `app=frontend`. Log của cả hai Pod phải cho thấy kết nối tới Service database đã được thiết lập thành công. Thông báo lỗi trong log cho thấy có vấn đề về cấu hình:

   ```shell
   $ kubectl logs -l app=frontend
   database-service (10.101.125.103:3306) open
   database-service (10.101.125.103:3306) open
   ```

## Chương 18, Ingress

1. Định nghĩa namespace trong file `namespace.yaml`:

   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: webapp
   ```

   File `deployment.yaml` cho thấy các Deployment `frontend` và `api`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: frontend
     namespace: webapp
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: frontend
     template:
       metadata:
         labels:
           app: frontend
       spec:
         containers:
         - name: frontend
           image: nginx:1.29.1-alpine
           ports:
           - containerPort: 80
   ---
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: api
     namespace: webapp
   spec:
     replicas: 2
     selector:
       matchLabels:
         app: api
     template:
       metadata:
         labels:
           app: api
       spec:
         containers:
         - name: api
           image: httpd:2.4.65-alpine
           ports:
           - containerPort: 80
   ```

   File `services.yaml` định nghĩa các Service `frontend` và `api`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: frontend-service
     namespace: webapp
   spec:
     selector:
       app: frontend
     ports:
     - port: 80
       targetPort: 80
       protocol: TCP
     type: ClusterIP
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: api-service
     namespace: webapp
   spec:
     selector:
       app: api
     ports:
     - port: 80
       targetPort: 80
       protocol: TCP
     type: ClusterIP
   ```

   Cuối cùng, định nghĩa Ingress trong file `ingress.yaml`:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: webapp-ingress
     namespace: webapp
     annotations:
       nginx.ingress.kubernetes.io/rewrite-target: /
   spec:
     ingressClassName: nginx
     rules:
     - host: app.example.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: frontend-service
               port:
                 number: 80
         - path: /app
           pathType: Prefix
           backend:
             service:
               name: frontend-service
               port:
                 number: 80
         - path: /api
           pathType: Prefix
           backend:
             service:
               name: api-service
               port:
                 number: 80
   ```

   Tạo tất cả các đối tượng từ các manifest YAML:

   ```shell
   $ kubectl apply -f namespace.yaml
   $ kubectl apply -f deployments.yaml
   $ kubectl apply -f services.yaml
   $ kubectl apply -f ingress.yaml
   ```

   Chỉ dẫn ánh xạ `app.example.com` tới hostname của Ingress (thường thực hiện bằng cách chỉnh sửa `/etc/hosts`) chỉ cần thiết khi kiểm thử cục bộ trên máy của chính bạn, khi bạn muốn kiểm tra định tuyến dựa trên hostname. Trong kỳ thi, bước này không bắt buộc:

   ```shell
   sudo vim /etc/hosts
   127.0.0.1       app.example.com
   ```

   Kiểm tra đối tượng Ingress. Hãy chắc chắn rằng giá trị trong cột `ADDRESS` đã được điền:

   ```shell
   $ kubectl get ingress webapp-ingress -n webapp
   NAME             CLASS   HOSTS             ADDRESS        PORTS   AGE
   webapp-ingress   nginx   app.example.com   192.168.49.2   80      2m
   ```

   Kiểm tra tất cả các endpoint của Ingress bằng cách gửi yêu cầu `curl`:

   ```shell
   $ curl -H "Host: app.example.com" http://localhost/
   $ curl -H "Host: app.example.com" http://localhost/app
   $ curl -H "Host: app.example.com" http://localhost/api
   ```

2. Chúng ta sẽ dùng các lệnh mệnh lệnh (imperative) để thiết lập các đối tượng backend nhằm đẩy nhanh quá trình. Trước tiên, chúng ta cần tạo namespace `production-apps`:

   ```shell
   $ kubectl create namespace production-apps
   ```

   Sau đó chúng ta tạo các đối tượng Deployment blue và green:

   ```shell
   $ kubectl create deployment app-blue \
     --image=nginxdemos/hello:0.3-plain-text \
     --replicas=3 -n production-apps
   $ kubectl create deployment app-green \
     --image=nginxdemos/hello:0.4-plain-text \
     --replicas=3 -n production-apps
   ```

   Tiếp theo, tạo các đối tượng Service bằng lệnh `expose deployment`:

   ```shell
   $ kubectl expose deployment app-blue --name=app-blue-svc \
     --port=80 -n production-apps
   $ kubectl expose deployment app-green --name=app-green-svc \
     --port=80 -n production-apps
   ```

   Định nghĩa Ingress chính trong file `blue-ingress.yaml`:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: app-main
     namespace: production-apps
   spec:
     ingressClassName: nginx
     rules:
     - host: app.production.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: app-blue-svc
               port:
                 number: 80
   ```

   Định nghĩa Ingress canary trong file `green-ingress.yaml`:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: app-canary-weight
     namespace: production-apps
     annotations:
       nginx.ingress.kubernetes.io/canary: "true"
       nginx.ingress.kubernetes.io/canary-weight: "20"
   spec:
     ingressClassName: nginx
     rules:
     - host: app.production.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: app-green-svc
               port:
                 number: 80
   ```

   Tạo các đối tượng Ingress từ các manifest YAML:

   ```shell
   $ kubectl apply -f blue-ingress.yaml
   $ kubectl apply -f green-ingress.yaml
   ```

   Bạn có thể ánh xạ `localhost` tới hostname mà các đối tượng Ingress sử dụng để có thể truy cập chúng từ máy cục bộ:

   ```shell
   sudo vim /etc/hosts
   127.0.0.1       app.production.com
   ```

   Kiểm tra các đối tượng Ingress. Hãy chắc chắn rằng giá trị trong cột `ADDRESS` đã được điền:

   ```shell
   $ kubectl get ingresses -n production-apps
   NAME                CLASS   HOSTS                ADDRESS        PORTS
   app-canary-weight   nginx   app.production.com   192.168.49.2   80
   app-main            nginx   app.production.com   192.168.49.2   80
   ```

   Để thấy sự phân phối định tuyến lưu lượng trong thực tế, hãy chạy lệnh `curl` trong một vòng lặp `for`. Bạn sẽ thấy hầu hết các yêu cầu được định tuyến tới Pod "blue", và một phần nhỏ các yêu cầu được định tuyến tới Pod "green":

   ```shell
   for i in {1..10}; do curl -s -H "Host: app.production.com" \
     http://localhost | grep -o "Server name:.*"; done
   ```

## Chương 19, Gateway API

1. Bạn có thể tìm hướng dẫn cài đặt controller NGINX Gateway Fabric trong tài liệu chính thức. Hãy làm theo hướng dẫn của phương pháp cài đặt mà bạn ưa thích.

   Tạo các đối tượng Deployment và Service của ứng dụng. Bạn có thể dùng file `setup.yaml` để thiết lập tất cả cùng lúc. Lời giải trong file này tạo nội dung tại đường dẫn mount của container `/usr/share/nginx/html/web` cho các Pod `web-app`, và nội dung tại đường dẫn mount của container `/usr/local/apache2/htdocs/api` cho các Pod `api-app`:

   ```shell
   $ kubectl apply -f setup.yaml
   ```

   Đảm bảo các đối tượng đã sẵn sàng:

   ```shell
   $ kubectl get deployments,services,pods
   ```

   Cấu hình các tài nguyên Gateway API. Định nghĩa Gateway trong file `gateway.yaml`:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1
   kind: Gateway
   metadata:
     name: main-gateway
   spec:
     gatewayClassName: nginx
     listeners:
     - name: http
       port: 80
       protocol: HTTP
       hostname: example.local
   ```

   Định nghĩa Gateway trong file `httproute.yaml`:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1
   kind: HTTPRoute
   metadata:
     name: app-routes
   spec:
     parentRefs:
     - name: main-gateway
     hostnames:
     - example.local
     rules:
     - matches:
       - path:
           type: PathPrefix
           value: /web
       backendRefs:
       - name: web-app
         port: 80
     - matches:
       - path:
           type: PathPrefix
           value: /api
       backendRefs:
       - name: api-app
         port: 80
   ```

   Tạo các đối tượng Gateway bằng các lệnh sau:

   ```shell
   $ kubectl apply -f gateway.yaml
   $ kubectl apply -f httproute.yaml
   ```

   Kiểm tra xem Gateway đã được gán địa chỉ IP chưa. Việc này có thể mất vài phút:

   ```shell
   $ kubectl get gateway main-gateway -o \
     jsonpath='{.status.addresses[0].value}'
   ```

   Lệnh sau xác minh rằng trạng thái của điều kiện `Accepted` của HTTPRoute hiển thị `True`:

   ```shell
   $ kubectl get httproute app-routes -o \
     jsonpath='{.status.parents[*].conditions[?(@.type=="Accepted")].status}'
   ```

   Port forward tới Gateway:

   ```shell
   $ kubectl port-forward svc/main-gateway-nginx 8080:80 &
   ```

   Bạn sẽ có thể truy cập Gateway bằng `curl`:

   ```shell
   $ curl -H "Host: example.local" http://localhost:8080/web/
   $ curl -H "Host: example.local" http://localhost:8080/api/
   ```

2. Tạo các namespace và các ứng dụng chạy trong đó từ file `setup.yaml`:

   ```shell
   $ kubectl apply -f setup.yaml
   ```

   Cấu hình Gateway trong file `gateway.yaml`. Cho phép chấp nhận định tuyến từ tất cả các namespace:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1
   kind: Gateway
   metadata:
     name: gateway
     namespace: production
   spec:
     gatewayClassName: nginx
     listeners:
     - name: http
       port: 80
       protocol: HTTP
       hostname: example.com
       allowedRoutes:
         namespaces:
           from: All
   ```

   Tạo HTTPRoute trong namespace `production` trong file `production-route.yaml`:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1
   kind: HTTPRoute
   metadata:
     name: prod-route
     namespace: production
   spec:
     parentRefs:
     - name: gateway
     hostnames:
     - example.com
     rules:
     - matches:
       - path:
           type: Exact
           value: /app
       backendRefs:
       - name: prod-web
         port: 80
       filters:
       - type: URLRewrite
         urlRewrite:
           path:
             type: ReplaceFullPath
             replaceFullPath: /
       - type: RequestHeaderModifier
         requestHeaderModifier:
           set:
           - name: X-Environment
             value: production
   ```

   Tạo HTTPRoute trong namespace `staging` trong file `staging-route.yaml`:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1
   kind: HTTPRoute
   metadata:
     name: staging-route
     namespace: staging
   spec:
     parentRefs:
     - name: gateway
       namespace: production
     hostnames:
     - example.com
     rules:
     - matches:
       - path:
           type: PathPrefix
           value: /staging
       backendRefs:
       - name: staging-web
         port: 80
       filters:
       - type: URLRewrite
         urlRewrite:
           path:
             type: ReplacePrefixMatch
             replacePrefixMatch: /
       - type: RequestHeaderModifier
         requestHeaderModifier:
           set:
           - name: X-Environment
             value: staging
   ```

   Tạo ReferenceGrant cho truy cập liên namespace trong file `reference-grant.yaml`:

   ```yaml
   apiVersion: gateway.networking.k8s.io/v1beta1
   kind: ReferenceGrant
   metadata:
     name: allow-staging-to-gateway
     namespace: production
   spec:
     from:
     - group: gateway.networking.k8s.io
       kind: HTTPRoute
       namespace: staging
     to:
     - group: gateway.networking.k8s.io
       kind: Gateway
       name: gateway
   ```

   Tạo tất cả các đối tượng HTTPRoute:

   ```shell
   $ kubectl apply -f gateway.yaml
   $ kubectl apply -f production-route.yaml
   $ kubectl apply -f staging-route.yaml
   $ kubectl apply -f reference-grant.yaml
   ```

   Port forward tới Gateway:

   ```shell
   $ kubectl port-forward -n production svc/gateway-nginx 8080:80 &
   ```

   Bạn sẽ có thể truy cập Gateway bằng `curl`:

   ```shell
   $ curl -H "Host: example.com" http://localhost:8080/app
   $ curl -H "Host: example.com" http://localhost:8080/staging
   ```

## Chương 20, Network Policy

1. Tạo NetworkPolicy cho các Pod có label `app=alpha-app` trong file `alpha-app-policy.yaml`. NetworkPolicy này cho phép lưu lượng egress tới các Pod trong namespace được gán label `team=beta`. Nó từ chối mọi lưu lượng egress khác ngoại trừ DNS, thể hiện qua port 53:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: alpha-app-policy
     namespace: team-alpha
   spec:
     podSelector:
       matchLabels:
         app: alpha-app
     policyTypes:
     - Egress
     egress:
     - to:
       - namespaceSelector:
           matchLabels:
             team: beta
     - to:
       ports:
       - protocol: UDP
         port: 53
       - protocol: TCP
         port: 53
   ```

   NetworkPolicy định nghĩa trong file `beta-app-policy.yaml` trông đơn giản hơn một chút. Nó cho phép Pod `beta-app` nhận lưu lượng từ namespace `team-alpha` trên port 80:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: beta-app-policy
     namespace: team-beta
   spec:
     podSelector:
       matchLabels:
         app: beta-app
     policyTypes:
     - Ingress
     ingress:
     - from:
       - namespaceSelector:
           matchLabels:
             team: alpha
       ports:
       - protocol: TCP
         port: 80
   ```

   Tạo cả hai đối tượng NetworkPolicy:

   ```shell
   $ kubectl apply -f alpha-app-policy.yaml
   $ kubectl apply -f beta-app-policy.yaml
   ```

   Dùng lệnh `curl` để kiểm tra việc Pod `alpha-app` gọi tới Service `beta-app` trong namespace `team-beta`. Lệnh này phải thành công:

   ```shell
   $ kubectl exec -it alpha-app -n team-alpha -- \
     curl -v --connect-timeout 2 \
     http://beta-app.team-beta.svc.cluster.local:8080
   ```

   Dùng lệnh `curl` để kiểm tra việc Pod `alpha-app` truy cập một địa chỉ trên internet. Lệnh này phải thất bại:

   ```shell
   $ kubectl exec -it alpha-app -n team-alpha -- \
     curl -v --connect-timeout 2 http://google.com
   ```

   Dùng lệnh `curl` để kiểm tra kết nối tới Service `beta-app` từ một Pod tạm thời trong cùng namespace. Lệnh này phải thất bại:

   ```shell
   $ kubectl run test-pod --image=alpine/curl:8.14.1 -n team-beta --rm -it \
     --restart=Never -- curl -v --connect-timeout 2 http://beta-app:8080
   ```

2. Các network policy có tính cộng dồn (additive), nghĩa là bạn có thể áp dụng chúng theo bất kỳ thứ tự nào. Để các thay đổi dễ hiểu hơn, bạn có thể muốn bắt đầu với policy từ chối trước. File `default-deny-all.yaml` cho thấy nội dung của NetworkPolicy từ chối mọi giao tiếp ingress trong namespace `production`:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: default-deny-ingress
     namespace: production
   spec:
     podSelector: {}
     policyTypes:
     - Ingress
   ```

   Tạo NetworkPolicy cho thành phần database trong file `database-policy.yaml`. NetworkPolicy này áp dụng cho các Pod có label `tier=database` và chỉ cho phép lưu lượng ingress từ các Pod có label `tier=backend` trên port 6379:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: database-policy
     namespace: production
   spec:
     podSelector:
       matchLabels:
         tier: database
     policyTypes:
     - Ingress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             tier: backend
       ports:
       - protocol: TCP
         port: 6379
   ```

   Tạo NetworkPolicy cho thành phần backend trong file `backend-policy.yaml`. Policy này áp dụng cho các Pod có label `tier=backend`. Nó cho phép lưu lượng đến từ microservice frontend và lưu lượng đi tới microservice database:

   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: backend-policy
     namespace: production
   spec:
     podSelector:
       matchLabels:
         tier: backend
     policyTypes:
     - Ingress
     - Egress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             tier: frontend
       ports:
       - protocol: TCP
         port: 80
     egress:
     - to:
       - podSelector:
           matchLabels:
             tier: database
       ports:
       - protocol: TCP
         port: 6379
     - to:
       ports:
       - protocol: UDP
         port: 53
       - protocol: TCP
         port: 53
   ```

   Tạo tất cả các đối tượng NetworkPolicy:

   ```shell
   $ kubectl apply -f default-deny-all.yaml
   $ kubectl apply -f database-policy.yaml
   $ kubectl apply -f backend-policy.yaml
   ```

   Dùng lệnh `curl` từ Pod `frontend` để kiểm tra kết nối tới Pod `database`. Ở đây chúng ta dùng giao thức `telnet` để đảm bảo nó có thể kết nối tới port của database. Lệnh này phải thất bại:

   ```shell
   $ kubectl exec -it frontend -n production -- curl -v --connect-timeout 2 \
     telnet://database:3306
   ```

   Dùng lệnh `curl` từ Pod `frontend` để kiểm tra kết nối tới Pod `backend`. Lệnh này phải thành công:

   ```shell
   $ kubectl exec -it frontend -n production -- curl -v --connect-timeout 2 \
     http://backend:80
   ```

   Dùng lệnh `curl` từ Pod `backend` để kiểm tra kết nối tới Pod `database`. Lệnh này phải thành công. Tương tự lệnh đầu tiên, chúng ta dùng giao thức `telnet`:

   ```shell
   $ kubectl exec -it backend -n production -- curl -v --connect-timeout 2 \
     telnet://database:3306
   ```

## Chương 21, Xử lý sự cố ứng dụng

1. Trước tiên, tạo Pod bằng nội dung YAML đã cho:

   ```shell
   $ kubectl apply -f setup.yaml
   pod/date-recorder created
   ```

   Kiểm tra trạng thái của Pod không thấy vấn đề gì rõ ràng. Trạng thái là `Running`:

   ```shell
   $ kubectl get pods
   NAME            READY   STATUS    RESTARTS   AGE
   date-recorder   1/1     Running   0          5s
   ```

   Hiển thị log của container. Thông báo lỗi trả về cho biết file hoặc thư mục `/root/tmp/startup-marker.txt` không tồn tại:

   ```shell
   $ kubectl logs date-recorder
   [Error: ENOENT: no such file or directory, open \
   '/root/tmp/startup-marker.txt'] {
     errno: -2,
     code: 'ENOENT',
     syscall: 'open',
     path: '/root/tmp/curr-date.txt'
   }
   ```

   Chúng ta có thể thử mở shell vào container; tuy nhiên, container image không cung cấp shell:

   ```shell
   $ kubectl exec -it date-recorder -- /bin/sh
   OCI runtime exec failed: exec failed: unable to start container \
   process: exec: "/bin/sh": stat /bin/sh: no such file or \
   directory: unknown
   command terminated with exit code 126
   ```

   Chúng ta có thể dùng lệnh `debug` để tạo một container gỡ lỗi phục vụ xử lý sự cố. Cờ `--share-processes` cho phép chúng ta chia sẻ tiến trình `nodejs` đang chạy:

   ```shell
   $ kubectl debug -it date-recorder --image=busybox --target=debian \
     --share-processes
   Targeting container "debian". If you don't see processes from this \
   container it may be because the container runtime doesn't support \
   this feature.
   Defaulting debug container name to debugger-rns89.
   If you don't see a command prompt, try pressing enter.
   / # ps
   PID   USER     TIME  COMMAND
       1 root      4:21 /nodejs/bin/node -e const fs = require('fs'); \
       let timestamp = Date.now(); fs.writeFile('/root/tmp/startup-m
      35 root      0:00 sh
      41 root      0:00 ps
   ```

   Rõ ràng, thư mục mà chúng ta muốn ghi vào quả thực không tồn tại:

   ```shell
   $ kubectl exec failing-pod -it -- /bin/sh
   / # ls /root/tmp
   ls: /root/tmp: No such file or directory
   ```

   Có lẽ chúng ta sẽ muốn thay đổi lệnh chạy container gốc để trỏ tới thư mục thực sự tồn tại khi container khởi động. Hoặc, có thể hợp lý hơn khi mount một volume tạm thời (ephemeral) để cung cấp thư mục đó, như minh họa ở đây:

   ```yaml
   apiVersion: v1
   kind: Pod
   metadata:
     name: date-recorder
   spec:
     containers:
     - name: debian
       image: gcr.io/distroless/nodejs20-debian11
       command: ["/nodejs/bin/node", "-e", "const fs = require('fs'); \
       let timestamp = Date.now(); fs.writeFile('/var/startup/\
       startup-marker.txt', timestamp.toString(), err => { if (err) { \
       console.error(err); } while(true) {} });"]
       volumeMounts:
       - mountPath: /var/startup
         name: init-volume
     volumes:
     - name: init-volume
       emptyDir: {}
   ```

2. Tạo các đối tượng từ file `setup.yaml`. Từ output bạn sẽ thấy ít nhất ba đối tượng đã được tạo: một namespace, một Deployment và một Service:

   ```shell
   $ kubectl apply -f setup.yaml
   namespace/y72 created
   deployment.apps/web-app created
   service/web-app created
   ```

   Bạn có thể liệt kê tất cả các đối tượng liên quan đến kịch bản bằng lệnh sau:

   ```shell
   $ kubectl get all -n y72
   NAME                           READY   STATUS    RESTARTS   AGE
   pod/web-app-5f77f59c78-8svdm   1/1     Running   0          10m
   pod/web-app-5f77f59c78-mhvjz   1/1     Running   0          10m

   NAME              TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)
   service/web-app   ClusterIP   10.106.215.153   <none>        80/TCP

   NAME                      READY   UP-TO-DATE   AVAILABLE   AGE
   deployment.apps/web-app   2/2     2            2           10m

   NAME                                 DESIRED   CURRENT   READY   AGE
   replicaset.apps/web-app-5f77f59c78   2         2         2       10m
   ```

   Service có tên `web-app` và có kiểu `ClusterIP`. Bạn chỉ có thể truy cập Service từ bên trong cluster. Việc thử kết nối tới Service bằng tên DNS của nó từ một Pod tạm thời trong cùng namespace sẽ không được phép:

   ```shell
   $ kubectl run tmp --image=busybox --restart=Never -it --rm -n y72 \
     -- wget web-app
   Connecting to web-app (10.106.215.153:80)
   wget: can't connect to remote host (10.106.215.153): Connection refused
   pod "tmp" deleted
   pod y72/tmp terminated (Error)
   ```

   Endpoint của Service `web-app` không thể phân giải được, như lệnh sau cho thấy:

   ```shell
   $ kubectl get endpoints -n y72
   NAME      ENDPOINTS   AGE
   web-app   <none>      15m
   ```

   Mô tả (describe) đối tượng Service cung cấp cho bạn thêm thông tin, ví dụ label selector và target port:

   ```shell
   $ kubectl describe service web-app -n y72
   Name:                     web-app
   Namespace:                y72
   Labels:                   <none>
   Annotations:              <none>
   Selector:                 run=myapp
   Type:                     ClusterIP
   IP Family Policy:         SingleStack
   IP Families:              IPv4
   IP:                       10.106.215.153
   IPs:                      10.106.215.153
   Port:                     <unset>  80/TCP
   TargetPort:               3001/TCP
   Endpoints:                <none>
   Session Affinity:         None
   Events:                   <none>
   ```

   Khi kiểm tra Deployment, bạn sẽ thấy Pod template dùng label `app=webapp`. Container port được đặt là 3000. Thông tin này không khớp với cấu hình của Service. Các endpoint của Service `web-app` giờ trỏ tới địa chỉ IP và container port của các replica do Deployment quản lý:

   ```shell
   $ kubectl get endpoints -n y72
   NAME      ENDPOINTS                           AGE
   web-app   10.244.0.3:3000,10.244.0.4:3000     24m
   ```

   Chỉnh sửa đối tượng Service đang chạy (live object). Đổi label selector từ `run=myapp` thành `app=webapp`, và target port từ 3001 thành 3000:

   ```shell
   $ kubectl edit service web-app -n y72
   service/web-app edited
   ```

   Sau khi thay đổi cấu hình Service, bạn sẽ thấy mình có thể mở kết nối tới Pod đang chạy ứng dụng:

   ```shell
   $ kubectl run tmp --image=busybox:1.36.1 --restart=Never -it --rm -n y72 \
     -- wget web-app
   Connecting to web-app (10.106.215.153:80)
   saving to 'index.html'
   index.html           100% |********************************| ...
   'index.html' saved
   pod "tmp" deleted
   ```

3. Tạo namespace bằng:

   ```shell
   $ kubectl create ns stress-test
   namespace/stress-test created
   ```

   Tạo tất cả các Pod bằng cách trỏ lệnh `apply` tới thư mục hiện tại:

   ```shell
   $ kubectl apply -f ./
   pod/stress-1 created
   pod/stress-2 created
   pod/stress-3 created
   ```

   Lấy metrics của các Pod từ Metrics Server bằng lệnh `top`:

   ```shell
   $ kubectl top pods -n stress-test
   NAME       CPU(cores)   MEMORY(bytes)
   stress-1   50m          77Mi
   stress-2   74m          138Mi
   stress-3   58m          94Mi
   ```

   Pod tiêu thụ nhiều memory nhất là Pod có tên `stress-2`. Metrics trên máy của bạn sẽ khác, vì lượng memory tiêu thụ được ngẫu nhiên hóa bởi lệnh thực thi trong mỗi container.

## Chương 22, Xử lý sự cố cluster

1. Liệt kê tất cả các node trong cluster. Bạn sẽ thấy node `worker-2` có trạng thái `NotReady,SchedulingDisabled`:

   ```shell
   $ kubectl get nodes
   NAME            STATUS                        ROLES           AGE   VER
   control-plane   Ready                         control-plane   23m   v1.
   worker-1        Ready                         <none>          23m   v1.
   worker-2        NotReady,SchedulingDisabled   <none>          23m   v1.
   ```

   Kiểm tra lý do việc lập lịch bị vô hiệu hóa. Lệnh này hiển thị một taint cho biết workload không thể được lập lịch lên node:

   ```shell
   $ kubectl describe node worker-node-2 | grep -i taint
   ```

   Kiểm tra các điều kiện (condition) khác của node. Bạn sẽ thấy thông báo "Kubelet stopped posting node status":

   ```shell
   $ kubectl describe node worker-node-2 | grep -A10 Conditions
   ```

   Uncordon node để cho phép lập lịch lên node trở lại:

   ```shell
   $ kubectl uncordon worker-node-2
   ```

   Kiểm tra xem kubelet trên worker node có hoạt động tốt không. SSH vào node và kiểm tra trạng thái kubelet. Bạn sẽ thấy tiến trình kubelet đang không hoạt động (inactive):

   ```shell
   $ ssh worker-node-2
   $ sudo systemctl status kubelet
   ```

   Khởi động lại tiến trình kubelet và xác minh nó đang chạy bình thường:

   ```shell
   $ sudo systemctl restart kubelet
   $ sudo systemctl status kubelet
   ```

   Kiểm tra trạng thái node. Tất cả các node phải hiển thị `Ready` mà không có `SchedulingDisabled`:

   ```shell
   $ kubectl get nodes
   ```

   Chạy một Pod thử nghiệm cụ thể trên `worker-node-2`. Xác minh Pod đang chạy trên đúng node:

   ```shell
   $ kubectl run test-pod --image=nginx:1.29.1 --overrides=\
   '{"spec":{"nodeSelector":{"kubernetes.io/hostname":"worker-node-2"}}}'
   $ kubectl get pod test-pod -o wide
   ```

2. Tạo Deployment với các tham số được cung cấp trong đề bài:

   ```shell
   $ kubectl create deployment test-app --image=nginx:1.29.1 --replicas=3
   ```

   Kiểm tra trạng thái các Pod do ReplicaSet quản lý. Tất cả các Pod sẽ có trạng thái `Pending`:

   ```shell
   $ kubectl get pods
   NAME                        READY   STATUS    RESTARTS   AGE
   test-app-5d4d5b6c7b-h2x4m   0/1     Pending   0          2m
   test-app-5d4d5b6c7b-k9p3n   0/1     Pending   0          2m
   test-app-5d4d5b6c7b-x7v2q   0/1     Pending   0          2m
   ```

   Kiểm tra lý do các Pod đang pending. Mô tả (describe) một Pod đang pending để xem các event của nó. Output cho thấy `no scheduler found`:

   ```shell
   $ kubectl describe pod test-app-5d4d5b6c7b-h2x4m | tail -10
   ```

   Kiểm tra các Pod trong namespace `kube-system`. Scheduler đang ở trạng thái `ImagePullBackOff`:

   ```shell
   $ kubectl get pods -n kube-system | grep -E \
     "scheduler|controller|apiserver|etcd"
   ```

   Điều tra Pod của scheduler. Scheduler đang cố dùng một phiên bản image không tồn tại:

   ```shell
   $ kubectl describe pod kube-scheduler-master-node -n kube-system \
     | grep -A5 Events
   ```

   Sửa manifest của scheduler. SSH vào node control plane. Chỉnh sửa manifest cấu hình scheduler. Sửa manifest của scheduler bằng cách đổi image tag thành phiên bản của node control plane, ví dụ v1.33.2:

   ```shell
   $ ssh control-plane
   $ sudo vi /etc/kubernetes/manifests/kube-scheduler.yaml
   ```

   Đợi một lát để kubelet phát hiện thay đổi và khởi động lại Pod của scheduler. Khi Pod của scheduler trở lại hoạt động bình thường, bạn có thể kiểm tra lại các Pod `test-app`:

   ```shell
   $ kubectl get pods
   NAME                        READY   STATUS    RESTARTS   AGE
   test-app-5d4d5b6c7b-h2x4m   1/1     Running   0          8m
   test-app-5d4d5b6c7b-k9p3n   1/1     Running   0          8m
   test-app-5d4d5b6c7b-x7v2q   1/1     Running   0          8m
   ```

   Tất cả các Pod phải trở lại trạng thái `Running`.
