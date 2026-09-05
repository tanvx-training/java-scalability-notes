# Chương 13. Yêu cầu tài nguyên, giới hạn và quota

*Dịch từ: Chapter 13. Resource Requirements, Limits, and Quotas — Certified Kubernetes Administrator (CKA) Study Guide, 2nd Edition (O'Reilly).*

Một workload được thực thi trong Pod sẽ tiêu thụ một lượng tài nguyên nhất định (ví dụ: CPU và memory). Bạn nên định nghĩa yêu cầu tài nguyên (resource requirements) cho những ứng dụng đó. Ở cấp độ container, bạn có thể định nghĩa lượng tài nguyên tối thiểu cần thiết để chạy ứng dụng, cũng như lượng tài nguyên tối đa mà ứng dụng được phép tiêu thụ. Các nhà phát triển ứng dụng nên xác định kích cỡ phù hợp bằng các bài kiểm thử tải (load test) hoặc lúc chạy (runtime) bằng cách giám sát mức tiêu thụ tài nguyên.

> **ĐƠN VỊ TÀI NGUYÊN TRONG KUBERNETES**
>
> Kubernetes đo tài nguyên CPU theo millicore (m), còn gọi là millicpu, và tài nguyên memory theo byte. Đó là lý do bạn có thể thấy tài nguyên được định nghĩa là 600 m hoặc 100 Mi. Để tìm hiểu sâu về các đơn vị tài nguyên này, bạn nên tham khảo thêm mục "Resource units in Kubernetes" trong tài liệu chính thức.

> **PHẠM VI BAO PHỦ MỤC TIÊU ĐỀ CƯƠNG**
>
> Chương này đề cập đến mục tiêu đề cương (curriculum) sau:
>
> - Cấu hình việc tiếp nhận (admission) và lập lịch (scheduling) cho Pod (limit, node affinity, v.v.)

Quản trị viên Kubernetes có thể đưa ra các biện pháp để buộc việc sử dụng dung lượng tài nguyên sẵn có phải tuân theo quy định. Chương này thảo luận về hai primitive của Kubernetes trong lĩnh vực này: *ResourceQuota* và *LimitRange*. ResourceQuota định nghĩa các ràng buộc tài nguyên tổng hợp ở cấp độ namespace. LimitRange là một chính sách ràng buộc hoặc đặt giá trị mặc định cho việc cấp phát tài nguyên của một đối tượng đơn lẻ thuộc một loại cụ thể (chẳng hạn như cho một Pod hoặc một PersistentVolumeClaim).

## Làm việc với yêu cầu tài nguyên

Thực hành được khuyến nghị là bạn nên chỉ định resource request và resource limit cho mọi container. Việc xác định những kỳ vọng tài nguyên đó không phải lúc nào cũng dễ dàng, đặc biệt là với những ứng dụng chưa từng được vận hành trong môi trường production. Kiểm thử tải ứng dụng từ sớm trong chu kỳ phát triển có thể giúp phân tích nhu cầu tài nguyên. Có thể tiếp tục điều chỉnh bằng cách giám sát mức tiêu thụ tài nguyên của ứng dụng sau khi triển khai nó lên cluster.

Các lớp Quality of Service (QoS) trong Kubernetes tự động phân loại Pod vào các tầng Guaranteed, Burstable hoặc BestEffort dựa trên resource request và limit của chúng, qua đó xác định mức ưu tiên trục xuất (eviction) khi node gặp áp lực về tài nguyên. Mặc dù hiểu về QoS là điều có giá trị đối với các workload production, nó không được đề cập rõ ràng trong kỳ thi CKA, vốn tập trung nhiều hơn vào quản lý tài nguyên thực tế và lập lịch Pod hơn là các mức ưu tiên trục xuất bên dưới.

### Định nghĩa resource request cho container

Một thước đo có vai trò trong việc lập lịch workload là *resource request* được định nghĩa bởi các container trong một Pod. Các tài nguyên thường được chỉ định là CPU và memory. Scheduler đảm bảo rằng dung lượng tài nguyên của node có thể đáp ứng được yêu cầu tài nguyên của Pod. Cụ thể hơn, scheduler tính tổng các resource request theo từng loại tài nguyên trên tất cả các container được định nghĩa trong Pod và so sánh chúng với tài nguyên khả dụng của node.

Mỗi container trong một Pod có thể định nghĩa resource request riêng của mình. Bảng 13-1 mô tả các tùy chọn khả dụng, kèm theo giá trị ví dụ.

**Bảng 13-1. Các tùy chọn cho resource request**

| Thuộc tính YAML | Mô tả | Giá trị ví dụ |
|---|---|---|
| `spec.containers[].resources.requests.cpu` | Loại tài nguyên CPU | `500m` (năm trăm millicpu) |
| `spec.containers[].resources.requests.memory` | Loại tài nguyên memory | `64Mi` (2^26 byte) |
| `spec.containers[].resources.requests.hugepages-<size>` | Loại tài nguyên huge page | `hugepages-2Mi: 60Mi` |
| `spec.containers[].resources.requests.ephemeral-storage` | Loại tài nguyên lưu trữ tạm thời (ephemeral storage) | `4Gi` |

Để làm rõ cách dùng các resource request này, chúng ta sẽ xem xét một định nghĩa ví dụ. Manifest YAML của Pod trong Ví dụ 13-1 định nghĩa hai container, mỗi container có resource request riêng. Bất kỳ node nào được phép chạy Pod này cần có khả năng hỗ trợ dung lượng memory tối thiểu 320 Mi và 1250 m CPU, là tổng tài nguyên của cả hai container.

**Ví dụ 13-1. Thiết lập resource request cho container**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: rate-limiter
spec:
  containers:
  - name: business-app
    image: bmuschko/nodejs-business-app:1.0.0
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "256Mi"
        cpu: "1"
  - name: ambassador
    image: bmuschko/nodejs-ambassador:1.0.0
    ports:
    - containerPort: 8081
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
```

Hoàn toàn có khả năng một Pod không thể được lập lịch do không đủ tài nguyên khả dụng trên các node. Trong những trường hợp đó, nhật ký sự kiện (event log) của Pod sẽ chỉ ra tình huống này với lý do `PodExceedsFreeCPU` hoặc `PodExceedsFreeMemory`. Để biết thêm thông tin về cách xử lý sự cố và giải quyết tình huống này, hãy xem mục liên quan trong tài liệu.

### Định nghĩa resource limit cho container

Một thước đo khác bạn có thể đặt cho container là *resource limit*. Resource limit đảm bảo rằng container không thể tiêu thụ nhiều hơn lượng tài nguyên được cấp. Ví dụ, bạn có thể quy định rằng ứng dụng chạy trong container phải bị giới hạn ở mức 1.000 m CPU và 512 Mi memory.

Tùy thuộc vào container runtime mà cluster sử dụng, việc vượt quá bất kỳ resource limit nào được cho phép sẽ dẫn đến việc tiến trình ứng dụng chạy trong container bị chấm dứt, hoặc dẫn đến việc hệ thống ngăn không cho cấp phát tài nguyên vượt quá giới hạn. Để có một thảo luận chuyên sâu về cách container runtime Docker Engine xử lý resource limit, hãy xem tài liệu.

Bảng 13-2 mô tả các tùy chọn khả dụng, kèm theo giá trị ví dụ.

**Bảng 13-2. Các tùy chọn cho resource limit**

| Thuộc tính YAML | Mô tả | Giá trị ví dụ |
|---|---|---|
| `spec.containers[].resources.limits.cpu` | Loại tài nguyên CPU | `500m` (500 millicpu) |
| `spec.containers[].resources.limits.memory` | Loại tài nguyên memory | `64Mi` (2^26 byte) |
| `spec.containers[].resources.limits.hugepages-<size>` | Loại tài nguyên huge page | `hugepages-2Mi: 60Mi` |
| `spec.containers[].resources.limits.ephemeral-storage` | Loại tài nguyên lưu trữ tạm thời (ephemeral storage) | `4Gi` |

Ví dụ 13-2 cho thấy định nghĩa limit trong thực tế. Ở đây, container tên `business-app` không thể dùng quá 256 Mi memory. Container tên `ambassador` định nghĩa limit là 64 Mi memory.

**Ví dụ 13-2. Thiết lập resource limit cho container**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: rate-limiter
spec:
  containers:
  - name: business-app
    image: bmuschko/nodejs-business-app:1.0.0
    ports:
    - containerPort: 8080
    resources:
      limits:
        memory: "256Mi"
  - name: ambassador
    image: bmuschko/nodejs-ambassador:1.0.0
    ports:
    - containerPort: 8081
    resources:
      limits:
        memory: "64Mi"
```

### Định nghĩa resource request và limit cho container

Để cung cấp cho Kubernetes bức tranh đầy đủ về kỳ vọng tài nguyên của ứng dụng, bạn phải chỉ định resource request và limit cho mọi container. Ví dụ 13-3 kết hợp resource request và limit trong một manifest YAML duy nhất.

**Ví dụ 13-3. Thiết lập resource request và limit cho container**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: rate-limiter
spec:
  containers:
  - name: business-app
    image: bmuschko/nodejs-business-app:1.0.0
    ports:
    - containerPort: 8080
    resources:
      requests:
        memory: "256Mi"
        cpu: "1"
      limits:
        memory: "256Mi"
  - name: ambassador
    image: bmuschko/nodejs-ambassador:1.0.0
    ports:
    - containerPort: 8081
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "64Mi"
```

Việc gán yêu cầu tài nguyên tĩnh cho container là một quá trình ước lượng. Bạn muốn tối đa hóa việc sử dụng tài nguyên một cách hiệu quả trong cluster Kubernetes của mình. Đáng tiếc, tài liệu Kubernetes không đưa ra nhiều hướng dẫn về thực hành tốt nhất (best practice). Bài viết blog "For the Love of God, Stop Using CPU Limits on Kubernetes" của Natan Yellin đưa ra hướng dẫn sau:

- Luôn định nghĩa memory request.
- Luôn định nghĩa memory limit.
- Luôn đặt memory request bằng với limit.
- Luôn định nghĩa CPU request.
- Không dùng CPU limit.

Sau khi đưa ứng dụng vào production, bạn vẫn cần giám sát các mẫu tiêu thụ tài nguyên của ứng dụng. Hãy xem xét mức tiêu thụ tài nguyên lúc chạy và theo dõi hành vi lập lịch thực tế cũng như những hành vi không mong muốn tiềm ẩn khi ứng dụng nhận tải. Tìm được điểm cân bằng có thể là điều khó khăn. Các dự án như Goldilocks và KRR đã ra đời để đưa ra khuyến nghị và hướng dẫn về việc xác định resource request một cách phù hợp. Các lựa chọn khác, như chính sách thay đổi kích thước container (container resize policies) được giới thiệu trong Kubernetes 1.27, cho phép kiểm soát chi tiết hơn về cách tài nguyên CPU và memory của container được tự động điều chỉnh kích thước lúc chạy.

## Làm việc với ResourceQuota

Primitive ResourceQuota của Kubernetes thiết lập lượng tài nguyên tối đa có thể sử dụng cho mỗi namespace. Một khi được đưa vào áp dụng, scheduler của Kubernetes sẽ đảm nhận việc thực thi các quy tắc đó. Danh sách sau đây sẽ cho bạn hình dung về các quy tắc có thể được định nghĩa:

- Đặt giới hạn trên cho số lượng đối tượng có thể được tạo ra cho một loại cụ thể (ví dụ: tối đa ba Pod)
- Giới hạn tổng lượng tài nguyên tính toán (ví dụ: 3 Gi RAM)
- Yêu cầu một lớp Quality of Service (QoS) cho Pod (ví dụ: `BestEffort` để chỉ ra rằng Pod không được đặt bất kỳ memory hay CPU limit hoặc request nào)

### Tạo ResourceQuota

Với tư cách quản trị viên Kubernetes, việc tạo ResourceQuota thường là nhiệm vụ của bạn. Trước tiên, hãy tạo namespace mà quota sẽ áp dụng cho:

```shell
$ kubectl create namespace team-awesome
namespace/team-awesome created
```

Tiếp theo, định nghĩa ResourceQuota bằng YAML. Để minh họa chức năng của ResourceQuota, hãy thêm các ràng buộc vào namespace, như trong Ví dụ 13-4.

**Ví dụ 13-4. Định nghĩa giới hạn tài nguyên cứng bằng ResourceQuota**

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: awesome-quota
  namespace: team-awesome
spec:
  hard:
    pods: 2                     # ❶
    requests.cpu: "1"           # ❷
    requests.memory: 1024Mi     # ❷
    limits.cpu: "4"             # ❸
    limits.memory: 4096Mi       # ❸
```

❶ Giới hạn số lượng Pod ở mức 2.

❷ Trên tất cả các Pod ở trạng thái chưa kết thúc (nonterminal), tổng CPU request không được vượt quá giá trị này.

❸ Trên tất cả các Pod ở trạng thái chưa kết thúc, tổng memory request không được vượt quá giá trị này.

Bạn đã sẵn sàng tạo ResourceQuota cho namespace:

```shell
$ kubectl create -f awesome-quota.yaml
resourcequota/awesome-quota created
```

### Hiển thị chi tiết ResourceQuota

Bạn có thể hiển thị một bảng tổng quan về tài nguyên đã dùng so với giới hạn cứng bằng lệnh `kubectl describe`:

```shell
$ kubectl describe resourcequota awesome-quota -n team-awesome
Name:                awesome-quota
Namespace:           team-awesome
Resource             Used      Hard
--------             ----      ----
limits.cpu           0         4
limits.memory        0         4Gi
pods                 0         2
requests.cpu         0         1
requests.memory      0         1Gi
```

Cột `Hard` liệt kê chính các giá trị bạn đã cung cấp trong định nghĩa ResourceQuota. Những giá trị đó sẽ không thay đổi chừng nào bạn không sửa đổi đặc tả (specification) của đối tượng. Dưới cột `Used`, bạn có thể thấy mức tiêu thụ tài nguyên tổng hợp thực tế trong namespace. Tại thời điểm này, tất cả các giá trị đều là `0` vì chưa có Pod nào được tạo.

### Khám phá hành vi lúc chạy của ResourceQuota

Với các quy tắc quota đã được áp dụng cho namespace `team-awesome`, chúng ta sẽ muốn thấy việc thực thi của nó trong thực tế. Chúng ta sẽ bắt đầu bằng cách tạo nhiều hơn số lượng Pod tối đa, tức là hai. Để kiểm tra điều này, chúng ta có thể tạo Pod với bất kỳ định nghĩa nào mình muốn. Ví dụ, chúng ta dùng một định nghĩa tối giản chạy image `nginx:1.25.3` trong container, như trong Ví dụ 13-5.

**Ví dụ 13-5. Một Pod không có yêu cầu tài nguyên**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: team-awesome
spec:
  containers:
  - image: nginx:1.25.3
    name: nginx
```

Từ định nghĩa YAML đó được lưu trong file *nginx-pod.yaml*, hãy tạo một Pod và xem điều gì xảy ra. Thực tế, Kubernetes sẽ từ chối việc tạo đối tượng với thông báo lỗi sau:

```shell
$ kubectl apply -f nginx-pod.yaml
Error from server (Forbidden): error when creating "nginx-pod.yaml": \
pods "nginx" is forbidden: failed quota: awesome-quota: must specify \
limits.cpu for: nginx; limits.memory for: nginx; requests.cpu for: \
nginx; requests.memory for: nginx
```

Vì chúng ta đã định nghĩa quota tài nguyên tối thiểu và tối đa cho các đối tượng trong namespace, chúng ta phải đảm bảo rằng các đối tượng Pod thực sự định nghĩa resource request và limit. Hãy sửa định nghĩa ban đầu bằng cách cập nhật chỉ thị dưới `resources`, như trong Ví dụ 13-6.

**Ví dụ 13-6. Một Pod có yêu cầu tài nguyên**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx
  namespace: team-awesome
spec:
  containers:
  - image: nginx:1.25.3
    name: nginx
    resources:
      requests:
        cpu: "0.5"
        memory: "512Mi"
      limits:
        cpu: "1"
        memory: "1024Mi"
```

Chúng ta sẽ có thể tạo được hai Pod với tên khác nhau—`nginx1` và `nginx2`—bằng manifest đó; tổng yêu cầu tài nguyên vẫn nằm trong ranh giới được định nghĩa trong ResourceQuota:

```shell
$ kubectl apply -f nginx-pod1.yaml
pod/nginx1 created
$ kubectl apply -f nginx-pod2.yaml
pod/nginx2 created
$ kubectl describe resourcequota awesome-quota -n team-awesome
Name:                 awesome-quota
Namespace:            team-awesome
Resource              Used    Hard
--------              ----    ----
limits.cpu            2       4
limits.memory         2Gi     4Gi
pods                  2       2
requests.cpu          1       1
requests.memory       1Gi     1Gi
```

Bạn có thể hình dung điều gì sẽ xảy ra nếu chúng ta cố tạo thêm một Pod nữa với định nghĩa của `nginx1` và `nginx2`. Việc này sẽ thất bại vì hai lý do. Lý do thứ nhất là chúng ta không được phép tạo Pod thứ ba trong namespace, vì số lượng tối đa được đặt là hai. Lý do thứ hai là chúng ta sẽ vượt quá mức tối đa được cấp cho `requests.cpu` và `requests.memory`. Thông báo lỗi sau đây cung cấp cho chúng ta thông tin này:

```shell
$ kubectl apply -f nginx-pod3.yaml
Error from server (Forbidden): error when creating "nginx-pod3.yaml": \
pods "nginx3" is forbidden: exceeded quota: awesome-quota, requested: \
pods=1,requests.cpu=500m,requests.memory=512Mi, used: pods=2,requests.cpu=1, \
requests.memory=1Gi, limited: pods=2,requests.cpu=1,requests.memory=1Gi
```

## Làm việc với LimitRange

Trong mục trước, bạn đã học cách một resource quota có thể hạn chế mức tiêu thụ tài nguyên tổng hợp trong một namespace cụ thể. Đối với từng đối tượng Pod riêng lẻ, resource quota không thể đặt bất kỳ ràng buộc nào. Đó là lúc limit range phát huy tác dụng. Việc thực thi các quy tắc LimitRange diễn ra trong giai đoạn kiểm soát tiếp nhận (admission control) khi xử lý một yêu cầu API.

> **ĐỊNH NGHĨA NHIỀU HƠN MỘT LIMITRANGE TRONG MỘT NAMESPACE**
>
> Tốt nhất là chỉ tạo một đối tượng LimitRange duy nhất cho mỗi namespace. Resource request và limit mặc định được chỉ định bởi nhiều đối tượng LimitRange trong cùng một namespace sẽ dẫn đến việc lựa chọn các quy tắc đó một cách không xác định (nondeterministic). Chỉ một trong các định nghĩa mặc định sẽ thắng, nhưng bạn không thể đoán trước được đó là định nghĩa nào.

LimitRange là một primitive của Kubernetes dùng để ràng buộc hoặc đặt giá trị mặc định cho việc cấp phát tài nguyên của các loại đối tượng cụ thể:

- Thực thi mức sử dụng tài nguyên tính toán tối thiểu và tối đa cho mỗi Pod hoặc container trong một namespace
- Thực thi mức yêu cầu lưu trữ tối thiểu và tối đa cho mỗi PersistentVolumeClaim trong một namespace
- Thực thi tỷ lệ giữa request và limit cho một tài nguyên trong một namespace
- Đặt request/limit mặc định cho tài nguyên tính toán trong một namespace và tự động chèn chúng vào các container lúc chạy

### Tạo LimitRange

LimitRange cung cấp một danh sách các thuộc tính ràng buộc có thể cấu hình. Tất cả đều được mô tả rất chi tiết trong tài liệu API Kubernetes cho LimitRangeSpec. Ví dụ 13-7 cho thấy một manifest YAML của LimitRange sử dụng một số thuộc tính ràng buộc.

**Ví dụ 13-7. Một LimitRange định nghĩa nhiều tiêu chí ràng buộc**

```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: cpu-resource-constraint
spec:
  limits:
  - type: Container        # ❶
    defaultRequest:        # ❷
      cpu: 200m
    default:               # ❸
      cpu: 200m
    min:                   # ❹
      cpu: 100m
    max:                   # ❹
      cpu: "2"
```

❶ Ngữ cảnh mà các ràng buộc được áp dụng (trong trường hợp này là một container chạy trong Pod)

❷ Giá trị CPU resource request mặc định được gán cho container nếu không được cung cấp

❸ Giá trị CPU resource limit mặc định được gán cho container nếu không được cung cấp

❹ Giá trị CPU resource request và limit tối thiểu và tối đa có thể gán cho một container

Như thường lệ, chúng ta có thể tạo đối tượng từ manifest bằng lệnh `kubectl create` hoặc `kubectl apply`. Định nghĩa LimitRange đã được lưu trong file *cpu-resource-constraint-limitrange.yaml*:

```shell
$ kubectl apply -f cpu-resource-constraint.yaml
limitrange/cpu-resource-constraint created
```

Các ràng buộc sẽ được áp dụng tự động khi tạo đối tượng mới. Việc thay đổi các ràng buộc của một đối tượng LimitRange hiện có sẽ không ảnh hưởng gì đến các Pod đang chạy.

### Hiển thị chi tiết LimitRange

Các đối tượng LimitRange đang hoạt động có thể được kiểm tra bằng lệnh `kubectl describe`. Lệnh sau đây hiển thị chi tiết của đối tượng LimitRange tên `cpu-resource-constraint`:

```shell
$ kubectl describe limitrange cpu-resource-constraint
Name:       cpu-resource-constraint
Namespace:  default
Type        Resource  Min   Max  Default Request  Default Limit  ...
----        --------  ---   ---  ---------------  -------------
Container   cpu       100m  2    200m             200m           ...
```

Đầu ra của lệnh hiển thị mỗi ràng buộc limit trên một dòng. Bất kỳ thuộc tính ràng buộc nào chưa được đối tượng đặt tường minh sẽ hiển thị ký tự gạch ngang (`-`) làm giá trị được gán.

### Khám phá hành vi lúc chạy của LimitRange

Hãy cùng minh họa tác động của LimitRange đến việc tạo Pod. Chúng ta sẽ đi qua hai trường hợp sử dụng khác nhau:

- Tự động thiết lập yêu cầu tài nguyên nếu chúng chưa được cung cấp trong định nghĩa Pod
- Ngăn không cho tạo Pod nếu yêu cầu tài nguyên được khai báo bị LimitRange cấm

#### Thiết lập yêu cầu tài nguyên mặc định

LimitRange định nghĩa CPU resource request mặc định là 200 m và CPU resource limit mặc định là 200 m. Điều đó có nghĩa là nếu một Pod sắp được tạo mà không định nghĩa CPU resource request và limit, LimitRange sẽ tự động gán các giá trị mặc định.

Ví dụ 13-8 cho thấy một định nghĩa Pod không có yêu cầu tài nguyên.

**Ví dụ 13-8. Một Pod không định nghĩa yêu cầu tài nguyên**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-without-resource-requirements
spec:
  containers:
  - image: nginx:1.25.3
    name: nginx
```

Việc tạo đối tượng từ nội dung được lưu trong file *nginx-without-resource-requirements.yaml* sẽ hoạt động như mong đợi:

```shell
$ kubectl apply -f nginx-without-resource-requirements.yaml
pod/nginx-without-resource-requirements created
```

Đối tượng Pod sẽ bị biến đổi (mutate) theo hai cách. Thứ nhất, các yêu cầu tài nguyên mặc định do LimitRange đặt được áp dụng. Thứ hai, một annotation với key `kubernetes.io/limit-ranger` sẽ được thêm vào để cung cấp thông tin meta về những gì đã bị thay đổi. Bạn có thể tìm thấy cả hai thông tin này trong đầu ra của lệnh `describe`:

```shell
$ kubectl describe pod nginx-without-resource-requirements
...
Annotations:      kubernetes.io/limit-ranger: LimitRanger plugin set: cpu
request for container nginx; cpu limit for container nginx
...
Containers:
  nginx:
    ...
    Limits:
      cpu: 200m
    Requests:
      cpu: 200m
...
```

#### Thực thi yêu cầu tài nguyên

LimitRange cũng có thể thực thi resource limit. Đối với đối tượng LimitRange chúng ta đã tạo trước đó, lượng CPU tối thiểu được đặt là 100 m, và lượng CPU tối đa được đặt là 2. Để thấy hành vi thực thi trong thực tế, chúng ta sẽ tạo một Pod mới như trong Ví dụ 13-9.

**Ví dụ 13-9. Một Pod định nghĩa CPU resource request và limit**

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: nginx-with-resource-requirements
spec:
  containers:
  - image: nginx:1.25.3
    name: nginx
    resources:
      requests:
        cpu: "50m"
      limits:
        cpu: "3"
```

Yêu cầu tài nguyên của Pod này không tuân theo các ràng buộc mà đối tượng LimitRange mong đợi. CPU resource request nhỏ hơn 100 m, và CPU resource limit lớn hơn 2. Kết quả là đối tượng sẽ không được tạo và một thông báo lỗi tương ứng sẽ được hiển thị:

```shell
$ kubectl apply -f nginx-with-resource-requirements.yaml
Error from server (Forbidden): error when creating "nginx-with-resource-\
requirements.yaml": pods "nginx-with-resource-requirements" is forbidden: \
[minimum cpu usage per Container is 100 m, but request is 50 m, maximum cpu \
usage per Container is 2, but limit is 3]
```

Thông báo lỗi cung cấp một số hướng dẫn về định nghĩa tài nguyên được mong đợi. Đáng tiếc, thông báo không chỉ ra tên của đối tượng LimitRange đang thực thi những kỳ vọng đó. Hãy chủ động kiểm tra xem một đối tượng LimitRange đã được tạo cho namespace hay chưa và những tham số nào đã được đặt bằng lệnh `kubectl get limitranges`.

## Tóm tắt

Resource request là một trong nhiều yếu tố mà thuật toán của kube-scheduler xem xét khi đưa ra quyết định về việc Pod có thể được lập lịch lên node nào. Một container có thể chỉ định request bằng `spec.containers[].resources.requests`. Scheduler chọn node dựa trên dung lượng phần cứng khả dụng của nó. Resource limit đảm bảo rằng container không thể tiêu thụ nhiều hơn lượng tài nguyên được cấp. Limit có thể được định nghĩa cho container bằng thuộc tính `spec.containers[].resources.limits`. Nếu một ứng dụng tiêu thụ nhiều hơn lượng tài nguyên cho phép (ví dụ: do rò rỉ memory trong phần triển khai), container runtime nhiều khả năng sẽ chấm dứt tiến trình ứng dụng.

Một resource quota định nghĩa các tài nguyên tính toán (ví dụ: CPU, RAM và lưu trữ tạm thời) khả dụng cho một namespace nhằm ngăn chặn việc tiêu thụ không giới hạn bởi các Pod chạy trong đó. Theo đó, các Pod phải hoạt động trong những ranh giới tài nguyên đó bằng cách khai báo kỳ vọng tài nguyên tối thiểu và tối đa của chúng. Bạn cũng có thể giới hạn số lượng của các loại tài nguyên (như Pod, Secret hoặc ConfigMap) được phép tạo. Scheduler của Kubernetes sẽ thực thi những ranh giới đó khi có yêu cầu tạo đối tượng.

Limit range khác với ResourceQuota ở chỗ nó định nghĩa các ràng buộc tài nguyên cho một đối tượng đơn lẻ thuộc một loại cụ thể. Nó cũng có thể hỗ trợ việc quản trị (governance) các đối tượng bằng cách chỉ định các giá trị tài nguyên mặc định sẽ được áp dụng tự động nếu yêu cầu tạo qua API không cung cấp thông tin đó.

## Trọng tâm cho kỳ thi

**Trải nghiệm tác động của yêu cầu tài nguyên đến việc lập lịch và autoscaling**

Một container được định nghĩa bởi Pod có thể chỉ định resource request và limit. Hãy thực hành các kịch bản trong đó bạn định nghĩa những yêu cầu đó riêng lẻ và kết hợp cho các Pod một container và nhiều container. Khi tạo Pod, bạn sẽ có thể thấy được tác động đến việc lập lịch đối tượng lên một node. Ngoài ra, hãy luyện tập cách xác định dung lượng tài nguyên khả dụng của một node.

**Hiểu mục đích và tác động lúc chạy của resource quota**

Một ResourceQuota định nghĩa ranh giới tài nguyên cho các đối tượng nằm trong một namespace. Các ranh giới được dùng phổ biến nhất áp dụng cho tài nguyên tính toán. Hãy luyện tập định nghĩa chúng và hiểu tác động của chúng đến việc tạo Pod. Điều quan trọng là phải biết lệnh để liệt kê các yêu cầu cứng của ResourceQuota và các tài nguyên hiện đang được sử dụng. Bạn sẽ thấy rằng ResourceQuota còn cung cấp các tùy chọn khác. Hãy tìm hiểu chúng chi tiết hơn để có cái nhìn rộng hơn về chủ đề này.

**Hiểu mục đích và tác động lúc chạy của limit range**

Một LimitRange có thể chỉ định các ràng buộc tài nguyên và giá trị mặc định cho các primitive cụ thể. Nếu bạn gặp tình huống nhận được thông báo lỗi khi tạo đối tượng, hãy kiểm tra xem có đối tượng LimitRange nào đang thực thi những ràng buộc đó hay không. Đáng tiếc, thông báo lỗi không chỉ ra đối tượng thực thi nó, vì vậy bạn có thể phải chủ động liệt kê các đối tượng LimitRange để xác định các ràng buộc.

## Bài tập mẫu

Lời giải cho các bài tập này có trong Phụ lục A.

1. Bạn được giao nhiệm vụ tạo một Pod để chạy một ứng dụng trong container. Trong quá trình phát triển ứng dụng, bạn đã chạy một bài kiểm thử tải để tìm ra lượng tài nguyên tối thiểu cần thiết và lượng tài nguyên tối đa mà ứng dụng được phép tăng lên. Hãy định nghĩa những resource request và limit đó cho Pod.

   Định nghĩa một Pod tên `hello-world` chạy container image `bmuschko/nodejs-hello-world:1.0.0`. Container này mở port `3000`.

   Thêm một volume loại `emptyDir` và mount nó vào đường dẫn */var/log* trong container.

   Đối với container, chỉ định lượng tài nguyên tối thiểu sau:

   - CPU: 100 m
   - Memory: 500 Mi
   - Ephemeral storage: 1 Gi

   Đối với container, chỉ định lượng tài nguyên tối đa sau:

   - Memory: 500 Mi
   - Ephemeral storage: 2 Gi

   Tạo Pod từ manifest YAML. Kiểm tra chi tiết Pod. Pod chạy trên node nào?

2. Trong bài tập này, bạn sẽ tạo một resource quota với các giới hạn CPU và memory cụ thể cho một namespace mới. Các Pod được tạo trong namespace sẽ phải tuân theo những giới hạn đó.

   Tạo một ResourceQuota tên `app` trong namespace `rq-demo` bằng định nghĩa YAML sau trong file *resourcequota.yaml*:

   ```yaml
   apiVersion: v1
   kind: ResourceQuota
   metadata:
     name: app
   spec:
     hard:
       pods: "2"
       requests.cpu: "2"
       requests.memory: 500Mi
   ```

   Tạo một Pod mới vượt quá giới hạn của yêu cầu resource quota, ví dụ bằng cách định nghĩa 1 Gi memory, nhưng vẫn dưới mức CPU, ví dụ 0.5. Ghi lại thông báo lỗi.

   Thay đổi request limit để đáp ứng các yêu cầu nhằm đảm bảo Pod có thể được tạo thành công. Ghi lại đầu ra của lệnh hiển thị lượng tài nguyên đã dùng cho namespace.

3. Một LimitRange có thể hạn chế mức tiêu thụ tài nguyên cho các Pod trong một namespace, và gán tài nguyên tính toán mặc định nếu không có yêu cầu tài nguyên nào được định nghĩa. Bạn sẽ thực hành tác động của LimitRange đến việc tạo Pod trong các kịch bản khác nhau.

   Di chuyển đến thư mục *app-a/ch13/limitrange* của kho GitHub *bmuschko/cka-study-guide* đã checkout. Kiểm tra định nghĩa manifest YAML trong file *setup.yaml*. Tạo các đối tượng từ file manifest YAML này.

   Tạo một Pod mới tên `pod-without-resource-requirements` trong namespace `d92` sử dụng container image `nginx:1.23.4-alpine` mà không có bất kỳ yêu cầu tài nguyên nào. Kiểm tra chi tiết Pod. Bạn dự đoán những định nghĩa tài nguyên nào sẽ được gán?

   Tạo một Pod mới tên `pod-with-more-cpu-resource-requirements` trong namespace `d92` sử dụng container image `nginx:1.23.4-alpine` với CPU resource request là 400 m và limit là 1.5. Bạn dự đoán sẽ thấy hành vi lúc chạy nào?

   Tạo một Pod mới tên `pod-with-less-cpu-resource-requirements` trong namespace `d92` sử dụng container image `nginx:1.23.4-alpine` với CPU resource request là 350 m và limit là 400 m. Bạn dự đoán sẽ thấy hành vi lúc chạy nào?
