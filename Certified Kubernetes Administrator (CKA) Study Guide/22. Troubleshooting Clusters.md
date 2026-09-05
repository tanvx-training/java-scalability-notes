# Chương 22. Xử lý sự cố cluster

*Dịch từ: Chapter 22. Troubleshooting Clusters — Certified Kubernetes Administrator (CKA) Study Guide, 2nd Edition (O'Reilly).*

Khi một cluster Kubernetes gặp sự cố ở cấp hạ tầng, tác động có thể là thảm khốc. Pod không thể lập lịch (schedule), ứng dụng trở nên không thể truy cập, và toàn bộ node biến mất khỏi cluster, có khả năng ảnh hưởng đến hàng trăm workload cùng lúc. Không giống các vấn đề riêng của ứng dụng vốn có thể chỉ ảnh hưởng đến một service đơn lẻ, các vấn đề với thành phần cluster và node đánh thẳng vào nền tảng của môi trường Kubernetes của bạn, khiến việc chẩn đoán và giải quyết nhanh chóng trở nên then chốt để duy trì tính sẵn sàng của hệ thống.

Chương này trang bị cho bạn các kỹ năng để xử lý sự cố (troubleshooting) những vấn đề ở cấp hạ tầng như vậy. Bạn sẽ học cách giải mã các điều kiện (condition) của node, điều tra lý do node chuyển sang trạng thái `NotReady`, giải quyết các tình huống áp lực tài nguyên, và truy vết các thất bại khi lập lịch Pod về nguyên nhân gốc rễ của chúng.

> **PHẠM VI BAO PHỦ MỤC TIÊU ĐỀ CƯƠNG**
>
> Chương này đề cập đến các mục tiêu đề cương (curriculum) sau:
>
> - Xử lý sự cố cluster và node
> - Xử lý sự cố các thành phần của cluster

## Kiểm tra trạng thái của các node trong cluster

Có nhiều yếu tố ảnh hưởng có thể khiến một cluster Kubernetes bị lỗi ở cấp thành phần. Bạn nên liệt kê các node hiện có trong cluster để nhận diện những vấn đề tiềm ẩn:

```shell
$ kubectl get nodes
NAME                 STATUS   ROLES           AGE     VERSION
control-plane-node   Ready    control-plane   2m45s   v1.33.2
worker-node-1        Ready    <none>          2m36s   v1.33.2
worker-node-2        Ready    <none>          2m29s   v1.33.2
worker-node-3        Ready    <none>          2m22s   v1.33.2
```

Output sẽ cho bạn cái nhìn tổng quan về tình hình. Bạn có thể dễ dàng nhận biết vai trò của từng node từ cột `ROLES`, phiên bản Kubernetes được sử dụng, và trạng thái sức khỏe hiện tại.

Có một vài điểm cần lưu ý khi nhận diện vấn đề ở mức tổng quan:

- Trạng thái sức khỏe của node có phải là gì đó khác ngoài `Ready` không?
- Phiên bản của một node có lệch so với phiên bản của các node khác không?

Trong các mục tiếp theo, bạn sẽ thấy các mục riêng về xử lý sự cố node control plane so với worker node.

## Kiểm tra trạng thái của các thành phần trong cluster

Trong số các thành phần có trên node control plane có những thành phần sau:

**kube-apiserver**

Cung cấp Kubernetes API mà các client như `kubectl` sử dụng để quản lý đối tượng (object)

**etcd**

Một kho lưu trữ key-value để lưu dữ liệu của cluster

**kube-scheduler**

Chọn node cho các Pod đã được lập lịch nhưng chưa được tạo

**core-dns**

Đóng vai trò máy chủ DNS của cluster, tự động tạo các bản ghi DNS cho phép Pod và Service khám phá lẫn nhau bằng tên thay vì địa chỉ IP, đồng thời xử lý việc phân giải DNS bên ngoài cho workload

**kube-controller-manager**

Chạy các tiến trình controller (ví dụ: job controller chịu trách nhiệm thực thi đối tượng Job)

**cloud-controller-manager (tùy chọn)**

Liên kết các API đặc thù của nhà cung cấp cloud với cluster Kubernetes. Controller này không có trong các bản cài đặt cluster Kubernetes tại chỗ (on-premise)

Ngoài các thành phần chạy riêng trên các node control plane, mọi node (node control plane và worker node) đều có thể chứa các thành phần sau:

**kubelet**

Đảm bảo tất cả Pod đang chạy, bao gồm cả các container của chúng

**kube-proxy (tùy chọn)**

Duy trì các quy tắc mạng trên node để hiện thực hóa Service

**Container runtime**

Thành phần phần mềm chịu trách nhiệm chạy container

Để khám phá các thành phần đó và trạng thái của chúng, hãy liệt kê các Pod hiện có trong namespace `kube-system`. Lưu ý rằng một số thành phần không chạy trong Pod, ví dụ kubelet hoặc container runtime. Tại đây, bạn có thể thấy danh sách các thành phần:

```shell
$ kubectl get pods -n kube-system
NAME                      READY   STATUS    RESTARTS      AGE
etcd                      1/1     Running   1 (11d ago)   29d
kube-apiserver            1/1     Running   1 (11d ago)   29d
kube-controller-manager   1/1     Running   1 (11d ago)   29d
kube-scheduler            1/1     Running   1 (11d ago)   29d
...
```

Bất kỳ trạng thái nào không hiển thị `Running` đều nên được kiểm tra kỹ hơn. Bạn có thể lấy log của các Pod thành phần control plane theo cùng cách như với bất kỳ Pod nào khác, bằng lệnh `logs`. Lệnh sau tải về log của thành phần kube-apiserver:

```shell
$ kubectl logs kube-apiserver -n kube-system
```

Trong các môi trường Kubernetes được quản lý (EKS, GKE, AKS), nhiều Pod control plane trong số này sẽ không hiển thị, vì chúng chạy trên hạ tầng do nhà cung cấp quản lý, nằm ngoài tầm nhìn của bạn. Bạn có thể chỉ thấy các Pod add-on như kube-proxy, CoreDNS và các thành phần CNI. Mặc dù kỳ thi CKA sử dụng các cluster tự quản lý, nơi mọi Pod control plane đều hiển thị và truy cập được, điều quan trọng là bạn hiểu sự khác biệt này cho các kịch bản thực tế, nơi việc xử lý sự cố control plane trong các dịch vụ được quản lý đòi hỏi cách tiếp cận khác và thường phải nhờ đến bộ phận hỗ trợ của nhà cung cấp cloud.

## Xử lý sự cố node

Các node control plane là những thành phần then chốt để giữ cho cluster hoạt động. Như đã mô tả trong "Quản lý cluster có tính sẵn sàng cao (HA)", một cluster có thể bao gồm nhiều hơn một node control plane để đảm bảo mức độ uptime cao. Việc phát hiện một trong các node control plane bị lỗi cần được xử lý với mức độ khẩn cấp cao nhất để tránh làm tổn hại các đặc tính sẵn sàng cao. Để biết thêm thông tin về các kỹ thuật xử lý sự cố và phân tích nguyên nhân gốc rễ, hãy tham khảo tài liệu Kubernetes.

### Hiển thị thông tin cluster

Để chẩn đoán sâu hơn các vấn đề trên node control plane, hãy chạy lệnh `kubectl cluster-info`. Như bạn thấy trong output sau, lệnh này hiển thị địa chỉ của control plane và các dịch vụ cluster khác:

```shell
$ kubectl cluster-info
Kubernetes control plane is running at https://192.168.64.21:8443
CoreDNS is running at https://192.168.64.21:8443/api/v1/namespaces/ \
kube-system/services/kube-dns:dns/proxy

To further debug and diagnose cluster problems, use kubectl cluster-info d
```

Để xem chi tiết log của cluster, hãy thêm lệnh con `dump`. Do có hàng trang thông điệp log, tôi sẽ không hiển thị output trong sách này. Hãy rà soát các thông điệp để xem bạn có tìm thấy lỗi nào không:

```shell
$ kubectl cluster-info dump
```

### Node hiển thị trạng thái NotReady

Worker node chịu trách nhiệm quản lý workload. Hãy đảm bảo bạn có đủ số lượng worker node để phân tán tải. Để thảo luận sâu hơn về cách gia nhập (join) worker node vào cluster, xem Chương 4.

Bất kỳ node nào trong cluster đều có thể chuyển sang trạng thái lỗi. Với tư cách quản trị viên Kubernetes, nhiệm vụ của bạn là nhận diện các tình huống đó và khắc phục kịp thời. Khi liệt kê các node của cluster, bạn có thể thấy một worker node không ở trạng thái `Ready`, đây là dấu hiệu rõ ràng cho thấy nó không sẵn sàng xử lý workload. Trong output của lệnh `get nodes`, bạn có thể thấy node tên `worker-1` đang ở trạng thái `NotReady`:

```shell
$ kubectl get nodes
NAME            STATUS     ROLES           AGE     VERSION
control-plane   Ready      control-plane   4d20h   v1.33.2
worker-1        NotReady   <none>          4d20h   v1.33.2
worker-2        Ready      <none>          4d20h   v1.33.2
```

Trạng thái `NotReady` có nghĩa là node không được sử dụng và sẽ tích lũy chi phí vận hành mà không thực sự lập lịch workload. Có thể có nhiều lý do khiến node rơi vào trạng thái này. Danh sách sau liệt kê những lý do phổ biến nhất:

**Không đủ tài nguyên**

Node có thể đang thiếu memory hoặc dung lượng đĩa.

**Vấn đề với tiến trình kubelet**

Tiến trình có thể đã bị crash hoặc dừng trên node. Do đó, nó không thể giao tiếp với API server chạy trên bất kỳ node control plane nào nữa.

**Vấn đề với kube-proxy**

Pod chạy kube-proxy chịu trách nhiệm giao tiếp mạng từ bên trong cluster và từ bên ngoài. Pod đã chuyển sang trạng thái không hoạt động.

SSH vào (các) worker node liên quan và bắt đầu điều tra.

### Kiểm tra tài nguyên khả dụng

Một cách tốt để xác định nguyên nhân gốc rễ của một worker node không khả dụng là xem chi tiết của nó. Lệnh `describe node` hiển thị mục có nhãn Conditions:

```shell
$ kubectl describe node worker-1
....
Conditions:
  Type                 Status  LastHeartbeatTime                 \
    LastTransitionTime                 Reason                     Message
  ----                 ------  -----------------                 \
    ------------------                 ------                     -------
  NetworkUnavailable   False   Thu, 20 Jan 2022 18:12:13 +0000 \
    Thu, 20 Jan 2022 18:12:13 +0000   CalicoIsUp                 \
        Calico is running on this node
  MemoryPressure       False   Tue, 25 Jan 2022 15:59:18 +0000 \
    Thu, 20 Jan 2022 18:11:47 +0000   KubeletHasSufficientMemory \
        kubelet has sufficient memory available
  DiskPressure         False   Tue, 25 Jan 2022 15:59:18 +0000 \
    Thu, 20 Jan 2022 18:11:47 +0000   KubeletHasNoDiskPressure \
        kubelet has no disk pressure
  PIDPressure          False   Tue, 25 Jan 2022 15:59:18 +0000 \
    Thu, 20 Jan 2022 18:11:47 +0000   KubeletHasSufficientPID  \
        kubelet has sufficient PID available
  Ready                True    Tue, 25 Jan 2022 15:59:18 +0000 \
    Thu, 20 Jan 2022 18:12:07 +0000   KubeletReady               \
        kubelet is posting ready status. AppArmor enabled
...
```

Bảng này chứa thông tin về các tài nguyên khả dụng cho node, cũng như chỉ báo về các dịch vụ khác như mạng. Hãy xem có loại tài nguyên nào hiển thị trạng thái `True` hoặc `Unknown` không, điều đó có nghĩa là có vấn đề với tài nguyên cụ thể đó. Bạn có thể tiếp tục xử lý sự cố các tài nguyên không khả dụng bằng một lệnh ở cấp hệ thống.

Để kiểm tra memory và số lượng tiến trình đang chạy, dùng lệnh `top`:

```shell
$ top
top - 18:45:09 up 1 day,  2:21,  1 user,  load average: 0.13, 0.13, 0.15
Tasks: 116 total,   3 running,  70 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.5 us,  0.8 sy,  0.0 ni, 97.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0
KiB Mem :  1008552 total,   134660 free,   264604 used,   609288 buff/cach
KiB Swap:        0 total,        0 free,        0 used.   611248 avail Mem
...
```

Để kiểm tra dung lượng đĩa khả dụng, dùng lệnh `df`:

```shell
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
udev            480M     0  480M   0% /dev
tmpfs            99M  1.0M   98M   2% /run
/dev/sda1        39G  2.7G   37G   7% /
tmpfs           493M     0  493M   0% /dev/shm
tmpfs           5.0M     0  5.0M   0% /run/lock
tmpfs           493M     0  493M   0% /sys/fs/cgroup
vagrant         1.9T  252G  1.6T  14% /vagrant
tmpfs            99M     0   99M   0% /run/user/1000
```

### Kiểm tra tiến trình kubelet

Một số điều kiện được lệnh `describe node` hiển thị có nhắc đến tiến trình kubelet. Nếu nhìn vào cột `Message`, bạn có thể hình dung được liệu tiến trình kubelet có đang chạy đúng hay không. Để xử lý sự cố một tiến trình kubelet hoạt động bất thường, hãy chạy lệnh `systemctl` sau:

```shell
$ systemctl status kubelet
● kubelet.service - kubelet: The Kubernetes Node Agent
   Loaded: loaded (/lib/systemd/system/kubelet.service; enabled; \
   vendor preset: enabled)
  Drop-In: /etc/systemd/system/kubelet.service.d
           └─10-kubeadm.conf
   Active: active (running) since Thu 2022-01-20 18:11:41 UTC; 5 days ago
     Docs: https://kubernetes.io/docs/home/
 Main PID: 6537 (kubelet)
    Tasks: 15 (limit: 1151)
   CGroup: /system.slice/kubelet.service
           └─6537 /usr/bin/kubelet \
           --bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf \
           --kubeconfig=/etc/kubernetes/kubelet.conf \
           --config=/var/lib/kubelet/config.yaml --network-lines 1-10/10
```

Thông tin quan trọng nhất trong output là giá trị của thuộc tính `Active`. Nếu nó hiển thị gì đó khác ngoài `active (running)`, bạn sẽ cần đào sâu hơn. Dùng `journalctl` để xem các file log của tiến trình:

```shell
$ journalctl -u kubelet.service
-- Logs begin at Thu 2022-01-20 18:10:41 UTC, end at
Tue 2022-01-25 18:44:05 UTC. --
Jan 20 18:11:31 worker-1 systemd[1]: Started kubelet: The Kubernetes Node
Jan 20 18:11:31 worker-1 systemd[1]: kubelet.service: Current command vani
from the unit file, execution of the command list won't be resumed.
Jan 20 18:11:31 worker-1 systemd[1]: Stopping kubelet: The Kubernetes
Node Agent...
Jan 20 18:11:31 worker-1 systemd[1]: Stopped kubelet: The Kubernetes Node
Jan 20 18:11:31 worker-1 systemd[1]: Started kubelet: The Kubernetes Node
....
```

Bạn sẽ muốn khởi động lại tiến trình sau khi đã xác định được vấn đề trong log và khắc phục nó:

```shell
$ systemctl restart kubelet
```

### Kiểm tra hiệu lực của chứng chỉ

Đôi khi, chứng chỉ (certificate) mà kubelet sử dụng có thể hết hạn. Hãy đảm bảo giá trị của các thuộc tính `Issuer` và `Not After` là chính xác:

```shell
$ openssl x509 -in /var/lib/kubelet/pki/kubelet.crt -text
Certificate:
    Data:
        Version: 3 (0x2)
        Serial Number: 2 (0x2)
        Signature Algorithm: sha256WithRSAEncryption
        Issuer: CN = worker-1-ca@1642702301
        Validity
            Not Before: Jan 20 17:11:41 2022 GMT
            Not After : Jan 20 17:11:41 2023 GMT
        Subject: CN = worker-1@1642702301
        ...
```

Để có cái nhìn nhanh về tất cả chứng chỉ trong Hạ tầng khóa công khai (Public Key Infrastructure, PKI) của cluster, bạn có thể dùng lệnh sau:

```shell
$ kubeadm certs check-expiration
[check-expiration] Reading configuration from the cluster...
[check-expiration] FYI: You can look at this config file with 'kubectl -n
kube-system get cm kubeadm-config -o yaml'

CERTIFICATE                EXPIRES                  RESIDUAL TIME   ...
admin.conf                 Aug 31, 2026 14:28 UTC   364d            ...
apiserver                  Aug 31, 2026 14:28 UTC   364d            ...
apiserver-etcd-client      Aug 31, 2026 14:28 UTC   364d            ...
apiserver-kubelet-client   Aug 31, 2026 14:28 UTC   364d            ...
controller-manager.conf    Aug 31, 2026 14:28 UTC   364d            ...
etcd-healthcheck-client    Aug 31, 2026 14:28 UTC   364d            ...
etcd-peer                  Aug 31, 2026 14:28 UTC   364d            ...
etcd-server                Aug 31, 2026 14:28 UTC   364d            ...
front-proxy-client         Aug 31, 2026 14:28 UTC   364d            ...
scheduler.conf             Aug 31, 2026 14:28 UTC   364d            ...
super-admin.conf           Aug 31, 2026 14:28 UTC   364d            ...

CERTIFICATE AUTHORITY   EXPIRES                  RESIDUAL TIME   ...
ca                      Aug 29, 2035 14:28 UTC   9y              ...
etcd-ca                 Aug 29, 2035 14:28 UTC   9y              ...
front-proxy-ca          Aug 29, 2035 14:28 UTC   9y              ...
```

Bạn có thể gia hạn tất cả chứng chỉ cần thiết để chạy control plane bằng lệnh sau:

```shell
$ kubeadm certs renew all
```

Bạn phải khởi động lại kube-apiserver, kube-controller-manager, kube-scheduler và etcd để chúng có thể sử dụng các chứng chỉ mới.

### Kiểm tra Pod kube-proxy

Các thành phần kube-proxy chạy trong một tập các Pod chuyên dụng trong namespace `kube-system`. Bạn có thể dễ dàng nhận diện các Pod này qua tiền tố tên `kube-proxy` và hash được nối thêm phía sau. Hãy kiểm tra xem có Pod nào hiển thị trạng thái khác `Running` không. Mỗi Pod kube-proxy chạy trên một worker node riêng. Bạn có thể thêm tùy chọn `-o wide` để hiển thị node mà Pod đang chạy trên đó trong một cột mới:

```shell
$ kubectl get pods -n kube-system
NAME               READY   STATUS    RESTARTS   AGE
...
kube-proxy-csrww   1/1     Running   0          4d22h
kube-proxy-fjd48   1/1     Running   0          4d22h
kube-proxy-tvf52   1/1     Running   0          4d22h
```

Hãy xem event log của những Pod kube-proxy có vẻ gặp vấn đề. Lệnh sau mô tả Pod tên `kube-proxy-csrww`. Ngoài ra, bạn có thể tìm thấy thêm thông tin trong event log của DaemonSet tương ứng:

```shell
$ kubectl describe pod kube-proxy-csrww -n kube-system
$ kubectl describe daemonset kube-proxy -n kube-system
```

Log cũng có thể hữu ích. Bạn sẽ có thể kiểm tra log của Pod kube-proxy chạy trên worker node cụ thể:

```shell
$ kubectl describe pod kube-proxy-csrww -n kube-system | grep Node:
Node:                 worker-1/10.0.2.15
$ kubectl logs kube-proxy-csrww -n kube-system
```

## Tóm tắt

Xử lý sự cố cluster và node Kubernetes đòi hỏi sự hiểu biết sâu sắc về tương tác giữa các thành phần, kỹ năng điều tra có hệ thống, và sự quen thuộc với nhiều công cụ debug khác nhau. Các kịch bản được đề cập trong chương này đại diện cho những vấn đề thực tế phổ biến mà bạn sẽ gặp khi quản lý hạ tầng Kubernetes. Bằng cách thành thạo các kỹ thuật xử lý sự cố này, bạn sẽ có thể nhanh chóng chẩn đoán và giải quyết các vấn đề ở cấp cluster, giảm thiểu thời gian ngừng hoạt động (downtime) và duy trì độ tin cậy của dịch vụ.

## Trọng tâm cho kỳ thi

**Thành thạo chẩn đoán và khôi phục node nhanh chóng**

Trong kỳ thi, bạn phải nhanh chóng xác định lý do node ở trạng thái `NotReady` và khắc phục chúng trong vài phút. Hãy ghi nhớ trình tự này: `kubectl get nodes`, `kubectl describe node <node-name>`, kiểm tra mục `Conditions` để tìm các vấn đề cụ thể (`MemoryPressure`, `DiskPressure`, `PIDPressure`, `Ready`). Biết cách SSH vào node và dùng `systemctl status kubelet`, `systemctl restart kubelet`, và `journalctl -u kubelet | tail -50` để chẩn đoán và khắc phục các vấn đề của kubelet.

**Biết vị trí các Pod hệ thống và các lệnh khôi phục**

Bạn phải nhận diện và khắc phục ngay lập tức các lỗi của thành phần control plane. Hãy nhớ rằng các static Pod (API server, controller-manager, scheduler, etcd) có manifest nằm trong thư mục `/etc/kubernetes/manifests` và log của chúng truy cập được qua `kubectl logs <component>-<node-name> -n kube-system`. Với các thành phần bị crash, hãy biết rằng việc chỉnh sửa trực tiếp file manifest sẽ kích hoạt kubelet tự động khởi động lại Pod.

**Khắc phục vấn đề lập lịch Pod**

Hiểu cách các vấn đề của node ngăn cản việc lập lịch Pod và biết các cách khắc phục nhanh. Khi Pod ở trạng thái `Pending`, hãy kiểm tra taint của node (`kubectl describe node | grep Taint`), xác minh dung lượng node (`kubectl describe node | grep -A5 "Allocated resources"`), và tìm các node đã bị cordon (`kubectl get nodes | grep SchedulingDisabled`). Hãy thành thạo các lệnh khôi phục sau: `kubectl uncordon <node>` để bật lập lịch, `kubectl taint nodes <node> <taint-key>-` để gỡ taint (lưu ý dấu trừ), và `kubectl drain <node> --ignore-daemonsets --delete-emptydir-data` để bảo trì node.

## Bài tập mẫu

Lời giải cho các bài tập này có trong Phụ lục A.

1. Nhóm của bạn báo cáo rằng các ứng dụng không scale đúng cách. Khi điều tra, bạn nhận thấy một trong các worker node đang gặp vấn đề và các Pod mới không được lập lịch lên đó.

   Bài tập này giả định bạn chạy một cluster với ba node: một node control plane và hai worker node. Tên của các worker node là `worker-node-1` và `worker-node-2`.

   Di chuyển đến thư mục *app-a/ch22/troubleshooting-worker-node* của kho GitHub bmuschko/cka-study-guide đã checkout. Chuyển file *setup.sh* sang `worker-node-2`. SSH vào máy chủ (host) của node `worker-node-2`. Thực thi script. Để script thực thi đúng, hãy đảm bảo bạn đã cài đặt `kubectl` trên `worker-node-2` từ trước và có thể xác thực với API server của node control plane.

   Xác định lý do `worker-node-2` không nhận Pod mới. Khắc phục mọi vấn đề ngăn node hoạt động bình thường. Đảm bảo node có thể nhận lập lịch Pod mới. Xác minh việc khắc phục bằng cách chạy một Pod thử nghiệm trên node cụ thể đó.

2. Cluster đang gặp vấn đề với việc lập lịch Pod. Các Deployment mới tạo ra ReplicaSet, nhưng Pod vẫn ở trạng thái `Pending` mặc dù các node có đủ tài nguyên.

   Bài tập này giả định bạn chạy một cluster với ít nhất một node control plane và một worker node. Tên của node control plane là `control-plane`.

   Di chuyển đến thư mục *app-a/ch22/troubleshooting-control-plane-node* của kho GitHub bmuschko/cka-study-guide đã checkout. Chuyển file *setup.sh* sang node `control-plane`. SSH vào máy chủ (host) của `control-plane`. Thực thi script.

   Tạo một Deployment tên `test-app` với container image `nginx:1.29.1` và ba replica.

   Xác định thành phần cluster nào đang bị lỗi trên node `control-plane`. Chẩn đoán nguyên nhân gốc rễ của lỗi. Khắc phục thành phần đó để khôi phục hoạt động bình thường của cluster. Xác minh rằng việc lập lịch Pod đã hoạt động trở lại.
