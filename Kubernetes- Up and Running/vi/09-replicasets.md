# Chương 9. ReplicaSet

Chúng ta đã đề cập đến cách chạy các container riêng lẻ dưới dạng Pod, nhưng những Pod này về bản chất là các singleton một lần. Thường thì bạn muốn nhiều replica của một container chạy tại một thời điểm nhất định vì nhiều lý do:

**Dự phòng (Redundancy)**

Chịu lỗi bằng cách chạy nhiều instance.

**Mở rộng (Scale)**

Năng lực xử lý yêu cầu cao hơn bằng cách chạy nhiều instance.

**Phân mảnh (Sharding)**

Các replica khác nhau có thể xử lý các phần khác nhau của một phép tính song song.

Dĩ nhiên, bạn có thể tạo thủ công nhiều bản sao của một Pod bằng nhiều Pod manifest khác nhau (mặc dù phần lớn giống nhau), nhưng làm vậy vừa tẻ nhạt vừa dễ lỗi. Về mặt logic, một người dùng quản lý một tập Pod được nhân bản xem chúng như một thực thể duy nhất để định nghĩa và quản lý, và đó chính xác là ReplicaSet. ReplicaSet hoạt động như một trình quản lý Pod toàn cluster, đảm bảo đúng loại và số lượng Pod đang chạy tại mọi thời điểm.

Vì ReplicaSet giúp dễ dàng tạo và quản lý các tập Pod được nhân bản, chúng là các khối xây dựng cho các mẫu triển khai ứng dụng phổ biến và cho các ứng dụng tự phục hồi ở mức hạ tầng. Các Pod được ReplicaSet quản lý được tự động lên lịch lại trong một số điều kiện lỗi nhất định, như lỗi node và phân mảnh mạng (network partition).

Cách dễ nhất để nghĩ về ReplicaSet là nó kết hợp một khuôn cắt bánh quy và số lượng bánh quy mong muốn vào một đối tượng API duy nhất. Khi định nghĩa một ReplicaSet, chúng ta định nghĩa một đặc tả cho các Pod muốn tạo ("khuôn cắt bánh quy") và số replica mong muốn. Ngoài ra, chúng ta cần định nghĩa một cách để tìm các Pod mà ReplicaSet nên kiểm soát. Hành động thực sự quản lý các Pod được nhân bản là một ví dụ về vòng lặp đồng bộ (reconciliation loop). Những vòng lặp như vậy là nền tảng cho hầu hết thiết kế và hiện thực của Kubernetes.

## Vòng lặp đồng bộ (Reconciliation Loop)

Khái niệm trung tâm đằng sau vòng lặp đồng bộ là ý niệm về trạng thái mong muốn so với trạng thái quan sát được hay trạng thái hiện tại. Trạng thái mong muốn là trạng thái bạn muốn. Với ReplicaSet, đó là số replica mong muốn và định nghĩa của Pod cần nhân bản. Ví dụ, "trạng thái mong muốn là có ba replica của một Pod chạy server `kuard`". Ngược lại, trạng thái hiện tại là trạng thái hiện được quan sát của hệ thống. Ví dụ, "hiện chỉ có hai Pod `kuard` đang chạy".

Vòng lặp đồng bộ chạy liên tục, quan sát trạng thái hiện tại của thế giới và thực hiện hành động để cố làm trạng thái quan sát khớp với trạng thái mong muốn. Ví dụ, với các ví dụ trước, vòng lặp đồng bộ sẽ tạo một Pod `kuard` mới trong nỗ lực làm trạng thái quan sát khớp với trạng thái mong muốn là ba replica.

Có nhiều lợi ích của cách tiếp cận vòng lặp đồng bộ để quản lý trạng thái. Nó vốn là một hệ thống hướng mục tiêu, tự phục hồi, nhưng thường có thể được biểu diễn dễ dàng chỉ trong vài dòng code. Ví dụ, vòng lặp đồng bộ cho ReplicaSet là một vòng lặp duy nhất, nhưng nó xử lý các hành động của người dùng để mở rộng hoặc thu nhỏ ReplicaSet cũng như lỗi node hoặc node tái gia nhập cluster sau khi vắng mặt.

Chúng ta sẽ thấy nhiều ví dụ về vòng lặp đồng bộ trong thực tế xuyên suốt phần còn lại của cuốn sách.

## Liên hệ giữa Pod và ReplicaSet

Tách rời là một chủ đề then chốt trong Kubernetes. Cụ thể, điều quan trọng là tất cả các khái niệm cốt lõi của Kubernetes đều mô-đun hóa với nhau và có thể hoán đổi, thay thế bằng các thành phần khác. Trong tinh thần này, mối quan hệ giữa ReplicaSet và Pod là liên kết lỏng. Mặc dù ReplicaSet tạo và quản lý Pod, chúng không sở hữu các Pod chúng tạo ra. ReplicaSet dùng các truy vấn label để xác định tập Pod mà chúng nên quản lý. Sau đó chúng dùng chính Pod API mà bạn đã dùng trực tiếp trong Chương 5 để tạo các Pod mà chúng đang quản lý. Ý niệm "đi vào bằng cửa trước" này là một khái niệm thiết kế trung tâm khác trong Kubernetes. Trong một sự tách rời tương tự, các ReplicaSet tạo nhiều Pod và các service cân bằng tải đến các Pod đó cũng là các đối tượng API hoàn toàn riêng biệt, tách rời. Ngoài việc hỗ trợ tính mô-đun, việc tách rời Pod và ReplicaSet cho phép một số hành vi quan trọng, được thảo luận trong các phần sau.

### Tiếp nhận các Container hiện có

Mặc dù cấu hình khai báo có giá trị, có những lúc việc xây dựng thứ gì đó theo kiểu mệnh lệnh dễ hơn. Cụ thể, ban đầu bạn có thể chỉ đơn giản triển khai một Pod duy nhất với một container image mà không có ReplicaSet quản lý nó. Bạn thậm chí có thể định nghĩa một load balancer để phục vụ lưu lượng đến Pod duy nhất đó.

Nhưng đến một lúc nào đó, bạn có thể muốn mở rộng container singleton của mình thành một service được nhân bản và tạo và quản lý một mảng các container tương tự. Nếu ReplicaSet sở hữu các Pod chúng tạo ra, thì cách duy nhất để bắt đầu nhân bản Pod của bạn sẽ là xóa nó và khởi chạy lại thông qua một ReplicaSet. Điều này có thể gây gián đoạn, vì sẽ có một khoảnh khắc không có bản sao nào của container đang chạy. Tuy nhiên, vì ReplicaSet được tách rời khỏi các Pod chúng quản lý, bạn có thể đơn giản tạo một ReplicaSet sẽ "tiếp nhận" (adopt) Pod hiện có và mở rộng thêm các bản sao của các container đó. Theo cách này, bạn có thể chuyển liền mạch từ một Pod mệnh lệnh đơn lẻ sang một tập Pod được nhân bản do ReplicaSet quản lý.

### Cách ly Container

Thường thì khi một server hành xử sai, các kiểm tra sức khỏe mức Pod sẽ tự động khởi động lại Pod đó. Nhưng nếu các kiểm tra sức khỏe của bạn không đầy đủ, một Pod có thể đang hành xử sai nhưng vẫn là một phần của tập được nhân bản. Trong những tình huống này, mặc dù việc đơn giản giết Pod sẽ hiệu quả, điều đó sẽ chỉ để lại cho các nhà phát triển của bạn log để gỡ lỗi vấn đề. Thay vào đó, bạn có thể sửa đổi tập label trên Pod bị bệnh. Làm vậy sẽ tách nó khỏi ReplicaSet (và service) để bạn có thể gỡ lỗi Pod. ReplicaSet controller sẽ nhận thấy một Pod bị thiếu và tạo một bản sao mới, nhưng vì Pod vẫn đang chạy, nó có sẵn cho các nhà phát triển để gỡ lỗi tương tác, điều này có giá trị hơn đáng kể so với gỡ lỗi từ log.

## Thiết kế với ReplicaSet

ReplicaSet được thiết kế để đại diện cho một microservice duy nhất, có khả năng mở rộng bên trong kiến trúc của bạn. Đặc tính then chốt của chúng là mọi Pod mà ReplicaSet controller tạo ra đều hoàn toàn đồng nhất. Thông thường, các Pod này sau đó được đặt sau một Kubernetes service load balancer, phân phối lưu lượng trên các Pod tạo nên service. Nói chung, ReplicaSet được thiết kế cho các service stateless (hoặc gần stateless). Các phần tử chúng tạo ra có thể hoán đổi cho nhau; khi một ReplicaSet được thu nhỏ, một Pod tùy ý được chọn để xóa. Hành vi của ứng dụng của bạn không nên thay đổi vì một thao tác thu nhỏ như vậy.

> **LƯU Ý**
>
> Thông thường bạn sẽ thấy các ứng dụng dùng đối tượng Deployment vì nó cho phép bạn quản lý việc phát hành các phiên bản mới. ReplicaSet vận hành Deployment bên dưới, và việc hiểu cách chúng hoạt động là quan trọng để bạn có thể gỡ lỗi chúng khi cần khắc phục sự cố.

## Đặc tả ReplicaSet

Giống như tất cả các đối tượng trong Kubernetes, ReplicaSet được định nghĩa bằng một đặc tả. Tất cả các ReplicaSet phải có một tên duy nhất (được định nghĩa bằng trường `metadata.name`), một phần `spec` mô tả số Pod (replica) nên chạy trên toàn cluster tại bất kỳ thời điểm nào, và một Pod template mô tả Pod cần được tạo khi số replica đã định nghĩa không được đáp ứng. Ví dụ 9-1 cho thấy một định nghĩa ReplicaSet tối thiểu. Hãy chú ý đến các phần replicas, selector và template của định nghĩa vì chúng cung cấp thêm hiểu biết về cách ReplicaSet hoạt động.

*Ví dụ 9-1. kuard-rs.yaml*

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  labels:
    app: kuard
    version: "2"
  name: kuard
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kuard
      version: "2"
  template:
    metadata:
      labels:
        app: kuard
        version: "2"
    spec:
      containers:
        - name: kuard
          image: "gcr.io/kuar-demo/kuard-amd64:green"
```

### Pod Template

Như đã đề cập trước đó, khi số Pod trong trạng thái hiện tại ít hơn số Pod trong trạng thái mong muốn, ReplicaSet controller sẽ tạo các Pod mới bằng một template chứa trong đặc tả ReplicaSet. Các Pod được tạo theo cách giống hệt như khi bạn tạo một Pod từ file YAML trong các chương trước, nhưng thay vì dùng file, Kubernetes ReplicaSet controller tạo và gửi một Pod manifest dựa trên Pod template trực tiếp đến API server. Đây là một ví dụ về Pod template trong một ReplicaSet:

```yaml
template:
  metadata:
    labels:
      app: helloworld
      version: v1
  spec:
    containers:
      - name: helloworld
        image: kelseyhightower/helloworld:v1
        ports:
          - containerPort: 80
```

### Label

Trong bất kỳ cluster có kích cỡ hợp lý nào, nhiều Pod khác nhau đang chạy đồng thời, vậy làm sao vòng lặp đồng bộ của ReplicaSet phát hiện tập Pod cho một ReplicaSet cụ thể? ReplicaSet giám sát trạng thái cluster bằng một tập label Pod để lọc danh sách Pod và theo dõi các Pod chạy trong cluster. Khi được tạo lần đầu, một ReplicaSet lấy danh sách Pod từ Kubernetes API và lọc kết quả theo label. Dựa trên số Pod mà truy vấn trả về, ReplicaSet xóa hoặc tạo Pod để đáp ứng số replica mong muốn. Các label lọc này được định nghĩa trong phần `spec` của ReplicaSet và là chìa khóa để hiểu cách ReplicaSet hoạt động.

> **LƯU Ý**
>
> Selector trong `spec` của ReplicaSet nên là một tập con thực sự của các label trong Pod template.

## Tạo ReplicaSet

ReplicaSet được tạo bằng cách gửi một đối tượng ReplicaSet đến Kubernetes API. Trong phần này, chúng ta sẽ tạo một ReplicaSet bằng một file cấu hình và lệnh `kubectl apply`.

File cấu hình ReplicaSet trong Ví dụ 9-1 sẽ đảm bảo một bản sao của container `gcr.io/kuar-demo/kuard-amd64:green` đang chạy tại bất kỳ thời điểm nào. Dùng lệnh `kubectl apply` để gửi ReplicaSet `kuard` đến Kubernetes API:

```
$ kubectl apply -f kuard-rs.yaml
replicaset "kuard" created
```

Một khi ReplicaSet `kuard` đã được chấp nhận, ReplicaSet controller sẽ phát hiện rằng không có Pod `kuard` nào đang chạy khớp với trạng thái mong muốn và tạo một Pod `kuard` mới dựa trên nội dung của Pod template:

```
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
kuard-yvzgd   1/1     Running   0          11s
```

## Kiểm tra ReplicaSet

Như với Pod và các đối tượng Kubernetes API khác, nếu bạn quan tâm đến chi tiết hơn về một ReplicaSet, bạn có thể dùng lệnh `describe` để cung cấp nhiều thông tin hơn về trạng thái của nó. Đây là một ví dụ về việc dùng `describe` để lấy chi tiết của ReplicaSet chúng ta đã tạo trước đó:

```
$ kubectl describe rs kuard
Name:         kuard
Namespace:    default
Selector:     app=kuard,version=2
Labels:       app=kuard
              version=2
Annotations:  <none>
Replicas:     1 current / 1 desired
Pods Status:  1 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
```

Bạn có thể thấy label selector cho ReplicaSet, cũng như trạng thái của tất cả các replica mà nó quản lý.

### Tìm ReplicaSet từ một Pod

Đôi khi bạn có thể tự hỏi liệu một Pod có đang được quản lý bởi một ReplicaSet không, và nếu có thì là ReplicaSet nào. Để cho phép kiểu khám phá này, ReplicaSet controller thêm một phần `ownerReferences` vào mọi Pod nó tạo ra. Nếu bạn chạy lệnh sau, hãy tìm phần `ownerReferences`:

```
$ kubectl get pods <pod-name> -o=jsonpath='{.metadata.ownerReferences[0].name}'
```

Nếu áp dụng được, lệnh này sẽ liệt kê tên của ReplicaSet đang quản lý Pod này.

### Tìm tập Pod của một ReplicaSet

Bạn cũng có thể xác định tập Pod được một ReplicaSet quản lý. Đầu tiên, lấy tập label bằng lệnh `kubectl describe`. Trong ví dụ trước, label selector là `app=kuard,version=2`. Để tìm các Pod khớp với selector này, dùng cờ `--selector` hoặc viết tắt `-l`:

```
$ kubectl get pods -l app=kuard,version=2
```

Đây chính xác là truy vấn mà ReplicaSet thực thi để xác định số Pod hiện tại.

## Mở rộng ReplicaSet

Bạn có thể mở rộng hoặc thu nhỏ ReplicaSet bằng cách cập nhật khóa `spec.replicas` trên đối tượng ReplicaSet được lưu trong Kubernetes. Khi bạn mở rộng một ReplicaSet, nó gửi các Pod mới đến Kubernetes API bằng Pod template được định nghĩa trên ReplicaSet.

### Mở rộng theo kiểu mệnh lệnh với kubectl scale

Cách dễ nhất để đạt được điều này là dùng lệnh `scale` trong `kubectl`. Ví dụ, để mở rộng lên bốn replica, bạn có thể chạy:

```
$ kubectl scale replicasets kuard --replicas=4
```

Mặc dù các lệnh mệnh lệnh như vậy hữu ích cho việc trình diễn và phản ứng nhanh với các tình huống khẩn cấp (như tải tăng đột ngột), điều quan trọng là cũng phải cập nhật mọi cấu hình file văn bản để khớp với số replica bạn đã đặt qua lệnh `scale` mệnh lệnh. Lý do cho điều này trở nên rõ ràng khi bạn xem xét kịch bản sau.

Alice đang trực ca, khi đột nhiên có sự tăng tải lớn lên service cô ấy đang quản lý. Alice dùng lệnh `scale` để tăng số server phản hồi yêu cầu lên 10, và tình huống được giải quyết. Tuy nhiên, Alice quên cập nhật các cấu hình ReplicaSet đã được đưa vào hệ thống quản lý mã nguồn.

Vài ngày sau, Bob đang chuẩn bị các đợt phát hành hằng tuần. Bob chỉnh sửa các cấu hình ReplicaSet được lưu trong hệ thống quản lý phiên bản để dùng container image mới, nhưng anh ấy không nhận thấy số replica trong file hiện là 5, không phải 10 mà Alice đã đặt để đáp ứng tải tăng. Bob tiến hành phát hành, việc này vừa cập nhật container image vừa giảm số replica đi một nửa. Điều này gây quá tải ngay lập tức, dẫn đến sự cố ngừng dịch vụ.

Nghiên cứu tình huống hư cấu này minh họa nhu cầu đảm bảo rằng mọi thay đổi mệnh lệnh phải được theo ngay sau bởi một thay đổi khai báo trong hệ thống quản lý mã nguồn. Thực tế, nếu nhu cầu không cấp bách, chúng tôi thường khuyến nghị chỉ thực hiện các thay đổi khai báo như mô tả trong phần sau.

### Mở rộng theo kiểu khai báo với kubectl apply

Trong thế giới khai báo, bạn thực hiện thay đổi bằng cách chỉnh sửa file cấu hình trong hệ thống quản lý phiên bản rồi áp dụng các thay đổi đó lên cluster. Để mở rộng ReplicaSet `kuard`, chỉnh sửa file cấu hình *kuard-rs.yaml* và đặt số `replicas` thành `3`:

```yaml
...
spec:
  replicas: 3
...
```

Trong môi trường nhiều người dùng, bạn có thể sẽ có một review code được ghi lại cho thay đổi này và cuối cùng đưa các thay đổi vào hệ thống quản lý phiên bản. Dù thế nào, sau đó bạn có thể dùng lệnh `kubectl apply` để gửi ReplicaSet `kuard` đã cập nhật đến API server:

```
$ kubectl apply -f kuard-rs.yaml
replicaset "kuard" configured
```

Giờ ReplicaSet `kuard` đã cập nhật đã có hiệu lực, ReplicaSet controller sẽ phát hiện rằng số Pod mong muốn đã thay đổi và nó cần hành động để hiện thực hóa trạng thái mong muốn đó. Nếu bạn đã dùng lệnh `scale` mệnh lệnh trong phần trước, ReplicaSet controller sẽ hủy một Pod để đưa số lượng về ba. Nếu không, nó sẽ gửi hai Pod mới đến Kubernetes API bằng Pod template được định nghĩa trên ReplicaSet `kuard`. Bất kể thế nào, dùng lệnh `kubectl get pods` để liệt kê các Pod `kuard` đang chạy. Bạn nên thấy kết quả tương tự như sau với ba Pod ở trạng thái running; hai Pod sẽ có tuổi nhỏ hơn vì chúng mới được khởi động gần đây:

```
$ kubectl get pods
NAME          READY   STATUS    RESTARTS   AGE
kuard-3a2sb   1/1     Running   0          26s
kuard-wuq9v   1/1     Running   0          26s
kuard-yvzgd   1/1     Running   0          2m
```

### Tự động mở rộng ReplicaSet

Mặc dù sẽ có những lúc bạn muốn kiểm soát tường minh số replica trong một ReplicaSet, thường thì bạn chỉ đơn giản muốn có "đủ" replica. Định nghĩa này khác nhau tùy vào nhu cầu của các container trong ReplicaSet. Ví dụ, với một web server như NGINX, bạn có thể muốn mở rộng theo mức sử dụng CPU. Với một cache trong bộ nhớ, bạn có thể muốn mở rộng theo mức tiêu thụ bộ nhớ. Trong một số trường hợp, bạn có thể muốn mở rộng để đáp ứng các chỉ số ứng dụng tùy chỉnh. Kubernetes có thể xử lý tất cả các kịch bản này thông qua Horizontal Pod Autoscaling (HPA).

"Horizontal Pod Autoscaling" khá dài dòng, và bạn có thể tự hỏi tại sao nó không đơn giản được gọi là "autoscaling". Kubernetes phân biệt giữa mở rộng theo chiều ngang (horizontal scaling), bao gồm việc tạo thêm các replica của một Pod, và mở rộng theo chiều dọc (vertical scaling), bao gồm việc tăng tài nguyên cần thiết cho một Pod cụ thể (như tăng CPU cần cho Pod). Nhiều giải pháp cũng cho phép tự động mở rộng cluster (cluster autoscaling), trong đó số máy trong cluster được mở rộng để đáp ứng nhu cầu tài nguyên, nhưng giải pháp đó nằm ngoài phạm vi của chương này.

> **LƯU Ý**
>
> Tự động mở rộng yêu cầu sự hiện diện của `metrics-server` trong cluster của bạn. `metrics-server` theo dõi các chỉ số và cung cấp một API để tiêu thụ các chỉ số mà HPA dùng khi đưa ra quyết định mở rộng. Hầu hết các bản cài đặt Kubernetes bao gồm `metrics-server` theo mặc định. Bạn có thể xác nhận sự hiện diện của nó bằng cách liệt kê các Pod trong namespace `kube-system`:
>
> ```
> $ kubectl get pods --namespace=kube-system
> ```
>
> Bạn nên thấy một Pod có tên bắt đầu bằng `metrics-server` đâu đó trong danh sách. Nếu bạn không thấy nó, tự động mở rộng sẽ không hoạt động đúng.

Mở rộng dựa trên mức sử dụng CPU là trường hợp sử dụng phổ biến nhất cho tự động mở rộng Pod. Bạn cũng có thể mở rộng dựa trên mức sử dụng bộ nhớ. Tự động mở rộng dựa trên CPU hữu ích nhất cho các hệ thống dựa trên yêu cầu tiêu thụ CPU tỷ lệ với số yêu cầu chúng nhận được, trong khi dùng một lượng bộ nhớ tương đối tĩnh.

Để mở rộng một ReplicaSet, bạn có thể chạy một lệnh như sau:

```
$ kubectl autoscale rs kuard --min=2 --max=5 --cpu-percent=80
```

Lệnh này tạo một autoscaler mở rộng giữa hai và năm replica với ngưỡng CPU là 80%. Để xem, sửa đổi hoặc xóa tài nguyên này, bạn có thể dùng các lệnh `kubectl` tiêu chuẩn và tài nguyên `horizontalpodautoscalers`. Gõ `horizontalpodautoscalers` khá dài, nhưng nó có thể được viết tắt thành `hpa`:

```
$ kubectl get hpa
```

> **CẢNH BÁO**
>
> Vì bản chất tách rời của Kubernetes, không có liên kết trực tiếp giữa HPA và ReplicaSet. Mặc dù điều này rất tốt cho tính mô-đun và khả năng kết hợp, nó cũng cho phép một số antipattern. Cụ thể, kết hợp tự động mở rộng với quản lý số replica theo kiểu mệnh lệnh hoặc khai báo là một ý tưởng tồi. Nếu cả bạn và một autoscaler đều đang cố sửa đổi số replica, rất có khả năng bạn sẽ xung đột, dẫn đến hành vi không mong đợi.

## Xóa ReplicaSet

Khi một ReplicaSet không còn cần thiết, nó có thể được xóa bằng lệnh `kubectl delete`. Theo mặc định, điều này cũng xóa các Pod được ReplicaSet quản lý:

```
$ kubectl delete rs kuard
replicaset "kuard" deleted
```

Chạy lệnh `kubectl get pods` cho thấy tất cả các Pod `kuard` được tạo bởi ReplicaSet `kuard` cũng đã bị xóa:

```
$ kubectl get pods
```

Nếu bạn không muốn xóa các Pod mà ReplicaSet đang quản lý, bạn có thể đặt cờ `--cascade` thành `false` để đảm bảo chỉ đối tượng ReplicaSet bị xóa mà không phải các Pod:

```
$ kubectl delete rs kuard --cascade=false
```

## Tóm tắt

Kết hợp Pod với ReplicaSet cung cấp nền tảng để xây dựng các ứng dụng mạnh mẽ với chuyển đổi dự phòng tự động, và làm việc triển khai các ứng dụng đó trở nên dễ dàng bằng cách cho phép các mẫu triển khai có khả năng mở rộng và hợp lý. Hãy dùng ReplicaSet cho bất kỳ Pod nào bạn quan tâm, ngay cả khi đó chỉ là một Pod duy nhất! Một số người thậm chí mặc định dùng ReplicaSet thay cho Pod. Một cluster điển hình sẽ có nhiều ReplicaSet, nên hãy áp dụng chúng rộng rãi cho khu vực bị ảnh hưởng.
