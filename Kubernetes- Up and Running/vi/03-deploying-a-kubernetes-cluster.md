# Chương 3. Triển khai một Kubernetes Cluster

Giờ bạn đã xây dựng thành công một application container, bước tiếp theo là học cách biến nó thành một hệ thống phân tán hoàn chỉnh, đáng tin cậy và có khả năng mở rộng. Để làm điều đó, bạn cần một Kubernetes cluster đang hoạt động. Ở thời điểm này, có các dịch vụ Kubernetes trên cloud ở hầu hết các public cloud giúp dễ dàng tạo một cluster chỉ với vài lệnh dòng lệnh. Chúng tôi rất khuyến nghị cách tiếp cận này nếu bạn mới bắt đầu với Kubernetes. Ngay cả khi cuối cùng bạn dự định chạy Kubernetes trên bare metal, đây vẫn là một cách tốt để nhanh chóng bắt đầu với Kubernetes, tìm hiểu về bản thân Kubernetes, rồi sau đó học cách cài đặt nó trên các máy vật lý. Hơn nữa, quản lý một Kubernetes cluster bản thân nó là một nhiệm vụ phức tạp, và với hầu hết mọi người, việc chuyển giao việc quản lý này cho cloud là hợp lý, đặc biệt khi dịch vụ quản lý này là miễn phí trên hầu hết các cloud.

Dĩ nhiên, sử dụng giải pháp trên cloud đòi hỏi phải trả tiền cho các tài nguyên cloud đó cũng như có kết nối mạng hoạt động đến cloud. Vì những lý do này, phát triển cục bộ có thể hấp dẫn hơn, và trong trường hợp đó, công cụ `minikube` cung cấp một cách dễ sử dụng để dựng một Kubernetes cluster cục bộ chạy trong một VM trên laptop hoặc desktop của bạn. Mặc dù đây là một lựa chọn tốt, `minikube` chỉ tạo một cluster đơn node, không thể hiện được hết mọi khía cạnh của một Kubernetes cluster hoàn chỉnh. Vì lý do đó, chúng tôi khuyến nghị mọi người bắt đầu với giải pháp trên cloud, trừ khi nó thực sự không phù hợp với tình huống của họ. Một lựa chọn thay thế gần đây hơn là chạy một cluster Docker-in-Docker, có thể dựng một cluster nhiều node trên một máy duy nhất. Tuy nhiên, dự án này vẫn đang ở giai đoạn beta, nên hãy lưu ý rằng bạn có thể gặp các vấn đề không mong đợi.

Nếu bạn thực sự nhất quyết bắt đầu trên bare metal, hãy xem Phụ lục ở cuối cuốn sách này để có hướng dẫn xây dựng một cluster từ một tập các máy tính bo mạch đơn Raspberry Pi. Các hướng dẫn này sử dụng công cụ `kubeadm` và có thể được điều chỉnh cho các máy khác ngoài Raspberry Pi.

## Cài đặt Kubernetes trên nhà cung cấp Public Cloud

Chương này bao gồm việc cài đặt Kubernetes trên ba nhà cung cấp cloud lớn: Google Cloud Platform, Microsoft Azure và Amazon Web Services.

Nếu bạn chọn sử dụng một nhà cung cấp cloud để quản lý Kubernetes, bạn chỉ cần cài đặt một trong các lựa chọn này; một khi đã có cluster được cấu hình và sẵn sàng, bạn có thể chuyển đến phần "Kubernetes Client", trừ khi bạn muốn cài đặt Kubernetes ở nơi khác.

### Cài đặt Kubernetes với Google Kubernetes Engine

Google Cloud Platform (GCP) cung cấp một dịch vụ Kubernetes-as-a-Service được lưu trữ gọi là Google Kubernetes Engine (GKE). Để bắt đầu với GKE, bạn cần một tài khoản Google Cloud Platform đã kích hoạt thanh toán và công cụ `gcloud` đã được cài đặt.

Một khi đã cài đặt `gcloud`, hãy thiết lập một zone mặc định:

```
$ gcloud config set compute/zone us-west1-a
```

Sau đó bạn có thể tạo một cluster:

```
$ gcloud container clusters create kuar-cluster --num-nodes=3
```

Việc này sẽ mất vài phút. Khi cluster đã sẵn sàng, bạn có thể lấy thông tin xác thực (credentials) cho cluster bằng:

```
$ gcloud container clusters get-credentials kuar-cluster
```

Nếu gặp khó khăn, bạn có thể tìm hướng dẫn đầy đủ để tạo một GKE cluster trong tài liệu của Google Cloud Platform.

### Cài đặt Kubernetes với Azure Kubernetes Service

Microsoft Azure cung cấp một dịch vụ Kubernetes-as-a-Service được lưu trữ như một phần của Azure Container Service. Cách dễ nhất để bắt đầu với Azure Container Service là dùng Azure Cloud Shell tích hợp sẵn trong Azure portal. Bạn có thể kích hoạt shell bằng cách nhấp vào biểu tượng shell trên thanh công cụ phía trên bên phải:

![Biểu tượng Azure Cloud Shell](images/ch03-azure-shell-icon.png)

Shell này có công cụ `az` được cài đặt và cấu hình tự động để làm việc với môi trường Azure của bạn.

Ngoài ra, bạn có thể cài đặt `az` CLI trên máy cục bộ của mình.

Khi shell đã sẵn sàng và hoạt động, bạn có thể chạy:

```
$ az group create --name=kuar --location=westus
```

Một khi resource group đã được tạo, bạn có thể tạo một cluster bằng:

```
$ az aks create --resource-group=kuar --name=kuar-cluster
```

Việc này sẽ mất vài phút. Khi cluster đã được tạo, bạn có thể lấy thông tin xác thực cho cluster bằng:

```
$ az aks get-credentials --resource-group=kuar --name=kuar-cluster
```

Nếu bạn chưa cài đặt công cụ `kubectl`, bạn có thể cài nó bằng:

```
$ az aks install-cli
```

Bạn có thể tìm hướng dẫn đầy đủ về cài đặt Kubernetes trên Azure trong tài liệu của Azure.

### Cài đặt Kubernetes trên Amazon Web Services

Amazon cung cấp một dịch vụ Kubernetes được quản lý gọi là Elastic Kubernetes Service (EKS). Cách dễ nhất để tạo một EKS cluster là thông qua công cụ dòng lệnh mã nguồn mở `eksctl`.

Một khi đã cài đặt `eksctl` và có trong path, bạn có thể chạy lệnh sau để tạo một cluster:

```
$ eksctl create cluster
```

Để biết thêm chi tiết về các tùy chọn cài đặt (như kích cỡ node và nhiều thứ khác), xem trợ giúp bằng lệnh này:

```
$ eksctl create cluster --help
```

Quá trình cài đặt cluster bao gồm cấu hình phù hợp cho công cụ dòng lệnh `kubectl`. Nếu bạn chưa cài đặt `kubectl`, hãy làm theo hướng dẫn trong tài liệu.

## Cài đặt Kubernetes cục bộ bằng minikube

Nếu bạn cần trải nghiệm phát triển cục bộ, hoặc không muốn trả tiền cho tài nguyên cloud, bạn có thể cài đặt một cluster đơn node đơn giản bằng `minikube`. Ngoài ra, nếu bạn đã cài đặt Docker Desktop, nó đi kèm với một bản cài đặt Kubernetes trên một máy.

Mặc dù `minikube` (hoặc Docker Desktop) là một mô phỏng tốt của Kubernetes cluster, nó thực sự chỉ dành cho phát triển cục bộ, học tập và thử nghiệm. Vì nó chỉ chạy trong một VM trên một node duy nhất, nó không cung cấp độ tin cậy của một Kubernetes cluster phân tán. Ngoài ra, một số tính năng được mô tả trong cuốn sách này yêu cầu tích hợp với nhà cung cấp cloud. Các tính năng này hoặc không có sẵn hoặc hoạt động hạn chế với `minikube`.

> **LƯU Ý**
>
> Bạn cần có một hypervisor được cài đặt trên máy để sử dụng `minikube`. Với Linux và macOS, đây thường là VirtualBox. Trên Windows, hypervisor Hyper-V là lựa chọn mặc định. Hãy đảm bảo bạn cài đặt hypervisor trước khi dùng `minikube`.

Bạn có thể tìm công cụ `minikube` trên GitHub. Có các file nhị phân cho Linux, macOS và Windows để bạn tải xuống. Một khi đã cài đặt công cụ `minikube`, bạn có thể tạo một cluster cục bộ bằng:

```
$ minikube start
```

Lệnh này sẽ tạo một VM cục bộ, cấp phát Kubernetes và tạo một cấu hình `kubectl` cục bộ trỏ đến cluster đó. Như đã đề cập trước đó, cluster này chỉ có một node, nên mặc dù hữu ích, nó có một số khác biệt so với hầu hết các triển khai Kubernetes trong production.

Khi đã dùng xong cluster, bạn có thể dừng VM bằng:

```
$ minikube stop
```

Nếu bạn muốn xóa cluster, bạn có thể chạy:

```
$ minikube delete
```

## Chạy Kubernetes trong Docker

Một cách tiếp cận khác để chạy Kubernetes cluster, được phát triển gần đây hơn, sử dụng các Docker container để mô phỏng nhiều Kubernetes node thay vì chạy mọi thứ trong một máy ảo. Dự án `kind` cung cấp một trải nghiệm tuyệt vời để khởi chạy và quản lý các cluster kiểm thử trong Docker. (`kind` là viết tắt của Kubernetes IN Docker.) `kind` vẫn đang trong quá trình phát triển (trước 1.0), nhưng được sử dụng rộng rãi bởi những người xây dựng Kubernetes để kiểm thử nhanh và dễ dàng.

Hướng dẫn cài đặt cho nền tảng của bạn có thể tìm thấy trên trang web của `kind`. Một khi đã cài đặt, việc tạo một cluster đơn giản như sau:

```
$ kind create cluster --wait 5m
$ export KUBECONFIG="$(kind get kubeconfig-path)"
$ kubectl cluster-info
$ kind delete cluster
```

## Kubernetes Client

Client chính thức của Kubernetes là `kubectl`: một công cụ dòng lệnh để tương tác với Kubernetes API. `kubectl` có thể được dùng để quản lý hầu hết các đối tượng Kubernetes, như Pod, ReplicaSet và Service. `kubectl` cũng có thể được dùng để khám phá và kiểm tra sức khỏe tổng thể của cluster.

Chúng ta sẽ dùng công cụ `kubectl` để khám phá cluster bạn vừa tạo.

### Kiểm tra trạng thái Cluster

Điều đầu tiên bạn có thể làm là kiểm tra phiên bản của cluster đang chạy:

```
$ kubectl version
```

Lệnh này sẽ hiển thị hai phiên bản khác nhau: phiên bản của công cụ `kubectl` cục bộ, cũng như phiên bản của Kubernetes API server.

> **LƯU Ý**
>
> Đừng lo nếu các phiên bản này khác nhau. Các công cụ Kubernetes tương thích ngược và tương thích tiến với các phiên bản khác nhau của Kubernetes API miễn là bạn giữ trong phạm vi hai phiên bản minor cho cả công cụ và cluster, và không cố dùng các tính năng mới hơn trên một cluster cũ hơn. Kubernetes tuân theo đặc tả semantic versioning, trong đó phiên bản minor là số ở giữa (ví dụ, số 18 trong 1.18.2). Tuy nhiên, bạn sẽ muốn đảm bảo rằng mình nằm trong phạm vi chênh lệch phiên bản (version skew) được hỗ trợ, là ba phiên bản. Nếu không, bạn có thể gặp vấn đề.

Giờ chúng ta đã xác nhận rằng bạn có thể giao tiếp với Kubernetes cluster của mình, chúng ta sẽ khám phá cluster sâu hơn.

Đầu tiên, bạn có thể lấy một chẩn đoán đơn giản cho cluster. Đây là một cách tốt để xác minh rằng cluster của bạn nhìn chung khỏe mạnh:

```
$ kubectl get componentstatuses
```

Kết quả sẽ trông như thế này:

```
NAME                 STATUS    MESSAGE              ERROR
scheduler            Healthy   ok
controller-manager   Healthy   ok
etcd-0               Healthy   {"health": "true"}
```

> **LƯU Ý**
>
> Khi Kubernetes thay đổi và cải tiến theo thời gian, kết quả của lệnh `kubectl` đôi khi cũng thay đổi. Đừng lo nếu kết quả không giống hệt những gì được hiển thị trong các ví dụ của cuốn sách này.

Ở đây bạn có thể thấy các thành phần tạo nên Kubernetes cluster. `controller-manager` chịu trách nhiệm chạy nhiều controller khác nhau điều chỉnh hành vi trong cluster; ví dụ, đảm bảo rằng tất cả các replica của một service đều sẵn sàng và khỏe mạnh. `scheduler` chịu trách nhiệm đặt các Pod khác nhau lên các node khác nhau trong cluster. Cuối cùng, server `etcd` là nơi lưu trữ của cluster, nơi tất cả các đối tượng API được lưu.

### Liệt kê các Node Kubernetes

Tiếp theo, bạn có thể liệt kê tất cả các node trong cluster:

```
$ kubectl get nodes
NAME    STATUS   ROLES                  AGE   VERSION
kube0   Ready    control-plane,master   45d   v1.22.4
kube1   Ready    <none>                 45d   v1.22.4
kube2   Ready    <none>                 45d   v1.22.4
kube3   Ready    <none>                 45d   v1.22.4
```

Bạn có thể thấy đây là một cluster bốn node đã hoạt động được 45 ngày. Trong Kubernetes, các node được phân thành node `control-plane` chứa các container như API server, scheduler, v.v., để quản lý cluster, và node worker nơi các container của bạn sẽ chạy. Kubernetes thường sẽ không lên lịch (schedule) công việc lên các node `control-plane` để đảm bảo rằng workload của người dùng không gây hại cho hoạt động tổng thể của cluster.

Bạn có thể dùng lệnh `kubectl describe` để lấy thêm thông tin về một node cụ thể, ví dụ `kube1`:

```
$ kubectl describe nodes kube1
```

Đầu tiên, bạn thấy thông tin cơ bản về node:

```
Name:                   kube1
Role:
Labels:                 beta.kubernetes.io/arch=arm
                        beta.kubernetes.io/os=linux
                        kubernetes.io/hostname=node-1
```

Bạn có thể thấy node này đang chạy Linux OS trên bộ xử lý ARM.

Tiếp theo, bạn thấy thông tin về hoạt động của chính `kube1` (ngày tháng đã được loại bỏ khỏi kết quả này cho gọn):

```
Conditions:
  Type                 Status  ...  Reason                       Message
  ----                 ------       ------                       -------
  NetworkUnavailable   False   ...  FlannelIsUp                  Flannel is running on this node
  MemoryPressure       False   ...  KubeletHasSufficientMemory   kubelet has sufficient memory available
  DiskPressure         False   ...  KubeletHasNoDiskPressure     kubelet has no disk pressure
  PIDPressure          False   ...  KubeletHasSufficientPID      kubelet has sufficient PID available
  Ready                True    ...  KubeletReady                 kubelet is posting ready status
```

Các trạng thái này cho thấy node có đủ dung lượng đĩa và bộ nhớ, và đang báo cáo với Kubernetes master rằng nó khỏe mạnh. Tiếp theo là thông tin về năng lực của máy:

```
Capacity:
 alpha.kubernetes.io/nvidia-gpu:  0
 cpu:                             4
 memory:                          882636Ki
 pods:                            110
Allocatable:
 alpha.kubernetes.io/nvidia-gpu:  0
 cpu:                             4
 memory:                          882636Ki
 pods:                            110
```

Sau đó là thông tin về phần mềm trên node, bao gồm phiên bản Docker đang chạy, phiên bản của Kubernetes và Linux kernel, và nhiều hơn nữa:

```
System Info:
  Machine ID:                 44d8f5dd42304af6acde62d233194cc6
  System UUID:                c8ab697e-fc7e-28a2-7621-94c691120fb9
  Boot ID:                    e78d015d-81c2-4876-ba96-106a82da263e
  Kernel Version:             4.19.0-18-amd64
  OS Image:                   Debian GNU/Linux 10 (buster)
  Operating System:           linux
  Architecture:               amd64
  Container Runtime Version:  containerd://1.4.12
  Kubelet Version:            v1.22.4
  Kube-Proxy Version:         v1.22.4
PodCIDR:                      10.244.1.0/24
PodCIDRs:                     10.244.1.0/24
```

Cuối cùng là thông tin về các Pod hiện đang chạy trên node này:

```
Non-terminated Pods:          (3 in total)
  Namespace    Name           CPU Requests  CPU Limits  Memory Requests  Memory Limits
  ---------    ----           ------------  ----------  ---------------  -------------
  kube-system  kube-dns...    260m (6%)     0 (0%)      140Mi (16%)      220Mi (25%)
  kube-system  kube-fla...    0 (0%)        0 (0%)      0 (0%)           0 (0%)
  kube-system  kube-pro...    0 (0%)        0 (0%)      0 (0%)           0 (0%)
Allocated resources:
  (Total limits may be over 100 percent, i.e., overcommitted.
  CPU Requests  CPU Limits  Memory Requests  Memory Limits
  ------------  ----------  ---------------  -------------
  260m (6%)     0 (0%)      140Mi (16%)      220Mi (25%)
No events.
```

Từ kết quả này, bạn có thể thấy các Pod trên node (ví dụ, Pod `kube-dns` cung cấp dịch vụ DNS cho cluster), lượng CPU và bộ nhớ mà mỗi Pod yêu cầu từ node, cũng như tổng tài nguyên được yêu cầu. Đáng lưu ý ở đây là Kubernetes theo dõi cả yêu cầu (request) và giới hạn trên (limit) cho tài nguyên của từng Pod chạy trên một máy. Sự khác biệt giữa request và limit được mô tả chi tiết trong Chương 5, nhưng tóm lại, tài nguyên được một Pod yêu cầu được đảm bảo có sẵn trên node, trong khi limit của một Pod là lượng tối đa của một tài nguyên nhất định mà Pod có thể tiêu thụ. Limit của một Pod có thể cao hơn request của nó, trong trường hợp đó, tài nguyên bổ sung được cung cấp theo kiểu nỗ lực tốt nhất (best-effort). Chúng không được đảm bảo có sẵn trên node.

## Các thành phần của Cluster

Một trong những khía cạnh thú vị của Kubernetes là nhiều thành phần tạo nên Kubernetes cluster thực ra được triển khai bằng chính Kubernetes. Chúng ta sẽ xem qua một vài thành phần trong số này. Các thành phần này sử dụng một số khái niệm mà chúng ta sẽ giới thiệu trong các chương sau. Tất cả các thành phần này chạy trong namespace `kube-system`.[^1]

### Kubernetes Proxy

Kubernetes proxy chịu trách nhiệm định tuyến lưu lượng mạng đến các service được cân bằng tải trong Kubernetes cluster. Để làm việc của mình, proxy phải hiện diện trên mọi node trong cluster. Kubernetes có một đối tượng API tên là DaemonSet, bạn sẽ học về nó trong Chương 11, được dùng trong nhiều cluster để thực hiện điều này. Nếu cluster của bạn chạy Kubernetes proxy bằng DaemonSet, bạn có thể xem các proxy bằng cách chạy:

```
$ kubectl get daemonSets --namespace=kube-system kube-proxy
NAME         DESIRED   CURRENT   READY   UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
kube-proxy   5         5         5       5            5           ...             45d
```

Tùy vào cách cluster của bạn được thiết lập, DaemonSet cho `kube-proxy` có thể có tên khác, hoặc có thể nó hoàn toàn không dùng DaemonSet. Bất kể thế nào, container `kube-proxy` nên đang chạy trên tất cả các node trong cluster.

### Kubernetes DNS

Kubernetes cũng chạy một DNS server, cung cấp việc đặt tên và khám phá cho các service được định nghĩa trong cluster. DNS server này cũng chạy như một service được nhân bản trên cluster. Tùy vào kích cỡ cluster, bạn có thể thấy một hoặc nhiều DNS server đang chạy trong cluster. Dịch vụ DNS được chạy như một Kubernetes deployment, quản lý các replica này (nó cũng có thể có tên `coredns` hoặc một biến thể khác):

```
$ kubectl get deployments --namespace=kube-system core-dns
NAME       DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
core-dns   1         1         1            1           45d
```

Cũng có một Kubernetes service thực hiện cân bằng tải cho DNS server:

```
$ kubectl get services --namespace=kube-system core-dns
NAME       CLUSTER-IP   EXTERNAL-IP   PORT(S)         AGE
core-dns   10.96.0.10   <none>        53/UDP,53/TCP   45d
```

Điều này cho thấy dịch vụ DNS cho cluster có địa chỉ 10.96.0.10. Nếu bạn đăng nhập vào một container trong cluster, bạn sẽ thấy địa chỉ này đã được điền vào file */etc/resolv.conf* của container.

### Kubernetes UI

Nếu bạn muốn trực quan hóa cluster của mình trong một giao diện người dùng đồ họa, hầu hết các nhà cung cấp cloud tích hợp trực quan hóa như vậy vào GUI cho cloud của họ. Nếu nhà cung cấp cloud của bạn không cung cấp UI như vậy, hoặc bạn thích một GUI trong cluster, có một GUI được cộng đồng hỗ trợ mà bạn có thể cài đặt. Xem tài liệu về cách cài đặt dashboard cho các cluster này. Bạn cũng có thể dùng các extension cho môi trường phát triển như Visual Studio Code để xem trạng thái cluster của mình trong nháy mắt.

## Tóm tắt

Hy vọng đến thời điểm này bạn đã có một Kubernetes cluster (hoặc ba) đang chạy và đã dùng vài lệnh để khám phá cluster mình đã tạo. Tiếp theo, chúng ta sẽ dành thêm thời gian khám phá CLI đến Kubernetes cluster đó và dạy bạn cách làm chủ công cụ `kubectl`. Trong phần còn lại của cuốn sách, bạn sẽ dùng `kubectl` và cluster kiểm thử của mình để khám phá các đối tượng khác nhau trong Kubernetes API.

---

[^1]: Như bạn sẽ học trong chương tiếp theo, namespace trong Kubernetes là một thực thể để tổ chức các tài nguyên Kubernetes. Bạn có thể nghĩ về nó như một thư mục trong filesystem.
