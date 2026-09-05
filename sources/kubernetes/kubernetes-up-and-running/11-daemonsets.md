# Chương 11. DaemonSet

Deployment và ReplicaSet nói chung là về việc tạo một service (như một web server) với nhiều replica để dự phòng. Nhưng đó không phải là lý do duy nhất để nhân bản một tập Pod trong cluster. Một lý do khác là lên lịch một Pod duy nhất trên mọi node trong cluster. Nói chung, động lực để nhân bản một Pod đến mọi node là để đặt một loại agent hoặc daemon nào đó trên mỗi node, và đối tượng Kubernetes để đạt được điều này là DaemonSet.

DaemonSet đảm bảo một bản sao của một Pod đang chạy trên một tập node trong Kubernetes cluster. DaemonSet được dùng để triển khai các daemon hệ thống như trình thu thập log và agent giám sát, những thứ thường phải chạy trên mọi node. DaemonSet có chức năng tương tự ReplicaSet; cả hai đều tạo các Pod được kỳ vọng là các service chạy lâu dài và đảm bảo trạng thái mong muốn và trạng thái quan sát của cluster khớp nhau.

Với những điểm tương đồng giữa DaemonSet và ReplicaSet, điều quan trọng là hiểu khi nào dùng cái này thay cho cái kia. ReplicaSet nên được dùng khi ứng dụng của bạn hoàn toàn tách rời khỏi node và bạn có thể chạy nhiều bản sao trên một node nhất định mà không cần cân nhắc đặc biệt. DaemonSet nên được dùng khi một bản sao duy nhất của ứng dụng phải chạy trên tất cả hoặc một tập con các node trong cluster.

Bạn nói chung không nên dùng các hạn chế lên lịch hoặc các tham số khác để đảm bảo các Pod không nằm cùng trên một node. Nếu bạn thấy mình muốn một Pod duy nhất cho mỗi node, thì DaemonSet là tài nguyên Kubernetes đúng để dùng. Tương tự, nếu bạn thấy mình đang xây dựng một service được nhân bản đồng nhất để phục vụ lưu lượng người dùng, thì ReplicaSet có lẽ là tài nguyên Kubernetes đúng để dùng.

Bạn có thể dùng label để chạy các Pod của DaemonSet trên các node cụ thể; ví dụ, bạn có thể muốn chạy phần mềm phát hiện xâm nhập chuyên dụng trên các node được phơi bày ra mạng biên (edge network).

Bạn cũng có thể dùng DaemonSet để cài đặt phần mềm trên các node trong một cluster trên cloud. Với nhiều dịch vụ cloud, việc nâng cấp hoặc mở rộng cluster có thể xóa và/hoặc tạo lại các máy ảo mới. Cách tiếp cận hạ tầng bất biến động này có thể gây ra vấn đề nếu bạn muốn (hoặc bị bộ phận IT trung tâm yêu cầu) có phần mềm cụ thể trên mọi node. Để đảm bảo phần mềm cụ thể được cài đặt trên mọi máy bất kể các sự kiện nâng cấp và mở rộng, DaemonSet là cách tiếp cận đúng. Bạn thậm chí có thể mount filesystem của host và chạy các script cài đặt các gói RPM/DEB lên hệ điều hành host. Theo cách này, bạn có thể có một cluster cloud native vẫn đáp ứng các yêu cầu doanh nghiệp của bộ phận IT của bạn.

## DaemonSet Scheduler

Theo mặc định, một DaemonSet sẽ tạo một bản sao của Pod trên mọi node trừ khi một node selector được dùng, điều này sẽ giới hạn các node đủ điều kiện ở những node có tập label khớp. DaemonSet xác định node nào một Pod sẽ chạy trên đó tại thời điểm tạo Pod bằng cách chỉ định trường `nodeName` trong Pod spec. Kết quả là, các Pod được DaemonSet tạo ra bị Kubernetes scheduler bỏ qua.

Giống như ReplicaSet, DaemonSet được quản lý bởi một vòng lặp điều khiển đồng bộ đo trạng thái mong muốn (một Pod hiện diện trên tất cả các node) với trạng thái quan sát (Pod có hiện diện trên một node cụ thể không?). Với thông tin này, DaemonSet controller tạo một Pod trên mỗi node hiện chưa có Pod khớp.

Nếu một node mới được thêm vào cluster, thì DaemonSet controller nhận thấy nó đang thiếu một Pod và thêm Pod vào node mới.

> **LƯU Ý**
>
> DaemonSet và ReplicaSet là một minh chứng tuyệt vời về giá trị của kiến trúc tách rời. Có thể trông như thiết kế đúng sẽ là để ReplicaSet sở hữu các Pod nó quản lý, và để Pod là các tài nguyên con của ReplicaSet. Tương tự, các Pod được DaemonSet quản lý sẽ là tài nguyên con của DaemonSet đó. Tuy nhiên, kiểu đóng gói này sẽ yêu cầu các công cụ xử lý Pod phải được viết hai lần: một lần cho DaemonSet và một lần cho ReplicaSet. Thay vào đó, Kubernetes dùng cách tiếp cận tách rời trong đó Pod là các đối tượng cấp cao nhất. Điều này có nghĩa là mọi công cụ bạn đã học để kiểm tra Pod trong bối cảnh ReplicaSet (ví dụ, `kubectl logs <pod-name>`) đều áp dụng được như nhau cho các Pod được DaemonSet tạo ra.

## Tạo DaemonSet

DaemonSet được tạo bằng cách gửi một cấu hình DaemonSet đến Kubernetes API server. DaemonSet trong Ví dụ 11-1 sẽ tạo một agent logging `fluentd` trên mọi node trong cluster đích.

*Ví dụ 11-1. fluentd.yaml*

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: fluentd
  labels:
    app: fluentd
spec:
  selector:
    matchLabels:
      app: fluentd
  template:
    metadata:
      labels:
        app: fluentd
    spec:
      containers:
      - name: fluentd
        image: fluent/fluentd:v0.14.10
        resources:
          limits:
            memory: 200Mi
          requests:
            cpu: 100m
            memory: 200Mi
        volumeMounts:
        - name: varlog
          mountPath: /var/log
        - name: varlibdockercontainers
          mountPath: /var/lib/docker/containers
          readOnly: true
      terminationGracePeriodSeconds: 30
      volumes:
      - name: varlog
        hostPath:
          path: /var/log
      - name: varlibdockercontainers
        hostPath:
          path: /var/lib/docker/containers
```

DaemonSet yêu cầu một tên duy nhất trên tất cả các DaemonSet trong một Kubernetes namespace nhất định. Mỗi DaemonSet phải bao gồm một Pod template spec, sẽ được dùng để tạo các Pod khi cần. Đây là nơi những điểm tương đồng giữa ReplicaSet và DaemonSet kết thúc. Khác với ReplicaSet, DaemonSet sẽ tạo Pod trên mọi node trong cluster theo mặc định trừ khi một node selector được dùng.

Một khi bạn đã có cấu hình DaemonSet hợp lệ, bạn có thể dùng lệnh `kubectl apply` để gửi DaemonSet đến Kubernetes API. Trong phần này, chúng ta sẽ tạo một DaemonSet để đảm bảo HTTP server `fluentd` đang chạy trên mọi node trong cluster của chúng ta:

```
$ kubectl apply -f fluentd.yaml
daemonset.apps/fluentd created
```

Một khi DaemonSet `fluentd` đã được gửi thành công đến Kubernetes API, bạn có thể truy vấn trạng thái hiện tại của nó bằng lệnh `kubectl describe`:

```
$ kubectl describe daemonset fluentd
Name:           fluentd
Selector:       app=fluentd
Node-Selector:  <none>
Labels:         app=fluentd
Annotations:    deprecated.daemonset.template.generation: 1
Desired Number of Nodes Scheduled: 3
Current Number of Nodes Scheduled: 3
Number of Nodes Scheduled with Up-to-date Pods: 3
Number of Nodes Scheduled with Available Pods: 3
Number of Nodes Misscheduled: 0
Pods Status:  3 Running / 0 Waiting / 0 Succeeded / 0 Failed
...
```

Kết quả này cho biết một Pod `fluentd` đã được triển khai thành công đến cả ba node trong cluster của chúng ta. Chúng ta có thể xác minh điều này bằng lệnh `kubectl get pods` với cờ `-o` để in ra các node mà mỗi Pod `fluentd` được gán:

```
$ kubectl get pods -l app=fluentd -o wide
NAME            READY   STATUS    RESTARTS   AGE   IP             NODE
fluentd-1q6c6   1/1     Running   0          13m   10.240.0.101   k0-default-pool-35609c18-z7tb
fluentd-mwi7h   1/1     Running   0          13m   10.240.0.80    k0-default-pool-35609c18-ydae
fluentd-zr6l7   1/1     Running   0          13m   10.240.0.44    k0-default-pool-35609c18-pol3
```

Với DaemonSet `fluentd` đã có, việc thêm một node mới vào cluster sẽ dẫn đến một Pod `fluentd` được triển khai tự động đến node đó:

```
$ kubectl get pods -l app=fluentd -o wide
NAME            READY   STATUS    RESTARTS   AGE   IP             NODE
fluentd-1q6c6   1/1     Running   0          13m   10.240.0.101   k0-default-pool-35609c18-z7tb
fluentd-mwi7h   1/1     Running   0          13m   10.240.0.80    k0-default-pool-35609c18-ydae
fluentd-oipmq   1/1     Running   0          43s   10.240.0.96    k0-default-pool-35609c18-0xnl
fluentd-zr6l7   1/1     Running   0          13m   10.240.0.44    k0-default-pool-35609c18-pol3
```

Đây chính xác là hành vi bạn muốn khi quản lý các daemon logging và các service toàn cluster khác. Không cần hành động gì từ phía chúng ta; đây là cách Kubernetes DaemonSet controller đồng bộ trạng thái quan sát của nó với trạng thái mong muốn của chúng ta.

## Giới hạn DaemonSet cho các Node cụ thể

Trường hợp sử dụng phổ biến nhất cho DaemonSet là chạy một Pod trên mọi node trong Kubernetes cluster. Tuy nhiên, có một số trường hợp bạn muốn triển khai một Pod chỉ đến một tập con các node. Ví dụ, có thể bạn có một workload yêu cầu GPU hoặc truy cập vào bộ lưu trữ nhanh chỉ có sẵn trên một tập con các node trong cluster. Trong những trường hợp như thế, node label có thể được dùng để gắn thẻ các node cụ thể đáp ứng yêu cầu của workload.

### Thêm Label cho Node

Bước đầu tiên trong việc giới hạn DaemonSet cho các node cụ thể là thêm tập label mong muốn vào một tập con các node. Điều này có thể được thực hiện bằng lệnh `kubectl label`.

Lệnh sau thêm label `ssd=true` vào một node duy nhất:

```
$ kubectl label nodes k0-default-pool-35609c18-z7tb ssd=true
node/k0-default-pool-35609c18-z7tb labeled
```

Giống như với các tài nguyên Kubernetes khác, liệt kê các node không có label selector trả về tất cả các node trong cluster:

```
$ kubectl get nodes
NAME                            STATUS   ROLES   AGE   VERSION
k0-default-pool-35609c18-0xnl   Ready    agent   23m   v1.21.1
k0-default-pool-35609c18-pol3   Ready    agent   1d    v1.21.1
k0-default-pool-35609c18-ydae   Ready    agent   1d    v1.21.1
k0-default-pool-35609c18-z7tb   Ready    agent   1d    v1.21.1
```

Sử dụng label selector, chúng ta có thể lọc các node dựa trên label. Để chỉ liệt kê các node có label `ssd` được đặt là `true`, dùng lệnh `kubectl get nodes` với cờ `--selector`:

```
$ kubectl get nodes --selector ssd=true
NAME                            STATUS   ROLES   AGE   VERSION
k0-default-pool-35609c18-z7tb   Ready    agent   1d    v1.21.1
```

### Node Selector

Node selector có thể được dùng để giới hạn node nào một Pod có thể chạy trên đó trong một Kubernetes cluster nhất định. Node selector được định nghĩa như một phần của Pod spec khi tạo DaemonSet. Cấu hình DaemonSet trong Ví dụ 11-2 giới hạn NGINX chỉ chạy trên các node có label `ssd=true`.

*Ví dụ 11-2. nginx-fast-storage.yaml*

```yaml
apiVersion: apps/v1
kind: "DaemonSet"
metadata:
  labels:
    app: nginx
    ssd: "true"
  name: nginx-fast-storage
spec:
  selector:
    matchLabels:
      app: nginx
      ssd: "true"
  template:
    metadata:
      labels:
        app: nginx
        ssd: "true"
    spec:
      nodeSelector:
        ssd: "true"
      containers:
        - name: nginx
          image: nginx:1.10.0
```

Hãy xem điều gì xảy ra khi chúng ta gửi DaemonSet `nginx-fast-storage` đến Kubernetes API:

```
$ kubectl apply -f nginx-fast-storage.yaml
daemonset.apps/nginx-fast-storage created
```

Vì chỉ có một node với label `ssd=true`, Pod `nginx-fast-storage` sẽ chỉ chạy trên node đó:

```
$ kubectl get pods -l app=nginx -o wide
NAME                       READY   STATUS    RESTARTS   AGE   IP
nginx-fast-storage-7b90t   1/1     Running   0          44s   10.240.0.48
```

Thêm label `ssd=true` vào các node khác sẽ làm Pod `nginx-fast-storage` được triển khai lên các node đó. Điều ngược lại cũng đúng: nếu một label bắt buộc bị xóa khỏi một node, Pod sẽ bị DaemonSet controller xóa.

> **CẢNH BÁO**
>
> Xóa các label khỏi một node mà node selector của DaemonSet yêu cầu sẽ làm Pod được DaemonSet đó quản lý bị xóa khỏi node.

## Cập nhật DaemonSet

DaemonSet rất tốt để triển khai các service trên toàn cluster, nhưng còn việc nâng cấp thì sao? Trước Kubernetes 1.6, cách duy nhất để cập nhật các Pod được DaemonSet quản lý là cập nhật DaemonSet rồi xóa thủ công từng Pod được DaemonSet quản lý để nó được tạo lại với cấu hình mới. Với bản phát hành Kubernetes 1.6, DaemonSet đã có một cơ chế tương đương với đối tượng Deployment quản lý rollout của ReplicaSet bên trong cluster.

DaemonSet có thể được phát hành bằng cùng chiến lược `RollingUpdate` mà Deployment dùng. Bạn có thể cấu hình chiến lược cập nhật bằng trường `spec.updateStrategy.type`, trường này nên có giá trị `RollingUpdate`. Khi một DaemonSet có chiến lược cập nhật là `RollingUpdate`, bất kỳ thay đổi nào đối với trường `spec.template` (hoặc các trường con) trong DaemonSet sẽ khởi động một rolling update.

Như với rolling update của Deployment (xem Chương 10), chiến lược `RollingUpdate` cập nhật dần dần các thành viên của DaemonSet cho đến khi tất cả các Pod đang chạy cấu hình mới. Có hai tham số kiểm soát rolling update của DaemonSet:

**`spec.minReadySeconds`**

Xác định một Pod phải "sẵn sàng" trong bao lâu trước khi rolling update tiến hành nâng cấp các Pod tiếp theo

**`spec.updateStrategy.rollingUpdate.maxUnavailable`**

Cho biết bao nhiêu Pod có thể được cập nhật đồng thời bởi rolling update

Bạn có lẽ sẽ muốn đặt `spec.minReadySeconds` thành một giá trị đủ dài, ví dụ 30–60 giây, để đảm bảo Pod của bạn thực sự khỏe mạnh trước khi rollout tiếp tục.

Thiết lập cho `spec.updateStrategy.rollingUpdate.maxUnavailable` nhiều khả năng phụ thuộc vào ứng dụng. Đặt nó là `1` là một chiến lược an toàn, đa mục đích, nhưng cũng mất một lúc để hoàn thành rollout (số node × `minReadySeconds`). Tăng mức không khả dụng tối đa sẽ làm rollout của bạn di chuyển nhanh hơn, nhưng tăng "bán kính vụ nổ" (blast radius) của một rollout thất bại. Các đặc tính của ứng dụng và môi trường cluster của bạn quy định các giá trị tương đối của tốc độ so với an toàn. Một cách tiếp cận tốt có thể là đặt `maxUnavailable` là `1` và chỉ tăng nó nếu người dùng hoặc quản trị viên phàn nàn về tốc độ rollout của DaemonSet.

Một khi rolling update đã bắt đầu, bạn có thể dùng các lệnh `kubectl rollout` để xem trạng thái hiện tại của rollout DaemonSet. Ví dụ, `kubectl rollout status daemonSets my-daemon-set` sẽ hiển thị trạng thái rollout hiện tại của DaemonSet tên `my-daemon-set`.

## Xóa DaemonSet

Xóa một DaemonSet bằng lệnh `kubectl delete` khá đơn giản. Chỉ cần đảm bảo cung cấp đúng tên của DaemonSet bạn muốn xóa:

```
$ kubectl delete -f fluentd.yaml
```

> **CẢNH BÁO**
>
> Xóa một DaemonSet cũng sẽ xóa tất cả các Pod được DaemonSet đó quản lý. Đặt cờ `--cascade` thành `false` để đảm bảo chỉ DaemonSet bị xóa mà không phải các Pod.

## Tóm tắt

DaemonSet cung cấp một trừu tượng hóa dễ sử dụng để chạy một tập Pod trên mọi node trong Kubernetes cluster, hoặc, nếu trường hợp yêu cầu, trên một tập con các node dựa trên label. DaemonSet cung cấp controller và scheduler riêng của nó để đảm bảo các service then chốt như agent giám sát luôn hoạt động trên các node đúng trong cluster của bạn.

Với một số ứng dụng, bạn chỉ đơn giản muốn lên lịch một số lượng replica nhất định; bạn không thực sự quan tâm chúng chạy ở đâu miễn là chúng có đủ tài nguyên và sự phân phối để hoạt động đáng tin cậy. Tuy nhiên, có một lớp ứng dụng khác, như agent và ứng dụng giám sát, cần hiện diện trên mọi máy trong cluster để hoạt động đúng. Các DaemonSet này không thực sự là ứng dụng phục vụ truyền thống, mà thay vào đó bổ sung các khả năng và tính năng cho chính Kubernetes cluster. Vì DaemonSet là một đối tượng khai báo chủ động được quản lý bởi một controller, nó giúp dễ dàng khai báo ý định của bạn rằng một agent chạy trên mọi máy mà không cần đặt nó tường minh trên mọi máy. Điều này đặc biệt hữu ích trong bối cảnh một Kubernetes cluster được tự động mở rộng, nơi các node có thể liên tục đến và đi mà không có sự can thiệp của người dùng. Trong những trường hợp như vậy, DaemonSet tự động thêm các agent thích hợp vào mỗi node khi autoscaler thêm node vào cluster.
